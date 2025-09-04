# N8N Gemini MCP Server

> MCP Server for integrating Claude Desktop with N8N and Google Imagen API for image generation

## 🚀 Architecture

```
Claude Desktop → MCP Server → N8N Webhook → Google Imagen API → Generated Image
```

This project provides a Model Context Protocol (MCP) server that allows Claude Desktop to generate images by:
1. Accepting base64-encoded images and text prompts
2. Sending requests to N8N workflows
3. Processing images through Google Cloud's Imagen API
4. Returning generated images

## ✨ Features

- 🖼️ **Image-to-Image Generation**: Transform existing images with AI
- 💬 **Natural Language Prompts**: Use descriptive text to guide generation
- 🔄 **Robust Error Handling**: Comprehensive validation and error responses
- 🛡️ **Security**: Input validation and safe API handling
- 📊 **Structured Responses**: Clean JSON responses with metadata

## 📋 Prerequisites

- Node.js 18+
- N8N instance (local or cloud)
- Google Cloud Platform account with Vertex AI API enabled
- Claude Desktop

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Joseph19820124/n8n-gemini-mcp-server.git
cd n8n-gemini-mcp-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your N8N webhook URL
```

### 4. Set up Google Cloud
1. Enable Vertex AI API in Google Cloud Console
2. Create a service account and download credentials JSON
3. Note your Project ID

### 5. Import N8N Workflow
1. Open your N8N instance
2. Import the `n8n-workflow.json` file
3. Configure Google Cloud credentials in N8N
4. Update the PROJECT_ID in the HTTP Request node

### 6. Configure Claude Desktop
Add the configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "n8n-gemini-image": {
      "command": "node",
      "args": ["/path/to/n8n-gemini-mcp-server/server.js"],
      "env": {
        "N8N_WEBHOOK_URL": "https://your-n8n-instance.com/webhook/gemini-image-gen"
      }
    }
  }
}
```

## 🚀 Usage

1. **Start the MCP Server**
   ```bash
   npm start
   ```

2. **Test the N8N Webhook**
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/gemini-image-gen \
     -H "Content-Type: application/json" \
     -d '{
       "image_base64": "your-base64-encoded-image",
       "prompt": "Make this image more colorful and vibrant"
     }'
   ```

3. **Use in Claude Desktop**
   - Upload an image
   - Ask Claude to modify it: "Please make this image look like a watercolor painting"
   - Claude will use the MCP server to generate the result

## 📁 Project Structure

```
n8n-gemini-mcp-server/
├── server.js                    # Main MCP server implementation
├── package.json                 # Node.js project configuration
├── n8n-workflow.json           # N8N workflow configuration
├── claude-desktop-config.json  # Example Claude Desktop config
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🔧 Configuration Options

### Environment Variables
- `N8N_WEBHOOK_URL`: Your N8N webhook endpoint URL
- `PORT`: Server port (default: stdio)
- `DEBUG`: Enable debug logging

### N8N Workflow Parameters
You can customize the image generation in the N8N workflow:

```json
{
  "parameters": {
    "aspectRatio": "1:1",        // Image aspect ratio
    "mode": "image-to-image",     // Generation mode
    "sampleCount": 1,             // Number of images to generate
    "safetyFilterLevel": "block_some"  // Content filtering
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**MCP Server won't connect**
- Verify Node.js version >= 18
- Check that the N8N_WEBHOOK_URL is correct
- Ensure N8N instance is accessible

**Image generation fails**
- Confirm Google Cloud Vertex AI API is enabled
- Check service account permissions
- Verify project billing is active
- Ensure image is properly base64 encoded

**N8N workflow errors**
- Check webhook URL in workflow
- Verify Google Cloud credentials in N8N
- Review execution logs in N8N UI

### Debug Mode
```bash
DEBUG=true npm start
```

## 🔒 Security Considerations

- Store Google Cloud credentials securely
- Use HTTPS for N8N webhooks in production
- Implement rate limiting for API calls
- Enable appropriate content filtering
- Validate all input parameters

## 🚀 Advanced Usage

### Supporting Multiple Image Services
You can extend the server to support multiple image generation services:

1. Add new tools in `server.js`
2. Create corresponding N8N workflows
3. Route requests based on service type

### Batch Processing
Extend the MCP server for batch image generation:

```javascript
// Add to tools array
{
  name: 'generate_images_batch',
  description: 'Generate multiple images from prompts',
  inputSchema: {
    type: 'object',
    properties: {
      prompts: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  }
}
```

## 📈 Performance Optimization

- Cache generated images using CDN
- Implement async processing for large requests
- Add retry mechanisms for API failures
- Monitor API usage and costs
- Use image compression for faster transfers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://github.com/modelcontextprotocol) by Anthropic
- [N8N](https://n8n.io/) workflow automation
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai) for image generation

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review N8N execution logs
3. Enable debug mode for detailed logging
4. Create an issue on GitHub with logs and configuration details

---

**Happy Image Generating! 🎨**