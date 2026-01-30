
'use client'

import { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { FileText, FileSpreadsheet, Scale, Download, Loader2, RotateCcw, RotateCw } from 'lucide-react'

export default function EditorHeader() {
    const { activeTab, setTab, elements, docTitle, setDocTitle, showTitle, toggleShowTitle, undo, redo } = useEditorStore()
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            // Map store elements to API format - with absolute positioning
            const contentBlocks = elements.map(el => ({
                id: el.id,
                type: el.type,
                content: el.content,
                x: el.x,
                y: el.y,
                style: {
                    fontFamily: el.style.fontFamily,
                    fontSize: el.style.fontSize,
                    fontWeight: el.style.fontWeight,
                    fontStyle: el.style.fontStyle,
                    textDecoration: el.style.textDecoration,
                    textAlign: el.style.textAlign,
                    color: el.style.color,
                    backgroundColor: el.style.backgroundColor,
                    lineHeight: el.style.lineHeight,
                    padding: el.style.padding,
                    margin: el.style.margin,
                    width: el.style.width,
                    height: el.style.height,
                    borderRadius: el.style.borderRadius,
                    borderWidth: el.style.borderWidth,
                    borderColor: el.style.borderColor,
                    opacity: el.style.opacity
                }
            }))

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentBlocks,
                    docTitle,
                    showTitle,
                    documentType: 'document'
                })
            })

            if (!response.ok) throw new Error('Failed to generate PDF')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${docTitle.replace(/\s+/g, '-').toLowerCase() || 'document'}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

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

            <div className="flex items-center gap-4">
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleDownload}
                    disabled={isGenerating}
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
            </div>
        </header>
    )
}
