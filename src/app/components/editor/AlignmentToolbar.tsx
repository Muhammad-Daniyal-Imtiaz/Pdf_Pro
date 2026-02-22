// components/editor/AlignmentToolbar.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import { WYSIWYGValidator } from '@/app/lib/alignment-service'
import {
    AlignLeft, AlignCenter, AlignRight,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    MoreVertical, CheckCircle2, AlertCircle, Zap, X, ChevronDown
} from 'lucide-react'

export default function AlignmentToolbar() {
    const { selectedIds, pages, updateElement, alignElements, distributeElements } = useEditorStore()

    const [showAdvanced, setShowAdvanced] = useState(false)
    const [validation, setValidation] = useState<{
        isValid: boolean
        totalWarnings: number
        issues: Array<{ id: string; warnings: string[] }>
    } | null>(null)
    // ✅ FIXED: was using blocking alert() — replaced with inline panel state
    const [showValidationPanel, setShowValidationPanel] = useState(false)

    const selectedElements = useMemo(() => {
        const elements: any[] = []
        pages.forEach(page => {
            page.elements.forEach(el => {
                if (selectedIds.includes(el.id)) elements.push(el)
            })
        })
        return elements
    }, [pages, selectedIds])

    const isMultiSelected = selectedIds.length >= 2

    // Real-time validation (debounced 300ms)
    useEffect(() => {
        if (selectedElements.length === 0) { setValidation(null); return }
        const t = setTimeout(() => {
            const result = WYSIWYGValidator.validateDocument(selectedElements)
            setValidation({
                isValid: result.isValid,
                totalWarnings: result.totalWarnings,
                issues: (result.elementsWithIssues || []).map((e: any) => ({
                    id: e.id,
                    warnings: e.warnings || []
                }))
            })
        }, 300)
        return () => clearTimeout(t)
    }, [selectedElements])

    const handleAutoFix = () => {
        selectedElements.forEach(el => {
            const recommended = WYSIWYGValidator.recommendGridSnapping(el)
            updateElement(el.id, { x: recommended.x, y: recommended.y })
        })
    }

    // ✅ FIXED: Replaced blocking alert() with this function that sets panel state
    const handleValidateWYSIWYG = () => {
        const allElements: any[] = []
        pages.forEach(page => allElements.push(...page.elements))
        const result = WYSIWYGValidator.validateDocument(allElements)
        setValidation({
            isValid: result.isValid,
            totalWarnings: result.totalWarnings,
            issues: (result.elementsWithIssues || []).map((e: any) => ({
                id: e.id,
                warnings: e.warnings || []
            }))
        })
        setShowValidationPanel(true)
        setShowAdvanced(true)
    }

    if (!isMultiSelected) return null

    return (
        <div className="flex flex-col gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            {/* ── Live validation status badge ────────────────────────────────── */}
            {validation && !validation.isValid && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 text-xs">
                    <AlertCircle size={13} />
                    <span className="flex-1 font-medium">
                        {validation.totalWarnings} alignment issue{validation.totalWarnings > 1 ? 's' : ''} detected
                    </span>
                    <button
                        onClick={handleAutoFix}
                        className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded-md text-xs font-bold transition-colors"
                    >
                        Auto-Fix
                    </button>
                </div>
            )}
            {validation?.isValid && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 border border-green-200 text-green-800 text-xs font-medium">
                    <CheckCircle2 size={13} />
                    <span>Perfect alignment — PDF ready</span>
                </div>
            )}

            {/* ── Main toolbar ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-1 items-center">
                {/* Horizontal alignment */}
                <div className="flex gap-0.5 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    {([
                        { fn: 'left', icon: AlignLeft, title: 'Align Left' },
                        { fn: 'center', icon: AlignCenter, title: 'Align Center Horizontally' },
                        { fn: 'right', icon: AlignRight, title: 'Align Right' },
                    ] as const).map(({ fn, icon: Icon, title }) => (
                        <button
                            key={fn}
                            onClick={() => alignElements(fn)}
                            title={title}
                            className="p-1.5 rounded hover:bg-blue-100 hover:text-blue-700 text-gray-600 transition-colors"
                        >
                            <Icon size={15} />
                        </button>
                    ))}
                </div>

                {/* Vertical alignment */}
                <div className="flex gap-0.5 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    {([
                        { fn: 'top', icon: AlignVerticalJustifyStart, title: 'Align Top' },
                        { fn: 'middle', icon: AlignVerticalJustifyCenter, title: 'Align Middle Vertically' },
                        { fn: 'bottom', icon: AlignVerticalJustifyEnd, title: 'Align Bottom' },
                    ] as const).map(({ fn, icon: Icon, title }) => (
                        <button
                            key={fn}
                            onClick={() => alignElements(fn)}
                            title={title}
                            className="p-1.5 rounded hover:bg-blue-100 hover:text-blue-700 text-gray-600 transition-colors"
                        >
                            <Icon size={15} />
                        </button>
                    ))}
                </div>

                {/* Distribution (needs 3+) */}
                <div className="flex gap-0.5 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => distributeElements('horizontal')}
                        disabled={selectedIds.length < 3}
                        title="Distribute Evenly (Horizontal) — select 3+ elements"
                        className="px-2 py-1.5 rounded hover:bg-blue-100 hover:text-blue-700 text-gray-600 transition-colors disabled:opacity-30 text-xs font-bold"
                    >
                        H⇄
                    </button>
                    <button
                        onClick={() => distributeElements('vertical')}
                        disabled={selectedIds.length < 3}
                        title="Distribute Evenly (Vertical) — select 3+ elements"
                        className="px-2 py-1.5 rounded hover:bg-blue-100 hover:text-blue-700 text-gray-600 transition-colors disabled:opacity-30 text-xs font-bold"
                    >
                        V⇄
                    </button>
                </div>

                {/* Selection count */}
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100 px-2 py-1 rounded-full ml-1">
                    {selectedIds.length} selected
                </span>

                {/* Advanced toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`ml-auto p-1.5 rounded-lg transition-colors ${showAdvanced ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                    title="Advanced tools"
                >
                    <MoreVertical size={15} />
                </button>
            </div>

            {/* ── Advanced panel ───────────────────────────────────────────────── */}
            {showAdvanced && (
                <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => alignElements('baseline' as any)}
                            className="flex-1 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                            📐 Baseline Align
                        </button>
                        <button
                            onClick={handleValidateWYSIWYG}
                            className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <Zap size={12} /> Validate All
                            </span>
                        </button>
                    </div>

                    {/* ✅ NEW: Inline validation panel (replaces the old alert()) */}
                    {showValidationPanel && validation && (
                        <div className={`rounded-lg border p-3 text-xs ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 font-bold">
                                    {validation.isValid
                                        ? <><CheckCircle2 size={13} className="text-green-600" /> <span className="text-green-700">All elements valid — PDF-ready!</span></>
                                        : <><AlertCircle size={13} className="text-amber-600" /> <span className="text-amber-700">{validation.totalWarnings} issue{validation.totalWarnings > 1 ? 's' : ''} found</span></>
                                    }
                                </div>
                                <button onClick={() => setShowValidationPanel(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={12} />
                                </button>
                            </div>
                            {!validation.isValid && validation.issues.length > 0 && (
                                <ul className="space-y-1 max-h-32 overflow-auto">
                                    {validation.issues.slice(0, 8).map(issue => (
                                        <li key={issue.id} className="text-amber-700">
                                            <span className="font-mono text-[9px] text-amber-500">{issue.id.slice(-8)}:</span>{' '}
                                            {issue.warnings.join(', ')}
                                        </li>
                                    ))}
                                    {validation.issues.length > 8 && (
                                        <li className="text-amber-500 font-semibold">…and {validation.issues.length - 8} more</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            { label: 'Selected', value: selectedIds.length, color: 'text-blue-600' },
                            { label: 'Alignment', value: validation?.isValid ? '✓ OK' : `${validation?.totalWarnings ?? '?'} ⚠`, color: validation?.isValid ? 'text-green-600' : 'text-amber-600' },
                            { label: 'Icons', value: selectedElements.filter(e => e.type === 'social-icon').length, color: 'text-purple-600' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        <strong>Tip:</strong> Use Baseline Align for text + icon pairs. Hold Shift to move by 10px. Select 3+ elements to distribute evenly.
                    </p>
                </div>
            )}
        </div>
    )
}