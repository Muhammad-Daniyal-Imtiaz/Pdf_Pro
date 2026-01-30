'use client'

import React, { useRef, useState } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'

interface ResizableElementProps {
    el: EditorElement
    isSelected: boolean
    onSelect: (id: string) => void
    onMove: (id: string, x: number, y: number) => void
    onResize: (id: string, width: number, height: number) => void
    onChange: (id: string, content: string) => void
    onBlur?: (id: string) => void
    isEditing?: boolean
    setIsEditing?: (id: string | null) => void
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']

export default function ResizableElement({
    el,
    isSelected,
    onSelect,
    onMove,
    onResize,
    onChange,
    onBlur,
    isEditing,
    setIsEditing
}: ResizableElementProps) {
    const elementRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
    const contentEditableRef = useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing) return
        if ((e.target as HTMLElement).classList.contains('resize-handle')) return

        e.stopPropagation()
        onSelect(el.id)

        setIsDragging(true)
        setDragStart({ x: e.clientX - el.x, y: e.clientY - el.y })
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && !isResizing) {
            const newX = e.clientX - dragStart.x
            const newY = e.clientY - dragStart.y
            onMove(el.id, newX, newY)
        }

        if (isResizing && elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect()
            const parentRect = elementRef.current.parentElement?.getBoundingClientRect()

            if (!parentRect) return

            const mouseX = e.clientX - parentRect.left - el.x
            const mouseY = e.clientY - parentRect.top - el.y
            const minWidth = 50
            const minHeight = 30

            let newWidth = el.style.width
            let newHeight = el.style.height

            switch (isResizing) {
                case 'e':
                    newWidth = Math.max(minWidth, mouseX)
                    break
                case 'w':
                    newWidth = Math.max(minWidth, initialSize.width - (mouseX - dragStart.x))
                    onMove(el.id, el.x + (initialSize.width - newWidth), el.y)
                    break
                case 's':
                    newHeight = Math.max(minHeight, mouseY)
                    break
                case 'n':
                    newHeight = Math.max(minHeight, initialSize.height - (mouseY - dragStart.y))
                    onMove(el.id, el.x, el.y + (initialSize.height - newHeight))
                    break
                case 'se':
                    newWidth = Math.max(minWidth, mouseX)
                    newHeight = Math.max(minHeight, mouseY)
                    break
                case 'sw':
                    newWidth = Math.max(minWidth, initialSize.width - (mouseX - dragStart.x))
                    newHeight = Math.max(minHeight, mouseY)
                    onMove(el.id, el.x + (initialSize.width - newWidth), el.y)
                    break
                case 'ne':
                    newWidth = Math.max(minWidth, mouseX)
                    newHeight = Math.max(minHeight, initialSize.height - (mouseY - dragStart.y))
                    onMove(el.id, el.x, el.y + (initialSize.height - newHeight))
                    break
                case 'nw':
                    newWidth = Math.max(minWidth, initialSize.width - (mouseX - dragStart.x))
                    newHeight = Math.max(minHeight, initialSize.height - (mouseY - dragStart.y))
                    onMove(el.id, el.x + (initialSize.width - newWidth), el.y + (initialSize.height - newHeight))
                    break
            }

            onResize(el.id, newWidth, newHeight)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setIsResizing(null)
    }

    const handleResizeStart = (handle: ResizeHandle, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(handle)
        setDragStart({ x: e.clientX, y: e.clientY })
        setInitialSize({ width: el.style.width, height: el.style.height })
    }

    React.useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, dragStart, initialSize, el])

    const handleContentChange = (newContent: string) => {
        onChange(el.id, newContent)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing?.(null)
            contentEditableRef.current?.blur()
        }
    }

    const getHandlePosition = (handle: ResizeHandle): React.CSSProperties => {
        const handleSize = 8
        const offset = -handleSize / 2

        const positions: Record<ResizeHandle, React.CSSProperties> = {
            nw: { top: offset, left: offset, cursor: 'nw-resize' },
            ne: { top: offset, right: offset, cursor: 'ne-resize' },
            sw: { bottom: offset, left: offset, cursor: 'sw-resize' },
            se: { bottom: offset, right: offset, cursor: 'se-resize' },
            n: { top: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
            s: { bottom: offset, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
            e: { top: '50%', right: offset, transform: 'translateY(-50%)', cursor: 'e-resize' },
            w: { top: '50%', left: offset, transform: 'translateY(-50%)', cursor: 'w-resize' }
        }

        return positions[handle]
    }

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${el.x}px`,
        top: `${el.y}px`,
        width: `${el.style.width}px`,
        height: `${el.style.height}px`,
        fontFamily: el.style.fontFamily,
        fontSize: `${el.style.fontSize}px`,
        color: el.style.color,
        fontWeight: el.style.fontWeight as any,
        fontStyle: el.style.fontStyle as any,
        textAlign: el.style.textAlign as any,
        lineHeight: el.style.lineHeight,
        padding: `${el.style.padding}px`,
        backgroundColor: el.style.backgroundColor,
        borderColor: el.style.borderColor,
        borderWidth: el.style.borderWidth,
        borderRadius: el.style.borderRadius,
        opacity: el.style.opacity,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: el.style.textAlign === 'center' ? 'center' : 'flex-start',
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as any,
        transition: isResizing ? 'none' : 'border-color 0.2s'
    }

    return (
        <div
            ref={elementRef}
            style={style}
            className={`group relative transition-all ${
                isSelected
                    ? 'border-2 border-blue-500 shadow-md'
                    : 'border-2 border-transparent hover:border-gray-300'
            }`}
            onMouseDown={handleMouseDown}
            onClick={() => {
                onSelect(el.id)
                if (el.type !== 'divider' && setIsEditing) {
                    setIsEditing(el.id)
                }
            }}
        >
            {/* Resize Handles - only show when selected */}
            {isSelected &&
                RESIZE_HANDLES.map((handle) => (
                    <div
                        key={handle}
                        className="resize-handle absolute w-4 h-4 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                            ...getHandlePosition(handle),
                            pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleResizeStart(handle, e)}
                    />
                ))}

            {/* Element Content */}
            {el.type === 'divider' ? (
                <div className="w-full h-full border-t border-gray-400" />
            ) : (
                <div
                    ref={contentEditableRef}
                    contentEditable={isEditing === el.id}
                    suppressContentEditableWarning
                    onInput={(e) => handleContentChange(e.currentTarget.textContent || '')}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        setIsEditing?.(null)
                        onBlur?.(el.id)
                    }}
                    className={`w-full h-full outline-none ${isEditing === el.id ? 'bg-blue-50' : ''}`}
                    style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}
                >
                    {el.content}
                </div>
            )}
        </div>
    )
}
