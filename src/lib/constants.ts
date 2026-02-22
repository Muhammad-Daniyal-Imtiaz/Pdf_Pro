// lib/constants.ts
// =============================================================================
// SINGLE SOURCE OF TRUTH — A4 Canvas & PDF Dimensions
// =============================================================================

// A4 at 96 DPI — Editor canvas resolution (screen pixels)
export const CANVAS_WIDTH_PX = 794
export const CANVAS_HEIGHT_PX = 1123

// A4 in PDF points (72 DPI)
export const PDF_WIDTH_PT = 595
export const PDF_HEIGHT_PT = 842

// Scale: canvas-px → pdf-pt
export const PX_TO_PT = PDF_WIDTH_PT / CANVAS_WIDTH_PX  // ≈ 0.7493

// Safe margins (canvas px)
export const SAFE_MARGIN_X = 40
export const SAFE_MARGIN_Y = 40

// Usable content width inside margins: 794 - 80 = 714px
export const CONTENT_WIDTH = CANVAS_WIDTH_PX - SAFE_MARGIN_X * 2

// Clamping helpers
export const SAFE_RIGHT = CANVAS_WIDTH_PX - SAFE_MARGIN_X  // 754
export const SAFE_BOTTOM = CANVAS_HEIGHT_PX - SAFE_MARGIN_Y  // 1083

// Z-Index painter's algorithm — strict hierarchy
export const Z_LAYERS = {
    BACKGROUND: -1,   // Full-page fill
    BANNER: 0,   // Partial header/footer band
    SHAPE: 1,   // Decorative shapes / card backgrounds
    IMAGE: 2,   // Photo placeholders
    LINE: 3,   // Dividers
    TEXT: 4,   // Body paragraphs
    HEADING: 5,   // Section & page titles — above text
    ICON: 6,   // Social / inline icons — topmost regular layer
    OVERLAY: 10,   // Reserved for modals / tooltips
} as const

export type ZLayerKey = keyof typeof Z_LAYERS
