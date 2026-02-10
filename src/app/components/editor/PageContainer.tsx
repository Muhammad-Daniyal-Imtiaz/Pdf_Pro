'use client'

import React, { useRef, useCallback, useState } from 'react'
import { EditorElement, EditorPage } from '@/app/store/useEditorStore'
import OverlayLayer from './OverlayLayer'

interface PageContainerProps {
  page: EditorPage
  pageIndex: number
  zoom: number
  showGrid?: boolean
  onElementSelect: (id: string | null) => void
  onElementUpdate: (id: string, updates: Partial<EditorElement>) => void
  onElementMove: (id: string, x: number, y: number) => void
  selectedIds: string[]
}

/**
 * PageContainer - Robust container for PDF page with editable overlay
 * 
 * Architecture:
 * - Container: Fixed dimensions matching the page size
 * - Background Layer: Renders the PDF background image
 * - Overlay Layer: Absolutely positioned, holds all editable elements
 * 
 * Key principle: Overlay has position:absolute with inset:0, ensuring
 * element coordinates (x, y) are always relative to the page origin.
 */
export default function PageContainer({
  page,
  pageIndex,
  zoom,
  showGrid = false,
  onElementSelect,
  onElementUpdate,
  onElementMove,
  selectedIds,
}: PageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on container, not on an element
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset?.role === 'background') {
      onElementSelect(null)
      setEditingId(null)
    }
  }, [onElementSelect])

  const handleElementSelect = useCallback((id: string) => {
    onElementSelect(id)
  }, [onElementSelect])

  const handleElementEdit = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const handleElementBlur = useCallback((id: string, content: string) => {
    setEditingId(null)
    // Mark imported elements as modified when edited
    const element = page.elements.find(el => el.id === id)
    if (element?.isImported) {
      onElementUpdate(id, { content, isModified: true })
    } else {
      onElementUpdate(id, { content })
    }
  }, [page.elements, onElementUpdate])

  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    onElementMove(id, x, y)
  }, [onElementMove])

  // Calculate scaled dimensions
  const width = page.width || 794
  const height = page.height || 1123
  const scale = zoom / 100

  return (
    <div
      ref={containerRef}
      className="relative shadow-lg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        backgroundColor: 'white',
      }}
      onClick={handleContainerClick}
    >
      {/* Background Layer - PDF rendered as image */}
      <div
        data-role="background"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {page.backgroundImage ? (
          <img
            src={page.backgroundImage}
            alt={`Page ${pageIndex + 1}`}
            className="w-full h-full object-fill"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-white" />
        )}
      </div>

      {/* Grid Overlay - Optional alignment guide */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Editable Overlay Layer - Contains all interactive elements */}
      <OverlayLayer
        elements={page.elements}
        selectedIds={selectedIds}
        editingId={editingId}
        onElementSelect={handleElementSelect}
        onElementEdit={handleElementEdit}
        onElementBlur={handleElementBlur}
        onElementMove={handleElementMove}
        containerRef={containerRef}
      />
    </div>
  )
}
