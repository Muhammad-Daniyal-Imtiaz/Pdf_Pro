// lib/pdf-service.ts
import { EditorElement, EditorPage } from '@/app/store/useEditorStore'

export async function generatePDF(
    pages: EditorPage[],
    title: string,
    width: number = 794,
    height: number = 1123,
    originalPdf?: Uint8Array
): Promise<Blob> {
    // Convert Uint8Array to base64 for transport if present
    let originalPdfBase64 = null
    if (originalPdf) {
        // Safe way to convert large Uint8Array to base64
        let binary = '';
        const bytes = new Uint8Array(originalPdf);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        originalPdfBase64 = btoa(binary);
    }

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
            originalPdf: originalPdfBase64
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate PDF')
    }

    return response.blob()
}