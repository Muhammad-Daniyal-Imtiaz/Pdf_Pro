'use client'

import { useEditorStore, EditorElement } from '@/app/store/useEditorStore'
import { Type, Heading, List, Image as ImageIcon, Minus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Sparkles, Trash2, Copy, Layers } from 'lucide-react'

export default function EditorSidebar() {
    const {
        editMode,
        setEditMode,
        addElement,
        selectedId,
        elements,
        updateElementStyle,
        removeElement,
        raiseElement,
        lowerElement,
        sendToBack,
        bringToFront
    } = useEditorStore()

    const selectedElement = elements.find((el: EditorElement) => el.id === selectedId)

    // Drag handler for sidebar items
    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/react-dnd-type', type)
        e.dataTransfer.effectAllowed = 'copy'
    }

    const updateStyle = (key: keyof typeof selectedElement.style, value: any) => {
        if (!selectedId) return
        updateElementStyle(selectedId, { [key]: value })
    }

    return (
        <aside className="w-80 bg-white border-r border-gray-200 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar flex flex-col">
            {/* 1. Edit Mode Toggle */}
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Edit Mode</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setEditMode('manual')}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${editMode === 'manual'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-200 text-gray-600'
                            }`}
                    >
                        <div className={`w-4 h-4 rounded-full border-4 ${editMode === 'manual' ? 'border-blue-500' : 'border-gray-300'}`} />
                        <span className="font-medium">Manual Editing</span>
                    </button>
                    <button
                        onClick={() => setEditMode('ai')}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${editMode === 'ai'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-200 text-gray-600'
                            }`}
                    >
                        <div className={`w-4 h-4 rounded-full border-4 ${editMode === 'ai' ? 'border-purple-500' : 'border-gray-300'}`} />
                        <div className="flex items-center gap-2">
                            <span className="font-medium">AI Generation</span>
                            <Sparkles size={14} className={editMode === 'ai' ? 'text-purple-500' : 'text-gray-400'} />
                        </div>
                    </button>
                </div>
            </div>

            {editMode === 'ai' ? (
                <div className="p-6">
                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4">AI Generator</h3>
                    <p className="text-sm text-gray-500 mb-4">Describe what you want to create.</p>
                    <textarea
                        className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="E.g. Create a project proposal for a new mobile app..."
                    />
                    <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                        <Sparkles size={16} />
                        Generate Content
                    </button>
                </div>
            ) : (
                <>
                    {/* 2. Add Elements */}
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Add Elements</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'heading')}
                                className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            >
                                <Heading size={16} className="text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">Heading</span>
                            </button>

                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'paragraph')}
                                className="flex items-center justify-center gap-2 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                            >
                                <Type size={16} className="text-green-600" />
                                <span className="text-xs font-medium text-green-700">Text</span>
                            </button>

                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'list')}
                                className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                            >
                                <List size={16} className="text-purple-600" />
                                <span className="text-xs font-medium text-purple-700">List</span>
                            </button>

                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'divider')}
                                className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                            >
                                <Minus size={16} className="text-gray-600" />
                                <span className="text-xs font-medium text-gray-700">Divider</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Style & Layer Controls */}
                    {selectedElement && (
                        <div className="p-6 bg-gray-50 flex-1 space-y-6">
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

                            {/* Typography Controls */}
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
                                        className={`flex-1 p-2 rounded text-sm font-bold transition-all ${
                                            selectedElement.style.fontWeight === '700'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        <Bold size={14} className="mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => updateStyle('fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic')}
                                        className={`flex-1 p-2 rounded text-sm font-italic transition-all ${
                                            selectedElement.style.fontStyle === 'italic'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        <Italic size={14} className="mx-auto" />
                                    </button>
                                </div>

                                {/* Text Alignment */}
                                <div className="flex gap-2 mb-3">
                                    {(['left', 'center', 'right'] as const).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => updateStyle('textAlign', align)}
                                            className={`flex-1 p-2 rounded text-sm transition-all ${
                                                selectedElement.style.textAlign === align
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            }`}
                                        >
                                            {align === 'left' && <AlignLeft size={14} className="mx-auto" />}
                                            {align === 'center' && <AlignCenter size={14} className="mx-auto" />}
                                            {align === 'right' && <AlignRight size={14} className="mx-auto" />}
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
                                            className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                                        />
                                        <span className="text-xs font-mono text-gray-600">{selectedElement.style.color}</span>
                                    </div>
                                </div>
                            </div>

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
                                    >
                                        Front
                                    </button>
                                    <button
                                        onClick={() => raiseElement(selectedId!)}
                                        className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                                    >
                                        Raise
                                    </button>
                                    <button
                                        onClick={() => lowerElement(selectedId!)}
                                        className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                                    >
                                        Lower
                                    </button>
                                    <button
                                        onClick={() => sendToBack(selectedId!)}
                                        className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
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
                        </div>
                    )}
                </>
            )}
        </aside>
    )
}
