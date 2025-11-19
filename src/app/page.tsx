'use client'

import { useState } from 'react'
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
import { CVTemplate, cvTemplates } from './lib/cv-templates'

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
  const [activeTab, setActiveTab] = useState<'document' | 'cv'>('document')
  const [selectedCVTemplate, setSelectedCVTemplate] = useState<CVTemplate>(cvTemplates[0])
  const [cvTemplate, setCVTemplate] = useState<CVTemplate>(cvTemplates[0])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              PDF Craft Pro
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Advanced PDF & CV Editor with Professional Templates
            </p>
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => setActiveTab('document')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    activeTab === 'document'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📄 Document Editor
                </button>
                <button
                  onClick={() => setActiveTab('cv')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    activeTab === 'cv'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  👔 CV Builder
                </button>
              </div>
            </div>
          </header>

          {activeTab === 'document' ? (
            /* Document Editor Layout */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Sidebar - Input & Controls */}
              <div className="lg:col-span-1 space-y-6">
                <TextInput 
                  content={content} 
                  onContentChange={setContent} 
                />
                
                <StyleControls 
                  styles={styles} 
                  onStylesChange={setStyles} 
                />
                
                <LayoutControls 
                  layout={layout} 
                  onLayoutChange={setLayout} 
                />
              </div>

              {/* Main Editor Area */}
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
          ) : (
            /* CV Builder Layout */
            <div className="space-y-8">
              {/* CV Templates Gallery */}
              <CVTemplatesGallery
                onTemplateSelect={(template) => {
                  setSelectedCVTemplate(template)
                  setCVTemplate(JSON.parse(JSON.stringify(template))) // Deep clone
                }}
                selectedTemplate={selectedCVTemplate}
              />

              {/* CV Editor and Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <CVEditor
                    template={cvTemplate}
                    onTemplateUpdate={setCVTemplate}
                  />
                </div>
                <div>
                  <CVPreview template={cvTemplate} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}