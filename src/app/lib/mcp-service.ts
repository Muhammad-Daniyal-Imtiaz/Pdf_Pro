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

            if (!result || !('content' in result) || !Array.isArray((result as any).content)) {
                throw new Error('Invalid response from MCP tool');
            }

            const textContent = (result as any).content.find((c: any) => c && c.type === 'text' && typeof c.text === 'string');
            const rawText: string | null = textContent?.text || null;
            if (!rawText) throw new Error('MCP tool returned no text payload');

            // Common formats:
            // - base64 string
            // - data URL: data:application/pdf;base64,....
            // - URL to a pdf
            // - JSON string that includes url/base64
            const trimmed = rawText.trim();

            // 1) data:...;base64,...
            const dataUrlMatch = trimmed.match(/^data:application\/pdf;base64,(.+)$/i);
            if (dataUrlMatch?.[1]) return dataUrlMatch[1];

            // 2) Looks like a URL
            if (/^https?:\/\//i.test(trimmed)) {
                const res = await fetch(trimmed);
                if (!res.ok) throw new Error(`Failed to fetch MCP PDF URL (HTTP ${res.status})`);
                const buf = Buffer.from(await res.arrayBuffer());
                return buf.toString('base64');
            }

            // 3) Try parse as JSON with common fields
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    const base64 = parsed?.base64 || parsed?.pdfBase64 || parsed?.content;
                    const url = parsed?.url || parsed?.pdfUrl;
                    if (typeof base64 === 'string' && base64.length > 100) {
                        const m = base64.match(/^data:application\/pdf;base64,(.+)$/i);
                        return m?.[1] || base64;
                    }
                    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`Failed to fetch MCP PDF URL (HTTP ${res.status})`);
                        const buf = Buffer.from(await res.arrayBuffer());
                        return buf.toString('base64');
                    }
                } catch {
                    // ignore
                }
            }

            // 4) Heuristic: if it’s long and base64-ish, accept it
            if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.replace(/\s+/g, '').length > 500) {
                return trimmed.replace(/\s+/g, '');
            }

            throw new Error('Unrecognized MCP PDF payload format');
        } catch (error) {
            console.error('❌ MCP Tool call failed:', error);
            throw error;
        }
    }
}

export const mcpService = new MCPService();
