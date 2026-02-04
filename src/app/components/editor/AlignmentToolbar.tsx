'use client'

import React, { useState, useEffect } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import { AlignmentEngine, WYSIWYGValidator } from '@/app/lib/alignment-service'
import { CoordinateSystem } from '@/app/lib/geometry-engine/CoordinateSystem'
import {
    AlignLeft, AlignCenter, AlignRight,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    AlignJustify, MoreVertical, CheckCircle2, AlertCircle, Zap
} from 'lucide-react'

export default function AlignmentToolbar() {
    const {
        selectedIds,
        elements,
        updateElement,
        alignElements,
        distributeElements
    } = useEditorStore()

    const [showAdvanced, setShowAdvanced] = useState(false)
    const [validation, setValidation] = useState<ReturnType<typeof WYSIWYGValidator.validateDocument> | null>(null)

    const selectedElements = elements.filter(el => selectedIds.includes(el.id))
    const isMultiSelected = selectedIds.length >= 2

    // Real-time validation
    useEffect(() => {
        if (selectedElements.length > 0) {
            setValidation(WYSIWYGValidator.validateDocument(selectedElements))
        }
    }, [selectedElements])

    const handleAlign = (direction: Parameters<typeof alignElements>[0]) => {
        alignElements(direction)
    }

    const handleDistribute = (axis: 'horizontal' | 'vertical') => {
        distributeElements(axis)
    }

    const handleAutoFix = () => {
        // Auto-fix all selected elements
        selectedElements.forEach(el => {
            const recommended = WYSIWYGValidator.recommendGridSnapping(el)
            updateElement(el.id, { x: recommended.x, y: recommended.y })
        })
    }

    const handleValidateWYSIWYG = () => {
        const docValidation = WYSIWYGValidator.validateDocument(elements)
        alert(`WYSIWYG Validation: ${docValidation.isValid ? '✅ Perfect' : `⚠️ ${docValidation.totalWarnings} warnings`}\n\n` +
            docValidation.elementsWithIssues.map(e => `${e.id}: ${e.warnings.join(', ')}`).join('\n'))
    }

    if (!isMultiSelected) return null

    return (
        <div className="flex flex-col gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            {/* Validation Status */}
            {validation && !validation.isValid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-100 text-yellow-800 text-sm">
                    <AlertCircle size={16} />
                    <span>{validation.totalWarnings} WYSIWYG issue{validation.totalWarnings > 1 ? 's' : ''} detected</span>
                    <button
                        onClick={handleAutoFix}
                        className="ml-auto px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-xs font-medium"
                    >
                        Auto-Fix
                    </button>
                </div>
            )}

            {validation?.isValid && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 text-green-800 text-sm">
                    <CheckCircle2 size={16} />
                    <span>✨ Perfect alignment - PDF ready</span>
                </div>
            )}

            {/* Main Toolbar */}
            <div className="flex flex-wrap gap-1 items-center">
                {/* Horizontal Alignment */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => handleAlign('left')} title="Align Left" className="p-2 rounded hover:bg-blue-100">
                        <AlignLeft size={18} />
                    </button>
                    <button onClick={() => handleAlign('center')} title="Align Center" className="p-2 rounded hover:bg-blue-100">
                        <AlignCenter size={18} />
                    </button>
                    <button onClick={() => handleAlign('right')} title="Align Right" className="p-2 rounded hover:bg-blue-100">
                        <AlignRight size={18} />
                    </button>
                </div>

                {/* Vertical Alignment */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => handleAlign('top')} title="Align Top" className="p-2 rounded hover:bg-blue-100">
                        <AlignVerticalJustifyStart size={18} />
                    </button>
                    <button onClick={() => handleAlign('middle')} title="Align Middle" className="p-2 rounded hover:bg-blue-100">
                        <AlignVerticalJustifyCenter size={18} />
                    </button>
                    <button onClick={() => handleAlign('bottom')} title="Align Bottom" className="p-2 rounded hover:bg-blue-100">
                        <AlignVerticalJustifyEnd size={18} />
                    </button>
                </div>

                {/* Distribution */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => handleDistribute('horizontal')}
                        disabled={selectedIds.length < 3}
                        title="Distribute Horizontally"
                        className="p-2 rounded hover:bg-blue-100 disabled:opacity-40 text-xs font-bold"
                    >
                        H⇄
                    </button>
                    <button
                        onClick={() => handleDistribute('vertical')}
                        disabled={selectedIds.length < 3}
                        title="Distribute Vertically"
                        className="p-2 rounded hover:bg-blue-100 disabled:opacity-40 text-xs font-bold"
                    >
                        V⇄
                    </button>
                </div>

                {/* Advanced */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`p-2 rounded ml-auto transition-colors ${showAdvanced ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'}`}
                >
                    <MoreVertical size={18} />
                </button>
            </div>

            {/* Advanced Panel */}
            {showAdvanced && (
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-md space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAlign('baseline')}
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200"
                        >
                            📐 Baseline Align
                        </button>
                        <button
                            onClick={handleValidateWYSIWYG}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200"
                        >
                            ✅ Validate PDF
                        </button>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${validation?.isValid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span>Alignment: {validation?.isValid ? 'Perfect' : 'Needs adjustment'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Elements: {selectedIds.length} selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>Optical Center: {selectedElements.some(e => e.type === 'social-icon') ? 'Active' : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>Pro Tips:</strong>
                        <ul className="mt-1 space-y-0.5 list-disc list-inside">
                            <li>Use "Baseline Align" for text + icon pairs</li>
                            <li>Hold Shift for 10px movement</li>
                            <li>Elements auto-snap to 0.5px grid for PDF</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}