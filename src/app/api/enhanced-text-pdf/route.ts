// app/api/enhanced-text-pdf/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED TEXT-TO-PDF ENGINE v3
// Generates beautifully formatted PDFs from plain text prompts
// Two-step: AI generates layout → Puppeteer renders → PDF returned
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')

export async function POST(request: NextRequest) {
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    prompt = '',
    pageCount = 1,
    style = 'professional',
    layout = 'modern',
    includeHeaders = true,
    includeFooters = true,
    fontSize = 'normal',
    spacing = 'normal',
  } = body

  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const fontSizeMap: Record<string, string> = { small: '9px', normal: '11px', large: '13px' }
  const spacingMap: Record<string, string> = { compact: '1.3', normal: '1.6', relaxed: '2.0' }

  const styleGuides: Record<string, any> = {
    professional: {
      primaryColor: '#1e40af', headingFont: 'Helvetica, Arial, sans-serif',
      bodyFont: 'Arial, sans-serif', headingColor: '#1e40af', textColor: '#0f172a',
      bgColor: '#ffffff', accentColor: '#dbeafe', borderColor: '#bfdbfe'
    },
    modern: {
      primaryColor: '#7c3aed', headingFont: 'Georgia, serif',
      bodyFont: 'Arial, sans-serif', headingColor: '#7c3aed', textColor: '#1f1235',
      bgColor: '#ffffff', accentColor: '#ede9fe', borderColor: '#ddd6fe'
    },
    academic: {
      primaryColor: '#1a1a1a', headingFont: 'Georgia, serif',
      bodyFont: 'Georgia, serif', headingColor: '#1a1a1a', textColor: '#2d2d2d',
      bgColor: '#ffffff', accentColor: '#f5f5f5', borderColor: '#e5e5e5'
    },
    creative: {
      primaryColor: '#be185d', headingFont: 'Georgia, serif',
      bodyFont: 'Arial, sans-serif', headingColor: '#be185d', textColor: '#4b5563',
      bgColor: '#fdf2f8', accentColor: '#fce7f3', borderColor: '#fbcfe8'
    }
  }

  const st = styleGuides[style] || styleGuides.professional
  const baseFontSize = fontSizeMap[fontSize] || '11px'
  const lineSpacing = spacingMap[spacing] || '1.6'
  const numPages = Math.max(1, Math.min(10, Number(pageCount)))

  // ── Step 1: AI generates structured content ──────────────────────────────────
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    }
  })

  const aiPrompt = `Create detailed, professional content for a ${numPages}-page ${style} document about: "${prompt}"

Return JSON with this EXACT structure:
{
  "title": "Document main title",
  "subtitle": "Optional subtitle or tagline",
  "author": "Author or organization name (realistic)",
  "date": "Current month and year",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Full paragraph content for this section (2-4 paragraphs of realistic content, no placeholders)",
      "subsections": [
        { "subheading": "Sub-section title", "content": "Content here" }
      ]
    }
  ],
  "conclusion": "Closing paragraph",
  "footer_note": "Optional footer text like company name or confidentiality notice"
}

RULES:
- Make ALL content specific and realistic for the topic (no Lorem ipsum, no [PLACEHOLDER])  
- Write as many sections as needed to fill ${numPages} A4 page(s)
- Be comprehensive — expand each section with detailed, valuable content
- Use professional language appropriate for ${style} documents
- Include relevant statistics, examples, or details where appropriate`

  let contentData: any
  try {
    const response = await model.generateContent(aiPrompt)
    const text = response.response.text()
    contentData = JSON.parse(text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim())
  } catch (err: any) {
    console.error('[enhanced-text-pdf] AI content gen failed:', err)
    return NextResponse.json({ error: 'AI content generation failed: ' + err.message }, { status: 500 })
  }

  // ── Step 2: Build beautiful HTML ─────────────────────────────────────────────
  const headerHTML = includeHeaders ? `
    <div class="header">
      <div class="header-title">${escapeHtml(contentData.title || prompt)}</div>
      <div class="header-meta">${escapeHtml(contentData.author || '')} ${contentData.date ? `| ${contentData.date}` : ''}</div>
    </div>
  ` : ''

  const footerHTML = includeFooters ? `
    <div class="footer">
      <span class="footer-note">${escapeHtml(contentData.footer_note || contentData.title || '')}</span>
      <span class="page-num">Page <span class="pageNumber"></span></span>
    </div>
  ` : ''

  const sectionsHTML = (contentData.sections || []).map((section: any) => `
    <div class="section">
      <h2 class="section-heading">${escapeHtml(section.heading || '')}</h2>
      <p class="section-content">${escapeHtml(section.content || '').replace(/\n\n/g, '</p><p class="section-content">')}</p>
      ${(section.subsections || []).map((sub: any) => `
        <h3 class="subsection-heading">${escapeHtml(sub.subheading || '')}</h3>
        <p class="section-content">${escapeHtml(sub.content || '')}</p>
      `).join('')}
    </div>
  `).join('')

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(contentData.title || prompt)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: 595px 842px;
      margin: 0;
    }

    html, body {
      width: 595px;
      font-family: ${st.bodyFont};
      font-size: ${baseFontSize};
      color: ${st.textColor};
      background: ${st.bgColor};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      width: 595px;
      min-height: 842px;
      padding: ${includeHeaders ? '0 0 60px 0' : '40px 50px 60px 50px'};
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
      background: ${st.bgColor};
    }

    /* Header */
    .header {
      background: ${st.primaryColor};
      padding: 24px 50px 20px;
      margin-bottom: 32px;
    }
    .header-title {
      font-family: ${st.headingFont};
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }
    .header-meta {
      font-size: 9px;
      color: rgba(255,255,255,0.75);
      margin-top: 4px;
      font-weight: 400;
    }

    /* Document title area (first page only) */
    .doc-hero {
      padding: 0 50px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${st.borderColor};
    }
    .doc-title {
      font-family: ${st.headingFont};
      font-size: 26px;
      font-weight: 800;
      color: ${st.headingColor};
      line-height: 1.2;
      margin-bottom: 6px;
    }
    .doc-subtitle {
      font-size: 13px;
      color: #64748b;
      font-weight: 400;
    }

    /* Sections */
    .content-area {
      padding: 0 50px;
    }

    .section {
      margin-bottom: ${spacing === 'compact' ? '20px' : '28px'};
    }

    .section-heading {
      font-family: ${st.headingFont};
      font-size: 14px;
      font-weight: 700;
      color: ${st.headingColor};
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid ${st.borderColor};
      line-height: 1.3;
    }

    .subsection-heading {
      font-family: ${st.headingFont};
      font-size: 11px;
      font-weight: 600;
      color: ${st.textColor};
      margin-top: 12px;
      margin-bottom: 5px;
    }

    .section-content {
      font-size: ${baseFontSize};
      line-height: ${lineSpacing};
      color: ${st.textColor};
      margin-bottom: 8px;
    }

    /* Conclusion / callout box */
    .conclusion-box {
      background: ${st.accentColor};
      border-left: 3px solid ${st.primaryColor};
      padding: 14px 18px;
      margin: 20px 50px;
      border-radius: 4px;
    }
    .conclusion-box p {
      font-size: ${baseFontSize};
      line-height: ${lineSpacing};
      color: ${st.textColor};
    }

    /* Footer */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: ${st.bgColor};
      border-top: 1px solid ${st.borderColor};
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 50px;
      font-size: 8px;
      color: #9ca3af;
    }
    .footer-note { font-weight: 600; color: ${st.headingColor}; }
  </style>
</head>
<body>
  <div class="page">
    ${headerHTML}
    <div class="doc-hero">
      <div class="doc-title">${escapeHtml(contentData.title || prompt)}</div>
      ${contentData.subtitle ? `<div class="doc-subtitle">${escapeHtml(contentData.subtitle)}</div>` : ''}
    </div>
    <div class="content-area">
      ${sectionsHTML}
      ${contentData.conclusion ? `
        <div class="conclusion-box">
          <p>${escapeHtml(contentData.conclusion)}</p>
        </div>
      ` : ''}
    </div>
    ${footerHTML}
  </div>
</body>
</html>`

  // ── Step 3: Render with Puppeteer ─────────────────────────────────────────────
  let browser: any = null
  try {
    const { findChrome } = await import('@/app/lib/find-chrome').catch(() => ({
      findChrome: async () => process.env.CHROME_EXECUTABLE_PATH ||
        (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome')
    }))

    const puppeteer = (await import('puppeteer-core')).default
    const executablePath = await findChrome()

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 595, height: 842, deviceScaleFactor: 1 })
    await page.setContent(fullHTML, { waitUntil: ['load', 'networkidle0'], timeout: 30000 })
    await page.evaluate(() => (document as any).fonts.ready)
    await new Promise(r => setTimeout(r, 500))

    const pdfBuffer = await page.pdf({
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1.0,
      displayHeaderFooter: false,
    })

    await browser.close()

    const title = contentData.title || prompt.substring(0, 40)
    const safeFilename = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 60) || 'document'

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'no-store',
      }
    })
  } catch (err: any) {
    if (browser) try { await browser.close() } catch { }
    console.error('[enhanced-text-pdf] Render error:', err)
    // Fallback: return HTML content as base64 for client-side rendering
    return NextResponse.json({
      error: 'PDF rendering failed, returning content data',
      contentData,
      fallback: true
    }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}