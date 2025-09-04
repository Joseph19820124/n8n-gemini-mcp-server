#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/gemini-image-gen';
const DEBUG = process.env.DEBUG === 'true';

/**
 * N8N Gemini MCP Server
 * 
 * This MCP server integrates Claude Desktop with N8N workflows
 * for AI-powered image generation using Google's Imagen API.
 */
class N8nGeminiMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'n8n-gemini-image',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
      if (DEBUG) {
        console.error('[MCP Error Stack]', error.stack);
      }
    };
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.error('[MCP Server] Shutting down...');
      await this.server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.error('[MCP Server] Shutting down...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up tool handlers for the MCP server
   */
  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (DEBUG) {
        console.error('[MCP Server] Listing available tools');
      }
      
      return {
        tools: [
          {
            name: 'generate_image_with_gemini',
            description: 'Generate or transform images using Google Imagen API through N8N workflow. Accepts a base64 encoded image and a text prompt to create modified versions.',
            inputSchema: {
              type: 'object',
              properties: {
                image_base64: {
                  type: 'string',
                  description: 'Base64 encoded input image (JPEG, PNG, WebP supported). The image will be used as reference for generation.',
                },
                prompt: {
                  type: 'string',
                  description: 'Descriptive text prompt for image generation. Be specific about desired style, colors, mood, or transformations.',
                },
              },
              required: ['image_base64', 'prompt'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (DEBUG) {
        console.error(`[MCP Server] Tool called: ${name}`);
        console.error(`[MCP Server] Arguments:`, {
          image_length: args.image_base64?.length || 0,
          prompt: args.prompt
        });
      }

      if (name !== 'generate_image_with_gemini') {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Validate input parameters
      if (!args.image_base64 || !args.prompt) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Both image_base64 and prompt are required parameters.',
            },
          ],
          isError: true,
        };
      }

      // Validate base64 format
      if (!this.isValidBase64(args.image_base64)) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Invalid base64 image format. Please provide a valid base64 encoded image.',
            },
          ],
          isError: true,
        };
      }

      try {
        console.error('[MCP Server] Sending request to N8N webhook...');
        
        const requestPayload = {
          image_base64: args.image_base64,
          prompt: args.prompt,
          timestamp: new Date().toISOString(),
          source: 'claude-desktop-mcp'
        };

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'N8N-Gemini-MCP-Server/1.0.0'
          },
          body: JSON.stringify(requestPayload),
          timeout: 60000, // 60 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[MCP Server] N8N webhook failed: ${response.status} ${response.statusText}`);
          if (DEBUG) {
            console.error('[MCP Server] Error response:', errorText);
          }
          
          throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (DEBUG) {
          console.error('[MCP Server] N8N response received:', {
            success: result.success,
            hasImage: !!result.generated_image,
            timestamp: result.timestamp
          });
        }

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ Image generation completed successfully!\n\n**Generated Image**: ${result.generated_image ? 'Ready' : 'Not available'}\n**Format**: ${result.mime_type || 'image/png'}\n**Processed at**: ${result.timestamp}\n\nThe generated image is available as base64 data.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Image generation failed: ${result.error || 'Unknown error occurred'}`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        console.error('[MCP Server] Request failed:', error.message);
        if (DEBUG) {
          console.error('[MCP Server] Full error:', error);
        }
        
        // Provide specific error messages based on error type
        let errorMessage = 'Image generation failed: ';
        
        if (error.code === 'ECONNREFUSED') {
          errorMessage += 'Could not connect to N8N instance. Please check if N8N is running and the webhook URL is correct.';
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage += 'Request timed out. The image generation process may take longer than expected.';
        } else if (error.message.includes('webhook failed')) {
          errorMessage += error.message;
        } else {
          errorMessage += error.message || 'Unknown error occurred';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `❌ ${errorMessage}\n\nPlease check:\n- N8N instance is running\n- Webhook URL is correct\n- Google Cloud credentials are configured\n- Vertex AI API is enabled`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Validate base64 string format
   * @param {string} str - String to validate
   * @returns {boolean} - True if valid base64
   */
  isValidBase64(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }
    
    try {
      // Remove data URL prefix if present
      const base64String = str.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Check if it's valid base64
      return btoa(atob(base64String)) === base64String;
    } catch {
      return false;
    }
  }

  /**
   * Start the MCP server
   */
  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error(`[MCP Server] N8N Gemini MCP server running on stdio`);
      console.error(`[MCP Server] Webhook URL: ${N8N_WEBHOOK_URL}`);
      console.error(`[MCP Server] Debug mode: ${DEBUG}`);
    } catch (error) {
      console.error('[MCP Server] Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new N8nGeminiMCPServer();
server.run().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});