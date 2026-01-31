'use client'

import { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { FileText, FileSpreadsheet, Scale, Download, Loader2, RotateCcw, RotateCw } from 'lucide-react'

export default function EditorHeader() {
    const { activeTab, setTab, docTitle, setDocTitle, showTitle, toggleShowTitle, undo, redo } = useEditorStore()
    const [isGenerating, setIsGenerating] = useState(false)

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden md:block">PDF Craft Pro</h1>
                    <div className="h-6 w-[1px] bg-gray-300 mx-2 hidden md:block"></div>
                </div>

                {/* Document Title Editor */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="text-sm font-medium text-gray-700 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded px-2 py-1 outline-none transition-all w-48"
                        placeholder="Untitled Document"
                    />
                    <button
                        onClick={toggleShowTitle}
                        className={`text-xs px-2 py-1 rounded border transition-all ${showTitle ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                        title="Toggle Title in PDF"
                    >
                        {showTitle ? 'Title: ON' : 'Title: OFF'}
                    </button>

                    {/* Undo/Redo Controls */}
                    <div className="flex items-center gap-1 ml-2 border-l border-gray-300 pl-3">
                        <button onClick={undo} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Undo (Ctrl+Z)">
                            <RotateCcw size={16} />
                        </button>
                        <button onClick={redo} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Redo (Ctrl+Y)">
                            <RotateCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <nav className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                    onClick={() => setTab('document')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'document' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <FileText size={16} />
                    Document Editor
                </button>
                <button
                    onClick={() => setTab('cv')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'cv' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <FileSpreadsheet size={16} />
                    CV Builder
                </button>
                <button
                    onClick={() => setTab('contracts')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'contracts' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Scale size={16} />
                    Contracts
                </button>
            </nav>

            {/* Remove preview toggle from here - it's now in the layout */}
        </header>
    )
}