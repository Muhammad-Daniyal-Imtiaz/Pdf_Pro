
'use client'

import { useEditorStore } from '../../store/useEditorStore'
import { FileText, FileSpreadsheet, Scale, Download } from 'lucide-react'

export default function EditorHeader() {
    const { activeTab, setTab } = useEditorStore()

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 sticky top-0">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                </div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">PDF Craft Pro</h1>
            </div>

            <nav className="flex items-center bg-gray-100 p-1 rounded-lg">
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

            <div className="flex items-center gap-4">
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    onClick={() => window.print()}
                >
                    <Download size={16} />
                    Download PDF
                </button>
            </div>
        </header>
    )
}
