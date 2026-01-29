
import { create } from 'zustand'

export interface EditorStyle {
    fontFamily: string
    fontSize: number
    color: string
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    textDecoration: 'none' | 'underline'
    textAlign: 'left' | 'center' | 'right'
    lineHeight: number
    margin: number
}

export interface EditorElement {
    id: string
    type: 'heading' | 'paragraph' | 'list' | 'image' | 'divider'
    content: string
    style: EditorStyle
}

interface EditorState {
    // Global App State
    activeTab: 'document' | 'cv' | 'contracts'
    editMode: 'manual' | 'ai'

    // Document State
    elements: EditorElement[]
    selectedId: string | null

    // Document Settings
    docTitle: string

    // Actions
    setTab: (tab: 'document' | 'cv' | 'contracts') => void
    setEditMode: (mode: 'manual' | 'ai') => void
    addElement: (type: EditorElement['type']) => void
    updateElement: (id: string, updates: Partial<EditorElement>) => void
    updateElementStyle: (id: string, styleUpdates: Partial<EditorStyle>) => void
    removeElement: (id: string) => void
    selectElement: (id: string | null) => void
    reorderElements: (newOrder: EditorElement[]) => void
}

const DEFAULT_STYLE: EditorStyle = {
    fontFamily: 'Arial',
    fontSize: 14,
    color: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    lineHeight: 1.5,
    margin: 10
}

export const useEditorStore = create<EditorState>((set) => ({
    activeTab: 'document',
    editMode: 'manual',
    elements: [
        {
            id: 'default-1',
            type: 'heading',
            content: 'Document Title',
            style: { ...DEFAULT_STYLE, fontSize: 24, fontWeight: 'bold' }
        }
    ],
    selectedId: null,
    docTitle: 'Untitled Document',

    setTab: (tab: 'document' | 'cv' | 'contracts') => set({ activeTab: tab }),
    setEditMode: (mode: 'manual' | 'ai') => set({ editMode: mode }),

    addElement: (type: EditorElement['type']) => set((state: EditorState) => {
        const newElement: EditorElement = {
            id: `el-${Date.now()}`,
            type,
            content: type === 'heading' ? 'New Heading' : type === 'paragraph' ? 'Start typing...' : type === 'list' ? '• List item' : '',
            style: {
                ...DEFAULT_STYLE,
                fontSize: type === 'heading' ? 20 : 14,
                fontWeight: type === 'heading' ? 'bold' : 'normal'
            }
        }
        return { elements: [...state.elements, newElement], selectedId: newElement.id }
    }),

    updateElement: (id: string, updates: Partial<EditorElement>) => set((state: EditorState) => ({
        elements: state.elements.map((el: EditorElement) => el.id === id ? { ...el, ...updates } : el)
    })),

    updateElementStyle: (id: string, styleUpdates: Partial<EditorStyle>) => set((state: EditorState) => ({
        elements: state.elements.map((el: EditorElement) =>
            el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
        )
    })),

    removeElement: (id: string) => set((state: EditorState) => ({
        elements: state.elements.filter((el: EditorElement) => el.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId
    })),

    selectElement: (id: string | null) => set({ selectedId: id }),

    reorderElements: (newOrder: EditorElement[]) => set({ elements: newOrder })
}))
