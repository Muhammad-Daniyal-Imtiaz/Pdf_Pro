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
  linkedin: '#0A66C2', email: '#EA4335', phone: '#10B981', twitter: '#1DA1F2',
  github: '#181717', website: '#6366F1', instagram: '#E4405F', facebook: '#1877F2',
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
  const [resizeStart, setResizeStart] = React.useState<{
    x: number; y: number; initialW: number; initialH: number
  } | null>(null)

  // Stable refs to avoid stale closures in event listeners
  const resizingIdRef = React.useRef<string | null>(null)
  const resizeStartRef = React.useRef<typeof resizeStart>(null)

  React.useEffect(() => {
    resizingIdRef.current = resizingId
    resizeStartRef.current = resizeStart
  }, [resizingId, resizeStart])

  // Resize mouse tracking
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

    // Round to integers — must match API renderer for pixel-perfect WYSIWYG
    const exactX = Math.round(x)
    const exactY = Math.round(y)
    const exactW = Math.round(Number(elStyle.width) || 100)
    const exactH = Math.round(Number(elStyle.height) || 40)

    const isTextElement = ['text', 'paragraph', 'heading'].includes(type)
    const isBackground = element.isImported && type === 'image' && exactW >= A4_WIDTH
    const shouldMask = element.isImported && (element.isModified || isEditing)

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${exactX}px`,
      top: `${exactY}px`,
      width: `${exactW}px`,
      height: `${exactH}px`,
      zIndex: elStyle.zIndex ?? (isBackground ? 0 : 2),
      backgroundColor: shouldMask
        ? (elStyle.backgroundColor || '#ffffff')
        : (elStyle.backgroundColor || 'transparent'),
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
      transform: `rotate(${elStyle.rotation || 0}deg)`,
      transformOrigin: 'top left',
      fontStyle: elStyle.fontStyle || 'normal',
      // Imported unmodified elements are near-invisible so the original PDF shows through
      opacity: (element.isImported && !element.isModified && !isEditing && !isSelected && isTextElement)
        ? 0.01
        : (elStyle.opacity ?? 1),
      borderRadius: `${elStyle.borderRadius || 0}px`,
      border: elStyle.borderWidth
        ? `${elStyle.borderWidth}px solid ${elStyle.borderColor || '#cccccc'}`
        : 'none',
      pointerEvents: 'auto',
      transition: 'opacity 0.1s ease-out, background-color 0.1s ease-out',
      overflow: 'hidden',
    }

    const handleMouseDown = (e: React.MouseEvent) => onElementMouseDown?.(id, e)
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onElementDoubleClick?.(id, e)
    }

    const renderTextContent = () => {
      const textMeasurementService = getTextMeasurementService()
      const mode = elStyle.resizeMode || 'fixed'
      const isAutoHeight = mode === 'auto-height' || mode === 'auto-both'
      const isAutoWidth = mode === 'auto-width' || mode === 'auto-both'

      const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!isEditing) return
        const text = e.currentTarget.innerText || ''
        const padding = elStyle.padding || 0
        const availableW = exactW - (padding * 2)

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
        if (isAutoWidth) newW = Math.ceil(measurement.width + (padding * 2) + 12)
        if (isAutoHeight) newH = Math.ceil(measurement.height + (padding * 2))
        newW = Math.min(newW, A4_WIDTH - exactX - 10)

        if (newW !== exactW || newH !== exactH) onResize?.(id, newW, newH)
      }

      const overflow = mode === 'fixed'
        ? textMeasurementService.checkOverflow(
          content || '',
          {
            fontFamily: elStyle.fontFamily || 'Inter, sans-serif',
            fontSize: elStyle.fontSize || 14,
            fontWeight: elStyle.fontWeight || 400,
            lineHeight: elStyle.lineHeight || 1.5
          },
          exactW, exactH, elStyle.padding || 0
        )
        : { isOverflowing: false }

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
            onDoubleClick={(e) => { if (!isEditing) handleDoubleClick(e) }}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '1em',
              fontFamily: elStyle.fontFamily || 'Inter, Arial, sans-serif',
              fontSize: `${elStyle.fontSize || 14}px`,
              fontWeight: elStyle.fontWeight || 400,
              // ⚠️ WYSIWYG critical: lineHeight must match generate-pdf-route.ts exactly
              lineHeight: elStyle.lineHeight || 1.4,
              color: elStyle.color || '#000000',
              textAlign: (elStyle.textAlign as any) || 'left',
              padding: `${elStyle.padding || 0}px`,
              letterSpacing: elStyle.letterSpacing ? `${elStyle.letterSpacing}px` : 'normal',
              outline: 'none',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: isAutoWidth ? 'nowrap' : 'pre-wrap',
              cursor: isEditing ? 'text' : 'inherit',
              userSelect: isEditing ? 'text' : 'none',
              boxSizing: 'border-box',
              WebkitFontSmoothing: 'antialiased',
              display: 'block',
              overflow: isAutoHeight ? 'visible' : (mode === 'fixed' ? 'hidden' : 'visible'),
            }}
            onClick={(e) => isEditing && e.stopPropagation()}
            dangerouslySetInnerHTML={
              isEditing
                ? undefined
                : { __html: (content || '').replace(/\n/g, '<br>') }
            }
          >
            {isEditing ? (content || '') : null}
          </div>

          {/* Overflow warning badge */}
          {overflow.isOverflowing && !isEditing && mode === 'fixed' && (
            <div
              data-html2canvas-ignore="true"
              className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-50 cursor-pointer pointer-events-auto"
              title="Text overflows container — click to auto-expand height"
              onClick={(e) => {
                e.stopPropagation()
                const m = textMeasurementService.measureText(
                  content || '',
                  {
                    fontFamily: elStyle.fontFamily || 'Inter, sans-serif',
                    fontSize: elStyle.fontSize || 14,
                    fontWeight: elStyle.fontWeight || 400,
                    lineHeight: elStyle.lineHeight || 1.5
                  },
                  exactW - (elStyle.padding || 0) * 2
                )
                onResize?.(id, exactW, Math.ceil(m.height + (elStyle.padding || 0) * 2))
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
          const iconSize = Math.min(exactW, exactH) * 0.72
          if (!Icon) return null
          return (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={Math.round(iconSize)} color={color} style={{ display: 'block', flexShrink: 0 }} />
            </div>
          )
        }

        case 'line': {
          const lineColor = elStyle.backgroundColor || '#000000'
          const isSolid = !element.lineStyle || element.lineStyle === 'solid'
          const isHorizontal = element.lineOrientation !== 'vertical'
          if (isSolid) {
            return <div style={{ width: '100%', height: '100%', backgroundColor: lineColor }} />
          }
          return (
            <div style={{
              width: '100%', height: '100%',
              borderTop: isHorizontal ? `${exactH}px ${element.lineStyle} ${lineColor}` : undefined,
              borderLeft: !isHorizontal ? `${exactW}px ${element.lineStyle} ${lineColor}` : undefined,
              backgroundColor: 'transparent'
            }} />
          )
        }

        case 'image':
          return (
            <div style={{
              width: '100%', height: '100%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: content ? 'transparent' : (elStyle.backgroundColor || '#f3f4f6'),
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
                <svg
                  width="40%" height="40%"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                  style={{ opacity: 0.5 }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>
          )

        case 'shape':
        case 'container':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              background: elStyle.backgroundColor || 'transparent',
              position: 'relative',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }} />
          )

        case 'link': {
          const ExternalIcon = ICON_MAP['external']
          return (
            <div style={{
              width: '100%', height: '100%',
              fontFamily: elStyle.fontFamily || 'Inter, sans-serif',
              fontSize: `${elStyle.fontSize || 12}px`,
              color: elStyle.color || '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '4px 8px',
              overflow: 'hidden',
            }}>
              {ExternalIcon && (
                <ExternalIcon size={14} color={elStyle.color || '#6366f1'} style={{ display: 'block', flexShrink: 0 }} />
              )}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {content}
              </span>
            </div>
          )
        }

        case 'text':
        case 'heading':
        case 'paragraph':
        default:
          return renderTextContent()
      }
    }

    return (
      // ✅ FIXED: was `key={id || \`element-key-${Math.random()}\`}` which caused
      // every element to unmount+remount on every render → catastrophic performance.
      // Now correctly keyed by stable ID.
      <div
        key={id}
        style={{
          ...baseStyles,
          // Selection outline via box-shadow (not CSS outline) so it doesn't affect PDF layout
          boxShadow: isSelected
            ? 'inset 0 0 0 2px #3b82f6, 0 0 0 2px rgba(59,130,246,0.3)'
            : (elStyle.boxShadow || 'none'),
        }}
        className={isBackground ? '' : 'pdf-element'}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {renderContent()}

        {/* Selection UI — data-html2canvas-ignore prevents it showing in PDF preview */}
        {isSelected && showSelection && (
          <div data-html2canvas-ignore="true">
            {/* Type label */}
            <div style={{
              position: 'absolute',
              top: -22,
              left: 0,
              background: '#3b82f6',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '3px',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              zIndex: 10,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}>
              {type}
            </div>

            {/* Resize handle (bottom-right) */}
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
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setResizingId(id)
                setResizeStart({ x: e.clientX, y: e.clientY, initialW: exactW, initialH: exactH })
              }}
            />

            {/* Top-left, top-right, bottom-left corner dots for visual feedback */}
            {([
              { style: { top: -5, left: -5 } },
              { style: { top: -5, right: -5 } },
              { style: { bottom: -5, left: -5 } },
            ] as { style: React.CSSProperties }[]).map((dot, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 19,
                ...dot.style
              }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Sort by zIndex before rendering (painter's algorithm = same as PDF)
  const sortedElements = React.useMemo(
    () => [...elements].sort((a, b) => ((a.style.zIndex || 0) - (b.style.zIndex || 0))),
    [elements]
  )

  return (
    <div
      className="pdf-page"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {sortedElements.map(renderElement)}

      {/* Processing overlay */}
      {isProcessing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: '#fff',
            padding: '20px 40px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #e5e7eb',
          }}>
            <Loader2 className="animate-spin text-blue-600" size={28} />
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>
              Processing…
            </span>
          </div>
        </div>
      )}
    </div>
  )
}