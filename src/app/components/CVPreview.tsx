'use client'

import { useRef, useState } from 'react'
import { Download, Printer, Image, RefreshCw } from 'lucide-react'
import { CVTemplate } from '../lib/cv-templates'

interface CVPreviewProps {
  template: CVTemplate
}

export default function CVPreview({ template }: CVPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(0.8)

  const getTemplateColors = (): Record<string, { primary: string; secondary: string; bg: string; accent: string }> => {
    const colorSchemes: Record<string, { primary: string; secondary: string; bg: string; accent: string }> = {
      modern: {
        primary: '#1F2937',
        secondary: '#3B82F6',
        bg: '#FFFFFF',
        accent: '#3B82F6'
      },
      classic: {
        primary: '#374151',
        secondary: '#92400E',
        bg: '#FFFBEB',
        accent: '#D97706'
      },
      business: {
        primary: '#111827',
        secondary: '#1E40AF',
        bg: '#F3F4F6',
        accent: '#1E40AF'
      },
      creative: {
        primary: '#4B5563',
        secondary: '#BE185D',
        bg: '#FDF2F8',
        accent: '#EC4899'
      },
      minimal: {
        primary: '#000000',
        secondary: '#666666',
        bg: '#FFFFFF',
        accent: '#000000'
      },
      technical: {
        primary: '#1F2937',
        secondary: '#0369A1',
        bg: '#F0F4F8',
        accent: '#0369A1'
      }
    }
    return colorSchemes
  }

  const getSchemeForTemplate = () => {
    const schemes = getTemplateColors()
    const templateName = template.styles.layout || 'modern'
    return schemes[templateName] || schemes.modern
  }

  const getPersonalInfo = () => {
    const personalSection = template.structure.find(s => s.type === 'personal')
    if (!personalSection?.fields) return null
    
    const nameField = personalSection.fields.find(f => f.id === 'name')
    const titleField = personalSection.fields.find(f => f.id === 'title')
    
    return {
      name: nameField?.value || 'Your Name',
      title: titleField?.value || 'Professional Title'
    }
  }

  const getContactInfo = () => {
    const personalSection = template.structure.find(s => s.type === 'personal')
    if (!personalSection?.fields) return []
    
    return personalSection.fields
      .filter(f => f.id !== 'name' && f.id !== 'title' && f.value)
      .map(field => field.value)
  }

  const personalInfo = getPersonalInfo()
  const contactInfo = getContactInfo()
  const colorScheme = getSchemeForTemplate()

  const generatePDF = async () => {
    if (!template) {
      setError('Please select a CV template first')
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
          documentType: 'cv',
          cvTemplate: template
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
      link.download = `cv-${template.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Error generating CV PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate CV PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const printPreview = () => {
    if (!template) {
      setError('Please select a CV template first')
      return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow && personalInfo) {
      const scheme = colorScheme
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${personalInfo.name} - CV</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              * { margin: 0; padding: 0; box-sizing: border-box; }
              
              body {
                font-family: '${template.styles.fontFamily}', sans-serif;
                color: ${scheme.primary};
                background-color: ${scheme.bg};
                line-height: ${template.styles.spacing};
              }
              
              .cv-container {
                max-width: 210mm;
                height: 297mm;
                margin: 0 auto;
                padding: 40px;
                background: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid ${scheme.accent};
                padding-bottom: 20px;
              }
              
              .name {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 8px;
                color: ${scheme.primary};
                letter-spacing: 0.5px;
              }
              
              .title {
                font-size: 18px;
                color: ${scheme.accent};
                margin-bottom: 12px;
                font-weight: 500;
              }
              
              .contact-info {
                font-size: 13px;
                color: ${scheme.secondary};
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 20px;
              }
              
              .section {
                margin-bottom: 24px;
              }
              
              .section-title {
                font-size: 16px;
                font-weight: bold;
                color: ${scheme.primary};
                border-bottom: 2px solid ${scheme.accent};
                padding-bottom: 8px;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .section-content {
                font-size: 13px;
                color: #333;
                line-height: 1.6;
              }
              
              .item {
                margin-bottom: 12px;
              }
              
              .item-header {
                font-weight: 700;
                color: ${scheme.primary};
                margin-bottom: 4px;
              }
              
              .item-subheader {
                color: ${scheme.accent};
                font-style: italic;
                font-size: 12px;
                margin-bottom: 6px;
              }
              
              .skills-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              
              .skill-tag {
                background-color: ${scheme.accent}20;
                color: ${scheme.accent};
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
              }
              
              ul { padding-left: 18px; }
              li { margin-bottom: 4px; }
              
              @media print {
                body { margin: 0; padding: 0; background: white; }
                .cv-container { box-shadow: none; padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="cv-container">
              <div class="header">
                ${personalInfo.name ? `<div class="name">${personalInfo.name}</div>` : ''}
                ${personalInfo.title ? `<div class="title">${personalInfo.title}</div>` : ''}
                ${contactInfo.length > 0 ? `<div class="contact-info">${contactInfo.map(info => `<span>${info}</span>`).join('')}</div>` : ''}
              </div>
              
              ${template.structure
                .filter(section => section.type !== 'personal')
                .map(section => `
                  <div class="section">
                    <div class="section-title">${section.title}</div>
                    <div class="section-content">${renderContent(section)}</div>
                  </div>
                `).join('')}
            </div>
            
            <script>
              window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const renderContent = (section: any): string => {
    if (!section.content) return '<p>No content</p>'
    return section.content
  }

  const refreshPreview = () => {
    setScale(0.8)
  }

  const saveAsImage = () => {
    alert('Image export requires: Use print preview to save as PDF')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          CV Preview - {template.name}
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              disabled={scale <= 0.5}
              className="p-1 rounded border border-gray-300 disabled:opacity-50"
            >
              -
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(1.2, scale + 0.1))}
              disabled={scale >= 1.2}
              className="p-1 rounded border border-gray-300 disabled:opacity-50"
            >
              +
            </button>
          </div>
          
          <button
            onClick={refreshPreview}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={generatePDF}
            disabled={isGenerating}
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
                <span>Download CV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex justify-center mb-4">
        <div 
          ref={previewRef}
          className="border-2 border-gray-300 bg-white shadow-lg"
          style={{
            width: '210mm',
            height: '297mm',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            backgroundColor: colorScheme.bg
          }}
        >
          <div 
            className="h-full p-8"
            style={{
              fontFamily: template.styles.fontFamily,
              color: colorScheme.primary,
            }}
          >
            {personalInfo && (
              <div className="text-center mb-8 border-b-4 pb-6" style={{ borderColor: colorScheme.accent }}>
                <h1 className="text-4xl font-bold mb-3" style={{ color: colorScheme.primary }}>
                  {personalInfo.name}
                </h1>
                <h2 className="text-2xl mb-4 font-semibold" style={{ color: colorScheme.accent }}>
                  {personalInfo.title}
                </h2>
                {contactInfo.length > 0 && (
                  <div className="flex justify-center flex-wrap gap-4 text-sm" style={{ color: colorScheme.secondary }}>
                    {contactInfo.map((info, i) => <span key={i}>{info}</span>)}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              {template.structure
                .filter(s => s.type !== 'personal')
                .map((section) => (
                  <div key={section.id}>
                    <h3 
                      className="text-lg font-bold mb-4 pb-2 border-b-2 uppercase tracking-wide"
                      style={{ borderColor: colorScheme.accent, color: colorScheme.primary }}
                    >
                      {section.title}
                    </h3>
                    <div className="text-sm" style={{ color: '#333' }}>
                      {section.content ? (
                        <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br>') }} />
                      ) : (
                        <p className="text-gray-400 italic">Add content to this section...</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              Generated with PDF Craft Pro
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {template.name} • {template.styles.layout} layout • A4 Size
      </div>

      <div className="mt-6 flex justify-center space-x-4">
        <button 
          onClick={printPreview}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Print Preview
        </button>
        <button 
          onClick={saveAsImage}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Image className="w-4 h-4" />
          Save as Image
        </button>
      </div>
    </div>
  )
}