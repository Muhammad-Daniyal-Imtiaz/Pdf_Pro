'use client'

import { useState, useRef, useCallback } from 'react'
import { Sparkles, Wand2, AlertCircle, CheckCircle, Loader2, ChevronDown, Zap, FileText, Layout, RefreshCw, X } from 'lucide-react'
import { useEditorStore } from '@/app/store/useEditorStore'

// ─── Design Token Palettes ────────────────────────────────────────────────────
const DESIGN_TOKENS: Record<string, {
  primary: string; secondary: string; accent: string; text: string;
  textMuted: string; bg: string; surface: string; border: string;
  headingFont: string; bodyFont: string;
}> = {
  'modern-professional': {
    primary: '#0F172A', secondary: '#F1F5F9', accent: '#3B82F6',
    text: '#1E293B', textMuted: '#64748B', bg: '#FFFFFF', surface: '#F8FAF8',
    border: '#E2E8F0', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif'
  },
  'elegant-minimalist': {
    primary: '#2D2D2D', secondary: '#F9F7F5', accent: '#AF8E4D',
    text: '#121212', textMuted: '#737373', bg: '#FFFFFF', surface: '#FCFBFA',
    border: '#E5E5E5', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif'
  },
  'creative-bold': {
    primary: '#4F46E5', secondary: '#EEF2FF', accent: '#F59E0B',
    text: '#1E1B4B', textMuted: '#6366F1', bg: '#FFFFFF', surface: '#F5F3FF',
    border: '#C7D2FE', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif'
  },
  'corporate-formal': {
    primary: '#1e293b', secondary: '#f1f5f9', accent: '#0ea5e9',
    text: '#0f172a', textMuted: '#475569', bg: '#ffffff', surface: '#f8fafc',
    border: '#cbd5e1', headingFont: 'Arial, sans-serif', bodyFont: 'Arial, sans-serif'
  },
  'warm-executive': {
    primary: '#92400e', secondary: '#fef3c7', accent: '#d97706',
    text: '#1c1007', textMuted: '#78716c', bg: '#fffbf7', surface: '#fef9f0',
    border: '#e7e5e4', headingFont: 'Georgia, serif', bodyFont: 'Arial, sans-serif'
  },
  'tech-modern': {
    primary: '#0f172a', secondary: '#e0f2fe', accent: '#06b6d4',
    text: '#0f172a', textMuted: '#64748b', bg: '#ffffff', surface: '#f0f9ff',
    border: '#bae6fd', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif'
  }
}

// ─── A4 Layout Archetypes that AI picks from ─────────────────────────────────
const LAYOUT_ARCHETYPES = {
  cv: {
    'two-column': 'Left sidebar 178px wide with background color, right main 370px wide. Header spans full width at top.',
    'single-column': 'Full width single column layout with horizontal section separators.',
    'timeline': 'Professional timeline layout with dates on left, content on right.'
  },
  proposal: {
    'executive': 'Bold hero section at top 200px, then 3 content sections with consistent margins.',
    'professional': 'Header with logo area, table of contents sidebar, clean content sections.'
  },
  report: {
    'corporate': 'Title page style header, then flowing sections with pull-quotes and stats boxes.',
    'academic': 'Abstract box, body text, appendix sections with proper academic formatting.'
  },
  letter: {
    'formal': 'Letterhead at top 120px, date/recipient block, body, signature block.',
    'modern': 'Clean header strip, minimal body, professional closing.'
  },
  invoice: {
    'professional': 'Company header, bill-to section, line items table area, totals, payment terms.',
  },
  brochure: {
    'tri-fold': 'Three column grid 178px each with 5px gaps, hero image area in first column.',
  }
}

// ─── Document Quick-Start Recipes ─────────────────────────────────────────────
const RECIPES: Record<string, { label: string; emoji: string; docType: string; style: string; topic: string; role: string; exp: string }[]> = {
  cv: [
    { label: 'Tech Lead', emoji: '💻', docType: 'cv', style: 'tech-modern', topic: '', role: 'Senior Software Engineer', exp: '8' },
    { label: 'Designer', emoji: '🎨', docType: 'cv', style: 'creative-bold', topic: '', role: 'UX/UI Designer', exp: '5' },
    { label: 'Executive', emoji: '👔', docType: 'cv', style: 'elegant-minimalist', topic: '', role: 'Chief Executive Officer', exp: '20' },
    { label: 'Marketing', emoji: '📊', docType: 'cv', style: 'modern-professional', topic: '', role: 'Marketing Director', exp: '7' },
  ],
  business: [
    { label: 'Startup Pitch', emoji: '🚀', docType: 'proposal', style: 'creative-bold', topic: 'AI-Powered SaaS Platform', role: '', exp: '' },
    { label: 'Sales Proposal', emoji: '💼', docType: 'proposal', style: 'corporate-formal', topic: 'Enterprise Software Solutions', role: '', exp: '' },
    { label: 'Annual Report', emoji: '📈', docType: 'report', style: 'corporate-formal', topic: 'Company Financial Performance', role: '', exp: '' },
    { label: 'Brand Brochure', emoji: '📖', docType: 'brochure', style: 'modern-professional', topic: 'Technology Company Services', role: '', exp: '' },
  ]
}

interface AIContentGeneratorProps {
  onContentGenerated?: (content: string) => void
  type?: 'cv' | 'document'
  defaultPrompt?: string
}

type Mode = 'smart' | 'layout' | 'direct'
type Status = 'idle' | 'processing' | 'success' | 'error'

export default function AIContentGenerator({ onContentGenerated, type, defaultPrompt }: AIContentGeneratorProps) {
  const { getLayoutContext, applyLayoutChanges, clearPages } = useEditorStore()

  // ── Core State ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('smart')
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [progress, setProgress] = useState(0)
  const [errorDetail, setErrorDetail] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // ── Smart Layout Fields ─────────────────────────────────────────────────────
  const [docType, setDocType] = useState('cv')
  const [style, setStyle] = useState('modern-professional')
  const [pageCount, setPageCount] = useState(1)
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('')
  const [topic, setTopic] = useState('')
  const [prompt, setPrompt] = useState(defaultPrompt || '')
  const [activeRecipeTab, setActiveRecipeTab] = useState<'cv' | 'business'>('cv')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ── Progress helper ─────────────────────────────────────────────────────────
  const updateProgress = (msg: string, pct: number) => {
    setStatusMsg(msg)
    setProgress(pct)
  }

  // ── Cancel generation ────────────────────────────────────────────────────────
  const handleCancel = () => {
    abortRef.current?.abort()
    setIsGenerating(false)
    setStatus('idle')
    setStatusMsg('')
    setProgress(0)
  }

  // ── Validate and fix AI elements before applying ─────────────────────────────
  const validateElements = (rawElements: any[]): { elements: any[], fixed: number } => {
    let fixed = 0
    const elements = rawElements
      .filter(el => el && typeof el === 'object' && el.type)
    // Help AI estimate height more realistically (chars_per_line based logic)
    const estimateHeight = (el: any) => {
      if (!['text', 'heading', 'paragraph'].includes(el.type)) return Number(el.style?.height) || 20
      const width = Number(el.style?.width) || 200
      const fontSize = Number(el.style?.fontSize) || 12
      const content = String(el.content || '')
      const lineHeight = Number(el.style?.lineHeight) || 1.4
      const padding = Number(el.style?.padding) || 0

      const charsPerLine = Math.max(1, (width - (padding * 2)) / (fontSize * 0.55))
      const lines = Math.ceil(content.length / charsPerLine)
      const estimatedHeight = Math.ceil((lines * fontSize * lineHeight) + (padding * 2) + 12)

      return Math.max(estimatedHeight, Number(el.style?.height) || 20)
    }

    const processedElements = elements
      .map((el: any, idx: number) => {
        const e = { ...el, style: { ...(el.style || {}) } }

        // Ensure unique ID
        if (!e.id) { e.id = `ai-${Date.now()}-${idx}`; fixed++ }

        // Clamp to A4 safe zone (595×842)
        e.x = Math.max(20, Math.min(Number(e.x) || 20, 555))
        e.y = Math.max(20, Math.min(Number(e.y) || 20, 800))
        e.style.width = Math.min(Math.max(Number(e.style.width) || 100, 10), 555 - e.x + 20)

        // Use estimated height if visual content exceeds requested height
        const estH = estimateHeight(e)
        e.style.height = Math.min(Math.max(Number(e.style.height) || 20, estH), 800 - e.y + 20)

        // Fix text-specific
        if (['text', 'heading', 'paragraph'].includes(e.type)) {
          e.style.fontSize = Math.max(7, Math.min(Number(e.style.fontSize) || 12, 72))
          e.content = e.content || 'Text'
          if (!e.style.color) e.style.color = '#1a1a1a'
          if (!e.style.fontFamily) e.style.fontFamily = 'Inter, Arial, sans-serif'
          if (!e.style.lineHeight) e.style.lineHeight = 1.4
          e.style.resizeMode = 'auto-both'
        }

        // Fix zIndex (FORCE hierarchy for production grade stacking)
        const zLevels: Record<string, number> = {
          container: 0,
          shape: 0,
          image: 1,
          line: 2,
          text: 3,
          paragraph: 3,
          'social-icon': 4,
          heading: 5
        }
        e.style.zIndex = zLevels[e.type] ?? (e.style.zIndex || 2)

        // Ensure background is always at bottom if it's full-page
        if (e.type === 'shape' && e.style.width > 500 && e.style.height > 700) {
          e.style.zIndex = -1
        }

        return e
      })

    // SORT BY Y FOR SEQUENTIAL PUSH-DOWN LOGIC
    const finalElements = [...processedElements].sort((a, b) => a.y - b.y)

    // STRICT COLLISION PREVENTION (Sequential Push-down)
    for (let i = 0; i < finalElements.length; i++) {
      const current = finalElements[i]

      // SKIP: Don't let backgrounds or very low z-index elements push others
      if (current.style.zIndex < 0) continue
      if (current.type === 'shape' && (current.style.width > 400 || current.style.height > 600)) continue

      const currentBottom = current.y + (current.style.height || 20)

      // Look at all elements after this one that might overlap horizontally
      for (let j = i + 1; j < finalElements.length; j++) {
        const next = finalElements[j]

        // SKIP: Don't push backgrounds
        if (next.style.zIndex < 0) continue

        // Define bounding boxes
        const curX2 = current.x + (current.style.width || 100)
        const nxtX2 = next.x + (next.style.width || 100)

        // Check for horizontal overlap
        const hasHorizontalOverlap = !(next.x >= curX2 || nxtX2 <= current.x)

        if (hasHorizontalOverlap && next.y < currentBottom + 12) {
          // Push down next element
          next.y = currentBottom + 12
          fixed++
        }
      }
    }

    return { elements: finalElements, fixed }
  }

  // ── SMART LAYOUT GENERATION ──────────────────────────────────────────────────
  const generateSmartLayout = useCallback(async () => {
    if (!topic && !role && !prompt) {
      setStatus('error')
      setStatusMsg('Please fill in the Role or Topic field')
      return
    }

    abortRef.current = new AbortController()
    setIsGenerating(true)
    setStatus('processing')
    setErrorDetail('')

    try {
      updateProgress('🧠 Analyzing your request...', 5)
      clearPages()
      await new Promise(r => setTimeout(r, 300))

      updateProgress('🎨 Loading design system...', 15)
      const tokens = DESIGN_TOKENS[style] || DESIGN_TOKENS['modern-professional']
      await new Promise(r => setTimeout(r, 200))

      updateProgress('📐 Architecting layout structure...', 30)

      const archetype = LAYOUT_ARCHETYPES[docType as keyof typeof LAYOUT_ARCHETYPES]
      const archetypeHint = archetype ? `\nLAYOUT ARCHETYPE: ${Object.values(archetype)[0]}` : ''

      const response = await fetch('/api/generate-ai-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt,
          documentType: docType,
          pageCount,
          style,
          role,
          experience,
          topic,
          // Inject full design tokens so AI uses correct colors/fonts
          designTokens: tokens,
          archetypeHint,
          // Full A4 element schema for AI
          schemaVersion: 'v3-strict'
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'API Error' }))
        throw new Error(errData.error || `HTTP ${response.status}`)
      }

      updateProgress('✨ Synthesizing content...', 65)
      const data = await response.json()

      updateProgress('🔍 Validating elements...', 80)
      await new Promise(r => setTimeout(r, 200))

      if (!data.success || !data.pages) {
        throw new Error(data.error || 'No pages returned from AI')
      }

      const rawElements = data.pages.flatMap((page: any) =>
        (page.elements || []).map((el: any) => ({
          ...el,
          pageIndex: el.pageIndex ?? page.pageIndex ?? 0
        }))
      )

      updateProgress('⚡ Applying layout...', 90)
      const { elements, fixed } = validateElements(rawElements)
      applyLayoutChanges(elements)

      updateProgress(`✅ Done! ${elements.length} elements${fixed > 0 ? ` (${fixed} auto-fixed)` : ''}`, 100)
      setStatus('success')

      setTimeout(() => {
        setStatus('idle')
        setStatusMsg('')
        setProgress(0)
        setIsGenerating(false)
      }, 3000)

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus('idle')
        setStatusMsg('')
        setProgress(0)
        setIsGenerating(false)
        return
      }
      console.error('AI Generation error:', err)
      setStatus('error')
      setStatusMsg('Generation failed')
      setErrorDetail(err.message || 'Unknown error')
      setIsGenerating(false)
      setProgress(0)
    }
  }, [topic, role, prompt, docType, pageCount, style, experience, clearPages, applyLayoutChanges])

  // ── LAYOUT INTELLIGENCE (modify existing) ────────────────────────────────────
  const applyLayoutIntelligence = useCallback(async () => {
    if (!prompt.trim()) return

    abortRef.current = new AbortController()
    setIsGenerating(true)
    setStatus('processing')
    updateProgress('🔍 Reading current canvas...', 20)

    try {
      const contextStr = getLayoutContext()
      const contextData = JSON.parse(contextStr)

      // CRITICAL: Trim context to prevent sending base64 images to API (huge payloads)
      const trimmedContext = {
        pageCount: contextData.length || 1,
        pages: contextData.map((page: any) => ({
          pageIndex: page.pageIndex,
          elements: page.elements?.map((el: any) => ({
            id: el.id,
            type: el.type,
            x: Math.round(el.x),
            y: Math.round(el.y),
            content: el.type === 'image' ? '[IMAGE]' : (el.content || '').substring(0, 150),
            style: {
              width: Math.round(el.style?.width || 0),
              height: Math.round(el.style?.height || 0),
              fontSize: el.style?.fontSize,
              fontWeight: el.style?.fontWeight,
              color: el.style?.color,
              backgroundColor: el.type !== 'image' ? el.style?.backgroundColor : undefined,
              zIndex: el.style?.zIndex
            }
          }))
        }))
      }

      updateProgress('🤖 AI analyzing layout...', 50)

      const response = await fetch('/api/ai-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ prompt, context: trimmedContext })
      })

      const data = await response.json()

      updateProgress('⚡ Applying changes...', 85)

      if (data.success && data.changes?.length > 0) {
        const { elements } = validateElements(data.changes)
        applyLayoutChanges(elements)
        setStatus('success')
        updateProgress(`✅ Applied ${elements.length} layout changes`, 100)
        setPrompt('')
        setTimeout(() => { setStatus('idle'); setStatusMsg(''); setProgress(0); setIsGenerating(false) }, 2500)
      } else {
        throw new Error(data.error || 'No changes returned')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setStatus('error')
      setStatusMsg(err.message || 'Layout modification failed')
      setIsGenerating(false)
      setProgress(0)
    }
  }, [prompt, getLayoutContext, applyLayoutChanges])

  // ── DIRECT PDF GENERATION ────────────────────────────────────────────────────
  const generateDirectPDF = useCallback(async () => {
    if (!prompt.trim() && !topic.trim()) {
      setStatus('error')
      setStatusMsg('Please describe the PDF you want to create')
      return
    }

    abortRef.current = new AbortController()
    setIsGenerating(true)
    setStatus('processing')

    try {
      updateProgress('🚀 Generating layout...', 20)

      const tokens = DESIGN_TOKENS[style] || DESIGN_TOKENS['modern-professional']

      const layoutResponse = await fetch('/api/generate-ai-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ prompt, documentType: docType, pageCount, style, topic, designTokens: tokens, schemaVersion: 'v3-strict' })
      })

      if (!layoutResponse.ok) throw new Error('Layout generation failed')
      const layoutData = await layoutResponse.json()

      // CRITICAL: Validate and fix layout before rendering
      const validatedPages = layoutData.pages.map((page: any) => {
        const { elements } = validateElements(page.elements || [])
        return { ...page, elements }
      })

      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          pages: validatedPages,
          title: topic || prompt.substring(0, 40) || 'document',
          width: 595,
          height: 842
        })
      })

      if (!pdfResponse.ok) throw new Error('PDF rendering failed')

      updateProgress('💾 Downloading...', 90)

      const blob = await pdfResponse.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(topic || prompt).substring(0, 30).toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      setStatus('success')
      updateProgress('✅ PDF Downloaded!', 100)
      setTimeout(() => { setStatus('idle'); setStatusMsg(''); setProgress(0); setIsGenerating(false) }, 3000)

    } catch (err: any) {
      if (err.name === 'AbortError') return
      setStatus('error')
      setStatusMsg(err.message || 'PDF generation failed')
      setIsGenerating(false)
      setProgress(0)
    }
  }, [prompt, topic, docType, pageCount, style])

  // ── Apply recipe ─────────────────────────────────────────────────────────────
  const applyRecipe = (r: typeof RECIPES['cv'][0]) => {
    setDocType(r.docType)
    setStyle(r.style)
    if (r.topic) setTopic(r.topic)
    if (r.role) setRole(r.role)
    if (r.exp) setExperience(r.exp)
  }

  const docTitle = useEditorStore(s => s.docTitle)

  const isCV = docType === 'cv'
  const btnDisabled = isGenerating || (!topic && !role && !prompt)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Header + Mode Tabs ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={14} className="text-violet-500" />
            AI Document Studio
          </h3>
          {isGenerating && (
            <button onClick={handleCancel} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors">
              <X size={10} /> Cancel
            </button>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-100">
          {([
            { id: 'smart', icon: Sparkles, label: 'Generate', color: 'text-violet-600' },
            { id: 'layout', icon: Layout, label: 'Modify', color: 'text-blue-600' },
            { id: 'direct', icon: Zap, label: 'Direct PDF', color: 'text-amber-600' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${mode === tab.id ? `bg-white shadow-sm ${tab.color}` : 'text-gray-400 hover:text-gray-600'}`}
            >
              <tab.icon size={11} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SMART LAYOUT MODE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === 'smart' && (
          <>
            {/* Quick Recipe Tabs */}
            <div>
              <div className="flex gap-1 mb-2">
                {(['cv', 'business'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveRecipeTab(tab)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${activeRecipeTab === tab ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab === 'cv' ? '👤 Resume' : '💼 Business'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {RECIPES[activeRecipeTab].map(r => (
                  <button
                    key={r.label}
                    onClick={() => applyRecipe(r)}
                    className="flex flex-col items-center justify-center p-3 bg-white hover:bg-violet-50 border border-gray-200 hover:border-violet-300 rounded-xl transition-all group shadow-sm hover:shadow-md"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{r.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-violet-700 text-center uppercase tracking-tighter leading-none">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Settings */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Doc Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white">
                  <option value="cv">CV / Resume</option>
                  <option value="proposal">Business Proposal</option>
                  <option value="report">Report</option>
                  <option value="letter">Cover Letter</option>
                  <option value="invoice">Invoice</option>
                  <option value="brochure">Brochure</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Design Style</label>
                <select value={style} onChange={e => setStyle(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white">
                  <option value="modern-professional">Modern Professional</option>
                  <option value="elegant-minimalist">Elegant Minimalist</option>
                  <option value="creative-bold">Creative Bold</option>
                  <option value="corporate-formal">Corporate Formal</option>
                  <option value="warm-executive">Warm Executive</option>
                  <option value="tech-modern">Tech Modern</option>
                </select>
              </div>
            </div>

            {/* Conditional Fields */}
            {isCV ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Job Title</label>
                  <input type="text" value={role} onChange={e => setRole(e.target.value)}
                    placeholder="Senior Developer" className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Years Exp.</label>
                  <input type="number" value={experience} onChange={e => setExperience(e.target.value)}
                    placeholder="5" min="0" max="50" className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Topic / Subject</label>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., AI SaaS Business Proposal" className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400" />
              </div>
            )}

            {/* Quick Page Count Selector */}
            <div className="flex items-center justify-between p-2 bg-violet-50/50 rounded-lg border border-violet-100">
              <label className="text-[10px] font-bold text-violet-700 uppercase">Pages to Generate</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map(n => (
                  <button key={n} onClick={() => setPageCount(n)}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${pageCount === n ? 'bg-violet-600 text-white shadow-md scale-110' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'}`}>
                    {n}
                  </button>
                ))}
                <input type="number" value={pageCount} min={1} max={10}
                  onChange={e => setPageCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="w-10 p-1 text-center text-xs border border-gray-200 rounded bg-white font-medium" />
              </div>
            </div>

            {/* Advanced Toggle */}
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Advanced options
            </button>
            {showAdvanced && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Extra Details</label>
                  <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="Any specific requirements..." className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none" />
                </div>

                {/* Design Token Preview */}
                {style && DESIGN_TOKENS[style] && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Palette:</span>
                    {[
                      DESIGN_TOKENS[style].primary,
                      DESIGN_TOKENS[style].secondary,
                      DESIGN_TOKENS[style].accent,
                      DESIGN_TOKENS[style].text,
                      DESIGN_TOKENS[style].bg,
                    ].map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LAYOUT MODIFY MODE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === 'layout' && (
          <>
            <div className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
              Describe changes to your existing layout. AI will modify, move, or add elements.
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., Move the contact icons to the left sidebar. Make all headings larger and bolder. Add a thin blue horizontal divider after the name."
              className="w-full p-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 min-h-[100px] resize-none bg-gray-50"
              rows={4} />

            {/* Quick Tweaks */}
            <div className="flex flex-wrap gap-1.5">
              {[
                ['Center all headings', 'Center all heading elements horizontally on the page'],
                ['Add dividers', 'Add thin horizontal divider lines between each major section'],
                ['Fix overlaps', 'Find and fix any overlapping elements by adjusting their vertical positions'],
                ['Increase spacing', 'Add 8px more vertical spacing between all text elements'],
                ['Bold headings', 'Make all section heading text bolder with fontWeight 700'],
                ['Compact layout', 'Reduce spacing between elements to make the layout more compact'],
              ].map(([label, val]) => (
                <button key={label} onClick={() => setPrompt(val)}
                  className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-md border border-transparent hover:border-blue-200 transition-all font-medium">
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DIRECT PDF MODE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === 'direct' && (
          <>
            <div className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
              Describe the PDF you want. AI generates a complete layout and downloads it directly.
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Document Style</label>
              <select value={style} onChange={e => setStyle(e.target.value)}
                className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white mb-2">
                {Object.keys(DESIGN_TOKENS).map(k => (
                  <option key={k} value={k}>{k.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
                ))}
              </select>
            </div>

            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your PDF in detail, e.g.: Create a professional invoice for 'WebDev Studio' billing 'Acme Corp' for $5,000 for website design services. Include company logo area, itemized line items, payment terms Net-30, due date March 2025."
              className="w-full p-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 min-h-[120px] resize-none bg-gray-50"
              rows={5} />

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Pages</label>
              <input type="number" value={pageCount} min={1} max={10}
                onChange={e => setPageCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                className="w-24 p-2 text-xs border border-gray-200 rounded-lg" />
            </div>
          </>
        )}

        {/* ── Status / Progress Bar ──────────────────────────────────────────── */}
        {(status !== 'idle' || statusMsg) && (
          <div className={`rounded-lg overflow-hidden border ${status === 'error' ? 'border-red-200 bg-red-50' :
            status === 'success' ? 'border-green-200 bg-green-50' :
              'border-blue-100 bg-blue-50'
            }`}>
            {/* Progress Bar */}
            {status === 'processing' && (
              <div className="h-1 bg-blue-100">
                <div className="h-1 bg-blue-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2">
              {status === 'processing' && <Loader2 size={12} className="animate-spin text-blue-600 flex-shrink-0" />}
              {status === 'success' && <CheckCircle size={12} className="text-green-600 flex-shrink-0" />}
              {status === 'error' && <AlertCircle size={12} className="text-red-600 flex-shrink-0" />}
              <span className={`text-[11px] font-semibold ${status === 'error' ? 'text-red-700' :
                status === 'success' ? 'text-green-700' : 'text-blue-700'
                }`}>{statusMsg}</span>
            </div>
            {status === 'error' && errorDetail && (
              <div className="px-3 pb-2 text-[10px] text-red-500 font-mono">{errorDetail}</div>
            )}
          </div>
        )}

        {/* ── Error: Retry button ───────────────────────────────────────────── */}
        {status === 'error' && (
          <button onClick={() => { setStatus('idle'); setStatusMsg(''); setErrorDetail('') }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw size={11} /> Dismiss & Try Again
          </button>
        )}

        {/* ── Generate Button ───────────────────────────────────────────────── */}
        {!isGenerating && status !== 'success' && (
          <button
            onClick={mode === 'smart' ? generateSmartLayout : mode === 'layout' ? applyLayoutIntelligence : generateDirectPDF}
            disabled={mode !== 'layout' && btnDisabled}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${mode === 'smart' ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700' :
              mode === 'layout' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' :
                'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              }`}
          >
            {mode === 'smart' && <><Sparkles size={15} /> Generate {pageCount > 1 ? `${pageCount} Pages` : 'Document'}</>}
            {mode === 'layout' && <><Wand2 size={15} /> Apply Layout Changes</>}
            {mode === 'direct' && <><Zap size={15} /> Generate & Download PDF</>}
          </button>
        )}

        {isGenerating && status === 'processing' && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-500">
            <Loader2 size={13} className="animate-spin" />
            Working... ({Math.round(progress)}%)
          </div>
        )}
      </div>
    </div>
  )
}