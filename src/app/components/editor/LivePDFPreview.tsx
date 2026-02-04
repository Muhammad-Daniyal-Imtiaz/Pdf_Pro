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

    // Generate preview with debouncing
    useEffect(() => {
        if (!isVisible || !canvasRef.current) return

        let timeoutId: NodeJS.Timeout

        const updatePreview = async () => {
            if (!canvasRef.current) return
            setIsGenerating(true)
            try {
                const image = await generatePDFPreview(canvasRef.current!, elements)
                setPreviewImage(image)
            } catch (error) {
                console.error('Preview generation error:', error)
            } finally {
                setIsGenerating(false)
            }
        }

        // MutationObserver as a fallback for non-store changes (like raw DOM edits)
        const observer = new MutationObserver(() => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(updatePreview, 400)
        })

        if (canvasRef.current) {
            observer.observe(canvasRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            })
        }

        // Store-driven update
        timeoutId = setTimeout(updatePreview, 400) // 400ms for production-grade snappiness

        return () => {
            observer.disconnect()
            clearTimeout(timeoutId)
        }
    }, [isVisible, elements, docTitle, canvasRef])

    if (!isVisible) return null

    const PreviewDisplay = (
        <div className={`relative w-full h-full flex items-center justify-center bg-gray-100 ${inline ? '' : 'p-6 overflow-auto'}`}>
            {previewImage ? (
                <div className="relative group shadow-2xl transition-transform hover:scale-[1.02]">
                    <img
                        src={previewImage}
                        alt="PDF Preview"
                        className="border border-gray-300 rounded shadow-md"
                        style={{
                            width: '794px',
                            height: '1123px',
                            display: 'block'
                        }}
                    />
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center rounded">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs font-mono font-bold animate-pulse">GENERATING PREVIEW...</p>
                </div>
            )}
        </div>
    )

    if (inline) return PreviewDisplay

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Final PDF Inspection</h2>
                        <p className="text-xs text-gray-500 font-medium font-mono">RENDER_STATUS: {isGenerating ? 'PROCESSING' : 'STABLE'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 min-h-0 bg-gray-50 p-8 flex justify-center overflow-auto">
                    {PreviewDisplay}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-4 bg-white flex items-center justify-between text-[11px] font-mono font-bold text-gray-400">
                    <div className="flex items-center gap-4">
                        <span>PIXEL_PERFECT: 100%</span>
                        <span>DPI: 96</span>
                        <span>COLOR_SPACE: sRGB</span>
                    </div>
                    <span>READY FOR EXPORT</span>
                </div>
            </div>
        </div>
    )
}
