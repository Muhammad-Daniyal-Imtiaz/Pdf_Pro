import Smithery from '@smithery/api';
import { createConnection, SmitheryAuthorizationError } from '@smithery/api/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const SMITHERY_API_KEY = process.env.SMITHERY_API_KEY;
const GEN_PDF_MCP_URL = 'https://mcp--gen-pdf.run.tools';

class MCPService {
    private smithery: Smithery | null = null;
    private mcpClient: Client | null = null;

    constructor() {
        console.log('🔑 Smithery API Key:', SMITHERY_API_KEY ? 'Present' : 'Missing');
        console.log('� Note: Gen-PDF MCP server works without authentication');
        // Smithery not required for Gen-PDF - using direct connection
    }

    private async ensureConnection() {
        if (this.mcpClient) return;

        try {
            console.log('🔗 Connecting to Gen-PDF MCP Server...');
            
            // Try direct connection first (Gen-PDF doesn't require auth)
            console.log('🔗 Using direct connection (no auth required)...');
            const result = await createConnection({
                mcpUrl: GEN_PDF_MCP_URL,
            });
            const transport = result.transport;

            this.mcpClient = new Client({ 
                name: 'pdf-pro-generator', 
                version: '1.0.0' 
            }, {
                capabilities: {}
            });

            await this.mcpClient.connect(transport);
            console.log('✅ Connected to MCP Server');
            
            // List available tools to verify connection
            const { tools } = await this.mcpClient.listTools();
            console.log('🔧 Available tools:', tools.map(t => t.name));
            
        } catch (error) {
            console.error('❌ Failed to connect to MCP Server:', error);
            console.log('🔄 MCP Server may be unavailable, using fallback PDF generation');
            throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                    markdownDocument: markdown,
                    title: 'Generated PDF Document',
                    // Optional styling can be added here if needed
                }
            });

            console.log('🔍 MCP Response:', JSON.stringify(result, null, 2))
            if (result && result.content && Array.isArray(result.content)) {
                const textContent = result.content.find(c => c.type === 'text');
                if (textContent && 'text' in textContent) {
                    console.log('✅ PDF generated successfully via MCP')
                    console.log('📄 Response type:', typeof textContent.text)
                    console.log('📏 Response length:', textContent.text.length)
                    
                    // Check if response contains error message
                    const responseText = textContent.text
                    if (responseText.includes('PDF generation failed') || 
                        responseText.includes('ENOTFOUND') || 
                        responseText.includes('proxy.gen-pdf.com')) {
                        throw new Error(`MCP Server Error: ${responseText}`)
                    }
                    
                    return responseText
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
