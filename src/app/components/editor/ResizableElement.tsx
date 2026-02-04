'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { EditorElement } from '@/app/store/useEditorStore'

interface ResizableElementProps {
    el: EditorElement
    isSelected: boolean
    isMultiSelected?: boolean
    onSelect: (id: string) => void
    onToggleSelection?: (id: string) => void
    onMove: (id: string, x: number, y: number) => void
    onResize: (id: string, width: number, height: number) => void
    onChange: (id: string, content: string) => void
    isEditing?: string | null
    setIsEditing?: (id: string | null) => void
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export default function ResizableElement({
    el,
    isSelected,
    isMultiSelected = false,
    onSelect,
    onToggleSelection,
    onMove,
    onResize,
    onChange,
    isEditing,
    setIsEditing
}: ResizableElementProps) {
    const elementRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, elX: 0, elY: 0 })
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [internalHeight, setInternalHeight] = useState(el.style.height)

    // CRITICAL FIX #1: Sync contenteditable with store content
    useEffect(() => {
        if (contentRef.current && isEditing !== el.id) {
            // Only update if not currently editing (to avoid cursor jumps)
            const currentText = contentRef.current.innerText || ''
            const storeText = el.content || ''

            if (currentText !== storeText) {
                contentRef.current.innerText = storeText
            }
        }
    }, [el.content, el.id, isEditing])

    // CRITICAL FIX #2: Auto-grow height for text elements, but respect manual resize
    useEffect(() => {
        if (!contentRef.current) return
        if (el.type === 'image' || el.type === 'divider' || el.type === 'social-icon') return
        if (isResizing) return // Don't auto-grow while manually resizing

        const scrollHeight = contentRef.current.scrollHeight
        const minHeight = Math.max(el.style.height, scrollHeight + 4)

        // Only grow, never shrink automatically
        if (scrollHeight > el.style.height - 4) {
            const newHeight = Math.ceil(scrollHeight / 4) * 4 // Round to 4px grid
            if (newHeight !== el.style.height) {
                onResize(el.id, el.style.width, newHeight)
            }
        }

        setInternalHeight(el.style.height)
    }, [el.content, el.style.width, el.style.height, el.id, el.type, onResize, isResizing])

    const exactPosition = {
        x: Math.round(el.x * 2) / 2, // 0.5px precision
        y: Math.round(el.y * 2) / 2,
        width: Math.round(el.style.width),
        height: Math.round(el.style.height)
    }

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('resize-handle')) return
        if (isEditing === el.id) return // Don't drag while editing

        e.stopPropagation()
        e.preventDefault()

        if (e.shiftKey && onToggleSelection) {
            onToggleSelection(el.id)
            return
        }

        onSelect(el.id)
        setIsDragging(true)
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            elX: exactPosition.x,
            elY: exactPosition.y
        })
    }, [el.id, exactPosition, onSelect, onToggleSelection, isEditing])

    const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setIsResizing(handle)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: exactPosition.width,
            height: exactPosition.height
        })
    }, [exactPosition])

    useEffect(() => {
        if (!isDragging && !isResizing) return

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStart.x
                const dy = e.clientY - dragStart.y

                const newX = Math.round((dragStart.elX + dx) * 2) / 2
                const newY = Math.round((dragStart.elY + dy) * 2) / 2

                onMove(el.id, newX, newY)
            }

            if (isResizing) {
                const dx = e.clientX - resizeStart.x
                const dy = e.clientY - resizeStart.y

                let newWidth = resizeStart.width
                let newHeight = resizeStart.height

                if (isResizing.includes('e')) newWidth = Math.max(20, resizeStart.width + dx)
                if (isResizing.includes('w')) newWidth = Math.max(20, resizeStart.width - dx)
                if (isResizing.includes('s')) newHeight = Math.max(20, resizeStart.height + dy)
                if (isResizing.includes('n')) newHeight = Math.max(20, resizeStart.height - dy)

                onResize(el.id, Math.round(newWidth), Math.round(newHeight))
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, isResizing, dragStart, resizeStart, el.id, onMove, onResize])

    // CRITICAL FIX #3: Proper content editable handling
    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.innerText || ''
        onChange(el.id, text)
    }, [el.id, onChange])

    const handleFocus = useCallback(() => {
        setIsEditing?.(el.id)
    }, [el.id, setIsEditing])

    const handleBlur = useCallback(() => {
        setIsEditing?.(null)
    }, [setIsEditing])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            setIsEditing?.(null)
                ; (e.target as HTMLElement).blur()
        }
    }, [setIsEditing])

    const isTextElement = ['paragraph', 'heading', 'list', 'link'].includes(el.type)

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${exactPosition.x}px`,
        top: `${exactPosition.y}px`,
        width: `${exactPosition.width}px`,
        height: el.type === 'divider' ? '1px' : `${exactPosition.height}px`,
        fontFamily: el.style.fontFamily || 'Inter, sans-serif',
        fontSize: `${el.style.fontSize || 14}px`,
        color: el.style.color || '#000000',
        fontWeight: el.style.fontWeight || '400',
        fontStyle: el.style.fontStyle || 'normal',
        textAlign: (el.style.textAlign as any) || 'left',
        lineHeight: el.style.lineHeight || 1.5,
        padding: isTextElement ? `${el.style.padding || 12}px` : '0',
        backgroundColor: el.style.backgroundColor || 'transparent',
        borderColor: el.style.borderColor || '#cccccc',
        borderWidth: el.type === 'divider' ? '0' : `${el.style.borderWidth || 0}px`,
        borderStyle: el.style.borderStyle || 'solid',
        borderRadius: el.type === 'divider' ? '0' : `${el.style.borderRadius || 0}px`,
        opacity: el.style.opacity ?? 1,
        zIndex: el.style.zIndex || 0,
        cursor: isDragging ? 'grabbing' : isEditing === el.id ? 'text' : 'grab',
        userSelect: 'none',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        // CRITICAL FIX #4: Don't clip content for text elements
        overflow: isTextElement ? 'visible' : 'hidden',
        transform: el.style.rotation ? `rotate(${el.style.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        // Ensure text is selectable when editing
        pointerEvents: 'auto'
    }

    // Content styles - separate for proper text rendering
    const contentStyles: React.CSSProperties = isTextElement ? {
        width: '100%',
        minHeight: '100%',
        outline: 'none',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        userSelect: isEditing === el.id ? 'text' : 'none',
        cursor: isEditing === el.id ? 'text' : 'inherit',
        boxSizing: 'border-box',
        // Remove any padding that might cause double-spacing
        padding: '0',
        margin: '0'
    } : {}

    return (
        <div
            ref={elementRef}
            data-element-id={el.id}
            style={baseStyles}
            className="editor-element group"
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(el.id)
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                if (el.type !== 'divider' && setIsEditing) {
                    setIsEditing(el.id)
                    // Focus the contenteditable after a brief delay
                    setTimeout(() => contentRef.current?.focus(), 10)
                }
            }}
        >
            {/* Selection Ring */}
            {(isSelected || isMultiSelected) && (
                <div
                    className="absolute pointer-events-none z-[1000]"
                    style={{
                        left: '-2px',
                        top: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        border: isMultiSelected && !isSelected
                            ? '2px dashed #8B5CF6'
                            : '2px solid #3B82F6',
                        borderRadius: `${(el.style.borderRadius || 0) + 2}px`,
                    }}
                    data-html2canvas-ignore="true"
                />
            )}

            {/* Type Label */}
            {isSelected && !isDragging && (
                <div
                    className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider pointer-events-none whitespace-nowrap z-[1001]"
                    data-html2canvas-ignore="true"
                >
                    {el.type}
                </div>
            )}

            {/* Resize Handles */}
            {isSelected && ['nw', 'ne', 'sw', 'se'].map((handle) => (
                <div
                    key={handle}
                    className={`resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full z-[1002] hover:scale-125 transition-transform ${isResizing === handle ? 'scale-150 bg-blue-100' : ''
                        }`}
                    style={{
                        ...(handle.includes('n') ? { top: '-6px' } : { bottom: '-6px' }),
                        ...(handle.includes('w') ? { left: '-6px' } : { right: '-6px' }),
                        cursor: `${handle}-resize`
                    }}
                    onMouseDown={(e) => handleResizeStart(handle as ResizeHandle, e)}
                    data-html2canvas-ignore="true"
                />
            ))}

            {/* Content */}
            {el.type === 'divider' ? (
                <div
                    className="w-full h-0 border-t-2 border-gray-400 absolute top-1/2 left-0 -translate-y-1/2"
                />
            ) : isTextElement ? (
                <div
                    ref={contentRef}
                    contentEditable={isEditing === el.id}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    style={contentStyles}
                    // CRITICAL FIX #5: Initialize with content using innerText equivalent
                    dangerouslySetInnerHTML={isEditing === el.id ? undefined : { __html: escapeHtml(el.content || '') }}
                >
                    {/* Only render children when editing to avoid React conflicts */}
                    {isEditing === el.id ? el.content : null}
                </div>
            ) : (
                // Render social-icon, image, etc. here
                <div className="w-full h-full flex items-center justify-center">
                    {el.type === 'social-icon' && <span className="text-2xl">🔣</span>}
                    {el.type === 'image' && <span className="text-gray-400">🖼️ Image</span>}
                    {el.content}
                </div>
            )}
        </div>
    )
}

// Helper to escape HTML for safe rendering
function escapeHtml(text: string): string {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML.replace(/\n/g, '<br>')
}