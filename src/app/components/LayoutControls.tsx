'use client'

interface Layout {
  pageSize: string
  orientation: string
  columns: number
}

interface LayoutControlsProps {
  layout: Layout
  onLayoutChange: (layout: Layout) => void
}

export default function LayoutControls({ layout, onLayoutChange }: LayoutControlsProps) {
  const updateLayout = (key: keyof Layout, value: string | number) => {
    onLayoutChange({ ...layout, [key]: value })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Layout Controls
      </h2>
      
      <div className="space-y-4">
        {/* Page Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Size
          </label>
          <select
            value={layout.pageSize}
            onChange={(e) => updateLayout('pageSize', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orientation
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => updateLayout('orientation', 'portrait')}
              className={`flex-1 p-3 border rounded-lg ${
                layout.orientation === 'portrait'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => updateLayout('orientation', 'landscape')}
              className={`flex-1 p-3 border rounded-lg ${
                layout.orientation === 'landscape'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Columns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Columns: {layout.columns}
          </label>
          <input
            type="range"
            min="1"
            max="3"
            value={layout.columns}
            onChange={(e) => updateLayout('columns', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 Column</span>
            <span>2 Columns</span>
            <span>3 Columns</span>
          </div>
        </div>
      </div>
    </div>
  )
}