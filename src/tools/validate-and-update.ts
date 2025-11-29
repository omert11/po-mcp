/**
 * validate_and_update_po_file Tool
 *
 * Combines validation and update operations:
 * 1. Validates translations (variables, HTML, URLs, JS)
 * 2. If all valid, updates the PO file
 * 3. Returns both validation results and update status
 */

import { validateTranslations, ValidateTranslationsInput, ValidateTranslationsOutput } from './validate.js';
import { updatePoFile } from './update.js';
import type { TranslationEntry, UpdatePoFileResult } from '../types.js';

export interface ValidateAndUpdateInput {
  po_file_path: string;
  translations: TranslationEntry[];
  strict?: boolean;   // Enable all validation checks (default: true)
  dry_run?: boolean;  // Preview changes without writing (default: false)
  force?: boolean;    // Update even if some translations are invalid (default: false)
}

export interface ValidateAndUpdateOutput {
  validation: ValidateTranslationsOutput;
  update: UpdatePoFileResult | null;
  message: string;
}

export async function validateAndUpdatePoFile(
  input: ValidateAndUpdateInput
): Promise<ValidateAndUpdateOutput> {
  const {
    po_file_path,
    translations,
    strict = true,
    dry_run = false,
    force = false
  } = input;

  // Step 1: Validate translations
  const validation = await validateTranslations({
    translations,
    strict
  });

  // Step 2: Decide whether to update
  const shouldUpdate = validation.valid || force;

  if (!shouldUpdate) {
    return {
      validation,
      update: null,
      message: `Validation failed: ${validation.invalids.length} invalid. Use force=true to update anyway.`
    };
  }

  // Step 3: Filter valid translations only (unless force)
  let translationsToUpdate = translations;
  if (!force && validation.invalids.length > 0) {
    const invalidMsgids = new Set(validation.invalids.map(r => r.msgid));
    translationsToUpdate = translations.filter(t => !invalidMsgids.has(t.msgid));
  }

  // Step 4: Update PO file
  const update = await updatePoFile({
    po_file_path,
    translations: translationsToUpdate,
    dry_run
  });

  // Generate result message
  let message = '';
  if (validation.valid) {
    message = dry_run
      ? `All ${validation.total} valid. Would update ${update.updated_entries} entries.`
      : `Updated ${update.updated_entries} translations.`;
  } else if (force) {
    message = dry_run
      ? `${validation.invalids.length} invalid. Would force update ${update.updated_entries} entries.`
      : `Force updated ${update.updated_entries} (${validation.invalids.length} were invalid).`;
  }

  return {
    validation,
    update,
    message
  };
}
