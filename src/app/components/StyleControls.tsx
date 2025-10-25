'use client'

// Define types within the component
interface Styles {
  fontSize: number
  fontFamily: string
  color: string
  lineHeight: number
  margin: number
  fontWeight?: string
  textAlign?: string
  backgroundColor?: string
}

interface StyleControlsProps {
  styles: Styles
  onStylesChange: (styles: Styles) => void
}

export default function StyleControls({ styles, onStylesChange }: StyleControlsProps) {
  const updateStyle = (key: keyof Styles, value: any) => {
    onStylesChange({ ...styles, [key]: value })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Style Controls
      </h2>
      
      <div className="space-y-4">
        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size: {styles.fontSize}px
          </label>
          <input
            type="range"
            min="8"
            max="72"
            value={styles.fontSize}
            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Family
          </label>
          <select
            value={styles.fontFamily}
            onChange={(e) => updateStyle('fontFamily', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Color
          </label>
          <input
            type="color"
            value={styles.color}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="w-full h-10 cursor-pointer"
          />
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Line Height: {styles.lineHeight}
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={styles.lineHeight}
            onChange={(e) => updateStyle('lineHeight', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Margin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Margin: {styles.margin}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={styles.margin}
            onChange={(e) => updateStyle('margin', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}