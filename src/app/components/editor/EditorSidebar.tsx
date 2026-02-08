// components/editor/EditorSidebar.tsx
'use client'

import React from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import {
    Type, Heading, List, Minus, Link, Image, Square,
    ChevronLeft, ChevronRight, Trash2, Layers, ArrowUp, ArrowDown
} from 'lucide-react'
import SocialIcons from './SocialIcons'

export default function EditorSidebar() {
    const {
        isSidebarCollapsed,
        toggleSidebar,
        addElement,
        addSocialIcon,
        addLine,
        selectedIds,
        pages,
        updateElement,
        updateElementStyle,
        removeElement,
        bringToFront,
        sendToBack,
    } = useEditorStore()

    // Find the selected element across all pages
    const selectedElement = pages.flatMap(page => page.elements).find(el => selectedIds.includes(el.id))

    return (
        <aside
            className={`
        bg-white border-r border-gray-200 h-full 
        flex flex-col transition-all duration-300 ease-in-out relative
        ${isSidebarCollapsed ? 'w-[60px]' : 'w-[280px]'}
      `}
        >
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-gray-50 text-gray-500"
            >
                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className="flex-1 overflow-y-auto p-4">
                {!isSidebarCollapsed ? (
                    <>
                        {/* Elements Section */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Elements
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <ElementButton
                                    icon={<Heading size={18} />}
                                    label="Heading"
                                    color="blue"
                                    onClick={() => addElement('heading')}
                                />
                                <ElementButton
                                    icon={<Type size={18} />}
                                    label="Text"
                                    color="green"
                                    onClick={() => addElement('paragraph')}
                                />
                                <ElementButton
                                    icon={<Link size={18} />}
                                    label="Link"
                                    color="indigo"
                                    onClick={() => addElement('link')}
                                />
                                <ElementButton
                                    icon={<Image size={18} />}
                                    label="Image"
                                    color="pink"
                                    onClick={() => addElement('image')}
                                />
                                <ElementButton
                                    icon={<Square size={18} />}
                                    label="Box"
                                    color="gray"
                                    onClick={() => addElement('container')}
                                />
                                <ElementButton
                                    icon={<Minus size={18} />}
                                    label="Line"
                                    color="orange"
                                    onClick={() => addLine('horizontal')}
                                />
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="mb-6">
                            <SocialIcons onIconSelect={addSocialIcon} />
                        </div>

                        {/* Properties Panel */}
                        {selectedElement && (
                            <div className="border-t pt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Properties
                                    </h3>
                                    <button
                                        onClick={() => removeElement(selectedElement.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">Content</label>
                                    <input
                                        type="text"
                                        value={selectedElement.content}
                                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                        className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* Position */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">X (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.x}
                                            onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                                            className="w-full p-2 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Y (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.y}
                                            onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                                            className="w-full p-2 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>

                                {/* Size */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Width (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.style.width}
                                            onChange={(e) => updateElementStyle(selectedElement.id, { width: Number(e.target.value) })}
                                            className="w-full p-2 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Height (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.style.height}
                                            onChange={(e) => updateElementStyle(selectedElement.id, { height: Number(e.target.value) })}
                                            className="w-full p-2 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>

                                {/* Style */}
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">Font Size (px)</label>
                                    <input
                                        type="number"
                                        value={selectedElement.style.fontSize || 16}
                                        onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: Number(e.target.value) })}
                                        className="w-full p-2 text-sm border border-gray-200 rounded"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={selectedElement.style.color || '#000000'}
                                            onChange={(e) => updateElementStyle(selectedElement.id, { color: e.target.value })}
                                            className="w-10 h-9 p-1 border border-gray-200 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={selectedElement.style.color || '#000000'}
                                            onChange={(e) => updateElementStyle(selectedElement.id, { color: e.target.value })}
                                            className="flex-1 p-2 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>

                                {/* Layer Controls */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => bringToFront(selectedElement.id)}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                        <ArrowUp size={12} /> Front
                                    </button>
                                    <button
                                        onClick={() => sendToBack(selectedElement.id)}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                        <ArrowDown size={12} /> Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <button onClick={() => addElement('heading')} className="p-2 hover:bg-gray-100 rounded text-blue-600">
                            <Heading size={20} />
                        </button>
                        <button onClick={() => addElement('paragraph')} className="p-2 hover:bg-gray-100 rounded text-green-600">
                            <Type size={20} />
                        </button>
                        <button onClick={() => addSocialIcon('linkedin')} className="p-2 hover:bg-gray-100 rounded text-purple-600">
                            <Layers size={20} />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    )
}

function ElementButton({ icon, label, color, onClick }: {
    icon: React.ReactNode
    label: string
    color: string
    onClick: () => void
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
        pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
        gray: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    }

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors ${colorClasses[color]}`}
        >
            {icon}
            <span className="text-[10px] font-medium mt-1">{label}</span>
        </button>
    )
}