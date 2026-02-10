'use client'

import React from 'react'
import { EditorElement } from '@/app/store/useEditorStore'
import EditableElement from './EditableElement'

interface OverlayLayerProps {
  elements: EditorElement[]
  selectedIds: string[]
  editingId: string | null
  onElementSelect: (id: string) => void
  onElementEdit: (id: string) => void
  onElementBlur: (id: string, content: string) => void
  onElementMove: (id: string, x: number, y: number) => void
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * OverlayLayer - Contains all editable elements positioned absolutely
 * 
 * This layer sits on top of the PDF background and contains all interactive
 * elements. Each element is positioned using CSS absolute positioning with
 * coordinates (x, y) relative to the top-left corner of the page.
 * 
 * Key features:
 * - Single-click to edit text elements
 * - Drag to move elements
 * - Selection highlighting
 * - Exact coordinate positioning (no drift)
 */
export default function OverlayLayer({
  elements,
  selectedIds,
  editingId,
  onElementSelect,
  onElementEdit,
  onElementBlur,
  onElementMove,
  containerRef,
}: OverlayLayerProps) {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 10 }}
    >
      {elements.map((element) => (
        <EditableElement
          key={element.id}
          element={element}
          isSelected={selectedIds.includes(element.id)}
          isEditing={editingId === element.id}
          onSelect={() => onElementSelect(element.id)}
          onEdit={() => onElementEdit(element.id)}
          onBlur={(content) => onElementBlur(element.id, content)}
          onMove={(x, y) => onElementMove(element.id, x, y)}
          containerRef={containerRef}
        />
      ))}
    </div>
  )
}
