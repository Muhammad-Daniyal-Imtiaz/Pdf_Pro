import { NextRequest, NextResponse } from 'next/server'
import { mcpService } from '@/app/lib/mcp-service'

export async function POST(req: NextRequest) {
    try {
        const { 
            prompt, 
            pageCount = 1,
            style = 'professional',
            layout = 'modern',
            includeHeaders = true,
            includeFooters = true,
            fontSize = 'normal',
            spacing = 'normal'
        } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        console.log(`🚀 Starting Enhanced Text-to-PDF for: "${prompt.substring(0, 50)}..."`)

        // Enhanced markdown generation with professional styling
        let markdown = generateEnhancedMarkdown(prompt, {
            pageCount,
            style,
            layout,
            includeHeaders,
            includeFooters,
            fontSize,
            spacing
        })

        console.log('✅ Generated Enhanced Markdown')

        // Convert to PDF using MCP
        let pdfResult: string
        try {
            pdfResult = await mcpService.generatePDF(markdown)
            console.log('✅ Generated PDF via Enhanced MCP')
        } catch (mcpError: any) {
            console.error('❌ Enhanced MCP PDF Generation failed:', mcpError.message)
            return NextResponse.json({
                error: 'Enhanced PDF generation failed. Please check MCP server connection.',
                details: mcpError.message,
                markdown: markdown
            }, { status: 503 })
        }

        return NextResponse.json({
            success: true,
            content: pdfResult,
            markdown: markdown,
            metadata: {
                pageCount,
                style,
                layout,
                prompt: prompt.substring(0, 100)
            }
        })

    } catch (error: any) {
        console.error('❌ Enhanced Text-to-PDF Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate enhanced PDF',
            details: error.stack || 'Unknown error'
        }, { status: 500 })
    }
}

function generateEnhancedMarkdown(prompt: string, options: any): string {
    const {
        pageCount = 1,
        style = 'professional',
        layout = 'modern',
        includeHeaders = true,
        includeFooters = true,
        fontSize = 'normal',
        spacing = 'normal'
    } = options

    // Professional styling configurations
    const styles = {
        professional: {
            header: '#',
            subheader: '##',
            font: 'Arial',
            spacing: '1.5'
        },
        modern: {
            header: '#',
            subheader: '##',
            font: 'Helvetica',
            spacing: '1.6'
        },
        academic: {
            header: '#',
            subheader: '##',
            font: 'Times New Roman',
            spacing: '2.0'
        },
        creative: {
            header: '#',
            subheader: '##',
            font: 'Georgia',
            spacing: '1.4'
        }
    }

    const currentStyle = styles[style] || styles.professional

    // Generate content based on page count
    let markdown = ''

    // Add document header
    if (includeHeaders) {
        markdown += `${currentStyle.header} ${prompt}\n\n`
        markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`
        markdown += `---\n\n`
    }

    // Split content across pages
    const contentSections = generateContentSections(prompt, pageCount)
    
    contentSections.forEach((section, index) => {
        if (index > 0) {
            markdown += `\n\n---\n\n**Page ${index + 1}**\n\n---\n\n`
        }

        markdown += `${currentStyle.subheader} ${section.title}\n\n`
        markdown += `${section.content}\n\n`

        // Add some professional elements
        if (layout === 'modern') {
            markdown += `> **Key Point**: ${section.keyPoint}\n\n`
        }

        // Add bullet points for better structure
        if (section.bullets && section.bullets.length > 0) {
            markdown += `**Key Highlights:**\n\n`
            section.bullets.forEach((bullet: string) => {
                markdown += `- ${bullet}\n`
            })
            markdown += '\n'
        }
    })

    // Add footer
    if (includeFooters) {
        markdown += `\n---\n\n`
        markdown += `*Document generated with AI assistance. Total pages: ${pageCount}*\n`
        markdown += `*Style: ${style} | Layout: ${layout} | Font Size: ${fontSize}*\n`
    }

    return markdown
}

function generateContentSections(prompt: string, pageCount: number): any[] {
    const sections = []
    
    // Generate intelligent content sections based on prompt
    const baseContent = prompt.toLowerCase()
    
    for (let i = 0; i < pageCount; i++) {
        const sectionNumber = i + 1
        
        // Smart content generation based on prompt context
        let title, content, keyPoint, bullets
        
        if (baseContent.includes('report') || baseContent.includes('analysis')) {
            title = `Section ${sectionNumber}: Analysis & Findings`
            content = `This section provides detailed analysis and findings related to ${prompt}. The comprehensive examination reveals important insights and patterns that contribute to understanding the subject matter.`
            keyPoint = `Critical insight from analysis section ${sectionNumber}`
            bullets = [
                `Key finding ${sectionNumber}.1`,
                `Important observation ${sectionNumber}.2`,
                `Significant result ${sectionNumber}.3`
            ]
        } else if (baseContent.includes('proposal') || baseContent.includes('plan')) {
            title = `Section ${sectionNumber}: Strategic Planning`
            content = `This section outlines strategic planning and implementation strategies for ${prompt}. The proposed approach ensures systematic execution and measurable outcomes.`
            keyPoint = `Strategic recommendation for section ${sectionNumber}`
            bullets = [
                `Objective ${sectionNumber}.1`,
                `Strategy ${sectionNumber}.2`,
                `Timeline ${sectionNumber}.3`
            ]
        } else if (baseContent.includes('manual') || baseContent.includes('guide')) {
            title = `Section ${sectionNumber}: Instructions & Guidelines`
            content = `This section provides detailed instructions and guidelines for ${prompt}. Follow these steps carefully to achieve optimal results and avoid common pitfalls.`
            keyPoint = `Essential instruction for section ${sectionNumber}`
            bullets = [
                `Step ${sectionNumber}.1: Preparation`,
                `Step ${sectionNumber}.2: Execution`,
                `Step ${sectionNumber}.3: Verification`
            ]
        } else {
            // Generic professional content
            title = `Section ${sectionNumber}: Overview & Details`
            content = `This section provides comprehensive information about ${prompt}. The content is structured to ensure clarity and facilitate understanding of key concepts and applications.`
            keyPoint = `Main point for section ${sectionNumber}`
            bullets = [
                `Important aspect ${sectionNumber}.1`,
                `Relevant detail ${sectionNumber}.2`,
                `Critical consideration ${sectionNumber}.3`
            ]
        }
        
        sections.push({
            title,
            content,
            keyPoint,
            bullets
        })
    }
    
    return sections
}
