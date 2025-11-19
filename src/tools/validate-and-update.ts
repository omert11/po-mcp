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
  strict_mode?: boolean;
  check_variables?: boolean;
  check_html?: boolean;
  check_urls?: boolean;
  check_javascript?: boolean;
  check_length?: boolean;
  dry_run?: boolean;
  force_update?: boolean; // Update even if some translations are invalid
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
    strict_mode = true,
    check_variables = true,
    check_html = true,
    check_urls = true,
    check_javascript = true,
    check_length = false,
    dry_run = false,
    force_update = false
  } = input;

  // Step 1: Validate translations
  const validation = await validateTranslations({
    translations,
    strict_mode,
    check_variables,
    check_html,
    check_urls,
    check_javascript,
    check_length
  });

  // Step 2: Decide whether to update
  const shouldUpdate = validation.overall_valid || force_update;

  if (!shouldUpdate) {
    return {
      validation,
      update: null,
      message: `Validation failed: ${validation.summary.invalid} invalid translations found. Use force_update=true to update anyway.`
    };
  }

  // Step 3: Filter valid translations only (unless force_update)
  let translationsToUpdate = translations;
  if (!force_update) {
    const validMsgids = new Set(
      validation.validation_results
        .filter(r => r.valid)
        .map(r => r.msgid)
    );
    translationsToUpdate = translations.filter(t =>
      t.skipped || validMsgids.has(t.msgid)
    );
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
      ? `✅ All ${validation.summary.valid} translations valid. Would update ${update.updated_entries} entries.`
      : `✅ Successfully validated and updated ${update.updated_entries} translations.`;
  } else if (force_update) {
    message = dry_run
      ? `⚠️ ${validation.summary.invalid} invalid translations found. Would force update ${update.updated_entries} entries.`
      : `⚠️ Force updated ${update.updated_entries} translations (${validation.summary.invalid} were invalid).`;
  }

  return {
    validation,
    update,
    message
  };
}
