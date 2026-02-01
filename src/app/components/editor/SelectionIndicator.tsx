'use client'

import React from 'react'
import { EditorElement } from '@/app/store/useEditorStore'

interface SelectionIndicatorProps {
    element: EditorElement
    isSelected: boolean
    isMultiSelected: boolean
    onClick?: () => void
}

export default function SelectionIndicator({ element, isSelected, isMultiSelected, onClick }: SelectionIndicatorProps) {
    if (!isSelected && !isMultiSelected) return null

    const borderColor = isMultiSelected ? '#6366f1' : '#3b82f6'
    const borderWidth = isMultiSelected ? 3 : 2
    const shadow = isMultiSelected ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : '0 0 0 2px rgba(59, 130, 246, 0.1)'

    return (
        <>
            {/* Primary Selection Ring */}
            <div
                style={{
                    position: 'absolute',
                    left: `${element.x - borderWidth}px`,
                    top: `${element.y - borderWidth}px`,
                    width: `${element.style.width + borderWidth * 2}px`,
                    height: `${element.style.height + borderWidth * 2}px`,
                    border: `${borderWidth}px solid ${borderColor}`,
                    borderRadius: `${element.style.borderRadius || 4}px`,
                    pointerEvents: 'none',
                    boxShadow: shadow,
                    zIndex: 1000,
                    transition: 'all 0.15s ease-out',
                    opacity: 0.9,
                }}
                className="SelectionRing"
                data-html2canvas-ignore="true"
            >
                {/* Corner handles for visual feedback */}
                {isSelected && (
                    <>
                        <div
                            style={{
                                position: 'absolute',
                                width: '8px',
                                height: '8px',
                                backgroundColor: borderColor,
                                borderRadius: '50%',
                                top: '-6px',
                                left: '-6px',
                                opacity: 0.8
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                width: '8px',
                                height: '8px',
                                backgroundColor: borderColor,
                                borderRadius: '50%',
                                top: '-6px',
                                right: '-6px',
                                opacity: 0.8
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                width: '8px',
                                height: '8px',
                                backgroundColor: borderColor,
                                borderRadius: '50%',
                                bottom: '-6px',
                                left: '-6px',
                                opacity: 0.8
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                width: '8px',
                                height: '8px',
                                backgroundColor: borderColor,
                                borderRadius: '50%',
                                bottom: '-6px',
                                right: '-6px',
                                opacity: 0.8
                            }}
                        />
                    </>
                )}
            </div>

            {/* Multi-selection Badge */}
            {isMultiSelected && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${element.x + element.style.width / 2}px`,
                        top: `${element.y - 20}px`,
                        transform: 'translateX(-50%)',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        zIndex: 1001,
                        pointerEvents: 'none',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                        whiteSpace: 'nowrap'
                    }}
                    className="SelectionLabel"
                    data-html2canvas-ignore="true"
                >
                    Selected
                </div>
            )}
        </>
    )
}
