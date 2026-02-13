'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import PDFRenderer from './PDFRenderer'
import { generatePDF } from '@/app/lib/pdf-service'
import { parsePdf } from '@/app/lib/pdf-import-service'
import { Loader2, Grid, ArrowDownToLine, ZoomIn, ZoomOut, Plus, Trash2, Upload } from 'lucide-react'

import PageContainer from './PageContainer'
import OverlayLayer from './OverlayLayer'

export default function EditorMain() {
    const {
        pages,
        selectedIds,
        selectElement,
        updateElement,
        removeElement,
        moveElement,
        resizeElement,
        docTitle,
        setDocTitle,
        setGeneratingPDF,
        isGeneratingPDF,
        zoom,
        setZoom,
        addPage,
        removePage,
        importPdf,
        clearPages,
        originalPdf
    } = useEditorStore()

    const canvasRef = useRef<HTMLDivElement>(null)
    const [showGrid, setShowGrid] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, handle: '' })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDownloadPDF = useCallback(async () => {
        setError(null)
        setEditingId(null)
        selectElement(null)

        // Wait for UI update
        await new Promise(r => setTimeout(r, 100))

        setGeneratingPDF(true)

        try {
            const blob = await generatePDF(pages, docTitle, A4_WIDTH, A4_HEIGHT, originalPdf)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${docTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (err: any) {
            console.error('PDF export failed:', err)
            setError(err.message || 'Failed to generate PDF')
        } finally {
            setGeneratingPDF(false)
        }
    }, [pages, docTitle, selectElement, setGeneratingPDF, originalPdf])

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.')
            return
        }

        setIsImporting(true)
        setError(null)

        try {
            const { pages: importedPages, originalPdf } = await parsePdf(file)
            importPdf(importedPages, originalPdf)
            setDocTitle(file.name.replace('.pdf', ''))
        } catch (err: any) {
            console.error('PDF import failed:', err)
            setError('Failed to import PDF: ' + err.message)
        } finally {
            setIsImporting(false)
            if (e.target) e.target.value = ''
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault()
                handleDownloadPDF()
            }
            if (e.key === 'Delete' && selectedIds.length > 0) {
                selectedIds.forEach(id => removeElement(id))
                selectElement(null)
            }
            if (e.key === 'Escape') {
                setEditingId(null)
                selectElement(null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleDownloadPDF, selectedIds, removeElement, selectElement])

    const [isDragging, setIsDragging] = useState(false)
    const [activeElementId, setActiveElementId] = useState<string | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, elX: 0, elY: 0 })

    const handleElementMouseDown = (id: string, e: React.MouseEvent) => {
        if (editingId === id) return
        e.stopPropagation()

        let foundElement = null
        for (const page of pages) {
            foundElement = page.elements.find(el => el.id === id)
            if (foundElement) break
        }

        if (!foundElement) return

        setIsDragging(true)
        setActiveElementId(id)
        selectElement(id)

        const rect = canvasRef.current?.getBoundingClientRect()
        const scale = zoom / 100
        const rawX = rect ? (e.clientX - rect.left) / scale : 0
        const rawY = rect ? (e.clientY - rect.top) / scale : 0

        setDragStart({
            x: rawX,
            y: rawY,
            elX: foundElement.x,
            elY: foundElement.y,
        })
    }

    const handleElementDoubleClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        let foundElement = null
        for (const page of pages) {
            foundElement = page.elements.find(el => el.id === id)
            if (foundElement) break
        }

        if (foundElement && ['text', 'heading', 'paragraph', 'container'].includes(foundElement.type)) {
            setEditingId(id)
        }
    }

    const handleResizeStart = (id: string, handle: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        let foundElement = null
        for (const page of pages) {
            foundElement = page.elements.find(el => el.id === id)
            if (foundElement) break
        }
        if (!foundElement) return

        setIsResizing(true)
        setActiveElementId(id)
        selectElement(id)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: foundElement.style.width,
            height: foundElement.style.height,
            handle
        })
    }

    useEffect(() => {
        if (!isDragging && !isResizing) return

        const handleMouseMove = (e: MouseEvent) => {
            if (activeElementId) {
                if (isDragging) {
                    const rect = canvasRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const scale = zoom / 100
                    const rawX = (e.clientX - rect.left) / scale
                    const rawY = (e.clientY - rect.top) / scale
                    const dx = rawX - dragStart.x
                    const dy = rawY - dragStart.y
                    moveElement(activeElementId, Math.round(dragStart.elX + dx), Math.round(dragStart.elY + dy))
                }

                if (isResizing) {
                    const dx = (e.clientX - resizeStart.x) * (100 / zoom)
                    const dy = (e.clientY - resizeStart.y) * (100 / zoom)

                    let newWidth = resizeStart.width
                    let newHeight = resizeStart.height

                    if (resizeStart.handle.includes('e')) newWidth += dx
                    if (resizeStart.handle.includes('s')) newHeight += dy
                    if (resizeStart.handle.includes('w')) {
                        // Complex resize not implemented yet for simplicity
                        newWidth -= dx
                    }
                    if (resizeStart.handle.includes('n')) {
                        newHeight -= dy
                    }

                    resizeElement(activeElementId, Math.max(20, newWidth), Math.max(20, newHeight))
                }
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(false)
            setActiveElementId(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, isResizing, dragStart, resizeStart, activeElementId, zoom, moveElement, resizeElement])

    const handleContentChange = useCallback((id: string, content: string, markAsModified?: boolean) => {
        if (markAsModified) {
            updateElement(id, { content, isModified: true })
        } else {
            updateElement(id, { content })
        }
    }, [updateElement])

    const handleAddPage = () => {
        addPage()
        setTimeout(() => {
            const container = canvasRef.current?.parentElement?.parentElement
            if (container) container.scrollTop = container.scrollHeight
        }, 100)
    }

    return (
        <main className="flex-1 bg-gray-100 h-full flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="font-semibold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-64"
                    />
                    <div className="h-6 w-px bg-gray-300" />
                    <button onClick={() => setShowGrid(!showGrid)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showGrid ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Grid size={16} /> Grid
                    </button>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setZoom(zoom - 10)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><ZoomOut size={16} /></button>
                        <span className="text-xs font-bold w-12 text-center text-gray-700">{zoom}%</span>
                        <button onClick={() => setZoom(zoom + 10)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><ZoomIn size={16} /></button>
                    </div>
                    <div className="h-6 w-px bg-gray-300" />
                    <button onClick={handleUploadClick} disabled={isImporting} className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors">
                        {isImporting ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Upload size={16} />}
                        {isImporting ? 'Importing...' : 'Upload PDF'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                </div>
                <div className="flex items-center gap-3">
                    {error && <span className="text-red-500 text-[10px] font-bold bg-red-50 border border-red-100 px-3 py-1.5 rounded uppercase tracking-wider animate-pulse">{error}</span>}
                    <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
                        {isGeneratingPDF ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
                        {isGeneratingPDF ? 'Generating...' : 'Export'}
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            <div className="flex-1 overflow-auto bg-[#f8fafc] p-12 scroll-smooth">
                <div className="flex flex-col gap-12 items-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', paddingBottom: '100px' }}>
                    {pages.map((page, pageIndex) => (
                        <PageContainer
                            key={page.id}
                            pageIndex={pageIndex}
                            showGrid={showGrid}
                            onRemove={pages.length > 1 ? () => removePage(pageIndex) : undefined}
                            elementsCount={page.elements.length}
                            zoom={zoom}
                        >
                            <div
                                ref={pageIndex === 0 ? canvasRef : null}
                                onClick={() => { if (!isDragging) { selectElement(null); setEditingId(null) } }}
                                className="w-full h-full relative"
                            >
                                <PDFRenderer
                                    elements={page.elements}
                                    editingId={editingId}
                                    onElementMouseDown={handleElementMouseDown}
                                    onElementDoubleClick={handleElementDoubleClick}
                                    onContentChange={handleContentChange}
                                    onBlur={() => setEditingId(null)}
                                    backgroundImage={page.backgroundImage}
                                />
                                <OverlayLayer
                                    elements={page.elements}
                                    selectedIds={selectedIds}
                                    onResizeStart={handleResizeStart}
                                />
                            </div>
                        </PageContainer>
                    ))}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleAddPage}
                className="fixed bottom-12 right-12 flex items-center gap-2 px-6 py-4 bg-gray-900 hover:bg-black text-white rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 z-50 group"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                <span className="font-bold text-sm">ADD PAGE</span>
            </button>

            {/* Status Bar */}
            <div className="h-8 bg-white border-t border-gray-100 flex items-center px-4 text-[10px] font-bold text-gray-400 justify-between shrink-0 uppercase tracking-widest">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> A4 FORMAT</span>
                    <span>{pages.length} PAGES</span>
                    <span>{pages.reduce((total, p) => total + p.elements.length, 0)} TOTAL ELEMENTS</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-300">SYSTEM_READY</span>
                    <span className="text-blue-500">v2.0.0_PRO</span>
                </div>
            </div>
        </main>
    )
}