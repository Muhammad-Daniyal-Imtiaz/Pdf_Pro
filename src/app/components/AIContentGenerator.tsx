import { useState } from 'react'
import { Plus, Sparkles, FileText, Zap, Layout, Wand2 } from 'lucide-react'
import { AI_PROMPTS } from '../lib/ai-config'
import { useEditorStore } from '@/app/store/useEditorStore'

interface AIContentGeneratorProps {
  onContentGenerated: (content: string) => void
  type: 'cv' | 'document'
  defaultPrompt?: string
}

export default function AIContentGenerator({ onContentGenerated, type, defaultPrompt }: AIContentGeneratorProps) {
  const { getLayoutContext, applyLayoutChanges } = useEditorStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mode, setMode] = useState<'editor' | 'direct' | 'layout'>('editor')
  const [prompt, setPrompt] = useState(defaultPrompt || '')
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('')
  const [topic, setTopic] = useState('')
  const [documentType, setDocumentType] = useState('report')

  const generateToEditor = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          role,
          experience,
          topic,
          documentType,
          prompt: prompt || undefined
        })
      })

      const data = await response.json()
      if (data.content) {
        onContentGenerated(data.content)
      }
    } catch (error) {
      console.error('AI Generation Error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateDirectPDF = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-mcp-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt || topic || role })
      })

      const data = await response.json()
      if (data.success && data.content) {
        // Convert base64 to blob and download
        const linkSource = `data:application/pdf;base64,${data.content}`
        const downloadLink = document.createElement("a")
        const fileName = `${(topic || docTitle || 'generated').toLowerCase()}.pdf`
        downloadLink.href = linkSource
        downloadLink.download = fileName
        downloadLink.click()
      }
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
            onClick={() => setMode('editor')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'editor' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Content
          </button>
          <button
            onClick={() => setMode('layout')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'layout' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Layout
          </button>
          <button
            onClick={() => setMode('direct')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'direct' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Direct PDF
          </button>
        </div>
      </div>

      {mode === 'editor' ? (
        <>
          {type === 'cv' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Role / Position</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Digital Marketing Strategies"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="report">Report</option>
                  <option value="proposal">Proposal</option>
                  <option value="article">Article</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Instructions (Optional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add any specific requirements..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            onClick={generateToEditor}
            disabled={isGenerating || (!role && !topic)}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3.5 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            {isGenerating ? (
              <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>Processing...</>
            ) : (
              <><Plus size={20} />Add Content to Editor</>
            )}
          </button>
        </>
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
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setPrompt("Center all headings")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">Center Headings</button>
            <button onClick={() => setPrompt("Move contact info to top right")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">Contact to Top-Right</button>
            <button onClick={() => setPrompt("Make all text font Inter")} className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">Standardize Fonts</button>
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
