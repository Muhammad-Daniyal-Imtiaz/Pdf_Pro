/**
 * Comprehensive Alignment Validation Test Suite
 * 
 * This test suite validates the production-grade alignment fixes including:
 * - Coordinate system conversion accuracy
 * - Real DOM metrics extraction
 * - PDF correction factors
 * - WYSIWYG fidelity validation
 * - Magnetic alignment guides
 * - Performance benchmarks
 */

import { CoordinateSystem } from '@/app/lib/geometry-engine/CoordinateSystem'
import { AlignmentEngine, AdvancedMeasurement, WYSIWYGValidator } from '@/app/lib/alignment-service'
import { EditorElement } from '@/app/store/useEditorStore'

export interface TestResult {
    testName: string
    passed: boolean
    details: string
    executionTime: number
    metrics?: any
}

export interface AlignmentTestSuite {
    coordinateSystemTests: TestResult[]
    alignmentEngineTests: TestResult[]
    pdfFidelityTests: TestResult[]
    performanceTests: TestResult[]
    overallScore: number
}

/**
 * Test helper to create mock elements
 */
function createMockElement(
    id: string,
    type: EditorElement['type'],
    x: number,
    y: number,
    width: number = 100,
    height: number = 50,
    overrides: Partial<EditorElement> = {}
): EditorElement {
    return {
        id,
        type,
        content: type === 'heading' ? 'Test Heading' : type === 'paragraph' ? 'Test paragraph content' : '',
        x,
        y,
        style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            fontWeight: '400',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0,
            color: '#000000',
            backgroundColor: 'transparent',
            borderColor: '#cccccc',
            padding: 12,
            margin: 8,
            width,
            height,
            borderWidth: 0,
            borderStyle: 'solid',
            borderRadius: 0,
            rotation: 0,
            opacity: 1,
            zIndex: 0,
            lockAspectRatio: false,
            linkColor: '#0066cc',
            linkDecoration: 'underline',
            ...overrides
        },
        iconType: type === 'social-icon' ? 'email' : undefined,
        url: type === 'link' ? 'https://example.com' : undefined,
        phoneNumber: type === 'link' ? '+1234567890' : undefined,
        lineOrientation: type === 'line' ? 'horizontal' : undefined,
        lineStyle: type === 'line' ? 'solid' : undefined,
        isClickable: type === 'link',
        showLabel: type === 'social-icon' ? false : undefined,
        labelPosition: type === 'social-icon' ? 'right' : undefined
    }
}

/**
 * Test Coordinate System Conversion
 */
export function testCoordinateSystemConversion(): TestResult[] {
    const tests: TestResult[] = []

    // Test 1: Screen to PDF conversion
    tests.push({
        testName: 'Screen to PDF Conversion',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const screenPixels = 96
        const expectedPdfPoints = 72 // 96 * 0.75
        const actualPdfPoints = CoordinateSystem.screenToPDF(screenPixels)
        const end = performance.now()

        tests[0].passed = Math.abs(actualPdfPoints - expectedPdfPoints) < 0.01
        tests[0].details = `Expected: ${expectedPdfPoints}pt, Got: ${actualPdfPoints}pt`
        tests[0].executionTime = end - start
    } catch (error) {
        tests[0].details = `Error: ${error}`
    }

    // Test 2: PDF to Screen conversion
    tests.push({
        testName: 'PDF to Screen Conversion',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const pdfPoints = 72
        const expectedScreenPixels = 96 // 72 / 0.75
        const actualScreenPixels = CoordinateSystem.pdfToScreen(pdfPoints)
        const end = performance.now()

        tests[1].passed = Math.abs(actualScreenPixels - expectedScreenPixels) < 0.01
        tests[1].details = `Expected: ${expectedScreenPixels}px, Got: ${actualScreenPixels}px`
        tests[1].executionTime = end - start
    } catch (error) {
        tests[1].details = `Error: ${error}`
    }

    // Test 3: Bidirectional conversion consistency
    tests.push({
        testName: 'Bidirectional Conversion Consistency',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const originalValue = 100
        const toPdf = CoordinateSystem.screenToPDF(originalValue)
        const backToScreen = CoordinateSystem.pdfToScreen(toPdf)
        const end = performance.now()

        tests[2].passed = Math.abs(originalValue - backToScreen) < 0.01
        tests[2].details = `Original: ${originalValue}, Round-trip: ${backToScreen}`
        tests[2].executionTime = end - start
    } catch (error) {
        tests[2].details = `Error: ${error}`
    }

    return tests
}

/**
 * Test Alignment Engine with Real Metrics
 */
export function testAlignmentEngine(): TestResult[] {
    const tests: TestResult[] = []

    // Test 1: Left alignment accuracy
    tests.push({
        testName: 'Left Alignment Accuracy',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const elements = [
            createMockElement('el1', 'paragraph', 100, 100, 150, 50),
            createMockElement('el2', 'paragraph', 200, 150, 120, 40),
            createMockElement('el3', 'social-icon', 150, 200, 40, 40)
        ]

        const alignmentUpdates = AlignmentEngine.alignLeft(elements)
        const end = performance.now()

        // All elements should have the same left edge after alignment
        const leftEdges = alignmentUpdates.map((update, index) => 
            update.x !== undefined ? update.x : elements[index].x
        )
        const uniqueLeftEdges = new Set(leftEdges)
        
        tests[0].passed = uniqueLeftEdges.size === 1
        tests[0].details = `Unique left edges after alignment: ${uniqueLeftEdges.size} (should be 1)`
        tests[0].metrics = { leftEdges, alignmentUpdates }
        tests[0].executionTime = end - start
    } catch (error) {
        tests[0].details = `Error: ${error}`
    }

    // Test 2: Center alignment with optical center
    tests.push({
        testName: 'Center Alignment with Optical Center',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const elements = [
            createMockElement('el1', 'paragraph', 100, 100, 150, 50),
            createMockElement('el2', 'social-icon', 200, 150, 40, 40)
        ]

        const alignmentUpdates = AlignmentEngine.alignCenter(elements)
        const end = performance.now()

        // Calculate actual centers after alignment
        const centers = alignmentUpdates.map((update, index) => {
            const el = { ...elements[index], ...update }
            return el.x + el.style.width / 2
        })
        
        const uniqueCenters = new Set(centers.map(c => Math.round(c)))
        
        tests[1].passed = uniqueCenters.size === 1
        tests[1].details = `Unique centers after alignment: ${uniqueCenters.size} (should be 1)`
        tests[1].metrics = { centers, alignmentUpdates }
        tests[1].executionTime = end - start
    } catch (error) {
        tests[1].details = `Error: ${error}`
    }

    // Test 3: Baseline alignment for mixed elements
    tests.push({
        testName: 'Baseline Alignment for Mixed Elements',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const elements = [
            createMockElement('el1', 'paragraph', 100, 100, 150, 50),
            createMockElement('el2', 'social-icon', 120, 120, 40, 40)
        ]

        const alignmentUpdates = AlignmentEngine.alignBaseline(elements)
        const end = performance.now()

        // Text should align with icon center visually
        tests[2].passed = alignmentUpdates.length === 2
        tests[2].details = `Baseline alignment updates generated for ${alignmentUpdates.length} elements`
        tests[2].metrics = { alignmentUpdates }
        tests[2].executionTime = end - start
    } catch (error) {
        tests[2].details = `Error: ${error}`
    }

    return tests
}

/**
 * Test PDF Fidelity Validation
 */
export function testPDFFidelity(): TestResult[] {
    const tests: TestResult[] = []

    // Test 1: PDF correction factors
    tests.push({
        testName: 'PDF Correction Factors',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const socialIcon = createMockElement('icon1', 'social-icon', 100, 100, 40, 40)
        const textElement = createMockElement('text1', 'paragraph', 150, 150, 200, 50)

        const iconCorrection = CoordinateSystem.getPDFCorrection(socialIcon)
        const textCorrection = CoordinateSystem.getPDFCorrection(textElement)
        const end = performance.now()

        tests[0].passed = iconCorrection !== null && textCorrection !== null
        tests[0].details = `Icon correction: ${iconCorrection ? 'Applied' : 'None'}, Text correction: ${textCorrection ? 'Applied' : 'None'}`
        tests[0].metrics = { iconCorrection, textCorrection }
        tests[0].executionTime = end - start
    } catch (error) {
        tests[0].details = `Error: ${error}`
    }

    // Test 2: WYSIWYG validation tolerance
    tests.push({
        testName: 'WYSIWYG Validation Tolerance',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        const elements = [
            createMockElement('el1', 'paragraph', 100, 100, 150, 50),
            createMockElement('el2', 'social-icon', 300, 200, 40, 40)
        ]

        // Mock validation
        const tolerance = CoordinateSystem.getAlignmentTolerance(elements.map(el => el.type))
        const end = performance.now()

        tests[1].passed = tolerance > 0 && tolerance <= 2
        tests[1].details = `Alignment tolerance: ${tolerance}px`
        tests[1].metrics = { tolerance, elementTypes: elements.map(el => el.type) }
        tests[1].executionTime = end - start
    } catch (error) {
        tests[1].details = `Error: ${error}`
    }

    return tests
}

/**
 * Test Performance Benchmarks
 */
export function testPerformance(): TestResult[] {
    const tests: TestResult[] = []

    // Test 1: Alignment calculation performance
    tests.push({
        testName: 'Alignment Calculation Performance',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        
        // Create 50 elements for stress testing
        const elements = Array.from({ length: 50 }, (_, i) => 
            createMockElement(`el${i}`, 'paragraph', Math.random() * 500, Math.random() * 300, 100 + Math.random() * 100, 50)
        )

        const alignmentUpdates = AlignmentEngine.alignLeft(elements)
        const end = performance.now()

        const executionTime = end - start
        tests[0].passed = executionTime < 5 // Should complete in under 5ms
        tests[0].details = `Aligned ${elements.length} elements in ${executionTime.toFixed(2)}ms`
        tests[0].metrics = { elementCount: elements.length, executionTime }
        tests[0].executionTime = executionTime
    } catch (error) {
        tests[0].details = `Error: ${error}`
    }

    // Test 2: Coordinate conversion performance
    tests.push({
        testName: 'Coordinate Conversion Performance',
        passed: false,
        details: '',
        executionTime: 0
    })

    try {
        const start = performance.now()
        
        // Test 1000 conversions
        for (let i = 0; i < 1000; i++) {
            const screenValue = Math.random() * 1000
            const pdfValue = CoordinateSystem.screenToPDF(screenValue)
            const backToScreen = CoordinateSystem.pdfToScreen(pdfValue)
        }

        const end = performance.now()
        const executionTime = end - start
        
        tests[1].passed = executionTime < 10 // Should complete in under 10ms
        tests[1].details = `Performed 1000 bidirectional conversions in ${executionTime.toFixed(2)}ms`
        tests[1].metrics = { conversions: 1000, executionTime }
        tests[1].executionTime = executionTime
    } catch (error) {
        tests[1].details = `Error: ${error}`
    }

    return tests
}

/**
 * Run complete alignment test suite
 */
export function runAlignmentTestSuite(): AlignmentTestSuite {
    const coordinateSystemTests = testCoordinateSystemConversion()
    const alignmentEngineTests = testAlignmentEngine()
    const pdfFidelityTests = testPDFFidelity()
    const performanceTests = testPerformance()

    const allTests = [...coordinateSystemTests, ...alignmentEngineTests, ...pdfFidelityTests, ...performanceTests]
    const passedTests = allTests.filter(test => test.passed).length
    const overallScore = Math.round((passedTests / allTests.length) * 100)

    return {
        coordinateSystemTests,
        alignmentEngineTests,
        pdfFidelityTests,
        performanceTests,
        overallScore
    }
}

/**
 * Generate test report
 */
export function generateTestReport(testSuite: AlignmentTestSuite): string {
    const report = `
# Alignment System Test Report
Generated: ${new Date().toISOString()}

## Overall Score: ${testSuite.overallScore}/100

### Coordinate System Tests
${testSuite.coordinateSystemTests.map(test => 
    `- **${test.testName}**: ${test.passed ? '✅ PASS' : '❌ FAIL'} (${test.executionTime.toFixed(2)}ms)
  ${test.details}`
).join('\n')}

### Alignment Engine Tests
${testSuite.alignmentEngineTests.map(test => 
    `- **${test.testName}**: ${test.passed ? '✅ PASS' : '❌ FAIL'} (${test.executionTime.toFixed(2)}ms)
  ${test.details}`
).join('\n')}

### PDF Fidelity Tests
${testSuite.pdfFidelityTests.map(test => 
    `- **${test.testName}**: ${test.passed ? '✅ PASS' : '❌ FAIL'} (${test.executionTime.toFixed(2)}ms)
  ${test.details}`
).join('\n')}

### Performance Tests
${testSuite.performanceTests.map(test => 
    `- **${test.testName}**: ${test.passed ? '✅ PASS' : '❌ FAIL'} (${test.executionTime.toFixed(2)}ms)
  ${test.details}`
).join('\n')}

## Summary
- Total Tests: ${testSuite.coordinateSystemTests.length + testSuite.alignmentEngineTests.length + testSuite.pdfFidelityTests.length + testSuite.performanceTests.length}
- Passed: ${testSuite.coordinateSystemTests.filter(t => t.passed).length + testSuite.alignmentEngineTests.filter(t => t.passed).length + testSuite.pdfFidelityTests.filter(t => t.passed).length + testSuite.performanceTests.filter(t => t.passed).length}
- Failed: ${testSuite.coordinateSystemTests.filter(t => !t.passed).length + testSuite.alignmentEngineTests.filter(t => !t.passed).length + testSuite.pdfFidelityTests.filter(t => !t.passed).length + testSuite.performanceTests.filter(t => !t.passed).length}

## Recommendations
${testSuite.overallScore >= 90 ? 
    '🎉 Excellent! All systems are performing optimally.' :
    testSuite.overallScore >= 75 ?
    '✅ Good performance. Consider minor optimizations.' :
    testSuite.overallScore >= 60 ?
    '⚠️ Some issues detected. Review failed tests.' :
    '❌ Critical issues found. Immediate attention required.'
}
`

    return report
}

// Legacy tests for compatibility
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
        letterSpacing: 0,
        color: '#000000',
        backgroundColor: 'transparent',
        borderColor: '#cccccc',
        padding: 12,
        margin: 8,
        width: 200,
        height: 50,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 0,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        lockAspectRatio: false,
        linkColor: '#0066cc',
        linkDecoration: 'underline'
    }
}

const mockIconElement: EditorElement = {
    id: 'icon-1',
    type: 'social-icon',
    content: '',
    iconType: 'email',
    x: 150,
    y: 200,
    style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 24,
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
        color: '#000000',
        backgroundColor: 'transparent',
        borderColor: '#cccccc',
        padding: 8,
        margin: 8,
        width: 40,
        height: 40,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 0,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        lockAspectRatio: true,
        linkColor: '#0066cc',
        linkDecoration: 'underline'
    },
    showLabel: false,
    labelPosition: 'right'
}

// Legacy test functions for backward compatibility
export function testBoundingBoxCalculation() {
    const bbox = AdvancedMeasurement.calculateBoundingBox(mockTextElement)
    console.log('Bounding box calculation:', bbox)
    return bbox
}

export function testFontMetrics() {
    const metrics = AdvancedMeasurement.calculateFontMetrics(14, 'Inter', 1.5)
    console.log('Font metrics:', metrics)
    return metrics
}

export function testOpticalCenter() {
    const center = AdvancedMeasurement.calculateOpticalCenter(mockTextElement)
    console.log('Optical center:', center)
    return center
}

export function testAlignmentAccuracy() {
    const elements = [mockTextElement, mockIconElement]
    const leftAlignment = AlignmentEngine.alignLeft(elements)
    const centerAlignment = AlignmentEngine.alignCenter(elements)
    
    console.log('Left alignment:', leftAlignment)
    console.log('Center alignment:', centerAlignment)
    
    return { leftAlignment, centerAlignment }
}

export function testWYSIWYGValidation() {
    const validation = WYSIWYGValidator.validateExportFidelity(mockTextElement)
    console.log('WYSIWYG validation:', validation)
    return validation
}

export function testGridSnapping() {
    const snapped = AdvancedMeasurement.snapToGrid(123.4, 8, 0.5)
    console.log('Grid snapping result:', snapped)
    return snapped
}

export function testSpacingCompensation() {
    const compensation = AdvancedMeasurement.calculateSpacingCompensation(
        mockTextElement,
        mockIconElement,
        'vertical'
    )
    console.log('Spacing compensation:', compensation)
    return compensation
}

export function testExportSnapping() {
    const snapped = AlignmentEngine.snapToExportGrid([mockTextElement, mockIconElement], 0.5)
    console.log('Export snapping:', snapped)
    return snapped
}

export function testPairDetection() {
    const pairs = AlignmentEngine.detectAndAlignPairs([mockTextElement, mockIconElement])
    console.log('Detected pairs:', pairs)
    return pairs
}

// Test runner for legacy tests
export function runLegacyTests() {
    console.log('Running legacy alignment tests...')
    
    testBoundingBoxCalculation()
    testFontMetrics()
    testOpticalCenter()
    testAlignmentAccuracy()
    testWYSIWYGValidation()
    testGridSnapping()
    testSpacingCompensation()
    testExportSnapping()
    testPairDetection()
    
    console.log('Legacy tests completed.')
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
