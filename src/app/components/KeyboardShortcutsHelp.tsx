'use client'

import React, { useState } from 'react'
import { Keyboard, X, Grid, FileText, Save, RotateCcw, RotateCw, Square, Trash2, CornerUpLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Type, Heading, List, Link, Minus } from 'lucide-react'

interface ShortcutItem {
  keys: string[]
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  category: 'navigation' | 'editing' | 'elements' | 'file'
}

const shortcuts: ShortcutItem[] = [
  // File operations
  { keys: ['Ctrl', 'D'], description: 'Download PDF', icon: FileText, category: 'file' },
  { keys: ['Ctrl', 'S'], description: 'Save Document', icon: Save, category: 'file' },
  
  // Navigation
  { keys: ['Ctrl', 'G'], description: 'Toggle Grid', icon: Grid, category: 'navigation' },
  { keys: ['↑', '↓', '←', '→'], description: 'Move Element (Shift for faster)', icon: ArrowUp, category: 'navigation' },
  { keys: ['Escape'], description: 'Deselect Element', icon: CornerUpLeft, category: 'navigation' },
  
  // Editing
  { keys: ['Ctrl', 'Z'], description: 'Undo', icon: RotateCcw, category: 'editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', icon: RotateCw, category: 'editing' },
  { keys: ['Ctrl', 'A'], description: 'Select All', icon: Square, category: 'editing' },
  { keys: ['Delete', 'Backspace'], description: 'Delete Selected', icon: Trash2, category: 'editing' },
  
  // Quick Add Elements
  { keys: ['1'], description: 'Add Heading', icon: Heading, category: 'elements' },
  { keys: ['2'], description: 'Add Paragraph', icon: Type, category: 'elements' },
  { keys: ['3'], description: 'Add List', icon: List, category: 'elements' },
  { keys: ['4'], description: 'Add Link', icon: Link, category: 'elements' },
  { keys: ['5'], description: 'Add Horizontal Line', icon: Minus, category: 'elements' },
  { keys: ['6'], description: 'Add Vertical Line', icon: Minus, category: 'elements' },
]

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  if (!isOpen) return null

  const categories = ['all', 'file', 'navigation', 'editing', 'elements']
  const filteredShortcuts = activeCategory === 'all' 
    ? shortcuts 
    : shortcuts.filter(s => s.category === activeCategory)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Keyboard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-500">Work faster with keyboard shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Shortcuts List */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          <div className="space-y-4">
            {filteredShortcuts.map((shortcut, index) => {
              const IconComponent = shortcut.icon
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {shortcut.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && <span className="text-gray-400 mx-1">+</span>}
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 <strong>Pro tip:</strong> Hold Shift while using arrow keys to move elements faster
          </p>
        </div>
      </div>
    </div>
  )
}
