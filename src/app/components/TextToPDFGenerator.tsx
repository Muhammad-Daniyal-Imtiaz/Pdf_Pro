'use client'

import React, { useState, useRef } from 'react'
import { Download, FileText, Sparkles, Settings, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

interface TextToPDFGeneratorProps {
    onPDFGenerated?: (pdfData: string) => void
    className?: string
}

const STYLE_PREVIEWS: Record<string, { icon: string; description: string; primaryColor: string }> = {
    professional: { icon: '🏢', description: 'Clean, corporate blue', primaryColor: '#1e40af' },
    modern: { icon: '✨', description: 'Bold, purple accents', primaryColor: '#7c3aed' },
    academic: { icon: '📚', description: 'Serif, scholarly black', primaryColor: '#1a1a1a' },
    creative: { icon: '🎨', description: 'Warm pink, expressive', primaryColor: '#be185d' },
}

type Status = 'idle' | 'processing' | 'success' | 'error'

export default function TextToPDFGenerator({ onPDFGenerated, className = '' }: TextToPDFGeneratorProps) {
    const [prompt, setPrompt] = useState('')
    const [pageCount, setPageCount] = useState(1)
    const [style, setStyle] = useState('professional')
    const [layout, setLayout] = useState('modern')
    const [includeHeaders, setIncludeHeaders] = useState(true)
    const [includeFooters, setIncludeFooters] = useState(true)
    const [fontSize, setFontSize] = useState('normal')
    const [spacing, setSpacing] = useState('normal')
    const [status, setStatus] = useState<Status>('idle')
    const [statusMsg, setStatusMsg] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    const handleCancel = () => {
        abortRef.current?.abort()
        setStatus('idle')
        setStatusMsg('')
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setStatus('error')
            setStatusMsg('Please describe the PDF you want to create.')
            return
        }

        abortRef.current = new AbortController()
        setStatus('processing')
        setStatusMsg('AI is writing your document…')

        try {
            const response = await fetch('/api/enhanced-text-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortRef.current.signal,
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    pageCount,
                    style,
                    layout,
                    includeHeaders,
                    includeFooters,
                    fontSize,
                    spacing,
                }),
            })

            if (!response.ok) {
                // Try to parse error JSON
                let msg = `Error ${response.status}`
                try {
                    const errData = await response.json()
                    msg = errData.error || msg
                } catch { }
                throw new Error(msg)
            }

            setStatusMsg('Rendering PDF…')

            // ✅ FIXED: The old code did:
            //   const data = await response.json()
            //   new Blob([atob(data.content)], ...)
            // This was WRONG — atob() returns a binary string, not a Uint8Array,
            // so the Blob contained garbled bytes and the PDF was corrupt.
            //
            // The new API streams the PDF binary directly (Content-Type: application/pdf).
            // We read it as arrayBuffer and create a valid Blob from the raw bytes.
            const arrayBuffer = await response.arrayBuffer()
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' })

            // Download
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            // Try to get filename from Content-Disposition header
            const disposition = response.headers.get('content-disposition') || ''
            const match = disposition.match(/filename="([^"]+)"/)
            a.download = match?.[1] || `${prompt.slice(0, 40).replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '-')}.pdf`
            a.click()
            URL.revokeObjectURL(url)

            // Callback with blob URL string (callers can use this however they want)
            onPDFGenerated?.(url)

            setStatus('success')
            setStatusMsg('PDF downloaded successfully!')
            setTimeout(() => { setStatus('idle'); setStatusMsg('') }, 4000)

        } catch (err: any) {
            if (err.name === 'AbortError') {
                setStatus('idle')
                setStatusMsg('')
                return
            }
            console.error('[TextToPDFGenerator] Error:', err)
            setStatus('error')
            setStatusMsg(err.message || 'Failed to generate PDF. Please try again.')
        }
    }

    const isGenerating = status === 'processing'
    const canGenerate = !isGenerating && prompt.trim().length > 0

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-violet-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Sparkles className="text-white" size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-800">AI Text → PDF</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Describe any document — AI writes and formats it</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* ── Prompt ───────────────────────────────────────────────────────── */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        What document do you need?
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Write a 2-page research summary about climate change mitigation strategies, covering carbon capture, renewable energy, and international policy approaches. Use an academic tone."
                        className="w-full h-28 p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none bg-gray-50 placeholder-gray-400"
                        disabled={isGenerating}
                    />
                    <div className="flex justify-end mt-1">
                        <span className={`text-[10px] font-medium ${prompt.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                            {prompt.length} / 2000
                        </span>
                    </div>
                </div>

                {/* ── Pages + Style ────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Pages</label>
                        <select
                            value={pageCount}
                            onChange={(e) => setPageCount(Number(e.target.value))}
                            disabled={isGenerating}
                            className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <option key={n} value={n}>{n} {n === 1 ? 'Page' : 'Pages'}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Style</label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            disabled={isGenerating}
                            className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {Object.entries(STYLE_PREVIEWS).map(([key, val]) => (
                                <option key={key} value={key}>{val.icon} {key[0].toUpperCase() + key.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Style preview dot */}
                {style && STYLE_PREVIEWS[style] && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <div className="w-3 h-3 rounded-full border border-white shadow"
                            style={{ backgroundColor: STYLE_PREVIEWS[style].primaryColor }} />
                        {STYLE_PREVIEWS[style].description}
                    </div>
                )}

                {/* ── Advanced toggle ──────────────────────────────────────────────── */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <Settings size={13} className={`transition-transform ${showAdvanced ? 'rotate-45' : ''}`} />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>

                {showAdvanced && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Layout</label>
                                <select value={layout} onChange={e => setLayout(e.target.value)}
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white">
                                    <option value="modern">Modern</option>
                                    <option value="classic">Classic</option>
                                    <option value="minimal">Minimal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Font Size</label>
                                <select value={fontSize} onChange={e => setFontSize(e.target.value)}
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white">
                                    <option value="small">Small</option>
                                    <option value="normal">Normal</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Spacing</label>
                                <select value={spacing} onChange={e => setSpacing(e.target.value)}
                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white">
                                    <option value="compact">Compact</option>
                                    <option value="normal">Normal</option>
                                    <option value="relaxed">Relaxed</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={includeHeaders} onChange={e => setIncludeHeaders(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                                Page Headers
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={includeFooters} onChange={e => setIncludeFooters(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                                Page Footers
                            </label>
                        </div>
                    </div>
                )}

                {/* ── Status Banner ────────────────────────────────────────────────── */}
                {statusMsg && (
                    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${status === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                        status === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                            'bg-blue-50 border border-blue-100 text-blue-700'
                        }`}>
                        {status === 'error' && <AlertCircle size={14} className="shrink-0" />}
                        {status === 'success' && <CheckCircle size={14} className="shrink-0" />}
                        {status === 'processing' && <Loader2 size={14} className="animate-spin shrink-0" />}
                        <span className="flex-1 text-xs font-medium">{statusMsg}</span>
                        {status !== 'processing' && (
                            <button onClick={() => { setStatus('idle'); setStatusMsg('') }} className="hover:opacity-70">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Generate button ──────────────────────────────────────────────── */}
                {isGenerating ? (
                    <button
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-all text-sm"
                    >
                        <X size={16} /> Cancel
                    </button>
                ) : (
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed text-sm"
                    >
                        <Download size={16} />
                        Generate & Download PDF
                    </button>
                )}

                {/* ── Tips ─────────────────────────────────────────────────────────── */}
                <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/40">
                    <p className="text-[11px] font-bold text-blue-700 mb-1.5">💡 Pro Tips</p>
                    <ul className="text-[11px] text-blue-600 space-y-1">
                        <li>• Be specific: topic, tone, audience, and key points</li>
                        <li>• For reports: mention sections you want (e.g. "Introduction, Findings, Conclusion")</li>
                        <li>• For invoices/letters: include real details like company name, amounts, dates</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}