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
    isEditing?: string | null
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
    const [showMeasurement, setShowMeasurement] = useState(false)
    const contentEditableRef = useRef<HTMLDivElement>(null)

    // Snap to grid helper
    const snapToGrid = (value: number, gridSize: number = 8): number => {
        return Math.round(value / gridSize) * gridSize
    }

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
            className="group absolute outline-none"
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(el.id)
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                if (el.type !== 'divider' && setIsEditing) {
                    setIsEditing(el.id)
                }
            }}
        >
            {/* Selection Ring */}
            {isSelected && (
                <div
                    className="SelectionRing absolute inset-[-2px] pointer-events-none z-50 shadow-lg"
                    style={{ border: '2px solid #3b82f6', borderRadius: `${(el.style.borderRadius as number || 0) + 2}px` }}
                />
            )}

            {/* Hover Indicator */}
            {!isSelected && (
                <div
                    className="HoverIndicator absolute inset-0 pointer-events-none group-hover:border"
                    style={{ borderColor: '#d1d5db' }}
                />
            )}
            {/* Measurement Tooltip */}
            {(isDragging || isResizing) && showMeasurement && (
                <div
                    className="MeasurementTooltip absolute -top-10 left-1/2 -translate-x-1/2 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-[100] font-mono border"
                    style={{ backgroundColor: '#2563eb', borderColor: '#60a5fa' }}
                >
                    {Math.round(el.style.width)} × {Math.round(el.style.height)}px
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px]"
                        style={{ borderTopColor: '#2563eb' }}
                    />
                </div>
            )}

            {/* Selection Labels */}
            {isSelected && !isDragging && !isResizing && (
                <div
                    className="SelectionLabel absolute -top-6 left-0 text-white text-[9px] px-1.5 py-0.5 rounded-t font-medium tracking-wider uppercase"
                    style={{ backgroundColor: '#3b82f6' }}
                >
                    {el.type}
                </div>
            )}

            {/* Resize Handles */}
            {isSelected &&
                RESIZE_HANDLES.map((handle) => (
                    <div
                        key={handle}
                        className={`resize-handle absolute w-3 h-3 bg-white border-2 rounded-full z-[60] shadow-sm hover:scale-125 transition-transform ${isResizing === handle ? 'scale-150' : ''}`}
                        style={{
                            ...getHandlePosition(handle),
                            borderColor: '#3b82f6'
                        }}
                        onMouseDown={(e) => handleResizeStart(handle, e)}
                    />
                ))}

            {/* Element Content */}
            <div className="w-full h-full relative overflow-hidden">
                {el.type === 'divider' ? (
                    <div
                        className="w-full h-0 border-t absolute top-1/2 -translate-y-1/2"
                        style={{ borderColor: '#9ca3af' }}
                    />
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
                        className={`w-full h-full outline-none break-words whitespace-pre-wrap ${isEditing === el.id ? 'cursor-text' : 'cursor-inherit'}`}
                    >
                        {el.content}
                    </div>
                )}
            </div>
        </div>
    )
}
