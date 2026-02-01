'use client'

import { useState } from 'react'

interface LineElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
}

export default function LineElement({ element, isSelected, onSelect, onUpdate }: LineElementProps) {
  const { lineOrientation = 'horizontal', lineStyle = 'solid', style } = element
  
  const getLineStyle = () => {
    switch (lineStyle) {
      case 'dashed':
        return '8px 4px'
      case 'dotted':
        return '2px 2px'
      default:
        return 'none'
    }
  }

  const lineStyles = {
    position: 'absolute' as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.style.width}px`,
    height: `${element.style.height}px`,
    backgroundColor: style.backgroundColor || '#000000',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    cursor: 'move',
    borderRadius: style.borderRadius || 0,
    opacity: style.opacity || 1,
    transform: `rotate(${style.rotation || 0}deg)`,
    zIndex: style.zIndex || 0,
    // For dashed/dotted lines, we use border instead of background
    ...(lineStyle !== 'solid' && {
      backgroundColor: 'transparent',
      borderTop: lineOrientation === 'horizontal' 
        ? `${style.borderWidth || 2}px ${lineStyle} ${style.backgroundColor || '#000000'}`
        : 'none',
      borderLeft: lineOrientation === 'vertical'
        ? `${style.borderWidth || 2}px ${lineStyle} ${style.backgroundColor || '#000000'}`
        : 'none',
    })
  }

  return (
    <div
      style={lineStyles}
      onClick={onSelect}
      className={`line-element ${lineOrientation} ${lineStyle} transition-all hover:opacity-80`}
    >
      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          {lineOrientation} • {lineStyle}
        </div>
      )}
    </div>
  )
}
