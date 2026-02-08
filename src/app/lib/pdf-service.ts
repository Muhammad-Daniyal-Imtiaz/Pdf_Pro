// lib/pdf-service.ts
import { EditorElement, EditorPage } from '@/app/store/useEditorStore'

export async function generatePDF(
    pages: EditorPage[],
    title: string,
    width: number = 794,
    height: number = 1123
): Promise<Blob> {
    const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            pages,
            title: title || 'Document',
            width,
            height,
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate PDF')
    }

    return response.blob()
}