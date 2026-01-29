
'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useEditorStore } from './store/useEditorStore' // Absolute path or relative depending on structure
import EditorHeader from './components/editor/EditorHeader'
import EditorSidebar from './components/editor/EditorSidebar'
import EditorMain from './components/editor/EditorMain'
import ContractDashboard from './components/contracts/ContractDashboard'
import CVPreview from './components/CVPreview'
// Re-importing legacy components for tabs not yet fully refactored if needed, 
// using placeholder logic for now based on store active tab.

export default function Home() {
  const { activeTab } = useEditorStore()

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* TOP HEADER */}
        <EditorHeader />

        {/* MAIN LAYOUT */}
        <div className="flex flex-1 overflow-hidden">

          {activeTab === 'document' && (
            <>
              {/* LEFT SIDEBAR */}
              <EditorSidebar />

              {/* MAIN AREA */}
              <EditorMain />
            </>
          )}

          {activeTab === 'cv' && (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">CV Builder</h2>
                <p className="text-gray-500 mb-8">This section is under renovation to match the new design system.</p>
                <CVPreview />
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="flex-1 p-8 overflow-y-auto">
              <ContractDashboard />
            </div>
          )}

        </div>
      </div>
    </DndProvider>
  )
}