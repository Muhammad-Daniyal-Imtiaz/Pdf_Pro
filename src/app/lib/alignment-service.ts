// lib/alignment-service.ts
/**
 * ADVANCED ALIGNMENT SYSTEM
 * Production-grade alignment with optical compensation and DOM metrics
 */

import type { EditorElement, EditorStyle } from '@/app/store/useEditorStore'

/**
 * Represents the precise bounding box of an element
 */
export interface PreciseBoundingBox {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
    opticalLeft: number
    opticalTop: number
    baselineOffset: number
    visualCenter: { x: number; y: number }
}

/**
 * Font metrics for precise text baseline calculation
 */
export interface FontMetrics {
    capHeight: number
    xHeight: number
    ascender: number
    descender: number
    lineHeight: number
    baseCorrectionFactor: number
}

export class AdvancedMeasurement {
    /**
     * Calculate font metrics based on actual font properties
     */
    static calculateFontMetrics(
        fontSize: number,
        fontFamily: string = 'Inter',
        lineHeight: number = 1.5
    ): FontMetrics {
        // Pre-calculated font metrics for common fonts (in % of fontSize)
        const fontScales: Record<string, { cap: number; x: number; asc: number; desc: number; base: number }> = {
            'Inter': { cap: 0.71, x: 0.52, asc: 0.86, desc: -0.23, base: 0.18 },
            'Arial': { cap: 0.73, x: 0.53, asc: 0.85, desc: -0.22, base: 0.19 },
            'Helvetica': { cap: 0.72, x: 0.52, asc: 0.86, desc: -0.23, base: 0.18 },
            'Times New Roman': { cap: 0.68, x: 0.48, asc: 0.82, desc: -0.20, base: 0.20 },
            'Georgia': { cap: 0.69, x: 0.50, asc: 0.83, desc: -0.21, base: 0.21 },
            'Verdana': { cap: 0.76, x: 0.56, asc: 0.89, desc: -0.25, base: 0.16 },
            'Courier New': { cap: 0.70, x: 0.50, asc: 0.84, desc: -0.21, base: 0.19 }
        }

        const scale = fontScales[fontFamily.split(',')[0].trim()] || fontScales['Inter']

        return {
            capHeight: Math.round(fontSize * scale.cap * 10) / 10,
            xHeight: Math.round(fontSize * scale.x * 10) / 10,
            ascender: Math.round(fontSize * scale.asc * 10) / 10,
            descender: Math.round(fontSize * scale.desc * 10) / 10,
            lineHeight: Math.round(fontSize * lineHeight * 10) / 10,
            baseCorrectionFactor: scale.base
        }
    }

    /**
     * Calculate precise bounding box with optical compensation
     * This accounts for visual weight differences between icons and text
     */
    static calculateBoundingBox(
        element: EditorElement,
    ): PreciseBoundingBox {
        const style = element.style
        const width = style.width
        const height = style.height
        const x = element.x
        const y = element.y

        // Get optical adjustments based on element type
        let opticalLeft = 0
        let opticalTop = 0
        let baselineOffset = 0

        if (element.type === 'social-icon' || element.type === 'image') {
            // Icons: center is geometric, but optical center might differ
            opticalLeft = 0
            opticalTop = 0
            baselineOffset = 0
        } else if (element.type === 'heading' || element.type === 'paragraph' || element.type === 'link') {
            // Text: calculate optical adjustments based on font metrics
            const metrics = this.calculateFontMetrics(
                style.fontSize,
                style.fontFamily,
                style.lineHeight
            )

            // Baseline offset for text alignment with icons
            baselineOffset = height - (metrics.lineHeight - metrics.ascender) - (metrics.descender * 0.3)
            opticalTop = Math.round((metrics.capHeight - metrics.lineHeight) * 0.15 * 10) / 10
            opticalLeft = 0
        } else if (element.type === 'line') {
            // Lines: center based on thickness
            if (element.lineOrientation === 'horizontal') {
                opticalTop = (height - (style.borderWidth || 1)) / 2
            } else {
                opticalLeft = (width - (style.borderWidth || 1)) / 2
            }
            baselineOffset = 0
        }

        return {
            left: x + opticalLeft,
            top: y + opticalTop,
            right: x + width + opticalLeft,
            bottom: y + height + opticalTop,
            width,
            height,
            opticalLeft,
            opticalTop,
            baselineOffset,
            visualCenter: {
                x: x + width / 2 + opticalLeft,
                y: y + height / 2 + opticalTop
            }
        }
    }

    /**
     * Calculate visual center accounting for optical weight
     */
    static calculateOpticalCenter(element: EditorElement): { x: number; y: number } {
        const bbox = this.calculateBoundingBox(element)
        return bbox.visualCenter
    }

    /**
     * Get spacing compensation between two elements
     */
    static calculateSpacingCompensation(
        element1: EditorElement,
        element2: EditorElement,
        direction: 'horizontal' | 'vertical'
    ): number {
        const bbox1 = this.calculateBoundingBox(element1)
        const bbox2 = this.calculateBoundingBox(element2)

        if (direction === 'horizontal') {
            return bbox2.left - bbox1.right
        } else {
            return bbox2.top - bbox1.bottom
        }
    }

    /**
     * Snap to grid with intelligent rounding
     */
    static snapToGrid(value: number, gridSize: number = 8, isHard: boolean = false): number {
        if (isHard) {
            return Math.round(value / gridSize) * gridSize
        }
        // Soft snap: only snap if close to grid line
        const remainder = value % gridSize
        if (remainder < gridSize * 0.3) {
            return Math.floor(value / gridSize) * gridSize
        } else if (remainder > gridSize * 0.7) {
            return Math.ceil(value / gridSize) * gridSize
        }
        return value
    }
}

/**
 * MAIN ALIGNMENT ENGINE
 * Production-ready alignment algorithms
 */
export class AlignmentEngine {
    /**
     * Align elements to left edge with optical compensation
     */
    static alignLeft(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 2) return []

        // Find leftmost optical edge
        let minLeft = Infinity
        elements.forEach(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            minLeft = Math.min(minLeft, bbox.left)
        })

        return elements.map(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            return {
                x: el.x + (minLeft - bbox.left),
                y: el.y
            }
        })
    }

    /**
     * Align elements to horizontal center with optical center calculation
     */
    static alignCenter(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 2) return []

        // Calculate average optical center
        let sumCenter = 0
        elements.forEach(el => {
            const opticalCenter = AdvancedMeasurement.calculateOpticalCenter(el)
            sumCenter += opticalCenter.x
        })
        const centerX = sumCenter / elements.length

        return elements.map(el => {
            const opticalCenter = AdvancedMeasurement.calculateOpticalCenter(el)
            return {
                x: el.x + (centerX - opticalCenter.x),
                y: el.y
            }
        })
    }

    /**
     * Align elements to right edge
     */
    static alignRight(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 2) return []

        let maxRight = -Infinity
        elements.forEach(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            maxRight = Math.max(maxRight, bbox.right)
        })

        return elements.map(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            return {
                x: el.x + (maxRight - bbox.right),
                y: el.y
            }
        })
    }

    /**
     * Align elements to top edge
     */
    static alignTop(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 2) return []

        let minTop = Infinity
        elements.forEach(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            minTop = Math.min(minTop, bbox.top)
        })

        return elements.map(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            return {
                x: el.x,
                y: el.y + (minTop - bbox.top)
            }
        })
    }

    /**
     * Align elements to vertical middle
     */
    static alignMiddle(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 2) return []

        let sumCenter = 0
        elements.forEach(el => {
            const opticalCenter = AdvancedMeasurement.calculateOpticalCenter(el)
            sumCenter += opticalCenter.y
        })
        const centerY = sumCenter / elements.length

        return elements.map(el => {
            const opticalCenter = AdvancedMeasurement.calculateOpticalCenter(el)
            return {
                x: el.x,
                y: el.y + (centerY - opticalCenter.y)
            }
        })
    }

    /**
     * Align elements to bottom edge
     */
    static alignBottom(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 2) return []

        let maxBottom = -Infinity
        elements.forEach(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            maxBottom = Math.max(maxBottom, bbox.bottom)
        })

        return elements.map(el => {
            const bbox = AdvancedMeasurement.calculateBoundingBox(el)
            return {
                x: el.x,
                y: el.y + (maxBottom - bbox.bottom)
            }
        })
    }

    /**
     * Align text elements to icon baseline
     * CRITICAL: This makes text align perfectly with icons
     */
    static alignBaseline(elements: EditorElement[]): Partial<EditorElement>[] {
        // Separate text and icon elements
        const textElements = elements.filter(el =>
            ['paragraph', 'link', 'heading'].includes(el.type)
        )
        const iconElements = elements.filter(el =>
            ['social-icon', 'image'].includes(el.type)
        )

        if (textElements.length === 0 || iconElements.length === 0) {
            // Fallback to middle alignment
            return this.alignMiddle(elements)
        }

        // Calculate target baseline from icons
        let iconCenterY = 0
        iconElements.forEach(el => {
            const center = AdvancedMeasurement.calculateOpticalCenter(el)
            iconCenterY += center.y
        })
        iconCenterY /= iconElements.length

        return elements.map(el => {
            if (textElements.includes(el)) {
                const bbox = AdvancedMeasurement.calculateBoundingBox(el)
                // Align text so its visual center matches icon center
                const textCenter = bbox.top + bbox.height / 2 + (bbox.baselineOffset * 0.2)
                return {
                    x: el.x,
                    y: el.y + (iconCenterY - textCenter)
                }
            } else {
                return {}
            }
        })
    }

    /**
     * Distribute elements horizontally with even spacing
     */
    static distributeHorizontal(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 3) return []

        const sorted = [...elements].sort((a, b) => a.x - b.x)

        // Calculate total gap space
        let totalGap = 0
        for (let i = 0; i < sorted.length - 1; i++) {
            const bbox1 = AdvancedMeasurement.calculateBoundingBox(sorted[i])
            const bbox2 = AdvancedMeasurement.calculateBoundingBox(sorted[i + 1])
            totalGap += bbox2.left - bbox1.right
        }
        const evenGap = totalGap / (sorted.length - 1)

        const updates: Partial<EditorElement>[] = []
        let currentX = AdvancedMeasurement.calculateBoundingBox(sorted[0]).left

        sorted.forEach((el, idx) => {
            if (idx === 0) {
                updates.push({ x: el.x - (currentX - el.x) })
                currentX += AdvancedMeasurement.calculateBoundingBox(el).width + evenGap
            } else {
                const bbox = AdvancedMeasurement.calculateBoundingBox(el)
                updates.push({ x: currentX - bbox.left })
                currentX += bbox.width + evenGap
            }
        })

        return updates
    }

    /**
     * Distribute elements vertically with even spacing
     */
    static distributeVertical(elements: EditorElement[]): Partial<EditorElement>[] {
        if (elements.length < 3) return []

        const sorted = [...elements].sort((a, b) => a.y - b.y)

        let totalGap = 0
        for (let i = 0; i < sorted.length - 1; i++) {
            const bbox1 = AdvancedMeasurement.calculateBoundingBox(sorted[i])
            const bbox2 = AdvancedMeasurement.calculateBoundingBox(sorted[i + 1])
            totalGap += bbox2.top - bbox1.bottom
        }
        const evenGap = totalGap / (sorted.length - 1)

        const updates: Partial<EditorElement>[] = []
        let currentY = AdvancedMeasurement.calculateBoundingBox(sorted[0]).top

        sorted.forEach((el, idx) => {
            if (idx === 0) {
                updates.push({ y: el.y - (currentY - el.y) })
                currentY += AdvancedMeasurement.calculateBoundingBox(el).height + evenGap
            } else {
                const bbox = AdvancedMeasurement.calculateBoundingBox(el)
                updates.push({ y: currentY - bbox.top })
                currentY += bbox.height + evenGap
            }
        })

        return updates
    }

    /**
     * Snap all elements to export grid for PDF perfection
     */
    static snapToExportGrid(elements: EditorElement[], precision: number = 0.5): Partial<EditorElement>[] {
        return elements.map(el => {
            return {
                x: Math.round(el.x / precision) * precision,
                y: Math.round(el.y / precision) * precision
            }
        })
    }

    /**
     * Detect and auto-align icon+text pairs
     */
    static detectAndAlignPairs(elements: EditorElement[]): Array<{ icon: EditorElement; text: EditorElement; type: 'email' | 'phone' | 'social' }> {
        const pairs: Array<{ icon: EditorElement; text: EditorElement; type: 'email' | 'phone' | 'social' }> = []

        // Find icons that are close to text elements
        elements.forEach(el => {
            if (el.type === 'social-icon') {
                // Look for nearby text or link elements
                const nearby = elements.find(other =>
                    other.id !== el.id &&
                    (other.type === 'paragraph' || other.type === 'link') &&
                    Math.abs(other.y - el.y) < 50 && // Within 50px vertically
                    Math.abs(other.x - (el.x + el.style.width)) < 100 // Within 100px to the right
                )

                if (nearby) {
                    pairs.push({ icon: el, text: nearby, type: 'social' })
                }
            }
        })

        return pairs
    }
}

/**
 * WYSIWYG VALIDATOR
 * Ensures PDF output matches editor exactly
 */
export class WYSIWYGValidator {
    /**
     * Validate element export fidelity
     */
    static validateExportFidelity(element: EditorElement): { valid: boolean; warnings: string[] } {
        const warnings: string[] = []

        // Check for sub-pixel positioning
        if (element.x % 1 > 0.1 || element.y % 1 > 0.1) {
            warnings.push(`Sub-pixel positioning detected at (${element.x}, ${element.y})`)
        }

        // Check for rotation (PDF rasterization issues)
        if (element.style.rotation && element.style.rotation !== 0) {
            warnings.push(`Rotation (${element.style.rotation}°) may cause slight anti-aliasing differences in PDF`)
        }

        // Check opacity
        if (element.style.opacity && element.style.opacity < 1) {
            warnings.push('Opacity < 1 may render slightly differently in PDF vs Editor')
        }

        // Check font availability - safe check
        try {
            const fontFamily = element.style.fontFamily || 'Arial, sans-serif'
            const systemFonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana']
            const primaryFont = fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') || 'Arial'

            if (!systemFonts.includes(primaryFont)) {
                warnings.push(`Font "${primaryFont}" may substitute in PDF if not available`)
            }
        } catch (error) {
            // If there's any error accessing fontFamily, add a warning
            warnings.push('Font validation failed - may substitute in PDF')
        }

        return {
            valid: warnings.length === 0,
            warnings
        }
    }

    /**
     * Recommend optimal grid snapping for element
     */
    static recommendGridSnapping(element: EditorElement, precision: number = 0.5): { x: number; y: number } {
        return {
            x: Math.round(element.x / precision) * precision,
            y: Math.round(element.y / precision) * precision
        }
    }

    /**
     * Full document validation
     */
    static validateDocument(elements: EditorElement[]): {
        isValid: boolean
        totalWarnings: number
        elementsWithIssues: Array<{ id: string; warnings: string[] }>
    } {
        let totalWarnings = 0
        const elementsWithIssues: Array<{ id: string; warnings: string[] }> = []

        elements.forEach(el => {
            const validation = this.validateExportFidelity(el)
            if (!validation.valid) {
                totalWarnings += validation.warnings.length
                elementsWithIssues.push({ id: el.id, warnings: validation.warnings })
            }
        })

        return {
            isValid: totalWarnings === 0,
            totalWarnings,
            elementsWithIssues
        }
    }
}