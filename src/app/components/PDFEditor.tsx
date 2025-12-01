'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import LayoutControls from './LayoutControls'
import StyleControls from './StyleControls'
import TextInput from './TextInput'
import PDFPreview from './PDFPreview'
import AIContentGenerator from './AIContentGenerator'

interface Layout {
  pageSize: string
  orientation: string
  columns: number
}

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

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'container' | 'custom'
  content: string
  styles: Styles
}

interface PDFEditorProps {
  initialContent?: string
  initialTemplate?: string
}

const TEMPLATES = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  BUSINESS: 'business',
  CREATIVE: 'creative',
  MINIMAL: 'minimal',
  TECHNICAL: 'technical'
} as const

type TemplateType = typeof TEMPLATES[keyof typeof TEMPLATES]

export default function PDFEditor({ initialContent = '', initialTemplate = 'modern' }: PDFEditorProps) {
  // Layout state
  const [layout, setLayout] = useState<Layout>({
    pageSize: 'A4',
    orientation: 'portrait',
    columns: 1
  })

  // Content and styling state
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    {
      id: '1',
      type: 'paragraph',
      content: initialContent || 'Start typing your content here...',
      styles: {
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        lineHeight: 1.5,
        margin: 10
      }
    }
  ])

  const [styles, setStyles] = useState<Styles>({
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    color: '#000000',
    lineHeight: 1.5,
    margin: 10
  })

  const [template, setTemplate] = useState<TemplateType>(initialTemplate as TemplateType)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())

  // Handle layout changes
  const handleColumnsChange = useCallback((newColumns: number) => {
    setLayout(prev => ({
      ...prev,
      columns: newColumns
    }))
  }, [])

  const handlePageSizeChange = useCallback((pageSize: string) => {
    setLayout(prev => ({
      ...prev,
      pageSize
    }))
  }, [])

  const handleOrientationChange = useCallback((orientation: string) => {
    setLayout(prev => ({
      ...prev,
      orientation
    }))
  }, [])

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (contentBlocks.length > 0) {
      setContentBlocks(prev => [
        {
          ...prev[0],
          content: newContent
        },
        ...prev.slice(1)
      ])
    }
  }, [contentBlocks])

  // Handle style changes
  const handleStylesChange = useCallback((newStyles: Styles) => {
    setStyles(newStyles)
  }, [])

  // Add content block with specific type
  const addContentBlock = useCallback((type: 'heading' | 'paragraph' | 'container' | 'custom') => {
    const blockTexts: Record<string, string> = {
      heading: 'Heading Text',
      paragraph: 'Paragraph content goes here...',
      container: 'Container content with border',
      custom: 'Custom block content'
    }

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: blockTexts[type],
      styles: { ...styles }
    }
    setContentBlocks(prev => [...prev, newBlock])
  }, [styles])

  // Update content block
  const updateContentBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(prev =>
      prev.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    )
  }, [])

  // Delete content block
  const deleteContentBlock = useCallback((id: string) => {
    setContentBlocks(prev => prev.filter(block => block.id !== id))
  }, [])

  // Toggle block expansion
  const toggleBlockExpanded = useCallback((id: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Block type icons
  const blockIcons: Record<string, string> = {
    heading: '📝',
    paragraph: '📄',
    container: '📦',
    custom: '✨'
  }

  const blockColors: Record<string, string> = {
    heading: 'bg-blue-50 border-blue-200',
    paragraph: 'bg-green-50 border-green-200',
    container: 'bg-purple-50 border-purple-200',
    custom: 'bg-pink-50 border-pink-200'
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📄 PDF Document Generator</h1>
        <p className="text-gray-600">Create professional PDFs with customizable layouts and templates</p>
      </div>

      {/* Layout Controls */}
      <LayoutControls 
        columns={layout.columns} 
        onColumnsChange={handleColumnsChange}
      />

      {/* Page Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">📋 Page Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
              <select
                value={layout.pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
              <select
                value={layout.orientation}
                onChange={(e) => handleOrientationChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">🎨 Template</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(TEMPLATES).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`p-2 rounded text-xs font-medium transition-all capitalize ${
                  template === t
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Content Generator */}
      <AIContentGenerator
        type="document"
        onContentGenerated={handleContentChange}
      />

      {/* Text Input */}
      <TextInput
        content={contentBlocks[0]?.content || ''}
        onContentChange={handleContentChange}
      />

      {/* Style Controls */}
      <StyleControls
        styles={styles}
        onStylesChange={handleStylesChange}
      />

      {/* Add Content Blocks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">➕ Add Content Blocks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => addContentBlock('heading')}
            className="flex items-center justify-center gap-2 p-4 border-2 border-blue-400 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">📝</span>
            <span className="font-medium text-sm">Heading</span>
          </button>
          <button
            onClick={() => addContentBlock('paragraph')}
            className="flex items-center justify-center gap-2 p-4 border-2 border-green-400 rounded-lg hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">📄</span>
            <span className="font-medium text-sm">Paragraph</span>
          </button>
          <button
            onClick={() => addContentBlock('container')}
            className="flex items-center justify-center gap-2 p-4 border-2 border-purple-400 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span className="text-2xl">📦</span>
            <span className="font-medium text-sm">Container</span>
          </button>
          <button
            onClick={() => addContentBlock('custom')}
            className="flex items-center justify-center gap-2 p-4 border-2 border-pink-400 rounded-lg hover:bg-pink-50 transition-colors"
          >
            <span className="text-2xl">✨</span>
            <span className="font-medium text-sm">Custom</span>
          </button>
        </div>
      </div>

      {/* Content Blocks Manager */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Content Blocks ({contentBlocks.length})</h3>
        <div className="space-y-3">
          {contentBlocks.map((block, index) => (
            <div 
              key={block.id} 
              className={`border-2 rounded-lg transition-all ${blockColors[block.type]}`}
            >
              {/* Block Header */}
              <div className="flex items-center justify-between p-4 cursor-pointer hover:opacity-80"
                onClick={() => toggleBlockExpanded(block.id)}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{blockIcons[block.type]}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700 capitalize">{block.type}</p>
                    <p className="text-xs text-gray-600 line-clamp-1">{block.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${
                      expandedBlocks.has(block.id) ? 'rotate-180' : ''
                    }`}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteContentBlock(block.id)
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Block Content Editor */}
              {expandedBlocks.has(block.id) && (
                <div className="border-t p-4 space-y-4 bg-white bg-opacity-50">
                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={block.content}
                      onChange={(e) => updateContentBlock(block.id, { content: e.target.value })}
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter block content..."
                    />
                  </div>

                  {/* Block Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Block Type</label>
                    <select
                      value={block.type}
                      onChange={(e) => updateContentBlock(block.id, { 
                        type: e.target.value as 'heading' | 'paragraph' | 'container' | 'custom'
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="heading">📝 Heading</option>
                      <option value="paragraph">📄 Paragraph</option>
                      <option value="container">📦 Container</option>
                      <option value="custom">✨ Custom</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size: {block.styles?.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={block.styles?.fontSize || 12}
                      onChange={(e) => updateContentBlock(block.id, {
                        styles: { ...block.styles, fontSize: Number(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={block.styles?.color || '#000000'}
                        onChange={(e) => updateContentBlock(block.id, {
                          styles: { ...block.styles, color: e.target.value }
                        })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={block.styles?.color || '#000000'}
                        onChange={(e) => updateContentBlock(block.id, {
                          styles: { ...block.styles, color: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Bold */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.styles?.fontWeight === 'bold'}
                        onChange={(e) => updateContentBlock(block.id, {
                          styles: { 
                            ...block.styles, 
                            fontWeight: e.target.checked ? 'bold' : 'normal'
                          }
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Bold</span>
                    </label>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                    <div className="flex gap-2">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateContentBlock(block.id, {
                            styles: { ...block.styles, textAlign: align }
                          })}
                          className={`flex-1 py-2 rounded capitalize transition-colors ${
                            block.styles?.textAlign === align
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PDF Preview */}
      <PDFPreview
        contentBlocks={contentBlocks}
        styles={styles}
        layout={layout}
        template={template}
      />

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
        <p>📊 Layout: {layout.columns} column(s) • {layout.pageSize} • {layout.orientation}</p>
        <p>📦 Blocks: {contentBlocks.length} total</p>
      </div>
    </div>
  )
}