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

        // 1. Generate Premium Markdown from Canvas JSON using Gemini
        const markdown = await aiService.generateMarkdownFromCanvas(context)
        console.log('✅ AI transformed canvas to high-fidelity Markdown')

        // 2. Convert Markdown to PDF using MCP
        const pdfResult = await mcpService.generatePDF(markdown)
        console.log('✅ Generated Premium PDF via MCP')

        return NextResponse.json({
            success: true,
            content: pdfResult, // Base64 or URL
            markdown: markdown
        })

    } catch (error: any) {
        console.error('❌ Premium Export Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate premium PDF via AI+MCP'
        }, { status: 500 })
    }
}
