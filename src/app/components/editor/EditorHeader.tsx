// components/editor/EditorHeader.tsx
'use client'

import React from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import { FileText, User, FileCheck, Keyboard, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp'

export default function EditorHeader() {
    const { activeTab, setTab } = useEditorStore()
    const [showShortcuts, setShowShortcuts] = useState(false)

    const tabs = [
        { id: 'document' as const, label: 'Editor', icon: FileText, description: 'Drag-and-drop document editor' },
        { id: 'cv' as const, label: 'CV Builder', icon: User, description: 'AI-powered resume generator' },
        { id: 'contracts' as const, label: 'Contracts', icon: FileCheck, description: 'Contract & letter templates' },
    ]

    return (
        <>
            <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 justify-between shrink-0 z-30 shadow-sm">
                {/* Left: Logo + tabs */}
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <div className="leading-none">
                            <span className="text-sm font-black text-gray-800 tracking-tight">PDF Craft</span>
                            <span className="text-sm font-black text-blue-600 tracking-tight"> Pro</span>
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <nav className="flex gap-0.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id)}
                                    title={tab.description}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Right: shortcuts + version */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowShortcuts(true)}
                        title="Keyboard shortcuts (Ctrl+/)"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <Keyboard size={13} />
                        <span className="hidden sm:inline">Shortcuts</span>
                    </button>

                    <div className="h-4 w-px bg-gray-200" />

                    <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                        v3.0
                    </span>
                </div>
            </header>

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
            )}
        </>
    )
}