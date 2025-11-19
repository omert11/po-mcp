/**
 * update_po_file Tool
 *
 * Updates PO file with validated translations and generates git diffs
 */

import * as fs from 'fs';
import * as path from 'path';
import gettextParser from 'gettext-parser';
import type { TranslationEntry, UpdatePoFileResult } from '../types.js';
import { PoParser } from '../parser/po-parser.js';

interface UpdatePoFileInput {
  po_file_path: string;
  translations: TranslationEntry[];
  dry_run?: boolean;
}

/**
 * Update PO file with translations
 */
export async function updatePoFile(input: UpdatePoFileInput): Promise<UpdatePoFileResult> {
  const {
    po_file_path,
    translations,
    dry_run = false
  } = input;

  const errors: string[] = [];
  let updated_entries = 0;
  let skipped_entries = 0;

  try {
    // Check if file exists
    if (!fs.existsSync(po_file_path)) {
      throw new Error(`PO file not found: ${po_file_path}`);
    }

    // Read and parse PO file with pre-processing
    const content = fs.readFileSync(po_file_path);
    const cleanedContent = PoParser.preprocessPoContent(content.toString('utf-8'));
    const parsed = gettextParser.po.parse(Buffer.from(cleanedContent, 'utf-8'));

    // Create translation map for quick lookup
    const translationMap = new Map<string, TranslationEntry>();
    for (const translation of translations) {
      if (!translation.skipped) {
        translationMap.set(translation.msgid, translation);
      } else {
        skipped_entries++;
      }
    }

    // Update entries
    const contexts = parsed.translations || {};
    for (const contextKey of Object.keys(contexts)) {
      const context = contexts[contextKey];
      for (const msgidKey of Object.keys(context)) {
        if (msgidKey === '') continue; // Skip header

        const entry = context[msgidKey] as any;
        // Use msgidKey directly as it's the actual msgid string from gettext-parser
        const msgid = msgidKey;

        if (translationMap.has(msgid)) {
          const translation = translationMap.get(msgid)!;

          // Update msgstr
          entry.msgstr = [translation.msgstr_translated];

          // Remove fuzzy flag if present
          if (entry.comments && entry.comments.flag) {
            entry.comments.flag = entry.comments.flag.replace(/,?\s*fuzzy\s*,?/g, '').trim();
          }

          updated_entries++;
        }
      }
    }

    // Compile back to PO format
    const newContent = gettextParser.po.compile(parsed).toString('utf-8');

    // Write file (unless dry run)
    if (!dry_run) {
      fs.writeFileSync(po_file_path, newContent, 'utf-8');
    }

    return {
      success: true,
      updated_entries,
      skipped_entries,
      file_path: po_file_path,
      git_diff_preview: dry_run ? `${updated_entries} entries would be updated` : `${updated_entries} entries updated`,
      errors
    };

  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return {
      success: false,
      updated_entries: 0,
      skipped_entries: 0,
      file_path: po_file_path,
      git_diff_preview: '',
      errors
    };
  }
}
