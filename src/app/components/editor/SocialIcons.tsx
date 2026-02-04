'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram,
  Facebook, Youtube, MapPin, Calendar, Clock, User, Briefcase,
  GraduationCap, Award, Star, Heart, Download, Share2, ExternalLink,
  MessageCircle
} from 'lucide-react'

export interface SocialIconData {
  type: string
  name: string
  icon: LucideIcon
  color: string
}

export const SOCIAL_ICONS: SocialIconData[] = [
  { type: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { type: 'email', name: 'Email', icon: Mail, color: '#EA4335' },
  { type: 'phone', name: 'Phone', icon: Phone, color: '#10B981' },
  { type: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  { type: 'github', name: 'GitHub', icon: Github, color: '#181717' },
  { type: 'website', name: 'Website', icon: Globe, color: '#6366F1' },
  { type: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { type: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { type: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { type: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { type: 'location', name: 'Location', icon: MapPin, color: '#EF4444' },
  { type: 'calendar', name: 'Calendar', icon: Calendar, color: '#F59E0B' },
  { type: 'clock', name: 'Time', icon: Clock, color: '#8B5CF6' },
  { type: 'user', name: 'Profile', icon: User, color: '#6B7280' },
  { type: 'briefcase', name: 'Work', icon: Briefcase, color: '#3B82F6' },
  { type: 'education', name: 'Education', icon: GraduationCap, color: '#84CC16' },
  { type: 'award', name: 'Award', icon: Award, color: '#F59E0B' },
  { type: 'star', name: 'Star', icon: Star, color: '#EAB308' },
  { type: 'heart', name: 'Like', icon: Heart, color: '#EC4899' },
  { type: 'download', name: 'Download', icon: Download, color: '#10B981' },
  { type: 'share', name: 'Share', icon: Share2, color: '#06B6D4' },
  { type: 'external', name: 'Link', icon: ExternalLink, color: '#6366F1' }
]

// Export lookup maps
export const ICON_MAP: Record<string, LucideIcon> = SOCIAL_ICONS.reduce((acc, icon) => ({
  ...acc,
  [icon.type]: icon.icon
}), {})

export const ICON_COLORS: Record<string, string> = SOCIAL_ICONS.reduce((acc, icon) => ({
  ...acc,
  [icon.type]: icon.color
}), {})

interface SocialIconsProps {
  onIconSelect: (iconType: string) => void
}

export default function SocialIcons({ onIconSelect }: SocialIconsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Social Icons</h3>
        <span className="text-[10px] text-gray-500">Click to add</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {SOCIAL_ICONS.map((icon) => {
          const IconComponent = icon.icon
          return (
            <button
              key={icon.type}
              onClick={() => onIconSelect(icon.type)}
              className="group flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:border-blue-400 hover:bg-blue-50 transition-all"
              title={icon.name}
            >
              <IconComponent
                size={18}
                color={icon.color}
                className="transition-transform group-hover:scale-110"
              />
              <span className="text-[9px] text-gray-600 mt-1 truncate w-full text-center">
                {icon.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}