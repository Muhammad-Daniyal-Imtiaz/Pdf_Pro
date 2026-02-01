'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Phone } from 'lucide-react'

interface LinkElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
}

export default function LinkElement({ element, isSelected, onSelect, onUpdate }: LinkElementProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  // Auto-detect phone numbers
  const isPhoneNumber = (text: string) => {
    const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    return phoneRegex.test(text.trim())
  }

  const isPhone = isPhoneNumber(element.content)
  const displayUrl = isPhone ? element.content : element.url || element.content

  const iconSize = 16
  const fontSize = element.style.fontSize || 14

  const linkStyles: React.CSSProperties = {
    position: 'absolute' as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.style.width}px`,
    height: `${element.style.height}px`,
    fontSize: `${fontSize}px`,
    fontFamily: element.style.fontFamily,
    fontWeight: element.style.fontWeight,
    color: isHovered ? (element.style.linkColor || '#0066cc') : (element.style.color || '#0066cc'),
    textDecoration: isHovered ? 'underline' : (element.style.linkDecoration || 'none'),
    cursor: 'pointer',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.05)' : (element.style.backgroundColor || 'transparent'),
    padding: `${element.style.padding}px`,
    borderRadius: `${element.style.borderRadius || 4}px`,
    opacity: element.style.opacity || 1,
    transform: `rotate(${element.style.rotation || 0}deg)`,
    zIndex: element.style.zIndex || 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // Consistent centering
    gap: '8px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isSelected) return // Don't follow link while editing
    e.preventDefault()
    if (isPhone) {
      window.open(`tel:${element.content}`, '_self')
    } else {
      const url = element.url || element.content
      if (url.startsWith('http') || url.startsWith('mailto:')) {
        window.open(url, '_blank')
      }
    }
  }

  return (
    <div
      style={linkStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="link-element group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1
        }}>
          {isPhone ? (
            <Phone size={iconSize} style={{ display: 'block' }} />
          ) : (
            <ExternalLink size={iconSize} style={{ display: 'block' }} />
          )}
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        } as React.CSSProperties} className="truncate font-medium">
          {element.content || 'Enter Link Text'}
        </span>
      </div>

      {isSelected && (
        <div
          data-html2canvas-ignore="true"
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-2 rounded-lg shadow-xl z-[70] flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={element.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://..."
              className="bg-gray-800 border-none text-[10px] px-2 py-1 rounded focus:ring-1 focus:ring-blue-500 w-32"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="h-6 w-[1px] bg-gray-700 mx-1" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              const url = element.url || element.content
              if (url) window.open(url, '_blank')
            }}
            className="p-1 hover:bg-gray-700 rounded text-blue-400 transition-colors"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      )}

      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-sm font-bold tracking-tight uppercase">
          {isPhone ? 'Phone' : 'Link'}
        </div>
      )}
    </div>
  )
}
