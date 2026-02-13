// app/api/edit-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import puppeteer from 'puppeteer-core'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

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

async function findChrome(): Promise<string> {
    if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH
    const platform = process.platform
    if (platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    if (platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    return '/usr/bin/google-chrome'
}

function escapeHtml(text: string): string {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
}

function generatePageHTML(elements: any[], width: number, height: number): string {
    const renderElement = (el: any) => {
        // SKIP IMPORTED ELEMENTS (Background PDF)
        if (el.isImported) return ''

        const style = el.style || {}
        const content = escapeHtml(el.content || '')

        let elementHTML = ''

        switch (el.type) {
            case 'heading':
            case 'paragraph':
            case 'list':
            case 'text':
            case 'container':
                // For container/text, we render the same box model
                elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            font-family: ${style.fontFamily || 'Arial, sans-serif'};
            font-size: ${style.fontSize || 14}px;
            font-weight: ${style.fontWeight || 'normal'};
            color: ${style.color || '#000000'};
            line-height: ${style.lineHeight || 1.5};
            text-align: ${style.textAlign || 'left'};
            padding: ${style.padding || 0}px;
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
            transform-origin: top left;
            background-color: ${style.backgroundColor || 'transparent'};
            border: ${style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || '#000'}` : 'none'};
            border-radius: ${style.borderRadius || 0}px;
            display: flex;
            align-items: flex-start; /* content alignment */
          ">${content}</div>
        `
                break

            case 'image':
                elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
            transform-origin: top left;
            overflow: hidden;
            border-radius: ${style.borderRadius || 0}px;
            border: ${style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || '#000'}` : 'none'};
          ">
            ${el.content ? `<img src="${el.content}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />` : ``}
          </div>
        `
                break

            case 'social-icon':
                const iconSVG = ICON_SVGS[el.iconType] || ICON_SVGS.user
                const iconSize = Math.min(style.width, style.height) * 0.8
                elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
            transform-origin: top left;
          ">
            <div style="
              width: ${iconSize}px;
              height: ${iconSize}px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">${iconSVG}</div>
          </div>
        `
                break

            case 'rect':
            case 'circle':
                // Mapping shapes to divs
                const isCircle = el.type === 'circle';
                elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            background-color: ${style.backgroundColor || 'transparent'};
            border: ${style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || '#000'}` : 'none'};
            border-radius: ${isCircle ? '50%' : `${style.borderRadius || 0}px`};
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
            transform-origin: top left;
          "></div>
         `
                break;

            case 'line':
                const isHorizontal = el.lineOrientation === 'horizontal'
                let lineStyleCss = `background-color: transparent;`
                if (!el.lineStyle || el.lineStyle === 'solid') {
                    lineStyleCss = `background-color: ${style.backgroundColor || '#000000'};`
                } else {
                    if (isHorizontal) lineStyleCss += `border-top: ${style.height}px ${el.lineStyle} ${style.backgroundColor || '#000000'};`
                    else lineStyleCss += `border-left: ${style.width}px ${el.lineStyle} ${style.backgroundColor || '#000000'};`
                }

                elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            ${lineStyleCss}
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
            transform-origin: top left;
          "></div>
        `
                break
        }
        return elementHTML
    }

    // TRANSPARENT BACKGROUND FOR OVERLAY
    return `
    <div style="position: relative; width: ${width}px; height: ${height}px; overflow: hidden; background: transparent;">
      ${elements.map(renderElement).join('')}
    </div>
  `
}

export async function POST(request: NextRequest) {
    let browser = null
    try {
        const body = await request.json()
        const { originalPdf, elements, title = 'edited-document' } = body

        if (!originalPdf) {
            return NextResponse.json({ error: 'No original PDF provided' }, { status: 400 })
        }

        // A. Load Original PDF
        const pdfBytes = Buffer.from(originalPdf, 'base64')
        const originalDoc = await PDFDocument.load(pdfBytes)

        // B. Group elements by page
        // Ensure we handle arrays properly
        const pagesElements: any[][] = Array(originalDoc.getPageCount()).fill(null).map(() => [])

        elements.forEach((el: any) => {
            const pIdx = Math.min(el.pageIndex || 0, originalDoc.getPageCount() - 1)
            pagesElements[pIdx].push(el)
        })

        // C. Generate Overlay PDF using Puppeteer
        const executablePath = await findChrome()
        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--font-render-hinting=none']
        })

        const page = await browser.newPage()

        // Use standard dimensions or fetch from first page
        const TARGET_WIDTH = 794
        const TARGET_HEIGHT = 1123

        await page.setViewport({ width: TARGET_WIDTH, height: TARGET_HEIGHT })

        // Generate HTML with page breaks
        const pagesHTML = pagesElements.map(pageEls =>
            generatePageHTML(pageEls, TARGET_WIDTH, TARGET_HEIGHT)
        ).join('<div style="page-break-after: always; height: 0; overflow: hidden;"></div>')

        const inputHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @page { size: ${TARGET_WIDTH}px ${TARGET_HEIGHT}px; margin: 0; }
                    body { margin: 0; padding: 0; background: transparent; }
                </style>
            </head>
            <body>
                ${pagesHTML}
            </body>
            </html>
        `

        await page.setContent(inputHtml, { waitUntil: 'load' })
        await page.evaluateHandle('document.fonts.ready')

        // Generate Transparent Overlay PDF
        const overlayBuffer = await page.pdf({
            width: `${TARGET_WIDTH}px`,
            height: `${TARGET_HEIGHT}px`,
            printBackground: true,
            omitBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        })

        await browser.close()
        browser = null

        // D. Merge Overlay
        const overlayDoc = await PDFDocument.load(overlayBuffer)
        const overlayPages = overlayDoc.getPages()

        originalDoc.setTitle(title)
        originalDoc.setProducer('Pdf Pro Editor')

        const originalPages = originalDoc.getPages()

        for (let i = 0; i < originalPages.length; i++) {
            if (i >= overlayPages.length) break

            const overlayPage = await originalDoc.embedPage(overlayPages[i])
            const originPage = originalPages[i]
            const { width: opW, height: opH } = originPage.getSize()

            originPage.drawPage(overlayPage, {
                x: 0,
                y: 0,
                width: opW,
                height: opH,
                opacity: 1
            })
        }

        // E. Save
        const pdfBytesModified = await originalDoc.save()
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

        return new NextResponse(pdfBytesModified, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
            },
        })

    } catch (error) {
        if (browser) await browser.close()
        console.error('PDF Edit Error:', error)
        return NextResponse.json({ error: 'Failed to edit PDF', details: String(error) }, { status: 500 })
    }
}