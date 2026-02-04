'use client'

import { ExternalLink, Phone } from 'lucide-react'
import { ICON_MAP, ICON_COLORS } from './SocialIcons'

interface SocialIconElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
}

export default function SocialIconElement({ element, isSelected, onSelect, onUpdate }: SocialIconElementProps) {
  const { iconType = 'user', content = '', showLabel = false, labelPosition = 'right' } = element
  const IconComponent = ICON_MAP[iconType] || ICON_MAP.user
  const iconColor = ICON_COLORS[iconType] || '#6B7280'

  const iconSize = element.style.fontSize || 24
  const labelSize = Math.round(iconSize * 0.7)

  const iconStyles: React.CSSProperties = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: labelPosition === 'top' || labelPosition === 'bottom' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    borderRadius: `${element.style.borderRadius || 8}px`,
    backgroundColor: element.style.backgroundColor || 'transparent',
    opacity: element.style.opacity || 1,
    transform: `rotate(${element.style.rotation || 0}deg)`,
    zIndex: element.style.zIndex || 0,
    cursor: 'inherit',
    padding: '8px',
    // CRITICAL FIX: Box Sizing prevents padding from expanding width
    boxSizing: 'border-box' as any,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'visible'
  }

  const renderIcon = () => (
    <div style={{
      width: `${iconSize}px`,
      height: `${iconSize}px`,
      color: iconColor,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      lineHeight: 1,
      // Ensure SVG doesn't overflow icon container
      boxSizing: 'border-box'
    }}>
      <IconComponent
        size={iconSize}
        strokeWidth={2.25}
        style={{ display: 'block' }}
      />
    </div>
  )

  const renderLabel = () => (
    showLabel && content && (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: `${labelSize}px`,
        color: element.style.color || '#374151',
        fontWeight: element.style.fontWeight || '600',
        fontFamily: element.style.fontFamily || 'Inter, sans-serif',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        letterSpacing: '-0.01em',
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        // CRITICAL FIX: Box sizing for text
        boxSizing: 'border-box'
      } as React.CSSProperties}>
        {content}
      </span>
    )
  )

  return (
    <div
      style={iconStyles}
      onClick={onSelect}
      className="social-icon-element group hover:bg-gray-100/30"
    >
      {(labelPosition === 'left' || labelPosition === 'top') && renderLabel()}
      {renderIcon()}
      {(labelPosition === 'right' || labelPosition === 'bottom') && renderLabel()}

      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-sm font-bold tracking-tight">
          {iconType.toUpperCase()}
        </div>
      )}
    </div>
  )
}