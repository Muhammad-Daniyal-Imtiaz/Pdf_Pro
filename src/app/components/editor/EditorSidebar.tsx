// components/editor/EditorSidebar.tsx
'use client'

import React from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import {
    Type, Heading, List, Minus, Link, Image, Square,
    ChevronLeft, ChevronRight, Trash2, Layers, ArrowUp, ArrowDown, Upload
} from 'lucide-react'
import SocialIcons from './SocialIcons'
import LineControls from './LineControls'

const IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"


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
                                    label="H. Line"
                                    color="orange"
                                    onClick={() => addLine('horizontal')}
                                />
                                <ElementButton
                                    icon={<Minus size={18} className="rotate-90" />}
                                    label="V. Line"
                                    color="orange"
                                    onClick={() => addLine('vertical')}
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

                                {selectedElement.type === 'line' ? (
                                    <LineControls
                                        element={selectedElement}
                                        onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                                    />
                                ) : selectedElement.type === 'image' ? (
                                    <div className="space-y-4">
                                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const reader = new FileReader()
                                                        reader.onloadend = () => {
                                                            const result = reader.result as string
                                                            // Resize image to prevent massive payloads
                                                            const img = new window.Image()
                                                            img.onload = () => {
                                                                const MAX_DIM = 1200; // Limit max dimension
                                                                let width = img.width;
                                                                let height = img.height;

                                                                if (width > MAX_DIM || height > MAX_DIM) {
                                                                    if (width > height) {
                                                                        height = Math.round((height * MAX_DIM) / width);
                                                                        width = MAX_DIM;
                                                                    } else {
                                                                        width = Math.round((width * MAX_DIM) / height);
                                                                        height = MAX_DIM;
                                                                    }
                                                                }

                                                                const canvas = document.createElement('canvas');
                                                                canvas.width = width;
                                                                canvas.height = height;
                                                                const ctx = canvas.getContext('2d');
                                                                if (ctx) {
                                                                    ctx.drawImage(img, 0, 0, width, height);
                                                                    // Use JPEG for photos (0.8 quality) to save space, PNG for others if needed
                                                                    const mimeType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
                                                                    const quality = mimeType === 'image/jpeg' ? 0.8 : 1.0;
                                                                    const resizedDataUrl = canvas.toDataURL(mimeType, quality);

                                                                    // Calculate aspect ratio for the element
                                                                    const aspect = width / height
                                                                    const newHeight = selectedElement.style.width / aspect

                                                                    updateElement(selectedElement.id, {
                                                                        content: resizedDataUrl,
                                                                        style: {
                                                                            ...selectedElement.style,
                                                                            height: Math.round(newHeight)
                                                                        }
                                                                    })
                                                                }
                                                            }
                                                            img.src = result
                                                            // Temporary preview removed to prevent massive payload
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                                                <Upload size={24} />
                                                <span className="text-xs font-medium">Click to Upload Image</span>
                                                <span className="text-[10px] text-gray-400">Supports JPG, PNG</span>
                                            </div>
                                        </div>
                                        {selectedElement.content && (
                                            <div className="relative aspect-video bg-gray-100 rounded overflow-hidden border">
                                                <img
                                                    src={selectedElement.content}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                                <button
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 z-20"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        updateElement(selectedElement.id, { content: '' });
                                                    }}
                                                    title="Remove Image"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Normal Content Input */
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Content</label>
                                        <input
                                            type="text"
                                            value={selectedElement.content}
                                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                            className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                )}

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



                                {/* Style - Hide for Line/Social Icon but show for Image (border/radius/opacity) */}
                                {!['line', 'social-icon'].includes(selectedElement.type) && (
                                    <>
                                        {/* For Images/Containers/Text, show opacity and other styles */}
                                        {selectedElement.type !== 'image' && (
                                            <>
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
                                            </>
                                        )}

                                        {/* Common styling for anything "box-like" including images (borders, opacity) */}
                                        {['image', 'container'].includes(selectedElement.type) && (
                                            <div className="mt-2 space-y-2 border-t pt-2">
                                                <div>
                                                    <label className="text-xs text-gray-600 block mb-1">Opacity (%)</label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={(selectedElement.style.opacity || 1) * 100}
                                                        onChange={(e) => updateElementStyle(selectedElement.id, { opacity: Number(e.target.value) / 100 })}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-600 block mb-1">Radius</label>
                                                        <input
                                                            type="number"
                                                            value={selectedElement.style.borderRadius || 0}
                                                            onChange={(e) => updateElementStyle(selectedElement.id, { borderRadius: Number(e.target.value) })}
                                                            className="w-full p-2 text-sm border border-gray-200 rounded"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 block mb-1">Rotation</label>
                                                        <input
                                                            type="number"
                                                            value={selectedElement.style.rotation || 0}
                                                            onChange={(e) => updateElementStyle(selectedElement.id, { rotation: Number(e.target.value) })}
                                                            className="w-full p-2 text-sm border border-gray-200 rounded"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

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