// components/editor/PDFRenderer.tsx
'use client'

import React from 'react'
import { EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import {
  Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram,
  Facebook, Youtube, MapPin, Calendar, User, Download, ExternalLink,
  Check, X, Star, Heart
} from 'lucide-react'

interface PDFRendererProps {
  elements: EditorElement[]
  width?: number
  height?: number
  showSelection?: boolean
  selectedIds?: string[]
  onElementMouseDown?: (id: string, e: React.MouseEvent) => void
  onElementDoubleClick?: (id: string, e: React.MouseEvent) => void
  onContentChange?: (id: string, content: string) => void
  onBlur?: () => void
  editingId?: string | null
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
  onBlur,
  editingId
}: PDFRendererProps) {

  const renderElement = (element: EditorElement) => {
    const isSelected = showSelection && selectedIds.includes(element.id)
    const isEditing = editingId === element.id
    const { style: elStyle, type, content, id, iconType, lineOrientation, x, y } = element

    // MATCH API LOGIC: Round to integers
    const exactX = Math.round(x)
    const exactY = Math.round(y)
    const exactW = Math.round(elStyle.width || 100)
    const exactH = Math.round(elStyle.height || 40)

    const isBackground = element.isImported && type === 'image' && exactW >= A4_WIDTH

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${exactX}px`,
      top: `${exactY}px`,
      width: `${exactW}px`,
      height: `${exactH}px`,
      zIndex: elStyle.zIndex ?? 1,
      backgroundColor: elStyle.backgroundColor || 'transparent',
      boxSizing: 'border-box', // MATCHES API
      margin: 0,
      padding: 0,
      transform: `rotate(${elStyle.rotation || 0}deg)`,
      transformOrigin: 'top left', // Matches API default
      fontStyle: elStyle.fontStyle || 'normal',
      // SMART VISIBILITY: Hide masking boxes for unmodified imported TEXT only.
      // We keep images (like the background) visible so the user can see the PDF. 
      // Text is kept nearly invisible (0.01) so they see the crisp original background text,
      // but it becomes fully visible when edited or modified (masking logic).
      opacity: (element.isImported && !element.isModified && !isEditing && ['text', 'paragraph', 'heading'].includes(type))
        ? 0.01
        : (elStyle.opacity ?? 1),
      borderRadius: `${elStyle.borderRadius || 0}px`,
      pointerEvents: isBackground ? 'none' : 'auto',
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
                  alt="PDF Page"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
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
                border: `${elStyle.borderWidth}px solid ${elStyle.borderColor}`,
                borderRadius: elStyle.borderRadius,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Editable text inside container */}
              <div
                contentEditable={isEditing}
                suppressContentEditableWarning
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
                  fontFamily: elStyle.fontFamily,
                  fontSize: `${elStyle.fontSize}px`,
                  fontWeight: elStyle.fontWeight,
                  lineHeight: elStyle.lineHeight,
                  color: elStyle.color,
                  textAlign: elStyle.textAlign,
                  padding: `${elStyle.padding}px`,
                  outline: 'none',
                  wordWrap: 'break-word',
                  cursor: isEditing ? 'text' : 'inherit',
                  userSelect: isEditing ? 'text' : 'none',
                  boxSizing: 'border-box',
                  overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
                dangerouslySetInnerHTML={isEditing ? undefined : { __html: content.replace(/\n/g, '<br>') }}
              >
                {isEditing ? content : null}
              </div>
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

        default: {
          return (
            <div
              contentEditable={isEditing}
              suppressContentEditableWarning
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
                fontFamily: elStyle.fontFamily,
                fontSize: `${elStyle.fontSize}px`,
                fontWeight: elStyle.fontWeight,
                lineHeight: elStyle.lineHeight,
                color: elStyle.color,
                textAlign: elStyle.textAlign,
                padding: `${elStyle.padding}px`,
                outline: 'none',
                wordWrap: 'break-word',
                cursor: isEditing ? 'text' : 'inherit',
                userSelect: isEditing ? 'text' : 'none'
              }}
              onClick={(e) => e.stopPropagation()}
              dangerouslySetInnerHTML={isEditing ? undefined : { __html: content.replace(/\n/g, '<br>') }}
            >
              {isEditing ? content : null}
            </div>
          )
        }
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
          <div style={{ position: 'absolute', top: -22, left: 0, background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase', pointerEvents: 'none' }}>
            {type}
          </div>
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
        backgroundColor: 'white',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {elements.map(renderElement)}
    </div>
  )
}