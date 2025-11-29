'use client'

interface LayoutControlsProps {
  columns: number
  onColumnsChange: (columns: number) => void
}

export default function LayoutControls({ columns, onColumnsChange }: LayoutControlsProps) {
  if (!onColumnsChange || typeof onColumnsChange !== 'function') {
    console.warn('LayoutControls: onColumnsChange is not a function')
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">📐 Layout Settings</h3>
      <div className="flex gap-2">
        {[1, 2, 3].map((col) => (
          <button
            key={col}
            onClick={() => onColumnsChange(col)}
            className={`px-4 py-2 rounded font-semibold transition-all ${
              columns === col
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {col} Column{col > 1 ? 's' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}