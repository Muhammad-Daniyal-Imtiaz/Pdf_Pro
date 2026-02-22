// components/editor/EditorSidebar.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import {
    Type, Heading, Minus, Link, Image, Square,
    ChevronLeft, ChevronRight, Trash2, Layers, ArrowUp, ArrowDown, Upload,
    Check, X, Star, Heart, Scissors, Combine, Info, AlertCircle, Loader2
} from 'lucide-react'
import SocialIcons from './SocialIcons'
import LineControls from './LineControls'
import TextResizeModeControl from './TextResizeModeControl'
import AIContentGenerator from '../AIContentGenerator'
import { Sparkles, FileText as FileIcon } from 'lucide-react'

export default function EditorSidebar() {
    const {
        isSidebarCollapsed, toggleSidebar,
        addElement, addSocialIcon, addLine,
        selectedIds, pages,
        updateElement, updateElementStyle, removeElement, selectElement,
        bringToFront, sendToBack,
        splitElement, mergeElements,
        getLayoutContext, docTitle,
    } = useEditorStore()

    const [isExporting, setIsExporting] = useState(false)
    // ✅ FIXED: was using alert() for export errors — now inline state
    const [exportError, setExportError] = useState<string | null>(null)

    const handlePremiumExport = async () => {
        setIsExporting(true)
        setExportError(null)

        try {
            const rawContext = getLayoutContext()

            // Trim context before sending — remove base64 images to avoid huge payloads
            const trimmedContext = {
                pageCount: rawContext.pages?.length || 1,
                pages: rawContext.pages?.map((page: any) => ({
                    pageIndex: page.pageIndex,
                    elements: page.elements?.map((el: any) => ({
                        id: el.id,
                        type: el.type,
                        x: Math.round(el.x),
                        y: Math.round(el.y),
                        content: el.type === 'image' ? '[IMAGE]' : (el.content || '').substring(0, 200),
                        style: {
                            width: Math.round(el.style?.width || 0),
                            height: Math.round(el.style?.height || 0),
                            fontSize: el.style?.fontSize,
                            color: el.style?.color,
                            backgroundColor: el.type !== 'image' ? el.style?.backgroundColor : undefined,
                            zIndex: el.style?.zIndex,
                        }
                    }))
                }))
            }

            const response = await fetch('/api/export-mcp-canvas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: trimmedContext }),
            })

            const data = await response.json()

            if (data.success && data.content) {
                // ✅ Correct base64-to-blob conversion (not atob)
                const binaryString = atob(data.content)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
                const blob = new Blob([bytes], { type: 'application/pdf' })

                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${(docTitle || 'premium-document').toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
                a.click()
                URL.revokeObjectURL(url)
            } else {
                // ✅ FIXED: No more alert() — show error inline below the button
                setExportError(data.error || 'Export failed — please try again')
            }
        } catch (err: any) {
            console.error('Premium Export Error:', err)
            // ✅ FIXED: No more alert()
            setExportError('Failed to connect to export service. Check your network.')
        } finally {
            setIsExporting(false)
        }
    }

    // Find selected element across all pages
    const selectedElement = useMemo(() => {
        if (selectedIds.length === 0) return null
        const targetId = selectedIds[selectedIds.length - 1]
        for (const page of pages) {
            const found = page.elements.find(el => el.id === targetId)
            if (found) return found
        }
        return null
    }, [pages, selectedIds])

    // Auto-expand sidebar when an element is selected
    useEffect(() => {
        if (selectedElement && isSidebarCollapsed) toggleSidebar()
    }, [selectedElement, isSidebarCollapsed, toggleSidebar])

    return (
        <aside
            className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-[300px] opacity-100'}`}
            style={{ width: isSidebarCollapsed ? '0px' : '300px' }}
        >
            {/* Collapse toggle */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-8 top-6 w-8 h-8 bg-white border border-l-0 border-gray-200 rounded-r-md flex items-center justify-center shadow-sm z-50 hover:bg-gray-50 text-gray-500 transition-colors"
            >
                {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {!isSidebarCollapsed && (
                    <>
                        {/* ── Premium Export ─────────────────────────────────────────────── */}
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Sparkles size={11} className="text-violet-500" /> Premium Studio
                            </h3>

                            <button
                                onClick={handlePremiumExport}
                                disabled={isExporting}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white p-3.5 rounded-xl font-bold transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-3 active:scale-[0.97] group"
                            >
                                {isExporting ? (
                                    <><Loader2 size={16} className="animate-spin" /> Exporting…</>
                                ) : (
                                    <>
                                        <div className="p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                            <FileIcon size={16} />
                                        </div>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-sm">Premium AI Export</span>
                                            <span className="text-[10px] text-violet-100 font-normal">MCP-powered high-fidelity PDF</span>
                                        </div>
                                    </>
                                )}
                            </button>

                            {/* ✅ Inline export error (replaces alert()) */}
                            {exportError && (
                                <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                    <span className="flex-1">{exportError}</span>
                                    <button onClick={() => setExportError(null)} className="text-red-400 hover:text-red-600">
                                        <X size={11} />
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* ── AI Content Generator ─────────────────────────────────────── */}
                        <section>
                            <AIContentGenerator type="document" />
                        </section>

                        {/* ── Add Elements ─────────────────────────────────────────────── */}
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Add Elements
                            </h3>
                            <div className="grid grid-cols-4 gap-1.5">
                                <ElementButton icon={<Heading size={17} />} label="H1" onClick={() => addElement('heading')} />
                                <ElementButton icon={<Type size={17} />} label="Text" onClick={() => addElement('paragraph')} />
                                <ElementButton icon={<Image size={17} />} label="Img" onClick={() => addElement('image')} />
                                <ElementButton icon={<Square size={17} />} label="Shape" onClick={() => addElement('container')} />
                                <ElementButton icon={<Minus size={17} />} label="Line" onClick={() => addLine('horizontal')} />
                                <ElementButton icon={<Link size={17} />} label="Link" onClick={() => addElement('link')} />
                            </div>
                        </section>

                        {/* ── Quick Icons ───────────────────────────────────────────────── */}
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Quick Icons
                            </h3>
                            <div className="flex gap-2">
                                {[
                                    { icon: <Check size={18} />, type: 'check', cls: 'hover:bg-green-50 hover:text-green-600 hover:border-green-200' },
                                    { icon: <X size={18} />, type: 'x', cls: 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' },
                                    { icon: <Star size={18} />, type: 'star', cls: 'hover:bg-yellow-50 hover:text-yellow-500 hover:border-yellow-200' },
                                    { icon: <Heart size={18} />, type: 'heart', cls: 'hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200' },
                                ].map(({ icon, type, cls }) => (
                                    <button
                                        key={type}
                                        onClick={() => addSocialIcon(type)}
                                        className={`p-2 border border-gray-200 rounded-lg text-gray-500 transition-all ${cls}`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Social Icons ─────────────────────────────────────────────── */}
                        <section>
                            <SocialIcons onIconSelect={addSocialIcon} />
                        </section>

                        {/* ── Properties panel (when element selected) ─────────────────── */}
                        {selectedElement && (
                            <section
                                key={selectedElement.id}
                                className="border-t pt-5 space-y-4"
                            >
                                {/* Selection header */}
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200">
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest">
                                                {selectedElement.type}
                                            </span>
                                            {selectedIds.length > 1 && (
                                                <span className="bg-gray-700 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                                    +{selectedIds.length - 1}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            id: …{selectedElement.id.slice(-8)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeElement(selectedElement.id)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                        title="Delete element"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                {/* Layout & Position */}
                                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Position & Size</label>

                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Width */}
                                        <div>
                                            <label className="text-[10px] text-gray-400 block mb-1">Width (px)</label>
                                            <input
                                                type="number"
                                                value={typeof selectedElement.style?.width === 'number' ? Math.round(selectedElement.style.width) : ''}
                                                placeholder={selectedElement.style?.width === 'auto' ? 'Auto' : ''}
                                                onChange={e => updateElementStyle(selectedElement.id, { width: e.target.value ? Number(e.target.value) : 'auto' as any })}
                                                className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                            />
                                        </div>
                                        {/* Height */}
                                        <div>
                                            <label className="text-[10px] text-gray-400 block mb-1">Height (px)</label>
                                            <input
                                                type="number"
                                                value={typeof selectedElement.style?.height === 'number' ? Math.round(selectedElement.style.height) : ''}
                                                placeholder={selectedElement.style?.height === 'auto' ? 'Auto' : ''}
                                                onChange={e => updateElementStyle(selectedElement.id, { height: e.target.value ? Number(e.target.value) : 'auto' as any })}
                                                className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                            />
                                        </div>
                                    </div>

                                    {/* X/Y readout */}
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-100">
                                        <span>X: {Math.round(selectedElement.x)}px</span>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <span>Y: {Math.round(selectedElement.y)}px</span>
                                    </div>
                                </div>

                                {/* Content */}
                                {selectedElement.type === 'image' ? (
                                    <ImageUploader
                                        currentImage={selectedElement.content}
                                        onUpdate={(content) => {
                                            if (content.startsWith('data:image')) {
                                                const img = new window.Image()
                                                img.onload = () => {
                                                    const aspect = img.width / img.height
                                                    const newH = Number(selectedElement.style.width) / aspect
                                                    updateElement(selectedElement.id, { content })
                                                    updateElementStyle(selectedElement.id, { height: Math.round(newH) })
                                                }
                                                img.src = content
                                            } else {
                                                updateElement(selectedElement.id, { content: '' })
                                            }
                                        }}
                                    />
                                ) : selectedElement.type === 'line' ? (
                                    <LineControls element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />
                                ) : ['paragraph', 'heading', 'text', 'link'].includes(selectedElement.type) && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Content</label>
                                        <textarea
                                            rows={4}
                                            value={selectedElement.content || ''}
                                            onChange={e => updateElement(selectedElement.id, { content: e.target.value })}
                                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 resize-y bg-gray-50"
                                            placeholder="Type text content…"
                                        />
                                    </div>
                                )}

                                {/* Typography (text-type elements only) */}
                                {['paragraph', 'heading', 'text', 'link'].includes(selectedElement.type) && (
                                    <>
                                        <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Typography</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 block mb-1">Size (px)</label>
                                                    <input
                                                        type="number" min={7} max={72}
                                                        value={selectedElement.style.fontSize || 14}
                                                        onChange={e => updateElementStyle(selectedElement.id, { fontSize: Math.max(7, Math.min(72, Number(e.target.value))) })}
                                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 block mb-1">Weight</label>
                                                    <select
                                                        value={selectedElement.style.fontWeight || 400}
                                                        onChange={e => updateElementStyle(selectedElement.id, { fontWeight: Number(e.target.value) })}
                                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                                                    >
                                                        <option value={300}>Light</option>
                                                        <option value={400}>Regular</option>
                                                        <option value={500}>Medium</option>
                                                        <option value={600}>Semibold</option>
                                                        <option value={700}>Bold</option>
                                                        <option value={800}>Extra Bold</option>
                                                        <option value={900}>Black</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 block mb-1">Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedElement.style.color || '#000000'}
                                                            onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })}
                                                            className="w-8 h-8 p-0.5 border border-gray-200 rounded-lg cursor-pointer"
                                                        />
                                                        <span className="text-[10px] text-gray-500 font-mono">{selectedElement.style.color || '#000000'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 block mb-1">Align</label>
                                                    <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                        {(['left', 'center', 'right'] as const).map(align => (
                                                            <button
                                                                key={align}
                                                                onClick={() => updateElementStyle(selectedElement.id, { textAlign: align })}
                                                                className={`flex-1 py-1.5 text-xs transition-colors ${selectedElement.style.textAlign === align ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-400 hover:bg-gray-50'}`}
                                                            >
                                                                {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 block mb-1">Line Height</label>
                                                    <input
                                                        type="number" step={0.1} min={1} max={3}
                                                        value={selectedElement.style.lineHeight || 1.4}
                                                        onChange={e => updateElementStyle(selectedElement.id, { lineHeight: Number(e.target.value) })}
                                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 block mb-1">Padding (px)</label>
                                                    <input
                                                        type="number" min={0} max={40}
                                                        value={selectedElement.style.padding || 0}
                                                        onChange={e => updateElementStyle(selectedElement.id, { padding: Number(e.target.value) })}
                                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <TextResizeModeControl />
                                    </>
                                )}

                                {/* Appearance */}
                                <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Appearance</label>

                                    {/* Opacity */}
                                    <div>
                                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                            <span>Opacity</span>
                                            <span>{Math.round((selectedElement.style.opacity ?? 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min={0} max={100}
                                            value={(selectedElement.style.opacity ?? 1) * 100}
                                            onChange={e => updateElementStyle(selectedElement.id, { opacity: Number(e.target.value) / 100 })}
                                            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    {/* Background color */}
                                    {!['social-icon'].includes(selectedElement.type) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-gray-400 block mb-1">Background</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={selectedElement.style.backgroundColor === 'transparent' ? '#ffffff' : (selectedElement.style.backgroundColor || '#ffffff')}
                                                        onChange={e => updateElementStyle(selectedElement.id, { backgroundColor: e.target.value })}
                                                        className="w-8 h-8 p-0.5 border border-gray-200 rounded-lg cursor-pointer"
                                                    />
                                                    <button
                                                        onClick={() => updateElementStyle(selectedElement.id, { backgroundColor: 'transparent' })}
                                                        className="text-[10px] text-gray-400 hover:text-blue-600 underline"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 block mb-1">Border Radius</label>
                                                <input
                                                    type="number" min={0} max={100}
                                                    value={selectedElement.style.borderRadius || 0}
                                                    onChange={e => updateElementStyle(selectedElement.id, { borderRadius: Number(e.target.value) })}
                                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Layering */}
                                <div className="flex gap-2">
                                    <button onClick={() => bringToFront(selectedElement.id)}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                                        <ArrowUp size={13} /> Bring Front
                                    </button>
                                    <button onClick={() => sendToBack(selectedElement.id)}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                                        <ArrowDown size={13} /> Send Back
                                    </button>
                                </div>

                                {/* Precision tools */}
                                {(selectedIds.length > 1 || (selectedElement.originalItems?.length > 1)) && (
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Scissors size={13} className="text-blue-500" />
                                            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Precision Tools</label>
                                        </div>
                                        {selectedIds.length === 1 && selectedElement.originalItems?.length > 1 && (
                                            <button onClick={() => splitElement(selectedElement.id)}
                                                className="w-full py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 flex items-center justify-center gap-2 transition-all">
                                                <Scissors size={13} /> Split into Individual Items
                                            </button>
                                        )}
                                        {selectedIds.length > 1 && (
                                            <button onClick={() => mergeElements()}
                                                className="w-full py-2 bg-white hover:bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700 flex items-center justify-center gap-2 transition-all">
                                                <Combine size={13} /> Merge Selected
                                            </button>
                                        )}
                                        <p className="text-[10px] text-blue-500 flex gap-1.5">
                                            <Info size={11} className="shrink-0 mt-0.5" />
                                            Split breaks combined items. Merge groups selected items.
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Selection error fallback */}
                        {selectedIds.length > 0 && !selectedElement && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                                <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Selection Error</p>
                                <p className="text-[10px] text-red-500">Element not found in state.</p>
                                <button onClick={() => selectElement(null)}
                                    className="mt-2 text-[10px] underline text-red-700 font-bold">
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    )
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ElementButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-2.5 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-gray-500 transition-all group gap-1"
        >
            <div className="transition-colors">{icon}</div>
            <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
        </button>
    )
}

function ImageUploader({ currentImage, onUpdate }: { currentImage: string; onUpdate: (val: string) => void }) {
    return (
        <div className="space-y-3">
            <div className="relative p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
                <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onloadend = () => onUpdate(reader.result as string)
                        reader.readAsDataURL(file)
                    }}
                />
                <Upload size={22} className="mx-auto text-gray-400 group-hover:text-blue-500 mb-1.5 transition-colors" />
                <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">Upload Image</span>
            </div>
            {currentImage && (
                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img src={currentImage} alt="Preview" className="w-full h-full object-contain" />
                    <button
                        onClick={() => onUpdate('')}
                        className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow z-20 transition-colors"
                        title="Remove image"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            )}
        </div>
    )
}