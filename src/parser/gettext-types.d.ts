/**
 * Type definitions for gettext-parser
 */

declare module 'gettext-parser' {
  interface ParsedEntry {
    msgid: string;
    msgstr: string[];
    msgctxt?: string;
    comments?: {
      reference?: string;
      flag?: string;
    };
  }

  interface ParsedTranslations {
    [msgid: string]: ParsedEntry;
  }

  interface ParsedPo {
    charset: string;
    headers: Record<string, string>;
    translations: {
      [context: string]: ParsedTranslations;
    };
  }

  export const po: {
    parse(buffer: Buffer, encoding?: string): ParsedPo;
    compile(data: ParsedPo, options?: any): Buffer;
  };

  export const mo: {
    parse(buffer: Buffer, encoding?: string): ParsedPo;
    compile(data: ParsedPo, options?: any): Buffer;
  };
}
