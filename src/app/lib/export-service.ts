import { EditorPage, EditorElement } from '@/app/store/useEditorStore'
import { generatePageHTML, escapeHtml } from './html-generator'
import { generatePDF as apiGeneratePDF } from './pdf-service'

// Re-export the PDF generation function
export const generatePDF = apiGeneratePDF

export function generateWord(pages: EditorPage[], title: string, width: number, height: number): Blob {
    // Generate HTML content for all pages
    const pagesHTML = pages.map(page =>
        generatePageHTML(page.elements, width, height)
    ).join('<br class="page-break" style="page-break-after: always; clear: both;" />')

    // Wrap in a complete HTML document with Word-specific namespaces and styles
    const fullHTML = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>${escapeHtml(title)}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .page-break {
                    page-break-after: always;
                }
                /* Ensure absolute positioning works in Word Web Layout */
                div {
                    box-sizing: border-box;
                }
            </style>
            <!--[if gte mso 9]>
            <xml>
            <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
            </xml>
            <![endif]-->
        </head>
        <body>
            ${pagesHTML}
        </body>
        </html>
    `

    return new Blob(['\ufeff', fullHTML], {
        type: 'application/msword'
    })
}

export function generateText(pages: EditorPage[], title: string): Blob {
    let fullText = `${title}\n${'='.repeat(title.length)}\n\n`

    pages.forEach((page, index) => {
        if (index > 0) {
            fullText += `\n\n--- Page ${index + 1} ---\n\n`
        }

        // Filter and sort elements to try and reconstruct reading order
        // Sort by Y first (with small tolerance), then X
        const textElements = page.elements
            .filter(el => ['heading', 'paragraph', 'text', 'link', 'container'].includes(el.type))
            .sort((a, b) => {
                const yDiff = Math.abs(a.y - b.y)
                if (yDiff < 10) { // Elements on roughly the same line (10px tolerance)
                    return a.x - b.x
                }
                return a.y - b.y
            })

        textElements.forEach(el => {
            if (el.content) {
                // Strip HTML tags if any (basic regex) but preserve line breaks
                // Although our content is mostly plain text in the store, specific elements might vary
                let cleanContent = el.content

                if (el.type === 'paragraph') {
                    // Paragraph spacing
                    cleanContent = `${cleanContent}\n`
                }

                fullText += `${cleanContent}\n`

                // Add an extra newline for spacing between distinct blocks
                if (el.type === 'heading') {
                    fullText += '\n'
                }
            }
        })
    })

    return new Blob([fullText], {
        type: 'text/plain;charset=utf-8'
    })
}
