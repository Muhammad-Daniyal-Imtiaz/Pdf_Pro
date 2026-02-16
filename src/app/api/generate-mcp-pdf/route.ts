import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { mcpService } from '@/app/lib/mcp-service'

export async function POST(req: NextRequest) {
    try {
        const { prompt, enhanceWithLayout = true } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        console.log(`🚀 Starting MCP PDF workflow for prompt: "${prompt.substring(0, 50)}..."`)

        let markdown: string
        
        // Step 1: Generate Markdown from prompt using Gemini
        try {
            markdown = await aiService.generateMarkdownFromPrompt(prompt)
            console.log('✅ Generated Markdown from Gemini')
        } catch (aiError: any) {
            console.error('⚠️ AI Generation failed, using fallback:', aiError.message)
            // Fallback: Create a simple markdown structure
            markdown = `# ${prompt}\n\nGenerated content will appear here.\n\n*Note: AI service temporarily unavailable.*`
        }

        // Step 2: Convert Markdown to PDF using MCP
        let pdfResult: string
        try {
            pdfResult = await mcpService.generatePDF(markdown)
            console.log('✅ Generated PDF via MCP')
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
            content: pdfResult,
            markdown: markdown // Return markdown for preview/debugging
        })

    } catch (error: any) {
        console.error('❌ MCP PDF Generation Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate PDF via MCP',
            details: error.stack || 'Unknown error'
        }, { status: 500 })
    }
}
