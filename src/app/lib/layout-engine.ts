// app/lib/layout-engine.ts  ──  Smart Reflow Engine v4 (Optical Contrast + Z-Logic)
// =============================================================================

import {
    CANVAS_WIDTH_PX,
    CANVAS_HEIGHT_PX,
    CONTENT_WIDTH,
    SAFE_MARGIN_X,
    SAFE_MARGIN_Y,
    Z_LAYERS,
} from '@/lib/constants'

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface LayoutEl {
    id: string
    type: string
    x: number
    y: number
    content?: string
    iconType?: string
    lineOrientation?: string
    lineStyle?: string
    pageIndex?: number
    style: Record<string, any>
    [key: string]: any
}

export type BoxModel = {
    x: number; y: number; width: number; height: number;
    paddingLeft: number; paddingRight: number; paddingTop: number; paddingBottom: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function estimateTextHeight(el: LayoutEl): number {
    if (!['text', 'heading', 'paragraph'].includes(el.type)) {
        return typeof el.style.height === 'number' ? el.style.height : 40
    }
    const width = Math.max(40, Number(el.style.width) || CONTENT_WIDTH)
    const fontSize = Math.max(8, Number(el.style.fontSize) || 12)
    const content = String(el.content || '')
    const lineHeight = Number(el.style.lineHeight) || 1.5
    const padding = Number(el.style.padding) || 0
    const charsPerLine = Math.max(1, (width - padding * 2) / (fontSize * 0.52))
    const lines = Math.max(1, Math.ceil(content.length / charsPerLine))
    return Math.ceil(lines * fontSize * lineHeight + padding * 2 + 24)
}

function getLuminance(hex: string): number {
    const color = (hex || '#ffffff').replace('#', '');
    if (color.length !== 6) return 1;
    const r = parseInt(color.substring(0, 2), 16) || 255;
    const g = parseInt(color.substring(2, 4), 16) || 255;
    const b = parseInt(color.substring(4, 6), 16) || 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function checkOverlap(a: LayoutEl, b: LayoutEl): boolean {
    const aW = Math.max(20, Number(a.style.width) || 0);
    const aH = typeof a.style.height === 'number' ? a.style.height : estimateTextHeight(a);
    const bW = Math.max(20, Number(b.style.width) || 0);
    const bH = Math.max(20, Number(b.style.height) || 0);

    return !(
        a.x + aW < b.x ||
        a.x > b.x + bW ||
        a.y + aH < b.y ||
        a.y > b.y + bH
    );
}

function isBackgroundEl(e: LayoutEl): boolean {
    return (
        (e.type === 'shape' || e.type === 'container') &&
        Number(e.style.width) >= CANVAS_WIDTH_PX * 0.4 &&
        Number(e.style.height) >= 120
    )
}

function isFullPageEl(e: LayoutEl): boolean {
    return (
        Number(e.style.width) >= CANVAS_WIDTH_PX - 40 &&
        Number(e.style.height) >= CANVAS_HEIGHT_PX - 40
    )
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function enforceLayout(
    elements: any[],
    opts: { inputIs595?: boolean } = {}
): any[] {
    if (!Array.isArray(elements) || elements.length === 0) return []

    const scale = opts.inputIs595 ? CANVAS_WIDTH_PX / 595 : 1

    // PASS 1: Normalize & Scaling
    const normalized: LayoutEl[] = elements
        .filter(el => el && typeof el === 'object' && el.type)
        .map((el, idx) => {
            const e: LayoutEl = {
                ...el,
                id: el.id || `el-auto-${idx}`,
                x: Math.round((Number(el.x) || 0) * scale),
                y: Math.round((Number(el.y) || 0) * scale),
                style: { ...(el.style || {}) },
            }
            if (opts.inputIs595) {
                if (e.style.width) e.style.width = Math.round(Number(e.style.width) * scale)
                if (e.style.height) e.style.height = Math.round(Number(e.style.height) * scale)
                if (e.style.fontSize) e.style.fontSize = Math.round(Number(e.style.fontSize) * scale)
            }
            if (e.style.width !== 'auto') e.style.width = Number(e.style.width) || 200
            if (e.style.height !== 'auto') e.style.height = Number(e.style.height) || 40
            return e
        })

    // PASS 2: Separate Layers & Enforce Z-Index
    const backgrounds: LayoutEl[] = []
    const content: LayoutEl[] = []

    normalized.forEach(el => {
        if (isBackgroundEl(el)) {
            el.x = Math.max(0, Math.min(el.x, 80))
            el.y = Math.max(0, Math.min(el.y, 80))
            el.style.zIndex = isFullPageEl(el) ? Z_LAYERS.BACKGROUND : Z_LAYERS.BANNER
            backgrounds.push(el)
        } else {
            // Content Z-Indices (Always on top of backgrounds)
            switch (el.type) {
                case 'shape': el.style.zIndex = Z_LAYERS.SHAPE; break
                case 'image': el.style.zIndex = Z_LAYERS.IMAGE; break
                case 'line': el.style.zIndex = Z_LAYERS.LINE; break
                case 'text':
                case 'paragraph': el.style.zIndex = Z_LAYERS.TEXT; break
                case 'heading': el.style.zIndex = Z_LAYERS.HEADING; break
                case 'social-icon': el.style.zIndex = Z_LAYERS.ICON; break
                default: el.style.zIndex = Z_LAYERS.TEXT;
            }
            content.push(el)
        }
    })

    // PASS 3: Smart Reflow (Column-aware)
    content.sort((a, b) => a.y - b.y)
    const COL_BUCKET = 200
    const colCursors: Record<number, number> = {}

    content.forEach(el => {
        if (['text', 'heading', 'paragraph'].includes(el.type)) {
            el.style.resizeMode = 'auto-height'
            el.style.overflow = 'visible'
            el.style.minHeight = estimateTextHeight(el)
            if (typeof el.style.height !== 'number' || el.style.height < el.style.minHeight) {
                el.style.height = el.style.minHeight
            }
            if (!el.style.color || el.style.color === 'transparent') el.style.color = '#1a1a1a'
        }

        if (el.type === 'social-icon') {
            const sz = Math.max(20, Math.min(Number(el.style.width) || 24, 48))
            el.style.width = el.style.height = sz
        }

        // X clamping
        el.x = Math.max(SAFE_MARGIN_X - 20, Math.min(el.x, CANVAS_WIDTH_PX - 40))
        el.style.width = Math.min(Number(el.style.width) || 100, CANVAS_WIDTH_PX - el.x)

        // Vertical Reflow
        const colKey = Math.floor(el.x / COL_BUCKET)
        const cursorY = colCursors[colKey] ?? SAFE_MARGIN_Y
        if (el.y < cursorY + 8) el.y = cursorY + 8

        const elH = typeof el.style.height === 'number' ? el.style.height : 40
        colCursors[colKey] = el.y + elH
    })

    // PASS 3.5: Optical Contrast Fix (Text on Dark Shapes)
    content.forEach(el => {
        if (['text', 'heading', 'paragraph'].includes(el.type)) {
            const sortedBg = [...backgrounds].sort((a, b) => (b.style.zIndex ?? 0) - (a.style.zIndex ?? 0));
            for (const bg of sortedBg) {
                if (checkOverlap(el, bg)) {
                    const bgLuminance = getLuminance(bg.style.backgroundColor);
                    if (bgLuminance < 0.45) {
                        el.style.color = '#ffffff';
                        el.style.textShadow = '0 1px 2px rgba(0,0,0,0.2)';
                    }
                    break;
                }
            }
        }
    })

    // PASS 4: Final Clamp
    content.forEach(el => {
        if (el.y > CANVAS_HEIGHT_PX - 50) el.y = CANVAS_HEIGHT_PX - 100
    })

    return [
        ...backgrounds,
        ...content.sort((a, b) => (a.style.zIndex ?? 0) - (b.style.zIndex ?? 0)),
    ]
}

// ─── Backward compat ─────────────────────────────────────────────────────────

export function computeFinalStyles(element: any): { container: string; content: string } {
    const s = element.style || {}
    const x = Math.round(element.x || 0)
    const y = Math.round(element.y || 0)
    const w = Math.round(s.width || 0)
    const h = Math.round(s.height || 0)
    const pad = Math.round(s.padding || 0)
    const z = s.zIndex ?? 1

    const base = `
    position: absolute; left: ${x}px; top: ${y}px;
    width: ${w}px; min-height: ${h}px; height: auto;
    z-index: ${z}; box-sizing: border-box; margin: 0;
    overflow: visible; -webkit-font-smoothing: antialiased;
  `

    if (element.type === 'social-icon') {
        return { container: `${base} display: grid; place-items: center;`, content: '' }
    }
    if (['text', 'heading', 'paragraph'].includes(element.type)) {
        return {
            container: base,
            content: `
        width: 100%; height: auto; min-height: 100%;
        font-family: '${s.fontFamily || 'Inter'}', sans-serif;
        font-size: ${s.fontSize || 12}px; font-weight: ${s.fontWeight || 400};
        line-height: ${s.lineHeight || 1.5}; color: ${s.color || '#000'};
        text-align: ${s.textAlign || 'left'}; padding: ${pad}px;
        overflow: visible; word-wrap: break-word; white-space: pre-wrap;
        text-shadow: ${s.textShadow || 'none'};
      `
        }
    }
    if (element.type === 'line') {
        const isH = element.lineOrientation === 'horizontal'
        return {
            container: `${base} display: grid; place-items: center;`,
            content: `
        background-color: ${s.backgroundColor || '#000'};
        width: ${isH ? '100%' : `${Math.round(s.width)}px`};
        height: ${isH ? `${Math.round(s.height)}px` : '100%'};
      `
        }
    }
    return { container: base, content: '' }
}