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
            // Optimized base64 conversion for Uint8Array
            // This method avoids potential stack overflow issues with large arrays
            // when using String.fromCharCode.apply and is more robust.
            let binary = '';
            const len = originalPdf.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(originalPdf[i]);
            }
            originalPdfBase64 = btoa(binary);
        } catch (e) {
            console.error('Core Error: Failed to convert PDF to base64:', e);
            // Optionally re-throw or handle the error more gracefully,
            // e.g., by proceeding without the original PDF if it's not critical.
            originalPdfBase64 = null; // Ensure it's null if conversion fails
        }
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