// components/editor/PDFRenderer.tsx
'use client'

import React from 'react'
import { EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import {
  Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram,
  Facebook, Youtube, MapPin, Calendar, User, Download, ExternalLink,
  Check, X, Star, Heart, AlertCircle, Loader2
} from 'lucide-react'
import { sanitizeContent } from '@/app/lib/sanitize'
import { getTextMeasurementService } from '@/app/lib/text-measurement-service'

interface PDFRendererProps {
  elements: EditorElement[]
  width?: number
  height?: number
  showSelection?: boolean
  selectedIds?: string[]
  onElementMouseDown?: (id: string, e: React.MouseEvent) => void
  onElementDoubleClick?: (id: string, e: React.MouseEvent) => void
  onContentChange?: (id: string, content: string) => void
  onResize?: (id: string, width: number, height: number) => void
  onBlur?: () => void
  editingId?: string | null
  zoom?: number
  isProcessing?: boolean
}

const ICON_MAP: Record<string, any> = {
  linkedin: Linkedin, email: Mail, phone: Phone, twitter: Twitter,
  github: Github, website: Globe, instagram: Instagram, facebook: Facebook,
  youtube: Youtube, whatsapp: Phone, location: MapPin, calendar: Calendar,
  user: User, download: Download, external: ExternalLink,
  check: Check, x: X, star: Star, heart: Heart
}

const ICON_COLORS: Record<string, string> = {
  linkedin: '#0077b5', email: '#EA4335', phone: '#10B981', twitter: '#1DA1F2',
  github: '#333', website: '#6366F1', instagram: '#E4405F', facebook: '#1877F2',
  youtube: '#FF0000', whatsapp: '#25D366', location: '#EF4444', calendar: '#F59E0B',
  user: '#6B7280', download: '#10B981', external: '#6366F1',
  check: '#10B981', x: '#EF4444', star: '#F59E0B', heart: '#EC4899'
}

export default function PDFRenderer({
  elements,
  width = A4_WIDTH,
  height = A4_HEIGHT,
  showSelection = false,
  selectedIds = [],
  onElementMouseDown,
  onElementDoubleClick,
  onContentChange,
  onResize,
  onBlur,
  editingId,
  zoom = 100,
  isProcessing = false
}: PDFRendererProps) {
  const [resizingId, setResizingId] = React.useState<string | null>(null)
  const [resizeStart, setResizeStart] = React.useState<{ x: number, y: number, initialW: number, initialH: number } | null>(null)

  // Use refs to avoid memory leaks and unnecessary re-renders in persistent listeners
  const resizingIdRef = React.useRef<string | null>(null)
  const resizeStartRef = React.useRef<{ x: number, y: number, initialW: number, initialH: number } | null>(null)

  React.useEffect(() => {
    resizingIdRef.current = resizingId
    resizeStartRef.current = resizeStart
  }, [resizingId, resizeStart])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingIdRef.current || !resizeStartRef.current) return

      const zoomFactor = zoom / 100
      const deltaX = (e.clientX - resizeStartRef.current.x) / zoomFactor
      const deltaY = (e.clientY - resizeStartRef.current.y) / zoomFactor

      const newW = Math.max(20, resizeStartRef.current.initialW + deltaX)
      const newH = Math.max(20, resizeStartRef.current.initialH + deltaY)

      onResize?.(resizingIdRef.current, Math.round(newW), Math.round(newH))
    }

    const handleMouseUp = () => {
      setResizingId(null)
      setResizeStart(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [zoom, onResize])

  const renderElement = (element: EditorElement) => {
    const isSelected = showSelection && selectedIds.includes(element.id)
    const isEditing = editingId === element.id
    const { style: elStyle, type, content, id, iconType, lineOrientation, x, y } = element

    // MATCH API LOGIC: Round to integers
    const exactX = Math.round(x)
    const exactY = Math.round(y)
    const exactW = Math.round(elStyle.width || 100)
    const exactH = Math.round(elStyle.height || 40)

    const isTextElement = ['text', 'paragraph', 'heading'].includes(type)
    const isBackground = element.isImported && type === 'image' && exactW >= A4_WIDTH
    const shouldMask = (element.isImported && (element.isModified || isEditing))

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${exactX}px`,
      top: `${exactY}px`,
      width: `${exactW}px`,
      height: `${exactH}px`,
      zIndex: elStyle.zIndex ?? (isBackground ? 0 : 2),
      // If we are editing or modified an imported element, we MUST show the background color
      // to act as a "live mask" over the original PDF text.
      backgroundColor: shouldMask ? (elStyle.backgroundColor || '#ffffff') : (elStyle.backgroundColor || 'transparent'),
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
      transform: `rotate(${elStyle.rotation || 0}deg)`,
      transformOrigin: 'top left',
      fontStyle: elStyle.fontStyle || 'normal',
      // SMART VISIBILITY: 
      // Unmodified imported text is Nearly invisible (0.01) so they see the crisp original.
      // Once they click/edit/modify, it pops to 1.0 and masks the original.
      opacity: (element.isImported && !element.isModified && !isEditing && !isSelected && isTextElement)
        ? 0.01
        : (elStyle.opacity ?? 1),
      borderRadius: `${elStyle.borderRadius || 0}px`,
      pointerEvents: 'auto', // Allow all elements to be selected/interacted with
      transition: 'opacity 0.1s ease-out, background-color 0.1s ease-out',
      overflow: 'visible'
    }

    const handleClick = (e: React.MouseEvent) => {
      // handled by parent
    }

    const handleMouseDown = (e: React.MouseEvent) => {
      onElementMouseDown?.(id, e)
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onElementDoubleClick?.(id, e)
    }

    const renderTextContent = (isInsideContainer: boolean = false) => {
      const textMeasurementService = getTextMeasurementService()
      const mode = elStyle.resizeMode || 'fixed'
      
      // For AI-generated elements with auto-height, we need special handling
      const isAutoHeight = mode === 'auto-height' || mode === 'auto-both'
      const isAutoWidth = mode === 'auto-width' || mode === 'auto-both'

      const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!isEditing) return

        const text = e.currentTarget.innerText || ''
        const padding = elStyle.padding || 0
        const availableW = exactW - (padding * 2)

        // Measure text with current style and constraints
        const measurement = textMeasurementService.measureText(
          text,
          {
            fontFamily: elStyle.fontFamily || 'Inter, sans-serif',
            fontSize: elStyle.fontSize || 14,
            fontWeight: elStyle.fontWeight || 400,
            lineHeight: elStyle.lineHeight || 1.5
          },
          isAutoWidth ? undefined : availableW
        )

        let newW = exactW
        let newH = exactH

        // Logic for different resize modes
        if (isAutoWidth) {
          newW = Math.ceil(measurement.width + (padding * 2) + 12)
        }

        if (isAutoHeight) {
          newH = Math.ceil(measurement.height + (padding * 2))
        }

        // Cap width to page boundary
        const widthLimit = A4_WIDTH - exactX - 10
        newW = Math.min(newW, widthLimit)

        if (newW !== exactW || newH !== exactH) {
          onResize?.(id, newW, newH)
        }
      }

      // Check overflow for fixed mode only (auto-height should never overflow)
      const overflow = mode === 'fixed' ? textMeasurementService.checkOverflow(
        content,
        {
          fontFamily: elStyle.fontFamily || 'Inter, sans-serif',
          fontSize: elStyle.fontSize || 14,
          fontWeight: elStyle.fontWeight || 400,
          lineHeight: elStyle.lineHeight || 1.5
        },
        exactW,
        exactH,
        elStyle.padding || 0
      ) : { isOverflowing: false }

      return (
        <div className="relative w-full h-full">
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={(e) => {
              onBlur?.()
              onContentChange?.(id, e.currentTarget.innerText)
            }}
            onDoubleClick={(e) => {
              if (!isEditing) handleDoubleClick(e)
            }}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '1em',
              fontFamily: elStyle.fontFamily || 'Inter, Arial, sans-serif',
              fontSize: `${elStyle.fontSize}px`,
              fontWeight: elStyle.fontWeight,
              lineHeight: 1.5, // FORCE 1.5 for absolute stability
              color: elStyle.color || '#000000',
              textAlign: elStyle.textAlign || 'left',
              padding: `${elStyle.padding || 0}px`, // Always use style padding
              outline: 'none',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: isAutoWidth ? 'nowrap' : 'pre-wrap',
              cursor: isEditing ? 'text' : 'inherit',
              userSelect: isEditing ? 'text' : 'none',
              boxSizing: 'border-box',
              WebkitFontSmoothing: 'antialiased',
              display: 'block',
              // CRITICAL: For auto-height, use visible overflow to show all content
              // For fixed mode, use hidden to indicate truncation
              overflow: isAutoHeight ? 'visible' : (mode === 'fixed' ? 'hidden' : 'visible')
            }}
            onClick={(e) => isEditing && e.stopPropagation()}
            dangerouslySetInnerHTML={isEditing ? undefined : { __html: (content || '').replace(/\n/g, '<br>') }}
          >
            {isEditing ? (content || '') : null}
          </div>

          {/* OVERFLOW INDICATOR - Only for fixed mode */}
          {overflow.isOverflowing && !isEditing && mode === 'fixed' && (
            <div
              className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-50 cursor-pointer pointer-events-auto"
              title="Content exceeds container size. Click to expand."
              onClick={(e) => {
                e.stopPropagation()
                const measurement = textMeasurementService.measureText(
                  content,
                  {
                    fontFamily: elStyle.fontFamily || 'Inter, sans-serif',
                    fontSize: elStyle.fontSize || 14,
                    fontWeight: elStyle.fontWeight || 400,
                    lineHeight: elStyle.lineHeight || 1.5
                  },
                  exactW - (elStyle.padding || 0) * 2
                )
                onResize?.(id, exactW, Math.ceil(measurement.height + (elStyle.padding || 0) * 2))
              }}
            >
              <AlertCircle size={10} />
            </div>
          )}
        </div>
      )
    }

    const renderContent = () => {
      switch (type) {
        case 'social-icon': {
          const Icon = ICON_MAP[iconType || 'user']
          const color = ICON_COLORS[iconType || 'user'] || '#6b7280'
          const iconSize = Math.min(exactW, exactH) * 0.8
          if (!Icon) return null
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={Math.round(iconSize)} color={color} style={{ display: 'block' }} />
            </div>
          )
        }

        case 'line': {
          const isSolid = !element.lineStyle || element.lineStyle === 'solid'
          if (isSolid) {
            return (
              <div style={{ width: '100%', height: '100%', backgroundColor: elStyle.backgroundColor || '#000' }} />
            )
          }
          const isHorizontal = element.lineOrientation === 'horizontal'
          return (
            <div style={{
              width: '100%',
              height: '100%',
              borderTop: isHorizontal ? `${elStyle.height}px ${element.lineStyle} ${elStyle.backgroundColor || '#000'}` : undefined,
              borderLeft: !isHorizontal ? `${elStyle.width}px ${element.lineStyle} ${elStyle.backgroundColor || '#000'}` : undefined,
              backgroundColor: 'transparent'
            }} />
          )
        }

        case 'image':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: content ? 'transparent' : '#f3f4f6'
            }}>
              {content ? (
                <img
                  src={content}
                  alt="Element"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isBackground ? 'contain' : 'cover',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                  draggable={false}
                />
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Click to Upload</div>
              )}
            </div>
          )

        case 'container':
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: elStyle.backgroundColor || 'transparent',
                border: elStyle.borderWidth ? `${elStyle.borderWidth}px solid ${elStyle.borderColor}` : 'none',
                borderRadius: elStyle.borderRadius,
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
            >
              {renderTextContent(true)}
            </div>
          )

        case 'link': {
          const Icon = ICON_MAP['external']
          return (
            <div style={{ width: '100%', height: '100%', fontFamily: elStyle.fontFamily, fontSize: `${elStyle.fontSize}px`, color: elStyle.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}>
              <Icon size={16} color={elStyle.color} style={{ display: 'block' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</span>
            </div>
          )
        }

        default:
          return renderTextContent(false)
      }
    }

    return (
      <div
        key={id}
        style={{
          ...baseStyles,
          outline: isSelected ? '2px solid #3b82f6' : 'none',
          outlineOffset: isSelected ? '2px' : '0'
        }}
        className={isBackground ? "" : "pdf-element"}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {renderContent()}

        {isSelected && showSelection && (
          <>
            {/* Element Label */}
            <div style={{ position: 'absolute', top: -22, left: 0, background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase', pointerEvents: 'none', zIndex: 10 }}>
              {type}
            </div>

            {/* Resize Handle */}
            <div
              style={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                width: 12,
                height: 12,
                backgroundColor: '#fff',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setResizingId(id)
                setResizeStart({
                  x: e.clientX,
                  y: e.clientY,
                  initialW: exactW,
                  initialH: exactH
                })
              }}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className="pdf-page"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: '#fff',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {elements.map(renderElement)}

      {isProcessing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#fff',
            padding: '20px 40px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span style={{ fontWeight: 500, color: '#374151' }}>Processing PDF...</span>
          </div>
        </div>
      )}
    </div>
  )
}