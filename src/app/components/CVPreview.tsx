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

  const getTemplateStyles = () => {
    const baseStyles = {
      fontFamily: template.styles.fontFamily,
      color: template.styles.primaryColor,
      backgroundColor: '#FFFFFF'
    }

    switch (template.styles.layout) {
      case 'modern':
        return { ...baseStyles, backgroundColor: '#F8FAFC' }
      case 'classic':
        return { ...baseStyles, backgroundColor: '#FEFCE8' }
      case 'creative':
        return { ...baseStyles, backgroundColor: '#FDF4FF' }
      case 'minimal':
        return { ...baseStyles, backgroundColor: '#FFFFFF' }
      default:
        return baseStyles
    }
  }

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
    if (printWindow) {
      const templateStyles = getTemplateStyles()
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${personalInfo?.name || 'CV'} - PDF Craft Pro</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              body {
                font-family: '${template.styles.fontFamily}', sans-serif;
                color: ${template.styles.primaryColor};
                background-color: ${templateStyles.backgroundColor};
                margin: 0;
                padding: 40px;
                line-height: ${template.styles.spacing};
                max-width: 210mm;
                margin: 0 auto;
              }
              
              .cv-container {
                background: white;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                min-height: 297mm;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid ${template.styles.secondaryColor};
                padding-bottom: 20px;
              }
              
              .name {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
                color: ${template.styles.primaryColor};
              }
              
              .title {
                font-size: 18px;
                color: ${template.styles.secondaryColor};
                margin-bottom: 12px;
              }
              
              .contact-info {
                font-size: 14px;
                color: #666;
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 15px;
              }
              
              .section {
                margin-bottom: 25px;
              }
              
              .section-title {
                font-size: 18px;
                font-weight: bold;
                color: ${template.styles.primaryColor};
                border-bottom: 1px solid ${template.styles.secondaryColor};
                padding-bottom: 5px;
                margin-bottom: 15px;
              }
              
              .section-content {
                font-size: 14px;
                color: #333;
                line-height: 1.6;
              }
              
              .experience-item, .education-item {
                margin-bottom: 15px;
              }
              
              .item-header {
                font-weight: 600;
                color: ${template.styles.primaryColor};
                margin-bottom: 5px;
              }
              
              .item-subheader {
                color: ${template.styles.secondaryColor};
                font-style: italic;
                margin-bottom: 8px;
              }
              
              .skills-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              
              .skill-tag {
                background-color: ${template.styles.secondaryColor}20;
                color: ${template.styles.secondaryColor};
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
              }
              
              .bullet-list {
                padding-left: 20px;
              }
              
              .bullet-list li {
                margin-bottom: 4px;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  padding: 0; 
                  background: white;
                }
                .cv-container { 
                  box-shadow: none; 
                  padding: 20px;
                  min-height: auto;
                }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="cv-container">
              <!-- Header -->
              <div class="header">
                ${personalInfo?.name ? `<div class="name">${personalInfo.name}</div>` : ''}
                ${personalInfo?.title ? `<div class="title">${personalInfo.title}</div>` : ''}
                ${contactInfo.length > 0 ? `
                  <div class="contact-info">
                    ${contactInfo.map(info => `<span>${info}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
              
              <!-- Sections -->
              ${template.structure
                .filter(section => section.type !== 'personal')
                .map(section => `
                  <div class="section">
                    <div class="section-title">${section.title}</div>
                    <div class="section-content">
                      ${renderSectionContent(section)}
                    </div>
                  </div>
                `).join('')}
              
              <!-- Footer -->
              <div class="no-print" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                Generated with PDF Craft Pro • ${new Date().toLocaleDateString()}
              </div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const renderSectionContent = (section: any) => {
    switch (section.type) {
      case 'summary':
        return `<p style="text-align: justify;">${section.content || 'Professional summary will appear here...'}</p>`
      
      case 'skills':
        const skills = section.content.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill)
        if (skills.length > 0) {
          return `
            <div class="skills-container">
              ${skills.map((skill: string) => `
                <div class="skill-tag">${skill}</div>
              `).join('')}
            </div>
          `
        }
        return '<p>Skills will appear here...</p>'
      
      case 'experience':
      case 'education':
        if (section.content) {
          return section.content.split('\\n\\n').map((item: string) => {
            const lines = item.split('\\n')
            const header = lines[0] || ''
            const details = lines.slice(1)
            
            return `
              <div class="${section.type}-item">
                <div class="item-header">${header}</div>
                ${details.length > 0 ? `
                  <ul class="bullet-list">
                    ${details.map((detail: string) => `
                      <li>${detail.replace(/^•\\s*/, '')}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `
          }).join('')
        }
        return `<p>${section.title} details will appear here...</p>`
      
      case 'projects':
        if (section.content) {
          return section.content.split('\\n\\n').map((project: string) => {
            const lines = project.split('\\n')
            const title = lines[0] || ''
            const description = lines.slice(1).join('<br>')
            
            return `
              <div class="experience-item">
                <div class="item-header">${title}</div>
                ${description ? `<div class="item-subheader">${description}</div>` : ''}
              </div>
            `
          }).join('')
        }
        return '<p>Projects will appear here...</p>'
      
      default:
        if (section.content) {
          return `<p>${section.content.replace(/\\n/g, '<br>')}</p>`
        }
        if (section.fields && section.fields.length > 0) {
          return section.fields.map((field: any) => `
            <div style="margin-bottom: 8px;">
              <strong>${field.label}:</strong> ${field.value || 'Not specified'}
            </div>
          `).join('')
        }
        return `<p>${section.title} content will appear here...</p>`
    }
  }

  const saveAsImage = async () => {
    if (!template) {
      setError('Please select a CV template first')
      return
    }

    try {
      // For now, we'll use a simple approach since html2canvas requires additional setup
      alert('To save as image: Use the print preview and choose "Save as PDF" or use a screenshot tool. Advanced image export requires additional libraries.')
    } catch (err) {
      console.error('Error saving as image:', err)
      setError('Image export requires additional setup. Use print preview for now.')
    }
  }

  const refreshPreview = () => {
    setScale(0.8) // Reset scale
    // Force re-render of preview
  }

  const templateStyles = getTemplateStyles()

  const getBlockStyle = (section: any) => {
    const baseStyle = {
      fontSize: '14px',
      fontFamily: template.styles.fontFamily,
      color: '#333',
      lineHeight: template.styles.spacing.toString(),
      marginBottom: '20px',
    }

    switch (section.type) {
      case 'summary':
        return {
          ...baseStyle,
          textAlign: 'justify' as const,
          fontSize: '14px'
        }
      case 'skills':
        return baseStyle
      default:
        return baseStyle
    }
  }

  const renderPreviewSectionContent = (section: any) => {
    switch (section.type) {
      case 'summary':
        return (
          <p className="text-justify">
            {section.content || 'Professional summary will appear here...'}
          </p>
        )
      
      case 'skills':
        const skills = section.content.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill)
        if (skills.length > 0) {
          return (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${template.styles.secondaryColor}20`,
                    color: template.styles.secondaryColor
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )
        }
        return <p className="text-gray-400 italic">Skills will appear here...</p>
      
      case 'experience':
      case 'education':
        if (section.content) {
          return section.content.split('\n\n').map((item: string, index: number) => {
            const lines = item.split('\n')
            const header = lines[0] || ''
            const details = lines.slice(1)
            
            return (
              <div key={index} className="mb-4">
                <div 
                  className="font-semibold mb-1"
                  style={{ color: template.styles.primaryColor }}
                >
                  {header}
                </div>
                {details.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {details.map((detail: string, detailIndex: number) => (
                      <li key={detailIndex}>{detail.replace(/^•\s*/, '')}</li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })
        }
        return <p className="text-gray-400 italic">{section.title} details will appear here...</p>
      
      case 'projects':
        if (section.content) {
          return section.content.split('\n\n').map((project: string, index: number) => {
            const lines = project.split('\n')
            const title = lines[0] || ''
            const description = lines.slice(1).join(' • ')
            
            return (
              <div key={index} className="mb-3">
                <div 
                  className="font-semibold"
                  style={{ color: template.styles.primaryColor }}
                >
                  {title}
                </div>
                {description && (
                  <div 
                    className="text-sm mt-1"
                    style={{ color: template.styles.secondaryColor }}
                  >
                    {description}
                  </div>
                )}
              </div>
            )
          })
        }
        return <p className="text-gray-400 italic">Projects will appear here...</p>
      
      default:
        if (section.content) {
          return (
            <div className="whitespace-pre-wrap">
              {section.content}
            </div>
          )
        }
        if (section.fields && section.fields.length > 0) {
          return section.fields.map((field: any) => (
            <div key={field.id} className="mb-2">
              <span className="font-semibold">{field.label}:</span>{' '}
              <span>{field.value || 'Not specified'}</span>
            </div>
          ))
        }
        return <p className="text-gray-400 italic">{section.title} content will appear here...</p>
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          CV Preview
        </h2>
        <div className="flex items-center space-x-3">
          {/* Scale Controls */}
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
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Refresh Preview"
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
      
      <div className="flex justify-center mb-4">
        <div 
          ref={previewRef}
          className="border-2 border-gray-300 bg-white shadow-lg overflow-hidden"
          style={{
            width: '210mm',
            height: '297mm',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            backgroundColor: templateStyles.backgroundColor
          }}
        >
          <div 
            className="h-full p-8"
            style={{
              fontFamily: template.styles.fontFamily,
              color: template.styles.primaryColor,
            }}
          >
            {/* Header */}
            <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: template.styles.secondaryColor }}>
              {personalInfo?.name && (
                <h1 
                  className="text-3xl font-bold mb-3"
                  style={{ color: template.styles.primaryColor }}
                >
                  {personalInfo.name}
                </h1>
              )}
              {personalInfo?.title && (
                <h2 
                  className="text-xl mb-4"
                  style={{ color: template.styles.secondaryColor }}
                >
                  {personalInfo.title}
                </h2>
              )}
              {contactInfo.length > 0 && (
                <div 
                  className="flex justify-center flex-wrap gap-4 text-sm"
                  style={{ color: template.styles.secondaryColor }}
                >
                  {contactInfo.map((info, index) => (
                    <span key={index}>{info}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {template.structure
                .filter(section => section.type !== 'personal')
                .map((section) => (
                  <div key={section.id}>
                    <h3 
                      className="text-lg font-semibold mb-4 pb-2 border-b"
                      style={{ 
                        borderColor: template.styles.secondaryColor, 
                        color: template.styles.primaryColor 
                      }}
                    >
                      {section.title}
                    </h3>
                    
                    <div style={getBlockStyle(section)}>
                      {renderPreviewSectionContent(section)}
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              Generated with PDF Craft Pro • {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Preview: {template.name} • {template.styles.layout} layout • A4 Size
        <br />
        <span className="text-xs">Scaled to {Math.round(scale * 100)}% for display</span>
      </div>

      <div className="mt-6 flex justify-center space-x-4">
        <button 
          onClick={printPreview}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Preview
        </button>
        <button 
          onClick={saveAsImage}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Image className="w-4 h-4" />
          Save as Image
        </button>
      </div>

      {template.structure.filter(s => s.type !== 'personal').length === 0 && (
        <div className="mt-4 text-center text-amber-600 text-sm">
          Add content sections in the editor to see the preview
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-gray-600">
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-semibold">Sections</div>
          <div>{template.structure.filter(s => s.type !== 'personal').length}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-semibold">Fields</div>
          <div>{template.structure.reduce((acc, section) => acc + (section.fields?.length || 0), 0)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-semibold">Content</div>
          <div>{template.structure.reduce((acc, section) => acc + section.content.length, 0)} chars</div>
        </div>
      </div>
    </div>
  )
}