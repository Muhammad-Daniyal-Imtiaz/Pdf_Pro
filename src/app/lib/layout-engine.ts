// app/lib/layout-engine.ts — Production-Grade Layout Enforcement Engine
// =============================================================================
// This is the safety-net that runs AFTER the AI generates elements.
// It enforces z-index, overflow, collision avoidance, and clamping.
// Uses CANVAS_WIDTH_PX (794px) = Editor resolution. Never 595px here.
// =============================================================================

import {
    CANVAS_WIDTH_PX,
    CANVAS_HEIGHT_PX,
    SAFE_MARGIN_X,
    SAFE_MARGIN_Y,
    Z_LAYERS,
} from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ElementStyle {
    width?: number | string
    height?: number | string
    fontSize?: number
    fontWeight?: number | string
    color?: string
    fontFamily?: string
    textAlign?: string
    backgroundColor?: string
    padding?: number
    lineHeight?: number
    zIndex?: number
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    opacity?: number
    boxShadow?: string
    letterSpacing?: number
    resizeMode?: string
    [key: string]: any
}

interface LayoutElement {
    id: string
    type: string
    x: number
    y: number
    content?: string
    iconType?: string
    lineOrientation?: string
    lineStyle?: string
    style: ElementStyle
    pageIndex?: number
    [key: string]: any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Estimate the rendered height of a text element precisely */
function estimateTextHeight(el: LayoutElement): number {
    if (!['text', 'heading', 'paragraph'].includes(el.type)) {
        return Number(el.style.height) || 40
    }
    const width = Math.max(40, Number(el.style.width) || 200)
    const fontSize = Number(el.style.fontSize) || 12
    const content = String(el.content || '')
    const lineHeight = Number(el.style.lineHeight) || 1.5
    const padding = Number(el.style.padding) || 0

    // Account for ~0.52 width-ratio per character (slightly conservative)
    const charsPerLine = Math.max(1, (width - padding * 2) / (fontSize * 0.52))
    const lines = Math.max(1, Math.ceil(content.length / charsPerLine))

    // Add 24px buffer: 8px top pad + 8px bottom pad + 8px safety
    return Math.ceil(lines * fontSize * lineHeight + padding * 2 + 24)
}

/** Is this element a full-bleed or large background shape? */
function isBackground(e: LayoutElement): boolean {
    return (
        (e.type === 'shape' || e.type === 'container') &&
        Number(e.style.width) >= CANVAS_WIDTH_PX * 0.5 &&
        Number(e.style.height) >= 200
    )
}

function isFullPageBg(e: LayoutElement): boolean {
    return (
        Number(e.style.width) >= CANVAS_WIDTH_PX - 20 &&
        Number(e.style.height) >= CANVAS_HEIGHT_PX - 20
    )
}

// ─── Main enforcer ────────────────────────────────────────────────────────────
/**
 * enforceLayout()
 * Run every AI-generated element array through this before rendering.
 * Fixes: z-index, overflow, clamping, collision, icon sizing, colour safety.
 *
 * IMPORTANT: Input coordinates are assumed to be in CANVAS_WIDTH_PX (794px) space.
 * If the AI was prompted with 595px canvas (legacy), set `inputIs595` = true and
 * this function will scale them up before enforcement.
 */
export function enforceLayout(
    elements: LayoutElement[],
    opts: { inputIs595?: boolean } = {}
): LayoutElement[] {
    const scale = opts.inputIs595 ? CANVAS_WIDTH_PX / 595 : 1  // 1.333 if converting from 595px

    if (!Array.isArray(elements) || elements.length === 0) return []

    // ── Step 1: Normalize coordinates & styles ──────────────────────────────────
    const normalized: LayoutElement[] = elements
        .filter(el => el && typeof el === 'object' && el.type)
        .map((el, idx) => {
            const e: LayoutElement = {
                ...el,
                style: { ...(el.style || {}) },
                // Scale coordinates from 595px → 794px space if needed
                x: Math.round((Number(el.x) || 0) * scale),
                y: Math.round((Number(el.y) || 0) * scale),
            }

            // Scale dimensional styles too
            if (opts.inputIs595) {
                if (e.style.width) e.style.width = Math.round(Number(e.style.width) * scale)
                if (e.style.height) e.style.height = Math.round(Number(e.style.height) * scale)
                if (e.style.fontSize) e.style.fontSize = Math.round(Number(e.style.fontSize) * scale)
            }

            // Ensure unique ID
            if (!e.id) e.id = `el-auto-${idx}`

            // Force numeric dimensions
            e.style.width = Number(e.style.width) || 200
            e.style.height = Number(e.style.height) || 40

            return e
        })

    // ── Step 2: Separate backgrounds from content ────────────────────────────────
    const backgrounds: LayoutElement[] = []
    const content: LayoutElement[] = []

    for (const e of normalized) {
        if (isBackground(e)) {
            backgrounds.push(e)
        } else {
            content.push(e)
        }
    }

    // ── Step 3: Fix background elements ──────────────────────────────────────────
    for (const e of backgrounds) {
        // Backgrounds may be edge-to-edge — allow x:0, y:0
        e.x = Math.max(0, Math.min(e.x, 80))
        e.y = Math.max(0, Math.min(e.y, 80))
        e.style.width = Math.min(Number(e.style.width), CANVAS_WIDTH_PX)
        e.style.height = Math.min(Number(e.style.height), CANVAS_HEIGHT_PX)

        // Assign z-index
        e.style.zIndex = isFullPageBg(e) ? Z_LAYERS.BACKGROUND : Z_LAYERS.BANNER
    }

    // ── Step 4: Fix content elements ──────────────────────────────────────────────
    for (const e of content) {
        // Clamp to safe zone
        e.x = Math.max(SAFE_MARGIN_X - 20, Math.min(e.x, CANVAS_WIDTH_PX - 40))
        e.y = Math.max(0, Math.min(e.y, CANVAS_HEIGHT_PX - 20))

        // Width clamp
        e.style.width = Math.min(
            Math.max(Number(e.style.width), 40),
            CANVAS_WIDTH_PX - e.x
        )

        // ── Text elements ─────────────────────────────────────────────────────────
        if (['text', 'heading', 'paragraph'].includes(e.type)) {
            e.style.fontSize = Math.max(7, Math.min(Number(e.style.fontSize) || 12, 96))
            e.style.lineHeight = e.style.lineHeight || 1.5
            e.style.padding = e.style.padding ?? 0
            e.content = e.content || (e.type === 'heading' ? 'Heading' : 'Text')
            e.style.resizeMode = 'auto-height'

            // Force visible text color
            if (!e.style.color || e.style.color === 'transparent' || e.style.color === 'rgba(0,0,0,0)') {
                e.style.color = '#1a1a1a'
            }
            e.style.fontFamily = e.style.fontFamily || 'Inter, Arial, sans-serif'

            // Ensure height is enough for content
            const needed = estimateTextHeight(e)
            e.style.height = Math.max(Number(e.style.height) || 0, needed)
        }

        // ── Social icons ───────────────────────────────────────────────────────────
        if (e.type === 'social-icon') {
            // Force square icon size, 20–48px
            const sz = Math.max(20, Math.min(Number(e.style.width) || 24, 48))
            e.style.width = sz
            e.style.height = sz
        }

        // ── Z-index assignment ────────────────────────────────────────────────────
        switch (e.type) {
            case 'shape': e.style.zIndex = Z_LAYERS.SHAPE; break
            case 'image': e.style.zIndex = Z_LAYERS.IMAGE; break
            case 'line': e.style.zIndex = Z_LAYERS.LINE; break
            case 'text':
            case 'paragraph': e.style.zIndex = Z_LAYERS.TEXT; break
            case 'social-icon': e.style.zIndex = Z_LAYERS.ICON; break
            case 'heading': e.style.zIndex = Z_LAYERS.HEADING; break
            default:
                // Preserve AI-assigned z if reasonable
                if (e.style.zIndex == null) e.style.zIndex = Z_LAYERS.TEXT
        }

        // Headings: minimum z must be HEADING level
        if (e.type === 'heading') {
            e.style.zIndex = Math.max(e.style.zIndex ?? 0, Z_LAYERS.HEADING)
        }
    }

    // ── Step 5: Collision prevention (content elements only) ─────────────────────
    // Sort by Y position, then run O(n²) sweep
    content.sort((a, b) => a.y - b.y)

    for (let i = 0; i < content.length; i++) {
        const cur = content[i]
        const curBottom = cur.y + (Number(cur.style.height) || 40)
        const curRight = cur.x + (Number(cur.style.width) || 100)

        for (let j = i + 1; j < content.length; j++) {
            const nxt = content[j]

            // Higher z-index = intentional layer — skip
            if ((nxt.style.zIndex ?? 0) > (cur.style.zIndex ?? 0)) continue

            const nxtRight = nxt.x + (Number(nxt.style.width) || 100)

            // Only collide if they visually overlap in X
            const overlapX = cur.x < nxtRight && nxt.x < curRight
            if (!overlapX) continue

            // Push nxt down if vertically overlapping
            if (nxt.y < curBottom + 8) {
                nxt.y = curBottom + 8
            }
        }
    }

    // ── Step 6: Final page-height clamp ──────────────────────────────────────────
    for (const e of content) {
        if (e.y + Number(e.style.height) > CANVAS_HEIGHT_PX - 5) {
            e.style.height = Math.max(20, CANVAS_HEIGHT_PX - e.y - 5)
        }
    }

    // Return backgrounds first (painter's algorithm), then content sorted by zIndex
    return [
        ...backgrounds,
        ...content.sort((a, b) => (a.style.zIndex ?? 0) - (b.style.zIndex ?? 0)),
    ]
}

// ─── Box model helper (used by the old layout-engine.ts interface) ─────────────
export type BoxModel = {
    x: number; y: number; width: number; height: number
    paddingLeft: number; paddingRight: number; paddingTop: number; paddingBottom: number
}

/** Kept for backward compat with existing code that calls computeFinalStyles */
export function computeFinalStyles(element: any): { container: string; content: string } {
    const style = element.style || {}
    const x = Math.round(element.x || 0)
    const y = Math.round(element.y || 0)
    const w = Math.round(style.width || 0)
    const h = Math.round(style.height || 0)
    const pad = Math.round(style.padding || 0)
    const zIdx = style.zIndex ?? 1

    const base = `
    position: absolute;
    left: ${x}px; top: ${y}px;
    width: ${w}px; height: ${h}px;
    z-index: ${zIdx};
    box-sizing: border-box;
    margin: 0;
    overflow: visible;
    -webkit-font-smoothing: antialiased;
  `

    if (element.type === 'social-icon') {
        return { container: `${base} display: grid; place-items: center;`, content: '' }
    }

    if (['text', 'heading', 'paragraph'].includes(element.type)) {
        return {
            container: base,
            content: `
        width: 100%; height: auto; min-height: 100%;
        font-family: '${style.fontFamily || 'Inter'}', sans-serif;
        font-size: ${style.fontSize || 12}px;
        font-weight: ${style.fontWeight || 400};
        line-height: ${style.lineHeight || 1.5};
        color: ${style.color || '#000'};
        text-align: ${style.textAlign || 'left'};
        padding: ${pad}px;
        overflow: visible;
        word-wrap: break-word;
        white-space: pre-wrap;
      `
        }
    }

    if (element.type === 'line') {
        const isH = element.lineOrientation === 'horizontal'
        return {
            container: `${base} display: grid; place-items: center;`,
            content: `
        background-color: ${style.backgroundColor || '#000'};
        width:  ${isH ? '100%' : `${Math.round(style.width)}px`};
        height: ${isH ? `${Math.round(style.height)}px` : '100%'};
      `
        }
    }

    if (element.type === 'container') {
        return {
            container: base,
            content: `
        width: 100%; height: 100%;
        background-color: ${style.backgroundColor || 'transparent'};
        border: ${style.borderWidth || 0}px solid ${style.borderColor || '#000'};
        border-radius: ${style.borderRadius || 0}px;
      `
        }
    }

    return { container: base, content: '' }
}