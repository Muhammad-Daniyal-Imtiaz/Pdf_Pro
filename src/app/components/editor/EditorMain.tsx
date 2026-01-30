'use client'
import React, { useRef, useState } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import ResizableElement from './ResizableElement'
import { downloadPDF } from '@/app/lib/pdf-service'
import LivePDFPreview from './LivePDFPreview'

export default function EditorMain() {
    const {
        elements,
        selectedId,
        selectElement,
        updateElement,
        addElement,
        showTitle,
        docTitle,
        setDocTitle,
        moveElement,
        resizeElement,
        removeElement,
        showPreview,
        setShowPreview
    } = useEditorStore()

    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [showGrid, setShowGrid] = useState(true)
    const [showRulers, setShowRulers] = useState(true)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const canvasRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // A4 page dimensions in pixels (at 96 DPI: 210mm = 793px, 297mm = 1123px)
    const A4_WIDTH = 794
    const A4_HEIGHT = 1123
    const PAGE_MARGIN = 40

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+G or Cmd+G - toggle grid
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault()
                setShowGrid(prev => !prev)
                return
            }

            // Ctrl+D or Cmd+D - download PDF
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault()
                handleDownloadPDF()
                return
            }

            if (!selectedId) return

            // Delete Element
            if (e.key === 'Delete') {
                removeElement(selectedId)
                selectElement(null)
                return
            }

            // Escape to deselect
            if (e.key === 'Escape') {
                selectElement(null)
                setEditingId(null)
                return
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedId, removeElement, selectElement])

    // Auto-save logic
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            const data = JSON.stringify({ elements, docTitle })
            localStorage.setItem('pdf-craft-pro-draft', data)
        }, 1000)
        return () => clearTimeout(timeoutId)
    }, [elements, docTitle])

    // Drop zone handler
    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const type = e.dataTransfer.getData('application/react-dnd-type')
        if (type && type !== 'SORTABLE_ITEM') {
            addElement(type as any)
        }
    }

    const handleCanvasClick = () => {
        selectElement(null)
        setEditingId(null)
    }

    const handleElementChange = (id: string, content: string) => {
        updateElement(id, { content })
    }

    // Download PDF using html2canvas for perfect WYSIWYG
    const handleDownloadPDF = async () => {
        if (!canvasRef.current) return

        setIsGeneratingPDF(true)
        try {
            await downloadPDF(
                canvasRef.current,
                `${docTitle.replace(/\s+/g, '-').toLowerCase() || 'document'}.pdf`,
                {
                    quality: 2,
                    scale: 2,
                    debug: false
                }
            )
        } catch (error) {
            console.error('Failed to generate PDF:', error)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    return (
        <main className="flex-1 bg-gray-100 overflow-auto h-[calc(100vh-64px)] p-8 flex flex-col">
            {/* Toolbar */}
            <div className="mb-4 flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${showGrid
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    title="Toggle grid (Ctrl+G)"
                >
                    Grid
                </button>
                <button
                    onClick={() => setShowRulers(!showRulers)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${showRulers
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    title="Toggle rulers"
                >
                    Rulers
                </button>
                <div className="flex-1" />
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded font-medium text-sm transition-colors"
                    title="Download PDF (Ctrl+D)"
                >
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            {/* Workspace Container */}
            <div className="flex-1 flex overflow-hidden bg-gray-200">
                {/* Editor Section */}
                <div ref={containerRef} className={`flex-1 flex justify-center items-start overflow-auto p-12 transition-all duration-300 ${showPreview ? 'w-1/2' : 'w-full'}`}>
                    <div className="relative">
                        {/* Vertical Ruler */}
                        {showRulers && (
                            <div
                                className="absolute -left-12 top-0 w-10 h-[1123px] border-r text-xs select-none pointer-events-none"
                                style={{ backgroundColor: '#e5e7eb', borderColor: '#d1d5db', color: '#4b5563' }}
                            >
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <div key={i} className="h-[37.4px] border-b flex items-center justify-end pr-1" style={{ borderColor: '#d1d5db' }}>
                                        {i % 5 === 0 && `${i}`}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Horizontal Ruler */}
                        {showRulers && (
                            <div
                                className="absolute -top-12 left-0 w-[794px] h-10 border-b text-xs select-none pointer-events-none flex"
                                style={{ backgroundColor: '#e5e7eb', borderColor: '#d1d5db', color: '#4b5563' }}
                            >
                                {Array.from({ length: 21 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 border-r flex items-end justify-center pb-1"
                                        style={{ borderColor: '#d1d5db' }}
                                    >
                                        {i % 5 === 0 && `${i}`}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Canvas */}
                        <div
                            ref={canvasRef}
                            className="editor-canvas relative bg-white shadow-xl"
                            style={{
                                width: `${A4_WIDTH}px`,
                                height: `${A4_HEIGHT}px`,
                                padding: `${PAGE_MARGIN}px`,
                                boxSizing: 'border-box'
                            }}
                            onDrop={handleCanvasDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={handleCanvasClick}
                        >
                            {/* Grid Background */}
                            {showGrid && (
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-10"
                                    style={{
                                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.1) 25%, rgba(0,0,0,.1) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0,0,0,.1) 25%, rgba(0,0,0,.1) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1) 76%, transparent 77%, transparent)',
                                        backgroundSize: '40px 40px'
                                    }}
                                />
                            )}

                            {/* Document Title */}
                            {showTitle && (
                                <div
                                    className="absolute text-4xl font-bold border-b-2 pb-3"
                                    style={{
                                        left: `${PAGE_MARGIN}px`,
                                        top: `${PAGE_MARGIN}px`,
                                        width: `${A4_WIDTH - PAGE_MARGIN * 2}px`,
                                        minHeight: '60px',
                                        color: '#111827',
                                        borderColor: '#e5e7eb'
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={docTitle}
                                        onChange={(e) => setDocTitle(e.target.value)}
                                        className="w-full text-4xl font-bold bg-transparent outline-none border-none"
                                        style={{ color: '#111827' }}
                                        placeholder="Untitled Document"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}

                            {/* Empty State */}
                            {elements.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: '#d1d5db' }}>
                                    <div className="text-center">
                                        <p className="text-xl font-medium mb-2">Drag items from the sidebar</p>
                                        <p className="text-sm">or use the elements panel to get started</p>
                                    </div>
                                </div>
                            )}

                            {/* Elements */}
                            {elements.map((el) => (
                                <ResizableElement
                                    key={el.id}
                                    el={el}
                                    isSelected={selectedId === el.id}
                                    onSelect={selectElement}
                                    onMove={moveElement}
                                    onResize={resizeElement}
                                    onChange={handleElementChange}
                                    isEditing={editingId}
                                    setIsEditing={setEditingId}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                {showPreview && (
                    <div className="w-[450px] border-l border-gray-300 bg-gray-100 flex flex-col shadow-inner">
                        <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Live PDF Preview
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex flex-col items-center bg-gray-300 shadow-inner">
                            <div className="relative bg-white shadow-2xl"
                                style={{ width: '794px', height: '1123px' }}>
                                <LivePDFPreview canvasRef={canvasRef} isVisible={true} onClose={() => { }} inline={true} />
                            </div>
                            <div className="mt-8 mb-12 text-[12px] text-gray-600 font-medium bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                                <p>100% Actual Scale • Pixel-Perfect Mirror</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="mt-4 h-8 bg-white border-t border-gray-200 flex items-center px-4 text-xs text-gray-600">
                <span>A4 Page • {A4_WIDTH}×{A4_HEIGHT}px • {elements.length} elements</span>
                <div className="flex-1" />
                <span>Ctrl+G: Grid • Ctrl+D: Download PDF</span>
            </div>
        </main>
    )
}
