'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sidebar, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'

interface EditorLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  preview: React.ReactNode
}

export default function EditorLayout({ children, sidebar }: Omit<EditorLayoutProps, 'preview'>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(280) // Reduced default width
  const [isResizing, setIsResizing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = e.clientX
    if (newWidth >= 200 && newWidth <= 500) {
      setSidebarWidth(newWidth)
    }
  }

  const stopResizing = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
  }

  return (
    <div className={`flex h-[calc(100vh-64px)] bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Sidebar with Toggle and Resize */}
      <div
        className={`relative flex flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? '' : 'w-0 overflow-hidden'}`}
        style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
      >
        <div className="flex-1 border-r border-gray-200 bg-white overflow-y-auto custom-scrollbar">
          {sidebar}
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 ${isSidebarOpen ? '-right-4' : 'left-4'} z-20 w-8 h-8 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-all`}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Resize Handle */}
        {isSidebarOpen && (
          <div
            onMouseDown={startResizing}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-10 ${isResizing ? 'bg-blue-500' : ''}`}
          />
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        {/* Top Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-4">
            <Sidebar
              size={18}
              className={`cursor-pointer transition-colors ${isSidebarOpen ? 'text-blue-600' : 'text-gray-400'}`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <span className="text-sm font-semibold text-gray-700">
              PDF Craft Pro <span className="text-gray-400 font-normal ml-2">v2.0</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
              <button className="px-3 py-1 text-xs font-medium bg-white rounded shadow-sm text-blue-600">Design</button>
              <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">Elements</button>
              <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">Layers</button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  )
}
