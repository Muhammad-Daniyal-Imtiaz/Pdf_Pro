'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, FileText, Briefcase, TrendingUp, Mail, BookOpen, ChevronRight, Star, Clock, Download, Sparkles } from 'lucide-react'

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

interface TemplateIndex {
  templates: Template[]
  categories: TemplateCategory[]
  metadata: {
    version: string
    lastUpdated: string
    totalTemplates: number
  }
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void
  onAIGenerate?: (template: Template, prompt: string) => void
  className?: string
}

export default function TemplateSelector({ onTemplateSelect, onAIGenerate, className = '' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showAIPrompt, setShowAIPrompt] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      // Direct template loading with known file structure
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
        { id: 'cover-letter-minimalist', name: 'Minimalist Cover Letter', description: 'Clean minimalist cover letter design.', category: 'career', file: 'cover-letter/cover-letter-minimalist.json', preview: '/templates/previews/cover-letter-minimalist.png', tags: ['cover-letter'], color: '#6b7280', icon: '✉️' },
        { id: 'cover-letter-tech', name: 'Tech Cover Letter', description: 'Technology-focused cover letter for tech roles.', category: 'career', file: 'cover-letter/cover-letter-tech.json', preview: '/templates/previews/cover-letter-tech.png', tags: ['cover-letter'], color: '#0891b2', icon: '✉️' },
        { id: 'cover-letter-traditional', name: 'Traditional Cover Letter', description: 'Classic traditional cover letter format.', category: 'career', file: 'cover-letter/cover-letter-traditional.json', preview: '/templates/previews/cover-letter-traditional.png', tags: ['cover-letter'], color: '#475569', icon: '✉️' },
        { id: 'cover-letter-modern', name: 'Modern Cover Letter', description: 'Contemporary modern cover letter design.', category: 'career', file: 'cover-letter/cover-letter-modern.json', preview: '/templates/previews/cover-letter-modern.png', tags: ['cover-letter'], color: '#059669', icon: '✉️' },
        { id: 'cover-letter-elegant', name: 'Elegant Cover Letter', description: 'Sophisticated elegant cover letter design.', category: 'career', file: 'cover-letter/cover-letter-elegant.json', preview: '/templates/previews/cover-letter-elegant.png', tags: ['cover-letter'], color: '#be123c', icon: '✉️' },
        { id: 'cover-letter-simple', name: 'Simple Cover Letter', description: 'Straightforward simple cover letter format.', category: 'career', file: 'cover-letter/cover-letter-simple.json', preview: '/templates/previews/cover-letter-simple.png', tags: ['cover-letter'], color: '#64748b', icon: '✉️' },
        { id: 'cover-letter-academic', name: 'Academic Cover Letter', description: 'Academic cover letter for research and education positions.', category: 'career', file: 'cover-letter/cover-letter-academic.json', preview: '/templates/previews/cover-letter-academic.png', tags: ['cover-letter'], color: '#7c2d12', icon: '✉️' },
        
        // Business Templates
        { id: 'business-proposal-standard', name: 'Standard Business Proposal', description: 'Professional standard business proposal template.', category: 'business', file: 'business/business-proposal-standard.json', preview: '/templates/previews/business-proposal-standard.png', tags: ['proposal'], color: '#1e40af', icon: '💼' },
        { id: 'business-proposal-premium', name: 'Premium Business Proposal', description: 'High-end premium business proposal design.', category: 'business', file: 'business/business-proposal-premium.json', preview: '/templates/previews/business-proposal-premium.png', tags: ['proposal'], color: '#7c3aed', icon: '💼' },
        { id: 'business-proposal-express', name: 'Express Business Proposal', description: 'Quick express business proposal format.', category: 'business', file: 'business/business-proposal-express.json', preview: '/templates/previews/business-proposal-express.png', tags: ['proposal'], color: '#dc2626', icon: '💼' },
        { id: 'business-proposal-corporate', name: 'Corporate Business Proposal', description: 'Formal corporate business proposal template.', category: 'business', file: 'business/business-proposal-corporate.json', preview: '/templates/previews/business-proposal-corporate.png', tags: ['proposal'], color: '#1f2937', icon: '💼' },
        { id: 'business-proposal-startup', name: 'Startup Business Proposal', description: 'Modern startup business proposal design.', category: 'business', file: 'business/business-proposal-startup.json', preview: '/templates/previews/business-proposal-startup.png', tags: ['proposal'], color: '#ea580c', icon: '💼' },
        { id: 'business-proposal-tech', name: 'Tech Business Proposal', description: 'Technology-focused business proposal template.', category: 'business', file: 'business/business-proposal-tech.json', preview: '/templates/previews/business-proposal-tech.png', tags: ['proposal'], color: '#0891b2', icon: '💼' },
        { id: 'business-proposal-consulting', name: 'Consulting Business Proposal', description: 'Professional consulting business proposal format.', category: 'business', file: 'business/business-proposal-consulting.json', preview: '/templates/previews/business-proposal-consulting.png', tags: ['proposal'], color: '#059669', icon: '💼' },
        { id: 'business-proposal-sales', name: 'Sales Business Proposal', description: 'Sales-focused business proposal template.', category: 'business', file: 'business/business-proposal-sales.json', preview: '/templates/previews/business-proposal-sales.png', tags: ['proposal'], color: '#e11d48', icon: '💼' },
        { id: 'business-proposal-partnership', name: 'Partnership Business Proposal', description: 'Partnership-focused business proposal design.', category: 'business', file: 'business/business-proposal-partnership.json', preview: '/templates/previews/business-proposal-partnership.png', tags: ['proposal'], color: '#6366f1', icon: '💼' },
        { id: 'business-proposal-template', name: 'Generic Business Proposal', description: 'Versatile generic business proposal template.', category: 'business', file: 'business/business-proposal-template.json', preview: '/templates/previews/business-proposal-template.png', tags: ['proposal'], color: '#475569', icon: '💼' },
        
        // Brochure Templates
        { id: 'company-brochure-corporate', name: 'Corporate Company Brochure', description: 'Professional corporate brochure design.', category: 'marketing', file: 'brochure/company-brochure-corporate.json', preview: '/templates/previews/company-brochure-corporate.png', tags: ['brochure'], color: '#1e3a8a', icon: '📖' },
        { id: 'company-brochure-creative', name: 'Creative Company Brochure', description: 'Artistic creative brochure design.', category: 'marketing', file: 'brochure/company-brochure-creative.json', preview: '/templates/previews/company-brochure-creative.png', tags: ['brochure'], color: '#c026d3', icon: '📖' },
        { id: 'company-brochure-minimal', name: 'Minimal Company Brochure', description: 'Clean minimal brochure design.', category: 'marketing', file: 'brochure/company-brochure-minimal.json', preview: '/templates/previews/company-brochure-minimal.png', tags: ['brochure'], color: '#64748b', icon: '📖' },
        { id: 'company-brochure-luxury', name: 'Luxury Company Brochure', description: 'Premium luxury brochure design.', category: 'marketing', file: 'brochure/company-brochure-luxury.json', preview: '/templates/previews/company-brochure-luxury.png', tags: ['brochure'], color: '#a16207', icon: '📖' },
        { id: 'company-brochure-tech', name: 'Tech Company Brochure', description: 'Modern technology-focused brochure.', category: 'marketing', file: 'brochure/company-brochure-tech.json', preview: '/templates/previews/company-brochure-tech.png', tags: ['brochure'], color: '#0891b2', icon: '📖' },
        { id: 'company-brochure-startup', name: 'Startup Company Brochure', description: 'Dynamic startup brochure design.', category: 'marketing', file: 'brochure/company-brochure-startup.json', preview: '/templates/previews/company-brochure-startup.png', tags: ['brochure'], color: '#ea580c', icon: '📖' },
        { id: 'company-brochure-modern', name: 'Modern Company Brochure', description: 'Contemporary modern brochure design.', category: 'marketing', file: 'brochure/company-brochure-modern.json', preview: '/templates/previews/company-brochure-modern.png', tags: ['brochure'], color: '#6366f1', icon: '📖' },
        { id: 'company-brochure-classic', name: 'Classic Company Brochure', description: 'Traditional classic brochure design.', category: 'marketing', file: 'brochure/company-brochure-classic.json', preview: '/templates/previews/company-brochure-classic.png', tags: ['brochure'], color: '#475569', icon: '📖' },
        { id: 'company-brochure-professional', name: 'Professional Company Brochure', description: 'Business professional brochure template.', category: 'marketing', file: 'brochure/company-brochure-professional.json', preview: '/templates/previews/company-brochure-professional.png', tags: ['brochure'], color: '#1f2937', icon: '📖' },
        { id: 'company-brochure-template', name: 'Generic Company Brochure', description: 'Versatile generic brochure template.', category: 'marketing', file: 'brochure/company-brochure-template.json', preview: '/templates/previews/company-brochure-template.png', tags: ['brochure'], color: '#6b7280', icon: '📖' }
      ]
      
      setTemplates(allTemplates)
      
      // Set categories
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

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate)
    }
  }

  const handleAIGenerate = () => {
    if (selectedTemplate && aiPrompt.trim() && onAIGenerate) {
      onAIGenerate(selectedTemplate, aiPrompt.trim())
      setShowAIPrompt(false)
      setAiPrompt('')
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
            <p className="text-gray-600 mt-1">Choose from our collection of premium templates</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Last updated: {new Date().toLocaleDateString()}
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
            All Templates ({templates.length})
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
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Template Preview */}
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <div className="w-16 h-1 bg-gray-300 rounded mx-auto"></div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: template.color }}
                  ></span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{template.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No templates found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedTemplate && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedTemplate.name}</h3>
              <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {onAIGenerate && (
                <button
                  onClick={() => setShowAIPrompt(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
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
      {showAIPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Generate with AI - {selectedTemplate?.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Describe what you want to create, and AI will generate content based on this template.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Create a resume for a senior software engineer with 5 years of experience in web development..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-32 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowAIPrompt(false)
                  setAiPrompt('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
