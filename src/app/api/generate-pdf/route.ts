import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import { generatePageHTML, escapeHtml } from '@/app/lib/html-generator'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

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
    const { pages, title = 'document', width = 794, height = 1123 } = body

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Invalid pages data' }, { status: 400 })
    }

    const executablePath = await findChrome()
    console.log(`Generating PDF with ${pages.length} pages...`)

    // FIXED: Use correct headless option
    browser = await puppeteer.launch({
      executablePath,
      headless: true, // Changed from 'new' to true (boolean)
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=none', // Improve font rendering consistency
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain'
      ]
    })

    const page = await browser.newPage()
    await page.setViewport({
      width: Math.ceil(width),
      height: Math.ceil(height),
      // deviceScaleFactor: 1 // Reduced to 1 for stability
    })

    // Generate HTML for all pages
    const pagesHTML = pages.map((pageData: any, index: number) =>
      generatePageHTML(pageData.elements, width, height)
    ).join('')

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
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        ${pagesHTML}
      </body>
      </html>
    `

    await page.setContent(html, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 30000
    })

    // Wait for fonts to be ready
    await page.evaluateHandle('document.fonts.ready')

    const pdfBuffer = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1-' + pages.length
    })

    await browser.close()
    browser = null

    // Create safe filename
    const safeFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'document'

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })

  } catch (error) {
    console.error('PDF Generation Error:', error)
    if (browser) await browser.close()

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready',
    endpoint: '/api/generate-pdf',
    method: 'POST',
    required_fields: {
      pages: 'Array of page objects with elements',
      title: 'Document title (optional)',
      width: 'Page width in pixels (default: 794)',
      height: 'Page height in pixels (default: 1123)'
    }
  })
}