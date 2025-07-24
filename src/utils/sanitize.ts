import DOMPurify from 'dompurify'

export function sanitizeInput(input: string): string {
  // Remove todas as tags HTML e atributos
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim()
}

export function sanitizeHTML(html: string): string {
  // Permite apenas tags seguras para conteúdo rico
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  })
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizeFilename(filename: string): string {
  // Remove caracteres perigosos de nomes de arquivo
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
}