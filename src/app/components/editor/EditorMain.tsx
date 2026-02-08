'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import PDFRenderer from './PDFRenderer'
import { generatePDF } from '@/app/lib/pdf-service'
import { Loader2, Grid, ArrowDownToLine, ZoomIn, ZoomOut, Plus, Trash2 } from 'lucide-react'

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
    } = useEditorStore()

    const canvasRef = useRef<HTMLDivElement>(null)
    const [showGrid, setShowGrid] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDownloadPDF = useCallback(async () => {
        setError(null)
        setEditingId(null)
        selectElement(null)

        // Wait for UI update
        await new Promise(r => setTimeout(r, 100))

        setGeneratingPDF(true)

        try {
            const blob = await generatePDF(pages, docTitle, A4_WIDTH, A4_HEIGHT)
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
    }, [pages, docTitle, selectElement, setGeneratingPDF])

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
        e.stopPropagation()

        // Find the element across all pages
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

    useEffect(() => {
        if (!isDragging) return
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && activeElementId) {
                const rect = canvasRef.current?.getBoundingClientRect()
                if (!rect) return
                const scale = zoom / 100
                const rawX = (e.clientX - rect.left) / scale
                const rawY = (e.clientY - rect.top) / scale
                const dx = rawX - dragStart.x
                const dy = rawY - dragStart.y

                moveElement(activeElementId, Math.round(dragStart.elX + dx), Math.round(dragStart.elY + dy))
            }
        }
        const handleMouseUp = () => {
            setIsDragging(false)
            setActiveElementId(null)
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart, activeElementId, zoom, moveElement])

    const handleAddPage = () => {
        addPage()
        // Scroll to bottom to show new page
        setTimeout(() => {
            const container = canvasRef.current?.parentElement?.parentElement
            if (container) {
                container.scrollTop = container.scrollHeight
            }
        }, 100)
    }

    return (
        <main className="flex-1 bg-gray-100 h-full flex flex-col overflow-hidden">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="font-semibold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-64"
                        placeholder="Untitled Document"
                    />
                    <div className="h-6 w-px bg-gray-300" />
                    <button onClick={() => setShowGrid(!showGrid)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showGrid ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Grid size={16} /> Grid
                    </button>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setZoom(zoom - 10)} className="p-1.5 hover:bg-gray-100 rounded"><ZoomOut size={16} /></button>
                        <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(zoom + 10)} className="p-1.5 hover:bg-gray-100 rounded"><ZoomIn size={16} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {error && <span className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded">{error}</span>}
                    <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all shadow-sm">
                        {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                        {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Pages Container - Vertical Scroll */}
            <div className="flex-1 overflow-auto bg-[#e5e7eb] p-8">
                <div className="flex flex-col gap-8 items-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                    {pages.map((page, pageIndex) => (
                        <div key={page.id} className="relative">
                            {/* Page Header */}
                            <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-4 py-2 bg-white rounded-t-lg shadow-sm">
                                <span className="text-sm font-medium text-gray-700">Page {pageIndex + 1}</span>
                                {pages.length > 1 && (
                                    <button
                                        onClick={() => removePage(pageIndex)}
                                        disabled={pages.length <= 1}
                                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Page Content */}
                            <div className="relative shadow-2xl bg-white">
                                {showGrid && (
                                    <div className="absolute inset-0 pointer-events-none z-0" style={{
                                        backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                                        backgroundSize: '20px 20px',
                                        width: `${A4_WIDTH}px`,
                                        height: `${A4_HEIGHT}px`
                                    }} />
                                )}

                                <div
                                    ref={pageIndex === 0 ? canvasRef : null}
                                    onClick={() => {
                                        if (!isDragging) {
                                            selectElement(null);
                                            setEditingId(null)
                                        }
                                    }}
                                    style={{
                                        width: `${A4_WIDTH}px`,
                                        height: `${A4_HEIGHT}px`,
                                        position: 'relative',
                                        cursor: isDragging ? 'grabbing' : 'default'
                                    }}
                                >
                                    <PDFRenderer
                                        elements={page.elements}
                                        showSelection={true}
                                        selectedIds={selectedIds}
                                        editingId={editingId}
                                        onElementMouseDown={handleElementMouseDown}
                                        onContentChange={(id, content) => updateElement(id, { content })}
                                        onBlur={() => setEditingId(null)}
                                        width={A4_WIDTH}
                                        height={A4_HEIGHT}
                                    />
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="absolute -bottom-8 left-0 right-0 text-center">
                                <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                                    {page.elements.length} elements
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Add Page Button */}
            <div className="fixed bottom-8 right-8">
                <button
                    onClick={handleAddPage}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    <span className="font-medium">Add Page</span>
                </button>
            </div>

            {/* Status Bar */}
            <div className="h-8 bg-white border-t border-gray-200 flex items-center px-4 text-xs text-gray-500 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <span>A4 ({A4_WIDTH} × {A4_HEIGHT}px)</span>
                    <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
                    <span>{pages.reduce((total, page) => total + page.elements.length, 0)} total elements</span>
                    <span className="text-green-600">● Production Mode</span>
                </div>
            </div>
        </main>
    )
}