import Smithery from '@smithery/api';
import { createConnection } from '@smithery/api/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const SMITHERY_API_KEY = process.env.SMITHERY_API_KEY;
const GEN_PDF_MCP_URL = 'https://server.smithery.ai/gen-pdf/mcp';

class MCPService {
    private smithery: Smithery | null = null;
    private mcpClient: Client | null = null;

    constructor() {
        if (SMITHERY_API_KEY) {
            this.smithery = new Smithery({ apiKey: SMITHERY_API_KEY });
        }
    }

    private async ensureConnection() {
        if (this.mcpClient) return;

        try {
            console.log('🔗 Connecting to Gen-PDF MCP Server via Smithery...');
            const { transport } = await createConnection({
                mcpUrl: GEN_PDF_MCP_URL,
                client: this.smithery || undefined,
            });

            this.mcpClient = new Client({ 
                name: 'pdf-pro-generator', 
                version: '1.0.0' 
            }, {
                capabilities: {}
            });

            await this.mcpClient.connect(transport);
            console.log('✅ Connected to MCP Server');
        } catch (error) {
            console.error('❌ Failed to connect to MCP Server:', error);
            throw new Error('MCP connection failed');
        }
    }

    async generatePDF(markdown: string): Promise<string> {
        await this.ensureConnection();
        if (!this.mcpClient) throw new Error('MCP client not initialized');

        try {
            console.log('📄 Calling generate_pdf tool...');
            const result = await this.mcpClient.callTool({
                name: 'generate_pdf',
                arguments: {
                    markdown: markdown,
                    // Optional styling can be added here if needed
                }
            });

            // Assuming the tool returns a URL or base64
            // The Gen-PDF MCP server usually returns a base64 or a success message with the file
            // Let's check the result structure
            if (result && result.content && Array.isArray(result.content)) {
                const textContent = result.content.find(c => c.type === 'text');
                if (textContent && 'text' in textContent) {
                    return textContent.text;
                }
            }
            
            throw new Error('Invalid response from MCP tool');
        } catch (error) {
            console.error('❌ MCP Tool call failed:', error);
            throw error;
        }
    }
}

export const mcpService = new MCPService();
