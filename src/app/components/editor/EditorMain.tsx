'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import PDFRenderer from './PDFRenderer'
import { Loader2, Grid, ArrowDownToLine, ZoomIn, ZoomOut, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { flushSync } from 'react-dom'
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts'
import LivePDFPreview from './LivePDFPreview'

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

    // ✅ FIXED: Use a Map of refs — one per page — instead of one ref for page 0 only.
    // This makes drag coordinates correct on ALL pages, not just page 0.
    const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())
    const [showGrid, setShowGrid] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    // The page-0 ref for LivePDFPreview (it captures the DOM directly)
    const page0Ref = useRef<HTMLDivElement | null>(null)

    useKeyboardShortcuts()

    // ── PDF Export ──────────────────────────────────────────────────────────────
    const handleDownloadPDF = useCallback(async () => {
        setError(null)

        flushSync(() => {
            setEditingId(null)
            selectElement(null)
        })

        setGeneratingPDF(true)
        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pages: pages.map((page, idx) => ({
                        id: page.id || `page-${idx}`,
                        elements: page.elements
                    })),
                    title: docTitle || 'document',
                    width: A4_WIDTH,
                    height: A4_HEIGHT,
                })
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'PDF generation failed' }))
                throw new Error(errData.error || `HTTP ${response.status}`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${(docTitle || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf`
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

    // ── Drag state ──────────────────────────────────────────────────────────────
    const [isDragging, setIsDragging] = useState(false)
    const [activeElementId, setActiveElementId] = useState<string | null>(null)
    const [activePageIndex, setActivePageIndex] = useState<number>(0)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, elX: 0, elY: 0 })

    const handleElementMouseDown = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation()

        // Find element and its page index
        let foundElement = null
        let foundPageIndex = 0
        for (let i = 0; i < pages.length; i++) {
            const el = pages[i].elements.find(el => el.id === id)
            if (el) { foundElement = el; foundPageIndex = i; break }
        }
        if (!foundElement) return

        setIsDragging(true)
        setActiveElementId(id)
        setActivePageIndex(foundPageIndex)
        selectElement(id)

        // ✅ FIXED: Use the correct page's ref, not always page 0
        const pageRef = pageRefsMap.current.get(foundPageIndex)
        const rect = pageRef?.getBoundingClientRect()
        const scale = zoom / 100
        const rawX = rect ? (e.clientX - rect.left) / scale : 0
        const rawY = rect ? (e.clientY - rect.top) / scale : 0

        setDragStart({ x: rawX, y: rawY, elX: foundElement.x, elY: foundElement.y })
    }, [pages, zoom, selectElement])

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!activeElementId) return
            // ✅ FIXED: Use the active page's ref for coordinate calculation
            const pageRef = pageRefsMap.current.get(activePageIndex)
            const rect = pageRef?.getBoundingClientRect()
            if (!rect) return
            const scale = zoom / 100
            const rawX = (e.clientX - rect.left) / scale
            const rawY = (e.clientY - rect.top) / scale
            const dx = rawX - dragStart.x
            const dy = rawY - dragStart.y

            // Clamp to A4 bounds
            const newX = Math.round(Math.max(0, dragStart.elX + dx))
            const newY = Math.round(Math.max(0, dragStart.elY + dy))
            moveElement(activeElementId, newX, newY)
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
    }, [isDragging, dragStart, activeElementId, activePageIndex, zoom, moveElement])

    const handleAddPage = () => {
        addPage()
        setTimeout(() => {
            const last = document.querySelector('[data-page-index]')
            if (last) {
                const all = document.querySelectorAll('[data-page-index]')
                all[all.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }, 100)
    }

    const clampedZoom = Math.max(25, Math.min(200, zoom))

    return (
        <main className="flex-1 bg-gray-100 h-full flex flex-col overflow-hidden">
            {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-20 gap-3">
                {/* Left: doc title + grid + zoom */}
                <div className="flex items-center gap-3 min-w-0">
                    <input
                        type="text"
                        value={docTitle}
                        onChange={e => setDocTitle(e.target.value)}
                        className="font-semibold text-base bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 max-w-[200px] truncate"
                        placeholder="Untitled Document"
                    />
                    <div className="h-5 w-px bg-gray-200 shrink-0" />
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${showGrid ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Grid size={14} /> Grid
                    </button>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 px-1">
                        <button onClick={() => setZoom(Math.max(25, zoom - 10))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                            <ZoomOut size={13} />
                        </button>
                        <span className="text-xs font-semibold text-gray-700 w-10 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                            <ZoomIn size={13} />
                        </button>
                    </div>
                </div>

                {/* Right: error + preview + export */}
                <div className="flex items-center gap-2 shrink-0">
                    {error && (
                        <span className="text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-1 rounded-lg max-w-[220px] truncate">
                            {error}
                        </span>
                    )}

                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Eye size={14} /> Preview
                    </button>

                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                    >
                        {isGeneratingPDF
                            ? <><Loader2 size={14} className="animate-spin" /> Exporting…</>
                            : <><ArrowDownToLine size={14} /> Export PDF</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Canvas Area ───────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto bg-[#e8eaed]">
                <div
                    className="flex flex-col items-center gap-10 py-10 px-8"
                    style={{
                        // ✅ FIXED: Scale the entire column, not each page individually.
                        // transformOrigin: 'top center' ensures pages scale from top, not center.
                        transform: `scale(${clampedZoom / 100})`,
                        transformOrigin: 'top center',
                        // Reserve enough space so scrolling works correctly at all zoom levels
                        minHeight: `${(A4_HEIGHT + 120) * pages.length * (clampedZoom / 100) + 80}px`,
                        minWidth: `${(A4_WIDTH + 80) * (clampedZoom / 100)}px`,
                    }}
                >
                    {pages.map((page, pageIndex) => (
                        <div
                            key={page.id || `page-${pageIndex}`}
                            data-page-index={pageIndex}
                            className="relative"
                        >
                            {/* Page label above */}
                            <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-1">
                                <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-t-md shadow-sm border border-b-0 border-gray-200">
                                    Page {pageIndex + 1}
                                </span>
                                {pages.length > 1 && (
                                    <button
                                        onClick={() => removePage(pageIndex)}
                                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                                        title="Remove this page"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Page canvas */}
                            <div
                                className="relative bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.08)] rounded-sm"
                                style={{ width: A4_WIDTH, height: A4_HEIGHT }}
                            >
                                {/* Grid overlay */}
                                {showGrid && (
                                    <div
                                        className="absolute inset-0 pointer-events-none z-0 rounded-sm"
                                        style={{
                                            backgroundImage: `
                        linear-gradient(to right, rgba(156,163,175,0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(156,163,175,0.2) 1px, transparent 1px)
                      `,
                                            backgroundSize: '20px 20px',
                                        }}
                                    />
                                )}

                                {/* Click-away deselect */}
                                <div
                                    // ✅ FIXED: Register ref in the Map for this specific page
                                    ref={el => {
                                        if (el) {
                                            pageRefsMap.current.set(pageIndex, el)
                                            if (pageIndex === 0) page0Ref.current = el
                                        }
                                    }}
                                    className="absolute inset-0"
                                    style={{
                                        width: A4_WIDTH,
                                        height: A4_HEIGHT,
                                        cursor: isDragging ? 'grabbing' : 'default',
                                    }}
                                    onClick={() => {
                                        if (!isDragging) {
                                            selectElement(null)
                                            setEditingId(null)
                                        }
                                    }}
                                >
                                    <PDFRenderer
                                        elements={page.elements}
                                        showSelection
                                        selectedIds={selectedIds}
                                        editingId={editingId}
                                        onElementMouseDown={handleElementMouseDown}
                                        onElementDoubleClick={(id) => setEditingId(id)}
                                        onContentChange={(id, content) => updateElement(id, { content })}
                                        onResize={(id, w, h) => resizeElement(id, w, h)}
                                        onBlur={() => setEditingId(null)}
                                        width={A4_WIDTH}
                                        height={A4_HEIGHT}
                                        zoom={clampedZoom}
                                    />
                                </div>
                            </div>

                            {/* Element count badge below */}
                            <div className="absolute -bottom-7 left-0 right-0 flex justify-center">
                                <span className="text-[10px] text-gray-400 bg-white px-2.5 py-1 rounded-b-md shadow-sm border border-t-0 border-gray-200 font-medium">
                                    {page.elements.length} element{page.elements.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Add Page FAB ──────────────────────────────────────────────────────── */}
            <div className="fixed bottom-8 right-8 z-30">
                <button
                    onClick={handleAddPage}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 font-medium text-sm"
                >
                    <Plus size={18} /> Add Page
                </button>
            </div>

            {/* ── Status bar ───────────────────────────────────────────────────────── */}
            <div className="h-7 bg-white border-t border-gray-200 flex items-center px-4 text-[11px] text-gray-400 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <span>A4 — {A4_WIDTH}×{A4_HEIGHT}px</span>
                    <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
                    <span>{pages.reduce((t, p) => t + p.elements.length, 0)} elements</span>
                    {selectedIds.length > 0 && (
                        <span className="text-blue-500 font-semibold">{selectedIds.length} selected</span>
                    )}
                </div>
                <span className="text-green-500 font-semibold">● Ready</span>
            </div>

            {/* ── Live Preview Modal ───────────────────────────────────────────────── */}
            <LivePDFPreview
                canvasRef={page0Ref}
                isVisible={showPreview}
                onClose={() => setShowPreview(false)}
            />
        </main>
    )
}