'use client'

import { Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram, Facebook, Youtube, MessageCircle, MapPin, Calendar, Clock, User, Briefcase, GraduationCap, Award, Star, Heart, Download, Share2, ExternalLink } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  linkedin: Linkedin,
  email: Mail,
  phone: Phone,
  twitter: Twitter,
  github: Github,
  website: Globe,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  location: MapPin,
  calendar: Calendar,
  clock: Clock,
  user: User,
  briefcase: Briefcase,
  graduation: GraduationCap,
  award: Award,
  star: Star,
  heart: Heart,
  download: Download,
  share: Share2,
  external: ExternalLink
}

const ICON_COLORS: Record<string, string> = {
  linkedin: '#0077B5',
  email: '#EA4335',
  phone: '#10B981',
  twitter: '#1DA1F2',
  github: '#333333',
  website: '#6366F1',
  instagram: '#E4405F',
  facebook: '#1877F2',
  youtube: '#FF0000',
  whatsapp: '#25D366',
  location: '#EF4444',
  calendar: '#F59E0B',
  clock: '#8B5CF6',
  user: '#6B7280',
  briefcase: '#3B82F6',
  graduation: '#84CC16',
  award: '#F59E0B',
  star: '#EAB308',
  heart: '#EC4899',
  download: '#10B981',
  share: '#06B6D4',
  external: '#6366F1'
}

interface SocialIconElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
}

export default function SocialIconElement({ element, isSelected, onSelect, onUpdate }: SocialIconElementProps) {
  const { iconType = 'user', content = '', showLabel = false, labelPosition = 'right' } = element
  const IconComponent = ICON_MAP[iconType] || User
  const iconColor = ICON_COLORS[iconType] || '#6B7280'

  const iconSize = element.style.fontSize || 24
  const labelSize = Math.round(iconSize * 0.7)

  const iconStyles: React.CSSProperties = {
    position: 'absolute' as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.style.width}px`,
    height: `${element.style.height}px`,
    display: 'flex',
    flexDirection: labelPosition === 'top' || labelPosition === 'bottom' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    borderRadius: `${element.style.borderRadius || 8}px`,
    backgroundColor: element.style.backgroundColor || 'transparent',
    opacity: element.style.opacity || 1,
    transform: `rotate(${element.style.rotation || 0}deg)`,
    zIndex: element.style.zIndex || 0,
    cursor: 'move',
    padding: '8px',
    boxSizing: 'border-box',
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
      lineHeight: 1
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
        MozOsxFontSmoothing: 'grayscale'
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
