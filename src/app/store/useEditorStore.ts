
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
    width?: string
    height?: string
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

    // History State
    past: EditorElement[][]
    future: EditorElement[][]

    // Document Settings
    docTitle: string
    showTitle: boolean

    // Actions
    setTab: (tab: 'document' | 'cv' | 'contracts') => void
    setEditMode: (mode: 'manual' | 'ai') => void
    setDocTitle: (title: string) => void
    toggleShowTitle: () => void

    addElement: (type: EditorElement['type']) => void
    updateElement: (id: string, updates: Partial<EditorElement>) => void
    updateElementStyle: (id: string, styleUpdates: Partial<EditorStyle>) => void
    removeElement: (id: string) => void
    selectElement: (id: string | null) => void
    reorderElements: (newOrder: EditorElement[]) => void

    undo: () => void
    redo: () => void
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
    margin: 10,
    width: '100%',
    height: 'auto'
}

export const useEditorStore = create<EditorState>((set) => ({
    activeTab: 'document',
    editMode: 'manual',
    elements: [
        {
            id: 'default-1',
            type: 'heading',
            content: 'Introduction',
            style: { ...DEFAULT_STYLE, fontSize: 24, fontWeight: 'bold' }
        }
    ],
    selectedId: null,
    past: [],
    future: [],
    docTitle: 'Untitled Document',
    showTitle: true,

    setTab: (tab: 'document' | 'cv' | 'contracts') => set({ activeTab: tab }),
    setEditMode: (mode: 'manual' | 'ai') => set({ editMode: mode }),
    setDocTitle: (title: string) => set({ docTitle: title }),
    toggleShowTitle: () => set((state) => ({ showTitle: !state.showTitle })),

    addElement: (type: EditorElement['type']) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
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
        return {
            elements: [...state.elements, newElement],
            selectedId: newElement.id,
            past: newPast,
            future: []
        }
    }),

    updateElement: (id: string, updates: Partial<EditorElement>) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        return {
            elements: state.elements.map((el: EditorElement) => el.id === id ? { ...el, ...updates } : el),
            past: newPast,
            future: []
        }
    }),

    updateElementStyle: (id: string, styleUpdates: Partial<EditorStyle>) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        return {
            elements: state.elements.map((el: EditorElement) =>
                el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
            ),
            past: newPast,
            future: []
        }
    }),

    removeElement: (id: string) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        return {
            elements: state.elements.filter((el: EditorElement) => el.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
            past: newPast,
            future: []
        }
    }),

    selectElement: (id: string | null) => set({ selectedId: id }),

    reorderElements: (newOrder: EditorElement[]) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        return {
            elements: newOrder,
            past: newPast,
            future: []
        }
    }),

    undo: () => set((state) => {
        if (state.past.length === 0) return {}
        const previous = state.past[state.past.length - 1]
        const newPast = state.past.slice(0, state.past.length - 1)
        return {
            past: newPast,
            elements: previous,
            future: [state.elements, ...state.future]
        }
    }),

    redo: () => set((state) => {
        if (state.future.length === 0) return {}
        const next = state.future[0]
        const newFuture = state.future.slice(1)
        return {
            past: [...state.past, state.elements],
            elements: next,
            future: newFuture
        }
    })
}))
