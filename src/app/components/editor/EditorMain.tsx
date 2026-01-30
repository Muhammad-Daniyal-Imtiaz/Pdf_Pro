
'use client'


import React, { useRef } from 'react'
import { useEditorStore, EditorElement } from '../../store/useEditorStore'
import { useDrop, useDrag } from 'react-dnd'

export default function EditorMain() {
    const { elements, selectedId, selectElement, updateElement, addElement, showTitle, docTitle, reorderElements, setDocTitle } = useEditorStore()

    // Auto-save logic
    React.useEffect(() => {
        const savedData = localStorage.getItem('pdf-craft-pro-draft')
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData)
                if (parsed) {
                    if (parsed.docTitle) setDocTitle(parsed.docTitle)
                    if (parsed.elements && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
                        reorderElements(parsed.elements)
                    }
                }
            } catch (e) {
                console.error('Failed to parse draft', e)
            }
        }
    }, [setDocTitle, reorderElements])

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            const data = JSON.stringify({ elements, docTitle })
            localStorage.setItem('pdf-craft-pro-draft', data)
        }, 1000) // Debounce save
        return () => clearTimeout(timeoutId)
    }, [elements, docTitle])

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedId) return

            // Delete Element
            if (e.key === 'Delete') {
                const el = elements.find(e => e.id === selectedId)
                // Don't delete if editing text content (handled by browser) unless empty
                // Simple heuristic: if we are focused on the wrapper, we can delete
                // But for now, let's just enable Delete key if an element is selected
                // Note: Ideally we check if focus is NOT inside a contentEditable
                if (document.activeElement?.tagName !== 'H1' &&
                    document.activeElement?.tagName !== 'P' &&
                    document.activeElement?.tagName !== 'LI') {
                    // removeElement(selectedId) // Need to import removeElement
                }
            }

            // Formatting Shortcuts
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === 'b') {
                    e.preventDefault()
                    const el = elements.find(e => e.id === selectedId)
                    if (el) {
                        updateElement(selectedId, { style: { ...el.style, fontWeight: el.style.fontWeight === 'bold' ? 'normal' : 'bold' } })
                    }
                }
                if (e.key === 'i') {
                    e.preventDefault()
                    const el = elements.find(e => e.id === selectedId)
                    if (el) {
                        updateElement(selectedId, { style: { ...el.style, fontStyle: el.style.fontStyle === 'italic' ? 'normal' : 'italic' } })
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedId, elements, updateElement])

    // Drop zone handler for new items
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ['heading', 'paragraph', 'list', 'image', 'divider'],
        drop: (item: any, monitor) => {
            const type = monitor.getItemType() as any
            // Only add if it's NOT a reorder drag (reorder type is SORTABLE_ITEM)
            if (type && type !== 'SORTABLE_ITEM') {
                addElement(type)
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }))



    const moveElement = (dragIndex: number, hoverIndex: number) => {
        const draggedElement = elements[dragIndex]
        const newElements = [...elements]
        newElements.splice(dragIndex, 1)
        newElements.splice(hoverIndex, 0, draggedElement)
        reorderElements(newElements)
    }

    return (
        <main className="flex-1 bg-gray-100 overflow-y-auto h-[calc(100vh-64px)] p-8 flex justify-center">
            <div
                ref={(node) => { drop(node) }}
                className={`bg-white shadow-lg transition-colors ${isOver ? 'ring-4 ring-blue-200' : ''}`}
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '25mm',
                    position: 'relative',
                    ...(showTitle ? {} : { paddingTop: '15mm' })
                }}
                onClick={() => selectElement(null)}
            >
                {showTitle && (
                    <div className="mb-8 border-b border-transparent hover:border-blue-200 transition-colors pb-2">
                        <h1 className="text-4xl font-bold text-gray-900 break-words">{docTitle || 'Untitled Document'}</h1>
                    </div>
                )}

                {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                        <p className="text-xl font-medium">Drag items here</p>
                    </div>
                )}

                <div className="space-y-2">
                    {elements.map((el, index) => (
                        <DraggableElement
                            key={el.id}
                            el={el}
                            index={index}
                            moveElement={moveElement}
                            isSelected={selectedId === el.id}
                            selectElement={selectElement}
                            updateElement={updateElement}
                        />
                    ))}
                </div>

            </div>
        </main>
    )
}

// Sub-component for individual draggable elements
interface DraggableElementProps {
    el: EditorElement
    index: number
    moveElement: (dragIndex: number, hoverIndex: number) => void
    isSelected: boolean
    selectElement: (id: string | null) => void
    updateElement: (id: string, updates: Partial<EditorElement>) => void
}

const DraggableElement = ({ el, index, moveElement, isSelected, selectElement, updateElement }: DraggableElementProps) => {
    const ref = useRef<HTMLDivElement>(null)

    // Sortable Drop Logic
    const [, drop] = useDrop({
        accept: 'SORTABLE_ITEM',
        hover(item: { index: number, id: string; type: string }) {
            if (!ref.current) return
            const dragIndex = item.index
            const hoverIndex = index
            if (dragIndex === hoverIndex) return

            moveElement(dragIndex, hoverIndex)
            item.index = hoverIndex
        },
    })

    // Drag Logic
    const [{ isDragging }, drag] = useDrag({
        type: 'SORTABLE_ITEM',
        item: { type: 'SORTABLE_ITEM', id: el.id, index },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    drag(drop(ref))

    const style: React.CSSProperties = {
        fontFamily: el.style.fontFamily,
        fontSize: `${el.style.fontSize}px`,
        color: el.style.color,
        fontWeight: el.style.fontWeight,
        fontStyle: el.style.fontStyle,
        textDecoration: el.style.textDecoration,
        textAlign: el.style.textAlign,
        lineHeight: el.style.lineHeight,
        marginBottom: `${el.style.margin}px`,
        opacity: isDragging ? 0.4 : 1
    }

    const wrapperClass = `relative group border-2 border-transparent transition-all rounded px-2 py-1 ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-200'
        } cursor-move`

    const handleChange = (content: string) => {
        updateElement(el.id, { content })
    }

    return (
        <div
            ref={ref}
            className={wrapperClass}
            onClick={(e) => {
                e.stopPropagation()
                selectElement(el.id)
            }}
        >
            {/* Drag Handle Indicator (Visible on Hover/Select) */}
            <div className={`absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300 p-1 rounded hover:text-gray-600 ${isSelected || 'group-hover:opacity-100 opacity-0'} transition-opacity`}>
                <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="4" cy="10" r="1.5" />
                    <circle cx="4" cy="16" r="1.5" />
                    <circle cx="8" cy="4" r="1.5" />
                    <circle cx="8" cy="10" r="1.5" />
                    <circle cx="8" cy="16" r="1.5" />
                </svg>
            </div>

            {el.type === 'heading' && (
                <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleChange(e.currentTarget.textContent || '')}
                    style={style}
                    className="outline-none"
                >
                    {el.content}
                </h1>
            )}

            {el.type === 'paragraph' && (
                <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleChange(e.currentTarget.textContent || '')}
                    style={style}
                    className="outline-none"
                >
                    {el.content}
                </p>
            )}

            {el.type === 'list' && (
                <div style={style}>
                    <ul className="list-disc pl-5">
                        <li
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleChange(e.currentTarget.textContent || '')}
                            className="outline-none"
                        >
                            {el.content}
                        </li>
                    </ul>
                </div>
            )}

            {el.type === 'image' && (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg border border-dashed border-gray-300">
                    <span className="text-sm">Image Placeholder</span>
                </div>
            )}

            {el.type === 'divider' && (
                <hr className="my-4 border-gray-300" />
            )}
        </div>
    )
}
