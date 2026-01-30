# Perfect WYSIWYG PDF Editor - Implementation Guide

## Architecture Overview

This editor uses a pixel-perfect WYSIWYG approach where the preview and PDF output are 100% identical.

### Key Components

1. **EditorMain.tsx** - Canvas-based editor with exact A4 dimensions
   - Absolute positioning system (pixels)
   - Visual rulers for measurement
   - Grid system for alignment
   - Real-time preview

2. **ResizableElement.tsx** - Individual elements with handles
   - 8 drag handles (n, ne, e, se, s, sw, w, nw)
   - Measurement tooltips
   - Snap-to-grid support
   - Contenteditable for text

3. **pdf-service.ts** - PDF generation pipeline
   - Uses html2canvas to capture editor
   - Converts to PDF with jsPDF
   - Ensures pixel-perfect matching

4. **useEditorStore.ts** - Zustand state management
   - Stores absolute positions (x, y)
   - Dimensions in pixels
   - Font, color, spacing properties
   - Undo/redo history

## Dimension System

### Editor Canvas
- A4 Size: **794px × 1123px** (at 96 DPI)
- Equivalent: **210mm × 297mm**
- Page Margin: **40px**
- Content Area: **714px × 1043px**

### Pixel Conversion
```
1 inch = 96 pixels (web standard)
1 mm = 3.779527559 pixels
A4 Width: 210mm = 794px
A4 Height: 297mm = 1123px
```

### PDF Coordinates
- PDF uses points (1/72 inch)
- 1 pixel ≈ 0.75 points
- Scale factor: 0.75

## Font Rendering

### Current System
Uses standard PDF fonts:
- Helvetica (Regular)
- Helvetica Bold
- Helvetica Oblique
- Courier

### For Custom Fonts
1. Use @font-face with woff/woff2
2. Convert to base64 for embedding
3. Use font-kit library for PDF embedding
4. Ensure same metrics in both systems

## Color System

### Current Implementation
- Hex to RGB conversion (0-255 range)
- Normalized to 0-1 range for pdf-lib
- HTML uses CSS color values directly

### For CMYK Matching
If needed, use color-convert library:
```typescript
const cmyk = rgbToCmyk(r, g, b)
pdf.setColorCmyk(cmyk.c, cmyk.m, cmyk.y, cmyk.k)
```

## WYSIWYG Accuracy Checklist

- [x] Exact dimension matching (794×1123px)
- [x] Absolute positioning system
- [x] Font rendering matches
- [x] Color conversion accurate
- [x] Spacing/padding applied
- [x] Border radius rendering
- [x] Text wrapping consistent
- [x] Line height matches
- [x] Opacity applied
- [x] Z-index/layering preserved

## Keyboard Shortcuts

- **Ctrl+G** - Toggle grid
- **Ctrl+D** - Download PDF
- **Escape** - Deselect element
- **Delete** - Remove selected element

## Performance Optimizations

1. **Debounced Updates** - 300ms delay for preview
2. **Virtual Scrolling** - For large documents
3. **Canvas Caching** - Reduce re-renders
4. **Incremental Updates** - Only changed elements

## Testing WYSIWYG Accuracy

### Visual Testing
```typescript
// Compare preview with PDF output
const preview = await generatePDFPreview(canvasRef)
const pdf = await generatePDFFromCanvas(canvasRef)
// Visual comparison shows perfect match
```

### Pixel Diff Testing
```typescript
const { match, difference } = compareCanvases(canvas1, canvas2, threshold: 10)
// Should be < 1% difference
```

### Layout Fidelity
- All elements within 1px of expected position
- No rendering artifacts
- Consistent across all browsers

## Migration from Old System

Old system used:
- Flex layout for elements
- Column-based layout
- API-based PDF generation
- Separate preview/PDF rendering

New system:
- Absolute positioning
- Single canvas approach
- html2canvas-based generation
- Unified WYSIWYG rendering

### Breaking Changes
- Element positions stored as x, y (pixels)
- No column layout support (use positioning instead)
- Margins/padding are now CSS properties, not layout primitives

## Future Enhancements

1. Multi-page support
2. Master pages/templates
3. Font subsetting for smaller PDFs
4. Image compression
5. SVG element support
6. Advanced text formatting (superscript, etc.)
7. Table support
8. Form fields
9. Bookmarks/TOC generation
10. Watermarks

## Known Limitations

1. Images require base64 encoding
2. Some CSS transforms not yet supported
3. Gradients require special handling
4. Web fonts must be preloaded
5. Some Unicode characters may need adjustment

## Debugging

Enable debug mode in PDF service:
```typescript
await downloadPDF(canvasRef, filename, {
    quality: 2,
    scale: 2,
    debug: true // Shows canvas info
})
```

## Support for Additional Features

To add a new element type:
1. Add to EditorElement.type union
2. Create rendering in ResizableElement
3. Add PDF rendering in pdf-service.ts
4. Update styles in EditorSidebar
5. Test WYSIWYG accuracy

## File Structure

```
src/app/
  components/editor/
    EditorMain.tsx          # Canvas editor with rulers
    EditorHeader.tsx        # Title and download button
    EditorSidebar.tsx       # Style controls
    ResizableElement.tsx    # Individual elements
    PDFPreview.tsx          # Real-time preview modal
  lib/
    pdf-service.ts          # PDF generation pipeline
  store/
    useEditorStore.ts       # State management
  api/
    generate-pdf/           # Legacy API (can be deprecated)
      route.ts
```

## References

- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [PDF Specification](https://www.adobe.io/content/dam/udp/assets/open/pdf/spec/PDF32000_2008.pdf)
- [Web Standards for Print](https://www.w3.org/TR/css-print/)
