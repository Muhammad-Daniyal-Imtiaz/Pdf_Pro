'use client'

import { ExternalLink, Phone } from 'lucide-react'

interface LinkElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
}

export default function LinkElement({ element, isSelected, onSelect, onUpdate }: LinkElementProps) {
  const isPhoneNumber = (text: string) => {
    const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    return phoneRegex.test(text.trim())
  }

  const isPhone = isPhoneNumber(element.content)
  const iconSize = 16
  const fontSize = element.style.fontSize || 14

  const linkStyles: React.CSSProperties = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    fontSize: `${fontSize}px`,
    fontFamily: element.style.fontFamily,
    fontWeight: element.style.fontWeight,
    color: element.style.color || '#0066cc',
    textDecoration: element.style.linkDecoration || 'none',
    cursor: 'inherit',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    backgroundColor: element.style.backgroundColor || 'transparent',
    padding: `${element.style.padding}px`,
    borderRadius: `${element.style.borderRadius || 4}px`,
    opacity: element.style.opacity || 1,
    transform: `rotate(${element.style.rotation || 0}deg)`,
    zIndex: element.style.zIndex || 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    // CRITICAL FIX: Enforce Box Sizing
    boxSizing: 'border-box' as any,
  }

  return (
    <div
      style={linkStyles}
      onClick={onSelect}
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
          lineHeight: 1,
          // CRITICAL FIX: Box sizing for icon container
          boxSizing: 'border-box'
        }}>
          {isPhone ? <Phone size={iconSize} style={{ display: 'block' }} /> : <ExternalLink size={iconSize} style={{ display: 'block' }} />}
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // CRITICAL FIX: Box sizing for text
          boxSizing: 'border-box'
        } as React.CSSProperties} className="truncate font-medium">
          {element.content || 'Enter Link Text'}
        </span>
      </div>

      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-sm font-bold tracking-tight uppercase">
          {isPhone ? 'Phone' : 'Link'}
        </div>
      )}
    </div>
  )
}