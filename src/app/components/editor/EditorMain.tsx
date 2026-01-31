'use client'
import React, { useRef, useState, useEffect } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import ResizableElement from './ResizableElement'
import { downloadPDF } from '@/app/lib/pdf-service'
import EditorLayout from '../EditorLayout'
import EditorSidebar from './EditorSidebar'
import { Grid, Ruler, Download, Eye, Maximize2, Undo2, Redo2 } from 'lucide-react'

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
    duplicateElement,
    undo,
    redo
  } = useEditorStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // A4 page dimensions in pixels
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123
  const PAGE_MARGIN = 40

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }

      // Grid
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setShowGrid(prev => !prev)
        return
      }

      // Download/Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleDownloadPDF()
        return
      }

      if (!selectedId) return

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateElement(selectedId)
        return
      }

      // Delete
      if (e.key === 'Delete') {
        removeElement(selectedId)
        selectElement(null)
        return
      }

      // Deselect
      if (e.key === 'Escape') {
        selectElement(null)
        setEditingId(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, elements, undo, redo, duplicateElement, removeElement, selectElement])

  // Auto-save logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const data = JSON.stringify({ elements, docTitle })
      localStorage.setItem('pdf-craft-pro-draft', data)
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [elements, docTitle])

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

  const handleDownloadPDF = async () => {
    if (!canvasRef.current) return

    setIsGeneratingPDF(true)
    try {
      await downloadPDF(
        canvasRef.current,
        `${docTitle.replace(/\s+/g, '-').toLowerCase() || 'document'}.pdf`,
        {
          quality: 2,
          scale: 3,
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
    <EditorLayout sidebar={<EditorSidebar />}>
      <div className="h-full flex flex-col">
        {/* Enhanced Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-tighter uppercase">Document</span>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="text-sm font-semibold bg-transparent outline-none hover:bg-gray-50 px-2 py-1 rounded transition-colors w-48 truncate focus:bg-white focus:ring-1 focus:ring-blue-100"
              placeholder="Untitled Document"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={redo}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-gray-200 mx-2" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-all ${showGrid ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Toggle Grid (Ctrl+G)"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setShowRulers(!showRulers)}
              className={`p-2 rounded-lg transition-all ${showRulers ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Toggle Rulers"
            >
              <Ruler size={18} />
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 shadow-sm uppercase tracking-tighter">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Design
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-bold text-sm transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-95 group"
            >
              <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              {isGeneratingPDF ? 'Creating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Professional Workspace */}
        <div className="flex-1 overflow-auto bg-[#eef2f6] custom-scrollbar relative selection:bg-blue-100">
          <div className="min-w-fit min-h-fit p-16 flex justify-center">
            <div className="relative group">
              {/* Rulers */}
              {showRulers && (
                <>
                  <div className="absolute -left-10 top-0 w-10 h-[1123px] bg-white/80 backdrop-blur-sm border-r border-gray-200 text-[9px] select-none pointer-events-none overflow-hidden shadow-sm">
                    {Array.from({ length: 60 }).map((_, i) => (
                      <div key={i} className={`h-[18.7px] flex items-center justify-end pr-1.5 border-b border-gray-100/50 ${i % 5 === 0 ? 'text-gray-500 font-bold border-gray-300' : 'text-transparent'}`}>
                        {i % 5 === 0 && i * 20}
                      </div>
                    ))}
                  </div>
                  <div className="absolute -top-10 left-0 w-[794px] h-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 text-[9px] select-none pointer-events-none flex overflow-hidden shadow-sm">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className={`flex-1 flex items-end justify-center pb-1.5 border-r border-gray-100/50 ${i % 5 === 0 ? 'text-gray-500 font-bold border-gray-300' : 'text-transparent'}`}>
                        {i % 5 === 0 && i * 20}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Main Canvas */}
              <div
                ref={canvasRef}
                className="editor-canvas relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
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
                {/* Visual Grid */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
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
        </div>

        {/* Premium Status Bar */}
        <div className="h-9 bg-white border-t border-gray-200 flex items-center px-6 text-[11px] font-semibold text-gray-500 gap-6 shadow-[0_-1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="uppercase tracking-wider">A4 Standard</span>
            <span className="text-gray-300">•</span>
            <span>794 × 1123 PX</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <span className="flex items-center gap-1.5 text-green-600">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              SYNCHRONIZED
            </span>
            <div className="h-4 w-[1px] bg-gray-200" />
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 text-[10px]">CTRL+G</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 text-[10px]">CTRL+D</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 text-[10px]">CTRL+Z</kbd>
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  )
}
