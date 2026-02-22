'use client'
import React, { useEffect, useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { useEditorStore } from '@/app/store/useEditorStore'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'

interface LivePDFPreviewProps {
    canvasRef: React.RefObject<HTMLDivElement | null>
    isVisible: boolean
    onClose?: () => void
    inline?: boolean
}

export default function LivePDFPreview({ canvasRef, isVisible, onClose, inline = false }: LivePDFPreviewProps) {
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewZoom, setPreviewZoom] = useState(80)

    // ✅ FIXED: was destructuring `elements` which doesn't exist on the store.
    // The store uses `pages`. Elements are derived from pages.
    const { pages, docTitle } = useEditorStore()

    // Capture ALL page canvases from the DOM
    const captureAllPages = useCallback(async () => {
        if (!isVisible) return

        setIsGenerating(true)
        try {
            // Find all .pdf-page elements in the document (one per page)
            const pageEls = document.querySelectorAll<HTMLDivElement>('.pdf-page')

            if (pageEls.length === 0 && canvasRef.current) {
                // Fallback: capture just the ref
                const canvas = await html2canvas(canvasRef.current, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    removeContainer: false,
                    // Ignore selection indicators / UI chrome
                    ignoreElements: (el) => {
                        return el.hasAttribute('data-html2canvas-ignore') ||
                            el.classList.contains('SelectionRing') ||
                            el.classList.contains('SelectionLabel')
                    }
                })
                setPreviewImages([canvas.toDataURL('image/png', 0.92)])
                return
            }

            const images: string[] = []
            for (const pageEl of Array.from(pageEls)) {
                const canvas = await html2canvas(pageEl, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    removeContainer: false,
                    ignoreElements: (el) => {
                        return el.hasAttribute('data-html2canvas-ignore') ||
                            el.classList.contains('SelectionRing') ||
                            el.classList.contains('SelectionLabel')
                    }
                })
                images.push(canvas.toDataURL('image/png', 0.92))
            }
            setPreviewImages(images)
        } catch (err) {
            console.error('[LivePDFPreview] Capture error:', err)
        } finally {
            setIsGenerating(false)
        }
    }, [isVisible, canvasRef])

    // ✅ FIXED: was listening to `elements` (doesn't exist). Now listens to `pages`.
    useEffect(() => {
        if (!isVisible) return

        let timeoutId: NodeJS.Timeout

        // MutationObserver: catches DOM changes not driven by store (e.g. direct edits)
        const observer = new MutationObserver(() => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(captureAllPages, 500)
        })

        if (canvasRef.current) {
            observer.observe(canvasRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            })
        }

        // Initial capture when opened
        timeoutId = setTimeout(captureAllPages, 300)

        return () => {
            observer.disconnect()
            clearTimeout(timeoutId)
        }
    }, [isVisible, pages, captureAllPages, canvasRef])

    if (!isVisible) return null

    const PreviewContent = (
        <div className={`flex flex-col items-center gap-6 ${inline ? 'w-full' : 'p-6'}`}>
            {isGenerating && previewImages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs font-semibold tracking-wider uppercase animate-pulse">Generating Preview…</p>
                </div>
            )}

            {previewImages.map((src, idx) => (
                <div key={idx} className="relative shadow-2xl rounded-sm group">
                    {/* Page number badge */}
                    {previewImages.length > 1 && (
                        <div className="absolute -top-7 left-0 text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-t-md border border-b-0 border-gray-200">
                            Page {idx + 1} of {previewImages.length}
                        </div>
                    )}
                    <img
                        src={src}
                        alt={`PDF Page ${idx + 1}`}
                        className="border border-gray-200 rounded-sm block"
                        style={{ width: `${Math.round(595 * previewZoom / 100)}px`, display: 'block' }}
                    />
                    {/* Refresh overlay while updating */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center rounded-sm">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )

    if (inline) return <div className="overflow-auto">{PreviewContent}</div>

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">PDF Preview</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {docTitle} · {pages.length} page{pages.length !== 1 ? 's' : ''} ·{' '}
                            <span className={isGenerating ? 'text-amber-500 animate-pulse' : 'text-green-500'}>
                                {isGenerating ? 'Updating…' : 'Live'}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 px-1 py-0.5">
                            <button onClick={() => setPreviewZoom(z => Math.max(40, z - 10))}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                <ZoomOut size={14} />
                            </button>
                            <span className="text-xs font-semibold text-gray-600 w-10 text-center">{previewZoom}%</span>
                            <button onClick={() => setPreviewZoom(z => Math.min(150, z + 10))}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                <ZoomIn size={14} />
                            </button>
                        </div>
                        <button onClick={captureAllPages}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Refresh preview">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
                            </svg>
                        </button>
                        <button onClick={onClose}
                            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Preview area */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6">
                    {PreviewContent}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
                        <span>A4 · 595×842px</span>
                        <span>{pages.reduce((t, p) => t + p.elements.length, 0)} elements</span>
                        <span className="text-green-500 font-semibold">● WYSIWYG</span>
                    </div>
                    <p className="text-[10px] text-gray-400">What you see = what you get in the PDF</p>
                </div>
            </div>
        </div>
    )
}