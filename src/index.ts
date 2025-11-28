#!/usr/bin/env node

/**
 * PO Translation MCP Server
 * Main entry point
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { analyzePoFile, AnalyzePoFileInput } from './tools/analyze.js';
import { validateAndUpdatePoFile, ValidateAndUpdateInput } from './tools/validate-and-update.js';

// Define MCP Tools
const TOOLS: Tool[] = [
  {
    name: 'analyze_po_file',
    description: 'Analyze a .po file and return statistics, untranslated entries, and fuzzy entries',
    inputSchema: {
      type: 'object',
      properties: {
        po_file_path: {
          type: 'string',
          description: 'Absolute path to the .po file (e.g., "/Users/name/project/locale/tr/LC_MESSAGES/django.po")'
        }
      },
      required: ['po_file_path']
    }
  },
  {
    name: 'validate_and_update_po_file',
    description: 'Validate translations AND update PO file in one operation. Validates quality (variables, HTML, URLs, JavaScript) and automatically updates the file if valid. Use force_update=true to update even invalid translations.',
    inputSchema: {
      type: 'object',
      properties: {
        po_file_path: {
          type: 'string',
          description: 'Absolute path to the .po file (e.g., "/Users/name/project/locale/tr/LC_MESSAGES/django.po")'
        },
        translations: {
          type: 'array',
          description: 'Array of translation entries to validate and update',
          items: {
            type: 'object',
            properties: {
              msgid: {
                type: 'string',
                description: 'Original text (source language)'
              },
              msgstr: {
                type: 'string',
                description: 'New translation'
              },
              context: {
                type: ['string', 'null'],
                description: 'msgctxt for disambiguation (null if not used)'
              }
            },
            required: ['msgid', 'msgstr', 'context']
          }
        },
        strict: {
          type: 'boolean',
          description: 'Enable all validation checks (variables, HTML, URLs, JavaScript). Default: true',
          default: true
        },
        dry_run: {
          type: 'boolean',
          description: 'Preview changes without writing. Default: false',
          default: false
        },
        force: {
          type: 'boolean',
          description: 'Update file even if some translations are invalid. Default: false',
          default: false
        }
      },
      required: ['po_file_path', 'translations']
    }
  }
];

// Create MCP Server
const server = new Server(
  {
    name: 'po-translation-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_po_file': {
        const input = args as unknown as AnalyzePoFileInput;
        const result = await analyzePoFile(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'validate_and_update_po_file': {
        const input = args as unknown as ValidateAndUpdateInput;
        const result = await validateAndUpdatePoFile(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error)
            },
            null,
            2
          )
        }
      ],
      isError: true
    };
  }
});

// Start Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PO Translation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
