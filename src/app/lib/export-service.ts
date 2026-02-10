import { EditorPage, EditorElement } from '@/app/store/useEditorStore'
import { generatePDF as apiGeneratePDF } from './pdf-service'
import { generateWordDocument } from './word-generator'

// Re-export the PDF generation function
export const generatePDF = apiGeneratePDF

// Word generation — uses the docx library for real .docx output
export async function generateWord(pages: EditorPage[], title: string, width: number, height: number): Promise<Blob> {
    return generateWordDocument(pages, title, width, height)
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
                if (yDiff < 10) {
                    return a.x - b.x
                }
                return a.y - b.y
            })

        // Also extract social icon labels for the text export
        const socialIcons = page.elements
            .filter(el => el.type === 'social-icon' && el.content)
            .sort((a, b) => a.y - b.y)

        textElements.forEach(el => {
            if (el.content) {
                let cleanContent = el.content

                if (el.type === 'paragraph') {
                    cleanContent = `${cleanContent}\n`
                }

                fullText += `${cleanContent}\n`

                if (el.type === 'heading') {
                    fullText += '\n'
                }
            }
        })

        // Append social icon info
        if (socialIcons.length > 0) {
            socialIcons.forEach(icon => {
                const label = icon.iconType ? icon.iconType.charAt(0).toUpperCase() + icon.iconType.slice(1) : ''
                fullText += `${label}: ${icon.content}\n`
            })
        }
    })

    return new Blob([fullText], {
        type: 'text/plain;charset=utf-8'
    })
}
