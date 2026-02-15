import { useEffect, useCallback } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'

export function useKeyboardShortcuts() {
    const {
        selectedIds,
        removeElement,
        selectElement,
        pages,
        zoom,
        setZoom
    } = useEditorStore()

    // Note: undo/redo are placeholders until Task 7 is complete
    const { undo, redo, canUndo, canRedo } = useEditorStore() as any

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if typing in input
        if (e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            (e.target as HTMLElement).isContentEditable) {
            return
        }

        // Undo: Ctrl+Z
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault()
            if (canUndo) undo?.()
            return
        }

        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault()
            if (canRedo) redo?.()
            return
        }

        // Delete: Delete or Backspace
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
            e.preventDefault()
            selectedIds.forEach(id => removeElement(id))
            selectElement(null)
            return
        }

        // Deselect: Escape
        if (e.key === 'Escape') {
            selectElement(null)
            return
        }

        // Zoom: Ctrl++ / Ctrl+-
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault()
                setZoom(Math.min(200, zoom + 10))
            }
            if (e.key === '-') {
                e.preventDefault()
                setZoom(Math.max(50, zoom - 10))
            }
        }
    }, [selectedIds, removeElement, selectElement, undo, redo, canUndo, canRedo, zoom, setZoom])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}
