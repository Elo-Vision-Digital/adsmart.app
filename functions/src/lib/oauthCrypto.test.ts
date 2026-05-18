import { describe, expect, it, beforeEach } from 'vitest'
import {
  _resetKeyCacheForTests,
  decryptField,
  detectAndDecrypt,
  encryptString,
  isEncryptedField,
} from './oauthCrypto'

const SECRET = 'test-encryption-key-with-enough-entropy-32bytes-min'

beforeEach(() => {
  _resetKeyCacheForTests()
})

describe('encryptString → decryptField (round trip)', () => {
  it('round-trips a short ASCII string', () => {
    const enc = encryptString('hello world', SECRET)
    expect(enc.v).toBe(1)
    expect(enc.iv).toMatch(/^[A-Za-z0-9+/=]+$/) // base64
    expect(enc.tag).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(enc.ct).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(decryptField(enc, SECRET)).toBe('hello world')
  })

  it('round-trips a realistic Google OAuth access token', () => {
    const accessToken = 'ya29.a0AfH6SMBxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx-_AcCessToKenSh4peWithDashesAndUnderscores'
    const enc = encryptString(accessToken, SECRET)
    expect(decryptField(enc, SECRET)).toBe(accessToken)
  })

  it('round-trips a UTF-8 string with non-ASCII characters', () => {
    const plaintext = 'usuário-açaí-😀-中文'
    const enc = encryptString(plaintext, SECRET)
    expect(decryptField(enc, SECRET)).toBe(plaintext)
  })

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const a = encryptString('hello', SECRET)
    const b = encryptString('hello', SECRET)
    expect(a.iv).not.toBe(b.iv)
    expect(a.ct).not.toBe(b.ct)
    expect(decryptField(a, SECRET)).toBe('hello')
    expect(decryptField(b, SECRET)).toBe('hello')
  })
})

describe('decryptField — failure modes', () => {
  it('throws on a tampered ciphertext', () => {
    const enc = encryptString('hello world', SECRET)
    const tampered = { ...enc, ct: Buffer.from('tamperedpayload').toString('base64') }
    expect(() => decryptField(tampered, SECRET)).toThrow(/authentication failed/i)
  })

  it('throws on a tampered auth tag', () => {
    const enc = encryptString('hello world', SECRET)
    const tampered = { ...enc, tag: Buffer.alloc(16).toString('base64') }
    expect(() => decryptField(tampered, SECRET)).toThrow(/authentication failed/i)
  })

  it('throws when decrypted with a different key', () => {
    const enc = encryptString('hello world', SECRET)
    _resetKeyCacheForTests()
    expect(() => decryptField(enc, 'different-secret-of-similar-length-32b')).toThrow(
      /authentication failed/i
    )
  })

  it('throws on an unsupported version', () => {
    expect(() =>
      decryptField({ v: 999, iv: 'AAAA', tag: 'AAAA', ct: 'AAAA' }, SECRET)
    ).toThrow(/unsupported version/i)
  })

  it('throws on a missing field', () => {
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: testing a malformed payload on purpose
      decryptField({ v: 1, iv: 'x', tag: 'y' } as any, SECRET)
    ).toThrow(/missing iv\/tag\/ct/)
  })
})

describe('encryptString — input validation', () => {
  it('throws on empty plaintext', () => {
    expect(() => encryptString('', SECRET)).toThrow(/non-empty plaintext/)
  })

  it('throws on empty secret', () => {
    expect(() => encryptString('x', '')).toThrow(/ENCRYPTION_KEY is empty/)
  })
})

describe('isEncryptedField', () => {
  it('recognizes a freshly-encrypted v1 field', () => {
    expect(isEncryptedField(encryptString('x', SECRET))).toBe(true)
  })

  it('rejects a legacy Base64 string', () => {
    expect(isEncryptedField('aGVsbG8=')).toBe(false)
  })

  it('rejects null and primitives', () => {
    expect(isEncryptedField(null)).toBe(false)
    expect(isEncryptedField(undefined)).toBe(false)
    expect(isEncryptedField(42)).toBe(false)
  })

  it('rejects an object with a different version', () => {
    expect(isEncryptedField({ v: 2, iv: 'a', tag: 'b', ct: 'c' })).toBe(false)
  })
})

describe('detectAndDecrypt — backward compat', () => {
  it('decrypts a v1 EncryptedField', () => {
    const enc = encryptString('modern-token', SECRET)
    expect(detectAndDecrypt(enc, SECRET)).toBe('modern-token')
  })

  it('decodes a legacy Base64 string', () => {
    const legacy = Buffer.from('legacy-token-value').toString('base64')
    expect(detectAndDecrypt(legacy, SECRET)).toBe('legacy-token-value')
  })

  it('throws on a value that is neither shape', () => {
    expect(() => detectAndDecrypt(42, SECRET)).toThrow(/neither v1 EncryptedField nor legacy/)
    expect(() => detectAndDecrypt(null, SECRET)).toThrow(/neither v1 EncryptedField nor legacy/)
    expect(() => detectAndDecrypt({}, SECRET)).toThrow(/neither v1 EncryptedField nor legacy/)
  })

  it('throws on an empty string (could not be a real token)', () => {
    expect(() => detectAndDecrypt('', SECRET)).toThrow(/neither v1 EncryptedField nor legacy/)
  })
})
