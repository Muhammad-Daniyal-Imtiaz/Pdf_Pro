
'use client'

import React, { useRef } from 'react'
import { useEditorStore, EditorElement } from '../../store/useEditorStore'
import { useDrop } from 'react-dnd'

export default function EditorMain() {
    const { elements, selectedId, selectElement, updateElement, addElement } = useEditorStore()

    // Drop zone handler
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ['heading', 'paragraph', 'list', 'image', 'divider'],
        drop: (item: any, monitor) => {
            const type = monitor.getItemType() as any
            if (type) addElement(type)
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    })) // Removed dependency array to prevent recreation loop if not needed

    // Render a single element
    const renderElement = (el: EditorElement) => {
        const isSelected = selectedId === el.id

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
        }

        const wrapperClass = `relative group border-2 border-transparent transition-all rounded px-2 py-1 ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-200'
            }`

        const handleChange = (content: string) => {
            updateElement(el.id, { content })
        }

        return (
            <div
                key={el.id}
                className={wrapperClass}
                onClick={(e) => {
                    e.stopPropagation()
                    selectElement(el.id)
                }}
            >
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
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg">
                        Image Placeholder
                    </div>
                )}

                {el.type === 'divider' && (
                    <hr className="my-4 border-gray-300" />
                )}

                {/* Selection Indicator (optional, keeping minimal for now) */}
            </div>
        )
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
                    position: 'relative'
                }}
                onClick={() => selectElement(null)} // Deselect on background click
            >
                {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                        <p className="text-xl font-medium">Drag items here</p>
                    </div>
                )}

                <div className="space-y-2">
                    {elements.map(renderElement)}
                </div>

            </div>
        </main>
    )
}
