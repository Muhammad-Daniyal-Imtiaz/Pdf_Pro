'use client'

import React, { useState, useEffect } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'
import { CoordinateSystem } from '@/app/lib/geometry-engine/CoordinateSystem'
import { AdvancedMeasurement } from '@/app/lib/alignment-service'

interface MeasurementFeedbackProps {
    element: EditorElement
    isSelected: boolean
}

export default function MeasurementFeedback({ element, isSelected }: MeasurementFeedbackProps) {
    const [metrics, setMetrics] = useState<ReturnType<typeof CoordinateSystem.getElementMetrics>>(null)
    const [bbox, setBbox] = useState(AdvancedMeasurement.calculateBoundingBox(element))

    useEffect(() => {
        // Update metrics in real-time
        const updateMetrics = () => {
            const domMetrics = CoordinateSystem.getElementMetrics(element.id)
            setMetrics(domMetrics)
            setBbox(AdvancedMeasurement.calculateBoundingBox(element))
        }

        updateMetrics()
        const interval = setInterval(updateMetrics, 100) // Update frequently during interaction

        return () => clearInterval(interval)
    }, [element])

    if (!isSelected || !metrics) return null

    // Check for drift between stored and actual position
    const driftX = Math.abs(metrics.x - element.x)
    const driftY = Math.abs(metrics.y - element.y)
    const hasDrift = driftX > 1 || driftY > 1

    return (
        <div data-html2canvas-ignore="true" className="pointer-events-none">
            {/* Dimension Tooltip */}
            <div
                className="absolute z-[999] bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg"
                style={{
                    left: `${element.x + element.style.width / 2}px`,
                    top: `${element.y - 40}px`,
                    transform: 'translateX(-50%)'
                }}
            >
                {Math.round(bbox.width)}×{Math.round(bbox.height)}px
                {hasDrift && (
                    <span className="ml-2 text-yellow-300">
                        ⚠️ Drift: {driftX.toFixed(1)},{driftY.toFixed(1)}
                    </span>
                )}
            </div>

            {/* Position Guides */}
            <div
                className="absolute z-[998] text-[10px] font-mono bg-indigo-500 text-white px-1.5 py-0.5 rounded opacity-80"
                style={{
                    left: `${element.x}px`,
                    top: `${element.y - 20}px`,
                    transform: 'translateX(-50%)'
                }}
            >
                X:{Math.round(element.x)}
            </div>

            <div
                className="absolute z-[998] text-[10px] font-mono bg-indigo-500 text-white px-1.5 py-0.5 rounded opacity-80"
                style={{
                    left: `${element.x - 35}px`,
                    top: `${element.y + element.style.height / 2}px`,
                    transform: 'translateY(-50%)'
                }}
            >
                Y:{Math.round(element.y)}
            </div>

            {/* Alignment Guides - Center Lines */}
            <svg
                className="absolute inset-0 w-full h-full z-[990] pointer-events-none"
                style={{ overflow: 'visible' }}
            >
                <line
                    x1={element.x}
                    y1={element.y + element.style.height / 2}
                    x2={element.x + element.style.width}
                    y2={element.y + element.style.height / 2}
                    stroke="rgba(99, 102, 241, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
                <line
                    x1={element.x + element.style.width / 2}
                    y1={element.y}
                    x2={element.x + element.style.width / 2}
                    y2={element.y + element.style.height}
                    stroke="rgba(99, 102, 241, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />

                {/* Baseline indicator for text */}
                {(element.type === 'paragraph' || element.type === 'link') && (
                    <line
                        x1={element.x}
                        y1={element.y + bbox.baselineOffset}
                        x2={element.x + element.style.width}
                        y2={element.y + bbox.baselineOffset}
                        stroke="rgba(168, 85, 247, 0.4)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                )}
            </svg>

            {/* Drift Warning Overlay */}
            {hasDrift && (
                <div
                    className="absolute z-[1000] border-2 border-red-500 rounded pointer-events-none animate-pulse"
                    style={{
                        left: `${metrics.x}px`,
                        top: `${metrics.y}px`,
                        width: `${metrics.width}px`,
                        height: `${metrics.height}px`
                    }}
                    title="Visual drift detected"
                />
            )}
        </div>
    )
}