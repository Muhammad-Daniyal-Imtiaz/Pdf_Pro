'use client'

import React from 'react'
import { EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import {
  Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram,
  Facebook, Youtube, MapPin, Calendar, User, Download, ExternalLink
} from 'lucide-react'

interface PDFRendererProps {
  elements: EditorElement[]
  width?: number
  height?: number
  showSelection?: boolean
  selectedId?: string | null
  onElementMouseDown?: (id: string, e: React.MouseEvent) => void
  onContentChange?: (id: string, content: string) => void
  onBlur?: () => void
  editingId?: string | null
}

const ICON_MAP: Record<string, any> = {
  linkedin: Linkedin, email: Mail, phone: Phone, twitter: Twitter,
  github: Github, website: Globe, instagram: Instagram, facebook: Facebook,
  youtube: Youtube, whatsapp: Phone, location: MapPin, calendar: Calendar,
  user: User, download: Download, external: ExternalLink
}

const ICON_COLORS: Record<string, string> = {
  linkedin: '#0077b5', email: '#EA4335', phone: '#10B981', twitter: '#1DA1F2',
  github: '#333', website: '#6366F1', instagram: '#E4405F', facebook: '#1877F2',
  youtube: '#FF0000', whatsapp: '#25D366', location: '#EF4444', calendar: '#F59E0B',
  user: '#6B7280', download: '#10B981', external: '#6366F1'
}

export default function PDFRenderer({
  elements,
  width = A4_WIDTH,
  height = A4_HEIGHT,
  showSelection = false,
  selectedId,
  onElementMouseDown,
  onContentChange,
  onBlur,
  editingId
}: PDFRendererProps) {

  const renderElement = (element: EditorElement) => {
    const isSelected = showSelection && selectedId === element.id
    const isEditing = editingId === element.id
    const { style: elStyle, type, content, id, iconType, lineOrientation, x, y } = element

    // MATCH API LOGIC: Round to integers
    const exactX = Math.round(x)
    const exactY = Math.round(y)
    const exactW = Math.round(elStyle.width || 100)
    const exactH = Math.round(elStyle.height || 40)

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${exactX}px`,
      top: `${exactY}px`,
      width: `${exactW}px`,
      height: `${exactH}px`,
      zIndex: elStyle.zIndex || 1,
      boxSizing: 'border-box', // MATCHES API
      margin: 0,
      padding: 0,
    }

    const handleClick = (e: React.MouseEvent) => {
      // handled by parent
    }

    const handleMouseDown = (e: React.MouseEvent) => {
      onElementMouseDown?.(id, e)
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
          const isHorizontal = lineOrientation === 'horizontal'
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ backgroundColor: elStyle.backgroundColor || '#000', width: isHorizontal ? '100%' : '2px', height: isHorizontal ? '2px' : '100%' }} />
            </div>
          )
        }

        case 'image':
          return <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Image</div>

        case 'container':
          return <div style={{ width: '100%', height: '100%', background: elStyle.backgroundColor || 'transparent', border: `${elStyle.borderWidth}px solid ${elStyle.borderColor}`, borderRadius: elStyle.borderRadius }} />

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
              onDoubleClick={(e) => e.stopPropagation()}
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
            >
              {isEditing ? content : content}
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
        className="pdf-element"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
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