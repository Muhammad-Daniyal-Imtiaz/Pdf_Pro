'use client'

import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'

export function useAutoSave(interval: number = 30000) { // 30 seconds default
  const {
    elements,
    docTitle,
    isAutoSaving,
    saveDocument,
    lastSaved
  } = useEditorStore()

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    if (!isAutoSaving) return

    const saveData = async () => {
      const now = new Date()
      
      // Don't save if we saved less than 5 seconds ago
      if (lastSaveTimeRef.current && 
          (now.getTime() - lastSaveTimeRef.current.getTime()) < 5000) {
        return
      }

      try {
        await saveDocument()
        lastSaveTimeRef.current = now
        
        // Also save to localStorage as backup
        const data = JSON.stringify({ elements, docTitle, savedAt: now.toISOString() })
        localStorage.setItem('pdf-craft-pro-autosave', data)
        
        console.log('Auto-saved at', now.toLocaleTimeString())
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(saveData, interval)

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [elements, docTitle, isAutoSaving, saveDocument, interval])

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('pdf-craft-pro-autosave')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        console.log('Found auto-saved data from:', parsed.savedAt)
        // You could restore the data here if needed
      } catch (error) {
        console.error('Failed to parse auto-saved data:', error)
      }
    }
  }, [])

  return {
    lastSaved,
    isAutoSaving
  }
}
