// app/editor/edit/page.tsx
'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '../../store/useEditorStore'
import EditorSidebar from '../../components/editor/EditorSidebar'
import PDFRenderer from '../../components/editor/PDFRenderer'
import { fileToBase64, saveEditedPDF } from '../../lib/pdf-edit-service'
import { Upload, Download, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import * as pdfjsLib from 'pdfjs-dist'


// Dynamic import for PDF.js to avoid SSR issues

// Set Worker for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export default function EditPage() {
  const {
    pages,
    docTitle,
    setDocTitle,
    addElement,
    updateElement,
    selectElement,
    selectedIds,
    clearPages
  } = useEditorStore()

  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)
    clearPages()

    try {
      // 1. Convert to Base64 for backend
      const base64 = await fileToBase64(file)
      setOriginalPdfBase64(base64)
      setDocTitle(file.name.replace('.pdf', ''))

      // 2. Render PDF page as background image
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)
      
      const scale = 1.5
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise

      const backgroundImage = canvas.toDataURL('image/png')
      
      // Add background as an image element (locked at back)
      // We manually dispatch the store action to ensure it goes to page 0
      useEditorStore.getState().addElement('image')
      
      // Find the newly added element (last one) and update it
      const currentState = useEditorStore.getState()
      const lastElement = currentState.pages[0]?.elements[currentState.pages[0].elements.length - 1]
      
      if (lastElement) {
        useEditorStore.getState().updateElement(lastElement.id, {
          content: backgroundImage,
          x: 0,
          y: 0,
          style: {
            width: A4_WIDTH,
            height: A4_HEIGHT,
            zIndex: -10, // Behind everything
            opacity: 1,
          }
        })
      }

    } catch (err: any) {
      console.error(err)
      setError('Failed to parse PDF.')
    } finally {
      setIsProcessing(false)
    }
  }, [clearPages, setDocTitle])

  const handleSave = useCallback(async () => {
    if (!originalPdfBase64) return
    setIsSaving(true)
    try {
      const blob = await saveEditedPDF(originalPdfBase64, pages, docTitle)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${docTitle}_edited.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to save PDF')
    } finally {
      setIsSaving(false)
    }
  }, [originalPdfBase64, pages, docTitle])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>
          <h1 className="font-semibold text-gray-800">Edit Mode: {docTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">
            <Upload size={16} /> Import PDF
          </button>
          <button onClick={handleSave} disabled={!originalPdfBase64 || isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded text-sm font-medium shadow-sm">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Save Changes
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />
        <main className="flex-1 flex items-center justify-center overflow-auto p-8">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span>Processing PDF...</span>
            </div>
          ) : (
            <div className="relative shadow-2xl bg-white" style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }} onClick={() => selectElement(null)}>
              {pages[0] && (
                <PDFRenderer
                  elements={pages[0].elements}
                  width={A4_WIDTH}
                  height={A4_HEIGHT}
                  showSelection={true}
                  selectedIds={selectedIds}
                  editingId={null}
                  onElementMouseDown={(id, e) => { e.stopPropagation(); selectElement(id); }}
                  onContentChange={(id, content) => updateElement(id, { content, isModified: true })}
                />
              )}
              {!originalPdfBase64 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border-4 border-dashed border-gray-200 rounded-lg m-4">
                  <div className="text-center">
                    <Upload size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="font-medium text-gray-500">Import a PDF to start editing</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {error && <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow-lg border border-red-200">{error}</div>}
    </div>
  )
}