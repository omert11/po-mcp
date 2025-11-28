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
  const shouldUpdate = validation.overall_valid || force;

  if (!shouldUpdate) {
    return {
      validation,
      update: null,
      message: `Validation failed: ${validation.summary.invalid} invalid translations found. Use force=true to update anyway.`
    };
  }

  // Step 3: Filter valid translations only (unless force)
  let translationsToUpdate = translations;
  if (!force) {
    const validMsgids = new Set(
      validation.validation_results
        .filter(r => r.valid)
        .map(r => r.msgid)
    );
    translationsToUpdate = translations.filter(t => validMsgids.has(t.msgid));
  }

  // Step 4: Update PO file
  const update = await updatePoFile({
    po_file_path,
    translations: translationsToUpdate,
    dry_run
  });

  // Generate result message
  let message = '';
  if (validation.overall_valid) {
    message = dry_run
      ? `All ${validation.summary.valid} translations valid. Would update ${update.updated_entries} entries.`
      : `Successfully validated and updated ${update.updated_entries} translations.`;
  } else if (force) {
    message = dry_run
      ? `${validation.summary.invalid} invalid translations found. Would force update ${update.updated_entries} entries.`
      : `Force updated ${update.updated_entries} translations (${validation.summary.invalid} were invalid).`;
  }

  return {
    validation,
    update,
    message
  };
}
