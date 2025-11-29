'use client'

import { useState, useCallback } from 'react'
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
  // Layout state - THIS IS CRUCIAL
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

  // Handle layout changes
  const handleColumnsChange = useCallback((newColumns: number) => {
    console.log('Changing columns to:', newColumns)
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
    setContentBlocks(prev => [
      {
        ...prev[0],
        content: newContent
      }
    ])
  }, [])

  // Handle style changes
  const handleStylesChange = useCallback((newStyles: Styles) => {
    setStyles(newStyles)
    // Apply styles to all blocks
    setContentBlocks(prev =>
      prev.map(block => ({
        ...block,
        styles: newStyles
      }))
    )
  }, [])

  // Add content block
  const addContentBlock = useCallback(() => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'paragraph',
      content: 'New content block',
      styles
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📄 PDF Document Generator</h1>
        <p className="text-gray-600">Create professional PDFs with customizable layouts and templates</p>
      </div>

      {/* Layout Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LayoutControls 
            columns={layout.columns} 
            onColumnsChange={handleColumnsChange}
          />
        </div>

        {/* Page Size and Orientation */}
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
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🎨 Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.values(TEMPLATES).map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`p-3 rounded-lg font-medium transition-all capitalize ${
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

      {/* Content Blocks Manager */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Content Blocks</h3>
        <div className="space-y-3">
          {contentBlocks.map((block) => (
            <div key={block.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{block.type}</p>
                <p className="text-xs text-gray-600 truncate">{block.content}</p>
              </div>
              <button
                onClick={() => deleteContentBlock(block.id)}
                className="ml-4 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            onClick={addContentBlock}
            className="w-full py-2 border-2 border-dashed border-blue-400 rounded-lg text-blue-600 font-medium hover:bg-blue-50"
          >
            + Add Content Block
          </button>
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
        <p>📊 Current Layout: {layout.columns} column(s) • {layout.pageSize} • {layout.orientation}</p>
      </div>
    </div>
  )
}