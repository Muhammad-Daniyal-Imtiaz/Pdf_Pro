'use client'

import { Linkedin, Mail, Phone, Twitter, Github, Globe, Instagram, Facebook, Youtube, MessageCircle, MapPin, Calendar, Clock, User, Briefcase, GraduationCap, Award, Star, Heart, Download, Share2, ExternalLink } from 'lucide-react'

interface SocialIcon {
  type: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}

const SOCIAL_ICONS: SocialIcon[] = [
  { type: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077B5' },
  { type: 'email', name: 'Email', icon: Mail, color: '#EA4335' },
  { type: 'phone', name: 'Phone', icon: Phone, color: '#10B981' },
  { type: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  { type: 'github', name: 'GitHub', icon: Github, color: '#333333' },
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
  { type: 'graduation', name: 'Education', icon: GraduationCap, color: '#84CC16' },
  { type: 'award', name: 'Award', icon: Award, color: '#F59E0B' },
  { type: 'star', name: 'Star', icon: Star, color: '#EAB308' },
  { type: 'heart', name: 'Like', icon: Heart, color: '#EC4899' },
  { type: 'download', name: 'Download', icon: Download, color: '#10B981' },
  { type: 'share', name: 'Share', icon: Share2, color: '#06B6D4' },
  { type: 'external', name: 'External Link', icon: ExternalLink, color: '#6366F1' }
]

interface SocialIconsProps {
  onIconSelect: (iconType: string) => void
}

export default function SocialIcons({ onIconSelect }: SocialIconsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Social Media Icons</h3>
        <span className="text-xs text-gray-500">Drag to add</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {SOCIAL_ICONS.map((icon) => {
          const IconComponent = icon.icon
          return (
            <button
              key={icon.type}
              onClick={() => onIconSelect(icon.type)}
              className="group relative flex flex-col items-center justify-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
              title={icon.name}
            >
              <div style={{ color: icon.color }}>
                <IconComponent 
                  size={20} 
                  className="mb-1 transition-transform group-hover:scale-110"
                />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-gray-800">
                {icon.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 <strong>Tip:</strong> Icons are resizable and will export as vector graphics in PDF
      </div>
    </div>
  )
}

export { SOCIAL_ICONS }
