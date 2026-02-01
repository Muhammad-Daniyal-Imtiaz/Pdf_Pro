'use client'

import React, { useState, useEffect } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'
import { AdvancedMeasurement } from '@/app/lib/alignment-service'

interface MeasurementFeedbackProps {
    element: EditorElement
    isSelected: boolean
    alignmentInfo?: {
        distanceToAlign?: number
        opticalCenter?: { x: number; y: number }
        fontSize?: number
    }
}

export default function MeasurementFeedback({ element, isSelected, alignmentInfo }: MeasurementFeedbackProps) {
    const [bbox, setBbox] = useState(AdvancedMeasurement.calculateBoundingBox(element))

    useEffect(() => {
        setBbox(AdvancedMeasurement.calculateBoundingBox(element))
    }, [element])

    if (!isSelected) return null

    // Calculate readable dimensions
    const width = Math.round(bbox.width * 10) / 10
    const height = Math.round(bbox.height * 10) / 10

    return (
        <div data-html2canvas-ignore="true">
            {/* Dimension Labels */}
            <div
                style={{
                    position: 'absolute',
                    left: `${element.x + element.style.width / 2}px`,
                    top: `${element.y - 35}px`,
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    zIndex: 999,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    fontFamily: 'monospace'
                }}
                className="MeasurementTooltip"
            >
                {width}px × {height}px
            </div>

            {/* Position Label */}
            <div
                style={{
                    position: 'absolute',
                    left: `${element.x - 50}px`,
                    top: `${element.y + element.style.height / 2}px`,
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(99, 102, 241, 0.85)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    zIndex: 999,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                    opacity: 0.8
                }}
                className="MeasurementTooltip"
            >
                X: {Math.round(element.x)}
            </div>

            <div
                style={{
                    position: 'absolute',
                    left: `${element.x + element.style.width / 2}px`,
                    top: `${element.y - 8}px`,
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(99, 102, 241, 0.85)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    zIndex: 999,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                    opacity: 0.8
                }}
                className="MeasurementTooltip"
            >
                Y: {Math.round(element.y)}
            </div>

            {/* Visual Grid Lines - Helps with alignment */}
            <svg
                style={{
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 990
                }}
                data-html2canvas-ignore="true"
            >
                {/* Center horizontal line */}
                <line
                    x1={element.x}
                    y1={element.y + element.style.height / 2}
                    x2={element.x + element.style.width}
                    y2={element.y + element.style.height / 2}
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
                {/* Center vertical line */}
                <line
                    x1={element.x + element.style.width / 2}
                    y1={element.y}
                    x2={element.x + element.style.width / 2}
                    y2={element.y + element.style.height}
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
            </svg>

            {/* Optical Center Indicator (for icons) */}
            {element.type === 'social-icon' && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${bbox.visualCenter.x - 3}px`,
                        top: `${bbox.visualCenter.y - 3}px`,
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        zIndex: 999,
                        pointerEvents: 'none',
                        boxShadow: '0 0 4px rgba(16, 185, 129, 0.5)'
                    }}
                    className="OpticalCenterIndicator"
                    data-html2canvas-ignore="true"
                    title="Optical Center"
                />
            )}

            {/* Baseline Indicator (for text) */}
            {(element.type === 'paragraph' || element.type === 'link') && (
                <svg
                    style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 995
                    }}
                    data-html2canvas-ignore="true"
                >
                    <line
                        x1={element.x}
                        y1={element.y + bbox.baselineOffset}
                        x2={element.x + element.style.width}
                        y2={element.y + bbox.baselineOffset}
                        stroke="rgba(168, 85, 247, 0.3)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                </svg>
            )}
        </div>
    )
}
