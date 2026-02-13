'use client'

import React from 'react'
import { A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'

interface PageContainerProps {
    pageIndex: number
    children: React.ReactNode
    showGrid: boolean
    onRemove?: () => void
    elementsCount: number
    zoom: number
}

export default function PageContainer({
    pageIndex,
    children,
    showGrid,
    onRemove,
    elementsCount,
    zoom
}: PageContainerProps) {
    return (
        <div className="relative group/page">
            {/* Page Header */}
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-between px-4 py-2 bg-white rounded-t-lg shadow-sm border border-gray-100 opacity-0 group-hover/page:opacity-100 transition-opacity z-30">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Page {pageIndex + 1}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{elementsCount} ELEMENTS</span>
                </div>
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove Page"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    </button>
                )}
            </div>

            {/* Page Content */}
            <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white overflow-hidden" style={{ width: A4_WIDTH, height: A4_HEIGHT }}>
                {showGrid && (
                    <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            backgroundImage: `linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                            opacity: 0.5
                        }}
                    />
                )}

                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </div>

            {/* Page Footer shadow effect */}
            <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/5 blur-xl -z-10 rounded-full" />
        </div>
    )
}
