// components/editor/edit/page.tsx
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import EditorSidebar from '../../../components/editor/EditorSidebar'
import PDFRenderer from '../../../components/editor/PDFRenderer'
import TextToPDFGenerator from '../../../components/TextToPDFGenerator'
import { extractPDFElements } from '../../../lib/pdf-import-service'
import { Upload, Download, Loader2, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Plus, FileText, Sparkles, Grid3X3 } from 'lucide-react'
import Link from 'next/link'
import TemplateSelector from '../../../components/TemplateSelector'

export default function EditPage() {
  const {
    pages,
    docTitle,
    setDocTitle,
    addElement,
    updateElement,
    updateElementStyle,
    selectElement,
    selectedIds,
    clearPages,
    setPages,
    moveElement,
    zoom,
    setZoom,
    importPrecision,
    setImportPrecision,
    addPage
  } = useEditorStore()

  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showBackground, setShowBackground] = useState(true) // Default to Visible
  const [showTextToPDF, setShowTextToPDF] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
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

      // Use new Import Service
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

  const loadTemplate = async (template: any) => {
    try {
      setIsProcessing(true)
      setError(null)
      clearPages()

      const response = await fetch(`/templates/${template.file}`)
      const templateData = await response.json()

      setPages(templateData.pages)
      setDocTitle(template.name)
      setShowTemplates(false)
      setOriginalPdfBase64(null) // Clear any imported PDF
    } catch (err: any) {
      console.error('Failed to load template:', err)
      setError('Failed to load template: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateWithAI = async (template: any, prompt: string, templateData?: any) => {
    try {
      setIsProcessing(true)
      setError(null)
      clearPages()

      // If templateData is provided (from new TemplateSelector), use it directly
      // Otherwise, load the template first
      let loadedTemplateData = templateData

      if (!loadedTemplateData) {
        try {
          const templateResponse = await fetch(`/templates/${template.file}`)
          if (templateResponse.ok) {
            loadedTemplateData = await templateResponse.json()
          }
        } catch (err) {
          console.warn('Could not load template data, proceeding without it')
        }
      }

      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          templateSchema: loadedTemplateData,
          rawCvText: prompt,
          locale: navigator.language || 'en-US'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.template && Array.isArray(result.template.pages)) {
        const pagesFromApi = result.template.pages as any[]
        const seenIds = new Set<string>();
        const mappedPages = pagesFromApi.map((p: any, index: number) => ({
          id: p.id || `page-${index}-${Date.now()}`,
          elements: (p.elements || []).map((el: any) => {
            // CRITICAL: Ensure every element has a unique ID to prevent React duplicate key errors
            const generatedId = `el-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            let finalId = (el.id && el.id.trim() !== "") ? el.id : generatedId;

            // Collision prevention: If ID already exists in this document, generate a fresh one
            if (seenIds.has(finalId)) {
              finalId = `el-new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            seenIds.add(finalId);

            return {
              ...el,
              id: finalId,
              pageIndex: typeof el.pageIndex === 'number' ? el.pageIndex : index,
              isAIGenerated: true,
              isModified: true,
              style: {
                ...(el.style || {}),
                width: typeof el.style?.width === 'number' ? el.style.width : 674,
                height: typeof el.style?.height === 'number' ? el.style.height : 40,
                fontSize: el.style?.fontSize || 14,
                resizeMode: el.style?.resizeMode || 'auto-height',
              }
            };
          })
        }))

        if (mappedPages.length > 0) {
          setPages(mappedPages)
          setDocTitle(template.name)
        } else if (loadedTemplateData) {
          setPages(loadedTemplateData.pages || [])
          setDocTitle(template.name)
        }
      } else if (loadedTemplateData) {
        setPages(loadedTemplateData.pages || [])
        setDocTitle(template.name)
      }

      setShowTemplates(false)
      setOriginalPdfBase64(null)

      console.log('✅ AI generation complete!')

    } catch (err: any) {
      console.error('AI generation failed:', err)
      setError('AI generation failed: ' + err.message)

      // Fallback: try to load just the template without AI
      try {
        await loadTemplate(template)
        setError('AI generation failed, loaded template without AI content')
      } catch (loadErr) {
        setError('Failed to generate content. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

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
        const pagesToExport = pages.map(p => ({
          id: String(p.id),
          elements: p.elements
            .filter(el => !el.isImported)
            .map(el => {
              const style = el.style || ({} as any)
              const safeContent =
                typeof el.content === 'string'
                  ? el.content
                  : el.content == null
                    ? ''
                    : String(el.content)

              return {
                id: String(el.id),
                type: el.type,
                x: typeof el.x === 'number' ? el.x : Number(el.x) || 0,
                y: typeof el.y === 'number' ? el.y : Number(el.y) || 0,
                pageIndex: typeof el.pageIndex === 'number' ? el.pageIndex : 0,
                content: safeContent.slice(0, 50000),
                style: {
                  ...style,
                  width:
                    typeof style.width === 'number' || typeof style.width === 'string'
                      ? style.width
                      : A4_WIDTH - 120,
                  height:
                    typeof style.height === 'number' || typeof style.height === 'string'
                      ? style.height
                      : 40,
                },
                iconType: el.iconType,
                url: el.url,
                lineOrientation: el.lineOrientation,
                lineStyle: el.lineStyle,
              }
            }),
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${docTitle}_edited.pdf`
      a.click()
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('PDF Save Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save PDF'
      setError(`Save failed: ${errorMessage}`)
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
    const el = pages.flatMap(p => p.elements).find(el => el.id === id)
    if (!el) return

    // CRITICAL FIX: Always allow selection, even for imported elements
    // This ensures sidebar opens when clicking ANY part of PDF
    selectElement(id)

    // Prevent dragging the main PDF background image to keep things stable
    const isBackground = el.isImported && el.type === 'image' && el.style.width >= A4_WIDTH
    if (isBackground) return

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

  // Filter function for page elements
  const getPageElements = (pageIndex: number) => {
    return pages[pageIndex]?.elements.filter(el => {
      if (el.isImported && !showBackground) return false
      return true
    }) || []
  }

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
              onChange={(e) => setImportPrecision(e.target.value as 'paragraph' | 'precise' | 'raw')}
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
          <button onClick={addPage} className="flex items-center gap-2 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm font-medium transition-colors">
            <Plus size={16} /> Add Page
          </button>
          <button
            onClick={() => setShowTextToPDF(!showTextToPDF)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-sm font-medium transition-colors"
          >
            <Sparkles size={16} /> AI Text to PDF
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-sm font-medium transition-colors"
          >
            <Grid3X3 size={16} /> Templates
          </button>
          <button onClick={handleSave} disabled={pages.length === 0 || isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded text-sm font-medium shadow-sm transition-colors">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Save PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Templates Sidebar */}
        {showTemplates && (
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Grid3X3 size={18} className="text-indigo-600" />
                  Templates
                </h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <TemplateSelector
                onTemplateSelect={loadTemplate}
                onAIGenerate={generateWithAI}
              />
            </div>
          </div>
        )}

        {/* Text to PDF Sidebar */}
        {showTextToPDF && (
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  AI Text to PDF
                </h3>
                <button
                  onClick={() => setShowTextToPDF(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <TextToPDFGenerator
                onPDFGenerated={(pdfData) => {
                  console.log('PDF generated via Text to PDF')
                }}
              />
            </div>
          </div>
        )}

        <EditorSidebar />

        {/* Main Editor Area with Zoom Support */}
        <main className="flex-1 bg-gray-100 overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="flex flex-col items-center py-12 gap-8 min-w-max">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="font-medium text-gray-600">Processing PDF...</span>
              </div>
            ) : pages.length > 0 ? (
              pages.map((page, index) => (
                <div key={page.id} className="relative group">
                  {/* Page Label */}
                  <div className="absolute -left-16 top-0 text-xs font-bold text-gray-400 uppercase tracking-widest [writing-mode:vertical-lr] h-full flex items-center border-r border-gray-200 pr-4 group-hover:text-blue-500 transition-colors">
                    Page {index + 1}
                  </div>

                  <div
                    className="bg-white shadow-2xl origin-top-left transition-transform duration-200"
                    style={{
                      width: `${A4_WIDTH * (zoom / 100)}px`,
                      height: `${A4_HEIGHT * (zoom / 100)}px`,
                    }}
                  >
                    <div
                      style={{
                        width: `${A4_WIDTH}px`,
                        height: `${A4_HEIGHT}px`,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top left',
                        position: 'relative'
                      }}
                      onClick={() => {
                        selectElement(null)
                        setEditingId(null)
                      }}
                    >
                      <PDFRenderer
                        elements={getPageElements(index)}
                        width={A4_WIDTH}
                        height={A4_HEIGHT}
                        showSelection={true}
                        selectedIds={selectedIds}
                        editingId={editingId}
                        onElementMouseDown={handleElementMouseDown}
                        onElementDoubleClick={(id) => setEditingId(id)}
                        onContentChange={(id, content) => updateElement(id, { content, isModified: true })}
                        onResize={(id, width, height) => updateElementStyle(id, { width, height })}
                        onBlur={() => setEditingId(null)}
                        zoom={zoom}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="bg-white shadow-xl border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center"
                style={{
                  width: `${A4_WIDTH * (zoom / 100)}px`,
                  height: `${A4_HEIGHT * (zoom / 100)}px`
                }}
              >
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Ready to edit?</h3>
                  <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Import your PDF to begin your production-grade editing experience.</p>
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
