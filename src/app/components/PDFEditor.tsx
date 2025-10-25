'use client'

import { useRef, useEffect, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'

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

interface DraggableItem {
  id: string
  type: string
  content: string
  styles?: Styles
}

interface PDFEditorProps {
  content: string
  styles: Styles
  layout: Layout
  template: string
  onTemplateChange: (template: string) => void
  contentBlocks: ContentBlock[]
  onContentBlocksChange: (blocks: ContentBlock[]) => void
}

const DraggableBlock = ({ 
  id, 
  content, 
  type, 
  styles, 
  onMove, 
  onStyleChange,
  onContentChange
}: { 
  id: string
  content: string
  type: string
  styles: Styles
  onMove: (dragId: string, hoverId: string) => void
  onStyleChange: (id: string, styles: Styles) => void
  onContentChange: (id: string, content: string) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)
  
  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: { id, type, content, styles },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'block',
    hover: (item: DraggableItem) => {
      if (item.id !== id) {
        onMove(item.id, id)
      }
    },
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      className={`p-4 mb-4 border-2 border-dashed rounded-lg cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      } ${
        type === 'heading' ? 'border-blue-400 bg-blue-50' :
        type === 'container' ? 'border-purple-400 bg-purple-50' :
        'border-gray-300 bg-white'
      }`}
      style={{
        fontSize: `${styles.fontSize}px`,
        fontFamily: styles.fontFamily,
        color: styles.color,
        lineHeight: styles.lineHeight,
        fontWeight: styles.fontWeight,
        textAlign: styles.textAlign as any,
        backgroundColor: styles.backgroundColor,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs font-medium uppercase px-2 py-1 rounded ${
          type === 'heading' ? 'bg-blue-200 text-blue-800' :
          type === 'container' ? 'bg-purple-200 text-purple-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {type}
        </span>
        <div className="flex space-x-1">
          <button
            onClick={() => onStyleChange(id, { ...styles, fontSize: Math.min(72, styles.fontSize + 2) })}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
            title="Increase font size"
          >
            A+
          </button>
          <button
            onClick={() => onStyleChange(id, { ...styles, fontSize: Math.max(8, styles.fontSize - 2) })}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
            title="Decrease font size"
          >
            A-
          </button>
          <button
            onClick={() => onStyleChange(id, { ...styles, fontWeight: styles.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              styles.fontWeight === 'bold' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title="Toggle bold"
          >
            B
          </button>
          <button
            onClick={() => onStyleChange(id, { ...styles, textAlign: styles.textAlign === 'center' ? 'left' : 'center' })}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              styles.textAlign === 'center' 
                ? 'bg-orange-600 text-white' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            title="Toggle center align"
          >
            ≡
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => onContentChange(id, e.target.value)}
        className="w-full p-3 border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 bg-transparent transition-all"
        rows={type === 'heading' ? 2 : 4}
        placeholder={`Enter ${type} content...`}
        style={{
          fontSize: `${styles.fontSize}px`,
          fontFamily: styles.fontFamily,
          color: styles.color,
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight,
          textAlign: styles.textAlign as any,
        }}
      />
    </div>
  )
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

export default function PDFEditor({ 
  content, 
  styles, 
  layout, 
  template, 
  onTemplateChange,
  contentBlocks,
  onContentBlocksChange 
}: PDFEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (content && contentBlocks.length === 0) {
      const blocks = content.split('\n\n').filter(block => block.trim()).map((block, index) => ({
        id: `block-${Date.now()}-${index}`,
        type: (block.length < 100 ? 'heading' : 'paragraph') as 'heading' | 'paragraph',
        content: block,
        styles: {
          fontSize: block.length < 100 ? 24 : 14,
          fontFamily: styles.fontFamily,
          color: styles.color,
          lineHeight: styles.lineHeight,
          margin: styles.margin,
          fontWeight: block.length < 100 ? 'bold' : 'normal',
          textAlign: block.length < 100 ? 'center' : 'left'
        }
      }))
      onContentBlocksChange(blocks)
    }
  }, [content, styles, contentBlocks.length, onContentBlocksChange])

  const handleMoveBlock = (dragId: string, hoverId: string) => {
    const dragIndex = contentBlocks.findIndex(block => block.id === dragId)
    const hoverIndex = contentBlocks.findIndex(block => block.id === hoverId)
    
    if (dragIndex === -1 || hoverIndex === -1) return

    const newBlocks = [...contentBlocks]
    const [movedBlock] = newBlocks.splice(dragIndex, 1)
    newBlocks.splice(hoverIndex, 0, movedBlock)
    
    onContentBlocksChange(newBlocks)
  }

  const handleStyleChange = (blockId: string, newStyles: Styles) => {
    const newBlocks = contentBlocks.map(block => 
      block.id === blockId ? { ...block, styles: { ...block.styles, ...newStyles } } : block
    )
    onContentBlocksChange(newBlocks)
  }

  const handleContentChange = (blockId: string, newContent: string) => {
    const newBlocks = contentBlocks.map(block => 
      block.id === blockId ? { ...block, content: newContent } : block
    )
    onContentBlocksChange(newBlocks)
  }

  const addHeading = () => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'heading',
      content: 'New Heading',
      styles: {
        fontSize: 24,
        fontFamily: styles.fontFamily,
        color: styles.color,
        lineHeight: 1.2,
        margin: 10,
        fontWeight: 'bold',
        textAlign: 'center'
      }
    }
    onContentBlocksChange([...contentBlocks, newBlock])
  }

  const addParagraph = () => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'paragraph',
      content: 'Start typing your paragraph content here...',
      styles: {
        fontSize: 14,
        fontFamily: styles.fontFamily,
        color: styles.color,
        lineHeight: 1.6,
        margin: 10,
        fontWeight: 'normal',
        textAlign: 'left'
      }
    }
    onContentBlocksChange([...contentBlocks, newBlock])
  }

  const addContainer = () => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'container',
      content: 'Container content... You can add any structured content here.',
      styles: {
        fontSize: 14,
        fontFamily: styles.fontFamily,
        color: styles.color,
        lineHeight: 1.6,
        margin: 15,
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: '#F3F4F6'
      }
    }
    onContentBlocksChange([...contentBlocks, newBlock])
  }

  const addCustomBlock = () => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'custom',
      content: 'Custom block content... Design this however you want!',
      styles: {
        fontSize: 16,
        fontFamily: styles.fontFamily,
        color: styles.color,
        lineHeight: 1.5,
        margin: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: '#EFF6FF'
      }
    }
    onContentBlocksChange([...contentBlocks, newBlock])
  }

  const deleteBlock = (blockId: string) => {
    const newBlocks = contentBlocks.filter(block => block.id !== blockId)
    onContentBlocksChange(newBlocks)
  }

  const clearAllBlocks = () => {
    if (confirm('Are you sure you want to clear all content blocks?')) {
      onContentBlocksChange([])
    }
  }

  const applyTemplate = (templateType: TemplateType) => {
    onTemplateChange(templateType)
    setError(null)
    
    const templateStyles: {[key in TemplateType]: Partial<Styles>} = {
      [TEMPLATES.MODERN]: {
        fontFamily: 'Arial, sans-serif',
        color: '#1F2937',
      },
      [TEMPLATES.CLASSIC]: {
        fontFamily: 'Times New Roman, serif',
        color: '#374151',
      },
      [TEMPLATES.BUSINESS]: {
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: '#111827',
      },
      [TEMPLATES.CREATIVE]: {
        fontFamily: 'Georgia, serif',
        color: '#4B5563',
      },
      [TEMPLATES.MINIMAL]: {
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
      },
      [TEMPLATES.TECHNICAL]: {
        fontFamily: 'Courier New, monospace',
        color: '#1F2937',
      }
    }

    const newStyles = templateStyles[templateType]
    if (newStyles) {
      const newBlocks = contentBlocks.map(block => ({
        ...block,
        styles: { ...block.styles, ...newStyles }
      }))
      onContentBlocksChange(newBlocks)
    }
  }

  const generatePDF = async () => {
    if (contentBlocks.length === 0) {
      setError('Please add some content before generating PDF')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentBlocks,
          styles,
          layout,
          template
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pdf-document-${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error generating PDF:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          PDF Editor
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={clearAllBlocks}
            disabled={contentBlocks.length === 0}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={generatePDF}
            disabled={isGenerating || contentBlocks.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <span>Download PDF</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">⚠️</div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Template
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(TEMPLATES).map(([key, value]) => (
            <button
              key={value}
              onClick={() => applyTemplate(value)}
              className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                template === value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Add Content Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <button
          onClick={addHeading}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>📝</span>
          <span>Heading</span>
        </button>
        <button
          onClick={addParagraph}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>📄</span>
          <span>Paragraph</span>
        </button>
        <button
          onClick={addContainer}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>📦</span>
          <span>Container</span>
        </button>
        <button
          onClick={addCustomBlock}
          className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>✨</span>
          <span>Custom</span>
        </button>
      </div>

      {/* Content Blocks */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto bg-gray-50">
        {contentBlocks.length > 0 ? (
          contentBlocks.map((block) => (
            <div key={block.id} className="relative group">
              <DraggableBlock
                id={block.id}
                content={block.content}
                type={block.type}
                styles={block.styles}
                onMove={handleMoveBlock}
                onStyleChange={handleStyleChange}
                onContentChange={handleContentChange}
              />
              <button
                onClick={() => deleteBlock(block.id)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg"
                title="Delete block"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg mb-2">No content blocks yet</p>
            <p className="text-sm">Use the buttons above to add headings, paragraphs, or containers</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        {contentBlocks.length} block{contentBlocks.length !== 1 ? 's' : ''} • Drag to reorder
      </div>
    </div>
  )
}