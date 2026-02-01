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
  
  // Auto-detect phone numbers
  const isPhoneNumber = (text: string) => {
    const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    return phoneRegex.test(text.trim())
  }
  
  const isPhone = isPhoneNumber(element.content)
  const displayUrl = isPhone ? element.content : element.url || element.content
  
  const linkStyles = {
    position: 'absolute' as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.style.width}px`,
    height: `${element.style.height}px`,
    fontSize: `${element.style.fontSize}px`,
    fontFamily: element.style.fontFamily,
    fontWeight: element.style.fontWeight,
    color: isHovered ? (element.style.linkColor || '#0066cc') : (element.style.color || '#0066cc'),
    textDecoration: isHovered ? 'underline' : (element.style.linkDecoration || 'none'),
    cursor: 'pointer',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    backgroundColor: element.style.backgroundColor || 'transparent',
    padding: `${element.style.padding}px`,
    borderRadius: `${element.style.borderRadius || 4}px`,
    opacity: element.style.opacity || 1,
    transform: `rotate(${element.style.rotation || 0}deg)`,
    zIndex: element.style.zIndex || 0,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isPhone) {
      window.open(`tel:${element.content}`, '_self')
    } else {
      window.open(element.url || element.content, '_blank')
    }
  }

  return (
    <div
      style={linkStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="link-element transition-all"
    >
      {isPhone ? (
        <Phone size={14} />
      ) : (
        <ExternalLink size={14} />
      )}
      <span className="truncate">
        {displayUrl}
      </span>
      
      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {isPhone ? 'Phone Number' : 'Link'}
        </div>
      )}
    </div>
  )
}
