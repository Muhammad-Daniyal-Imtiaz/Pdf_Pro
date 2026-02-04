import { create } from 'zustand'

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
export const GRID_SIZE = 1 // Snap to 1px for perfection

export interface ElementStyle {
    width: number
    height: number
    x: number
    y: number
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    borderWidth?: number
    borderColor?: string
    borderRadius?: number
    fontWeight?: string | number
    lineHeight?: number
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    zIndex?: number
    padding?: number
    linkDecoration?: 'none' | 'underline'
}

export interface EditorElement {
    id: string
    type: 'heading' | 'paragraph' | 'text' | 'social-icon' | 'image' | 'link' | 'line' | 'container'
    x: number
    y: number
    content: string
    style: ElementStyle
    iconType?: string
    url?: string
    lineOrientation?: 'horizontal' | 'vertical'
}

interface EditorState {
    activeTab: 'document' | 'cv' | 'contracts'
    elements: EditorElement[]
    selectedId: string | null
    docTitle: string
    isSidebarCollapsed: boolean
    isGeneratingPDF: boolean
    zoom: number

    setTab: (tab: 'document' | 'cv' | 'contracts') => void
    addElement: (type: EditorElement['type'], x?: number, y?: number) => void
    addSocialIcon: (iconType: string) => void
    addLine: (orientation: 'horizontal' | 'vertical') => void
    updateElement: (id: string, updates: Partial<EditorElement>) => void
    updateElementStyle: (id: string, style: Partial<ElementStyle>) => void
    removeElement: (id: string) => void
    selectElement: (id: string | null) => void
    moveElement: (id: string, x: number, y: number) => void
    resizeElement: (id: string, width: number, height: number) => void
    bringToFront: (id: string) => void
    sendToBack: (id: string) => void
    setDocTitle: (title: string) => void
    toggleSidebar: () => void
    setGeneratingPDF: (value: boolean) => void
    setZoom: (zoom: number) => void
    getElementJSON: () => string
}

const DEFAULT_STYLE: ElementStyle = {
    width: 200,
    height: 60,
    x: 0,
    y: 0,
    fontSize: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#1a1a1a',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: '#000000',
    borderRadius: 0,
    fontWeight: 400,
    lineHeight: 1.5,
    textAlign: 'left',
    zIndex: 1,
    opacity: 1,
    padding: 8,
}

// HELPER: Force integers to prevent sub-pixel blurring
const snapToInt = (val: number) => Math.round(val)

export const useEditorStore = create<EditorState>((set, get) => ({
    activeTab: 'document',
    elements: [
        {
            id: 'el-1',
            type: 'heading',
            x: 50,
            y: 50,
            content: 'Document Title',
            style: {
                ...DEFAULT_STYLE,
                width: 400,
                height: 60,
                fontSize: 32,
                fontWeight: 700,
            }
        },
        {
            id: 'el-2',
            type: 'paragraph',
            x: 50,
            y: 130,
            content: 'Start typing your content here. This text will appear exactly as shown in the PDF export.',
            style: {
                ...DEFAULT_STYLE,
                width: 500,
                height: 100,
                fontSize: 14,
                lineHeight: 1.6,
            }
        }
    ],
    selectedId: null,
    docTitle: 'Untitled Document',
    isSidebarCollapsed: false,
    isGeneratingPDF: false,
    zoom: 100,

    setTab: (tab) => set({ activeTab: tab }),

    addElement: (type, x = 100, y = 100) => {
        const { elements } = get()
        const id = `el-${Date.now()}`

        // Snap creation position
        const snappedX = snapToInt(x)
        const snappedY = snapToInt(y)
        const baseStyle = { ...DEFAULT_STYLE, x: snappedX, y: snappedY }

        let newElement: EditorElement = {
            id,
            type,
            x: snappedX,
            y: snappedY,
            content: 'New Element',
            style: baseStyle,
        }

        switch (type) {
            case 'heading':
                newElement.content = 'Heading'
                newElement.style = { ...baseStyle, width: 300, height: 50, fontSize: 24, fontWeight: 700 }
                break
            case 'paragraph':
                newElement.content = 'Paragraph text'
                newElement.style = { ...baseStyle, width: 400, height: 80, fontSize: 14 }
                break
            case 'link':
                newElement.content = 'https://example.com'
                newElement.style = { ...baseStyle, width: 250, height: 40, fontSize: 14, color: '#2563eb' }
                break
            case 'container':
                newElement.content = ''
                newElement.style = { ...baseStyle, width: 200, height: 200, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' }
                break
            case 'image':
                newElement.content = ''
                newElement.style = { ...baseStyle, width: 200, height: 150, backgroundColor: '#e5e7eb' }
                break
        }

        set({ elements: [...elements, newElement], selectedId: id })
    },

    addSocialIcon: (iconType) => {
        const { elements } = get()
        const id = `icon-${Date.now()}`
        const size = 48

        // Snap position
        const x = snapToInt(100 + (elements.length * 30) % 600)
        const y = snapToInt(100 + Math.floor(elements.length / 15) * 60)

        const newElement: EditorElement = {
            id,
            type: 'social-icon',
            iconType,
            x,
            y,
            content: iconType,
            style: { width: size, height: size, x, y, fontSize: 24 },
        }

        set({ elements: [...elements, newElement], selectedId: id })
    },

    addLine: (orientation) => {
        const { elements } = get()
        const id = `line-${Date.now()}`
        const x = snapToInt(100)
        const y = snapToInt(200)

        const newElement: EditorElement = {
            id,
            type: 'line',
            lineOrientation: orientation,
            x,
            y,
            content: '',
            style: {
                width: orientation === 'horizontal' ? 300 : 2,
                height: orientation === 'vertical' ? 200 : 2,
                x,
                y,
                backgroundColor: '#1a1a1a',
            },
        }

        set({ elements: [...elements, newElement], selectedId: id })
    },

    updateElement: (id, updates) => {
        set((state) => ({
            elements: state.elements.map((el) => {
                if (el.id !== id) return el

                // Snap coordinate updates
                const processed = { ...el, ...updates }
                if (updates.x !== undefined) processed.x = snapToInt(updates.x)
                if (updates.y !== undefined) processed.y = snapToInt(updates.y)

                return processed
            }),
        }))
    },

    updateElementStyle: (id, styleUpdates) => {
        set((state) => ({
            elements: state.elements.map((el) => {
                if (el.id !== id) return el

                // Round dimension updates
                const processed = { ...styleUpdates }
                if (styleUpdates.width !== undefined) processed.width = snapToInt(styleUpdates.width)
                if (styleUpdates.height !== undefined) processed.height = snapToInt(styleUpdates.height)

                return { ...el, style: { ...el.style, ...processed } }
            }),
        }))
    },

    removeElement: (id) => {
        set((state) => ({
            elements: state.elements.filter((el) => el.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
        }))
    },

    selectElement: (id) => set({ selectedId: id }),

    moveElement: (id, x, y) => {
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, x: snapToInt(Math.max(0, x)), y: snapToInt(Math.max(0, y)) } : el
            ),
        }))
    },

    resizeElement: (id, width, height) => {
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id
                    ? { ...el, style: { ...el.style, width: snapToInt(Math.max(20, width)), height: snapToInt(Math.max(20, height)) } }
                    : el
            ),
        }))
    },

    bringToFront: (id) => {
        set((state) => {
            const element = state.elements.find((el) => el.id === id)
            const others = state.elements.filter((el) => el.id !== id)
            return { elements: [...others, element!] }
        })
    },

    sendToBack: (id) => {
        set((state) => {
            const element = state.elements.find((el) => el.id === id)
            const others = state.elements.filter((el) => el.id !== id)
            return { elements: [element!, ...others] }
        })
    },

    setDocTitle: (title) => set({ docTitle: title }),

    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    setGeneratingPDF: (value) => set({ isGeneratingPDF: value }),

    setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),

    getElementJSON: () => JSON.stringify(get().elements, null, 2),
}))