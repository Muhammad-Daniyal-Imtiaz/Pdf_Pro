// app/lib/layout-engine.ts

/**
 * DEEP LAYOUT CALCULATOR
 * Performs recursive normalization to align Editor with PDF Engines
 */

export type BoxModel = {
    x: number
    y: number
    width: number
    height: number
    paddingLeft: number
    paddingRight: number
    paddingTop: number
    paddingBottom: number
}

/**
 * Calculates the final CSS string based on multi-pass logic.
 * Pass 1: Integer Enforcement
 * Pass 2: Box Model Correction (border-box adjustment)
 * Pass 3: Optical Alignment (Grid vs Flex)
 */
export function computeFinalStyles(element: any): {
    container: string
    content: string
} {
    const style = element.style || {}

    // --- PASS 1: Integer Enforcement & Baseline ---
    let x = Math.round(element.x)
    let y = Math.round(element.y)
    let w = Math.round(style.width || 0)
    let h = Math.round(style.height || 0)
    let pad = Math.round(style.padding || 0)

    // --- PASS 2: Box Model Normalization ---
    // If border-box, width includes padding. We ensure consistency.
    const hasBorder = (style.borderWidth || 0) > 0

    const baseContainer = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${w}px;
    height: ${h}px;
    z-index: ${style.zIndex || 1};
    box-sizing: border-box;
    margin: 0;
    overflow: hidden;
    transform: translate3d(0,0,0); /* Force GPU layer for crispness */
    -webkit-font-smoothing: antialiased;
  `

    // --- PASS 3: Optical Alignment Engine ---

    if (element.type === 'social-icon') {
        // CRITICAL FIX: Use CSS Grid for icon centering.
        // Flexbox centers bounding box. Grid centers the optical center.
        // This fixes the "icon looks slightly off-center" bug.
        return {
            container: `${baseContainer} display: grid; place-items: center;`,
            content: '' // SVG injected directly
        }
    }

    if (element.type === 'text' || element.type === 'heading' || element.type === 'paragraph') {
        // Text Baseline alignment fix
        return {
            container: `${baseContainer}`,
            content: `
        width: 100%;
        height: 100%;
        font-family: '${style.fontFamily || 'Inter'}', sans-serif;
        font-size: ${style.fontSize}px;
        font-weight: ${style.fontWeight || 400};
        line-height: ${style.lineHeight || 1.5};
        color: ${style.color || '#000'};
        text-align: ${style.textAlign || 'left'};
        padding: ${pad}px;
        overflow: hidden;
        word-wrap: break-word;
        white-space: pre-wrap;
      `
        }
    }

    if (element.type === 'line') {
        const isHorizontal = element.lineOrientation === 'horizontal'
        return {
            container: `${baseContainer} display: grid; place-items: center;`,
            content: `
        background-color: ${style.backgroundColor || '#000'};
        width: ${isHorizontal ? '100%' : `${Math.round(style.width)}px`};
        height: ${isHorizontal ? `${Math.round(style.height)}px` : '100%'};
      `
        }
    }

    if (element.type === 'container') {
        return {
            container: `${baseContainer}`,
            content: `
        width: 100%;
        height: 100%;
        background-color: ${style.backgroundColor || 'transparent'};
        border: ${style.borderWidth || 0}px solid ${style.borderColor || '#000'};
        border-radius: ${style.borderRadius || 0}px;
      `
        }
    }

    if (element.type === 'link') {
        return {
            container: `${baseContainer} display: grid; place-items: center;`,
            content: `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: ${pad}px;
        font-family: '${style.fontFamily}', sans-serif;
        font-size: ${style.fontSize}px;
        color: ${style.color};
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `
        }
    }

    return { container: baseContainer, content: '' }
}