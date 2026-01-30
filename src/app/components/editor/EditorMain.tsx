'use client'
import React, { useRef } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import ResizableElement from './ResizableElement'

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
        removeElement
    } = useEditorStore()

    const [editingId, setEditingId] = React.useState<string | null>(null)
    const canvasRef = useRef<HTMLDivElement>(null)

    // A4 page dimensions in pixels (at 96 DPI: 210mm = 793px, 297mm = 1123px)
    const A4_WIDTH = 794
    const A4_HEIGHT = 1123
    const PAGE_MARGIN = 40

    // Auto-save logic
    React.useEffect(() => {
        const savedData = localStorage.getItem('pdf-craft-pro-draft')
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData)
                if (parsed.elements) {
                    // Restore from localStorage if needed
                }
            } catch (e) {
                console.error('Failed to restore draft')
            }
        }
    }, [])

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            const data = JSON.stringify({ elements, docTitle })
            localStorage.setItem('pdf-craft-pro-draft', data)
        }, 1000)
        return () => clearTimeout(timeoutId)
    }, [elements, docTitle])

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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

    // Drop zone handler for new items
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

    return (
        <main className="flex-1 bg-gray-100 overflow-auto h-[calc(100vh-64px)] p-8 flex justify-center items-start">
            <div
                ref={canvasRef}
                className="relative bg-white shadow-lg mt-8"
                style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                    padding: `${PAGE_MARGIN}px`
                }}
                onDrop={handleCanvasDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={handleCanvasClick}
            >
                {/* Page Background Grid (optional) */}
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Document Title */}
                {showTitle && (
                    <div
                        className="absolute text-4xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-6"
                        style={{
                            left: `${PAGE_MARGIN}px`,
                            top: `${PAGE_MARGIN}px`,
                            width: `${A4_WIDTH - PAGE_MARGIN * 2}px`,
                            minHeight: '60px'
                        }}
                    >
                        <input
                            type="text"
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            className="w-full text-4xl font-bold bg-transparent outline-none border-none"
                            placeholder="Untitled Document"
                        />
                    </div>
                )}

                {/* Canvas Elements */}
                {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                        <div className="text-center">
                            <p className="text-xl font-medium mb-2">Drag items from the sidebar</p>
                            <p className="text-sm">or use the elements panel to get started</p>
                        </div>
                    </div>
                )}

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
        </main>
    )
}
