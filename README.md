# PO Translation MCP Server

MCP server for translating Django gettext `.po` files with AI assistance, featuring intelligent preservation of variables, HTML tags, URLs, and JavaScript code.

## ✨ Features

- ✅ **analyze_po_file**: Analyze .po files with statistics and line numbers
- ✅ **validate_and_update_po_file**: Combined validation + update in one operation
- 🤖 **Claude-Powered Translation**: Leverages Claude's native translation capabilities
- 🔄 **Variable Preservation**: Python format strings, Django templates
- 🏷️ **HTML Preservation**: Keep all HTML tags intact
- 🌐 **URL Preservation**: URLs never get translated
- 💻 **JavaScript Preservation**: Smart code detection (not natural language patterns)
- 📍 **Line Number Tracking**: AI can locate entries precisely in source files

## 🚀 Installation

```bash
npm install
npm run build
```

## 📖 Usage with Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "po-translation": {
      "command": "node",
      "args": ["/path/to/po-mcp/dist/index.js"]
    }
  }
}
```

## 🔧 MCP Tools

### 1. analyze_po_file

Analyze a .po file and get translation statistics with line numbers:

```typescript
{
  "po_file_path": "/absolute/path/to/locale/tr/LC_MESSAGES/django.po"
}
```

**Output:**
```json
{
  "statistics": {
    "translated": 2876,
    "untranslated": 0,
    "fuzzy": 2,
    "total": 2878
  },
  "untranslated_entries": [],
  "fuzzy_entries": [
    {
      "msgid": "Departure Place ID",
      "msgstr": "Kalkış Tarihi",
      "reference": "transfer/models/booking/option.py:46",
      "line_number": 12941,
      "context": null,
      "flags": ["fuzzy"]
    }
  ],
  "file_info": {
    "path": "/absolute/path/to/django.po",
    "locale": "tr",
    "last_modified": "2025-10-20T15:18:10.591Z"
  }
}
```

### 2. validate_and_update_po_file

**Combined validation and update in one operation** - validates translations and automatically updates the PO file if valid:

```typescript
{
  "po_file_path": "/absolute/path/to/locale/tr/LC_MESSAGES/django.po",
  "translations": [
    {
      "msgid": "Optional Reservation (No Payment)",
      "msgstr_original": "",
      "msgstr_translated": "Opsiyonel Rezervasyon (Ödemesiz)",
      "line_number": 2767,
      "reference": "models.py:123",
      "skipped": false,
      "skip_reason": null
    }
  ],
  "strict_mode": true,
  "check_variables": true,
  "check_html": true,
  "check_urls": true,
  "check_javascript": true,
  "check_length": false,
  "dry_run": false,
  "force_update": false
}
```

**Output:**
```json
{
  "validation": {
    "validation_results": [
      {
        "msgid": "Optional Reservation (No Payment)",
        "msgstr": "Opsiyonel Rezervasyon (Ödemesiz)",
        "valid": true,
        "issues": [],
        "warnings": []
      }
    ],
    "summary": {
      "total": 1,
      "valid": 1,
      "invalid": 0,
      "has_warnings": 0
    },
    "overall_valid": true
  },
  "update": {
    "success": true,
    "updated_entries": 1,
    "skipped_entries": 0,
    "file_path": "/absolute/path/to/django.po",
    "git_diff_preview": "1 entries updated",
    "errors": []
  },
  "message": "✅ Successfully validated and updated 1 translations."
}
```

**Options:**
- `dry_run: true` - Preview changes without writing
- `force_update: true` - Update even if some translations are invalid
- `strict_mode: true` - Treat warnings as errors

## 🔄 Complete Translation Workflow

### With Claude Code

```bash
# 1. Analyze: Check what needs translation
analyze_po_file({
  po_file_path: "/absolute/path/to/locale/tr/LC_MESSAGES/django.po"
})
# → Returns untranslated/fuzzy entries with line numbers

# 2. Translate: Claude translates the entries natively
# Claude receives the msgid entries and translates them directly
# (No separate translate_entries tool needed - Claude does this)

# Example conversation:
# User: "Translate these 3 untranslated entries to Turkish"
# Claude:
#   1. "Intermediate Stops" → "Ara Duraklar"
#   2. "No intermediate stops" → "Ara durak yok"
#   3. "Click 'Trip Details' to see stops" → "Durakları görmek için 'Sefer Detayları'na tıklayın"

# 3. Validate & Update: One operation validates and updates
validate_and_update_po_file({
  po_file_path: "/absolute/path/to/locale/tr/LC_MESSAGES/django.po",
  translations: [
    {
      "msgid": "Intermediate Stops",
      "msgstr_original": "",
      "msgstr_translated": "Ara Duraklar",
      "line_number": 2767,
      "reference": "models.py:123",
      "skipped": false,
      "skip_reason": null
    }
  ],
  dry_run: false  // Set to true to preview first
})
# → Validates quality + updates PO file in one step
```

### Why No translate_entries Tool?

This MCP server leverages **Claude's native translation capabilities**. Instead of implementing a separate translation API:

1. **analyze_po_file** finds entries that need translation
2. **Claude** translates them directly using its language understanding
3. **validate_and_update_po_file** ensures quality (variables, HTML, URLs preserved) AND updates the file

This approach is:
- ✅ **More accurate**: Claude understands context better than machine translation
- ✅ **Simpler**: No API keys or external services needed
- ✅ **Flexible**: Claude can handle edge cases and ask for clarification
- ✅ **Cost-effective**: No separate translation API costs
- ✅ **Efficient**: Combined validation + update in one step

## 🧪 Testing

```bash
# Test analyzer with line numbers
node test-analyzer.js

# Test pattern protection (variables, HTML, URLs, JS)
node test-protector.js
```

**Test Output:**
```bash
📊 Statistics:
  Total: 2878
  Translated: 2876
  Untranslated: 0
  Fuzzy: 2

⚠️  Fuzzy Entries:
  1. "Departure Place ID"
     Current: "Kalkış Tarihi"
     Line: 12941 | Reference: transfer/models/booking/option.py:46

✅ Test passed!
```

## 🛡️ Pattern Preservation

The server preserves **12+ pattern types**:

**Python Variables:**
- `%(name)s` - Python old-style format
- `{0}`, `{variable}` - Python format strings
- `{{ variable }}` - Django template variables

**Django Tags:**
- `{% tag %}` - Django template tags
- `{# comment #}` - Django comments

**HTML Tags:**
- `<tag>`, `</tag>` - Opening/closing tags
- `<tag attr="value">` - Tags with attributes

**URLs:**
- `https://example.com` - Full URLs with protocol
- `www.example.com` - URLs without protocol
- `/path/to/resource` - Relative URLs

**JavaScript Code (Smart Detection):**
- `console.log("text")` - String parameters
- `module.method()` - Dot notation calls
- `getData('value')` - Quote-containing parameters
- ❌ NOT `Reservation (No Payment)` - Natural language (false positives avoided)

## 📁 Project Structure

```
po-mcp/
├── src/
│   ├── index.ts                    # MCP server entry point (2 tools)
│   ├── types.ts                    # TypeScript interfaces
│   ├── tools/
│   │   ├── analyze.ts              # analyze_po_file tool
│   │   ├── validate-and-update.ts  # validate_and_update_po_file tool
│   │   ├── validate.ts             # Internal validation logic
│   │   └── update.ts               # Internal update logic
│   └── parser/
│       ├── po-parser.ts            # PO parsing with line numbers
│       └── gettext-types.d.ts      # Custom type definitions
├── dist/                           # Compiled JavaScript
├── locale/                         # Test PO files
├── test-analyzer.js                # Analyzer test script
├── package.json
├── tsconfig.json
└── README.md                       # This file
```

## 💻 Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Development mode
npm run dev
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "gettext-parser": "^8.0.0",
    "glob": "^10.3.0"
  }
}
```

## ✅ Implementation Status

**Completed Tools:**
- ✅ analyze_po_file (with line number tracking)
- ✅ validate_and_update_po_file (combined validation + update)

**Key Improvements:**
- ✅ Fixed JavaScript pattern detection (no false positives on natural language)
- ✅ Simplified API: 2 tools instead of 4
- ✅ One-step workflow: validate + update in single operation

**Test Status:**
- ✅ Build: No errors
- ✅ analyze_po_file: Tested with 2878 entries
- ✅ Pattern detection: Smart JS detection working
- ✅ Line number tracking: Accurate line mapping

**Ready for:** Production use with Claude Code

## 📊 Statistics

- **Total Files:** 8 TypeScript source files
- **MCP Tools:** 2 (analyze + validate_and_update)
- **Pattern Types:** 12+ preserved (smart JS detection)
- **Build Status:** ✅ Success

## 🙏 License

MIT
