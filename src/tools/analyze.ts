/**
 * analyze_po_file Tool
 * Analyzes .po file and returns statistics + untranslated/fuzzy entries
 */

import { PoParser } from '../parser/po-parser.js';
import { PoEntry, PoStatistics } from '../types.js';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

export interface AnalyzePoFileInput {
  po_file_path: string;
}

export interface AnalyzePoFileOutput {
  file_path: string;
  statistics: PoStatistics;
  untranslated_entries: PoEntry[];
  fuzzy_entries: PoEntry[];
}

export async function analyzePoFile(input: AnalyzePoFileInput): Promise<AnalyzePoFileOutput> {
  const { po_file_path } = input;

  // Validate file exists
  const absolutePath = resolve(po_file_path);
  if (!existsSync(absolutePath)) {
    throw new Error(`PO file not found: ${absolutePath}`);
  }

  // Validate it's a file, not directory
  const stats = statSync(absolutePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${absolutePath}`);
  }

  // Parse PO file
  const { entries, statistics } = PoParser.parse(absolutePath);

  // Extract untranslated and fuzzy entries
  const untranslated_entries = PoParser.getUntranslatedEntries(entries);
  const fuzzy_entries = PoParser.getFuzzyEntries(entries);

  return {
    file_path: absolutePath,
    statistics,
    untranslated_entries,
    fuzzy_entries
  };
}
