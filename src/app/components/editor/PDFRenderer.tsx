'use client'

import React from 'react'
import { EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import {
  Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram,
  Facebook, Youtube, MapPin, Calendar, User, Download, ExternalLink
} from 'lucide-react'
import EditableElement from './EditableElement'

interface PDFRendererProps {
  elements: EditorElement[]
  width?: number
  height?: number
  onElementMouseDown?: (id: string, e: React.MouseEvent) => void
  onElementDoubleClick?: (id: string, e: React.MouseEvent) => void
  onContentChange?: (id: string, content: string, markAsModified?: boolean) => void
  onBlur?: () => void
  editingId?: string | null
  backgroundImage?: string
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
  onElementMouseDown,
  onElementDoubleClick,
  onContentChange,
  onBlur,
  editingId,
  backgroundImage
}: PDFRendererProps) {

  const renderElement = (element: EditorElement) => {
    const isEditing = editingId === element.id
    const { style: elStyle, type, content, id, iconType, isImported, isModified, x, y } = element

    const exactX = Math.round(x)
    const exactY = Math.round(y)
    const exactW = Math.round(elStyle.width || 100)
    const exactH = Math.round(elStyle.height || 40)

    const isImportedUnmodified = isImported && !isModified
    const displayColor = isEditing ? '#000000' : (isImportedUnmodified ? 'transparent' : (elStyle.color === 'transparent' ? '#000000' : (elStyle.color || '#000000')))
    const displayOpacity = isImportedUnmodified && !isEditing ? 0 : (elStyle.opacity ?? 1)

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${exactX}px`,
      top: `${exactY}px`,
      width: `${exactW}px`,
      height: `${exactH}px`,
      zIndex: elStyle.zIndex || 1,
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
      transform: `rotate(${elStyle.rotation || 0}deg)`,
      transformOrigin: 'top left',
      borderRadius: `${elStyle.borderRadius || 0}px`,
      backgroundColor: isImported && isModified ? 'white' : (elStyle.backgroundColor || 'transparent'),
    }

    const renderContent = () => {
      switch (type) {
        case 'social-icon': {
          const Icon = ICON_MAP[iconType || 'user']
          const color = ICON_COLORS[iconType || 'user'] || '#6b7280'
          const iconSize = Math.min(exactW, exactH) * 0.8
          return Icon ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: displayOpacity }}>
              <Icon size={Math.round(iconSize)} color={color} style={{ display: 'block' }} />
            </div>
          ) : null
        }

        case 'line': {
          const isSolid = !element.lineStyle || element.lineStyle === 'solid'
          const isHorizontal = element.lineOrientation === 'horizontal'
          return (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: isSolid ? (elStyle.backgroundColor || '#000') : 'transparent',
              borderTop: !isSolid && isHorizontal ? `${elStyle.height}px ${element.lineStyle} ${elStyle.backgroundColor || '#000'}` : undefined,
              borderLeft: !isSolid && !isHorizontal ? `${elStyle.width}px ${element.lineStyle} ${elStyle.backgroundColor || '#000'}` : undefined,
              opacity: displayOpacity
            }} />
          )
        }

        case 'image':
          return (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: content ? 'transparent' : '#f3f4f6', opacity: displayOpacity }}>
              {content ? (
                <img src={content} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }} draggable={false} />
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '10px' }}>NO IMAGE</div>
              )}
            </div>
          )

        case 'link': {
          const Icon = ICON_MAP['external']
          return (
            <div style={{ width: '100%', height: '100%', fontFamily: elStyle.fontFamily, fontSize: `${elStyle.fontSize}px`, color: elStyle.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', opacity: displayOpacity }}>
              <Icon size={14} color={elStyle.color} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</span>
            </div>
          )
        }

        case 'container':
        default:
          return (
            <EditableElement
              element={element}
              isEditing={isEditing}
              displayColor={displayColor}
              displayOpacity={displayOpacity}
              onBlur={() => onBlur?.()}
              onContentChange={(id, content, mod) => onContentChange?.(id, content, mod)}
              onDoubleClick={(e) => onElementDoubleClick?.(id, e)}
              onMouseDown={(e) => onElementMouseDown?.(id, e)}
            />
          )
      }
    }

    return (
      <div
        key={id}
        style={baseStyles}
        className="pdf-element"
        onMouseDown={(e) => onElementMouseDown?.(id, e)}
        onDoubleClick={(e) => onElementDoubleClick?.(id, e)}
      >
        {renderContent()}
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
        backgroundColor: 'transparent',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {backgroundImage && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <img src={backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}
      {elements.map(renderElement)}
    </div>
  )
}