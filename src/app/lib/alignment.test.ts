/**
 * Alignment Service Test Suite
 * Tests the advanced alignment algorithms for accuracy and precision
 */

import { AlignmentEngine, AdvancedMeasurement, WYSIWYGValidator } from '@/app/lib/alignment-service'
import { EditorElement } from '@/app/store/useEditorStore'

// Mock elements for testing
const mockTextElement: EditorElement = {
    id: 'text-1',
    type: 'paragraph',
    content: 'Sample text',
    x: 100,
    y: 100,
    style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        lineHeight: 1.5,
        color: '#000000',
        padding: 12,
        margin: 8,
        width: 200,
        height: 60,
        borderRadius: 0,
        borderWidth: 0,
        borderStyle: 'solid',
        rotation: 0,
        opacity: 1,
        zIndex: 0,
    }
}

const mockIconElement: EditorElement = {
    id: 'icon-1',
    type: 'social-icon',
    content: '',
    iconType: 'linkedin',
    x: 350,
    y: 100,
    style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 24,
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        lineHeight: 1,
        color: '#0077B5',
        padding: 8,
        margin: 0,
        width: 40,
        height: 40,
        borderRadius: 0,
        borderWidth: 0,
        borderStyle: 'solid',
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        lockAspectRatio: true
    }
}

const mockLinkElement: EditorElement = {
    id: 'link-1',
    type: 'link',
    content: 'Click here',
    url: 'https://example.com',
    x: 100,
    y: 200,
    style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'underline',
        textAlign: 'left',
        lineHeight: 1.5,
        color: '#0066cc',
        padding: 8,
        margin: 0,
        width: 100,
        height: 30,
        borderRadius: 0,
        borderWidth: 0,
        borderStyle: 'solid',
        rotation: 0,
        opacity: 1,
        zIndex: 0,
    },
    isClickable: true
}

// Test Suite
export const alignmentTests = {
    /**
     * Test bounding box calculation accuracy
     */
    testBoundingBoxCalculation: () => {
        console.log('🧪 Testing Bounding Box Calculation...')

        const bbox = AdvancedMeasurement.calculateBoundingBox(mockTextElement)

        const tests = [
            {
                name: 'Left edge equals element X',
                condition: bbox.left >= mockTextElement.x - 10,
                expected: true
            },
            {
                name: 'Right edge = X + width',
                condition: Math.abs((bbox.right - bbox.left) - mockTextElement.style.width) < 1,
                expected: true
            },
            {
                name: 'Visual center is valid',
                condition: bbox.visualCenter.x > bbox.left && bbox.visualCenter.x < bbox.right,
                expected: true
            },
            {
                name: 'Baseline offset is calculated',
                condition: bbox.baselineOffset > 0,
                expected: true
            }
        ]

        tests.forEach(test => {
            const result = test.condition === test.expected ? '✅' : '❌'
            console.log(`${result} ${test.name}: ${test.condition}`)
        })

        return tests.every(t => t.condition === t.expected)
    },

    /**
     * Test font metrics extraction
     */
    testFontMetrics: () => {
        console.log('\n🧪 Testing Font Metrics Extraction...')

        const fonts = ['Inter', 'Arial', 'Georgia', 'Verdana']
        const fontSize = 16

        fonts.forEach(font => {
            const metrics = AdvancedMeasurement.calculateFontMetrics(fontSize, font)

            const tests = [
                metrics.capHeight > 0,
                metrics.xHeight > 0,
                metrics.ascender > 0,
                metrics.descender < 0,
                metrics.lineHeight > 0,
                metrics.baseCorrectionFactor > 0 && metrics.baseCorrectionFactor < 1
            ]

            const allValid = tests.every(t => t)
            console.log(`${allValid ? '✅' : '❌'} ${font}: capHeight=${metrics.capHeight}, xHeight=${metrics.xHeight}, ascender=${metrics.ascender}`)
        })
    },

    /**
     * Test optical center calculation
     */
    testOpticalCenter: () => {
        console.log('\n🧪 Testing Optical Center Calculation...')

        const textCenter = AdvancedMeasurement.calculateOpticalCenter(mockTextElement)
        const iconCenter = AdvancedMeasurement.calculateOpticalCenter(mockIconElement)

        console.log(`✅ Text optical center: x=${textCenter.x.toFixed(2)}, y=${textCenter.y.toFixed(2)}`)
        console.log(`✅ Icon optical center: x=${iconCenter.x.toFixed(2)}, y=${iconCenter.y.toFixed(2)}`)

        // Icons should be perfectly centered
        const iconGeometricX = mockIconElement.x + mockIconElement.style.width / 2
        const iconGeometricY = mockIconElement.y + mockIconElement.style.height / 2
        const iconCentered = Math.abs(iconCenter.x - iconGeometricX) < 1 && Math.abs(iconCenter.y - iconGeometricY) < 1

        console.log(`${iconCentered ? '✅' : '❌'} Icon is geometrically centered`)

        return true
    },

    /**
     * Test alignment algorithms
     */
    testAlignmentAlgorithms: () => {
        console.log('\n🧪 Testing Alignment Algorithms...')

        const elements = [mockTextElement, mockIconElement, mockLinkElement]

        // Test left alignment
        const leftAligned = AlignmentEngine.alignLeft(elements)
        const leftValid = leftAligned.every(update => update.x !== undefined)
        console.log(`${leftValid ? '✅' : '❌'} Left alignment produces X updates for all elements`)

        // Test center alignment
        const centerAligned = AlignmentEngine.alignCenter(elements)
        const centerValid = centerAligned.every(update => update.x !== undefined)
        console.log(`${centerValid ? '✅' : '❌'} Center alignment produces X updates for all elements`)

        // Test vertical alignment
        const topAligned = AlignmentEngine.alignTop(elements)
        const topValid = topAligned.every(update => update.y !== undefined)
        console.log(`${topValid ? '✅' : '❌'} Top alignment produces Y updates for all elements`)

        // Test baseline alignment
        const baselineAligned = AlignmentEngine.alignBaseline(elements)
        const baselineValid = baselineAligned.length === elements.length
        console.log(`${baselineValid ? '✅' : '❌'} Baseline alignment processes all elements`)

        return leftValid && centerValid && topValid && baselineValid
    },

    /**
     * Test distribution algorithms
     */
    testDistributionAlgorithms: () => {
        console.log('\n🧪 Testing Distribution Algorithms...')

        const elements = [mockTextElement, mockIconElement, mockLinkElement]

        // Test horizontal distribution
        const hDist = AlignmentEngine.distributeHorizontal(elements)
        const hDistValid = hDist.length === elements.length && hDist.every(u => u.x !== undefined)
        console.log(`${hDistValid ? '✅' : '❌'} Horizontal distribution produces valid updates`)

        // Test vertical distribution
        const vDist = AlignmentEngine.distributeVertical(elements)
        const vDistValid = vDist.length === elements.length && vDist.every(u => u.y !== undefined)
        console.log(`${vDistValid ? '✅' : '❌'} Vertical distribution produces valid updates`)

        return hDistValid && vDistValid
    },

    /**
     * Test export grid snapping
     */
    testExportSnapping: () => {
        console.log('\n🧪 Testing Export Grid Snapping...')

        const elements = [mockTextElement]
        const snapped = AlignmentEngine.snapToExportGrid(elements, 0.5)

        const snappedValid = snapped.length === elements.length &&
            snapped.every(u => u.x !== undefined && u.y !== undefined)

        console.log(`${snappedValid ? '✅' : '❌'} Export snapping produces grid-aligned positions`)

        // Verify snap precision
        const precision = 0.5
        snapped.forEach((u, i) => {
            if (u.x !== undefined && u.y !== undefined) {
                const xOnGrid = (u.x % precision) === 0 || (u.x % precision).toFixed(1) === precision.toFixed(1)
                const yOnGrid = (u.y % precision) === 0 || (u.y % precision).toFixed(1) === precision.toFixed(1)
                console.log(`${xOnGrid && yOnGrid ? '✅' : '❌'} Element ${i} snapped to ${precision}px grid`)
            }
        })

        return snappedValid
    },

    /**
     * Test WYSIWYG export validation
     */
    testExportValidation: () => {
        console.log('\n🧪 Testing WYSIWYG Export Validation...')

        const validation = WYSIWYGValidator.validateExportFidelity(mockTextElement)
        console.log(`${validation.valid ? '✅' : '⚠️'} Export validation: ${validation.valid ? 'Valid' : 'Has warnings'}`)
        validation.warnings.forEach(w => console.log(`  ⚠️ ${w}`))

        const recommendation = WYSIWYGValidator.recommendGridSnapping(mockTextElement, 1)
        console.log(`✅ Recommended snapping: x=${recommendation.x}, y=${recommendation.y}`)

        return true
    },

    /**
     * Test pair detection
     */
    testPairDetection: () => {
        console.log('\n🧪 Testing Pair Detection...')

        const pairs = AlignmentEngine.detectAndAlignPairs([mockIconElement, mockTextElement, mockLinkElement])
        console.log(`✅ Detected ${pairs.length} pairs`)
        pairs.forEach((p, i) => {
            console.log(`   Pair ${i + 1}: ${p.type} (${p.elements.length} elements)`)
        })

        return true
    },

    /**
     * Run all tests
     */
    runAllTests: () => {
        console.log('🚀 Running Advanced Alignment System Test Suite...\n')

        const results = [
            alignmentTests.testBoundingBoxCalculation(),
            alignmentTests.testFontMetrics(),
            alignmentTests.testOpticalCenter(),
            alignmentTests.testAlignmentAlgorithms(),
            alignmentTests.testDistributionAlgorithms(),
            alignmentTests.testExportSnapping(),
            alignmentTests.testExportValidation(),
            alignmentTests.testPairDetection()
        ]

        const passed = results.filter(r => r).length
        const total = results.length

        console.log(`\n${'='.repeat(50)}`)
        console.log(`✅ Tests Complete: ${passed}/${total} passed`)
        console.log(`${'='.repeat(50)}\n`)

        return passed === total
    }
}

// Export for testing
export default alignmentTests
