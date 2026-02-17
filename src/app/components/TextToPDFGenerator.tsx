'use client'

import React, { useState } from 'react'
import { Download, FileText, Sparkles, Settings, Plus, Loader2 } from 'lucide-react'

interface TextToPDFGeneratorProps {
    onPDFGenerated?: (pdfData: string) => void
    className?: string
}

export default function TextToPDFGenerator({ onPDFGenerated, className = '' }: TextToPDFGeneratorProps) {
    const [prompt, setPrompt] = useState('')
    const [pageCount, setPageCount] = useState(1)
    const [style, setStyle] = useState('professional')
    const [layout, setLayout] = useState('modern')
    const [includeHeaders, setIncludeHeaders] = useState(true)
    const [includeFooters, setIncludeFooters] = useState(true)
    const [fontSize, setFontSize] = useState('normal')
    const [spacing, setSpacing] = useState('normal')
    const [isGenerating, setIsGenerating] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate PDF')
            return
        }

        setIsGenerating(true)
        setError(null)

        try {
            const response = await fetch('/api/enhanced-text-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    pageCount,
                    style,
                    layout,
                    includeHeaders,
                    includeFooters,
                    fontSize,
                    spacing
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate PDF')
            }

            const data = await response.json()
            
            // Create download link
            const blob = new Blob([atob(data.content)], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `generated-${Date.now()}.pdf`
            a.click()
            URL.revokeObjectURL(url)

            // Callback for parent component
            if (onPDFGenerated) {
                onPDFGenerated(data.content)
            }

        } catch (err: any) {
            console.error('PDF Generation Error:', err)
            setError(err.message || 'Failed to generate PDF')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">AI Text to PDF</h2>
                        <p className="text-sm text-gray-500">Generate professional PDFs from text prompts</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
                {/* Prompt Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FileText size={16} className="inline mr-1" />
                        Your Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your document topic, report title, or any text content..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Quick Settings */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Pages
                        </label>
                        <select
                            value={pageCount}
                            onChange={(e) => setPageCount(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? 'Page' : 'Pages'}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Style
                        </label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="professional">Professional</option>
                            <option value="modern">Modern</option>
                            <option value="academic">Academic</option>
                            <option value="creative">Creative</option>
                        </select>
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <Settings size={16} />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </button>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Layout
                                </label>
                                <select
                                    value={layout}
                                    onChange={(e) => setLayout(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="modern">Modern</option>
                                    <option value="classic">Classic</option>
                                    <option value="minimal">Minimal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Font Size
                                </label>
                                <select
                                    value={fontSize}
                                    onChange={(e) => setFontSize(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="small">Small</option>
                                    <option value="normal">Normal</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={includeHeaders}
                                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600"
                                />
                                Include Headers
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={includeFooters}
                                    onChange={(e) => setIncludeFooters(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600"
                                />
                                Include Footers
                            </label>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Professional PDF
                        </>
                    )}
                </button>

                {/* Tips */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 Pro Tips:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Be specific in your prompt for better results</li>
                        <li>• Use multiple pages for comprehensive documents</li>
                        <li>• Try different styles for various document types</li>
                        <li>• Enable headers/footers for professional documents</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
