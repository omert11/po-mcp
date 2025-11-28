/**
 * Common types for PO Translation MCP Server
 */

export interface PoEntry {
  msgid: string;
  msgstr: string;
  context: string | null;  // msgctxt - for disambiguation when same msgid has different meanings
}

export interface PoStatistics {
  translated: number;
  untranslated: number;
  fuzzy: number;
  total: number;
}

export interface TranslationEntry {
  msgid: string;
  msgstr: string;  // New translation
  context: string | null;  // msgctxt - for disambiguation
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
  file_path: string;
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
