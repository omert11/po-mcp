# JSON Schema Fix for PO Translation MCP

## Problem
Claude Code couldn't use `validate_translations` and `update_po_file` tools without reading source code because the `translations` array schema was incomplete.

**Before (broken):**
```json
{
  "translations": {
    "type": "array",
    "description": "Array of translation entries from translate_entries"
  }
}
```

**Error:** `Cannot read properties of undefined (reading 'match')`

## Root Cause
The tool expected `TranslationEntry` objects with specific fields:
- `msgstr_translated` (not `msgstr`)
- `msgstr_original`
- `variables_preserved`, `html_tags_preserved`, etc.
- `confidence`, `skipped`, `skip_reason`

Without proper schema, Claude Code had to guess the structure → failed.

## Solution
Added complete JSON Schema with `items` definition for both tools:

**After (fixed) - src/index.ts:48-122:**
```typescript
translations: {
  type: 'array',
  description: 'Array of translation entries to validate',
  items: {
    type: 'object',
    properties: {
      msgid: { type: 'string', description: '...' },
      msgstr_original: { type: 'string', description: '...' },
      msgstr_translated: { type: 'string', description: '...' },
      line_number: { type: ['number', 'null'], description: '...' },
      reference: { type: 'string', description: '...' },
      variables_preserved: { type: 'array', items: { type: 'string' }, description: '...' },
      html_tags_preserved: { type: 'array', items: { type: 'string' }, description: '...' },
      urls_preserved: { type: 'array', items: { type: 'string' }, description: '...' },
      js_code_preserved: { type: 'array', items: { type: 'string' }, description: '...' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: '...' },
      skipped: { type: 'boolean', description: '...' },
      skip_reason: { type: ['string', 'null'], description: '...' }
    },
    required: ['msgid', 'msgstr_original', 'msgstr_translated', ...]
  }
}
```

## Impact
- ✅ Claude Code can now use tools without reading source code
- ✅ Proper autocomplete/validation in MCP clients
- ✅ Clear error messages for missing fields
- ✅ Self-documenting API

## Files Modified
- src/index.ts:48-122 (validate_translations schema)
- src/index.ts:168-242 (update_po_file schema)

## Testing
Build successful with `npm run build`
