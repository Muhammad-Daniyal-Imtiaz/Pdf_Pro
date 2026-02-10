'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'

interface EditableElementProps {
  element: EditorElement
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onEdit: () => void
  onBlur: (content: string) => void
  onMove: (x: number, y: number) => void
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * EditableElement - Individual editable element with drag and edit capabilities
 * 
 * Handles:
 * - Single-click to edit text elements
 * - Drag to move elements
 * - Selection highlighting
 * - Content editing with auto-resizing input
 */
export default function EditableElement({
  element,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onBlur,
  onMove,
  containerRef,
}: EditableElementProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elX: 0, elY: 0 })
  const [editContent, setEditContent] = useState(element.content)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Update edit content when element content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditContent(element.content)
    }
  }, [element.content, isEditing])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()

    // Only start dragging if not in edit mode
    if (!isEditing) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        elX: element.x,
        elY: element.y,
      })
    }
  }, [element.x, element.y, isEditing, onSelect])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Enable editing on single click for text elements
    if (element.type === 'text' || element.type === 'heading' || element.type === 'paragraph') {
      onEdit()
    }
  }, [element.type, onEdit])

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      
      // Calculate new position relative to container
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      const newX = Math.round(dragStart.elX + deltaX)
      const newY = Math.round(dragStart.elY + deltaY)
      
      // Clamp to container bounds
      const clampedX = Math.max(0, Math.min(newX, containerRect.width - element.style.width))
      const clampedY = Math.max(0, Math.min(newY, containerRect.height - element.style.height))
      
      onMove(clampedX, clampedY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, element.style.width, element.style.height, onMove, containerRef])

  const handleBlur = useCallback(() => {
    onBlur(editContent)
  }, [editContent, onBlur])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onBlur(editContent)
    }
    if (e.key === 'Escape') {
      setEditContent(element.content) // Revert changes
      onBlur(element.content)
    }
  }, [editContent, element.content, onBlur])

  // Base styles for element wrapper
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.style.width}px`,
    height: `${element.style.height}px`,
    zIndex: (element.style.zIndex || 1) + 10, // Ensure elements are above background
    cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
    outline: isSelected ? '2px solid #3b82f6' : 'none',
    outlineOffset: '2px',
    userSelect: 'none',
    // Hide imported elements until they are edited to prevent ghosting
    opacity: element.isImported && !element.isModified ? 0 : (element.style.opacity || 1),
  }

  // Render different content based on element type
  const renderContent = () => {
    const { style, type, content } = element

    if (isEditing && (type === 'text' || type === 'heading' || type === 'paragraph')) {
      return (
        <textarea
          ref={inputRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full resize-none border-none outline-none bg-transparent p-0 m-0"
          style={{
            fontFamily: style.fontFamily || 'Arial, sans-serif',
            fontSize: `${style.fontSize || 14}px`,
            fontWeight: style.fontWeight || 'normal',
            color: style.color || '#000000',
            lineHeight: style.lineHeight || 1.2,
            textAlign: (style.textAlign as any) || 'left',
            overflow: 'hidden',
          }}
        />
      )
    }

    // Default display for all element types
    return (
      <div
        className="w-full h-full overflow-hidden"
        style={{
          fontFamily: style.fontFamily || 'Arial, sans-serif',
          fontSize: `${style.fontSize || 14}px`,
          fontWeight: style.fontWeight || 'normal',
          color: style.color || '#000000',
          lineHeight: style.lineHeight || 1.2,
          textAlign: (style.textAlign as any) || 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      style={wrapperStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`editable-element ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
    >
      {/* Element type indicator when selected */}
      {isSelected && (
        <div 
          className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded pointer-events-none"
          style={{ zIndex: 100 }}
        >
          {element.type}
        </div>
      )}
      
      {renderContent()}
    </div>
  )
}
