'use client'

import React from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import { FileText, User, FileCheck } from 'lucide-react'

export default function EditorHeader() {
    const { activeTab, setTab } = useEditorStore()

    const tabs = [
        { id: 'document' as const, label: 'Document Editor', icon: FileText },
        { id: 'cv' as const, label: 'CV Builder', icon: User },
        { id: 'contracts' as const, label: 'Contracts', icon: FileCheck },
    ]

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">PDF Craft Pro</h1>

                <nav className="flex gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">v2.0</span>
            </div>
        </header>
    )
}