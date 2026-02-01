'use client'
import React, { useRef, useState, useEffect } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import ResizableElement from './ResizableElement'
import { downloadPDF } from '@/app/lib/pdf-service'
import LivePDFPreview from './LivePDFPreview'
import { Loader2, MousePointer2, Move, Maximize, Grid, ArrowDownToLine, LayoutTemplate, FileText, Save, Clock } from 'lucide-react'
import ErrorBoundary from '../ErrorBoundary'
import { useAutoSave } from '@/app/hooks/useAutoSave'
import LoadingSpinner from '../LoadingSpinner'

export default function EditorMain() {
    const {
        elements,
        selectedId,
        selectElement,
        updateElement,
        addElement,
        addSocialIcon,
        addLine,
        showTitle,
        docTitle,
        setDocTitle,
        moveElement,
        resizeElement,
        removeElement,
        showPreview,
        setShowPreview,
        isSidebarCollapsed,
        isAutoSaving,
        lastSaved
    } = useEditorStore()

    const { lastSaved: autoSaveLastSaved } = useAutoSave(30000) // 30 seconds

    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [showGrid, setShowGrid] = useState(true)
    const [showRulers, setShowRulers] = useState(true)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [isLoading, setIsLoading] = useState(false)

    const canvasRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // A4 page dimensions in pixels (at 96 DPI: 210mm = 793px, 297mm = 1123px)
    const A4_WIDTH = 794
    const A4_HEIGHT = 1123
    const PAGE_MARGIN = 40

    const selectedElement = elements.find(el => el.id === selectedId)

    // Download PDF using html2canvas for perfect WYSIWYG
    const handleDownloadPDF = async () => {
        if (!canvasRef.current) return

        // Deselect element to ensure no UI artifacts (selection rings/blue lines) are captured
        selectElement(null)
        setEditingId(null)

        // Short delay to allow React to render the deselected state
        await new Promise(resolve => setTimeout(resolve, 50))

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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent shortcuts when typing in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

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

            // Ctrl+S or Cmd+S - save document
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                // Trigger save
                console.log('Save shortcut triggered')
                return
            }

            // Ctrl+Z or Cmd+Z - undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                // Undo functionality would go here
                console.log('Undo shortcut triggered')
                return
            }

            // Ctrl+Shift+Z or Cmd+Shift+Z - redo
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault()
                // Redo functionality would go here
                console.log('Redo shortcut triggered')
                return
            }

            // Ctrl+A or Cmd+A - select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault()
                // Select all functionality would go here
                console.log('Select all shortcut triggered')
                return
            }

            // Delete or Backspace - delete selected element
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                e.preventDefault()
                removeElement(selectedId)
                selectElement(null)
                return
            }

            // Escape - deselect
            if (e.key === 'Escape') {
                selectElement(null)
                setEditingId(null)
                return
            }

            // Arrow keys - move selected element
            if (selectedId && selectedElement) {
                const moveAmount = e.shiftKey ? 10 : 1 // Move faster with Shift
                
                switch(e.key) {
                    case 'ArrowUp':
                        e.preventDefault()
                        moveElement(selectedId, selectedElement.x, selectedElement.y - moveAmount)
                        break
                    case 'ArrowDown':
                        e.preventDefault()
                        moveElement(selectedId, selectedElement.x, selectedElement.y + moveAmount)
                        break
                    case 'ArrowLeft':
                        e.preventDefault()
                        moveElement(selectedId, selectedElement.x - moveAmount, selectedElement.y)
                        break
                    case 'ArrowRight':
                        e.preventDefault()
                        moveElement(selectedId, selectedElement.x + moveAmount, selectedElement.y)
                        break
                }
            }

            // Number keys - quick add elements
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault()
                        addElement('heading')
                        break
                    case '2':
                        e.preventDefault()
                        addElement('paragraph')
                        break
                    case '3':
                        e.preventDefault()
                        addElement('list')
                        break
                    case '4':
                        e.preventDefault()
                        addElement('link')
                        break
                    case '5':
                        e.preventDefault()
                        addLine('horizontal')
                        break
                    case '6':
                        e.preventDefault()
                        addLine('vertical')
                        break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedId, selectedElement, removeElement, selectElement, moveElement, addElement, addLine, showGrid, handleDownloadPDF])

    // Auto-save logic
    useEffect(() => {
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

    const handleMouseMove = (e: React.MouseEvent) => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            setMousePos({
                x: Math.round(e.clientX - rect.left),
                y: Math.round(e.clientY - rect.top)
            })
        }
    }

    return (
        <ErrorBoundary>
            <main className="flex-1 bg-gray-100/50 overflow-hidden h-[calc(100vh-64px)] flex flex-col relative">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showGrid
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        title="Toggle grid (Ctrl+G)"
                    >
                        <Grid size={14} />
                        Grid
                    </button>
                    <button
                        onClick={() => setShowRulers(!showRulers)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showRulers
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        title="Toggle rulers"
                    >
                        <LayoutTemplate size={14} />
                        Rulers
                    </button>
                </div>

                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium text-xs transition-all shadow-sm active:scale-95"
                    title="Download PDF (Ctrl+D)"
                >
                    {isGeneratingPDF ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            {/* Workspace Container */}
            <div className="flex-1 flex overflow-hidden bg-[#E5E7EB] relative">
                {/* Editor Section */}
                <div
                    ref={containerRef}
                    className={`
                        flex-1 flex justify-center items-start overflow-auto p-8 lg:p-12 
                        transition-all duration-300 ease-in-out scroll-smooth
                        ${showPreview ? 'mr-[450px]' : 'mr-0'}
                    `}
                >
                    <div className="relative shadow-2xl transition-transform duration-200">
                        {/* Vertical Ruler */}
                        {showRulers && (
                            <div
                                className="absolute -left-10 top-0 w-10 h-[1123px] bg-white border-r border-gray-200 text-[10px] select-none pointer-events-none font-mono text-gray-400"
                            >
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <div key={i} className="h-[37.4px] border-b border-gray-100 flex items-center justify-end pr-1 relative">
                                        {i % 2 === 0 && <span className="absolute right-1 top-[-6px]">{i * 10}</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Horizontal Ruler */}
                        {showRulers && (
                            <div
                                className="absolute -top-10 left-0 w-[794px] h-10 bg-white border-b border-gray-200 text-[10px] select-none pointer-events-none flex font-mono text-gray-400"
                            >
                                {Array.from({ length: 21 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 border-r border-gray-100 flex items-end justify-center pb-1 relative"
                                    >
                                        {i % 2 === 0 && <span className="absolute bottom-1 left-[-4px]">{i * 10}</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Canvas */}
                        <div
                            ref={canvasRef}
                            className="editor-canvas relative bg-white cursor-crosshair print:shadow-none"
                            style={{
                                width: `${A4_WIDTH}px`,
                                height: `${A4_HEIGHT}px`,
                                padding: `${PAGE_MARGIN}px`,
                                boxSizing: 'border-box',
                                direction: 'ltr',
                                textAlign: 'left'
                            }}
                            onDrop={handleCanvasDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={handleCanvasClick}
                            onMouseMove={handleMouseMove}
                        >
                            {/* Grid Background */}
                            {showGrid && (
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(#000 1px, transparent 1px),
                                            linear-gradient(90deg, #000 1px, transparent 1px)
                                        `,
                                        backgroundSize: '20px 20px'
                                    }}
                                />
                            )}

                            {/* Empty State */}
                            {elements.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                                    <div className="text-center text-gray-300">
                                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-xl font-medium mb-2">Build your document</p>
                                        <p className="text-sm">Drag elements from the sidebar</p>
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

                {/* Preview Drawer - Slide In */}
                <div
                    className={`
                        fixed right-0 top-[64px] bottom-0 w-[450px]
                        bg-white border-l border-gray-200 shadow-2xl z-20 
                        transform transition-transform duration-300 ease-in-out flex flex-col
                        ${showPreview ? 'translate-x-0' : 'translate-x-full'}
                    `}
                >
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live Preview
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-0.5 ml-4">100% Scale Match</p>
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                        >
                            <Maximize size={16} className="rotate-45" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-6 bg-gray-100/50 flex flex-col items-center">
                        <div className="relative shadow-xl origin-top transition-transform duration-200 scale-[0.5] sm:scale-[0.55]"
                            style={{ width: '794px', height: '1123px', marginTop: '-25%' }}>
                            <LivePDFPreview canvasRef={canvasRef} isVisible={showPreview} onClose={() => { }} inline={true} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Status Bar */}
            <div className="h-7 bg-white border-t border-gray-200 flex items-center px-4 text-[10px] font-medium text-gray-500 select-none z-30 justify-between">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <FileText size={10} />
                        A4 ({A4_WIDTH}×{A4_HEIGHT}px)
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-400">|</span>
                    <span className="flex items-center gap-1.5">
                        <LayoutTemplate size={10} />
                        Elements: {elements.length}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-400">|</span>
                    <span className="flex items-center gap-1.5 w-24 font-mono">
                        <MousePointer2 size={10} />
                        X: {mousePos.x} Y: {mousePos.y}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {selectedElement && (
                        <>
                            <span className="flex items-center gap-1.5 text-blue-600">
                                <Move size={10} />
                                Selected: {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-400">|</span>
                        </>
                    )}
                    {isAutoSaving && (
                        <>
                            <span className="flex items-center gap-1.5 text-green-600">
                                <Clock size={10} />
                                Auto-save: {autoSaveLastSaved ? autoSaveLastSaved.toLocaleTimeString() : 'Enabled'}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-400">|</span>
                        </>
                    )}
                    <span className="opacity-75 flex items-center gap-1">
                        <Save size={10} />
                        Ready
                    </span>
                </div>
            </div>
            </main>
        </ErrorBoundary>
    )
}
