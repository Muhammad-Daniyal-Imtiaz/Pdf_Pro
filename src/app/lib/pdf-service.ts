import { EditorElement } from '@/app/store/useEditorStore'

export async function generatePDF(
    elements: EditorElement[],
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
            elements,
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