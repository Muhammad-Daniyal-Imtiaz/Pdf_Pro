// lib/pdf-edit-service.ts
import { EditorElement, EditorPage } from '@/app/store/useEditorStore'

interface EditPayload {
  originalPdf: string // Base64
  elements: EditorElement[]
  title: string
}

export async function saveEditedPDF(
  originalPdfBase64: string,
  pages: EditorPage[],
  title: string
): Promise<Blob> {

  // Flatten all elements from all pages
  const allElements = pages.flatMap(page => page.elements)

  const payload: EditPayload = {
    originalPdf: originalPdfBase64,
    elements: allElements,
    title: title || 'edited-document'
  }

  const response = await fetch('/api/edit-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to generate edited PDF')
  }

  return response.blob()
}

// Helper to convert File to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove "data:application/pdf;base64," prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}