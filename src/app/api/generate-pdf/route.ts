// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'

export const runtime = 'nodejs'
export const maxDuration = 60

// SVG icons data - embedded directly to avoid external dependencies
const ICON_SVGS: Record<string, string> = {
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0077b5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  email: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EA4335"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 1 .7 2.81 2 2 0 0 1-2 .45 2 2 0 0 1-1.18-1.44zM4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#333333"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0-2.48-2.72 2 2 0 0 1-2.18 2 2 0 0 1 2 2v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19.91 1 18.73.18 0 0 0-16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.61 2 2 0 0 1-2 2v3.87a2 2 0 0 1-2 2 2 2 0 0 1 2 2v7h-4z"/></svg>`,
  website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366F1"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E4405F"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF0000"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9H3a8.48 8.48 0 0 0-1.9 8.48 8.48 0 0 0-1.9 3.8 8.5 8.5 0 0 1-7.6 4.7z"/><path d="M17.5 6.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1z"/></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  external: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366F1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
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
    const style = el.style || {}
    const content = escapeHtml(el.content || '')

    let elementHTML = ''

    switch (el.type) {
      case 'heading':
      case 'paragraph':
      case 'text':
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
          ">${content}</div>
        `
        break

      case 'container':
        elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            background-color: ${style.backgroundColor || 'transparent'};
            border: ${style.borderWidth || 0}px solid ${style.borderColor || '#000000'};
            border-radius: ${style.borderRadius || 0}px;
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            overflow: hidden;
          ">
            <div style="
              font-family: ${style.fontFamily || 'Arial, sans-serif'};
              font-size: ${style.fontSize || 14}px;
              font-weight: ${style.fontWeight || 'normal'};
              color: ${style.color || '#000000'};
              line-height: ${style.lineHeight || 1.5};
              text-align: ${style.textAlign || 'left'};
              padding: ${style.padding || 8}px;
              height: 100%;
              box-sizing: border-box;
            ">${content}</div>
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

      case 'line':
        const isHorizontal = el.lineOrientation === 'horizontal'
        elementHTML = `
          <div style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${isHorizontal ? style.width : 2}px;
            height: ${isHorizontal ? 2 : style.height}px;
            background-color: ${style.backgroundColor || '#000000'};
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
          "></div>
        `
        break

      case 'link':
        const linkIcon = ICON_SVGS.external
        elementHTML = `
          <a href="${el.url || '#'}" style="
            position: absolute;
            left: ${el.x}px;
            top: ${el.y}px;
            width: ${style.width}px;
            height: ${style.height}px;
            font-family: ${style.fontFamily || 'Arial, sans-serif'};
            font-size: ${style.fontSize || 14}px;
            font-weight: ${style.fontWeight || 'normal'};
            color: ${style.color || '#0066cc'};
            text-decoration: ${style.linkDecoration || 'none'};
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${style.padding || 8}px;
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
          ">
            <div style="
              width: 16px;
              height: 16px;
              margin-right: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">${linkIcon}</div>
            <span style="
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${content}</span>
          </a>
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
            background-color: ${style.backgroundColor || '#f0f0f0'};
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: ${style.zIndex || 1};
            opacity: ${style.opacity || 1};
            transform: rotate(${style.rotation || 0}deg);
          ">Image Placeholder</div>
        `
        break
    }

    return elementHTML
  }

  return `
    <div style="
      width: ${width}px;
      height: ${height}px;
      position: relative;
      background-color: white;
      overflow: hidden;
      font-family: Arial, sans-serif;
    ">
      ${elements.map(renderElement).join('')}
    </div>
  `
}

export async function POST(request: NextRequest) {
  let browser = null
  try {
    const body = await request.json()
    const { pages, title, width = 794, height = 1123 } = body

    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: 'Invalid pages data' }, { status: 400 })
    }

    const executablePath = await findChrome()
    console.log(`Generating PDF with ${pages.length} pages...`)

    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: Math.ceil(width), height: Math.ceil(height), deviceScaleFactor: 1 })

    // Generate HTML for all pages
    const pagesHTML = pages.map((pageData: any) =>
      generatePageHTML(pageData.elements, width, height)
    ).join('<div style="page-break-after: always;"></div>')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: ${width}px ${height}px;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${pagesHTML}
      </body>
      </html>
    `

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.evaluate(async () => { await document.fonts.ready })

    const pdfBuffer = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout: 60000,
    })

    await browser.close()
    browser = null

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    })

  } catch (error) {
    if (browser) await browser.close()
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate PDF', details: String(error) }, { status: 500 })
  }
}