import { useState } from 'react'
import { Plus, Sparkles, FileText, Zap, Layout, Wand2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { AI_PROMPTS } from '../lib/ai-config'
import { useEditorStore } from '@/app/store/useEditorStore'

interface AIContentGeneratorProps {
  onContentGenerated: (content: string) => void
  type: 'cv' | 'document'
  defaultPrompt?: string
}

export default function AIContentGenerator({ onContentGenerated, type, defaultPrompt }: AIContentGeneratorProps) {
  const { getLayoutContext, applyLayoutChanges, clearPages } = useEditorStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mode, setMode] = useState<'editor' | 'smart' | 'layout' | 'direct'>('smart')
  const [prompt, setPrompt] = useState(defaultPrompt || '')
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('')
  const [topic, setTopic] = useState('')
  const [documentType, setDocumentType] = useState('cv')
  const [style, setStyle] = useState('modern professional')
  const [pageCount, setPageCount] = useState(1)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // ENHANCED: Production-grade Smart Layout Generation with comprehensive error handling
  const generateSmartLayout = async () => {
    if (!topic && !role) {
      setGenerationStatus('error')
      setStatusMessage('Please provide either a topic or role information')
      return
    }
    
    setIsGenerating(true)
    setGenerationStatus('processing')
    setStatusMessage('Initializing AI layout generation...')
    
    try {
      // Clear existing pages for fresh layout
      clearPages()
      setStatusMessage('Generating professional layout structure...')
      
      const fullPrompt = documentType === 'cv' 
        ? [
            `Design a world-class CV/resume for a ${role} with ${experience} years of experience.`,
            `Use a ${style} layout with a strong hero header, clear section headings,`,
            `two-column information where appropriate, and perfectly aligned typography.`,
            `Include sections for Professional Summary, Experience, Education, Skills, and optional Extras.`,
            `Generate ${pageCount} full A4 page${pageCount > 1 ? 's' : ''} of content with 8–12 elements per page.`
          ].join(' ')
        : [
            `Design a premium ${documentType} about "${topic}".`,
            `Use a ${style} layout similar to a top-tier editorial or consulting report:`,
            `hero title, subtitle, executive summary, multiple well-separated sections,`,
            `and card-style containers for each key idea or chapter.`,
            `Use clear hierarchy (hero, section headings, body text, callouts) and`,
            `generate ${pageCount} A4 page${pageCount > 1 ? 's' : ''} with 8–12 high-quality elements per page.`
          ].join(' ')
      
      setStatusMessage('Processing AI layout intelligence...')
      
      const response = await fetch('/api/ai-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          context: '[]',
          pageCount: pageCount
        })
      })

      if (!response.ok) {
        let errorMessage = `Layout API error: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            errorMessage = errorData.error
          }
        } catch {
        }

        setGenerationStatus('error')
        setStatusMessage(errorMessage)

        setTimeout(() => {
          setGenerationStatus('idle')
          setStatusMessage('')
        }, 5000)

        return
      }

      const data = await response.json()
      
      if (data.success && data.changes) {
        setStatusMessage('Applying layout changes...')
        applyLayoutChanges(data.changes)
        
        // Success feedback
        const elementCount = data.meta?.elementCount || data.changes.length
        setStatusMessage(`✅ Successfully generated ${elementCount} elements across ${pageCount} page${pageCount > 1 ? 's' : ''}`)
        setGenerationStatus('success')
        
        console.log(`✅ Generated ${elementCount} elements across ${pageCount} page${pageCount > 1 ? 's' : ''}`)
        
        // Reset status after delay
        setTimeout(() => {
          setGenerationStatus('idle')
          setStatusMessage('')
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to generate layout')
      }
    } catch (error) {
      console.error('Layout generation error:', error)
      setGenerationStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Failed to generate layout')
      
      // Reset error status after delay
      setTimeout(() => {
        setGenerationStatus('idle')
        setStatusMessage('')
      }, 5000)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateDirectPDF = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-ai-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || topic || role,
          documentType,
          pageCount,
        })
      })

      if (!response.ok) {
        console.error('AI PDF API Error:', response.status)
        return
      }

      const layoutData = await response.json()

      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: layoutData.pages,
          title: (topic || prompt || 'generated').toString(),
          width: layoutData.width,
          height: layoutData.height,
        }),
      })

      if (!pdfResponse.ok) {
        console.error('PDF generation error:', pdfResponse.status)
        return
      }

      const blob = await pdfResponse.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const fileName = `${(topic || prompt || 'generated').toLowerCase()}.pdf`
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('MCP PDF Generation Error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const applyLayoutIntelligence = async () => {
    if (!prompt) return
    setIsGenerating(true)
    try {
      const context = getLayoutContext()
      const response = await fetch('/api/ai-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context })
      })

      const data = await response.json()
      if (data.success && data.changes) {
        applyLayoutChanges(data.changes)
        setPrompt('') // Clear prompt after success
      }
    } catch (error) {
      console.error('Layout AI Error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Get doc title for filename
  const docTitle = useEditorStore(s => s.docTitle)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <span className="text-2xl">🤖</span> AI Document Studio
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('smart')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'smart' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🎨 Smart Layout
          </button>
          <button
            onClick={() => setMode('layout')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'layout' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🎯 Modify
          </button>
          <button
            onClick={() => setMode('direct')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'direct' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ⚡ Direct PDF
          </button>
        </div>
      </div>

      {mode === 'smart' ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
            <div className="text-2xl">✨</div>
            <p className="text-[13px] text-green-700 leading-relaxed font-medium">
              Generate a complete professional document with AI. Creates multiple elements: headings, paragraphs, containers, icons, and lines - all perfectly positioned.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="cv">CV / Resume</option>
                <option value="proposal">Business Proposal</option>
                <option value="report">Professional Report</option>
                <option value="letter">Cover Letter</option>
                <option value="brochure">Company Brochure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Design Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="modern professional">Modern Professional</option>
                <option value="elegant minimalist">Elegant Minimalist</option>
                <option value="creative bold">Creative Bold</option>
                <option value="corporate formal">Corporate Formal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Pages</label>
              <input
                type="number"
                min="1"
                max="10"
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {documentType === 'cv' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Years Experience</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Topic / Subject</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Digital Marketing Strategies for 2024"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
            <span className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quick Templates</span>
            <RecipeButton label="🎯 Executive CV" onClick={() => { setDocumentType('cv'); setRole('Executive Director'); setExperience('15'); }} />
            <RecipeButton label="💼 Tech Resume" onClick={() => { setDocumentType('cv'); setRole('Full Stack Developer'); setExperience('5'); }} />
            <RecipeButton label="📊 Sales Proposal" onClick={() => { setDocumentType('proposal'); setTopic('Enterprise Software Solutions'); }} />
            <RecipeButton label="📈 Marketing Report" onClick={() => { setDocumentType('report'); setTopic('Q4 Marketing Performance Analysis'); }} />
          </div>

          <button
            onClick={generateSmartLayout}
            disabled={isGenerating || (!topic && !role)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-green-200"
          >
            {isGenerating ? (
              <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>Creating {pageCount} Page{pageCount > 1 ? 's' : ''}...</>
            ) : (
              <><span>🎨</span>Generate {pageCount} Page{pageCount > 1 ? 's' : ''}</>
            )}
          </button>
          <p className="text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            Creates 8-12 elements per page automatically
          </p>
        </div>
      ) : mode === 'layout' ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3">
            <div className="text-2xl">🎨</div>
            <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
              Summarize your layout changes. AI will rearrange, resize, or add elements directly to your canvas while respecting A4 bounds.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Describe layout changes</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Move the social icons to the bottom right and center all headings."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 min-h-[140px] shadow-inner bg-gray-50"
              rows={4}
            />
          </div>
          <button
            onClick={applyLayoutIntelligence}
            disabled={isGenerating || !prompt}
            className="mt-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
          >
            {isGenerating ? (
              <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>Rearranging Layout...</>
            ) : (
              <><Wand2 size={20} />Apply Layout Update</>
            )}
          </button>
          <div className="flex gap-2 flex-wrap pb-2 border-b border-gray-100">
            <span className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Professional Recipes</span>
            <RecipeButton
              label="Two-Column Resume"
              onClick={() => setPrompt("Create a modern two-column resume layout. Left column (30%) has background color #f8fafc, containing contact info with icons. Right column (70%) has Experience and Education sections.")}
            />
            <RecipeButton
              label="Modern Header"
              onClick={() => setPrompt("Create a professional header. Large bold name at top left. Under it, a subheading for role. At top right, add contact details (email, phone, location) with matching icons and small text.")}
            />
            <RecipeButton
              label="Invoice Layout"
              onClick={() => setPrompt("Generate an invoice layout. Store name and logo at top. Below that, a horizontal line. Then 'BILL TO' section and a professional table-like structure for items.")}
            />
            <RecipeButton
              label="Portfolio Grid"
              onClick={() => setPrompt("Layout a clean portfolio grid. 3 containers across the page, each with a placeholder image element and a small heading below it. Use consistent 40px spacing.")}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quick Tweaks</span>
            <button onClick={() => setPrompt("Center all headings and subheadings while keeping their positions absolute.")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-200">Center Text</button>
            <button onClick={() => setPrompt("Fix element collisions: detect all overlapping text elements and stagger them vertically with 20px spacing manually.")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-200">Fix Collisions</button>
            <button onClick={() => setPrompt("Update all elements to use the 'Inter' font family and set appropriate font weights for hierarchy.")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-200">Polish Hierarchy</button>
            <button onClick={() => setPrompt("Standardize all text: Convert all Elements to 'fixed' resize mode and calculate absolute heights based on content.")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-200">Standardize Layout</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex gap-3 mb-2">
            <div className="text-2xl">⚡</div>
            <p className="text-[13px] text-purple-700 leading-relaxed font-medium">
              Generate a high-fidelity PDF from scratch using the <span className="font-bold underline">Gen-PDF MCP Engine</span>.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What kind of PDF do you want to create?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a professional business proposal for a new AI startup with a pricing table..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 min-h-[160px] shadow-inner bg-gray-50"
              rows={5}
            />
          </div>
          <button
            onClick={generateDirectPDF}
            disabled={isGenerating || !prompt}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-purple-200"
          >
            {isGenerating ? (
              <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>Creating Professional PDF...</>
            ) : (
              <><span>✨</span>Generate & Download PDF</>
            )}
          </button>
          <p className="text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-2">Powered by Smithery Connect MCP</p>
        </div>
      )}
    </div>
  )
}

function RecipeButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-semibold shadow-sm"
    >
      {label}
    </button>
  )
}
