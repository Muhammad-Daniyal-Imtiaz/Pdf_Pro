'use client'

import React, { useRef, useEffect } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'

interface EditableElementProps {
    element: EditorElement
    isEditing: boolean
    displayColor: string
    displayOpacity: number
    onBlur: () => void
    onContentChange: (id: string, content: string, markAsModified?: boolean) => void
    onDoubleClick: (e: React.MouseEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
}

export default function EditableElement({
    element,
    isEditing,
    displayColor,
    displayOpacity,
    onBlur,
    onContentChange,
    onDoubleClick,
    onMouseDown
}: EditableElementProps) {
    const contentRef = useRef<HTMLDivElement>(null)
    const { id, content, style, type, isImported } = element

    useEffect(() => {
        if (isEditing && contentRef.current) {
            contentRef.current.focus()
            // Move cursor to end
            const range = document.createRange()
            const sel = window.getSelection()
            range.selectNodeContents(contentRef.current)
            range.collapse(false)
            sel?.removeAllRanges()
            sel?.addRange(range)
        }
    }, [isEditing])

    const handleBlur = () => {
        const newContent = contentRef.current?.innerText || ''
        onBlur()
        if (newContent !== content) {
            onContentChange(id, newContent, !!isImported)
        }
    }

    const commonStyles: React.CSSProperties = {
        width: '100%',
        height: '100%',
        fontFamily: style.fontFamily || 'Inter, sans-serif',
        fontSize: `${style.fontSize || 14}px`,
        fontWeight: style.fontWeight || 400,
        lineHeight: style.lineHeight || 1.5,
        color: displayColor,
        textAlign: style.textAlign || 'left',
        padding: `${style.padding || 8}px`,
        outline: 'none',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        cursor: isEditing ? 'text' : 'inherit',
        userSelect: isEditing ? 'text' : 'none',
        boxSizing: 'border-box',
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        position: 'relative',
        opacity: displayOpacity
    }

    const textContent = isEditing ? content : (content || '').replace(/\n/g, '<br>')

    if (type === 'container') {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: style.backgroundColor || 'transparent',
                    border: `${style.borderWidth || 1}px solid ${style.borderColor || '#000'}`,
                    borderRadius: style.borderRadius,
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                }}
                onMouseDown={onMouseDown}
                onDoubleClick={onDoubleClick}
            >
                <div
                    ref={contentRef}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={handleBlur}
                    style={{ ...commonStyles, color: style.color || '#000000' }}
                    dangerouslySetInnerHTML={isEditing ? undefined : { __html: textContent }}
                >
                    {isEditing ? content : null}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={contentRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            style={commonStyles}
            dangerouslySetInnerHTML={isEditing ? undefined : { __html: textContent }}
        >
            {isEditing ? content : null}
        </div>
    )
}
