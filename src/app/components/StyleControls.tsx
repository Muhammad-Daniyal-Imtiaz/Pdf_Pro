'use client'

import { Type, Palette, AlignLeft, Layout } from 'lucide-react'

// Define types within the component
interface Styles {
  fontSize: number
  fontFamily: string
  color: string
  lineHeight: number
  margin: number
  fontWeight?: string
  textAlign?: string
  backgroundColor?: string
}

interface StyleControlsProps {
  styles: Styles
  onStylesChange: (styles: Styles) => void
}

const FONT_OPTIONS = [
  { label: 'Inter (Modern)', value: 'Inter, sans-serif' },
  { label: 'Roboto (Clean)', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display (Elegant)', value: 'Playfair Display, serif' },
  { label: 'Merriweather (Readability)', value: 'Merriweather, serif' },
  { label: 'Fira Code (Tech)', value: 'Fira Code, monospace' },
  { label: 'Arial (Classic)', value: 'Arial, sans-serif' },
  { label: 'Georgia (Traditional)', value: 'Georgia, serif' },
]

export default function StyleControls({ styles, onStylesChange }: StyleControlsProps) {
  const updateStyle = (key: keyof Styles, value: string | number) => {
    onStylesChange({ ...styles, [key]: value })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <Palette className="w-5 h-5 text-purple-500" />
        Style Editor
      </h2>

      <div className="space-y-6">
        {/* Typography Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4" /> Typography
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={styles.fontFamily}
              onChange={(e) => updateStyle('fontFamily', e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size: {styles.fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="72"
                value={styles.fontSize}
                onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Height: {styles.lineHeight}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={styles.lineHeight}
                onChange={(e) => updateStyle('lineHeight', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Layout & Color Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Layout className="w-4 h-4" /> Layout & Color
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={styles.color}
                onChange={(e) => updateStyle('color', e.target.value)}
                className="w-12 h-12 p-1 rounded-lg cursor-pointer border border-gray-200"
              />
              <span className="text-sm text-gray-500 font-mono">{styles.color}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Margin: {styles.margin}px
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={styles.margin}
              onChange={(e) => updateStyle('margin', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}