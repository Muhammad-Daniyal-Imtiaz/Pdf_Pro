import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import { computeFinalStyles } from '@/app/lib/layout-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

// EMBEDDED SVGS (No external loads = no timing bugs)
const getIconSVG = (type: string, size: number, color: string) => {
  const icons: Record<string, string> = {
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    email: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    twitter: '<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
    whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  }
  const path = icons[type] || icons.user
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size)}" height="${Math.round(size)}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;shape-rendering:geometricPrecision;">${path}</svg>`
}

const getIconColor = (type: string): string => {
  const c: Record<string, string> = { linkedin: '#0077b5', email: '#EA4335', phone: '#10B981', twitter: '#1DA1F2', github: '#333', globe: '#6366F1', instagram: '#E4405F', facebook: '#1877F2', youtube: '#FF0000', whatsapp: '#25D366', location: '#EF4444', calendar: '#F59E0B', user: '#6B7280', download: '#10B981', external: '#6366F1' }
  return c[type] || '#000'
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '<br>')
}

function generateHTML(elements: any[], width: number, height: number, title: string): string {
  const renderElement = (el: any) => {
    // APPLY DEEP LAYOUT ENGINE
    const styles = computeFinalStyles(el)
    const content = escapeHtml(el.content || '')

    let innerHTML = ''
    if (el.type === 'social-icon') {
      innerHTML = getIconSVG(el.iconType || 'user', Math.min(styles.container.match(/width:\s*(\d+)px/)?.[1] || 20, styles.container.match(/height:\s*(\d+)px/)?.[1] || 20) * 0.8, getIconColor(el.iconType || 'user'))
    } else if (el.type === 'link') {
      const iconSVG = getIconSVG('external', 16, el.style.color || '#000')
      innerHTML = `
        <div style="${styles.content}">
          <span style="display:inline-flex;align-items:center;flex-shrink:0;">${iconSVG}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${content}</span>
        </div>
      `
    } else {
      innerHTML = `<div style="${styles.content}">${content}</div>`
    }

    return `<div style="${styles.container}">${innerHTML}</div>`
  }

  // LAYOUT LOCKING SCRIPT
  // This script runs inside Chrome before PDF generation.
  // It forces the browser to "freeze" its calculations as inline styles.
  const lockLayoutScript = `
    <script>
      (function() {
        const all = document.querySelectorAll('*');
        all.forEach(el => {
          const s = window.getComputedStyle(el);
          // Force integer pixels to prevent sub-pixel text rendering differences
          if (s.width) el.style.width = s.width;
          if (s.height) el.style.height = s.height;
          if (s.top) el.style.top = s.top;
          if (s.left) el.style.left = s.left;
        });
      })();
    <\/script>
  `

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        /* AGGRESSIVE RESET */
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
        html { width: ${width}px; height: ${height}px; overflow: hidden; }
        body { width: ${width}px; height: ${height}px; font-family: 'Inter', sans-serif; background: white; overflow: hidden; position: relative; }
        /* FORCE SUBPIXEL RENDERING CONSISTENCY */
        div { shape-rendering: geometricPrecision; text-rendering: geometricPrecision; }
      </style>
    </head>
    <body>
      <div id="page-root" style="width:100%;height:100%;position:relative;">
        ${elements.map(renderElement).join('')}
      </div>
      ${lockLayoutScript}
    </body>
    </html>
  `
}

async function findChrome(): Promise<string> {
  if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH
  const platform = process.platform
  if (platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  if (platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  return '/usr/bin/google-chrome'
}

export async function POST(request: NextRequest) {
  let browser = null
  try {
    const body = await request.json()
    const { elements, title, width = 794, height = 1123 } = body

    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json({ error: 'Invalid elements data' }, { status: 400 })
    }

    const executablePath = await findChrome()
    console.log(`Generating PDF with Layout Engine...`)

    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none', '--disable-font-subpixel-positioning']
    })

    const page = await browser.newPage()

    // CRITICAL: Viewport MUST match pixel dimensions exactly
    await page.setViewport({ width: Math.ceil(width), height: Math.ceil(height), deviceScaleFactor: 1 })

    const html = generateHTML(elements, width, height, title)
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })

    // Force Font Load
    await page.evaluate(async () => { await document.fonts.ready })

    // Allow layout script to run
    await new Promise(r => setTimeout(r, 500))

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