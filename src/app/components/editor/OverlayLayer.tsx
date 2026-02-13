'use client'

import React from 'react'
import { EditorElement } from '@/app/store/useEditorStore'

interface OverlayLayerProps {
    elements: EditorElement[]
    selectedIds: string[]
    isMultiSelected?: boolean
    onResizeStart?: (id: string, handle: string, e: React.MouseEvent) => void
}

export default function OverlayLayer({
    elements,
    selectedIds,
    onResizeStart
}: OverlayLayerProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-40">
            {elements.map((el) => {
                const isSelected = selectedIds.includes(el.id)
                if (!isSelected) return null

                const rect = {
                    left: Math.round(el.x),
                    top: Math.round(el.y),
                    width: Math.round(el.style.width),
                    height: Math.round(el.style.height),
                    rotation: el.style.rotation || 0
                }

                const handles = ['nw', 'ne', 'sw', 'se']

                return (
                    <div
                        key={`overlay-${el.id}`}
                        style={{
                            position: 'absolute',
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height,
                            transform: `rotate(${rect.rotation}deg)`,
                            transformOrigin: 'top left',
                        }}
                    >
                        {/* Selection Ring */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                inset: -2,
                                border: '2px solid #3b82f6',
                                borderRadius: `${(el.style.borderRadius || 0) + 2}px`,
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.5)'
                            }}
                        />

                        {/* Type Label */}
                        <div className="absolute -top-6 left-0 bg-blue-600 text-[9px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">
                            {el.type}
                        </div>

                        {/* Resize Handles */}
                        {handles.map((h) => (
                            <div
                                key={h}
                                className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-full pointer-events-auto hover:scale-125 transition-transform z-50 shadow-sm"
                                style={{
                                    ...(h.includes('n') ? { top: -5 } : { bottom: -5 }),
                                    ...(h.includes('w') ? { left: -5 } : { right: -5 }),
                                    cursor: `${h}-resize`
                                }}
                                onMouseDown={(e) => onResizeStart?.(el.id, h, e)}
                            />
                        ))}
                    </div>
                )
            })}
        </div>
    )
}
