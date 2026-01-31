'use client'
import React, { useRef, useEffect, useState } from 'react'
import { generatePDFPreview } from '@/app/lib/pdf-service'
import { useEditorStore } from '@/app/store/useEditorStore'

interface PDFPreviewProps {
    canvasRef: React.RefObject<HTMLDivElement | null>
    isVisible: boolean
    onClose?: () => void
    inline?: boolean
}

export default function LivePDFPreview({ canvasRef, isVisible, onClose, inline = false }: PDFPreviewProps) {
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const { elements, docTitle } = useEditorStore()

    useEffect(() => {
        if (!isVisible || !canvasRef.current) return

        let timeoutId: NodeJS.Timeout
        let observer: MutationObserver | null = null

        const updatePreview = async () => {
            if (!canvasRef.current) return
            setIsGenerating(true)
            try {
                const image = await generatePDFPreview(canvasRef.current!)
                setPreviewImage(image)
            } catch (error) {
                console.error('Preview generation error:', error)
            } finally {
                setIsGenerating(false)
            }
        }

        // Debounced update
        const debouncedUpdate = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(updatePreview, 300)
        }

        // Create observer for DOM changes
        if (canvasRef.current) {
            observer = new MutationObserver(debouncedUpdate)
            observer.observe(canvasRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
                attributeFilter: ['style', 'class', 'contenteditable']
            })
        }

        // Initial update
        debouncedUpdate()

        return () => {
            if (observer) observer.disconnect()
            clearTimeout(timeoutId)
        }
    }, [isVisible, elements, docTitle, canvasRef])

    if (!isVisible) return null

    const PreviewDisplay = (
        <div className={`relative w-full h-full flex items-center justify-center ${inline ? '' : 'p-6'}`}>
            <div className="relative bg-white shadow-xl border border-gray-200 rounded-lg overflow-hidden">
                {/* Preview Header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-xs font-medium text-gray-700">
                                {isGenerating ? 'Updating...' : 'Live Preview'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">100% Scale</span>
                    </div>
                </div>

                {/* Preview Image */}
                <div className="p-2 bg-gray-100">
                    {previewImage ? (
                        <img
                            src={previewImage}
                            alt="PDF Preview"
                            className="border border-gray-300 shadow-sm"
                            style={{
                                width: '794px',
                                height: '1123px',
                                display: 'block'
                            }}
                        />
                    ) : (
                        <div className="w-[794px] h-[1123px] bg-gray-200 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">Generating preview...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Resolution: 794×1123px</span>
                        <span>DPI: 96</span>
                        <span>Colors: sRGB</span>
                    </div>
                </div>
            </div>
        </div>
    )

    return PreviewDisplay
}