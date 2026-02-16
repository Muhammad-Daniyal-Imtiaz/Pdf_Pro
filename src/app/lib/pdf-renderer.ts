import { EditorElement } from '@/app/store/useEditorStore'

interface RenderContext {
    scale?: number
    isPDF?: boolean
}

// Character width estimates for text measurement (in pixels per font-size unit)
const CHAR_WIDTH_FACTORS: Record<number, number> = {
    300: 0.45,  // Light
    400: 0.50,  // Normal
    500: 0.52,  // Medium
    600: 0.55,  // Semibold
    700: 0.60,  // Bold
}

function getCharWidthFactor(fontWeight: number | string | undefined): number {
    const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) || 400 : fontWeight || 400
    return CHAR_WIDTH_FACTORS[weight] || 0.50
}

/**
 * Calculates the actual height needed for text content
 * Used for WYSIWYG PDF generation
 */
function calculateTextHeight(
    content: string,
    style: any,
    scale: number = 1
): number {
    const fontSize = (style.fontSize || 14) * scale
    const fontWeight = style.fontWeight || 400
    const lineHeight = style.lineHeight || 1.5
    const padding = (style.padding || 0) * 2 * scale
    const width = (style.width || 200) * scale
    
    if (!content) return fontSize * lineHeight + padding
    
    const charWidth = fontSize * getCharWidthFactor(fontWeight)
    const avgCharsPerLine = Math.max(1, Math.floor(width / charWidth))
    const lines = content.split('\n')
    let totalLines = 0
    
    lines.forEach(line => {
        const lineCount = Math.ceil(line.length / avgCharsPerLine)
        totalLines += Math.max(1, lineCount)
    })
    
    return Math.ceil(totalLines * fontSize * lineHeight + padding)
}

/**
 * Determines if element should use auto-height behavior
 */
function shouldAutoHeight(el: EditorElement): boolean {
    if (!['heading', 'paragraph', 'text', 'container'].includes(el.type)) {
        return false
    }
    const resizeMode = el.style?.resizeMode
    return resizeMode === 'auto-height' || resizeMode === 'auto-both' || el.isAIGenerated === true
}

const ICON_SVGS: Record<string, string> = {
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#0077b5" stroke-width="2" fill="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
    email: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#EA4335" stroke-width="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="m22 6-10 7L2 6"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#10B981" stroke-width="2" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 1 .7 2.81 2 2 0 0 1-.45 2.11"/><path d="M18 2h.01"/></svg>`,
    twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#1DA1F2" stroke-width="2" fill="none"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`,
    github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#333333" stroke-width="2" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#6366F1" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#E4405F" stroke-width="2" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#1877F2" stroke-width="2" fill="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#FF0000" stroke-width="2" fill="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
    whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#25D366" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    location: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#EF4444" stroke-width="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#F59E0B" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#6B7280" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#10B981" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    external: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#6366F1" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#EF4444" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#F59E0B" stroke-width="2" fill="#F59E0B" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="#EC4899" stroke-width="2" fill="#EC4899" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
}

export function generateElementHTML(
    el: EditorElement,
    context: RenderContext = {}
): string {
    const { scale = 1, isPDF = false } = context
    const style = el.style || {} as any
    
    // CRITICAL: For auto-height elements, calculate actual height based on content
    const isAutoHeight = shouldAutoHeight(el)
    const actualHeight = isAutoHeight 
        ? calculateTextHeight(el.content || '', style, scale)
        : (style.height || 40) * scale

    const baseStyles: any = {
        position: 'absolute',
        left: `${el.x * scale}px`,
        top: `${el.y * scale}px`,
        width: `${style.width * scale}px`,
        height: `${actualHeight}px`, // Use calculated height for auto-height
        fontFamily: style.fontFamily || 'Inter, Arial, sans-serif',
        fontSize: `${(style.fontSize || 14) * scale}px`,
        fontWeight: style.fontWeight || 'normal',
        fontStyle: style.fontStyle || 'normal',
        color: style.color || '#000000',
        lineHeight: style.lineHeight || 1.5,
        textAlign: style.textAlign || 'left',
        padding: `${(style.padding || 0) * scale}px`,
        zIndex: style.zIndex || 1,
        opacity: style.opacity || 1,
        transform: style.rotation ? `rotate(${style.rotation}deg)` : undefined,
        transformOrigin: 'top left',
        backgroundColor: style.backgroundColor || 'transparent',
        border: style.borderWidth ? `${style.borderWidth * scale}px solid ${style.borderColor || '#000'}` : 'none',
        borderRadius: `${(style.borderRadius || 0) * scale}px`,
        boxSizing: 'border-box',
        display: 'block', // Changed from flex to block for text flow
        '-webkit-font-smoothing': 'antialiased',
        'text-rendering': 'optimizeLegibility',
        overflow: 'visible', // Allow content to be fully visible
        'white-space': 'pre-wrap',
        'word-wrap': 'break-word',
        'overflow-wrap': 'break-word',
    }

    // Convert styles to CSS string
    const styleString = Object.entries(baseStyles)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m: string) => `-${m.toLowerCase()}`)}: ${v}`)
        .join('; ')

    const content = escapeHtml(el.content || '')

    switch (el.type) {
        case 'heading':
        case 'paragraph':
        case 'text':
        case 'container':
            // For auto-height elements, render content with line breaks and proper wrapping
            return `<div style="${styleString}">${content.replace(/\n/g, '<br>')}</div>`

        case 'image':
            return el.content
                ? `<div style="${styleString}; overflow: hidden; height: ${(style.height || 150) * scale}px;"><img src="${el.content}" style="width: 100%; height: 100%; object-fit: contain; display: block;" /></div>`
                : `<div style="${styleString}"></div>`

        case 'social-icon':
            const iconSVG = ICON_SVGS[el.iconType || 'user'] || ICON_SVGS.user
            const iconSize = Math.min(style.width, style.height) * 0.8 * scale
            return `
        <div style="${styleString}; justify-content: center; align-items: center;">
          <div style="width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center;">
            ${iconSVG}
          </div>
        </div>
      `

        case 'line':
            const isHorizontal = el.lineOrientation === 'horizontal'
            let lineStyleCss = `background-color: transparent;`
            if (!el.lineStyle || el.lineStyle === 'solid') {
                lineStyleCss = `background-color: ${style.backgroundColor || '#000000'};`
            } else {
                if (isHorizontal) lineStyleCss += `border-top: ${style.height * scale}px ${el.lineStyle} ${style.backgroundColor || '#000000'};`
                else lineStyleCss += `border-left: ${style.width * scale}px ${el.lineStyle} ${style.backgroundColor || '#000000'};`
            }
            return `<div style="${styleString}; ${lineStyleCss}"></div>`

        case 'link':
            return `
        <a href="${el.url || '#'}" target="_blank" style="${styleString}; text-decoration: ${style.linkDecoration || 'none'}; color: ${style.color || '#0066cc'}; align-items: center;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${content}</span>
        </a>
      `

        default:
            return `<div style="${styleString}">${content}</div>`
    }
}

export function escapeHtml(text: string): string {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
}
