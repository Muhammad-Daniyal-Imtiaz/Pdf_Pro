'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import EditorSidebar from '../../../components/editor/EditorSidebar'
import PDFRenderer from '../../../components/editor/PDFRenderer'
import { fileToBase64, saveEditedPDF } from '../../../lib/pdf-edit-service'
import { Upload, Download, Loader2, ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import Link from 'next/link'



export default function EditPage() {
  const {
    pages,
    docTitle,
    setDocTitle,
    addElement,
    updateElement,
    selectElement,
    selectedIds,
    clearPages,
    zoom,
    setZoom
  } = useEditorStore()

  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Defined locally to ensure availability
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)
    clearPages()

    try {
      // 1. Dynamic Import
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      // 2. Convert to Base64
      const base64 = await fileToBase64(file)
      setOriginalPdfBase64(base64)
      setDocTitle(file.name.replace('.pdf', ''))

      // 3. Render PDF
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)

      // Calculate scale to fit width to A4
      const viewportUnscaled = page.getViewport({ scale: 1 })
      const scale = A4_WIDTH / viewportUnscaled.width
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      // Set canvas dimensions
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)

      // Fill white background (Handles transparent PDFs)
      context!.fillStyle = 'white'
      context!.fillRect(0, 0, canvas.width, canvas.height)

      // Render PDF page
      await page.render({
        canvasContext: context!,
        viewport: viewport,
        canvas: canvas
      }).promise

      const backgroundImage = canvas.toDataURL('image/png')

      // 4. Add to Store
      const currentState = useEditorStore.getState()
      if (currentState.pages.length === 0) {
        useEditorStore.getState().addPage()
      }

      // Add image element
      useEditorStore.getState().addElement('image')

      // Get the updated state to find the new element
      const updatedState = useEditorStore.getState()
      const lastPage = updatedState.pages[updatedState.pages.length - 1]
      const lastElement = lastPage?.elements[lastPage.elements.length - 1]

      if (lastElement) {
        useEditorStore.getState().updateElement(lastElement.id, {
          content: backgroundImage,
          x: 0,
          y: 0,
          style: {
            width: A4_WIDTH,
            height: A4_HEIGHT, // Force A4 height to fill page
            zIndex: 1, // IMPORTANT: zIndex 1 ensures it's above the page background
            opacity: 1,
          }
        })
      }

    } catch (err: any) {
      console.error(err)
      setError('Failed to parse PDF: ' + err.message)
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

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 10))
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 10))
  const handleResetZoom = () => setZoom(100)

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>
          <div className="h-6 w-px bg-gray-200 mx-2" />
          <h1 className="font-semibold text-gray-800 truncate max-w-[200px]">{docTitle}</h1>
          <div className="h-6 w-px bg-gray-200 mx-2" />

          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
            <button onClick={handleZoomOut} className="p-1 hover:bg-white rounded text-gray-600" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium w-12 text-center text-gray-600">{Math.round(zoom)}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-white rounded text-gray-600" title="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleResetZoom} className="p-1 hover:bg-white rounded text-gray-600 ml-1" title="Reset Zoom">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors">
            <Upload size={16} /> Import PDF
          </button>
          <button onClick={handleSave} disabled={!originalPdfBase64 || isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded text-sm font-medium shadow-sm transition-colors">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Save Changes
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />

        {/* Main Editor Area with Zoom Support */}
        <main className="flex-1 bg-gray-200/50 overflow-auto flex relative">
          <div className="m-auto p-12 transition-all duration-200 ease-out">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="font-medium text-gray-600">Processing PDF...</span>
              </div>
            ) : (
              <div
                className="relative shadow-2xl bg-white origin-top-left transition-transform duration-200"
                style={{
                  width: `${A4_WIDTH}px`,
                  height: `${A4_HEIGHT}px`,
                  transform: `scale(${zoom / 100})`,
                  marginBottom: `${(A4_HEIGHT * (zoom / 100) - A4_HEIGHT)}px`, // Compensate for scaling margin? No, margin handled by parent flow if we use layout size.
                  // BETTER APPROACH: Wrap in a container of the SCALED size.
                }}
              >
                {/* Actually, let's revert to the transform wrapper pattern for cleaner scrolling */}
                <div style={{
                  width: `${A4_WIDTH * (zoom / 100)}px`,
                  height: `${A4_HEIGHT * (zoom / 100)}px`,
                  position: 'relative'
                }}>
                  <div
                    className="bg-white shadow-2xl origin-top-left"
                    style={{
                      width: `${A4_WIDTH}px`,
                      height: `${A4_HEIGHT}px`,
                      transform: `scale(${zoom / 100})`,
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                    onClick={() => selectElement(null)}
                  >
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
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {error && <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow-lg border border-red-200">{error}</div>}
    </div>
  )
}