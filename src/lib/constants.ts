// lib/constants.ts
// =============================================================================
// SINGLE SOURCE OF TRUTH FOR ALL CANVAS / PDF DIMENSIONS
// =============================================================================

// A4 at 96 DPI — this is what the EDITOR canvas renders at (screen pixel units)
export const CANVAS_WIDTH_PX = 794
export const CANVAS_HEIGHT_PX = 1123

// A4 at 72 DPI (PDF points) — what Puppeteer/PDF spec uses
export const PDF_WIDTH_PT = 595
export const PDF_HEIGHT_PT = 842

// Scale factor: multiply editor-pixel coords by this to get PDF-point coords
// (Not used for rendering since Puppeteer renders at CANVAS size and prints at A4,
//  but kept for any explicit coordinate conversion utilities)
export const PX_TO_PT = PDF_WIDTH_PT / CANVAS_WIDTH_PX   // ≈ 0.7492

// Safe page margins (in CANVAS pixels — 96 DPI)
export const SAFE_MARGIN_X = 40
export const SAFE_MARGIN_Y = 40

// Min/max clamping for content elements (canvas px)
export const SAFE_RIGHT = CANVAS_WIDTH_PX - SAFE_MARGIN_X   // 754
export const SAFE_BOTTOM = CANVAS_HEIGHT_PX - SAFE_MARGIN_Y   // 1083

// Z-Index layers — strict painter's algorithm
export const Z_LAYERS = {
    BACKGROUND: -1,   // Full-page fill (entire 794×1123)
    BANNER: 0,   // Partial header/footer band
    SHAPE: 1,   // Decorative shapes / card backgrounds
    IMAGE: 2,   // Photo / image placeholders
    LINE: 3,   // Dividers
    TEXT: 4,   // Body paragraphs
    ICON: 5,   // Social / inline icons
    HEADING: 6,   // ALWAYS on top of everything
} as const

// Type export for consumers
export type ZLayerKey = keyof typeof Z_LAYERS
