'use client'

import { useRef, useState } from 'react'
import { Download, Printer, Image, RefreshCw } from 'lucide-react'
import { CVTemplate, CVSection } from '../lib/cv-templates'

interface CVPreviewProps {
  template: CVTemplate
}

export default function CVPreview({ template }: CVPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(0.8)

  const getTemplateColors = () => {
    // Fallback colors if not defined in template
    return {
      primary: template.styles.primaryColor || '#1F2937',
      secondary: template.styles.secondaryColor || '#3B82F6',
      bg: '#FFFFFF',
      accent: template.styles.accentColor || '#3B82F6'
    }
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
  const colorScheme = getTemplateColors()

  // Helper to render section content
  const renderSectionContent = (section: CVSection) => {
    if (!section.content) return <p className="text-gray-400 italic">Add content...</p>
    return <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br>') }} />
  }

  // Helper to render a full section block
  const renderSection = (section: CVSection) => (
    <div key={section.id} className="mb-6">
      <h3
        className="text-lg font-bold mb-3 pb-1 border-b-2 uppercase tracking-wide"
        style={{ borderColor: colorScheme.accent, color: colorScheme.primary }}
      >
        {section.title}
      </h3>
      <div className="text-sm leading-relaxed" style={{ color: '#333' }}>
        {renderSectionContent(section)}
      </div>
    </div>
  )

  // Layout Renderers
  const renderLayout = () => {
    const sections = template.structure.filter(s => s.type !== 'personal')
    const layoutType = template.styles.layout || 'classic'

    // 1. Two Column Layout
    if (layoutType === 'twocolumn' || layoutType === 'sidebar') {
      const sidebarSections = sections.filter(s => ['skills', 'education', 'languages', 'certifications', 'contact'].includes(s.type))
      const mainSections = sections.filter(s => !['skills', 'education', 'languages', 'certifications', 'contact'].includes(s.type))

      return (
        <div className="grid grid-cols-12 gap-8 h-full">
          {/* Sidebar */}
          <div className="col-span-4 pr-4 border-r border-gray-100">
            {/* Personal Info in Sidebar for some layouts, or just skills */}
            {layoutType === 'sidebar' && personalInfo && (
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2" style={{ color: colorScheme.primary }}>{personalInfo.name}</h1>
                <p className="text-sm font-medium mb-4" style={{ color: colorScheme.accent }}>{personalInfo.title}</p>
                <div className="text-xs space-y-1 text-gray-600">
                  {contactInfo.map((info, i) => <div key={i}>{info}</div>)}
                </div>
              </div>
            )}

            {sidebarSections.map(renderSection)}
          </div>

          {/* Main Content */}
          <div className="col-span-8">
            {layoutType !== 'sidebar' && personalInfo && (
              <div className="mb-8 border-b-2 pb-4" style={{ borderColor: colorScheme.accent }}>
                <h1 className="text-4xl font-bold mb-2" style={{ color: colorScheme.primary }}>{personalInfo.name}</h1>
                <h2 className="text-xl font-medium mb-3" style={{ color: colorScheme.secondary }}>{personalInfo.title}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {contactInfo.map((info, i) => <span key={i} className="bg-gray-50 px-2 py-1 rounded">{info}</span>)}
                </div>
              </div>
            )}
            {mainSections.map(renderSection)}
          </div>
        </div>
      )
    }

    // 2. Three Column Layout
    if (layoutType === 'threecolumn') {
      const leftSections = sections.filter(s => ['skills', 'languages'].includes(s.type))
      const rightSections = sections.filter(s => ['education', 'certifications'].includes(s.type))
      const centerSections = sections.filter(s => !['skills', 'languages', 'education', 'certifications'].includes(s.type))

      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          {personalInfo && (
            <div className="text-center mb-8 bg-gray-50 p-6 rounded-lg">
              <h1 className="text-3xl font-bold mb-2" style={{ color: colorScheme.primary }}>{personalInfo.name}</h1>
              <p className="text-lg font-medium mb-3" style={{ color: colorScheme.accent }}>{personalInfo.title}</p>
              <div className="flex justify-center gap-4 text-sm text-gray-600">
                {contactInfo.map((info, i) => <span key={i}>{info}</span>)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6 flex-grow">
            {/* Left Column */}
            <div className="col-span-3 text-sm">
              {leftSections.map(renderSection)}
            </div>

            {/* Center Column */}
            <div className="col-span-6 border-l border-r border-gray-100 px-6">
              {centerSections.map(renderSection)}
            </div>

            {/* Right Column */}
            <div className="col-span-3 text-sm">
              {rightSections.map(renderSection)}
            </div>
          </div>
        </div>
      )
    }

    // 3. Default / Classic / Modern Layout
    return (
      <div className="h-full">
        {personalInfo && (
          <div className="mb-8 border-b-4 pb-6" style={{ borderColor: colorScheme.accent }}>
            <h1 className="text-4xl font-bold mb-3" style={{ color: colorScheme.primary }}>
              {personalInfo.name}
            </h1>
            <h2 className="text-2xl mb-4 font-semibold" style={{ color: colorScheme.accent }}>
              {personalInfo.title}
            </h2>
            {contactInfo.length > 0 && (
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: colorScheme.secondary }}>
                {contactInfo.map((info, i) => <span key={i}>{info}</span>)}
              </div>
            )}
          </div>
        )}
        <div className="space-y-6">
          {sections.map(renderSection)}
        </div>
      </div>
    )
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

    // We need to construct the HTML for the print window.
    // This is a simplified version of what we render in React, but using raw HTML/CSS strings.
    // For a robust solution, we should ideally share the CSS logic.

    // For now, we will use a basic print stylesheet that mimics the React layout logic using CSS Grid.

    const printWindow = window.open('', '_blank')
    if (printWindow && personalInfo) {
      const scheme = colorScheme
      const layoutType = template.styles.layout || 'classic'

      let layoutCSS = ''
      if (layoutType === 'twocolumn' || layoutType === 'sidebar') {
        layoutCSS = `
          .grid-container { display: grid; grid-template-columns: 30% 70%; gap: 2rem; }
          .sidebar { border-right: 1px solid #eee; padding-right: 1rem; }
        `
      } else if (layoutType === 'threecolumn') {
        layoutCSS = `
          .grid-container { display: grid; grid-template-columns: 25% 50% 25%; gap: 1.5rem; }
          .center-col { border-left: 1px solid #eee; border-right: 1px solid #eee; padding: 0 1.5rem; }
        `
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${personalInfo.name} - CV</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');
              
              * { margin: 0; padding: 0; box-sizing: border-box; }
              
              body {
                font-family: '${template.styles.fontFamily}', sans-serif;
                color: ${scheme.primary};
                background-color: white;
                line-height: ${template.styles.spacing};
                -webkit-print-color-adjust: exact;
              }
              
              .cv-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 40px;
                background: white;
              }
              
              .header {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid ${scheme.accent};
              }
              
              .name { font-size: 32px; font-weight: bold; color: ${scheme.primary}; margin-bottom: 5px; }
              .title { font-size: 18px; color: ${scheme.accent}; margin-bottom: 10px; }
              .contact { font-size: 12px; color: ${scheme.secondary}; display: flex; gap: 15px; flex-wrap: wrap; }
              
              .section { margin-bottom: 20px; break-inside: avoid; }
              .section-title { 
                font-size: 14px; 
                font-weight: bold; 
                text-transform: uppercase; 
                border-bottom: 2px solid ${scheme.accent}; 
                margin-bottom: 10px;
                padding-bottom: 5px;
                color: ${scheme.primary};
              }
              .section-content { font-size: 12px; color: #333; }
              
              ${layoutCSS}
              
              @media print {
                body { margin: 0; padding: 0; }
                .cv-container { width: 100%; max-width: none; padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="cv-container">
              ${renderPrintHTML(layoutType)}
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

  // Helper to generate HTML string for print window based on layout
  const renderPrintHTML = (layoutType: string) => {
    const sections = template.structure.filter(s => s.type !== 'personal')
    const personal = getPersonalInfo()
    const contact = getContactInfo()

    const renderSec = (s: CVSection) => `
      <div class="section">
        <div class="section-title">${s.title}</div>
        <div class="section-content">${s.content ? s.content.replace(/\n/g, '<br>') : ''}</div>
      </div>
    `

    const headerHTML = `
      <div class="header" style="${layoutType === 'threecolumn' ? 'text-align: center;' : ''}">
        <div class="name">${personal?.name}</div>
        <div class="title">${personal?.title}</div>
        <div class="contact" style="${layoutType === 'threecolumn' ? 'justify-content: center;' : ''}">
          ${contact.map(c => `<span>${c}</span>`).join('')}
        </div>
      </div>
    `

    if (layoutType === 'twocolumn' || layoutType === 'sidebar') {
      const sidebarSecs = sections.filter(s => ['skills', 'education', 'languages', 'certifications', 'contact'].includes(s.type))
      const mainSecs = sections.filter(s => !['skills', 'education', 'languages', 'certifications', 'contact'].includes(s.type))

      return `
        ${layoutType !== 'sidebar' ? headerHTML : ''}
        <div class="grid-container">
          <div class="sidebar">
            ${layoutType === 'sidebar' ? headerHTML : ''}
            ${sidebarSecs.map(renderSec).join('')}
          </div>
          <div class="main">
            ${mainSecs.map(renderSec).join('')}
          </div>
        </div>
      `
    }

    if (layoutType === 'threecolumn') {
      const leftSecs = sections.filter(s => ['skills', 'languages'].includes(s.type))
      const rightSecs = sections.filter(s => ['education', 'certifications'].includes(s.type))
      const centerSecs = sections.filter(s => !['skills', 'languages', 'education', 'certifications'].includes(s.type))

      return `
        ${headerHTML}
        <div class="grid-container">
          <div class="left-col">${leftSecs.map(renderSec).join('')}</div>
          <div class="center-col">${centerSecs.map(renderSec).join('')}</div>
          <div class="right-col">${rightSecs.map(renderSec).join('')}</div>
        </div>
      `
    }

    // Default
    return `
      ${headerHTML}
      <div>
        ${sections.map(renderSec).join('')}
      </div>
    `
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

      <div className="flex justify-center mb-4 overflow-auto bg-gray-100 p-8 rounded-lg">
        <div
          ref={previewRef}
          className="bg-white shadow-2xl transition-transform duration-200 ease-in-out"
          style={{
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            backgroundColor: colorScheme.bg
          }}
        >
          <div
            className="h-full p-10"
            style={{
              fontFamily: template.styles.fontFamily,
              color: colorScheme.primary,
            }}
          >
            {renderLayout()}
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
      </div>
    </div>
  )
}