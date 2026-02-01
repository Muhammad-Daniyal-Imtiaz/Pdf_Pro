'use client'

import React, { useState } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    MoreVertical,
    CheckCircle2,
    AlertCircle,
    Zap
} from 'lucide-react'

export default function AlignmentToolbar() {
    const { 
        selectedIds, 
        alignElements, 
        distributeElements, 
        validateAlignment,
        validateWYSIWYGFidelity
    } = useEditorStore()
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [alignmentStatus, setAlignmentStatus] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null)
    const [alignmentValidation, setAlignmentValidation] = useState<{ isValid: boolean; misalignedPairs: Array<{ id1: string; id2: string; deltaX: number; deltaY: number }> } | null>(null)

    const isMultiSelected = selectedIds.length >= 2

    // Auto-dismiss status after 3 seconds
    React.useEffect(() => {
        if (alignmentStatus) {
            const timer = setTimeout(() => setAlignmentStatus(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [alignmentStatus])

    // Validate alignment when selection changes
    React.useEffect(() => {
        if (isMultiSelected) {
            const validation = validateAlignment()
            setAlignmentValidation(validation)
        } else {
            setAlignmentValidation(null)
        }
    }, [selectedIds, isMultiSelected, validateAlignment])

    const handleAlign = async (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'baseline') => {
        try {
            alignElements(direction)
            const directionLabel = direction.charAt(0).toUpperCase() + direction.slice(1)
            
            // Validate alignment after operation
            setTimeout(() => {
                const validation = validateAlignment()
                setAlignmentValidation(validation)
                
                if (validation.isValid) {
                    setAlignmentStatus({
                        type: 'success',
                        message: `✨ Perfect ${directionLabel} alignment achieved for ${selectedIds.length} elements`
                    })
                } else {
                    setAlignmentStatus({
                        type: 'warning',
                        message: `${directionLabel} alignment applied. ${validation.misalignedPairs.length} pairs may need fine-tuning`
                    })
                }
            }, 100)
        } catch (error) {
            setAlignmentStatus({
                type: 'error',
                message: 'Alignment failed. Please try again.'
            })
        }
    }

    const handleDistribute = async (axis: 'horizontal' | 'vertical') => {
        try {
            if (selectedIds.length < 3) {
                setAlignmentStatus({
                    type: 'error',
                    message: 'Select at least 3 elements to distribute'
                })
                return
            }
            distributeElements(axis)
            
            // Validate distribution after operation
            setTimeout(() => {
                const validation = validateAlignment()
                setAlignmentValidation(validation)
                
                if (validation.isValid) {
                    setAlignmentStatus({
                        type: 'success',
                        message: `✨ Perfect ${axis} distribution achieved for ${selectedIds.length} elements`
                    })
                } else {
                    setAlignmentStatus({
                        type: 'warning',
                        message: `${axis} distribution applied. Some elements may need manual adjustment.`
                    })
                }
            }, 100)
        } catch (error) {
            setAlignmentStatus({
                type: 'error',
                message: 'Distribution failed. Please try again.'
            })
        }
    }

    const handleWYSIWYGValidation = () => {
        const validation = validateWYSIWYGFidelity()
        if (validation.isValid) {
            setAlignmentStatus({
                type: 'success',
                message: '✅ Perfect WYSIWYG fidelity - PDF will match editor exactly'
            })
        } else {
            setAlignmentStatus({
                type: 'warning',
                message: `⚠️ ${validation.warnings.length} WYSIWYG issues detected that may affect PDF quality`
            })
        }
    }

    if (!isMultiSelected) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <AlertCircle size={16} />
                <span>Select 2+ elements to align</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            {/* Alignment Validation Status */}
            {alignmentValidation && !alignmentValidation.isValid && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <AlertCircle size={16} />
                    <span>
                        ⚠️ {alignmentValidation.misalignedPairs.length} misaligned pair{alignmentValidation.misalignedPairs.length > 1 ? 's' : ''} detected
                    </span>
                </div>
            )}

            {/* Status Message */}
            {alignmentStatus && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                    alignmentStatus.type === 'success'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : alignmentStatus.type === 'error'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : alignmentStatus.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                    {alignmentStatus.type === 'success' && <CheckCircle2 size={16} />}
                    {alignmentStatus.type === 'error' && <AlertCircle size={16} />}
                    {alignmentStatus.type === 'warning' && <AlertCircle size={16} />}
                    {alignmentStatus.type === 'info' && <Zap size={16} />}
                    <span>{alignmentStatus.message}</span>
                </div>
            )}

            {/* Alignment Toolbar */}
            <div className="flex flex-wrap gap-1">
                {/* Horizontal Alignment */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => handleAlign('left')}
                        title="Align Left"
                        className="p-2 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={!isMultiSelected}
                    >
                        <AlignLeft size={18} className="text-gray-700" />
                    </button>
                    <button
                        onClick={() => handleAlign('center')}
                        title="Align Horizontal Center"
                        className="p-2 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={!isMultiSelected}
                    >
                        <AlignCenter size={18} className="text-gray-700" />
                    </button>
                    <button
                        onClick={() => handleAlign('right')}
                        title="Align Right"
                        className="p-2 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={!isMultiSelected}
                    >
                        <AlignRight size={18} className="text-gray-700" />
                    </button>
                </div>

                {/* Vertical Alignment */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => handleAlign('top')}
                        title="Align Top"
                        className="p-2 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={!isMultiSelected}
                    >
                        <AlignStartVertical size={18} className="text-gray-700" />
                    </button>
                    <button
                        onClick={() => handleAlign('middle')}
                        title="Align Vertical Center"
                        className="p-2 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={!isMultiSelected}
                    >
                        <AlignCenterVertical size={18} className="text-gray-700" />
                    </button>
                    <button
                        onClick={() => handleAlign('bottom')}
                        title="Align Bottom"
                        className="p-2 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={!isMultiSelected}
                    >
                        <AlignEndVertical size={18} className="text-gray-700" />
                    </button>
                </div>

                {/* Distribution */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => handleDistribute('horizontal')}
                        title="Distribute Horizontally"
                        className="p-2 rounded hover:bg-blue-100 transition-colors text-xs font-bold disabled:opacity-50"
                        disabled={selectedIds.length < 3}
                    >
                        H⟷
                    </button>
                    <button
                        onClick={() => handleDistribute('vertical')}
                        title="Distribute Vertically"
                        className="p-2 rounded hover:bg-blue-100 transition-colors text-xs font-bold disabled:opacity-50"
                        disabled={selectedIds.length < 3}
                    >
                        V⟷
                    </button>
                </div>

                {/* Advanced Options */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    title="Advanced Alignment Options"
                    className={`p-2 rounded ml-auto transition-colors ${
                        showAdvanced
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    } border border-gray-200`}
                >
                    <MoreVertical size={18} />
                </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-blue-200 shadow-md">
                    <button
                        onClick={() => handleAlign('baseline')}
                        title="Align Baseline - Perfect for text and icons"
                        className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-md hover:shadow-md transition-all"
                    >
                        📐 Baseline Align
                    </button>

                    <button
                        onClick={handleWYSIWYGValidation}
                        title="Validate WYSIWYG Fidelity"
                        className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-md hover:shadow-md transition-all"
                    >
                        ✅ Validate PDF
                    </button>

                    <div className="flex-1 min-w-full border-t border-gray-200 my-1"></div>

                    <div className="flex flex-col gap-1 w-full">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Real-Time Validation</p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${alignmentValidation?.isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span>Alignment: {alignmentValidation?.isValid ? 'Perfect' : 'Needs adjustment'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>Elements: {selectedIds.length} selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span>Optical Center: Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-full border-t border-gray-200 my-1"></div>

                    <div className="flex flex-col gap-1 w-full">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Advanced Features</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>✨ <strong>Real DOM Metrics</strong> - Live element measurement</li>
                            <li>📏 <strong>Optical Center Calculation</strong> - Visual weight accounting</li>
                            <li>🎯 <strong>Subpixel Precision</strong> - 100x more accurate</li>
                            <li>📊 <strong>Spacing Compensation</strong> - Auto-adjusts for fonts</li>
                            <li>📄 <strong>Export-Ready</strong> - Perfect PDF fidelity</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-gray-600 px-1">
                <strong>Multi-Selection:</strong> Hold Shift+Click to select multiple elements
            </div>
        </div>
    )
}
