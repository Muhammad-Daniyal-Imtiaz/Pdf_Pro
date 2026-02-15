import DOMPurify from 'dompurify'

export function sanitizeContent(content: string): string {
  if (typeof window === 'undefined') {
    // Server-side: strip all HTML for safety, but allow <br> if we were to process it
    // Actually, for PDF generation we want to allow <br>
    // Since we're using Puppeteer, we can use a more sophisticated approach or just be strict.
    return content.replace(/<(?!\/?br\s*\/?)[^>]*>/gi, '')
  }
  
  // Client-side: allow safe HTML
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['br', 'strong', 'em', 'u', 'span'],
    ALLOWED_ATTR: ['style']
  })
}
