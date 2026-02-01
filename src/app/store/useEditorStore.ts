
import { create } from 'zustand'
import { CoordinateSystem } from '@/app/lib/geometry-engine/CoordinateSystem'

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
    borderStyle?: 'solid' | 'dashed' | 'dotted'

    // Transform
    rotation?: number
    opacity?: number
    zIndex?: number

    // Layout locking
    lockAspectRatio?: boolean

    // Link styling
    linkColor?: string
    linkDecoration?: 'none' | 'underline' | 'line-through'
}

export interface EditorElement {
    id: string
    type: 'heading' | 'paragraph' | 'list' | 'image' | 'divider' | 'social-icon' | 'link' | 'line'
    content: string
    style: EditorStyle
    // Absolute positioning (in pixels)
    x: number
    y: number
    // Additional properties for specific element types
    iconType?: string // For social icons
    url?: string // For links
    phoneNumber?: string // For phone numbers
    lineOrientation?: 'horizontal' | 'vertical' // For lines
    lineStyle?: 'solid' | 'dashed' | 'dotted' // For lines
    isClickable?: boolean // For links/phone numbers

    // Labeling (for icons/links)
    showLabel?: boolean
    labelPosition?: 'right' | 'left' | 'top' | 'bottom'
}

interface EditorState {
    // Global App State
    activeTab: 'document' | 'cv' | 'contracts'
    editMode: 'manual' | 'ai'

    // Document State
    elements: EditorElement[]
    selectedId: string | null
    selectedIds: string[] // Multi-selection support

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

    // PDF Generation State
    isGeneratingPDF: boolean
    pdfValidationWarnings: string[]

    // Auto-save
    lastSaved: Date | null
    isAutoSaving: boolean
    toggleAutoSave: () => void
    saveDocument: () => Promise<void>

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
    addSocialIcon: (iconType: string) => void
    addLine: (orientation: 'horizontal' | 'vertical') => void
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

    // Multi-selection
    toggleSelection: (id: string) => void
    selectMultiple: (ids: string[]) => void
    clearSelection: () => void

    // Enhanced Alignment actions with real metrics
    alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'baseline') => void
    distributeElements: (axis: 'horizontal' | 'vertical') => void
    validateAlignment: () => { isValid: boolean; misalignedPairs: Array<{ id1: string; id2: string; deltaX: number; deltaY: number }> }
    getActualElementMetrics: (elementId: string) => any

    // PDF Generation
    setGeneratingPDF: (isGenerating: boolean) => void
    validateWYSIWYGFidelity: () => { isValid: boolean; warnings: string[] }

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
    borderStyle: 'solid',

    // Transform
    rotation: 0,
    opacity: 1,
    zIndex: 0,

    // Link styling
    linkColor: '#0066cc',
    linkDecoration: 'underline'
}

export const useEditorStore = create<EditorState>((set, get) => ({
    activeTab: 'document',
    editMode: 'manual',
    elements: [
        {
            id: 'title-1',
            type: 'heading',
            content: 'Untitled Document',
            x: 40,
            y: 40,
            style: { ...DEFAULT_STYLE, fontSize: 36, fontWeight: '700', width: 600, height: 60 }
        },
        {
            id: 'default-1',
            type: 'paragraph',
            content: 'Start typing here...',
            x: 40,
            y: 120,
            style: { ...DEFAULT_STYLE, fontSize: 12, width: 500, height: 30 }
        }
    ],
    selectedId: null,
    selectedIds: [],
    past: [],
    future: [],
    docTitle: 'Untitled Document',
    showTitle: false,
    snapToGrid: true,
    gridSize: 8,
    showGuides: true,
    showPreview: true,
    zoom: 100,
    lastSaved: null,
    isAutoSaving: true,
    isGeneratingPDF: false,
    pdfValidationWarnings: [],

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

    // Auto-save functionality
    toggleAutoSave: () => set((state) => ({ isAutoSaving: !state.isAutoSaving })),
    saveDocument: async () => {
        // This would integrate with your backend API
        console.log('Document saved')
        set({ lastSaved: new Date() })
    },

    addElement: (type: EditorElement['type']) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const baseX = 60
        const baseY = 120 + (state.elements.length * 30)
        const newElement: EditorElement = {
            id: `el-${Date.now()}`,
            type,
            content: type === 'heading' ? 'New Heading' : type === 'paragraph' ? 'Start typing...' : type === 'list' ? '• List item' : type === 'link' ? 'https://example.com' : '',
            x: baseX,
            y: baseY,
            style: {
                ...DEFAULT_STYLE,
                fontSize: type === 'heading' ? 22 : 14,
                fontWeight: type === 'heading' ? '700' : '400',
                width: type === 'heading' ? 500 : 450,
                height: type === 'heading' ? 50 : 60,
                linkColor: type === 'link' ? '#0066cc' : DEFAULT_STYLE.linkColor,
                linkDecoration: type === 'link' ? 'underline' : DEFAULT_STYLE.linkDecoration
            },
            isClickable: type === 'link'
        }
        return {
            elements: [...state.elements, newElement],
            selectedId: newElement.id,
            past: newPast,
            future: []
        }
    }),

    addSocialIcon: (iconType: string) => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const newElement: EditorElement = {
            id: `icon-${Date.now()}`,
            type: 'social-icon',
            content: '',
            iconType,
            x: 100 + (state.elements.length * 30),
            y: 100 + (state.elements.length * 30),
            style: {
                ...DEFAULT_STYLE,
                width: 40,
                height: 40,
                fontSize: 24,
                lockAspectRatio: true
            },
            showLabel: false,
            labelPosition: 'right'
        }
        return {
            elements: [...state.elements, newElement],
            selectedId: newElement.id,
            past: newPast,
            future: []
        }
    }),

    addLine: (orientation: 'horizontal' | 'vertical') => set((state: EditorState) => {
        const newPast = [...state.past, state.elements]
        const newElement: EditorElement = {
            id: `line-${Date.now()}`,
            type: 'line',
            content: '',
            lineOrientation: orientation,
            lineStyle: 'solid',
            x: 100,
            y: 200 + (state.elements.length * 20),
            style: {
                ...DEFAULT_STYLE,
                width: orientation === 'horizontal' ? 200 : 2,
                height: orientation === 'vertical' ? 100 : 2,
                backgroundColor: '#000000',
                borderWidth: orientation === 'horizontal' ? 2 : 0,
                borderStyle: 'solid'
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
    }),

    // Multi-selection actions
    toggleSelection: (id: string) => set((state) => {
        const isSelected = state.selectedIds.includes(id)
        if (isSelected) {
            return {
                selectedIds: state.selectedIds.filter(i => i !== id),
                selectedId: state.selectedIds.length === 1 ? null : state.selectedId
            }
        } else {
            return {
                selectedIds: [...state.selectedIds, id],
                selectedId: id
            }
        }
    }),

    selectMultiple: (ids: string[]) => set(() => ({
        selectedIds: ids,
        selectedId: ids.length > 0 ? ids[0] : null
    })),

    clearSelection: () => set(() => ({
        selectedIds: [],
        selectedId: null
    })),

    // Enhanced alignment actions with real metrics and DOM integration
    alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'baseline') => {
        const state = get()
        if (state.selectedIds.length < 2) return

        // Import alignment engine on demand
        const { AlignmentEngine, AdvancedMeasurement } = require('@/app/lib/alignment-service')

        const newPast = [...state.past, state.elements]
        const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id))

        // Get ACTUAL rendered positions BEFORE alignment using CoordinateSystem
        const elementsWithRealMetrics = selectedElements.map(el => {
            const actualMetrics = CoordinateSystem.getElementMetrics(el.id)
            return {
                ...el,
                actualBoundingBox: actualMetrics?.actualBoundingBox || {
                    left: el.x,
                    top: el.y,
                    right: el.x + el.style.width,
                    bottom: el.y + el.style.height
                },
                opticalCenter: actualMetrics?.opticalCenter || {
                    x: el.x + el.style.width / 2,
                    y: el.y + el.style.height / 2
                }
            }
        })

        let alignmentUpdates: Partial<EditorElement>[]

        // Use enhanced alignment with real metrics
        switch (direction) {
            case 'left':
                alignmentUpdates = AlignmentEngine.alignLeft(elementsWithRealMetrics)
                break
            case 'center':
                alignmentUpdates = AlignmentEngine.alignCenter(elementsWithRealMetrics)
                break
            case 'right':
                alignmentUpdates = AlignmentEngine.alignRight(elementsWithRealMetrics)
                break
            case 'top':
                alignmentUpdates = AlignmentEngine.alignTop(elementsWithRealMetrics)
                break
            case 'middle':
                alignmentUpdates = AlignmentEngine.alignMiddle(elementsWithRealMetrics)
                break
            case 'bottom':
                alignmentUpdates = AlignmentEngine.alignBottom(elementsWithRealMetrics)
                break
            case 'baseline':
                alignmentUpdates = AlignmentEngine.alignBaseline(elementsWithRealMetrics)
                break
            default:
                return
        }

        // Apply updates with proper grid snapping and coordinate conversion
        const newElements = state.elements.map(el => {
            if (!state.selectedIds.includes(el.id)) return el

            const idx = selectedElements.findIndex(sel => sel.id === el.id)
            if (idx === -1) return el

            const update = alignmentUpdates[idx]
            
            // Use element-specific grid size for precision
            const gridSize = CoordinateSystem.getExportGridSize(el.type)
            const snap = (v: number) => state.snapToGrid ? CoordinateSystem.snapToGrid(v, state.gridSize, gridSize) : v

            return {
                ...el,
                x: update.x !== undefined ? snap(update.x) : el.x,
                y: update.y !== undefined ? snap(update.y) : el.y
            }
        })

        set({ elements: newElements, past: newPast, future: [] })
    },

    // Enhanced distribution with spacing compensation
    distributeElements: (axis: 'horizontal' | 'vertical') => {
        const state = get()
        if (state.selectedIds.length < 3) return

        // Import alignment engine on demand
        const { AlignmentEngine } = require('@/app/lib/alignment-service')

        const newPast = [...state.past, state.elements]
        const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id))

        // Get real metrics for accurate distribution
        const elementsWithRealMetrics = selectedElements.map(el => {
            const actualMetrics = CoordinateSystem.getElementMetrics(el.id)
            return {
                ...el,
                actualBoundingBox: actualMetrics?.actualBoundingBox || {
                    left: el.x,
                    top: el.y,
                    right: el.x + el.style.width,
                    bottom: el.y + el.style.height
                }
            }
        })

        let distributionUpdates: Partial<EditorElement>[]

        if (axis === 'horizontal') {
            distributionUpdates = AlignmentEngine.distributeHorizontal(elementsWithRealMetrics)
        } else {
            distributionUpdates = AlignmentEngine.distributeVertical(elementsWithRealMetrics)
        }

        // Apply updates with precise snapping
        const newElements = state.elements.map(el => {
            if (!state.selectedIds.includes(el.id)) return el

            const idx = selectedElements.findIndex(sel => sel.id === el.id)
            if (idx === -1) return el

            const update = distributionUpdates[idx]
            const gridSize = CoordinateSystem.getExportGridSize(el.type)
            const snap = (v: number) => state.snapToGrid ? CoordinateSystem.snapToGrid(v, state.gridSize, gridSize) : v

            return {
                ...el,
                x: update.x !== undefined ? snap(update.x) : el.x,
                y: update.y !== undefined ? snap(update.y) : el.y
            }
        })

        set({ elements: newElements, past: newPast, future: [] })
    },

    // Validate current alignment of selected elements
    validateAlignment: () => {
        const state = get()
        if (state.selectedIds.length < 2) {
            return { isValid: true, misalignedPairs: [] }
        }

        const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id))
        const tolerance = CoordinateSystem.getAlignmentTolerance(selectedElements.map(el => el.type))
        const misalignedPairs: Array<{ id1: string; id2: string; deltaX: number; deltaY: number }> = []

        // Check all pairs for alignment
        for (let i = 0; i < selectedElements.length; i++) {
            for (let j = i + 1; j < selectedElements.length; j++) {
                const el1 = selectedElements[i]
                const el2 = selectedElements[j]

                const metrics1 = CoordinateSystem.getElementMetrics(el1.id)
                const metrics2 = CoordinateSystem.getElementMetrics(el2.id)

                if (metrics1 && metrics2) {
                    const deltaX = Math.abs(metrics1.opticalCenter.x - metrics2.opticalCenter.x)
                    const deltaY = Math.abs(metrics1.opticalCenter.y - metrics2.opticalCenter.y)

                    // Check if elements are supposed to be aligned (same x or y within tolerance)
                    const shouldAlignX = Math.abs(el1.x - el2.x) < tolerance
                    const shouldAlignY = Math.abs(el1.y - el2.y) < tolerance

                    if (shouldAlignX && deltaX > tolerance) {
                        misalignedPairs.push({
                            id1: el1.id,
                            id2: el2.id,
                            deltaX,
                            deltaY: 0
                        })
                    }

                    if (shouldAlignY && deltaY > tolerance) {
                        misalignedPairs.push({
                            id1: el1.id,
                            id2: el2.id,
                            deltaX: 0,
                            deltaY
                        })
                    }
                }
            }
        }

        return {
            isValid: misalignedPairs.length === 0,
            misalignedPairs
        }
    },

    // Get actual rendered metrics for a specific element
    getActualElementMetrics: (elementId: string) => {
        return CoordinateSystem.getElementMetrics(elementId)
    },

    // PDF Generation state management
    setGeneratingPDF: (isGenerating: boolean) => set({ isGeneratingPDF: isGenerating }),

    validateWYSIWYGFidelity: () => {
        const state = get()
        const warnings: string[] = []

        state.elements.forEach(el => {
            const actualMetrics = CoordinateSystem.getElementMetrics(el.id)
            if (!actualMetrics) {
                warnings.push(`Element ${el.id} not found in DOM`)
                return
            }

            // Check for subpixel positioning issues
            if (Math.abs(el.x % 1) > 0.5 || Math.abs(el.y % 1) > 0.5) {
                warnings.push(`Element ${el.id} has subpixel positioning that may affect PDF quality`)
            }

            // Check for problematic rotations
            if (el.style.rotation && el.style.rotation % 90 !== 0) {
                warnings.push(`Element ${el.id} has rotation ${el.style.rotation}° which may not render consistently in PDF`)
            }

            // Check for opacity issues
            if (el.style.opacity && el.style.opacity < 0.95) {
                warnings.push(`Element ${el.id} has opacity ${el.style.opacity} which may render differently in PDF`)
            }
        })

        return {
            isValid: warnings.length === 0,
            warnings
        }
    },
}))
