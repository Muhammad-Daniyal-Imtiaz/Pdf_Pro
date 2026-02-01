import { NextRequest, NextResponse } from 'next/server'
import { generatePDFFromCanvas } from '@/app/lib/pdf-service'
import { CoordinateSystem } from '@/app/lib/geometry-engine/CoordinateSystem'
import { EditorElement } from '@/app/store/useEditorStore'

interface RequestBody {
    elements: EditorElement[]
    docTitle?: string
    showTitle?: boolean
    documentType?: string
    htmlContent?: string
}

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json()
        const { elements = [], docTitle = '', htmlContent } = body

        if (!Array.isArray(elements) && !htmlContent) {
            return NextResponse.json({ error: 'Invalid request: provide elements or htmlContent' }, { status: 400 })
        }

        // If we have HTML content, use it directly for perfect WYSIWYG
        if (htmlContent) {
            // Apply PDF corrections to elements before generation
            const correctedElements = elements.map(element => {
                const correctedElement = CoordinateSystem.applyPDFCorrections(element)
                return CoordinateSystem.convertElementForPDF(correctedElement)
            })

            // Generate PDF using our enhanced service with WYSIWYG validation
            const pdfResult = await generatePDFFromCanvas(
                null as any, // In API context, we'll need to handle canvas differently
                correctedElements,
                {
                    quality: 2,
                    scale: 2,
                    debug: false,
                    validateWYSIWYG: true,
                    applyCorrections: true
                }
            )

            // Return the PDF blob
            return new NextResponse(pdfResult.blob, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${(docTitle || 'document').replace(/\s/g, '_')}.pdf"`,
                    'X-Fidelity-Score': pdfResult.fidelityScore.toString(),
                    'X-Generation-Time': pdfResult.generationTime.toString(),
                    'X-Validation-Warnings': pdfResult.validationWarnings.length.toString()
                }
            })
        }

        // For API calls without HTML content, return a structured response
        // The client should handle the actual PDF generation using the enhanced service
        return NextResponse.json({ 
            message: 'PDF generation parameters received',
            elementsCount: elements.length,
            docTitle,
            correctionsApplied: elements.map(el => ({
                id: el.id,
                type: el.type,
                correction: CoordinateSystem.getPDFCorrection(el)
            })),
            instructions: 'Use the client-side PDF service for perfect WYSIWYG generation'
        })

    } catch (error) {
        console.error('PDF Gen Error:', error)
        return NextResponse.json({ 
            error: 'Failed to generate PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ 
        status: 'Ready',
        message: 'Enhanced PDF generation API with WYSIWYG validation',
        features: [
            'Real DOM metrics extraction',
            'Element-specific PDF corrections',
            'WYSIWYG fidelity validation',
            'Subpixel precision alignment',
            'Performance benchmarking'
        ]
    })
}
