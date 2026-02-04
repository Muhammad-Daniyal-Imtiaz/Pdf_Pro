'use client'

import React, { useRef, useState, useEffect } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'
import { useEditorStore } from '@/app/store/useEditorStore'
import { CoordinateSystem } from '@/app/lib/geometry-engine/CoordinateSystem'
import SocialIconElement from './SocialIconElement'
import LinkElement from './LinkElement'
import LineElement from './LineElement'

interface ResizableElementProps {
    el: EditorElement
    isSelected: boolean
    isMultiSelected?: boolean
    onSelect: (id: string) => void
    onToggleSelection?: (id: string) => void
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
    isMultiSelected = false,
    onSelect,
    onToggleSelection,
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
    
    // Get PDF generation state from store
    const isGeneratingPDF = useEditorStore(state => state.isGeneratingPDF)

    // Snap to grid helper
    const snapToGrid = (value: number, gridSize: number = 8): number => {
        return Math.round(value / gridSize) * gridSize
    }

    // Apply PDF-specific styles during generation
    useEffect(() => {
        if (isGeneratingPDF && elementRef.current) {
            // Apply PDF correction transforms
            const correction = CoordinateSystem.getPDFCorrection(el)
            if (correction) {
                elementRef.current.style.transform = `translate(${correction.x}px, ${correction.y}px) scale(${correction.scale})`
                elementRef.current.style.transformOrigin = 'top left'
            }

            // Hide UI elements that shouldn't be in PDF
            const uiElements = elementRef.current.querySelectorAll('[data-html2canvas-ignore="true"]')
            uiElements.forEach(uiElement => {
                (uiElement as HTMLElement).style.display = 'none'
            })
        } else if (elementRef.current) {
            // Reset styles when not generating PDF
            elementRef.current.style.transform = ''
            elementRef.current.style.transformOrigin = ''
            
            // Show UI elements again
            const uiElements = elementRef.current.querySelectorAll('[data-html2canvas-ignore="true"]')
            uiElements.forEach(uiElement => {
                (uiElement as HTMLElement).style.display = ''
            })
        }
    }, [isGeneratingPDF, el])

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
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
            const minWidth = 10
            const minHeight = 10

            let newWidth = el.style.width
            let newHeight = el.style.height
            const aspectRatio = initialSize.width / initialSize.height

            const lock = el.style.lockAspectRatio

            switch (isResizing) {
                case 'e':
                    newWidth = Math.max(minWidth, mouseX)
                    if (lock) newHeight = newWidth / aspectRatio
                    break
                case 'w':
                    newWidth = Math.max(minWidth, initialSize.width - (e.clientX - dragStart.x))
                    if (lock) newHeight = newWidth / aspectRatio
                    onMove(el.id, el.x + (initialSize.width - newWidth), lock ? el.y + (initialSize.height - newHeight) / 2 : el.y)
                    break
                case 's':
                    newHeight = Math.max(minHeight, mouseY)
                    if (lock) newWidth = newHeight * aspectRatio
                    break
                case 'n':
                    newHeight = Math.max(minHeight, initialSize.height - (e.clientY - dragStart.y))
                    if (lock) newWidth = newHeight * aspectRatio
                    onMove(el.id, lock ? el.x + (initialSize.width - newWidth) / 2 : el.x, el.y + (initialSize.height - newHeight))
                    break
                case 'se':
                    newWidth = Math.max(minWidth, mouseX)
                    newHeight = lock ? newWidth / aspectRatio : Math.max(minHeight, mouseY)
                    if (lock && newHeight < minHeight) {
                        newHeight = minHeight
                        newWidth = newHeight * aspectRatio
                    }
                    break
                case 'sw':
                    newWidth = Math.max(minWidth, initialSize.width - (e.clientX - dragStart.x))
                    newHeight = lock ? newWidth / aspectRatio : Math.max(minHeight, mouseY)
                    onMove(el.id, el.x + (initialSize.width - newWidth), el.y)
                    break
                case 'ne':
                    newWidth = Math.max(minWidth, mouseX)
                    newHeight = lock ? newWidth / aspectRatio : Math.max(minHeight, initialSize.height - (e.clientY - dragStart.y))
                    onMove(el.id, el.x, el.y + (initialSize.height - newHeight))
                    break
                case 'nw':
                    newWidth = Math.max(minWidth, initialSize.width - (e.clientX - dragStart.x))
                    newHeight = lock ? newWidth / aspectRatio : Math.max(minHeight, initialSize.height - (e.clientY - dragStart.y))
                    onMove(el.id, el.x + (initialSize.width - newWidth), el.y + (initialSize.height - newHeight))
                    break
            }

            onResize(el.id, newWidth, newHeight)
        }
    }, [isDragging, isResizing, el, dragStart, initialSize, onMove, onResize])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing) return
        if ((e.target as HTMLElement).classList.contains('resize-handle')) return

        e.stopPropagation()

        // Handle Shift+click for multi-selection
        if (e.shiftKey && onToggleSelection) {
            onToggleSelection(el.id)
            return
        }

        onSelect(el.id)

        setIsDragging(true)
        setDragStart({ x: e.clientX - el.x, y: e.clientY - el.y })
    }

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false)
        setIsResizing(null)
    }, [])

    // Attach global mouse event listeners
    React.useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

    const handleResizeStart = (handle: ResizeHandle, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(handle)
        setDragStart({ x: e.clientX, y: e.clientY })
        setInitialSize({ width: el.style.width, height: el.style.height })
    }

    // Manual DOM sync to handle checking height and preserving cursor
    React.useEffect(() => {
        if (!contentEditableRef.current) return

        // Sync content if different (handle undo/redo/external updates)
        // But skip if we are the active element (active typing) and content largely matches 
        // (This prevents cursor jumps)
        if (contentEditableRef.current.innerText !== el.content) {
            // Only update if not strictly equal, to avoid cursor reset on matching updates
            contentEditableRef.current.innerText = el.content
        }

        // Auto-resize logic
        if (isResizing || el.type === 'image' || el.type === 'divider') return
        const scrollHeight = contentEditableRef.current.scrollHeight
        const currentHeight = el.style.height || 0
        if (scrollHeight > currentHeight) {
            onResize(el.id, el.style.width, scrollHeight + 4)
        }

    }, [el.content, el.id, el.style.width, onResize, isResizing, el.type, el.style.height]) // Depend on content

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
        // overflow: 'hidden', // Disabled to allow measurement/overflow visibility if needed temporarily
        display: 'flex',
        alignItems: 'flex-start', // specific fix for text alignment vertical
        justifyContent: 'flex-start', // Let text-align handle inside
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as any,
        transition: isResizing ? 'none' : 'border-color 0.2s',
        direction: 'ltr', // Fix text rendering direction
    }

    return (
        <div
            ref={elementRef}
            data-element-id={el.id}
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
            {/* Selection Ring - Fixed Style */}
            {(isSelected || isMultiSelected) && (
                <div
                    data-html2canvas-ignore="true"
                    className="absolute inset-[-2px] pointer-events-none z-50"
                    style={{
                        border: isMultiSelected && !isSelected
                            ? '2px dashed #8B5CF6' // Purple dashed for multi-select
                            : '2px solid #3B82F6', // Solid Blue for primary
                        borderRadius: `${(el.style.borderRadius as number || 0) + 2}px`,
                        boxShadow: isMultiSelected ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : '0 0 0 2px rgba(59, 130, 246, 0.1)'
                    }}
                />
            )}

            {/* Hover Indicator */}
            {!isSelected && !isMultiSelected && (
                <div
                    data-html2canvas-ignore="true"
                    className="absolute inset-0 pointer-events-none group-hover:border"
                    style={{ borderColor: '#d1d5db' }}
                />
            )}
            {/* Measurement Tooltip */}
            {(isDragging || isResizing) && showMeasurement && (
                <div
                    data-html2canvas-ignore="true"
                    className="absolute -top-10 left-1/2 -translate-x-1/2 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-[100] font-mono border"
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
                    data-html2canvas-ignore="true"
                    className="absolute -top-6 left-0 text-white text-[9px] px-1.5 py-0.5 rounded-t font-medium tracking-wider uppercase"
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
                        data-html2canvas-ignore="true"
                        className={`resize-handle absolute w-3 h-3 bg-white border-2 rounded-full z-[60] shadow-sm hover:scale-125 transition-transform ${isResizing === handle ? 'scale-150' : ''}`}
                        style={{
                            ...getHandlePosition(handle),
                            borderColor: '#3b82f6'
                        }}
                        onMouseDown={(e) => handleResizeStart(handle, e)}
                    />
                ))}

            {/* Element Content */}
            <div className="w-full h-full relative" style={{ direction: 'ltr' }}>
                {el.type === 'divider' ? (
                    <div
                        className="w-full h-0 border-t absolute top-1/2 -translate-y-1/2"
                        style={{ borderColor: '#9ca3af' }}
                    />
                ) : el.type === 'social-icon' ? (
                    <SocialIconElement
                        element={el}
                        isSelected={isSelected}
                        onSelect={() => onSelect(el.id)}
                        onUpdate={(updates) => {
                            // Handle updates for social icon
                            Object.keys(updates).forEach(key => {
                                if (key === 'style') {
                                    Object.assign(el.style, updates.style)
                                } else {
                                    el[key] = updates[key]
                                }
                            })
                        }}
                    />
                ) : el.type === 'link' ? (
                    <LinkElement
                        element={el}
                        isSelected={isSelected}
                        onSelect={() => onSelect(el.id)}
                        onUpdate={(updates) => {
                            // Handle updates for link
                            Object.keys(updates).forEach(key => {
                                if (key === 'style') {
                                    Object.assign(el.style, updates.style)
                                } else {
                                    el[key] = updates[key]
                                }
                            })
                        }}
                    />
                ) : el.type === 'line' ? (
                    <LineElement
                        element={el}
                        isSelected={isSelected}
                        onSelect={() => onSelect(el.id)}
                        onUpdate={(updates) => {
                            // Handle updates for line
                            Object.keys(updates).forEach(key => {
                                if (key === 'style') {
                                    Object.assign(el.style, updates.style)
                                } else {
                                    el[key] = updates[key]
                                }
                            })
                        }}
                    />
                ) : (
                    <div
                        ref={contentEditableRef}
                        contentEditable={isEditing === el.id}
                        suppressContentEditableWarning
                        onInput={(e) => handleContentChange(e.currentTarget.innerText || '')}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            setIsEditing?.(null)
                            onBlur?.(el.id)
                        }}
                        spellCheck={false}
                        className={`w-full outline-none break-words whitespace-pre-wrap ${isEditing === el.id ? 'cursor-text' : 'cursor-inherit'}`}
                        style={{
                            textAlign: el.style.textAlign as any,
                            minHeight: '100%',
                            display: 'block',
                            direction: 'ltr'
                        }}
                    >
                        {/* NO CHILDREN RENDERED HERE - Managed by useEffect */}
                    </div>
                )}
            </div>
        </div>
    )
}
