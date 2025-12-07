'use client'

import { useState, useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import PDFEditor from './components/PDFEditor'
import TextInput from './components/TextInput'
import StyleControls from './components/StyleControls'
import LayoutControls from './components/LayoutControls'
import PDFPreview from './components/PDFPreview'
import CVPreview from './components/CVPreview'
import CVEditor from './components/CVEditor'
import CVTemplatesGallery from './components/CVTemplatesGallery'
import AIContentGenerator from './components/AIContentGenerator'
import { CVTemplate, cvTemplates } from './lib/cv-templates'
import ContractDashboard from './components/contracts/ContractDashboard'

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

export default function Home() {
  const [content, setContent] = useState('')
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [styles, setStyles] = useState<Styles>({
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#000000',
    lineHeight: 1.5,
    margin: 20
  })
  const [layout, setLayout] = useState<Layout>({
    pageSize: 'A4',
    orientation: 'portrait',
    columns: 1
  })
  const [template, setTemplate] = useState('modern')

  // CV State
  const [activeTab, setActiveTab] = useState<'document' | 'cv' | 'contracts'>('document')
  const [selectedCVTemplate, setSelectedCVTemplate] = useState<CVTemplate>(cvTemplates[0])
  const [cvTemplate, setCVTemplate] = useState<CVTemplate>(cvTemplates[0])

  // AI Mode
  const [aiMode, setAiMode] = useState<'manual' | 'ai'>('manual')
  const [aiGeneratedContent, setAiGeneratedContent] = useState('')

  // When AI generates content, sync it everywhere
  const handleAIContentGenerated = (generated: string) => {
    setAiGeneratedContent(generated)
    setContent(generated)
    // Auto-convert to blocks
    const blocks = generated
      .split('\n\n')
      .filter(Boolean)
      .map((block, i) => ({
        id: `ai-${Date.now()}-${i}`,
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
    setContentBlocks(blocks)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">PDF Craft Pro</h1>
            <p className="text-xl text-gray-600 mb-2">
              Advanced PDF & CV Editor with Professional Templates & AI
            </p>

            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-inner flex">
                <button
                  onClick={() => setActiveTab('document')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'document'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  📄 Document Editor
                </button>
                <button
                  onClick={() => setActiveTab('cv')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'cv'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  👔 CV Builder
                </button>
                <button
                  onClick={() => setActiveTab('contracts')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'contracts'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  📜 Contracts
                </button>
              </div>
            </div>
          </header>

          {activeTab === 'document' ? (
            /* Document Editor Layout */
            <div className="space-y-8">
              {/* Mode Toggle */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Content Mode</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setAiMode('manual')}
                      className={`px-4 py-2 rounded-md transition-colors ${aiMode === 'manual'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      ✏️ Manual
                    </button>
                    <button
                      onClick={() => setAiMode('ai')}
                      className={`px-4 py-2 rounded-md transition-colors ${aiMode === 'ai'
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      🤖 AI Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Generator */}
              {aiMode === 'ai' && (
                <AIContentGenerator
                  type="document"
                  onContentGenerated={handleAIContentGenerated}
                />
              )}

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  {aiMode === 'manual' && (
                    <TextInput content={content} onContentChange={setContent} />
                  )}
                  <StyleControls styles={styles} onStylesChange={setStyles} />
                  <LayoutControls layout={layout} onLayoutChange={setLayout} />
                </div>

                {/* Right Content */}
                <div className="lg:col-span-2 space-y-6">
                  <PDFEditor
                    content={content}
                    styles={styles}
                    layout={layout}
                    template={template}
                    onTemplateChange={setTemplate}
                    contentBlocks={contentBlocks}
                    onContentBlocksChange={setContentBlocks}
                  />
                  <PDFPreview
                    contentBlocks={contentBlocks}
                    styles={styles}
                    layout={layout}
                    template={template}
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'cv' ? (
            /* CV Builder Layout */
            <div className="space-y-8">
              {/* CV Mode Toggle */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">CV Content Mode</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setAiMode('manual')}
                      className={`px-4 py-2 rounded-md transition-colors ${aiMode === 'manual'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      ✏️ Manual
                    </button>
                    <button
                      onClick={() => setAiMode('ai')}
                      className={`px-4 py-2 rounded-md transition-colors ${aiMode === 'ai'
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      🤖 AI Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* AI CV Generator */}
              {aiMode === 'ai' && (
                <AIContentGenerator
                  type="cv"
                  onContentGenerated={(generated) => {
                    // Parse AI output into CV sections
                    const updated = { ...cvTemplate }
                    const lines = generated.split('\n')
                    let currentSection: 'summary' | 'skills' | 'experience' | 'education' | null = null

                    lines.forEach((line) => {
                      if (line.toLowerCase().includes('summary')) currentSection = 'summary'
                      else if (line.toLowerCase().includes('skill')) currentSection = 'skills'
                      else if (line.toLowerCase().includes('experience')) currentSection = 'experience'
                      else if (line.toLowerCase().includes('education')) currentSection = 'education'
                      else if (line.trim() && currentSection) {
                        const section = updated.structure.find((s) => s.type === currentSection)
                        if (section) section.content += line + '\n'
                      }
                    })

                    setCVTemplate(updated)
                  }}
                />
              )}

              {/* Templates Gallery */}
              <CVTemplatesGallery
                onTemplateSelect={(tpl) => {
                  setSelectedCVTemplate(tpl)
                  setCVTemplate(JSON.parse(JSON.stringify(tpl)))
                }}
                selectedTemplate={selectedCVTemplate}
              />

              {/* Editor + Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CVEditor template={cvTemplate} onTemplateUpdate={setCVTemplate} />
                <CVPreview template={cvTemplate} />
              </div>
            </div>
          ) : (
            <ContractDashboard />
          )}
        </div>
      </div>
    </DndProvider>
  )
}