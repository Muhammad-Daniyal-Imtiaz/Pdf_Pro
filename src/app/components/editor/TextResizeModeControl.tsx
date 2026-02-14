/**
 * components/editor/TextResizeModeControl.tsx
 * UI Control for switching text expansion behaviors (Canva/Figma style)
 */
'use client'

import React from 'react'
import { useEditorStore, TextResizeMode } from '@/app/store/useEditorStore'
import { Maximize, Minimize, Maximize2, Lock, Info } from 'lucide-react'

export default function TextResizeModeControl() {
    const { selectedIds, pages, setElementResizeMode } = useEditorStore()

    // Only show if exactly one element is selected
    if (selectedIds.length !== 1) return null

    // Find the selected element
    const element = pages.flatMap(p => p.elements).find(el => selectedIds.includes(el.id))
    if (!element) return null

    // Only relevant for text-based elements
    const isTextElement = ['paragraph', 'heading', 'text', 'link'].includes(element.type)
    if (!isTextElement) return null

    const currentMode = element.style.resizeMode || 'auto-height'

    const modes = [
        {
            value: 'fixed',
            label: 'Fixed',
            icon: Lock,
            desc: 'Fixed size. Shows a red alert if text overflows.'
        },
        {
            value: 'auto-width',
            label: 'Auto Width',
            icon: Maximize2,
            desc: 'Grows horizontally only. Never wraps.'
        },
        {
            value: 'auto-height',
            label: 'Auto Height',
            icon: Maximize,
            desc: 'Grows vertically. Wraps at the fixed width.'
        },
        {
            value: 'auto-both',
            label: 'Auto Both',
            icon: Maximize2,
            desc: 'Grows both directions to fit text perfectly.'
        },
    ]

    return (
        <div className="space-y-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 mt-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resize Mode</label>
                <div className="group relative">
                    <Info size={12} className="text-gray-300 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100]">
                        Controls how this container behaves when you type or edit content.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {modes.map((mode) => {
                    const Icon = mode.icon
                    const isActive = currentMode === mode.value
                    return (
                        <button
                            key={mode.value}
                            onClick={() => setElementResizeMode(element.id, mode.value as TextResizeMode)}
                            className={`
                                flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200
                                ${isActive
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500'
                                }
                            `}
                        >
                            <Icon size={16} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{mode.label}</span>
                        </button>
                    )
                })}
            </div>

            <p className="text-[9px] text-gray-400 italic leading-snug">
                {modes.find(m => m.value === currentMode)?.desc}
            </p>
        </div>
    )
}
