'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { EditorElement } from '@/app/store/useEditorStore'
import { AdvancedMeasurement } from '@/app/lib/alignment-service'

// CoordinateSystem may or may not exist — guard with try/catch
let CoordinateSystem: any = null
try {
    CoordinateSystem = require('@/app/lib/geometry-engine/CoordinateSystem').CoordinateSystem
} catch {
    // Library not available — we'll skip DOM drift detection
}

interface MeasurementFeedbackProps {
    element: EditorElement
    isSelected: boolean
}

export default function MeasurementFeedback({ element, isSelected }: MeasurementFeedbackProps) {
    const [domMetrics, setDomMetrics] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
    const [bbox, setBbox] = useState(() => AdvancedMeasurement.calculateBoundingBox(element))

    // ✅ FIXED: The old code ran setInterval(updateMetrics, 100) inside a useEffect
    // that ran on EVERY render (dependency: `element`). This created a NEW interval
    // on every tiny change (typing, dragging) and never cleaned up the old ones,
    // stacking up hundreds of intervals and causing a severe memory leak and
    // 100ms CPU thrash continuously.
    //
    // New approach: update only when element position/size actually changes,
    // using a single debounced effect. No interval needed at all.
    const updateMetrics = useCallback(() => {
        if (!isSelected) return

        // Update bounding box from store data (always available)
        setBbox(AdvancedMeasurement.calculateBoundingBox(element))

        // Update DOM metrics if CoordinateSystem is available
        if (CoordinateSystem) {
            try {
                const metrics = CoordinateSystem.getElementMetrics(element.id)
                setDomMetrics(metrics)
            } catch {
                setDomMetrics(null)
            }
        }
    }, [
        element.id,
        element.x,
        element.y,
        element.style.width,
        element.style.height,
        isSelected
    ])

    useEffect(() => {
        if (!isSelected) {
            setDomMetrics(null)
            return
        }
        // Single run when selection or position changes
        updateMetrics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateMetrics])

    if (!isSelected) return null

    const w = Math.round(Number(element.style.width) || 0)
    const h = Math.round(Number(element.style.height) || 0)

    // Drift = difference between store position and actual DOM position
    const driftX = domMetrics ? Math.abs(domMetrics.x - element.x) : 0
    const driftY = domMetrics ? Math.abs(domMetrics.y - element.y) : 0
    const hasDrift = driftX > 1.5 || driftY > 1.5

    const elemX = Math.round(element.x)
    const elemY = Math.round(element.y)

    return (
        <div data-html2canvas-ignore="true" className="pointer-events-none">
            {/* ── Size tooltip above element ─────────────────────────────────────── */}
            <div
                className="absolute z-[999] bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap"
                style={{
                    left: `${elemX + w / 2}px`,
                    top: `${elemY - 30}px`,
                    transform: 'translateX(-50%)',
                }}
            >
                {w} × {h} px
                {hasDrift && (
                    <span className="ml-1.5 text-yellow-300 text-[9px]">
                        ⚠ drift {driftX.toFixed(0)},{driftY.toFixed(0)}
                    </span>
                )}
            </div>

            {/* ── X position label ─────────────────────────────────────────────── */}
            <div
                className="absolute z-[998] text-[9px] font-mono bg-indigo-500 text-white px-1.5 py-0.5 rounded opacity-90 whitespace-nowrap"
                style={{
                    left: `${elemX + w / 2}px`,
                    top: `${elemY - 14}px`,
                    transform: 'translateX(-50%)',
                }}
            >
                x:{elemX}
            </div>

            {/* ── Y position label ─────────────────────────────────────────────── */}
            <div
                className="absolute z-[998] text-[9px] font-mono bg-indigo-500 text-white px-1.5 py-0.5 rounded opacity-90 whitespace-nowrap"
                style={{
                    left: `${elemX - 4}px`,
                    top: `${elemY + h / 2}px`,
                    transform: 'translate(-100%, -50%)',
                }}
            >
                y:{elemY}
            </div>

            {/* ── Alignment crosshair guides ───────────────────────────────────── */}
            <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%', overflow: 'visible', zIndex: 990 }}
            >
                {/* Horizontal center guide */}
                <line
                    x1={elemX - 20} y1={elemY + h / 2}
                    x2={elemX + w + 20} y2={elemY + h / 2}
                    stroke="rgba(99,102,241,0.35)" strokeWidth="1" strokeDasharray="5 4"
                />
                {/* Vertical center guide */}
                <line
                    x1={elemX + w / 2} y1={elemY - 20}
                    x2={elemX + w / 2} y2={elemY + h + 20}
                    stroke="rgba(99,102,241,0.35)" strokeWidth="1" strokeDasharray="5 4"
                />
                {/* Text baseline (for text elements) */}
                {(['paragraph', 'text', 'heading', 'link'].includes(element.type)) && (
                    <line
                        x1={elemX} y1={elemY + bbox.baselineOffset}
                        x2={elemX + w} y2={elemY + bbox.baselineOffset}
                        stroke="rgba(168,85,247,0.45)" strokeWidth="1" strokeDasharray="3 3"
                    />
                )}
            </svg>

            {/* ── DOM drift warning overlay ────────────────────────────────────── */}
            {hasDrift && domMetrics && (
                <div
                    className="absolute z-[1000] border-2 border-red-400 border-dashed rounded pointer-events-none animate-pulse"
                    style={{
                        left: `${domMetrics.x}px`,
                        top: `${domMetrics.y}px`,
                        width: `${domMetrics.width}px`,
                        height: `${domMetrics.height}px`,
                    }}
                    title={`DOM drift detected: store=(${elemX},${elemY}) vs DOM=(${Math.round(domMetrics.x)},${Math.round(domMetrics.y)})`}
                />
            )}
        </div>
    )
}