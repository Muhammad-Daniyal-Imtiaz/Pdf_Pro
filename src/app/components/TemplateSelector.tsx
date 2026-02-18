'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, FileText, Briefcase, TrendingUp, Mail, ChevronRight, Star, Clock, Download, Sparkles, User, Building, Zap, Info, Loader2, AlertCircle } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================
interface Template {
  id: string
  name: string
  description: string
  category: string
  file: string
  preview: string
  tags: string[]
  color: string
  icon: string
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  color: string
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void
  onAIGenerate?: (template: Template, prompt: string, templateData?: any) => void
  className?: string
}

// =============================================================================
// PROMPT GUIDES - Help users provide the right information
// =============================================================================
const PROMPT_GUIDES: Record<string, { title: string; placeholder: string; suggestions: string[] }> = {
  cv: {
    title: 'Tell us about yourself',
    placeholder: `Example: My name is Sarah Johnson. I'm a Senior Software Engineer with 7 years of experience. I work at Microsoft on cloud infrastructure. My email is sarah@email.com and phone is +1 555-123-4567. I have a Master's in Computer Science from MIT (2015). My skills include Python, Go, Kubernetes, AWS, and Docker. Key achievements: Led migration of 50+ microservices to Kubernetes, reduced cloud costs by 40%.`,
    suggestions: [
      '📛 Your full name',
      '💼 Job title & company',
      '📅 Years of experience',
      '📧 Email & phone',
      '🎓 Education (degree, school, year)',
      '💻 Technical skills & tools',
      '🏆 Key achievements',
    ]
  },
  'cover-letter': {
    title: 'Tell us about the job you\'re applying for',
    placeholder: `Example: I'm John Smith applying for the Product Manager position at Google. I have 5 years of PM experience at Amazon where I led the launch of 3 major products. I'm excited about Google's AI initiatives and have experience with ML product development. Contact: john@email.com, +1 555-987-6543.`,
    suggestions: [
      '📛 Your name & contact info',
      '🎯 Position you\'re applying for',
      '🏢 Company name',
      '💼 Your current role & experience',
      '⭐ Why you\'re a good fit',
      '🚀 Key achievements to highlight',
    ]
  },
  'business-proposal': {
    title: 'Describe your business proposal',
    placeholder: `Example: I'm Alex Chen, CEO of TechSolutions Inc. We're proposing a web application development project for Acme Corp. The project involves building a customer portal with React and Node.js. Timeline: 12 weeks. Budget: $50,000. Contact: alex@techsolutions.com, +1 555-456-7890.`,
    suggestions: [
      '🏢 Your company name & contact',
      '👤 Client company name',
      '📋 Project description',
      '🎯 Objectives & deliverables',
      '📅 Timeline',
      '💰 Budget/pricing',
    ]
  },
  invoice: {
    title: 'Provide invoice details',
    placeholder: `Example: Invoice from WebDev Studio to Client ABC Inc. Services: Website redesign ($3,000), SEO optimization ($1,500), Monthly maintenance ($500/month x 3). Total: $6,000. Payment terms: Net 30. Due date: March 15, 2024.`,
    suggestions: [
      '🏢 Your company details',
      '👤 Client information',
      '📝 Services/items provided',
      '💰 Prices & quantities',
      '📅 Due date & payment terms',
    ]
  },
  brochure: {
    title: 'Describe your company or product',
    placeholder: `Example: InnovateTech is a leading AI solutions company founded in 2020. We help businesses automate their operations using cutting-edge machine learning. Our services include: AI Consulting, Custom ML Models, and Data Analytics. Contact: info@innovatetech.com, 555-TECH.`,
    suggestions: [
      '🏢 Company name & tagline',
      '📖 Company description',
      '🎯 Services/products offered',
      '✨ Key features & benefits',
      '📞 Contact information',
    ]
  },
  generic: {
    title: 'Describe your document',
    placeholder: 'Tell us what you want to create and provide any relevant details like names, dates, and specific information...',
    suggestions: [
      '📝 Document type & purpose',
      '👤 Names & contact details',
      '📋 Key content to include',
    ]
  }
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function TemplateSelector({ onTemplateSelect, onAIGenerate, className = '' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showAIPrompt, setShowAIPrompt] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const allTemplates: Template[] = [
        // CV Templates
        { id: 'cv-modern-blue', name: 'Modern Blue Resume', description: 'A professional, clean resume with a modern blue accent.', category: 'career', file: 'cv/cv-modern-blue.json', preview: '/templates/previews/cv-modern-blue.png', tags: ['cv'], color: '#3b82f6', icon: '📄' },
        { id: 'cv-executive-gray', name: 'Executive Gray Resume', description: 'Sophisticated executive resume with professional gray styling.', category: 'career', file: 'cv/cv-executive-gray.json', preview: '/templates/previews/cv-executive-gray.png', tags: ['cv'], color: '#6b7280', icon: '📄' },
        { id: 'cv-creative-purple', name: 'Creative Purple Resume', description: 'Vibrant creative resume with purple accent for designers.', category: 'career', file: 'cv/cv-creative-purple.json', preview: '/templates/previews/cv-creative-purple.png', tags: ['cv'], color: '#9333ea', icon: '📄' },
        { id: 'cv-minimalist-black', name: 'Minimalist Black Resume', description: 'Clean minimalist resume with elegant black typography.', category: 'career', file: 'cv/cv-minimalist-black.json', preview: '/templates/previews/cv-minimalist-black.png', tags: ['cv'], color: '#000000', icon: '📄' },
        { id: 'cv-nature-green', name: 'Nature Green Resume', description: 'Fresh resume with natural green color scheme.', category: 'career', file: 'cv/cv-nature-green.json', preview: '/templates/previews/cv-nature-green.png', tags: ['cv'], color: '#10b981', icon: '📄' },
        { id: 'cv-tech-teal', name: 'Tech Teal Resume', description: 'Modern tech resume with vibrant teal accent.', category: 'career', file: 'cv/cv-tech-teal.json', preview: '/templates/previews/cv-tech-teal.png', tags: ['cv'], color: '#14b8a6', icon: '📄' },
        { id: 'cv-elegant-rose', name: 'Elegant Rose Resume', description: 'Sophisticated resume with elegant rose accents.', category: 'career', file: 'cv/cv-elegant-rose.json', preview: '/templates/previews/cv-elegant-rose.png', tags: ['cv'], color: '#f43f5e', icon: '📄' },
        { id: 'cv-bold-orange', name: 'Bold Orange Resume', description: 'Eye-catching resume with bold orange styling.', category: 'career', file: 'cv/cv-bold-orange.json', preview: '/templates/previews/cv-bold-orange.png', tags: ['cv'], color: '#f97316', icon: '📄' },
        { id: 'cv-clean-white', name: 'Clean White Resume', description: 'Pure white minimalist resume design.', category: 'career', file: 'cv/cv-clean-white.json', preview: '/templates/previews/cv-clean-white.png', tags: ['cv'], color: '#ffffff', icon: '📄' },
        { id: 'cv-corporate-navy', name: 'Corporate Navy Resume', description: 'Professional corporate resume with navy blue theme.', category: 'career', file: 'cv/cv-corporate-navy.json', preview: '/templates/previews/cv-corporate-navy.png', tags: ['cv'], color: '#1e3a8a', icon: '📄' },
        
        // Cover Letter Templates
        { id: 'cover-letter-professional', name: 'Professional Cover Letter', description: 'Standard professional cover letter format.', category: 'career', file: 'cover-letter/cover-letter-professional.json', preview: '/templates/previews/cover-letter-professional.png', tags: ['cover-letter'], color: '#1f2937', icon: '✉️' },
        { id: 'cover-letter-executive', name: 'Executive Cover Letter', description: 'Executive-level cover letter with formal styling.', category: 'career', file: 'cover-letter/cover-letter-executive.json', preview: '/templates/previews/cover-letter-executive.png', tags: ['cover-letter'], color: '#374151', icon: '✉️' },
        { id: 'cover-letter-creative', name: 'Creative Cover Letter', description: 'Creative cover letter for design and marketing roles.', category: 'career', file: 'cover-letter/cover-letter-creative.json', preview: '/templates/previews/cover-letter-creative.png', tags: ['cover-letter'], color: '#7c3aed', icon: '✉️' },
        { id: 'cover-letter-modern', name: 'Modern Cover Letter', description: 'Contemporary modern cover letter design.', category: 'career', file: 'cover-letter/cover-letter-modern.json', preview: '/templates/previews/cover-letter-modern.png', tags: ['cover-letter'], color: '#059669', icon: '✉️' },
        { id: 'cover-letter-tech', name: 'Tech Cover Letter', description: 'Technology-focused cover letter for tech roles.', category: 'career', file: 'cover-letter/cover-letter-tech.json', preview: '/templates/previews/cover-letter-tech.png', tags: ['cover-letter'], color: '#0891b2', icon: '✉️' },
        
        // Business Templates
        { id: 'business-proposal-standard', name: 'Standard Business Proposal', description: 'Professional standard business proposal template.', category: 'business', file: 'business/business-proposal-standard.json', preview: '/templates/previews/business-proposal-standard.png', tags: ['proposal'], color: '#1e40af', icon: '💼' },
        { id: 'business-proposal-premium', name: 'Premium Business Proposal', description: 'High-end premium business proposal design.', category: 'business', file: 'business/business-proposal-premium.json', preview: '/templates/previews/business-proposal-premium.png', tags: ['proposal'], color: '#7c3aed', icon: '💼' },
        { id: 'business-proposal-corporate', name: 'Corporate Business Proposal', description: 'Formal corporate business proposal template.', category: 'business', file: 'business/business-proposal-corporate.json', preview: '/templates/previews/business-proposal-corporate.png', tags: ['proposal'], color: '#1f2937', icon: '💼' },
        { id: 'business-proposal-startup', name: 'Startup Business Proposal', description: 'Modern startup business proposal design.', category: 'business', file: 'business/business-proposal-startup.json', preview: '/templates/previews/business-proposal-startup.png', tags: ['proposal'], color: '#ea580c', icon: '💼' },
        { id: 'business-proposal-tech', name: 'Tech Business Proposal', description: 'Technology-focused business proposal template.', category: 'business', file: 'business/business-proposal-tech.json', preview: '/templates/previews/business-proposal-tech.png', tags: ['proposal'], color: '#0891b2', icon: '💼' },
        
        // Brochure Templates
        { id: 'company-brochure-corporate', name: 'Corporate Company Brochure', description: 'Professional corporate brochure design.', category: 'marketing', file: 'brochure/company-brochure-corporate.json', preview: '/templates/previews/company-brochure-corporate.png', tags: ['brochure'], color: '#1e3a8a', icon: '📖' },
        { id: 'company-brochure-creative', name: 'Creative Company Brochure', description: 'Artistic creative brochure design.', category: 'marketing', file: 'brochure/company-brochure-creative.json', preview: '/templates/previews/company-brochure-creative.png', tags: ['brochure'], color: '#c026d3', icon: '📖' },
        { id: 'company-brochure-modern', name: 'Modern Company Brochure', description: 'Contemporary modern brochure design.', category: 'marketing', file: 'brochure/company-brochure-modern.json', preview: '/templates/previews/company-brochure-modern.png', tags: ['brochure'], color: '#6366f1', icon: '📖' },
        { id: 'company-brochure-tech', name: 'Tech Company Brochure', description: 'Modern technology-focused brochure.', category: 'marketing', file: 'brochure/company-brochure-tech.json', preview: '/templates/previews/company-brochure-tech.png', tags: ['brochure'], color: '#0891b2', icon: '📖' },
      ]
      
      setTemplates(allTemplates)
      
      const categories = [
        { id: 'career', name: 'Career & Professional', description: 'Resumes, CVs, and cover letters', color: '#3b82f6', icon: '💼' },
        { id: 'business', name: 'Business & Corporate', description: 'Proposals, reports, invoices, and contracts', color: '#1e40af', icon: '📊' },
        { id: 'marketing', name: 'Marketing & Sales', description: 'Company brochures and marketing materials', color: '#7c3aed', icon: '📖' }
      ]
      setCategories(categories)
      
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const getTemplateType = (template: Template): string => {
    if (template.id.includes('cv') || template.id.includes('resume')) return 'cv'
    if (template.id.includes('cover-letter')) return 'cover-letter'
    if (template.id.includes('proposal')) return 'business-proposal'
    if (template.id.includes('invoice')) return 'invoice'
    if (template.id.includes('brochure')) return 'brochure'
    return 'generic'
  }

  const getPromptGuide = (template: Template | null) => {
    if (!template) return PROMPT_GUIDES.generic
    const type = getTemplateType(template)
    return PROMPT_GUIDES[type] || PROMPT_GUIDES.generic
  }

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template)
    setError(null)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate)
    }
  }

  const handleAIGenerate = async () => {
    if (!selectedTemplate || !aiPrompt.trim() || !onAIGenerate) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      // First, load the template data
      const response = await fetch(`/templates/${selectedTemplate.file}`)
      if (!response.ok) throw new Error('Failed to load template')
      const templateData = await response.json()
      
      // Call the AI generate with full template data
      await onAIGenerate(selectedTemplate, aiPrompt.trim(), templateData)
      
      setShowAIPrompt(false)
      setAiPrompt('')
    } catch (err: any) {
      console.error('AI Generation failed:', err)
      setError(err.message || 'AI generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'career': return <Briefcase className="w-5 h-5" />
      case 'business': return <TrendingUp className="w-5 h-5" />
      case 'marketing': return <Mail className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const promptGuide = getPromptGuide(selectedTemplate)

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Professional Templates
            </h2>
            <p className="text-gray-600 mt-1">Select a template and let AI fill it with your data</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4 text-yellow-500" />
            AI-Powered
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Categories</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({templates.length})
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category.id)}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{template.description}</p>
                  <div className="flex gap-1 mt-2">
                    {template.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <Star className="w-5 h-5 text-blue-600 fill-current flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No templates found.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedTemplate && (
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {selectedTemplate.icon} {selectedTemplate.name}
              </h3>
              <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {onAIGenerate && (
                <button
                  onClick={() => setShowAIPrompt(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Generate
                </button>
              )}
              <button
                onClick={handleUseTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIPrompt && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                AI Generate: {selectedTemplate.name}
              </h3>
              <p className="text-gray-600 mt-1">
                Provide your details below and AI will create a professional {getTemplateType(selectedTemplate)} for you.
              </p>
            </div>

            {/* Prompt Guide */}
            <div className="p-6 bg-blue-50 border-b border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">{promptGuide.title}</h4>
                  <p className="text-sm text-blue-700 mb-3">Include these details for the best results:</p>
                  <div className="flex flex-wrap gap-2">
                    {promptGuide.suggestions.map((suggestion, i) => (
                      <span key={i} className="px-2 py-1 bg-white text-blue-800 text-xs rounded-full border border-blue-200">
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Details
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={promptGuide.placeholder}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-48 resize-none text-sm"
                disabled={isGenerating}
              />
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                💡 Tip: The more details you provide, the more accurate and professional your document will be.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAIPrompt(false)
                  setAiPrompt('')
                  setError(null)
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
