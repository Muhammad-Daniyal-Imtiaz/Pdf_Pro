'use client'

import { useState, useEffect } from 'react'
import { CVTemplate, CVSection, CVField } from '../lib/cv-templates'

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
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          CV Editor - {activeTemplate.name}
        </h2>
        <div className="text-sm text-gray-500">
          {activeTemplate.category} • {activeTemplate.structure.length} sections
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Sections</h3>
            <div className="space-y-2">
              {activeTemplate.structure.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{section.title}</div>
                  <div className="text-xs opacity-75">
                    {section.type} • {section.fields?.length || 0} fields
                  </div>
                </button>
              ))}
            </div>

            {/* Add Section Buttons */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-3">Add Section</h3>
              <div className="grid grid-cols-2 gap-2">
                {['experience', 'education', 'skills', 'projects', 'languages', 'certifications'].map((type) => (
                  <button
                    key={type}
                    onClick={() => addNewSection(type)}
                    className="p-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-3">
          {activeTemplate.structure.map((section) => (
            <div
              key={section.id}
              className={`p-6 border-2 rounded-lg mb-4 transition-all ${
                activeSection === section.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {section.title}
              </h3>

              {/* Dynamic Fields */}
              {section.fields && section.fields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {section.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="List your skills separated by commas..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Separate skills with commas (e.g., JavaScript, React, Node.js)
                  </p>
                </div>
              )}

              {/* Experience/Education Items */}
              {(section.type === 'experience' || section.type === 'education') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">
                      {section.type === 'experience' ? 'Work Experience' : 'Education History'}
                    </h4>
                    <button
                      onClick={() => {
                        // Add new experience/education item
                        const newContent = section.content + '\n\n• New Item - Add details...'
                        updateSectionContent(section.id, newContent)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      + Add Item
                    </button>
                  </div>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSectionContent(section.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={8}
                    placeholder={`Add your ${section.type} items, one per line...`}
                  />
                  <p className="text-sm text-gray-500">
                    Use bullet points or paragraphs to describe each item
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}