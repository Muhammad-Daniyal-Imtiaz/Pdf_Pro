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

  const lineStyles: React.CSSProperties = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    cursor: 'inherit',
    borderRadius: style.borderRadius || 0,
    opacity: style.opacity || 1,
    transform: `rotate(${style.rotation || 0}deg)`,
    zIndex: style.zIndex || 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease-out',
  }

  const innerLineStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    ...(lineOrientation === 'horizontal' ? {
      borderTop: `${style.borderWidth || 2}px ${lineStyle} ${style.backgroundColor || '#000000'}`,
      height: '0px'
    } : {
      borderLeft: `${style.borderWidth || 2}px ${lineStyle} ${style.backgroundColor || '#000000'}`,
      width: '0px'
    })
  }

  return (
    <div
      style={lineStyles}
      onClick={onSelect}
      className={`line-element group transition-all ${isSelected ? 'shadow-[0_0_0_1px_rgba(59,130,246,0.5)]' : ''}`}
    >
      <div style={innerLineStyles} />

      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-sm font-bold tracking-tight uppercase">
          {lineOrientation} {lineStyle}
        </div>
      )}
    </div>
  )
}
