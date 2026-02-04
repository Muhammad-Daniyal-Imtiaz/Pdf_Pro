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

    // Sync contenteditable with store content
    useEffect(() => {
        if (contentRef.current && isEditing !== el.id) {
            const currentText = contentRef.current.innerText || ''
            const storeText = el.content || ''
            if (currentText !== storeText) {
                contentRef.current.innerText = storeText
            }
        }
    }, [el.content, el.id, isEditing])

    // Auto-grow height for text elements
    useEffect(() => {
        if (!contentRef.current) return
        if (el.type === 'image' || el.type === 'divider' || el.type === 'social-icon') return
        if (isResizing) return

        const scrollHeight = contentRef.current.scrollHeight
        const currentHeight = el.style.height || 0

        // Only grow, never shrink automatically (prevents jitter)
        if (scrollHeight > currentHeight - 8) {
            const newHeight = Math.ceil((scrollHeight + 8) / 4) * 4 // Round to 4px grid
            if (newHeight > currentHeight) {
                onResize(el.id, el.style.width, newHeight)
            }
        }
    }, [el.content, el.style.width, el.style.height, el.id, el.type, onResize, isResizing])

    // Round to 0.5px for sub-pixel precision without jitter
    const exactPosition = {
        x: Math.round(el.x * 2) / 2,
        y: Math.round(el.y * 2) / 2,
        width: Math.round(el.style.width),
        height: Math.round(el.style.height)
    }

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('resize-handle')) return
        if (isEditing === el.id) return

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

                // Round to 0.5px for smooth dragging without sub-pixel issues
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

    // CRITICAL FIX: Use consistent positioning that prevents overlap issues
    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${exactPosition.x}px`,
        top: `${exactPosition.y}px`,
        width: `${exactPosition.width}px`,
        // For text elements, let height be auto when not resizing to prevent overlap
        height: isTextElement && !isResizing ? 'auto' : `${exactPosition.height}px`,
        minHeight: isTextElement ? `${exactPosition.height}px` : undefined,
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
        // CRITICAL: Allow text elements to expand naturally
        overflow: isTextElement ? 'visible' : 'hidden',
        transform: el.style.rotation ? `rotate(${el.style.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        pointerEvents: 'auto',
        // Prevent overlap issues with clear isolation
        isolation: 'isolate'
    }

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
        padding: '0',
        margin: '0',
        // CRITICAL: Ensure text doesn't get clipped by other elements
        position: 'relative',
        zIndex: 1
    } : {}

    // Render social icon directly without wrapper
    if (el.type === 'social-icon') {
        const SocialIconComponent = require('./SocialIconElement').default
        return (
            <div
                ref={elementRef}
                data-element-id={el.id}
                style={{
                    position: 'absolute',
                    left: `${exactPosition.x}px`,
                    top: `${exactPosition.y}px`,
                    width: `${exactPosition.width}px`,
                    height: `${exactPosition.height}px`,
                    zIndex: el.style.zIndex || 0,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none'
                }}
                className="editor-element"
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(el.id)
                }}
            >
                <SocialIconComponent
                    element={el}
                    isSelected={isSelected || isMultiSelected}
                    onSelect={() => onSelect(el.id)}
                />
                {(isSelected || isMultiSelected) && (
                    <div
                        data-html2canvas-ignore="true"
                        className="absolute pointer-events-none"
                        style={{
                            inset: -2,
                            border: isMultiSelected && !isSelected ? '2px dashed #8B5CF6' : '2px solid #3B82F6',
                            borderRadius: 4
                        }}
                    />
                )}
                {isSelected && ['nw', 'ne', 'sw', 'se'].map((handle) => (
                    <div
                        key={handle}
                        data-html2canvas-ignore="true"
                        className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full z-50 hover:scale-125 transition-transform"
                        style={{
                            ...(handle.includes('n') ? { top: -6 } : { bottom: -6 }),
                            ...(handle.includes('w') ? { left: -6 } : { right: -6 }),
                            cursor: `${handle}-resize`
                        }}
                        onMouseDown={(e) => handleResizeStart(handle as ResizeHandle, e)}
                    />
                ))}
            </div>
        )
    }

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
                    setTimeout(() => contentRef.current?.focus(), 10)
                }
            }}
        >
            {/* Selection Ring */}
            {(isSelected || isMultiSelected) && (
                <div
                    className="absolute pointer-events-none z-50"
                    style={{
                        left: -2,
                        top: -2,
                        right: -2,
                        bottom: -2,
                        border: isMultiSelected && !isSelected ? '2px dashed #8B5CF6' : '2px solid #3B82F6',
                        borderRadius: `${(el.style.borderRadius || 0) + 2}px`,
                    }}
                    data-html2canvas-ignore="true"
                />
            )}

            {/* Type Label */}
            {isSelected && !isDragging && (
                <div
                    className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider pointer-events-none whitespace-nowrap z-50"
                    data-html2canvas-ignore="true"
                >
                    {el.type}
                </div>
            )}

            {/* Resize Handles */}
            {isSelected && ['nw', 'ne', 'sw', 'se'].map((handle) => (
                <div
                    key={handle}
                    className={`resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full z-50 hover:scale-125 transition-transform ${isResizing === handle ? 'scale-150 bg-blue-100' : ''}`}
                    style={{
                        ...(handle.includes('n') ? { top: -6 } : { bottom: -6 }),
                        ...(handle.includes('w') ? { left: -6 } : { right: -6 }),
                        cursor: `${handle}-resize`
                    }}
                    onMouseDown={(e) => handleResizeStart(handle as ResizeHandle, e)}
                    data-html2canvas-ignore="true"
                />
            ))}

            {/* Content */}
            {el.type === 'divider' ? (
                <div className="w-full h-0 border-t-2 border-gray-400 absolute top-1/2 left-0 -translate-y-1/2" />
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
                    dangerouslySetInnerHTML={isEditing === el.id ? undefined : { __html: escapeHtml(el.content || '') }}
                >
                    {isEditing === el.id ? el.content : null}
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    {el.type === 'image' && <span className="text-gray-400">🖼️ Image</span>}
                    {el.content}
                </div>
            )}
        </div>
    )
}

function escapeHtml(text: string): string {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
}