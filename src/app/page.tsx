'use client'

import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import PDFEditor from './components/PDFEditor'
import TextInput from './components/TextInput'
import StyleControls from './components/StyleControls'
import LayoutControls from './components/LayoutControls'
import PDFPreview from './components/PDFPreview'

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              PDF Craft Pro
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Advanced PDF Editor with Drag & Drop Controls
            </p>
            <p className="text-gray-500">
              Create any type of PDF document with complete flexibility
            </p>
          </header>

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
        </div>
      </div>
    </DndProvider>
  )
}