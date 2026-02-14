// components/editor/edit/page.tsx
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import EditorSidebar from '../../../components/editor/EditorSidebar'
import PDFRenderer from '../../../components/editor/PDFRenderer'
import { extractPDFElements } from '../../../lib/pdf-import-service'
import { Upload, Download, Loader2, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react'
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
    setPages,
    moveElement,
    zoom,
    setZoom,
    importPrecision,
    setImportPrecision
  } = useEditorStore()

  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showBackground, setShowBackground] = useState(true) // Default to Visible
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag State
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number, elId: string, initialX: number, initialY: number } | null>(null)

  // Helper: File to Base64
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
      const base64 = await fileToBase64(file)
      setOriginalPdfBase64(base64)
      setDocTitle(file.name.replace('.pdf', ''))

      // Use the new Import Service
      const { pages: importedPages } = await extractPDFElements(file, importPrecision)
      setPages(importedPages)
      setShowBackground(true) // Ensure visible on new import

    } catch (err: any) {
      console.error(err)
      setError('Failed to parse PDF: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }, [clearPages, setDocTitle, setPages, importPrecision])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      let response;

      if (showBackground && originalPdfBase64) {
        // HYBRID MODE (Overlay on Original)
        // CRITICAL: Filter elements to prevent "double text".
        // Only send elements that were ADDED newly OR elements that were MODIFIED.
        // Unmodified imported elements already exist in the original PDF background.
        const filteredElements = pages.flatMap(p => p.elements).filter(el => {
          if (el.isImported) return el.isModified // Only send modified imported text
          return true // Always send new elements
        })

        response = await fetch('/api/edit-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalPdf: originalPdfBase64,
            elements: filteredElements,
            title: docTitle
          })
        })

      } else {
        // RECONSTRUCTION MODE (Clean PDF from Elements)
        // Use generate-pdf which creates PDF from scratch
        // Filter out background images
        const pagesToExport = pages.map(p => ({
          ...p,
          elements: p.elements.filter(el => !el.isImported)
        }))

        response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pages: pagesToExport,
            title: docTitle,
            width: A4_WIDTH,
            height: A4_HEIGHT
          })
        })
      }

      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${docTitle}_edited.pdf`
      a.click()
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error(err)
      setError('Failed to save PDF')
    } finally {
      setIsSaving(false)
    }
  }, [pages, docTitle, showBackground, originalPdfBase64])

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 10))
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 10))
  const handleResetZoom = () => setZoom(100)

  // DRAG HANDLERS
  const handleElementMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const el = pages[0].elements.find(el => el.id === id)
    // Prevent dragging background if it's visible (it's locked usually)
    // If it's imported (background), usually we don't drag it.
    if (!el || el.isImported) return

    selectElement(id)
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elId: id,
      initialX: el.x,
      initialY: el.y
    })
  }, [pages, selectElement])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return

    // Calculate delta adjusted for zoom
    const zoomFactor = zoom / 100
    const deltaX = (e.clientX - dragStart.x) / zoomFactor
    const deltaY = (e.clientY - dragStart.y) / zoomFactor

    moveElement(dragStart.elId, dragStart.initialX + deltaX, dragStart.initialY + deltaY)
  }, [isDragging, dragStart, zoom, moveElement])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  // Global mouse up to catch drops outside
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setDragStart(null)
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging])

  // Filter elements for display
  const displayedElements = pages[0]?.elements.filter(el => {
    // If element is imported (background image) AND we want to hide background, exclude it.
    if (el.isImported && !showBackground) return false
    return true
  }) || []

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

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={() => setShowBackground(!showBackground)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${showBackground ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {showBackground ? <Eye size={16} /> : <EyeOff size={16} />}
            {showBackground ? 'Background Visible' : 'Background Hidden'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2 border-r pr-3 border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mode:</span>
            <select
              value={importPrecision}
              onChange={(e) => setImportPrecision(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value="paragraph">🚀 Balanced</option>
              <option value="precise">🎯 High Precision</option>
              <option value="raw">🧱 Raw PDF</option>
            </select>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors">
            <Upload size={16} /> Import PDF
          </button>
          <button onClick={handleSave} disabled={pages.length === 0 || isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded text-sm font-medium shadow-sm transition-colors">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Save PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />

        {/* Main Editor Area with Zoom Support */}
        <main className="flex-1 bg-gray-200/50 overflow-auto flex relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
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
                }}
              >
                {/* Scaled Wrapper */}
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
                    onClick={() => {
                      selectElement(null)
                      setEditingId(null)
                    }}
                  >
                    {pages[0] ? (
                      <div>
                        <PDFRenderer
                          elements={displayedElements}
                          width={A4_WIDTH}
                          height={A4_HEIGHT}
                          showSelection={true}
                          selectedIds={selectedIds}
                          editingId={editingId}
                          onElementMouseDown={handleElementMouseDown}
                          onElementDoubleClick={(id) => setEditingId(id)}
                          onContentChange={(id, content) => updateElement(id, { content, isModified: true })}
                          onBlur={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border-4 border-dashed border-gray-200 rounded-lg m-4 pointer-events-none">
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