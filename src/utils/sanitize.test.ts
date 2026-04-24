import { describe, expect, it } from 'vitest'
import { sanitizeEmail, sanitizeFilename, sanitizeHTML, sanitizeInput } from './sanitize'

describe('sanitizeInput', () => {
  it('strips all HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>hello')).toBe('hello')
  })

  it('strips attributes', () => {
    expect(sanitizeInput('<div onclick="x">text</div>')).toBe('text')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('preserves plain text', () => {
    expect(sanitizeInput('hello world 123')).toBe('hello world 123')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('removes img tags with onerror', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('')
  })
})

describe('sanitizeHTML', () => {
  it('preserves allowed tags', () => {
    expect(sanitizeHTML('<b>bold</b>')).toBe('<b>bold</b>')
    expect(sanitizeHTML('<p>paragraph</p>')).toBe('<p>paragraph</p>')
    expect(sanitizeHTML('<a href="https://x.com">link</a>')).toContain('href="https://x.com"')
  })

  it('strips script tags', () => {
    expect(sanitizeHTML('<script>evil()</script><p>ok</p>')).toBe('<p>ok</p>')
  })

  it('strips style attribute', () => {
    const out = sanitizeHTML('<p style="color:red">x</p>')
    expect(out).toBe('<p>x</p>')
  })

  it('strips data- attributes', () => {
    const out = sanitizeHTML('<p data-evil="1">x</p>')
    expect(out).not.toContain('data-evil')
  })

  it('strips javascript: href', () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })
})

describe('sanitizeEmail', () => {
  it('lowercases', () => {
    expect(sanitizeEmail('FOO@BAR.COM')).toBe('foo@bar.com')
  })

  it('trims', () => {
    expect(sanitizeEmail('  foo@bar.com  ')).toBe('foo@bar.com')
  })
})

describe('sanitizeFilename', () => {
  it('replaces unsafe chars with underscore', () => {
    expect(sanitizeFilename('my file/../etc/passwd')).toBe('my_file_.._etc_passwd')
  })

  it('preserves allowed chars (alphanum, dot, underscore, dash)', () => {
    expect(sanitizeFilename('report-2024_v1.pdf')).toBe('report-2024_v1.pdf')
  })

  it('replaces spaces', () => {
    expect(sanitizeFilename('my document.txt')).toBe('my_document.txt')
  })

  it('replaces unicode', () => {
    expect(sanitizeFilename('relatório.pdf')).toBe('relat_rio.pdf')
  })
})
