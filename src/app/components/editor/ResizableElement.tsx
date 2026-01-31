'use client'

import React, { useRef, useState, useEffect } from 'react'
import { EditorElement, useEditorStore } from '@/app/store/useEditorStore'

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
    const contentEditableRef = useRef<HTMLDivElement>(null)
    const { updateElement } = useEditorStore()

    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null)
    const [isRotating, setIsRotating] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [initialSize, setInitialSize] = useState({ width: 0, height: 0, x: 0, y: 0 })
    const [initialRotation, setInitialRotation] = useState(0)
    const [rotationStart, setRotationStart] = useState(0)
    const [showMeasurement, setShowMeasurement] = useState(false)

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

    const handleRotationStart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsRotating(true)
        const rect = elementRef.current?.getBoundingClientRect()
        if (!rect) return
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        setRotationStart(startAngle)
        setInitialRotation(el.style.rotate || 0)
    }

    const handleResizeStart = (handle: ResizeHandle, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(handle)
        setDragStart({ x: e.clientX, y: e.clientY })
        setInitialSize({ width: el.style.width, height: el.style.height, x: el.x, y: el.y })
    }

    useEffect(() => {
        const handleMouseMoveGlobal = (e: MouseEvent) => {
            if (isDragging && !isResizing && !isRotating) {
                const newX = e.clientX - dragStart.x
                const newY = e.clientY - dragStart.y
                onMove(el.id, snapToGrid(newX), snapToGrid(newY))
            }

            if (isResizing && elementRef.current) {
                const parentRect = elementRef.current.parentElement?.getBoundingClientRect()
                if (!parentRect) return

                const mouseX = e.clientX - parentRect.left
                const mouseY = e.clientY - parentRect.top

                let newWidth = el.style.width
                let newHeight = el.style.height
                let newX = el.x
                let newY = el.y

                const minSize = 20

                if (isResizing.includes('e')) newWidth = Math.max(minSize, mouseX - el.x)
                if (isResizing.includes('s')) newHeight = Math.max(minSize, mouseY - el.y)
                if (isResizing.includes('w')) {
                    const diff = initialSize.width - (e.clientX - dragStart.x)
                    if (diff > minSize) {
                        newWidth = diff
                        newX = e.clientX - (dragStart.x - initialSize.x)
                    }
                }
                if (isResizing.includes('n')) {
                    const diff = initialSize.height - (e.clientY - dragStart.y)
                    if (diff > minSize) {
                        newHeight = diff
                        newY = e.clientY - (dragStart.y - initialSize.y)
                    }
                }

                onResize(el.id, snapToGrid(newWidth), snapToGrid(newHeight))
                if (newX !== el.x || newY !== el.y) onMove(el.id, snapToGrid(newX), snapToGrid(newY))
            }

            if (isRotating && elementRef.current) {
                const rect = elementRef.current.getBoundingClientRect()
                const centerX = rect.left + rect.width / 2
                const centerY = rect.top + rect.height / 2
                const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
                const angleDiff = (currentAngle - rotationStart) * (180 / Math.PI)
                const newRotation = (initialRotation + angleDiff) % 360
                // Snapping rotation to 15 degree increments
                const snappedRotation = Math.round(newRotation / 15) * 15
                updateElement(el.id, { style: { ...el.style, rotate: snappedRotation } })
            }
        }

        const handleMouseUpGlobal = () => {
            setIsDragging(false)
            setIsResizing(null)
            setIsRotating(false)
        }

        if (isDragging || isResizing || isRotating) {
            window.addEventListener('mousemove', handleMouseMoveGlobal)
            window.addEventListener('mouseup', handleMouseUpGlobal)
            setShowMeasurement(true)
            return () => {
                window.removeEventListener('mousemove', handleMouseMoveGlobal)
                window.removeEventListener('mouseup', handleMouseUpGlobal)
            }
        } else {
            const timer = setTimeout(() => setShowMeasurement(false), 2000)
            return () => clearTimeout(timer)
        }
    }, [isDragging, isResizing, isRotating, dragStart, initialSize, initialRotation, rotationStart, el, onMove, onResize, updateElement])

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
        const offset = -6 // half of 12px handle

        const positions: Record<ResizeHandle, React.CSSProperties> = {
            nw: { top: offset, left: offset, cursor: 'nw-resize' },
            ne: { top: offset, right: offset, cursor: 'ne-resize' },
            sw: { bottom: offset, left: offset, cursor: 'sw-resize' },
            se: { bottom: offset, right: offset, cursor: 'se-resize' },
            n: { top: offset, left: '50%', marginLeft: offset, cursor: 'n-resize' },
            s: { bottom: offset, left: '50%', marginLeft: offset, cursor: 's-resize' },
            e: { top: '50%', right: offset, marginTop: offset, cursor: 'e-resize' },
            w: { top: '50%', left: offset, marginTop: offset, cursor: 'w-resize' }
        }

        return positions[handle]
    }

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${el.x}px`,
        top: `${el.y}px`,
        width: `${el.style.width}px`,
        height: `${el.style.height}px`,
        transform: `rotate(${el.style.rotate || 0}deg)`,
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: el.style.textAlign === 'center' ? 'center' : 'flex-start',
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as any,
        zIndex: isSelected ? 100 : 10,
        transition: (isDragging || isResizing || isRotating) ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none'
    }

    return (
        <div
            ref={elementRef}
            style={style}
            className={`group absolute ${isSelected ? 'z-[100]' : 'z-10'}`}
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
            {/* Bright Selection Border */}
            {isSelected && (
                <div className="absolute inset-0 border-2 border-[#3b82f6] pointer-events-none z-50 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]" />
            )}

            {/* Hover Indicator */}
            {!isSelected && !isDragging && (
                <div className="absolute inset-0 border border-transparent group-hover:border-blue-300 transition-colors pointer-events-none z-40" />
            )}

            {/* Dimension Display */}
            {isSelected && (isDragging || isResizing || isRotating) && showMeasurement && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white text-[10px] px-2 py-1 rounded font-bold shadow-xl backdrop-blur-sm z-[200] whitespace-nowrap space-x-2 border border-gray-700">
                    <span>{Math.round(el.style.width)} × {Math.round(el.style.height)}px</span>
                    {el.style.rotate !== 0 && <span className="text-blue-400">{el.style.rotate}°</span>}
                </div>
            )}

            {/* Rotation Handle */}
            {isSelected && !isResizing && !isDragging && (
                <div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-7 h-7 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-alias shadow-lg hover:scale-110 active:scale-95 transition-transform z-[150]"
                    onMouseDown={handleRotationStart}
                    title="Rotate"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                    </svg>
                    <div className="absolute top-7 w-[1.5px] h-5 bg-blue-500/40" />
                </div>
            )}

            {/* Resize Handles (8 Points) */}
            {isSelected && RESIZE_HANDLES.map((handle) => (
                <div
                    key={handle}
                    className={`resize-handle absolute w-3 h-3 bg-white border-2 border-blue-600 z-[160] shadow-md hover:scale-125 transition-transform ${handle.length === 1 ? 'rounded-none' : 'rounded-full'
                        }`}
                    style={getHandlePosition(handle)}
                    onMouseDown={(e) => handleResizeStart(handle, e)}
                />
            ))}

            {/* Element Content */}
            <div className="w-full h-full relative overflow-visible flex items-center">
                {el.type === 'divider' ? (
                    <div className="w-full h-[2px] bg-gray-300 rounded-full" />
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
                        className={`w-full outline-none break-words whitespace-pre-wrap ${isEditing === el.id ? 'cursor-text select-text focus:bg-blue-50/10' : 'cursor-inherit'} ${el.type === 'heading' ? 'font-black leading-tight' : 'leading-normal'}`}
                        style={{
                            fontSize: 'inherit',
                            color: 'inherit',
                            fontFamily: 'inherit',
                            textAlign: el.style.textAlign as any
                        }}
                    >
                        {el.content}
                    </div>
                )}
            </div>
        </div>
    )
}
