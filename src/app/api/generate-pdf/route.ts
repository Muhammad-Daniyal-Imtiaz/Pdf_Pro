// app/api/generate-pdf/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// PIXEL-PERFECT WYSIWYG PDF RENDERER v3
// What users see in the editor = what they get in the PDF
// Uses Puppeteer with an HTML renderer that EXACTLY matches PDFRenderer.tsx styles
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import { z } from 'zod'
import { CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ─── Icon SVGs (matching SocialIcons.tsx colors exactly) ──────────────────────
const ICON_SVGS: Record<string, string> = {
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#0A66C2" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  email: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#EA4335" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="m22 7-10 7L2 7"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.91a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 1 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 1 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#181717" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#1DA1F2" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`,
  website: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#6366F1" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#EF4444" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#F59E0B" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#6B7280" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#E4405F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#FF0000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#25D366" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#1877F2" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  external: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#6366F1" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#3B82F6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  award: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#F59E0B" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#EAB308" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="#EC4899" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── CRITICAL: Element HTML generator — MUST match PDFRenderer.tsx exactly ────
function generateElementHTML(el: any): string {
  const s = el.style || {}
  const x = Math.round(el.x || 0)
  const y = Math.round(el.y || 0)
  const w = Math.round(s.width || 100)
  const h = Math.round(s.height || 40)
  const zIndex = s.zIndex ?? 2
  const rotation = s.rotation ? `rotate(${s.rotation}deg)` : ''
  const opacity = s.opacity ?? 1
  const borderRadius = s.borderRadius ? `${s.borderRadius}px` : '0'
  const border = s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor || '#ccc'}` : 'none'
  const boxShadow = s.boxShadow || 'none'

  const baseStyle = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${w}px;
    height: ${h}px;
    z-index: ${zIndex};
    opacity: ${opacity};
    border-radius: ${borderRadius};
    border: ${border};
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    box-shadow: ${boxShadow};
    ${rotation ? `transform: ${rotation};` : ''}
    ${rotation ? `transform-origin: top left;` : ''}
  `.replace(/\s+/g, ' ')

  switch (el.type) {
    case 'text':
    case 'heading':
    case 'paragraph': {
      const fontSize = Math.max(7, Math.min(72, s.fontSize || 12))
      const fontWeight = s.fontWeight || 400
      const color = s.color || '#000000'
      const fontFamily = s.fontFamily || 'Arial, sans-serif'
      const textAlign = s.textAlign || 'left'
      const lineHeight = s.lineHeight || 1.4
      const padding = s.padding || 0
      const bgColor = s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : 'transparent'
      const fontStyle = s.fontStyle || 'normal'
      const letterSpacing = s.letterSpacing ? `${s.letterSpacing}px` : 'normal'
      // Encode newlines as <br>
      const htmlContent = escapeHtml(el.content || '').replace(/\n/g, '<br>')

      return `<div style="${baseStyle}
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        color: ${color};
        font-family: ${fontFamily};
        text-align: ${textAlign};
        line-height: ${lineHeight};
        padding: ${padding}px;
        background-color: ${bgColor};
        font-style: ${fontStyle};
        letter-spacing: ${letterSpacing};
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
        overflow: visible;
        min-height: ${h}px;
        height: auto;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: geometricPrecision;">${htmlContent}</div>`
    }

    case 'shape':
    case 'container': {
      const bgColor = s.backgroundColor || '#f0f0f0'
      return `<div style="${baseStyle}
        background-color: ${bgColor};"></div>`
    }

    case 'line': {
      const lineColor = s.backgroundColor || '#000000'
      const isHorizontal = el.lineOrientation !== 'vertical'
      const lineStyle = el.lineStyle || 'solid'

      if (lineStyle !== 'solid') {
        // Dashed/dotted lines use border technique
        const thickness = isHorizontal ? h : w
        return `<div style="${baseStyle} background-color: transparent;">
          <div style="
            position: absolute;
            ${isHorizontal ? `width: ${w}px; height: 0; top: 50%; left: 0; border-top: ${thickness}px ${lineStyle} ${lineColor};` : `height: ${h}px; width: 0; left: 50%; top: 0; border-left: ${thickness}px ${lineStyle} ${lineColor};`}
          "></div>
        </div>`
      }
      return `<div style="${baseStyle}
        background-color: ${lineColor};"></div>`
    }

    case 'image': {
      const bgColor = s.backgroundColor || '#f3f4f6'
      if (el.content && el.content.startsWith('data:')) {
        // Real image (base64)
        const objectFit = el.isBackground ? 'contain' : 'cover'
        return `<div style="${baseStyle} background-color: ${bgColor}; overflow: hidden;">
          <img src="${el.content}" style="width:100%;height:100%;object-fit:${objectFit};display:block;" />
        </div>`
      }
      // Placeholder
      return `<div style="${baseStyle}
        background-color: ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>`
    }

    case 'social-icon': {
      const iconType = el.iconType || 'user'
      const iconSvg = ICON_SVGS[iconType] || ICON_SVGS.user
      return `<div style="${baseStyle}
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;">
        ${iconSvg}
      </div>`
    }

    case 'link': {
      const fontSize = s.fontSize || 12
      const color = s.color || '#6366f1'
      const fontFamily = s.fontFamily || 'Arial, sans-serif'
      return `<div style="${baseStyle}
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: ${fontSize}px;
        color: ${color};
        font-family: ${fontFamily};
        padding: 4px;
        overflow: hidden;">
        ${ICON_SVGS.external}
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(el.content || '')}</span>
      </div>`
    }

    default:
      return ''
  }
}

// ─── Generate full page HTML (mirrors editor canvas exactly) ─────────────────
function generatePageHTML(elements: any[], width: number, height: number, pageIndex: number): string {
  // Sort by zIndex so rendering order matches browser (painter's algorithm)
  const sorted = [...elements].sort((a, b) => ((a.style?.zIndex ?? 0) - (b.style?.zIndex ?? 0)))

  return `
    <div class="page-clip" style="
      position: relative;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
      box-sizing: border-box;
    ">
      <div class="page" style="
        position: relative;
        width: ${width}px;
        height: ${height}px;
        overflow: visible;
        background: white;
        box-sizing: border-box;
      ">
        ${sorted.map(el => generateElementHTML(el)).join('\n')}
      </div>
    </div>
  `
}

// ─── Chrome discovery ─────────────────────────────────────────────────────────
async function findChrome(): Promise<string> {
  if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH
  const { platform } = process
  if (platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ]
    for (const p of paths) {
      try {
        const { existsSync } = await import('fs')
        if (existsSync(p)) return p
      } catch { }
    }
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  }
  if (platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  // Linux — try multiple paths
  for (const path of ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    try {
      const { existsSync } = await import('fs')
      if (existsSync(path)) return path
    } catch { }
  }
  return '/usr/bin/google-chrome'
}

// ─── Zod validation ───────────────────────────────────────────────────────────
const ElementSchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number(),
  y: z.number(),
  content: z.string().max(500000).optional(), // base64 images can be large
  style: z.object({
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
    fontSize: z.number().max(300).optional(),
    fontFamily: z.string().max(200).optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    color: z.string().max(50).optional(),
    backgroundColor: z.string().max(50).optional(),
    textAlign: z.string().max(20).optional(),
    lineHeight: z.number().optional(),
    padding: z.number().optional(),
    zIndex: z.number().optional(),
    borderRadius: z.number().optional(),
    borderWidth: z.number().optional(),
    borderColor: z.string().max(50).optional(),
    opacity: z.number().optional(),
    rotation: z.number().optional(),
    fontStyle: z.string().max(20).optional(),
    letterSpacing: z.number().optional(),
    boxShadow: z.string().max(200).optional(),
  }).passthrough(),
  pageIndex: z.number(),
  iconType: z.string().max(50).optional(),
  lineOrientation: z.string().max(20).optional(),
  lineStyle: z.string().max(20).optional(),
  isBackground: z.boolean().optional(),
}).passthrough()

const RequestSchema = z.object({
  pages: z.array(z.object({
    id: z.string().optional(),
    elements: z.array(ElementSchema).max(500),
  })).max(50).optional(),
  imageDataUrl: z.string().optional(), // Fallback for screenshot-based generation
  title: z.string().max(500).optional(),
  width: z.number().min(100).max(3000).optional(),
  height: z.number().min(100).max(5000).optional(),
})

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let browser: any = null

  try {
    const rawBody = await request.json()
    const parsed = RequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: parsed.error.errors
      }, { status: 400 })
    }

    const { pages, imageDataUrl, title = 'document', width = CANVAS_WIDTH_PX, height = CANVAS_HEIGHT_PX } = parsed.data
    const pageW = Math.ceil(width)
    const pageH = Math.ceil(height)

    const executablePath = await findChrome()

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--font-render-hinting=none',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--no-first-run',
        '--no-zygote',
        '--disable-accelerated-2d-canvas',
        '--disable-renderer-backgrounding',
        '--mute-audio',
        '--hide-scrollbars',
      ]
    })

    const page = await browser.newPage()

    // Match device pixel ratio to screen (1:1 for WYSIWYG)
    await page.setViewport({
      width: pageW,
      height: pageH,
      deviceScaleFactor: 1,
    })

    let fullHTML = ''

    if (imageDataUrl) {
      // SCREENSHOT RENDER PATH (Used by PDFPreview.tsx)
      console.log('[generate-pdf] Using image-based render path')
      fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body, html { margin: 0; padding: 0; width: ${pageW}px; height: ${pageH}px; overflow: hidden; }
    img { width: 100%; height: 100%; object-fit: contain; display: block; }
  </style>
</head>
<body>
  <img src="${imageDataUrl}" />
</body>
</html>`
    } else if (pages && pages.length > 0) {
      // ELEMENT RENDER PATH (Used by AIContentGenerator.tsx)
      console.log(`[generate-pdf] Using element-based render path (${pages.length} pages)`)
      const pagesHTML = pages.map((pageData: any, idx: number) =>
        generatePageHTML(pageData.elements || [], pageW, pageH, idx)
      ).join('\n')

      fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page setup ── */
    @page {
      size: ${pageW}px ${pageH}px;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      width: ${pageW}px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* ── Font rendering — matches browser exactly ── */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
      font-synthesis: none;
    }

    /* ── Page break control ── */
    .page-clip {
      page-break-after: always;
      page-break-inside: avoid;
    }
    .page-clip:last-child { page-break-after: auto; }

    /* ── Inner page: overflow visible so z-indexed heading text is never clipped ── */
    .page {
      overflow: visible !important;
    }
  </style>

  <!-- Load same fonts as editor (Inter) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Georgia&display=swap" rel="stylesheet">
</head>
<body>
  ${pagesHTML}
</body>
</html>`
    } else {
      throw new Error('No pages or imageDataUrl provided')
    }

    await page.setContent(fullHTML, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    })

    // Wait for fonts to load if using element path
    if (!imageDataUrl) {
      await page.evaluate(() => (document as any).fonts.ready)
      await new Promise(r => setTimeout(r, 500))
    }

    // ── Generate PDF ────────────────────────────────────────────────────────────
    const pdfBuffer = await page.pdf({
      width: `${pageW}px`,
      height: `${pageH}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1.0,
      displayHeaderFooter: false,
      preferCSSPageSize: false,
    })

    await browser.close()
    browser = null

    // ── Return PDF ──────────────────────────────────────────────────────────────
    const safeFilename = (title || 'document')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80) || 'document'

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Content-Length': String((pdfBuffer as any).length),
        'Cache-Control': 'no-store, max-age=0',
        'X-Pages': String(pages?.length || 1),
      }
    })

  } catch (error: any) {
    console.error('[generate-pdf] Error:', error)
    if (browser) {
      try { await browser.close() } catch { }
    }
    return NextResponse.json(
      { error: 'PDF generation failed', details: error.message || String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready — WYSIWYG PDF Renderer v3',
    features: ['Pixel-perfect WYSIWYG', 'Font matching', 'All element types', 'Multi-page'],
    endpoint: '/api/generate-pdf',
    method: 'POST'
  })
}