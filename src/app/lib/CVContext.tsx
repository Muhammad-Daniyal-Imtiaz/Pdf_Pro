'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { CVTemplate, cvTemplates } from './cv-templates'

interface CVContextType {
    activeTemplate: CVTemplate
    setActiveTemplate: (template: CVTemplate) => void
    activeSection: string
    setActiveSection: (sectionId: string) => void
    isGenerating: boolean
    setIsGenerating: (isGenerating: boolean) => void
    updateTemplateField: (sectionId: string, fieldId: string, value: string) => void
    updateSectionContent: (sectionId: string, content: string) => void
    resetTemplate: () => void
}

const CVContext = createContext<CVContextType | undefined>(undefined)

export function CVProvider({ children }: { children: ReactNode }) {
    // Default to the first template
    const [activeTemplate, setActiveTemplateState] = useState<CVTemplate>(cvTemplates[0])
    const [activeSection, setActiveSection] = useState<string>('personal')
    const [isGenerating, setIsGenerating] = useState(false)

    // Persist state to session storage to survive refreshes (optional but good for UX)
    useEffect(() => {
        const saved = sessionStorage.getItem('cv-active-template')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Ensure the parsed object has the structure we expect, or valid template reference
                // For now, we trust it if it has an ID, otherwise fallback
                if (parsed && parsed.id) {
                    setActiveTemplateState(parsed)
                }
            } catch (e) {
                console.error('Failed to parse saved template', e)
            }
        }
    }, [])

    useEffect(() => {
        sessionStorage.setItem('cv-active-template', JSON.stringify(activeTemplate))
    }, [activeTemplate])

    const setActiveTemplate = (template: CVTemplate) => {
        setActiveTemplateState(template)
        // When switching templates, we might want to carry over data if feasible, 
        // but for now, we'll just switch the template structure.
        // In a production app, we would map data from one template to another.
    }

    const updateTemplateField = (sectionId: string, fieldId: string, value: string) => {
        setActiveTemplateState(prev => {
            const newStructure = prev.structure.map(section => {
                if (section.id === sectionId && section.fields) {
                    return {
                        ...section,
                        fields: section.fields.map(field =>
                            field.id === fieldId ? { ...field, value } : field
                        )
                    }
                }
                return section
            })
            return { ...prev, structure: newStructure }
        })
    }

    const updateSectionContent = (sectionId: string, content: string) => {
        setActiveTemplateState(prev => {
            const newStructure = prev.structure.map(section => {
                if (section.id === sectionId) {
                    return { ...section, content }
                }
                return section
            })
            return { ...prev, structure: newStructure }
        })
    }

    const resetTemplate = () => {
        // Reset to the original version of the current template from the static list
        const original = cvTemplates.find(t => t.id === activeTemplate.id) || cvTemplates[0]
        setActiveTemplateState(original)
    }

    return (
        <CVContext.Provider value={{
            activeTemplate,
            setActiveTemplate,
            activeSection,
            setActiveSection,
            isGenerating,
            setIsGenerating,
            updateTemplateField,
            updateSectionContent,
            resetTemplate
        }}>
            {children}
        </CVContext.Provider>
    )
}

export function useCV() {
    const context = useContext(CVContext)
    if (context === undefined) {
        throw new Error('useCV must be used within a CVProvider')
    }
    return context
}
