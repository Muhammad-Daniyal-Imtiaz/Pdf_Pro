// store/useEditorStore.ts - UPDATED WITH RESIZE MODES
import { create } from 'zustand'

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
export const GRID_SIZE = 1

// TEXT RESIZE MODES - Canva/Figma style
export type TextResizeMode = 'fixed' | 'auto-width' | 'auto-height' | 'auto-both'

export interface ElementStyle {
    width: number
    height: number
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
    rotation?: number
    opacity?: number
    fontStyle?: 'normal' | 'italic'
    // NEW: Resize mode for text elements
    resizeMode?: TextResizeMode
    // NEW: Min/max constraints
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
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
    lineStyle?: 'solid' | 'dashed' | 'dotted'
    pageIndex: number
    isImported?: boolean
    isModified?: boolean
    isAIGenerated?: boolean
    pdfX?: number
    pdfY?: number
    pdfW?: number
    pdfH?: number
    originalItems?: any[]
}

export interface EditorPage {
    id: string
    elements: EditorElement[]
    backgroundImage?: string
}

interface EditorState {
    activeTab: 'document' | 'cv' | 'contracts'
    pages: EditorPage[]
    selectedIds: string[]
    docTitle: string
    isSidebarCollapsed: boolean
    isGeneratingPDF: boolean
    zoom: number
    importPrecision: 'paragraph' | 'precise' | 'raw'

    // Actions
    setTab: (tab: 'document' | 'cv' | 'contracts') => void
    setImportPrecision: (precision: 'paragraph' | 'precise' | 'raw') => void
    addElement: (type: EditorElement['type'], overrides?: Partial<EditorElement>) => void
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

    // NEW: Resize mode actions
    setElementResizeMode: (id: string, mode: TextResizeMode) => void
    toggleResizeMode: (id: string) => void

    // NEW: Layout Intelligence Actions
    applyLayoutChanges: (changes: EditorElement[]) => void
    getLayoutContext: () => string

    clearPages: () => void
    setPages: (pages: EditorPage[]) => void

    // Page management
    addPage: () => void
    removePage: (index: number) => void
    alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'baseline') => void
    distributeElements: (axis: 'horizontal' | 'vertical') => void
    splitElement: (id: string) => void
    mergeElements: () => void

    // History
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
}

const DEFAULT_STYLE: ElementStyle = {
    width: 200,
    height: 60,
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
    resizeMode: 'auto-width', // Changed from 'fixed' to 'auto-width' for manual elements
}

const snapToInt = (val: number) => Math.round(val)

const history: EditorPage[][] = []
let historyIndex = -1
const MAX_HISTORY = 50

const saveHistory = (pages: EditorPage[]) => {
    // Deep clone to avoid mutations in history
    const snapshot = JSON.parse(JSON.stringify(pages))

    // If we're not at end of history, remove future entries
    if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1)
    }

    history.push(snapshot)
    if (history.length > MAX_HISTORY) {
        history.shift()
    } else {
        historyIndex++
    }
}

export const useEditorStore = create<EditorState>((set, get) => ({
    activeTab: 'document',
    pages: [
        {
            id: 'page-1',
            elements: [
                {
                    id: 'el-1',
                    type: 'heading',
                    x: 60,
                    y: 60,
                    content: 'Document Title',
                    style: {
                        ...DEFAULT_STYLE,
                        width: 674,
                        height: 60,
                        fontSize: 32,
                        fontWeight: 700,
                        resizeMode: 'auto-height',
                    },
                    pageIndex: 0
                }
            ]
        }
    ],
    selectedIds: [],
    docTitle: 'Untitled Document',
    isSidebarCollapsed: false,
    isGeneratingPDF: false,
    zoom: 100,
    importPrecision: 'precise',

    canUndo: false,
    canRedo: false,

    undo: () => {
        if (historyIndex > 0) {
            historyIndex--
            set({
                pages: JSON.parse(JSON.stringify(history[historyIndex])),
                canUndo: historyIndex > 0,
                canRedo: historyIndex < history.length - 1
            })
        }
    },

    redo: () => {
        if (historyIndex < history.length - 1) {
            historyIndex++
            set({
                pages: JSON.parse(JSON.stringify(history[historyIndex])),
                canUndo: historyIndex > 0,
                canRedo: historyIndex < history.length - 1
            })
        }
    },

    setTab: (tab) => set({ activeTab: tab }),
    setImportPrecision: (precision) => set({ importPrecision: precision }),

    addElement: (type, itemOverrides = {}) => {
        saveHistory(get().pages)
        const { pages } = get()
        const targetPageIndex = pages.length - 1
        const id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const targetPage = pages[targetPageIndex]

        // Smart positioning: Calculate y position based on existing elements
        const getSmartYPosition = (): number => {
            // If user specified position, use that
            if (itemOverrides.y !== undefined) return itemOverrides.y

            // Get bounds of existing elements
            const existingElements = targetPage.elements
            if (existingElements.length === 0) {
                // First element - start at 80px from top
                return 80
            }

            // Find bottommost element
            const bottoms = existingElements.map(el => (el.y || 0) + (el.style?.height || 40))
            const maxBottom = Math.max(...bottoms)

            // Add 30px margin for clean spacing
            return maxBottom + 30
        }

        // Extract x, y from overrides or use smart positioning
        const x = itemOverrides.x ?? 60  // Default left margin
        const y = getSmartYPosition()

        const snappedX = snapToInt(Math.min(Math.max(x, 10), 700)) // Keep within margins
        const snappedY = snapToInt(Math.max(y, 80)) // Keep within top margin
        const baseStyle = { ...DEFAULT_STYLE }

        let newElement: EditorElement = {
            type,
            x: snappedX,
            y: snappedY,
            content: itemOverrides.content || 'New Element',
            style: { ...baseStyle, ...itemOverrides.style },
            ...itemOverrides,
            // Ensure ID and PageIndex are fixed for new items
            id,
            pageIndex: targetPageIndex
        }

        switch (type) {
            case 'heading':
                newElement.content = itemOverrides.content || 'Heading'
                newElement.style = {
                    ...baseStyle,
                    width: 674,  // Full content width for proper wrapping
                    height: 60,  // Default height, will auto-expand
                    fontSize: 28,
                    fontWeight: 700,
                    resizeMode: 'auto-height',  // CRITICAL: Allow text to wrap and expand
                    color: '#1a1a1a',
                    ...itemOverrides.style
                }
                break
            case 'paragraph':
                newElement.content = itemOverrides.content || 'Paragraph text'
                newElement.style = {
                    ...baseStyle,
                    width: 500,
                    height: 80,
                    fontSize: 14,
                    resizeMode: 'auto-height',
                    lineHeight: 1.6,
                    ...itemOverrides.style
                }
                break
            case 'text':
                newElement.content = itemOverrides.content || 'Text'
                newElement.style = {
                    ...baseStyle,
                    width: 200,
                    height: 40,
                    fontSize: 14,
                    resizeMode: 'auto-width',
                    ...itemOverrides.style
                }
                break
            case 'link':
                newElement.content = itemOverrides.content || 'https://example.com'
                newElement.style = {
                    ...baseStyle,
                    width: 250,
                    height: 40,
                    fontSize: 14,
                    color: '#2563eb',
                    resizeMode: 'auto-width',
                    ...itemOverrides.style
                }
                break
            case 'container':
                newElement.content = itemOverrides.content || 'Click to edit text'
                newElement.style = {
                    ...baseStyle,
                    width: 300,
                    height: 120,
                    backgroundColor: '#f3f4f6',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    resizeMode: 'auto-height',
                    ...itemOverrides.style
                }
                break
            case 'image':
                newElement.content = itemOverrides.content || ''
                newElement.style = {
                    ...baseStyle,
                    width: 200,
                    height: 150,
                    backgroundColor: '#e5e7eb',
                    resizeMode: 'fixed',
                    ...itemOverrides.style
                }
                break
        }

        const updatedPages = [...pages]
        updatedPages[targetPageIndex] = {
            ...updatedPages[targetPageIndex],
            elements: [...updatedPages[targetPageIndex].elements, newElement]
        }

        set({ pages: updatedPages, selectedIds: [id] })
    },

    addSocialIcon: (iconType) => {
        saveHistory(get().pages)
        const { pages } = get()
        const targetPageIndex = pages.length - 1
        const id = `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newElement: EditorElement = {
            id,
            type: 'social-icon',
            x: 60,
            y: 100,
            content: iconType,
            iconType,
            style: {
                ...DEFAULT_STYLE,
                width: 24,
                height: 24,
                resizeMode: 'fixed'
            },
            pageIndex: targetPageIndex
        }

        const updatedPages = [...pages]
        updatedPages[targetPageIndex] = {
            ...updatedPages[targetPageIndex],
            elements: [...updatedPages[targetPageIndex].elements, newElement]
        }

        set({ pages: updatedPages, selectedIds: [id] })
    },

    addLine: (orientation) => {
        saveHistory(get().pages)
        const { pages } = get()
        const targetPageIndex = pages.length - 1
        const id = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const x = snapToInt(100)
        const y = snapToInt(200)

        const newElement: EditorElement = {
            id,
            type: 'line',
            lineOrientation: orientation,
            lineStyle: 'solid',
            x,
            y,
            content: '',
            style: {
                width: orientation === 'horizontal' ? 300 : 2,
                height: orientation === 'vertical' ? 200 : 2,
                backgroundColor: '#1a1a1a',
                resizeMode: 'fixed'
            },
            pageIndex: targetPageIndex
        }

        const updatedPages = [...pages]
        updatedPages[targetPageIndex] = {
            ...updatedPages[targetPageIndex],
            elements: [...updatedPages[targetPageIndex].elements, newElement]
        }

        set({ pages: updatedPages, selectedIds: [id] })
    },

    updateElement: (id, updates) => {
        saveHistory(get().pages)
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) => {
                    if (el.id !== id) return el

                    const processed = { ...el, ...updates, isModified: true }
                    if (updates.x !== undefined) processed.x = snapToInt(updates.x)
                    if (updates.y !== undefined) processed.y = snapToInt(updates.y)

                    return processed
                })

                return { ...page, elements }
            })

            return { pages: updatedPages }
        })
    },

    updateElementStyle: (id, styleUpdates) => {
        saveHistory(get().pages)
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) => {
                    if (el.id !== id) return el

                    const processed = { ...styleUpdates }
                    if (styleUpdates.width !== undefined) processed.width = snapToInt(styleUpdates.width)
                    if (styleUpdates.height !== undefined) processed.height = snapToInt(styleUpdates.height)

                    return { ...el, isModified: true, style: { ...el.style, ...processed } }
                })

                return { ...page, elements }
            })

            return { pages: updatedPages }
        })
    },

    removeElement: (id) => {
        saveHistory(get().pages)
        set((state) => {
            const updatedPages = state.pages.map((page) => ({
                ...page,
                elements: page.elements.filter((el) => el.id !== id)
            }))

            return {
                pages: updatedPages,
                selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
            }
        })
    },

    selectElement: (id) => set({ selectedIds: id ? [id] : [] }),

    moveElement: (id, x, y) => {
        // Move is high frequency, so we don't save history here usually
        // but for completeness we can, or just save on "move end" if we had that.
        // For now, let's keep it responsive without history on every pixel.
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) =>
                    el.id === id ? { ...el, x: snapToInt(Math.max(0, x)), y: snapToInt(Math.max(0, y)) } : el
                )

                return { ...page, elements }
            })

            return { pages: updatedPages }
        })
    },

    resizeElement: (id, width, height) => {
        // Same as move
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) =>
                    el.id === id
                        ? { ...el, style: { ...el.style, width: snapToInt(Math.max(20, width)), height: snapToInt(Math.max(20, height)) } }
                        : el
                )

                return { ...page, elements }
            })

            return { pages: updatedPages }
        })
    },

    // NEW: Set resize mode for element
    setElementResizeMode: (id, mode) => {
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) =>
                    el.id === id
                        ? { ...el, style: { ...el.style, resizeMode: mode } }
                        : el
                )
                return { ...page, elements }
            })
            return { pages: updatedPages }
        })
    },

    // NEW: Toggle through resize modes
    toggleResizeMode: (id) => {
        set((state) => {
            const element = state.pages.flatMap(p => p.elements).find(el => el.id === id)
            if (!element) return state

            const currentMode = element.style.resizeMode || 'auto-height'
            const modes: TextResizeMode[] = ['fixed', 'auto-width', 'auto-height', 'auto-both']
            const currentIndex = modes.indexOf(currentMode)
            const nextMode = modes[(currentIndex + 1) % modes.length]

            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) =>
                    el.id === id
                        ? { ...el, style: { ...el.style, resizeMode: nextMode } }
                        : el
                )
                return { ...page, elements }
            })

            return { pages: updatedPages }
        })
    },

    bringToFront: (id) => {
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const element = page.elements.find((el) => el.id === id)
                const others = page.elements.filter((el) => el.id !== id)

                return { ...page, elements: [...others, element!] }
            })

            return { pages: updatedPages }
        })
    },

    sendToBack: (id) => {
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const element = page.elements.find((el) => el.id === id)
                const others = page.elements.filter((el) => el.id !== id)

                return { ...page, elements: [element!, ...others] }
            })

            return { pages: updatedPages }
        })
    },

    setDocTitle: (title) => set({ docTitle: title }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setGeneratingPDF: (value) => set({ isGeneratingPDF: value }),
    setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),
    getElementJSON: () => JSON.stringify(get().pages[get().pages.length - 1].elements, null, 2),

    // NEW: Layout Intelligence implementation
    getLayoutContext: () => {
        const { pages } = get()
        // Simplify context to save tokens and focus on layout
        return JSON.stringify(pages.map(p => ({
            id: p.id,
            elements: p.elements.map(el => ({
                id: el.id,
                type: el.type,
                x: el.x,
                y: el.y,
                content: el.content.substring(0, 100), // Truncate content
                width: el.style.width,
                height: el.style.height
            }))
        })))
    },

    applyLayoutChanges: (changes) => {
        saveHistory(get().pages)
        set((state) => {
            const updatedPages = [...state.pages]

            // Group elements by pageIndex to handle multi-page layouts
            const elementsByPage: Record<number, any[]> = {}

            changes.forEach(change => {
                const pageIndex = change.pageIndex || 0
                if (!elementsByPage[pageIndex]) {
                    elementsByPage[pageIndex] = []
                }
                elementsByPage[pageIndex].push(change)
            })

            // Process each page
            Object.entries(elementsByPage).forEach(([pageIndexStr, pageChanges]) => {
                const pageIndex = parseInt(pageIndexStr)

                // Ensure we have enough pages
                while (updatedPages.length <= pageIndex) {
                    updatedPages.push({
                        id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        elements: []
                    })
                }

                pageChanges.forEach(change => {
                    let found = false
                    // Prepare change - if it's a social-icon and content is provided, sync iconType
                    const processedChange = { ...change }
                    if (change.type === 'social-icon' && change.content) {
                        processedChange.iconType = change.content
                    }

                    // 1. Try to update existing in the correct page
                    const idx = updatedPages[pageIndex].elements.findIndex(el => el.id === change.id)
                    if (idx !== -1) {
                        updatedPages[pageIndex].elements[idx] = {
                            ...updatedPages[pageIndex].elements[idx],
                            ...processedChange,
                            style: { ...updatedPages[pageIndex].elements[idx].style, ...processedChange.style },
                            isModified: true,
                            // Preserve AI-generated flag if present
                            isAIGenerated: processedChange.isAIGenerated || updatedPages[pageIndex].elements[idx].isAIGenerated
                        }
                        found = true
                    }

                    // 2. If not found, add as new to the correct page
                    if (!found) {
                        const isTextElement = ['heading', 'paragraph', 'text', 'container'].includes(processedChange.type)

                        // For AI-generated text elements, use auto-height to prevent truncation
                        const resizeMode = processedChange.style?.resizeMode ||
                            (isTextElement ? 'auto-height' : 'fixed')

                        // CRITICAL: Ensure unique ID for new AI elements
                        const generatedId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        let finalId = change.id || generatedId

                        // Check if this ID exists already in any page
                        const idExists = updatedPages.some(p => p.elements.some(el => el.id === finalId))
                        if (idExists || !finalId) {
                            finalId = `ai-new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        }

                        const newEl = {
                            ...processedChange,
                            id: finalId,
                            pageIndex: pageIndex,
                            isModified: true,
                            isAIGenerated: processedChange.isAIGenerated || true,
                            style: {
                                ...DEFAULT_STYLE,
                                width: 200,
                                height: 60,
                                // CRITICAL: Use auto-height for AI-generated text elements
                                resizeMode: resizeMode,
                                ...processedChange.style
                            }
                        }
                        updatedPages[pageIndex].elements.push(newEl as EditorElement)
                    }
                })
            })

            return { pages: updatedPages }
        })
    },

    clearPages: () => set({
        pages: [{ id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, elements: [] }],
        selectedIds: []
    }),
    setPages: (newPages) => set({ pages: newPages }),

    addPage: () => {
        saveHistory(get().pages)
        const { pages } = get()
        const newPage: EditorPage = {
            id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            elements: []
        }
        set({ pages: [...pages, newPage] })
    },

    removePage: (index) => {
        saveHistory(get().pages)
        const { pages } = get()
        if (pages.length <= 1) return

        const updatedPages = pages.filter((_, i) => i !== index)

        set({
            pages: updatedPages,
            selectedIds: []
        })
    },

    alignElements: (direction) => {
        saveHistory(get().pages)
        const { pages, selectedIds } = get()
        if (selectedIds.length < 2) return

        const selectedElements: EditorElement[] = []
        pages.forEach(page => {
            page.elements.forEach(el => {
                if (selectedIds.includes(el.id)) {
                    selectedElements.push(el)
                }
            })
        })

        let updates: Partial<EditorElement>[] = []

        switch (direction) {
            case 'left':
                const minX = Math.min(...selectedElements.map(el => el.x))
                updates = selectedElements.map(el => ({ x: minX }))
                break
            case 'center':
                const centerX = selectedElements.reduce((sum, el) => sum + el.x, 0) / selectedElements.length
                updates = selectedElements.map(el => ({ x: centerX }))
                break
            case 'right':
                const maxX = Math.max(...selectedElements.map(el => el.x + el.style.width))
                updates = selectedElements.map(el => ({ x: maxX - el.style.width }))
                break
            case 'top':
                const minY = Math.min(...selectedElements.map(el => el.y))
                updates = selectedElements.map(el => ({ y: minY }))
                break
            case 'middle':
                const middleY = selectedElements.reduce((sum, el) => sum + el.y, 0) / selectedElements.length
                updates = selectedElements.map(el => ({ y: middleY }))
                break
            case 'bottom':
                const maxY = Math.max(...selectedElements.map(el => el.y + el.style.height))
                updates = selectedElements.map(el => ({ y: maxY - el.style.height }))
                break
            case 'baseline':
                const textElements = selectedElements.filter(el => ['paragraph', 'heading'].includes(el.type))
                if (textElements.length > 0) {
                    const baselineY = textElements[0].y + textElements[0].style.height
                    updates = textElements.map(el => ({ y: baselineY - el.style.height }))
                }
                break
        }

        updates.forEach((update, i) => {
            const element = selectedElements[i]
            if (element) {
                get().updateElement(element.id, update)
            }
        })
    },

    distributeElements: (axis) => {
        saveHistory(get().pages)
        const { pages, selectedIds } = get()
        if (selectedIds.length < 3) return

        const selectedElements: EditorElement[] = []
        pages.forEach(page => {
            page.elements.forEach(el => {
                if (selectedIds.includes(el.id)) {
                    selectedElements.push(el)
                }
            })
        })

        const sortedElements = selectedElements
            .sort((a, b) => axis === 'horizontal' ? a.x - b.x : a.y - b.y)

        if (axis === 'horizontal') {
            const totalWidth = sortedElements.reduce((sum, el) => sum + el.style.width, 0)
            const firstX = sortedElements[0].x
            const lastX = sortedElements[sortedElements.length - 1].x + sortedElements[sortedElements.length - 1].style.width
            const availableSpace = lastX - firstX - totalWidth
            const spacing = availableSpace / (sortedElements.length - 1)

            let currentX = firstX
            sortedElements.forEach((el) => {
                get().updateElement(el.id, { x: currentX })
                currentX += el.style.width + spacing
            })
        } else {
            const totalHeight = sortedElements.reduce((sum, el) => sum + el.style.height, 0)
            const firstY = sortedElements[0].y
            const lastY = sortedElements[sortedElements.length - 1].y + sortedElements[sortedElements.length - 1].style.height
            const availableSpace = lastY - firstY - totalHeight
            const spacing = availableSpace / (sortedElements.length - 1)

            let currentY = firstY
            sortedElements.forEach((el) => {
                get().updateElement(el.id, { y: currentY })
                currentY += el.style.height + spacing
            })
        }
    },

    splitElement: (id) => {
        saveHistory(get().pages)
        set((state) => {
            const el = state.pages.flatMap(p => p.elements).find(item => item.id === id)
            if (!el || !el.originalItems || el.originalItems.length <= 1) return state

            const newElements: EditorElement[] = el.originalItems.map(item => ({
                id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'text',
                x: item.x,
                y: item.y,
                content: item.str,
                pageIndex: el.pageIndex,
                isImported: true,
                isModified: true,
                pdfX: item.pdfX,
                pdfY: item.pdfY,
                pdfW: item.pdfW,
                pdfH: item.pdfH,
                style: {
                    ...el.style,
                    width: item.width,
                    height: item.height,
                    fontSize: item.fontSize,
                    backgroundColor: el.style.backgroundColor || '#ffffff',
                    padding: 0,
                    resizeMode: 'fixed'
                }
            }))

            const updatedPages = state.pages.map(page => {
                if (page.elements.every(item => item.id !== id)) return page
                return {
                    ...page,
                    elements: [
                        ...page.elements.filter(item => item.id !== id),
                        ...newElements
                    ]
                }
            })

            return { pages: updatedPages, selectedIds: newElements.map(e => e.id) }
        })
    },

    mergeElements: () => {
        saveHistory(get().pages)
        const { pages, selectedIds } = get()
        if (selectedIds.length < 2) return

        const selectedEls = pages.flatMap(p => p.elements).filter(el => selectedIds.includes(el.id))
        if (selectedEls.length === 0) return

        const first = selectedEls[0]
        const minX = Math.min(...selectedEls.map(el => el.x))
        const minY = Math.min(...selectedEls.map(el => el.y))
        const maxX = Math.max(...selectedEls.map(el => el.x + el.style.width))
        const maxY = Math.max(...selectedEls.map(el => el.y + el.style.height))

        const pdfX = Math.min(...selectedEls.filter(e => e.pdfX !== undefined).map(e => e.pdfX!))
        const pdfY = Math.min(...selectedEls.filter(e => e.pdfY !== undefined).map(e => e.pdfY!))
        const pdfMaxX = Math.max(...selectedEls.filter(e => e.pdfX !== undefined).map(e => e.pdfX! + e.pdfW!))
        const pdfMaxY = Math.max(...selectedEls.filter(e => e.pdfY !== undefined).map(e => e.pdfY! + e.pdfH!))

        const newId = `merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const merged: EditorElement = {
            id: newId,
            type: 'text',
            x: minX,
            y: minY,
            content: selectedEls.map(el => el.content).join(' '),
            pageIndex: first.pageIndex,
            isModified: true,
            isImported: selectedEls.some(e => e.isImported),
            pdfX,
            pdfY,
            pdfW: pdfMaxX - pdfX,
            pdfH: pdfMaxY - pdfY,
            style: {
                ...first.style,
                width: maxX - minX,
                height: maxY - minY,
                resizeMode: 'auto-height'
            }
        }

        const updatedPages = pages.map(page => {
            if (page.elements.some(el => selectedIds.includes(el.id))) {
                return {
                    ...page,
                    elements: [
                        ...page.elements.filter(el => !selectedIds.includes(el.id)),
                        merged
                    ]
                }
            }
            return page
        })

        set({ pages: updatedPages, selectedIds: [newId] })
    }
}))
