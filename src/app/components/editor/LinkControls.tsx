'use client'

import { Link, Phone, Palette, Type } from 'lucide-react'

interface LinkControlsProps {
  element: any
  onUpdate: (updates: any) => void
}

export default function LinkControls({ element, onUpdate }: LinkControlsProps) {
  const { url, phoneNumber, style } = element

  const isPhoneNumber = (text: string) => {
    const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    return phoneRegex.test(text.trim())
  }

  const isPhone = isPhoneNumber(element.content)

  const handleUrlChange = (newUrl: string) => {
    onUpdate({ url: newUrl })
  }

  const handleContentChange = (newContent: string) => {
    onUpdate({ content: newContent })
  }

  const handleLinkColorChange = (color: string) => {
    onUpdate({
      style: { ...style, linkColor: color }
    })
  }

  const handleDecorationChange = (decoration: 'none' | 'underline' | 'line-through') => {
    onUpdate({
      style: { ...style, linkDecoration: decoration }
    })
  }

  const handleFontSizeChange = (fontSize: number) => {
    onUpdate({
      style: { ...style, fontSize }
    })
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        {isPhone ? <Phone className="w-4 h-4" /> : <Link className="w-4 h-4" />}
        {isPhone ? 'Phone Number' : 'Link'} Properties
      </h3>

      {/* Link Text/Phone Number */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {isPhone ? 'Phone Number' : 'Link Text'}
        </label>
        <input
          type="text"
          value={element.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={isPhone ? '+1 (555) 123-4567' : 'Click here'}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* URL (only for non-phone links) */}
      {!isPhone && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">URL</label>
          <input
            type="url"
            value={url || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
          <Type className="w-3 h-3" />
          Font Size: {style.fontSize}px
        </label>
        <input
          type="range"
          min="10"
          max="48"
          value={style.fontSize || 14}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Link Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Link Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={style.linkColor || '#0066cc'}
            onChange={(e) => handleLinkColorChange(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={style.linkColor || '#0066cc'}
            onChange={(e) => handleLinkColorChange(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Text Decoration */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Text Decoration</label>
        <div className="flex gap-2">
          {(['none', 'underline', 'line-through'] as const).map((decoration) => (
            <button
              key={decoration}
              onClick={() => handleDecorationChange(decoration)}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium capitalize transition-colors ${
                style.linkDecoration === decoration
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {decoration}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-detection info */}
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        💡 <strong>Auto-detection:</strong> Phone numbers are automatically detected and made clickable
      </div>
    </div>
  )
}
