import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { mcpService } from '@/app/lib/mcp-service'

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        console.log(`🚀 Starting MCP PDF workflow for prompt: "${prompt.substring(0, 50)}..."`)

        // 1. Generate Markdown from prompt using Gemini
        const markdown = await aiService.generateMarkdownFromPrompt(prompt)
        console.log('✅ Generated Markdown from Gemini')

        // 2. Convert Markdown to PDF using MCP
        const pdfResult = await mcpService.generatePDF(markdown)
        console.log('✅ Generated PDF via MCP')

        // pdfResult could be a URL, base64, or other format depending on the tool
        // If it's base64, we can convert it to a blob or just return it
        return NextResponse.json({
            success: true,
            content: pdfResult,
            markdown: markdown // Return markdown too for preview/debugging
        })

    } catch (error: any) {
        console.error('❌ MCP PDF Generation Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate PDF via MCP'
        }, { status: 500 })
    }
}
