/**
 * Common types for PO Translation MCP Server
 */

export interface PoEntry {
  msgid: string;
  msgstr: string;
  reference: string;
  line_number: number | null;  // Line number in .po file (helps AI locate entry)
  context: string | null;
  flags: string[];
}

export interface PoStatistics {
  translated: number;
  untranslated: number;
  fuzzy: number;
  total: number;
}

export interface TranslationEntry {
  msgid: string;
  msgstr_original: string;
  msgstr_translated: string;
  line_number: number | null;  // Line number in source .po file
  reference: string;  // Source code reference (file:line)
  skipped: boolean;
  skip_reason: string | null;
}

export interface ValidationResult {
  msgid: string;
  msgstr: string;
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export interface PreservePatterns {
  python_format: RegExp;
  python_old_style: RegExp;
  positional: RegExp;
  django_var: RegExp;
  django_tag: RegExp;
  html_tag: RegExp;
  url: RegExp;
  url_with_protocol: RegExp;
  js_function: RegExp;
  js_event: RegExp;
  js_inline: RegExp;
  bracket: RegExp;
}

export interface UpdatePoFileResult {
  success: boolean;
  updated_entries: number;
  skipped_entries: number;
  file_path: string;
  git_diff_preview: string;
  errors: string[];
}

export interface DjangoCommandResult {
  success: boolean;
  commands_executed: string[];
  output: {
    makemessages?: {
      default?: string;
      djangojs?: string;
      djangof7?: string;
    };
    compilemessages?: string;
  };
  po_files_updated: string[];
  mo_files_created: string[];
  errors: string[];
}
