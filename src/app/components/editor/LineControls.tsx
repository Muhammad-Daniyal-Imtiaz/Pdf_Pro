'use client'

import { Minus, Maximize, RotateCw, Palette } from 'lucide-react'

interface LineControlsProps {
  element: any
  onUpdate: (updates: any) => void
}

export default function LineControls({ element, onUpdate }: LineControlsProps) {
  const { lineOrientation = 'horizontal', lineStyle = 'solid', style } = element

  const handleThicknessChange = (thickness: number) => {
    if (lineOrientation === 'horizontal') {
      onUpdate({
        style: { ...style, height: thickness }
      })
    } else {
      onUpdate({
        style: { ...style, width: thickness }
      })
    }
  }

  const handleLengthChange = (length: number) => {
    if (lineOrientation === 'horizontal') {
      onUpdate({
        style: { ...style, width: length }
      })
    } else {
      onUpdate({
        style: { ...style, height: length }
      })
    }
  }

  const handleColorChange = (color: string) => {
    onUpdate({
      style: { ...style, backgroundColor: color }
    })
  }

  const handleStyleChange = (newStyle: 'solid' | 'dashed' | 'dotted') => {
    onUpdate({ lineStyle: newStyle })
  }

  const handleOrientationChange = (orientation: 'horizontal' | 'vertical') => {
    const newWidth = orientation === 'horizontal' ? 200 : 2
    const newHeight = orientation === 'vertical' ? 100 : 2
    onUpdate({ 
      lineOrientation: orientation,
      style: { ...style, width: newWidth, height: newHeight }
    })
  }

  const handleRotationChange = (rotation: number) => {
    onUpdate({
      style: { ...style, rotation }
    })
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Minus className="w-4 h-4" />
        Line Properties
      </h3>

      {/* Orientation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Orientation</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleOrientationChange('horizontal')}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
              lineOrientation === 'horizontal'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Horizontal
          </button>
          <button
            onClick={() => handleOrientationChange('vertical')}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
              lineOrientation === 'vertical'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vertical
          </button>
        </div>
      </div>

      {/* Line Style */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Line Style</label>
        <div className="flex gap-2">
          {(['solid', 'dashed', 'dotted'] as const).map((style) => (
            <button
              key={style}
              onClick={() => handleStyleChange(style)}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium capitalize transition-colors ${
                lineStyle === style
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Thickness */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Thickness: {lineOrientation === 'horizontal' ? style.height : style.width}px
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={lineOrientation === 'horizontal' ? style.height : style.width}
          onChange={(e) => handleThicknessChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Length */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Length: {lineOrientation === 'horizontal' ? style.width : style.height}px
        </label>
        <input
          type="range"
          min="10"
          max="500"
          value={lineOrientation === 'horizontal' ? style.width : style.height}
          onChange={(e) => handleLengthChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={style.backgroundColor || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={style.backgroundColor || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
          <RotateCw className="w-3 h-3" />
          Rotation: {style.rotation || 0}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={style.rotation || 0}
          onChange={(e) => handleRotationChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  )
}
