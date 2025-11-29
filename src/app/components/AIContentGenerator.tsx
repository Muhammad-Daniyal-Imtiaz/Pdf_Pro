'use client'

import { useState } from 'react'
import { AI_PROMPTS } from '../lib/ai-config'

interface AIContentGeneratorProps {
  onContentGenerated: (content: string) => void
  type: 'cv' | 'document'
  defaultPrompt?: string
}

export default function AIContentGenerator({ onContentGenerated, type, defaultPrompt }: AIContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState(defaultPrompt || '')
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('')
  const [topic, setTopic] = useState('')
  const [documentType, setDocumentType] = useState('report')

  const generateContent = async () => {
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">🤖 AI Content Generator</h3>
      
      {type === 'cv' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Role / Position
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Digital Marketing Strategies"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Instructions (Optional)
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Add any specific requirements..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <button
        onClick={generateContent}
        disabled={isGenerating || (!role && !topic)}
        className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating...
          </>
        ) : (
          <>
            <span>🚀</span>
            Generate with AI
          </>
        )}
      </button>
    </div>
  )
}