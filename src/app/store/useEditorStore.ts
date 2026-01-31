
import { create } from 'zustand'

export interface EditorStyle {
    // Typography
    fontFamily: string
    fontSize: number
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
    fontStyle: 'normal' | 'italic'
    textDecoration: 'none' | 'underline' | 'line-through'
    textAlign: 'left' | 'center' | 'right' | 'justify'
    lineHeight: number
    letterSpacing?: number

    // Colors
    color: string
    backgroundColor?: string
    borderColor?: string

    // Spacing (in pixels)
    padding: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    margin: number
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number

    // Layout (absolute positioning - in pixels)
    width: number // Always pixels now
    height: number // Always pixels now
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number

    // Borders
    borderRadius?: number
    borderWidth?: number

    // Transform
    rotation?: number
    opacity?: number
    zIndex?: number
}

export interface EditorElement {
    id: string
    type: 'heading' | 'paragraph' | 'list' | 'image' | 'divider'
    content: string
    style: EditorStyle
    // Absolute positioning (in pixels)
    x: number
    y: number
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

    // Canvas Settings
    snapToGrid: boolean
    gridSize: number
    showGuides: boolean
    showPreview: boolean
    zoom: number

    // Interface State
    isSidebarCollapsed: boolean
    toggleSidebar: () => void

    // Actions
    setTab: (tab: 'document' | 'cv' | 'contracts') => void
    setEditMode: (mode: 'manual' | 'ai') => void
    setDocTitle: (title: string) => void
    toggleShowTitle: () => void

    // Canvas Actions
    setSnapToGrid: (snap: boolean) => void
    setGridSize: (size: number) => void
    setShowGuides: (show: boolean) => void
    setShowPreview: (show: boolean) => void
    setZoom: (zoom: number) => void

    addElement: (type: EditorElement['type']) => void
    updateElement: (id: string, updates: Partial<EditorElement>) => void
    updateElementStyle: (id: string, styleUpdates: Partial<EditorStyle>) => void

    // Position & Dimension Methods
    moveElement: (id: string, x: number, y: number) => void
    resizeElement: (id: string, width: number, height: number) => void

    removeElement: (id: string) => void
    selectElement: (id: string | null) => void
    reorderElements: (newOrder: EditorElement[]) => void

    // Layer operations
    raiseElement: (id: string) => void
    lowerElement: (id: string) => void
    sendToBack: (id: string) => void
    bringToFront: (id: string) => void

    undo: () => void
    redo: () => void
}

const DEFAULT_STYLE: EditorStyle = {
    // Typography
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,

    // Colors
    color: '#000000',
    backgroundColor: 'transparent',
    borderColor: '#cccccc',

    // Spacing (pixels)
    padding: 12,
    margin: 8,

    // Layout (pixels)
    width: 400,
    height: 80,
    minWidth: 100,
    maxWidth: 600,
    minHeight: 30,

    // Borders
    borderRadius: 0,
    borderWidth: 0,

    // Transform
    rotation: 0,
    opacity: 1,
    zIndex: 0
}

export const useEditorStore = create<EditorState>((set) => ({
    activeTab: 'document',
    editMode: 'manual',
    elements: [
        {
            id: 'default-1',
            type: 'heading',
            content: 'Introduction',
            x: 40,
            y: 40,
            style: { ...DEFAULT_STYLE, fontSize: 28, fontWeight: '700', width: 500, height: 60 }
        }
    ],
    selectedId: null,
    past: [],
    future: [],
    docTitle: 'Untitled Document',
    showTitle: true,
    snapToGrid: true,
    gridSize: 8,
    showGuides: true,
    showPreview: true,
    zoom: 100,

    setTab: (tab: 'document' | 'cv' | 'contracts') => set({ activeTab: tab }),
    setEditMode: (mode: 'manual' | 'ai') => set({ editMode: mode }),
    setDocTitle: (title: string) => set({ docTitle: title }),
    toggleShowTitle: () => set((state) => ({ showTitle: !state.showTitle })),

    setSnapToGrid: (snap: boolean) => set({ snapToGrid: snap }),
    setGridSize: (size: number) => set({ gridSize: size }),
    setShowGuides: (show: boolean) => set({ showGuides: show }),
    setShowPreview: (show: boolean) => set({ showPreview: show }),
    setZoom: (zoom: number) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),

    // Interface State
    isSidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    addElement: (type: EditorElement['type']) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const baseX = 60
        const baseY = 120 + (state.elements.length * 30)
        const newElement: EditorElement = {
            id: `el-${Date.now()}`,
            type,
            content: type === 'heading' ? 'New Heading' : type === 'paragraph' ? 'Start typing...' : type === 'list' ? '• List item' : '',
            x: baseX,
            y: baseY,
            style: {
                ...DEFAULT_STYLE,
                fontSize: type === 'heading' ? 22 : 14,
                fontWeight: type === 'heading' ? '700' : '400',
                width: type === 'heading' ? 500 : 450,
                height: type === 'heading' ? 50 : 60
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

    resizeElement: (id: string, width: number, height: number) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const snap = (v: number) => state.snapToGrid ? Math.round(v / state.gridSize) * state.gridSize : v
        return {
            elements: state.elements.map(el =>
                el.id === id ? {
                    ...el,
                    style: { ...el.style, width: snap(width), height: snap(height) }
                } : el
            ),
            past: newPast,
            future: []
        }
    }),

    moveElement: (id: string, x: number, y: number) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const snap = (v: number) => state.snapToGrid ? Math.round(v / state.gridSize) * state.gridSize : v
        return {
            elements: state.elements.map(el =>
                el.id === id ? {
                    ...el,
                    x: Math.max(0, snap(x)),
                    y: Math.max(0, snap(y))
                } : el
            ),
            past: newPast,
            future: []
        }
    }),

    raiseElement: (id: string) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const newElements = [...state.elements]
        const idx = newElements.findIndex(el => el.id === id)
        if (idx < newElements.length - 1) {
            [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]]
        }
        return { elements: newElements, past: newPast, future: [] }
    }),

    lowerElement: (id: string) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const newElements = [...state.elements]
        const idx = newElements.findIndex(el => el.id === id)
        if (idx > 0) {
            [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]]
        }
        return { elements: newElements, past: newPast, future: [] }
    }),

    sendToBack: (id: string) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const newElements = state.elements.filter(el => el.id !== id)
        const element = state.elements.find(el => el.id === id)
        return { elements: element ? [element, ...newElements] : newElements, past: newPast, future: [] }
    }),

    bringToFront: (id: string) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const newElements = state.elements.filter(el => el.id !== id)
        const element = state.elements.find(el => el.id === id)
        return { elements: element ? [...newElements, element] : newElements, past: newPast, future: [] }
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
