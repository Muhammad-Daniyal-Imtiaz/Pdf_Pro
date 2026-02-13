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
    if (originalPdf && originalPdf.length > 0) {
        try {
            // Robust way to convert Uint8Array to base64 for potentially large files
            let binary = '';
            const len = originalPdf.byteLength;
            const chunk_size = 8192;
            for (let i = 0; i < len; i += chunk_size) {
                binary += String.fromCharCode.apply(null, Array.from(originalPdf.subarray(i, i + chunk_size)));
            }
            originalPdfBase64 = btoa(binary);
        } catch (e) {
            console.error('Failed to convert PDF to base64:', e);
            // Fallback to Puppeteer-only if base64 conversion fails
        }
    }

    const endpoint = originalPdf ? '/api/edit' : '/api/generate-pdf'

    const response = await fetch(endpoint, {
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