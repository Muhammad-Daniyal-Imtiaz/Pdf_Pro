// word-generator.ts — Generates real .docx files using the 'docx' library
import {
    Document,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    HeadingLevel,
    BorderStyle,
    Packer,
    ISectionOptions,
    ExternalHyperlink,
    FrameWrap,
    FrameAnchorType,
    TextWrappingType,
    TextWrappingSide,
    ShadingType,
} from 'docx'
import { EditorPage, EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import { ICON_SVGS } from './html-generator'

// Points conversion
const PX_TO_HALF_PT = 1.5
const PX_TO_EMU = 9525 // 1 px = 9525 EMUs

function hexToRgb(hex: string): string {
    return hex.replace('#', '').slice(0, 6)
}

function getAlignment(textAlign?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
    switch (textAlign) {
        case 'center': return AlignmentType.CENTER
        case 'right': return AlignmentType.RIGHT
        case 'justify': return AlignmentType.JUSTIFIED
        default: return AlignmentType.LEFT
    }
}

function getFontWeight(fw?: string | number): boolean {
    if (!fw) return false
    if (typeof fw === 'number') return fw >= 600
    return fw === 'bold' || fw === '700' || fw === '800' || fw === '900'
}

/** Build the frame positioning object — reused for all absolutely-positioned elements */
function makeFrame(el: EditorElement) {
    return {
        type: "absolute" as const,
        position: {
            x: Math.round(el.x * 15), // x/y in twips (1px ≈ 15 twips)
            y: Math.round(el.y * 15),
        },
        width: Math.round(el.style.width * 15),
        height: Math.round(el.style.height * 15),
        anchor: {
            horizontal: FrameAnchorType.PAGE,
            vertical: FrameAnchorType.PAGE,
        },
        wrap: FrameWrap.NONE,
    }
}

/** Converts an SVG string to a PNG Base64 Data URI using a temporary canvas */
async function svgToPng(svgString: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
            resolve('') // Fallback for server-side (though this runs in browser)
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            reject('Could not get canvas context')
            return
        }

        canvas.width = width * 2 // Higher density for better quality
        canvas.height = height * 2

        const img = new Image()
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
            ctx.scale(2, 2)
            ctx.drawImage(img, 0, 0, width, height)
            URL.revokeObjectURL(url)
            resolve(canvas.toDataURL('image/png'))
        }

        img.onerror = (err) => {
            URL.revokeObjectURL(url)
            reject(err)
        }

        img.src = url
    })
}

/** Renders a text-based element (heading, paragraph, text) */
function renderTextElement(el: EditorElement): Paragraph {
    const style = el.style
    const isHeading = el.type === 'heading'
    const lines = (el.content || '').split('\n')

    const children: TextRun[] = []
    lines.forEach((line, i) => {
        if (i > 0) {
            children.push(new TextRun({ break: 1 }))
        }
        children.push(new TextRun({
            text: line,
            font: style.fontFamily || 'Arial',
            size: (style.fontSize || (isHeading ? 24 : 14)) * PX_TO_HALF_PT,
            bold: isHeading ? true : getFontWeight(style.fontWeight),
            color: hexToRgb(style.color || '#000000'),
        }))
    })

    return new Paragraph({
        children,
        alignment: getAlignment(style.textAlign),
        heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
        spacing: {
            line: Math.round((style.lineHeight || 1.5) * 240),
        },
        frame: makeFrame(el),
    })
}

/** Renders a social icon element using a PNG-converted SVG */
async function renderSocialIcon(el: EditorElement): Promise<Paragraph> {
    const style = el.style
    const iconType = el.iconType || 'user'
    const iconSVG = ICON_SVGS[iconType] || ICON_SVGS.user
    const iconSize = Math.min(style.width, style.height)

    const children: (TextRun | ImageRun)[] = []

    try {
        const pngDataUri = await svgToPng(iconSVG, iconSize, iconSize)
        const base64Data = pngDataUri.split(',')[1]
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

        children.push(new ImageRun({
            data: imageBuffer,
            transformation: {
                width: iconSize,
                height: iconSize,
            },
            type: 'png',
        }))
    } catch (err) {
        console.error('Failed to render icon as PNG:', err)
        // Fallback to text symbol
        children.push(new TextRun({ text: '● ', size: style.fontSize || 14 }))
    }

    if (el.content) {
        children.push(new TextRun({
            text: ' ' + el.content,
            font: style.fontFamily || 'Arial',
            size: (style.fontSize ? style.fontSize * 0.7 : 10) * PX_TO_HALF_PT,
            color: hexToRgb(style.color || '#374151'),
        }))
    }

    return new Paragraph({
        children,
        frame: makeFrame(el),
    })
}

/** Renders a line element using a paragraph with a thick border or shading */
function renderLine(el: EditorElement): Paragraph {
    const style = el.style
    const color = hexToRgb(style.backgroundColor || '#000000')
    const isHorizontal = el.lineOrientation === 'horizontal'

    // For solid lines, shading (background) is more reliable than borders
    const isSolid = !el.lineStyle || el.lineStyle === 'solid'

    if (isSolid) {
        return new Paragraph({
            children: [new TextRun("")],
            shading: {
                fill: color,
                type: ShadingType.CLEAR,
            },
            frame: makeFrame(el),
        })
    } else {
        // Dashed/Dotted lines use borders
        let borderStyleVal: (typeof BorderStyle)[keyof typeof BorderStyle] = BorderStyle.SINGLE
        if (el.lineStyle === 'dashed') borderStyleVal = BorderStyle.DASH_DOT_STROKED
        if (el.lineStyle === 'dotted') borderStyleVal = BorderStyle.DOTTED

        const thickness = isHorizontal
            ? Math.max(1, Math.round(style.height * PX_TO_HALF_PT * 4))
            : Math.max(1, Math.round(style.width * PX_TO_HALF_PT * 4))

        const borderDef = {
            style: borderStyleVal,
            size: Math.min(thickness, 96),
            color: color,
        }

        return new Paragraph({
            children: [new TextRun("")],
            border: isHorizontal ? { bottom: borderDef } : { left: borderDef },
            frame: makeFrame(el),
        })
    }
}

/** Renders an image element (base64 images only) */
function renderImage(el: EditorElement): Paragraph | null {
    if (!el.content) return null

    try {
        const base64Match = el.content.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/i)
        if (!base64Match) return null

        const imageData = base64Match[2]
        const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))

        const imageRun = new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: {
                width: Math.round(el.style.width),
                height: Math.round(el.style.height),
            },
            floating: {
                horizontalPosition: {
                    relative: 'page' as any,
                    offset: Math.round(el.x * PX_TO_EMU),
                },
                verticalPosition: {
                    relative: 'page' as any,
                    offset: Math.round(el.y * PX_TO_EMU),
                },
                wrap: {
                    type: TextWrappingType.NONE,
                    side: TextWrappingSide.BOTH_SIDES,
                },
            },
        })

        return new Paragraph({ children: [imageRun] })
    } catch (err) {
        console.error('Failed to process image for Word:', err)
        return null
    }
}

/** Renders a link element */
function renderLink(el: EditorElement): Paragraph {
    const style = el.style

    return new Paragraph({
        children: [
            new TextRun({
                text: '🔗 ',
                font: 'Segoe UI Emoji',
                size: (style.fontSize || 14) * PX_TO_HALF_PT,
            }),
            new ExternalHyperlink({
                children: [
                    new TextRun({
                        text: el.content || el.url || 'Link',
                        font: style.fontFamily || 'Arial',
                        size: (style.fontSize || 14) * PX_TO_HALF_PT,
                        color: hexToRgb(style.color || '0066cc'),
                        underline: style.linkDecoration === 'underline' ? {} : undefined,
                    }),
                ],
                link: el.url || '#',
            }),
        ],
        frame: makeFrame(el),
    })
}

/** Renders a container element */
function renderContainer(el: EditorElement): Paragraph {
    const style = el.style
    const lines = (el.content || '').split('\n')

    const children: TextRun[] = []
    lines.forEach((line, i) => {
        if (i > 0) {
            children.push(new TextRun({ break: 1 }))
        }
        children.push(new TextRun({
            text: line,
            font: style.fontFamily || 'Arial',
            size: (style.fontSize || 14) * PX_TO_HALF_PT,
            color: hexToRgb(style.color || '#000000'),
        }))
    })

    const bgColor = style.backgroundColor && style.backgroundColor !== 'transparent'
        ? hexToRgb(style.backgroundColor)
        : undefined

    const borderColor = hexToRgb(style.borderColor || '#000')

    return new Paragraph({
        children,
        alignment: getAlignment(style.textAlign),
        spacing: {
            line: Math.round((style.lineHeight || 1.5) * 240),
        },
        shading: bgColor ? { fill: bgColor } : undefined,
        border: style.borderWidth ? {
            top: { style: BorderStyle.SINGLE, size: (style.borderWidth || 1) * 2, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: (style.borderWidth || 1) * 2, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: (style.borderWidth || 1) * 2, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: (style.borderWidth || 1) * 2, color: borderColor },
        } : undefined,
        frame: makeFrame(el),
    })
}

/** Render a single element to a docx Paragraph */
async function renderElement(el: EditorElement): Promise<Paragraph | null> {
    switch (el.type) {
        case 'heading':
        case 'paragraph':
        case 'text':
            return renderTextElement(el)
        case 'social-icon':
            return await renderSocialIcon(el)
        case 'line':
            return renderLine(el)
        case 'image':
            return renderImage(el)
        case 'link':
            return renderLink(el)
        case 'container':
            return renderContainer(el)
        default:
            return null
    }
}

/** Generate a proper .docx Word document from the editor pages */
export async function generateWordDocument(
    pages: EditorPage[],
    title: string,
    width: number = A4_WIDTH,
    height: number = A4_HEIGHT
): Promise<Blob> {
    const pageWidthTwips = Math.round(width * 15)
    const pageHeightTwips = Math.round(height * 15)

    const sections: ISectionOptions[] = []

    for (const page of pages) {
        const paragraphs: Paragraph[] = []

        // Sort elements by z-index for layering
        const sortedElements = [...page.elements].sort(
            (a, b) => (a.style.zIndex || 1) - (b.style.zIndex || 1)
        )

        for (const el of sortedElements) {
            const para = await renderElement(el)
            if (para) paragraphs.push(para)
        }

        if (paragraphs.length === 0) {
            paragraphs.push(new Paragraph({ children: [] }))
        }

        sections.push({
            properties: {
                page: {
                    size: {
                        width: pageWidthTwips,
                        height: pageHeightTwips,
                    },
                    margin: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                    },
                },
            },
            children: paragraphs,
        })
    }

    const doc = new Document({
        title: title,
        creator: 'PDF Pro Editor',
        description: `Document: ${title}`,
        sections,
    })

    return await Packer.toBlob(doc)
}
