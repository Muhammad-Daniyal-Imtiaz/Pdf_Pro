'use client'
import React, { useRef, useEffect, useState } from 'react'
import { generatePDFPreview } from '@/app/lib/pdf-service'

interface PDFPreviewProps {
    canvasRef: React.RefObject<HTMLDivElement>
    isVisible: boolean
    onClose: () => void
}

export default function PDFPreview({ canvasRef, isVisible, onClose }: PDFPreviewProps) {
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [lastUpdate, setLastUpdate] = useState(0)

    // Generate preview with debouncing
    useEffect(() => {
        if (!isVisible || !canvasRef.current) return

        const timeoutId = setTimeout(async () => {
            setIsGenerating(true)
            try {
                const image = await generatePDFPreview(canvasRef.current!)
                setPreviewImage(image)
                setLastUpdate(Date.now())
            } catch (error) {
                console.error('Preview generation error:', error)
            } finally {
                setIsGenerating(false)
            }
        }, 300) // Debounce to avoid excessive updates

        return () => clearTimeout(timeoutId)
    }, [canvasRef, isVisible])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-auto flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
                    <div className="flex items-center gap-4">
                        {isGenerating && (
                            <div className="text-sm text-gray-600 animate-pulse">
                                Generating preview...
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="p-6 overflow-auto">
                    {previewImage ? (
                        <div className="flex justify-center">
                            <img
                                src={previewImage}
                                alt="PDF Preview"
                                className="border border-gray-300 rounded shadow-md"
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto'
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center text-gray-500">
                                <p className="mb-2">Generating preview...</p>
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 text-sm text-gray-600">
                    <p>Preview updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</p>
                    <p className="mt-2 text-xs">This preview matches the PDF output exactly (WYSIWYG)</p>
                </div>
            </div>
        </div>
    )
}
