import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { mcpService } from '@/app/lib/mcp-service'

export async function POST(req: NextRequest) {
    try {
        const { context } = await req.json()

        if (!context) {
            return NextResponse.json({ error: 'Canvas context is required' }, { status: 400 })
        }

        console.log('🚀 Starting AI+MCP Premium Export workflow...')

        // Step 1: Generate Premium Markdown from Canvas JSON using Gemini
        let markdown: string
        try {
            markdown = await aiService.generateMarkdownFromCanvas(context)
            console.log('✅ AI transformed canvas to high-fidelity Markdown')
        } catch (aiError: any) {
            console.error('⚠️ AI Canvas transformation failed:', aiError.message)
            // Fallback: Create a simple markdown from the context
            markdown = `# Document Export\n\nCanvas content could not be fully processed.\n\n*Note: AI service temporarily unavailable.*`
        }

        // Step 2: Convert Markdown to PDF using MCP
        let pdfResult: string
        try {
            pdfResult = await mcpService.generatePDF(markdown)
            console.log('✅ Generated Premium PDF via MCP')
        } catch (mcpError: any) {
            console.error('❌ MCP PDF Generation failed:', mcpError.message)
            return NextResponse.json({
                error: 'MCP PDF generation failed. Please check MCP server connection.',
                details: mcpError.message,
                markdown: markdown // Return markdown so user can at least see the content
            }, { status: 503 })
        }

        return NextResponse.json({
            success: true,
            content: pdfResult, // Base64 or URL
            markdown: markdown
        })

    } catch (error: any) {
        console.error('❌ Premium Export Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate premium PDF via AI+MCP',
            details: error.stack || 'Unknown error'
        }, { status: 500 })
    }
}
