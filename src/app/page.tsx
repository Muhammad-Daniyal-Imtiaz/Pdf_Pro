'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useEditorStore } from './store/useEditorStore'
import EditorHeader from './components/editor/EditorHeader'
import EditorSidebar from './components/editor/EditorSidebar'
import EditorMain from './components/editor/EditorMain'

export default function Home() {
  const { activeTab } = useEditorStore()

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        <EditorHeader />
        
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'document' && (
            <>
              <EditorSidebar />
              <EditorMain />
            </>
          )}
          
          {activeTab === 'cv' && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">CV Builder</h2>
                <p>Coming soon...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'contracts' && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Contracts</h2>
                <p>Coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}