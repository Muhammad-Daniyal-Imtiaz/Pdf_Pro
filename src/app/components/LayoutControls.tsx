'use client'

import { LayoutTemplate, Columns, Grid, Sidebar } from 'lucide-react'

interface LayoutControlsProps {
  layout: any // Using any to support both CV and Document layouts if needed, or keep strict
  onLayoutChange: (layout: any) => void
  columns?: number
  onColumnsChange?: (columns: number) => void
}

export default function LayoutControls({ columns, onColumnsChange }: LayoutControlsProps) {
  // Support for legacy props if needed, or just use what's passed
  const activeColumns = columns || 1

  const handleColumnChange = (cols: number) => {
    if (onColumnsChange) onColumnsChange(cols)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
        <LayoutTemplate className="w-5 h-5 text-blue-500" />
        Layout Settings
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleColumnChange(1)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${activeColumns === 1
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'
            }`}
        >
          <div className="w-8 h-8 mb-2 rounded border-2 border-current bg-current opacity-20" />
          <span className="text-xs font-medium">Single</span>
        </button>

        <button
          onClick={() => handleColumnChange(2)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${activeColumns === 2
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'
            }`}
        >
          <div className="flex gap-1 w-8 h-8 mb-2">
            <div className="w-1/2 h-full rounded border-2 border-current bg-current opacity-20" />
            <div className="w-1/2 h-full rounded border-2 border-current bg-current opacity-20" />
          </div>
          <span className="text-xs font-medium">Two Col</span>
        </button>

        <button
          onClick={() => handleColumnChange(3)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${activeColumns === 3
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'
            }`}
        >
          <div className="flex gap-1 w-8 h-8 mb-2">
            <div className="w-1/3 h-full rounded border-2 border-current bg-current opacity-20" />
            <div className="w-1/3 h-full rounded border-2 border-current bg-current opacity-20" />
            <div className="w-1/3 h-full rounded border-2 border-current bg-current opacity-20" />
          </div>
          <span className="text-xs font-medium">Three Col</span>
        </button>
      </div>
    </div>
  )
}