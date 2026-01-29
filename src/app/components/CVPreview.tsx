'use client'

import { useRef, useState } from 'react'
import { Download, Printer, RefreshCw } from 'lucide-react'
import { useCV } from '../lib/CVContext'
import { CVTemplate, CVSection } from '../lib/cv-templates'
import { pdf } from '@react-pdf/renderer'
import { CVPdfDocument } from './CVPdfDocument'

export default function CVPreview() {
  const { activeTemplate, isGenerating, setIsGenerating } = useCV()
  const template = activeTemplate

  const previewRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(0.8)

  const getTemplateColors = () => {
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

  // Helper to render section content (for Preview HTML)
  const renderSectionContent = (section: CVSection) => {
    if (!section.content) return <p className="text-gray-400 italic">Add content...</p>
    return <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br>') }} />
  }

  // Helper to render a full section block (for Preview HTML)
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

  // Layout Renderers (Mirror of PDF layout but in HTML flex/grid)
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

    // 3. Default
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

  // React-PDF Generation
  const generatePDF = async () => {
    if (!template) {
      setError('Please select a CV template first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Create PDF Blob
      const blob = await pdf(<CVPdfDocument template={template} />).toBlob()

      // Save
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cv-${template.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('CV PDF Generation Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate CV PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const printPreview = () => {
    // Keep legacy print preview for now, but really this should maybe just open the generated PDF blob in new tab?
    // Let's keep it as "Browser Print" fallback.
    window.print()
  }

  const refreshPreview = () => {
    setScale(0.8)
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
                <span>Download PDF</span>
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

      <div className="flex justify-center mb-4 overflow-auto bg-gray-100 p-8 rounded-lg print:p-0 print:bg-white">
        <div
          ref={previewRef}
          className="bg-white shadow-2xl transition-transform duration-200 ease-in-out print:shadow-none print:transform-none"
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
          Browser Print
        </button>
      </div>
    </div>
  )
}