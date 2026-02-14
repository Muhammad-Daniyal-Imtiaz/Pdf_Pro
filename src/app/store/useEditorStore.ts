// store/useEditorStore.ts
import { create } from 'zustand'

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
export const GRID_SIZE = 1 // Snap to 1px for perfection

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

    // ADDED: Missing functions
    clearPages: () => void
    setPages: (pages: EditorPage[]) => void

    // Page management
    addPage: () => void
    removePage: (index: number) => void
    alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'baseline') => void
    distributeElements: (axis: 'horizontal' | 'vertical') => void
    splitElement: (id: string) => void
    mergeElements: () => void
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
}

// HELPER: Force integers to prevent sub-pixel blurring
const snapToInt = (val: number) => Math.round(val)

export const useEditorStore = create<EditorState>((set, get) => ({
    activeTab: 'document',
    pages: [
        {
            id: 'page-1',
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
                    },
                    pageIndex: 0
                },
                {
                    id: 'el-2',
                    type: 'paragraph',
                    x: 50,
                    y: 130,
                    content: 'Start typing your content here. This text will appear exactly as shown in PDF export.',
                    style: {
                        ...DEFAULT_STYLE,
                        width: 500,
                        height: 100,
                        fontSize: 14,
                        lineHeight: 1.6,
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

    setTab: (tab) => set({ activeTab: tab }),

    setImportPrecision: (precision) => set({ importPrecision: precision }),

    addElement: (type, x = 100, y = 100) => {
        const { pages } = get()
        // Add to the last page or create a new page if none exist
        const targetPageIndex = pages.length - 1
        const id = `el-${crypto.randomUUID()}`

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
            pageIndex: targetPageIndex
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
                newElement.content = 'Click to edit text'
                newElement.style = { ...baseStyle, width: 200, height: 200, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' }
                break
            case 'image':
                newElement.content = ''
                newElement.style = { ...baseStyle, width: 200, height: 150, backgroundColor: '#e5e7eb' }
                break
            case 'text':
                newElement.content = 'Text'
                newElement.style = { ...baseStyle, width: 200, height: 40, fontSize: 14 }
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
        const { pages } = get()
        const targetPageIndex = pages.length - 1
        const id = `icon-${crypto.randomUUID()}`
        const size = 48

        // Snap position
        const x = snapToInt(100 + (pages[targetPageIndex].elements.length * 30) % 600)
        const y = snapToInt(100 + Math.floor(pages[targetPageIndex].elements.length / 15) * 60)

        const newElement: EditorElement = {
            id,
            type: 'social-icon',
            iconType,
            x,
            y,
            content: iconType,
            style: { width: size, height: size, fontSize: 24 },
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
        const { pages } = get()
        const targetPageIndex = pages.length - 1
        const id = `line-${crypto.randomUUID()}`
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
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) => {
                    if (el.id !== id) return el

                    // Snap coordinate updates
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
        set((state) => {
            const updatedPages = state.pages.map((page) => {
                const elements = page.elements.map((el) => {
                    if (el.id !== id) return el

                    // Round dimension updates
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

    // ADDED: Implementation of clearPages and setPages
    clearPages: () => set({ pages: [], selectedIds: [] }),

    setPages: (newPages) => set({ pages: newPages }),

    // Page management
    addPage: () => {
        const { pages } = get()
        const newPage: EditorPage = {
            id: `page-${crypto.randomUUID()}`,
            elements: []
        }
        set({ pages: [...pages, newPage] })
    },

    removePage: (index) => {
        const { pages } = get()
        if (pages.length <= 1) return // Prevent removing last page

        const updatedPages = pages.filter((_, i) => i !== index)

        set({
            pages: updatedPages,
            selectedIds: [] // Clear selection when removing a page
        })
    },

    alignElements: (direction) => {
        const { pages, selectedIds } = get()
        if (selectedIds.length < 2) return

        // Find all selected elements across all pages
        const selectedElements: EditorElement[] = []
        pages.forEach(page => {
            page.elements.forEach(el => {
                if (selectedIds.includes(el.id)) {
                    selectedElements.push(el)
                }
            })
        })

        // Simple alignment implementation
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
                // For text elements, align by baseline
                const textElements = selectedElements.filter(el => ['paragraph', 'heading'].includes(el.type))
                if (textElements.length > 0) {
                    const baselineY = textElements[0].y + textElements[0].style.height
                    updates = textElements.map(el => ({ y: baselineY - el.style.height }))
                }
                break
        }

        // Apply updates
        updates.forEach((update, i) => {
            const element = selectedElements[i]
            if (element) {
                get().updateElement(element.id, update)
            }
        })
    },

    distributeElements: (axis) => {
        const { pages, selectedIds } = get()
        if (selectedIds.length < 3) return

        // Find all selected elements across all pages
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
        set((state) => {
            const el = state.pages.flatMap(p => p.elements).find(item => item.id === id)
            if (!el || !el.originalItems || el.originalItems.length <= 1) return state

            // Create new elements for each original item
            const newElements: EditorElement[] = el.originalItems.map(item => ({
                id: `el-${crypto.randomUUID()}`,
                type: 'text',
                x: item.x,
                y: item.y,
                content: item.str,
                pageIndex: el.pageIndex,
                isImported: true,
                isModified: true, // Mark so they mask original
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
                    padding: 0
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
        const { pages, selectedIds } = get()
        if (selectedIds.length < 2) return

        const selectedEls = pages.flatMap(p => p.elements).filter(el => selectedIds.includes(el.id))
        if (selectedEls.length === 0) return

        const first = selectedEls[0]
        const minX = Math.min(...selectedEls.map(el => el.x))
        const minY = Math.min(...selectedEls.map(el => el.y))
        const maxX = Math.max(...selectedEls.map(el => el.x + el.style.width))
        const maxY = Math.max(...selectedEls.map(el => el.y + el.style.height))

        // PDF bounds
        const pdfX = Math.min(...selectedEls.filter(e => e.pdfX !== undefined).map(e => e.pdfX!))
        const pdfY = Math.min(...selectedEls.filter(e => e.pdfY !== undefined).map(e => e.pdfY!))
        const pdfMaxX = Math.max(...selectedEls.filter(e => e.pdfX !== undefined).map(e => e.pdfX! + e.pdfW!))
        const pdfMaxY = Math.max(...selectedEls.filter(e => e.pdfY !== undefined).map(e => e.pdfY! + e.pdfH!))

        const newId = `merged-${crypto.randomUUID()}`
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
