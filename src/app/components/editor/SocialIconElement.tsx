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
  const { iconType = 'user' } = element
  const IconComponent = ICON_MAP[iconType] || User
  const iconColor = ICON_COLORS[iconType] || '#6B7280'
  
  const iconStyles = {
    position: 'absolute' as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.style.width}px`,
    height: `${element.style.height}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    borderRadius: `${element.style.borderRadius || 8}px`,
    backgroundColor: element.style.backgroundColor || 'transparent',
    opacity: element.style.opacity || 1,
    transform: `rotate(${element.style.rotation || 0}deg)`,
    zIndex: element.style.zIndex || 0,
    cursor: 'move',
    transition: 'all 0.2s ease'
  }

  return (
    <div
      style={iconStyles}
      onClick={onSelect}
      className="social-icon-element hover:scale-105 transition-transform"
    >
      <div style={{ color: iconColor }}>
        <IconComponent 
          size={element.style.fontSize || 24}
          className="transition-all"
        />
      </div>
      
      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {iconType}
        </div>
      )}
    </div>
  )
}
