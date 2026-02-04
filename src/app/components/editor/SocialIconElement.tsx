'use client'

import React from 'react'
import {
  Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram, Facebook,
  Youtube, MessageCircle, MapPin, Calendar, Clock, User, Briefcase,
  GraduationCap, Award, Star, Heart, Download, Share2, ExternalLink,
  type LucideIcon
} from 'lucide-react'

interface SocialIconElementProps {
  element: {
    id: string
    type: string
    iconType?: string
    content?: string
    showLabel?: boolean
    labelPosition?: 'right' | 'left' | 'top' | 'bottom'
    style: {
      width?: number
      height?: number
      fontSize?: number
      color?: string
      backgroundColor?: string
      borderRadius?: number
      rotation?: number
      opacity?: number
      zIndex?: number
      fontFamily?: string
      fontWeight?: string
    }
    x?: number
    y?: number
  }
  isSelected?: boolean
  onSelect?: () => void
  onUpdate?: (updates: any) => void
}

const ICON_MAP: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  email: Mail,
  mail: Mail,
  phone: Phone,
  twitter: Twitter,
  github: Github,
  website: Globe,
  globe: Globe,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  message: MessageCircle,
  location: MapPin,
  map: MapPin,
  calendar: Calendar,
  clock: Clock,
  time: Clock,
  user: User,
  profile: User,
  briefcase: Briefcase,
  work: Briefcase,
  education: GraduationCap,
  graduation: GraduationCap,
  award: Award,
  star: Star,
  heart: Heart,
  download: Download,
  share: Share2,
  external: ExternalLink,
  link: ExternalLink
}

const ICON_COLORS: Record<string, string> = {
  linkedin: '#0077B5',
  email: '#EA4335',
  mail: '#EA4335',
  phone: '#10B981',
  twitter: '#1DA1F2',
  github: '#333333',
  website: '#6366F1',
  globe: '#6366F1',
  instagram: '#E4405F',
  facebook: '#1877F2',
  youtube: '#FF0000',
  whatsapp: '#25D366',
  message: '#25D366',
  location: '#EF4444',
  map: '#EF4444',
  calendar: '#F59E0B',
  clock: '#8B5CF6',
  time: '#8B5CF6',
  user: '#6B7280',
  profile: '#6B7280',
  briefcase: '#3B82F6',
  work: '#3B82F6',
  education: '#84CC16',
  graduation: '#84CC16',
  award: '#F59E0B',
  star: '#EAB308',
  heart: '#EC4899',
  download: '#10B981',
  share: '#06B6D4',
  external: '#6366F1',
  link: '#6366F1'
}

export default function SocialIconElement({
  element,
  isSelected = false,
  onSelect = () => { },
  onUpdate
}: SocialIconElementProps) {
  const {
    iconType = 'user',
    content = '',
    showLabel = false,
    labelPosition = 'right',
    style = {}
  } = element

  const IconComponent = ICON_MAP[iconType] || ICON_MAP.user
  const iconColor = ICON_COLORS[iconType] || '#6B7280'

  // Size calculation - use element dimensions or default
  const width = style.width || 40
  const height = style.height || 40

  // Icon size fills the container when no label, scales with label
  let iconSize: number
  if (showLabel) {
    // When label is shown, icon takes up portion of space
    const isHorizontal = labelPosition === 'left' || labelPosition === 'right'
    if (isHorizontal) {
      iconSize = Math.min(height * 0.8, width * 0.4)
    } else {
      iconSize = Math.min(width * 0.8, height * 0.4)
    }
  } else {
    // No label - icon fills available space with padding
    iconSize = Math.min(width, height) * 0.8
  }

  // Ensure minimum size
  iconSize = Math.max(iconSize, 12)

  // Label font size proportional to icon
  const labelSize = Math.max(10, iconSize * 0.45)

  // Container is just a positioned wrapper, no visual styling
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: `${width}px`,
    height: `${height}px`,
    display: 'flex',
    flexDirection: getFlexDirection(labelPosition),
    alignItems: 'center',
    justifyContent: 'center',
    gap: showLabel ? `${Math.max(4, iconSize * 0.2)}px` : '0px',
    cursor: 'inherit',
    transform: style.rotation ? `rotate(${style.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: style.zIndex || 0,
    // No background, no border, no padding - completely transparent container
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    boxSizing: 'border-box',
    overflow: 'visible'
  }

  function getFlexDirection(pos: string): 'row' | 'row-reverse' | 'column' | 'column-reverse' {
    switch (pos) {
      case 'left': return 'row-reverse'
      case 'top': return 'column-reverse'
      case 'bottom': return 'column'
      case 'right': default: return 'row'
    }
  }

  return (
    <div
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className="social-icon-element"
    >
      {/* The actual icon - no wrapper, just the SVG */}
      <IconComponent
        size={iconSize}
        color={iconColor}
        strokeWidth={2}
        style={{
          display: 'block',
          flexShrink: 0,
          flexGrow: 0
        }}
      />

      {/* Label - only if enabled */}
      {showLabel && content && (
        <span
          style={{
            fontSize: `${labelSize}px`,
            color: style.color || '#374151',
            fontWeight: style.fontWeight || '500',
            fontFamily: style.fontFamily || 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          {content}
        </span>
      )}

      {/* Selection indicator - only when selected */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            border: '2px solid #3B82F6',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: -1
          }}
          data-html2canvas-ignore="true"
        />
      )}
    </div>
  )
}