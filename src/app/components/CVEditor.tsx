'use client'

import { useState, useEffect } from 'react'
import { CVTemplate, CVSection, CVField } from '../lib/cv-templates'
import {
  User, Briefcase, GraduationCap, Wrench, Globe,
  Award, FileText, Plus, Trash2, ChevronRight, Settings
} from 'lucide-react'

interface CVEditorProps {
  template: CVTemplate
  onTemplateUpdate: (template: CVTemplate) => void
}

export default function CVEditor({ template, onTemplateUpdate }: CVEditorProps) {
  const [activeTemplate, setActiveTemplate] = useState<CVTemplate>(template)
  const [activeSection, setActiveSection] = useState<string>('personal')

  useEffect(() => {
    setActiveTemplate(template)
  }, [template])

  const updateField = (sectionId: string, fieldId: string, value: string) => {
    const updatedTemplate = { ...activeTemplate }
    const section = updatedTemplate.structure.find(s => s.id === sectionId)
    if (section && section.fields) {
      const field = section.fields.find(f => f.id === fieldId)
      if (field) {
        field.value = value
        setActiveTemplate(updatedTemplate)
        onTemplateUpdate(updatedTemplate)
      }
    }
  }

  const updateSectionContent = (sectionId: string, content: string) => {
    const updatedTemplate = { ...activeTemplate }
    const section = updatedTemplate.structure.find(s => s.id === sectionId)
    if (section) {
      section.content = content
      setActiveTemplate(updatedTemplate)
      onTemplateUpdate(updatedTemplate)
    }
  }

  const addNewSection = (type: string) => {
    const newSection: CVSection = {
      id: `section-${Date.now()}`,
      type: type as any,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      content: '',
      fields: []
    }

    const updatedTemplate = {
      ...activeTemplate,
      structure: [...activeTemplate.structure, newSection]
    }

    setActiveTemplate(updatedTemplate)
    onTemplateUpdate(updatedTemplate)
    setActiveSection(newSection.id)
  }

  const deleteSection = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      const updatedTemplate = {
        ...activeTemplate,
        structure: activeTemplate.structure.filter(s => s.id !== sectionId)
      }
      setActiveTemplate(updatedTemplate)
      onTemplateUpdate(updatedTemplate)
      if (activeSection === sectionId) {
        setActiveSection(updatedTemplate.structure[0]?.id || '')
      }
    }
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'personal': return <User className="w-4 h-4" />
      case 'experience': return <Briefcase className="w-4 h-4" />
      case 'education': return <GraduationCap className="w-4 h-4" />
      case 'skills': return <Wrench className="w-4 h-4" />
      case 'languages': return <Globe className="w-4 h-4" />
      case 'certifications': return <Award className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-[800px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            CV Editor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Editing: <span className="font-medium text-blue-600">{activeTemplate.name}</span>
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
          {activeTemplate.category}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Section Navigation */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Sections
            </h3>
            {activeTemplate.structure.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${activeSection === section.id
                    ? 'bg-white shadow-md text-blue-600 border border-blue-100'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${activeSection === section.id ? 'bg-blue-50' : 'bg-gray-100 group-hover:bg-gray-50'
                    }`}>
                    {getSectionIcon(section.type)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="text-[10px] opacity-60 capitalize">{section.type}</div>
                  </div>
                </div>
                {section.type !== 'personal' && (
                  <Trash2
                    className="w-4 h-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSection(section.id)
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Add Section Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Add Section
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {['experience', 'education', 'skills', 'projects', 'languages', 'certifications'].map((type) => (
                <button
                  key={type}
                  onClick={() => addNewSection(type)}
                  className="flex items-center justify-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="w-2/3 overflow-y-auto p-6 bg-white">
          {activeTemplate.structure.map((section) => {
            if (section.id !== activeSection) return null

            return (
              <div key={section.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {getSectionIcon(section.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Edit the content for this section
                    </p>
                  </div>
                </div>

                {/* Dynamic Fields */}
                {section.fields && section.fields.length > 0 && (
                  <div className="grid grid-cols-1 gap-5 mb-6">
                    {section.fields.map((field) => (
                      <div key={field.id} className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 group-focus-within:text-blue-600 transition-colors">
                          {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={field.value}
                            onChange={(e) => updateField(section.id, field.id, e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                            rows={4}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={field.value}
                            onChange={(e) => updateField(section.id, field.id, e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Section Content */}
                {section.type === 'summary' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Summary
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSectionContent(section.id, e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                      rows={8}
                      placeholder="Write your professional summary..."
                    />
                  </div>
                )}

                {section.type === 'skills' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills & Technologies
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSectionContent(section.id, e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      rows={6}
                      placeholder="List your skills separated by commas..."
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Separate skills with commas (e.g., JavaScript, React, Node.js)
                    </p>
                  </div>
                )}

                {/* Experience/Education Items */}
                {(section.type === 'experience' || section.type === 'education' || section.type === 'projects') && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-800 text-sm">
                        {section.type === 'experience' ? 'Work Experience' : section.type === 'education' ? 'Education History' : 'Projects'}
                      </h4>
                      <button
                        onClick={() => {
                          const newContent = section.content + '\n\n• New Item - Add details...'
                          updateSectionContent(section.id, newContent)
                        }}
                        className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
                      >
                        + Add Item
                      </button>
                    </div>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSectionContent(section.id, e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all font-mono text-sm"
                      rows={12}
                      placeholder={`Add your ${section.type} items...`}
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Use bullet points (•) for best formatting
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}