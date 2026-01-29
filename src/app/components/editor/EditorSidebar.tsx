
'use client'

import { useEditorStore, EditorElement } from '../../store/useEditorStore'
import { Type, Heading, List, Image as ImageIcon, Minus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide-react'

export default function EditorSidebar() {
    const {
        editMode, setEditMode,
        addElement,
        selectedId, elements, updateElementStyle
    } = useEditorStore()

    const selectedElement = elements.find((el: EditorElement) => el.id === selectedId)

    // Drag handler for sidebar items
    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/react-dnd-type', type)
        e.dataTransfer.effectAllowed = 'copy'
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
                                onClick={() => addElement('heading')}
                                className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex flex-col items-center gap-2 text-gray-600"
                            >
                                <Heading size={20} />
                                <span className="text-xs font-medium">Heading</span>
                            </button>
                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'paragraph')}
                                onClick={() => addElement('paragraph')}
                                className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex flex-col items-center gap-2 text-gray-600"
                            >
                                <Type size={20} />
                                <span className="text-xs font-medium">Paragraph</span>
                            </button>
                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'list')}
                                onClick={() => addElement('list')}
                                className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex flex-col items-center gap-2 text-gray-600"
                            >
                                <List size={20} />
                                <span className="text-xs font-medium">List</span>
                            </button>
                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'image')}
                                onClick={() => addElement('image')}
                                className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex flex-col items-center gap-2 text-gray-600"
                            >
                                <ImageIcon size={20} />
                                <span className="text-xs font-medium">Image</span>
                            </button>
                            <button
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'divider')}
                                onClick={() => addElement('divider')}
                                className="col-span-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex flex-col items-center gap-2 text-gray-600"
                            >
                                <Minus size={20} />
                                <span className="text-xs font-medium">Divider</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Style Controls */}
                    {selectedElement && (
                        <div className="p-6 bg-gray-50 flex-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Style Controls</h3>

                            <div className="space-y-4">
                                {/* Font Family */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Font</label>
                                    <select
                                        value={selectedElement.style.fontFamily}
                                        onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Inter">Inter</option>
                                    </select>
                                </div>

                                {/* Font Size & Weight */}
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Size ({selectedElement.style.fontSize}px)</label>
                                        <input
                                            type="range" min="8" max="72"
                                            value={selectedElement.style.fontSize}
                                            onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: Number(e.target.value) })}
                                            className="w-full accent-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={selectedElement.style.color}
                                            onChange={(e) => updateElementStyle(selectedElement.id, { color: e.target.value })}
                                            className="w-8 h-8 rounded border-0 cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-200">{selectedElement.style.color}</span>
                                    </div>
                                </div>

                                {/* Formatting Buttons */}
                                <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                    <button
                                        onClick={() => updateElementStyle(selectedElement.id, { fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                        className={`p-2 rounded hover:bg-gray-100 ${selectedElement.style.fontWeight === 'bold' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        <Bold size={16} />
                                    </button>
                                    <button
                                        onClick={() => updateElementStyle(selectedElement.id, { fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                        className={`p-2 rounded hover:bg-gray-100 ${selectedElement.style.fontStyle === 'italic' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        <Italic size={16} />
                                    </button>
                                    <button
                                        onClick={() => updateElementStyle(selectedElement.id, { textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline' })}
                                        className={`p-2 rounded hover:bg-gray-100 ${selectedElement.style.textDecoration === 'underline' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        <Underline size={16} />
                                    </button>
                                    <div className="w-[1px] bg-gray-200 mx-1" />
                                    <button
                                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'left' })}
                                        className={`p-2 rounded hover:bg-gray-100 ${selectedElement.style.textAlign === 'left' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        <AlignLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'center' })}
                                        className={`p-2 rounded hover:bg-gray-100 ${selectedElement.style.textAlign === 'center' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        <AlignCenter size={16} />
                                    </button>
                                    <button
                                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'right' })}
                                        className={`p-2 rounded hover:bg-gray-100 ${selectedElement.style.textAlign === 'right' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        <AlignRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </aside>
    )
}
