'use client'

import { useRef, useState } from 'react'
import { Download, Printer, Image } from 'lucide-react'

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

interface Layout {
  pageSize: string
  orientation: string
  columns: number
}

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'container' | 'custom'
  content: string
  styles: Styles
}

interface PDFPreviewProps {
  contentBlocks: ContentBlock[]
  styles: Styles
  layout: Layout
  template: string
}

export default function PDFPreview({ contentBlocks, styles, layout, template }: PDFPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPageDimensions = () => {
    switch (layout.pageSize) {
      case 'A4':
        return layout.orientation === 'portrait' 
          ? { width: '210mm', height: '297mm' }
          : { width: '297mm', height: '210mm' }
      case 'A3':
        return layout.orientation === 'portrait' 
          ? { width: '297mm', height: '420mm' }
          : { width: '420mm', height: '297mm' }
      case 'Letter':
        return layout.orientation === 'portrait' 
          ? { width: '216mm', height: '279mm' }
          : { width: '279mm', height: '216mm' }
      case 'Legal':
        return layout.orientation === 'portrait' 
          ? { width: '216mm', height: '356mm' }
          : { width: '356mm', height: '216mm' }
      default:
        return { width: '210mm', height: '297mm' }
    }
  }

  const getTemplateStyles = () => {
    const templates: Record<string, { fontFamily: string; color: string; backgroundColor: string; accentColor: string }> = {
      modern: {
        fontFamily: 'Arial, sans-serif',
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
        accentColor: '#3B82F6'
      },
      classic: {
        fontFamily: 'Times New Roman, serif',
        color: '#374151',
        backgroundColor: '#FFFBEB',
        accentColor: '#92400E'
      },
      business: {
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: '#111827',
        backgroundColor: '#F3F4F6',
        accentColor: '#1E40AF'
      },
      creative: {
        fontFamily: 'Georgia, serif',
        color: '#4B5563',
        backgroundColor: '#FDF2F8',
        accentColor: '#BE185D'
      },
      minimal: {
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        accentColor: '#000000'
      },
      technical: {
        fontFamily: 'Courier New, monospace',
        color: '#1F2937',
        backgroundColor: '#F0F4F8',
        accentColor: '#0369A1'
      }
    }

    return templates[template] || templates.modern
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
          contentBlocks: contentBlocks.map(block => ({
            ...block,
            content: block.content.replace(/\n/g, ' ')
          })),
          styles,
          layout,
          template
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
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
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const printPreview = () => {
    if (contentBlocks.length === 0) {
      setError('Please add some content before printing')
      return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const templateStyles = getTemplateStyles()
      const pageDims = getPageDimensions()
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>PDF Preview</title>
            <style>
              body {
                font-family: ${templateStyles.fontFamily};
                color: ${templateStyles.color};
                background-color: #E5E7EB;
                margin: 0;
                padding: 20px;
                line-height: ${styles.lineHeight};
              }
              .page {
                width: ${pageDims.width};
                height: ${pageDims.height};
                margin: 20px auto;
                padding: 40px;
                background: ${templateStyles.backgroundColor};
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                box-sizing: border-box;
                display: grid;
                grid-template-columns: repeat(${layout.columns}, 1fr);
                gap: 20px;
              }
              .block {
                break-inside: avoid;
              }
              .heading {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
                color: ${templateStyles.accentColor};
                grid-column: 1 / -1;
              }
              .paragraph {
                font-size: 14px;
                margin-bottom: 15px;
                text-align: left;
                line-height: ${styles.lineHeight};
              }
              .container {
                font-size: 14px;
                margin-bottom: 15px;
                padding: 15px;
                background: ${templateStyles.accentColor}15;
                border-radius: 5px;
                border-left: 4px solid ${templateStyles.accentColor};
              }
              .custom {
                font-size: 14px;
                margin-bottom: 15px;
                padding: 15px;
                background: ${templateStyles.accentColor}10;
                border-radius: 5px;
                border-left: 4px solid ${templateStyles.accentColor};
              }
              @media print {
                body { margin: 0; padding: 0; background: white; }
                .page { box-shadow: none; margin: 0; page-break-after: always; }
              }
            </style>
          </head>
          <body>
            <div class="page">
              ${contentBlocks.map(block => `
                <div class="block ${block.type}" style="
                  font-size: ${block.styles.fontSize}px;
                  font-family: ${block.styles.fontFamily};
                  color: ${block.styles.color};
                  line-height: ${block.styles.lineHeight};
                  font-weight: ${block.styles.fontWeight || 'normal'};
                  text-align: ${block.styles.textAlign || 'left'};
                ">
                  ${block.content.replace(/\n/g, '<br>')}
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const saveAsImage = () => {
    alert('Image export feature requires additional setup. Use print preview for now.')
  }

  const pageDimensions = getPageDimensions()
  const templateStyles = getTemplateStyles()

  const getBlockStyle = (block: ContentBlock): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: `${block.styles.fontSize}px`,
      fontFamily: block.styles.fontFamily,
      color: block.styles.color,
      lineHeight: block.styles.lineHeight,
      fontWeight: block.styles.fontWeight as React.CSSProperties['fontWeight'],
      textAlign: block.styles.textAlign as React.CSSProperties['textAlign'],
      marginBottom: '16px',
    }

    switch (block.type) {
      case 'heading':
        return {
          ...baseStyle,
          padding: '0',
          backgroundColor: 'transparent',
          borderLeft: 'none',
          borderRadius: '0',
          fontSize: `${Math.max(block.styles.fontSize, 18)}px`,
          fontWeight: 'bold',
          color: templateStyles.accentColor,
          gridColumn: '1 / -1'
        }
      case 'container':
        return {
          ...baseStyle,
          padding: '12px',
          backgroundColor: `${templateStyles.accentColor}15`,
          borderLeft: `4px solid ${templateStyles.accentColor}`,
          borderRadius: '4px'
        }
      case 'custom':
        return {
          ...baseStyle,
          padding: '12px',
          backgroundColor: `${templateStyles.accentColor}10`,
          borderLeft: `4px solid ${templateStyles.accentColor}`,
          borderRadius: '4px'
        }
      default:
        return {
          ...baseStyle,
          padding: '0',
          backgroundColor: 'transparent',
          borderLeft: 'none',
          borderRadius: '0'
        }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          PDF Preview - {layout.columns} Column{layout.columns !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={generatePDF}
          disabled={isGenerating || contentBlocks.length === 0}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">⚠️</div>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-center mb-4 overflow-auto">
        <div 
          ref={previewRef}
          className="border-2 border-gray-300 bg-gray-100 shadow-lg"
          style={{
            width: pageDimensions.width,
            height: pageDimensions.height,
            transform: 'scale(0.6)',
            transformOrigin: 'top center',
          }}
        >
          <div 
            className="h-full p-8"
            style={{
              fontFamily: templateStyles.fontFamily,
              color: templateStyles.color,
              backgroundColor: templateStyles.backgroundColor,
              display: 'grid',
              gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
              gap: '20px',
              overflow: 'auto'
            }}
          >
            {contentBlocks.length > 0 ? (
              contentBlocks.map((block) => (
                <div
                  key={block.id}
                  className="break-inside-avoid"
                  style={getBlockStyle(block)}
                >
                  {block.content.split('\n').map((line, index) => (
                    <div key={index}>
                      {line}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center h-full flex items-center justify-center col-span-full">
                <div>
                  <div className="text-6xl mb-4">📄</div>
                  <p>Add some content to see the preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Preview: {layout.pageSize} {layout.orientation} • {layout.columns} column(s) • {template} template
        <br />
        <span className="text-xs">Scaled to 60% for display</span>
      </div>

      <div className="mt-6 flex justify-center space-x-4">
        <button 
          onClick={printPreview}
          disabled={contentBlocks.length === 0}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Preview
        </button>
        <button 
          onClick={saveAsImage}
          disabled={contentBlocks.length === 0}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Image className="w-4 h-4" />
          Save as Image
        </button>
      </div>

      {contentBlocks.length === 0 && (
        <div className="mt-4 text-center text-amber-600 text-sm">
          Add content blocks in the editor above to see the preview
        </div>
      )}
    </div>
  )
}