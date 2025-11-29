# PO Translation MCP Server

MCP server for translating Django gettext `.po` files with AI assistance.

## Features

- **analyze_po_file**: Analyze .po files, get statistics and untranslated/fuzzy entries
- **validate_and_update_po_file**: Validate and update translations in one operation
- **Smart Validation**: Variables, HTML, URLs, JavaScript preservation checks

## Installation

```bash
npm install
npm run build
```

## Claude Code Configuration

```json
{
  "mcpServers": {
    "po-mcp": {
      "command": "node",
      "args": ["/path/to/po-mcp/dist/index.js"]
    }
  }
}
```

## Tools

### analyze_po_file

Analyze a .po file and get translation status.

**Input:**
```json
{
  "po_file_path": "/absolute/path/to/locale/tr/LC_MESSAGES/django.po"
}
```

**Output:**
```json
{
  "file_path": "/absolute/path/to/django.po",
  "statistics": {
    "translated": 2876,
    "untranslated": 2,
    "fuzzy": 0,
    "total": 2878
  },
  "untranslated_entries": [
    {
      "msgid": "Departure Place ID",
      "msgstr": "",
      "context": null
    }
  ],
  "fuzzy_entries": []
}
```

### validate_and_update_po_file

Validate translations and update the PO file.

**Input:**
```json
{
  "po_file_path": "/absolute/path/to/locale/tr/LC_MESSAGES/django.po",
  "translations": [
    {
      "msgid": "Departure Place ID",
      "msgstr": "Kalkis Yeri ID",
      "context": null
    }
  ],
  "strict": true,
  "dry_run": false,
  "force": false
}
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `po_file_path` | string | required | Absolute path to .po file |
| `translations` | array | required | Translation entries |
| `strict` | boolean | true | Enable all validation checks |
| `dry_run` | boolean | false | Preview without writing |
| `force` | boolean | false | Update even if invalid |

**Output:**
```json
{
  "validation": {
    "invalids": [],
    "total": 1,
    "valid": true
  },
  "update": {
    "success": true,
    "updated_entries": 1,
    "file_path": "/absolute/path/to/django.po",
    "errors": []
  },
  "message": "Updated 1 translations."
}
```

## Data Structure

Both tools use the same minimal entry format:

```typescript
{
  msgid: string;      // Original text
  msgstr: string;     // Translation
  context: string | null;  // msgctxt (for disambiguation)
}
```

## Workflow

```
1. analyze_po_file
   └── Get untranslated/fuzzy entries

2. AI translates (Claude)
   └── msgstr filled with translations

3. validate_and_update_po_file
   └── Validate & write to file
```

## Validation Checks (strict: true)

- **Variables**: `%(name)s`, `{0}`, `{name}`, `{{ var }}`
- **HTML**: `<tag>`, `</tag>`, `<tag attr="value">`
- **URLs**: `https://...`, `www....`
- **JavaScript**: `console.log()`, `module.method()`

## Project Structure

```
po-mcp/
├── src/
│   ├── index.ts          # MCP server
│   ├── types.ts          # Type definitions
│   ├── tools/
│   │   ├── analyze.ts
│   │   ├── validate.ts
│   │   ├── update.ts
│   │   └── validate-and-update.ts
│   └── parser/
│       └── po-parser.ts
├── dist/                  # Compiled JS
└── package.json
```

## Development

```bash
npm run build    # Build
npm run watch    # Watch mode
```

## License

MIT
