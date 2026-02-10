// lib/coordinates.ts - Unified coordinate system for PDF editor
// This module provides the single source of truth for all coordinate conversions

// PDF constants
export const PDF_DPI = 72
export const CSS_DPI = 96
export const DEFAULT_SCALE_FACTOR = CSS_DPI / PDF_DPI // 1.3333

// Page dimensions in CSS pixels (at 96 DPI)
export const A4_WIDTH_CSS = 794  // ~210mm at 96 DPI
export const A4_HEIGHT_CSS = 1123 // ~297mm at 96 DPI

// Page dimensions in PDF points (at 72 DPI)
export const A4_WIDTH_PDF = 595.28
export const A4_HEIGHT_PDF = 841.89

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * CoordinateSystem - Manages all coordinate conversions between PDF and CSS space
 * 
 * Key principle: All coordinates stored in state are CSS pixels relative to 
 * the top-left corner of the page (0,0).
 * 
 * PDF space: Origin at bottom-left, units in points (1/72 inch)
 * CSS space: Origin at top-left, units in pixels (1/96 inch)
 */
export class CoordinateSystem {
  private scaleFactor: number
  private pageWidthPdf: number
  private pageHeightPdf: number
  private pageWidthCss: number
  private pageHeightCss: number

  constructor(
    pageWidthPdf: number = A4_WIDTH_PDF,
    pageHeightPdf: number = A4_HEIGHT_PDF,
    scaleFactor: number = DEFAULT_SCALE_FACTOR
  ) {
    this.pageWidthPdf = pageWidthPdf
    this.pageHeightPdf = pageHeightPdf
    this.scaleFactor = scaleFactor
    this.pageWidthCss = Math.round(pageWidthPdf * scaleFactor)
    this.pageHeightCss = Math.round(pageHeightPdf * scaleFactor)
  }

  // Getters for page dimensions
  get pageWidth() { return this.pageWidthCss }
  get pageHeight() { return this.pageHeightCss }
  get scale() { return this.scaleFactor }

  /**
   * Convert PDF coordinates (bottom-left origin, points) to CSS coordinates 
   * (top-left origin, pixels)
   * 
   * PDF.js transform: [scaleX, skewX, skewY, scaleY, tx, ty]
   * where tx, ty is the position from bottom-left in PDF points
   */
  pdfToCss(pdfX: number, pdfY: number, itemHeight: number = 0): Point {
    // Scale PDF points to CSS pixels
    const cssX = pdfX * this.scaleFactor
    // Flip Y axis: PDF origin is bottom-left, CSS is top-left
    // PDF Y is distance from bottom, so subtract from page height
    const cssY = (this.pageHeightPdf - pdfY - itemHeight) * this.scaleFactor
    
    return {
      x: Math.round(cssX),
      y: Math.round(cssY)
    }
  }

  /**
   * Convert CSS coordinates (top-left origin, pixels) to PDF coordinates
   * (bottom-left origin, points)
   */
  cssToPdf(cssX: number, cssY: number, itemHeight: number = 0): Point {
    const pdfX = cssX / this.scaleFactor
    // Flip Y axis back
    const pdfY = this.pageHeightPdf - (cssY / this.scaleFactor) - itemHeight
    
    return {
      x: pdfX,
      y: pdfY
    }
  }

  /**
   * Convert a rectangle from PDF space to CSS space
   */
  pdfRectToCss(pdfX: number, pdfY: number, pdfWidth: number, pdfHeight: number): Rect {
    const topLeft = this.pdfToCss(pdfX, pdfY, pdfHeight)
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: Math.round(pdfWidth * this.scaleFactor),
      height: Math.round(pdfHeight * this.scaleFactor)
    }
  }

  /**
   * Convert a rectangle from CSS space to PDF space
   */
  cssRectToPdf(cssX: number, cssY: number, cssWidth: number, cssHeight: number): Rect {
    const pdfPos = this.cssToPdf(cssX, cssY, cssHeight)
    
    return {
      x: pdfPos.x,
      y: pdfPos.y,
      width: cssWidth / this.scaleFactor,
      height: cssHeight / this.scaleFactor
    }
  }

  /**
   * Scale a dimension from PDF points to CSS pixels
   */
  scalePdfToCss(pdfValue: number): number {
    return Math.round(pdfValue * this.scaleFactor)
  }

  /**
   * Scale a dimension from CSS pixels to PDF points
   */
  scaleCssToPdf(cssValue: number): number {
    return cssValue / this.scaleFactor
  }

  /**
   * Round to nearest integer to prevent sub-pixel blur
   */
  static snapToInt(value: number): number {
    return Math.round(value)
  }

  /**
   * Ensure coordinates are within page bounds
   */
  clampToPage(x: number, y: number, width: number = 0, height: number = 0): Point {
    return {
      x: Math.max(0, Math.min(x, this.pageWidthCss - width)),
      y: Math.max(0, Math.min(y, this.pageHeightCss - height))
    }
  }
}

/**
 * Create a coordinate system from a PDF.js viewport
 */
export function createFromViewport(viewport: { width: number; height: number; scale: number }): CoordinateSystem {
  // Viewport dimensions are already in CSS pixels
  // We need to reverse-calculate the PDF dimensions
  const pageWidthPdf = viewport.width / viewport.scale
  const pageHeightPdf = viewport.height / viewport.scale
  
  return new CoordinateSystem(pageWidthPdf, pageHeightPdf, viewport.scale)
}

/**
 * Default A4 coordinate system
 */
export const defaultCoordinateSystem = new CoordinateSystem()
