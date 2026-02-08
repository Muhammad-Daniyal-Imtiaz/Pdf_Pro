// lib/geometry-engine/CoordinateSystem.ts
/**
 * UNIFIED COORDINATE SYSTEM
 * Bridges the gap between Editor (Screen Pixels) and PDF (Points)
 * with sub-pixel precision correction
 */

import type { EditorElement } from '@/app/store/useEditorStore'

export interface RenderedMetrics {
    x: number
    y: number
    width: number
    height: number
    baseline: number
    opticalCenter: { x: number; y: number }
    actualBoundingBox: {
        left: number
        top: number
        right: number
        bottom: number
    }
}

export class CoordinateSystem {
    private static readonly DPI_SCREEN = 96
    private static readonly DPI_PDF = 72
    private static readonly CONVERSION_FACTOR = CoordinateSystem.DPI_PDF / CoordinateSystem.DPI_SCREEN

    /**
     * Convert screen pixels to PDF points
     * Exact formula: points = pixels * (72/96)
     */
    public static screenToPDF(px: number): number {
        return px * this.CONVERSION_FACTOR
    }

    /**
     * Convert PDF points to screen pixels
     */
    public static pdfToScreen(pt: number): number {
        return pt / this.CONVERSION_FACTOR
    }

    /**
     * Get ACTUAL rendered metrics from DOM element
     * This is source of truth for WYSIWYG
     */
    public static getElementMetrics(elementId: string): RenderedMetrics | null {
        const element = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement
        if (!element) return null

        const rect = element.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(element)

        // Get parent container for relative positioning
        const container = element.closest('.editor-canvas') as HTMLElement
        const containerRect = container?.getBoundingClientRect() || { left: 0, top: 0 }

        // Calculate relative position WITHIN the canvas
        const relativeX = rect.left - containerRect.left
        const relativeY = rect.top - containerRect.top

        // Calculate actual visual baseline for text elements
        let baseline = 0
        if (element.tagName === 'DIV' && element.getAttribute('contenteditable') === 'true') {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            ctx.font = `${computedStyle.fontStyle} ${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`
            const metrics = ctx.measureText('M')
            baseline = metrics.actualBoundingBoxAscent || (parseInt(computedStyle.fontSize) * 0.85)
        }

        // Optical center accounts for visual weight (icons vs text)
        const opticalCenter = {
            x: relativeX + rect.width / 2,
            y: relativeY + rect.height / 2
        }

        return {
            x: relativeX,
            y: relativeY,
            width: rect.width,
            height: rect.height,
            baseline,
            opticalCenter,
            actualBoundingBox: {
                left: relativeX,
                top: relativeY,
                right: relativeX + rect.width,
                bottom: relativeY + rect.height
            }
        }
    }

    /**
     * Snap value to nearest grid point with precision tolerance
     */
    public static snapToGrid(value: number, gridSize: number = 8, precision: number = 0.5): number {
        const snapped = Math.round(value / gridSize) * gridSize
        const remainder = Math.abs(value - snapped)
        return remainder < precision ? snapped : value
    }

    /**
     * Get alignment tolerance based on element types
     */
    public static getAlignmentTolerance(elementTypes: string[]): number {
        if (elementTypes.includes('social-icon')) return 0.5
        if (elementTypes.some(type => ['heading', 'paragraph', 'link'].includes(type))) return 1.0
        return 2.0
    }

    /**
     * Validate that rendered position matches stored position
     */
    public static validatePosition(element: EditorElement): {
        isValid: boolean;
        drift: { x: number; y: number };
        rendered: RenderedMetrics | null
    } {
        const rendered = this.getElementMetrics(element.id)
        if (!rendered) return { isValid: false, drift: { x: 0, y: 0 }, rendered: null }

        const tolerance = this.getAlignmentTolerance([element.type])
        const driftX = Math.abs(rendered.x - element.x)
        const driftY = Math.abs(rendered.y - element.y)

        return {
            isValid: driftX <= tolerance && driftY <= tolerance,
            drift: { x: driftX, y: driftY },
            rendered
        }
    }

    /**
     * Calculate export grid size for PDF optimization
     */
    public static getExportGridSize(elementType: string): number {
        switch (elementType) {
            case 'social-icon': return 0.25  // Quarter-pixel precision for icons
            case 'line': return 0.5
            default: return 0.5
        }
    }
}