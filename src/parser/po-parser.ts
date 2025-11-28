/**
 * PO file parser using gettext-parser
 */

import gettextParser from 'gettext-parser';
import { readFileSync } from 'fs';
import { PoEntry, PoStatistics } from '../types.js';

export class PoParser {
  /**
   * Parse a .po file and extract entries with line numbers
   */
  static parse(filePath: string): {
    entries: PoEntry[];
    statistics: PoStatistics;
    headers: Record<string, string>;
  } {
    try {
      const content = readFileSync(filePath);

      // Pre-process content to handle obsolete fuzzy entries with previous msgid
      const cleanedContent = this.preprocessPoContent(content.toString('utf-8'));

      const parsed = gettextParser.po.parse(Buffer.from(cleanedContent, 'utf-8'));

      // Build line number map by parsing raw text
      const lineMap = this.buildLineNumberMap(content.toString('utf-8'));

      const entries: PoEntry[] = [];
      const translations = parsed.translations[''] || {};

      let translated = 0;
      let untranslated = 0;
      let fuzzy = 0;

      // Extract entries
      for (const [msgid, rawEntry] of Object.entries(translations)) {
        if (!msgid) continue; // Skip header entry

        // Type assertion for entry
        const entry = rawEntry as any;

        const isFuzzy = entry.comments?.flag?.includes('fuzzy') || false;
        const isEmpty = !entry.msgstr || entry.msgstr[0] === '';

        // Build references
        const references = entry.comments?.reference || '';

        // Find line number for this msgid
        const lineNumber = lineMap.get(msgid) || null;

        const poEntry: PoEntry = {
          msgid: msgid,
          msgstr: entry.msgstr ? entry.msgstr[0] : '',
          context: entry.msgctxt || null
        };

        // Store with internal fuzzy flag for filtering
        (poEntry as any)._fuzzy = isFuzzy;
        entries.push(poEntry);

        // Update statistics
        if (isFuzzy) {
          fuzzy++;
        } else if (isEmpty) {
          untranslated++;
        } else {
          translated++;
        }
      }

      const statistics: PoStatistics = {
        translated,
        untranslated,
        fuzzy,
        total: entries.length
      };

      return {
        entries,
        statistics,
        headers: parsed.headers || {}
      };
    } catch (error) {
      throw new Error(`Failed to parse PO file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract untranslated entries (empty msgstr, not fuzzy)
   */
  static getUntranslatedEntries(entries: PoEntry[]): PoEntry[] {
    return entries
      .filter(entry => entry.msgstr === '' && !(entry as any)._fuzzy)
      .map(({ msgid, msgstr, context }) => ({ msgid, msgstr, context })); // Strip internal flags
  }

  /**
   * Extract fuzzy entries
   */
  static getFuzzyEntries(entries: PoEntry[]): PoEntry[] {
    return entries
      .filter(entry => (entry as any)._fuzzy)
      .map(({ msgid, msgstr, context }) => ({ msgid, msgstr, context })); // Strip internal flags
  }

  /**
   * Pre-process PO content to handle problematic combinations like #~| (obsolete with previous msgid)
   * This prevents parser errors while preserving the original content structure
   * PUBLIC: Also used by update tool
   */
  static preprocessPoContent(content: string): string {
    const lines = content.split('\n');
    const cleanedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip obsolete previous msgid/msgstr lines (#~|)
      // These can cause parser errors in some gettext-parser versions
      if (trimmedLine.startsWith('#~|')) {
        // Skip this line - it's obsolete metadata
        continue;
      }

      cleanedLines.push(line);
    }

    return cleanedLines.join('\n');
  }

  /**
   * Build a map of msgid -> line number by parsing raw PO content
   */
  private static buildLineNumberMap(content: string): Map<string, number> {
    const lineMap = new Map<string, number>();
    const lines = content.split('\n');

    let currentMsgid: string | null = null;
    let msgidStartLine: number | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1; // 1-indexed

      // Detect msgid line
      if (line.startsWith('msgid ')) {
        // Extract msgid content
        const match = line.match(/^msgid\s+"(.*)"/);
        if (match) {
          currentMsgid = match[1];
          msgidStartLine = lineNumber;
        }
      }
      // Handle multiline msgid (continuation)
      else if (currentMsgid !== null && line.startsWith('"') && !line.startsWith('msgstr')) {
        const match = line.match(/^"(.*)"/);
        if (match) {
          currentMsgid += match[1];
        }
      }
      // When we hit msgstr, save the msgid with its line number
      else if (line.startsWith('msgstr') && currentMsgid !== null && msgidStartLine !== null) {
        // Unescape the msgid for matching with parsed data
        const unescapedMsgid = this.unescapeString(currentMsgid);
        lineMap.set(unescapedMsgid, msgidStartLine);
        currentMsgid = null;
        msgidStartLine = null;
      }
    }

    return lineMap;
  }

  /**
   * Unescape PO file string escapes (\n, \t, \", etc.)
   */
  private static unescapeString(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Validate PO file format
   */
  static validateFormat(filePath: string): { valid: boolean; error?: string } {
    try {
      const content = readFileSync(filePath);
      gettextParser.po.parse(content);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
