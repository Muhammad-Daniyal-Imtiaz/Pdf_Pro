'use client'

import { useState, useEffect } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
// FIX: Use 'import type' to resolve Turbopack type resolution errors
import type { EditorElement } from '@/app/store/useEditorStore'
import { Type, Heading, List, Minus, ChevronLeft, ChevronRight, Settings, Grid, Monitor, Link, Phone, Share2, Layers, Trash2 } from 'lucide-react'
import SocialIcons from './SocialIcons'
import LineControls from './LineControls'
import LinkControls from './LinkControls'

export default function EditorSidebar() {
    const {
        editMode,
        setEditMode,
        addElement,
        addSocialIcon,
        addLine,
        selectedId,
        elements,
        updateElementStyle,
        updateElement,
        removeElement,
        raiseElement,
        lowerElement,
        sendToBack,
        bringToFront,
        isSidebarCollapsed,
        toggleSidebar
    } = useEditorStore()

    const selectedElement = elements.find((el: EditorElement) => el.id === selectedId)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/react-dnd-type', type)
        e.dataTransfer.effectAllowed = 'copy'
    }

    const updateStyle = (key: keyof EditorElement['style'], value: any) => {
        if (!selectedId || !selectedElement) return
        updateElementStyle(selectedId, { [key]: value })
    }

    if (!mounted) return null

    return (
        <aside
            className={`
                bg-white border-r border-gray-200 h-[calc(100vh-64px)] 
                flex flex-col transition-all duration-300 ease-in-out relative
                ${isSidebarCollapsed ? 'w-[70px]' : 'w-80'}
            `}
        >
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-gray-50 text-gray-500"
            >
                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Edit Mode Toggle */}
            <div className={`p-4 border-b border-gray-100 ${isSidebarCollapsed ? 'items-center' : ''}`}>
                {!isSidebarCollapsed && (
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Edit Mode</h3>
                )}
                <div className={`flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : ''}`}>
                    <button
                        onClick={() => setEditMode('manual')}
                        title="Manual Editing"
                        className={`
                            flex items-center gap-3 rounded-xl border transition-all 
                            ${isSidebarCollapsed ? 'p-3 justify-center w-10 h-10' : 'p-3 w-full text-left'}
                            ${editMode === 'manual'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-200 text-gray-600'
                            }
                        `}
                    >
                        {isSidebarCollapsed ? (
                            <Grid size={18} />
                        ) : (
                            <>
                                <div className={`w-4 h-4 rounded-full border-4 ${editMode === 'manual' ? 'border-blue-500' : 'border-gray-300'}`} />
                                <span className="font-medium">Manual</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setEditMode('ai')}
                        title="AI Generation"
                        className={`
                            flex items-center gap-3 rounded-xl border transition-all
                            ${isSidebarCollapsed ? 'p-3 justify-center w-10 h-10' : 'p-3 w-full text-left'}
                            ${editMode === 'ai'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-200 text-gray-600'
                            }
                        `}
                    >
                        {isSidebarCollapsed ? (
                            <div style={{ color: '#9333ea' }} className="animate-pulse w-4 h-4 rounded-full bg-gray-300 border-4 border-purple-400 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-purple-600">AI</span>
                            </div>
                        ) : (
                            <>
                                <div className={`w-4 h-4 rounded-full border-4 ${editMode === 'ai' ? 'border-purple-500' : 'border-gray-300'}`} />
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">AI Gen</span>
                                </div>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {editMode === 'ai' ? (
                    <div className="p-4">
                        {!isSidebarCollapsed ? (
                            <>
                                <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4">AI Generator</h3>
                                <p className="text-sm text-gray-500 mb-4">Describe what you want to create.</p>
                                <textarea
                                    className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="E.g. Create a project proposal..."
                                />
                                <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                                    Generate
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-gray-400 text-xs">
                                <span>AI</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Add Elements */}
                        <div className="p-4 border-b border-gray-100">
                            {!isSidebarCollapsed && (
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Elements</h3>
                            )}
                            <div className={`grid gap-3 ${isSidebarCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                <button
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'heading')}
                                    title="Heading"
                                    className={`
                                        flex items-center gap-2 border rounded-lg transition-colors
                                        ${isSidebarCollapsed ? 'justify-center p-2' : 'p-3 bg-blue-50 hover:bg-blue-100 border-blue-200'}
                                    `}
                                >
                                    <Heading size={16} className="text-blue-600" />
                                    {!isSidebarCollapsed && <span className="text-xs font-medium text-blue-700">Heading</span>}
                                </button>

                                <button
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'paragraph')}
                                    title="Text Paragraph"
                                    className={`
                                        flex items-center gap-2 border rounded-lg transition-colors
                                        ${isSidebarCollapsed ? 'justify-center p-2' : 'p-3 bg-green-50 hover:bg-green-100 border-green-200'}
                                    `}
                                >
                                    <Type size={16} className="text-green-600" />
                                    {!isSidebarCollapsed && <span className="text-xs font-medium text-green-700">Text</span>}
                                </button>

                                <button
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'list')}
                                    title="List"
                                    className={`
                                        flex items-center gap-2 border rounded-lg transition-colors
                                        ${isSidebarCollapsed ? 'justify-center p-2' : 'p-3 bg-purple-50 hover:bg-purple-100 border-purple-200'}
                                    `}
                                >
                                    <List size={16} className="text-purple-600" />
                                    {!isSidebarCollapsed && <span className="text-xs font-medium text-purple-700">List</span>}
                                </button>

                                <button
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'divider')}
                                    title="Divider"
                                    className={`
                                        flex items-center gap-2 border rounded-lg transition-colors
                                        ${isSidebarCollapsed ? 'justify-center p-2' : 'p-3 bg-gray-50 hover:bg-gray-100 border-gray-200'}
                                    `}
                                >
                                    <Minus size={16} className="text-gray-600" />
                                    {!isSidebarCollapsed && <span className="text-xs font-medium text-gray-700">Divider</span>}
                                </button>
                            </div>
                        </div>

                        {/* Social Icons Section */}
                        <div className="p-4 border-b border-gray-100">
                            {!isSidebarCollapsed && <SocialIcons onIconSelect={addSocialIcon} />}
                        </div>

                        {/* Style & Layer Controls */}
                        {selectedElement && (
                            <div className={`bg-gray-50 flex-1 space-y-6 ${isSidebarCollapsed ? 'p-2' : 'p-6'}`}>
                                {!isSidebarCollapsed && (
                                    <>
                                        {/* Element Info */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Element Properties</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Position:</span>
                                                    <span className="text-gray-900 font-mono">{Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Size:</span>
                                                    <span className="text-gray-900 font-mono">{Math.round(selectedElement.style.width)} × {Math.round(selectedElement.style.height)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Element-specific Controls */}
                                        {selectedElement.type === 'line' && (
                                            <LineControls
                                                element={selectedElement}
                                                onUpdate={(updates) => updateElement(selectedId!, updates)}
                                            />
                                        )}

                                        {selectedElement.type === 'link' && (
                                            <LinkControls
                                                element={selectedElement}
                                                onUpdate={(updates) => updateElement(selectedId!, updates)}
                                            />
                                        )}

                                        {selectedElement.type === 'social-icon' && (
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <Share2 size={16} /> Icon Properties
                                                </h4>

                                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                                    {/* Label Controls */}
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-semibold text-gray-700">Show Label</label>
                                                        <button
                                                            onClick={() => updateElement(selectedId!, { showLabel: !selectedElement.showLabel })}
                                                            className={`w-10 h-5 rounded-full relative transition-colors ${selectedElement.showLabel ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                        >
                                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedElement.showLabel ? 'left-6' : 'left-1'}`} />
                                                        </button>
                                                    </div>

                                                    {selectedElement.showLabel && (
                                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Label Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={selectedElement.content || ''}
                                                                    onChange={(e) => updateElement(selectedId!, { content: e.target.value })}
                                                                    className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="e.g. LinkedIn"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Label Position</label>
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {['top', 'bottom', 'left', 'right'].map((pos) => (
                                                                        <button
                                                                            key={pos}
                                                                            onClick={() => updateElement(selectedId!, { labelPosition: pos as any })}
                                                                            className={`p-1.5 rounded border text-[10px] capitalize transition-all ${selectedElement.labelPosition === pos ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                                                        >
                                                                            {pos}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="h-px bg-gray-100 my-1" />

                                                    {/* Resize & Lock */}
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-semibold text-gray-700">Lock Aspect Ratio</label>
                                                        <button
                                                            onClick={() => updateStyle('lockAspectRatio', !selectedElement.style.lockAspectRatio)}
                                                            className={`w-10 h-5 rounded-full relative transition-colors ${selectedElement.style.lockAspectRatio ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                        >
                                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedElement.style.lockAspectRatio ? 'left-6' : 'left-1'}`} />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Icon Size</label>
                                                                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{selectedElement.style.fontSize || 24}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="12"
                                                                max="120"
                                                                value={selectedElement.style.fontSize || 24}
                                                                onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rotation</label>
                                                                <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{selectedElement.style.rotation || 0}°</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="360"
                                                                value={selectedElement.style.rotation || 0}
                                                                onChange={(e) => updateStyle('rotation', parseInt(e.target.value))}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Typography Controls - Hide for non-text elements */}
                                        {!['line', 'social-icon'].includes(selectedElement.type) && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Type size={16} />
                                                    Typography
                                                </h4>

                                                {/* Font Family */}
                                                <div className="mb-3">
                                                    <label className="block text-xs font-medium text-gray-600 mb-2">Font Family</label>
                                                    <select
                                                        value={selectedElement.style.fontFamily}
                                                        onChange={(e) => updateStyle('fontFamily', e.target.value)}
                                                        className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="Inter, sans-serif">Inter</option>
                                                        <option value="Roboto, sans-serif">Roboto</option>
                                                        <option value="Georgia, serif">Georgia</option>
                                                        <option value="'Courier New', monospace">Courier New</option>
                                                        <option value="Arial, sans-serif">Arial</option>
                                                        <option value="Times New Roman, serif">Times New Roman</option>
                                                    </select>
                                                </div>

                                                {/* Font Size */}
                                                <div className="mb-3">
                                                    <label className="block text-xs font-medium text-gray-600 mb-2">
                                                        Font Size: {selectedElement.style.fontSize}px
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="8"
                                                        max="72"
                                                        value={selectedElement.style.fontSize}
                                                        onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                                                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                </div>

                                                {/* Font Weight */}
                                                <div className="flex gap-2 mb-3">
                                                    <button
                                                        onClick={() => updateStyle('fontWeight', selectedElement.style.fontWeight === '700' ? '400' : '700')}
                                                        className={`flex-1 p-2 rounded text-sm font-bold transition-all ${selectedElement.style.fontWeight === '700'
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        <div className="w-4 h-4 border-4 border-current bg-current rounded-sm" style={{ borderWidth: '2px', borderColor: selectedElement.style.fontWeight === '700' ? '#3B82F6' : '#D1D5DB' }}></div>
                                                    </button>
                                                    <button
                                                        onClick={() => updateStyle('fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic')}
                                                        className={`flex-1 p-2 rounded text-sm font-italic transition-all ${selectedElement.style.fontStyle === 'italic'
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        <div className="w-4 h-4 border-4 border-current bg-current rounded-sm" style={{ borderWidth: '2px', borderColor: selectedElement.style.fontStyle === 'italic' ? '#3B82F6' : '#D1D5DB' }}></div>
                                                    </button>
                                                </div>

                                                {/* Text Alignment */}
                                                <div className="flex gap-2 mb-3">
                                                    {(['left', 'center', 'right'] as const).map((align) => (
                                                        <button
                                                            key={align}
                                                            onClick={() => updateStyle('textAlign', align)}
                                                            className={`flex-1 p-2 rounded text-sm transition-all ${selectedElement.style.textAlign === align
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            {align === 'left' && <div className="w-3 h-3 bg-gray-400 rounded-sm" />}
                                                            {align === 'center' && <div className="w-3 h-3 bg-gray-400 rounded-full mx-auto" />}
                                                            {align === 'right' && <div className="w-3 h-3 bg-gray-400 rounded-sm ml-auto" />}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Color */}
                                                <div className="mb-3">
                                                    <label className="block text-xs font-medium text-gray-600 mb-2">Text Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedElement.style.color}
                                                            onChange={(e) => updateStyle('color', e.target.value)}
                                                            className="w-12 h-10 p-1 rounded cursor-pointer border border-gray-300"
                                                        />
                                                        <span className="text-xs font-mono text-gray-600">{selectedElement.style.color}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Layer Controls */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Layers size={16} />
                                                Layers
                                            </h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => bringToFront(selectedId!)}
                                                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                                                    title="Bring to Front"
                                                >
                                                    Front
                                                </button>
                                                <button
                                                    onClick={() => raiseElement(selectedId!)}
                                                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                                                    title="Raise Layer"
                                                >
                                                    Up
                                                </button>
                                                <button
                                                    onClick={() => lowerElement(selectedId!)}
                                                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                                                    title="Lower Layer"
                                                >
                                                    Down
                                                </button>
                                                <button
                                                    onClick={() => sendToBack(selectedId!)}
                                                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                                                    title="Send to Back"
                                                >
                                                    Back
                                                </button>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => removeElement(selectedId!)}
                                            className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Delete Element
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    )
}