/**
 * validate_translations Tool
 * Validates translation quality (variables, HTML, URLs, JS, format)
 */

import { TranslationEntry, ValidationResult } from '../types.js';

/**
 * Pattern extraction for validation
 */
interface ExtractedPatterns {
  variables: string[];
  htmlTags: string[];
  urls: string[];
  jsCodes: string[];
}

function extractPatterns(text: string): ExtractedPatterns {
  const variables: string[] = [];
  const htmlTags: string[] = [];
  const urls: string[] = [];
  const jsCodes: string[] = [];

  // Python old-style: %(name)s
  const pythonOldStyle = text.match(/%\([^)]+\)[diouxXeEfFgGcrs]/g);
  if (pythonOldStyle) variables.push(...pythonOldStyle);

  // Python format: {0}, {name}
  const pythonFormat = text.match(/\{[^}]*\}/g);
  if (pythonFormat) variables.push(...pythonFormat);

  // Django template variables: {{ variable }}
  const djangoVars = text.match(/\{\{[^}]+\}\}/g);
  if (djangoVars) variables.push(...djangoVars);

  // Django template tags: {% tag %}
  const djangoTags = text.match(/\{%[^%]+%\}/g);
  if (djangoTags) variables.push(...djangoTags);

  // HTML tags
  const htmlMatches = text.match(/<[^>]+>/g);
  if (htmlMatches) htmlTags.push(...htmlMatches);

  // URLs
  const urlMatches = text.match(/https?:\/\/[^\s<>"]+|www\.[^\s<>"]+/g);
  if (urlMatches) urls.push(...urlMatches);

  // JavaScript code detection (only code-like patterns, not natural language)
  // Match: function calls with typical JS patterns like camelCase, snake_case, dots, or quotes
  // Exclude: natural language patterns like "Word (Description)"
  const jsMatches = text.match(/(?:[a-z_$][\w$]*\.)*[a-z_$][\w$]*\s*\([^)]*['"`]|(?:[a-z_$][\w$]*\.)+[a-z_$][\w$]*\s*\([^)]*\)/gi);
  if (jsMatches) jsCodes.push(...jsMatches);

  return {
    variables: [...new Set(variables)],
    htmlTags: [...new Set(htmlTags)],
    urls: [...new Set(urls)],
    jsCodes: [...new Set(jsCodes)]
  };
}

export interface ValidateTranslationsInput {
  translations: TranslationEntry[];
  strict: boolean;  // Enable all validation checks
}

export interface ValidateTranslationsOutput {
  validation_results: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    has_warnings: number;
  };
  overall_valid: boolean;
}

export async function validateTranslations(
  input: ValidateTranslationsInput
): Promise<ValidateTranslationsOutput> {
  const { translations, strict } = input;

  // When strict=true, all checks are enabled
  const check_variables = strict;
  const check_html = strict;
  const check_urls = strict;
  const check_javascript = strict;
  const check_length = false; // Length check always disabled (too noisy)

  const validation_results: ValidationResult[] = [];
  let valid_count = 0;
  let invalid_count = 0;
  let warnings_count = 0;

  for (const translation of translations) {
    const issues: string[] = [];
    const warnings: string[] = [];

    const msgid = translation.msgid;
    const msgstr = translation.msgstr;

    // Extract patterns from source and translation
    const sourcePatterns = extractPatterns(msgid);
    const translationPatterns = extractPatterns(msgstr);

    // Check variables
    if (check_variables) {
      const sourceVars = sourcePatterns.variables;
      const translationVars = translationPatterns.variables;

      const missingVars = sourceVars.filter((v: string) => !translationVars.includes(v));
      const extraVars = translationVars.filter((v: string) => !sourceVars.includes(v));

      if (missingVars.length > 0) {
        issues.push(`Missing variables: ${missingVars.join(', ')}`);
      }
      if (extraVars.length > 0) {
        issues.push(`Extra variables: ${extraVars.join(', ')}`);
      }
    }

    // Check HTML tags
    if (check_html) {
      const sourceHtml = sourcePatterns.htmlTags;
      const translationHtml = translationPatterns.htmlTags;

      const missingHtml = sourceHtml.filter((h: string) => !translationHtml.includes(h));
      const extraHtml = translationHtml.filter((h: string) => !sourceHtml.includes(h));

      if (missingHtml.length > 0) {
        issues.push(`Missing HTML tags: ${missingHtml.join(', ')}`);
      }
      if (extraHtml.length > 0) {
        issues.push(`Extra HTML tags: ${extraHtml.join(', ')}`);
      }
    }

    // Check URLs
    if (check_urls) {
      const sourceUrls = sourcePatterns.urls;
      const translationUrls = translationPatterns.urls;

      // URLs should be EXACTLY the same
      for (const url of sourceUrls) {
        if (!translationUrls.includes(url)) {
          issues.push(`URL changed or missing: ${url}`);
        }
      }

      for (const url of translationUrls) {
        if (!sourceUrls.includes(url)) {
          issues.push(`Unexpected new URL: ${url}`);
        }
      }
    }

    // Check JavaScript
    if (check_javascript) {
      const sourceJs = sourcePatterns.jsCodes;
      const translationJs = translationPatterns.jsCodes;

      // JavaScript code should be EXACTLY the same
      for (const js of sourceJs) {
        if (!translationJs.includes(js)) {
          issues.push(`JavaScript code changed or missing: ${js}`);
        }
      }

      for (const js of translationJs) {
        if (!sourceJs.includes(js)) {
          issues.push(`Unexpected new JavaScript code: ${js}`);
        }
      }
    }

    // Check length (optional - usually not strict)
    if (check_length) {
      const lengthRatio = msgstr.length / msgid.length;
      if (lengthRatio > 3 || lengthRatio < 0.3) {
        warnings.push(
          `Translation length significantly different (ratio: ${lengthRatio.toFixed(2)})`
        );
      }
    }

    // Empty translation check
    if (!msgstr || msgstr.trim() === '') {
      issues.push('Translation is empty');
    }

    // Determine validity
    const is_valid = issues.length === 0;
    const has_warnings = warnings.length > 0;

    if (is_valid) {
      valid_count++;
    } else {
      invalid_count++;
    }

    if (has_warnings) {
      warnings_count++;
    }

    // In strict mode, warnings become issues
    if (strict && has_warnings) {
      issues.push(...warnings);
    }

    validation_results.push({
      msgid,
      msgstr,
      valid: strict ? (is_valid && !has_warnings) : is_valid,
      issues,
      warnings: strict ? [] : warnings
    });
  }

  const overall_valid = invalid_count === 0 && (!strict || warnings_count === 0);

  return {
    validation_results,
    summary: {
      total: translations.length,
      valid: valid_count,
      invalid: invalid_count,
      has_warnings: warnings_count
    },
    overall_valid
  };
}
