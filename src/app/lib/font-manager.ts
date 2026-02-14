/**
 * font-manager.ts
 * Handles font loading, caching, and ensures fonts are ready for rendering
 */

export interface FontDescriptor {
    family: string
    weight?: number | string
    style?: string
}

class FontManager {
    private loadedFonts: Set<string> = new Set()

    public async preloadFontFamily(family: string, weights: (number | string)[] = [400, 700]): Promise<void> {
        const promises = weights.map(weight => this.loadFont({ family, weight }))
        await Promise.all(promises)
    }

    public async loadFont(descriptor: FontDescriptor): Promise<boolean> {
        const { family, weight = 400, style = 'normal' } = descriptor
        const fontKey = `${family}-${weight}-${style}`

        if (this.loadedFonts.has(fontKey)) return true

        try {
            // Check if FontFace API is available
            if ('fonts' in document) {
                // If it's a specific Google Font or similar, we might need a URL.
                // But generally we expect them to be in the CSS already.
                // This checks if the font is actually loaded and ready.
                const fontStr = `${style} ${weight} 12px "${family}"`
                await (document as any).fonts.load(fontStr)
                this.loadedFonts.add(fontKey)
                return true
            }
        } catch (err) {
            console.warn(`Failed to load font: ${family}`, err)
        }
        return false
    }

    public isFontAvailable(family: string, weight: number | string = 400): boolean {
        const fontKey = `${family}-${weight}-normal`
        return this.loadedFonts.has(fontKey)
    }

    public getFontWithFallback(family: string): string {
        const fallbacks = 'Inter, system-ui, -apple-system, sans-serif'
        if (family.includes(',')) return family
        return `"${family}", ${fallbacks}`
    }
}

let instance: FontManager | null = null

export const getFontManager = () => {
    if (!instance) {
        instance = new FontManager()
    }
    return instance
}
