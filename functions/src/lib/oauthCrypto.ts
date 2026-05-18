import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

// AES-256-GCM authenticated encryption for OAuth tokens stored at rest in
// Firestore (ADR-019). Replaces the pre-Sprint-3 Base64 "encryption" that
// was no encryption at all — any reader of the database could decode it.
//
// Pattern follows the canonical Node.js crypto AEAD example documented at
// https://nodejs.org/docs/latest-v22.x/api/crypto.html#class-cipheriv (validated
// via Context7 against /websites/nodejs_latest-v22_x_api 2026-05-17):
//
//   - 256-bit key derived from the ENCRYPTION_KEY secret via scryptSync
//     (NIST SP 800-132 KDF). The salt is a fixed project-scoped constant
//     because the secret itself is high-entropy and per-project; per-record
//     salts add no security here and would break determinism for key
//     comparison.
//   - 96-bit (12-byte) nonce/IV from randomBytes per encryption call —
//     NEVER reuse a nonce with the same key under GCM. Stored alongside
//     the ciphertext.
//   - 128-bit (16-byte) auth tag — getAuthTag()/setAuthTag(). The tag
//     authenticates the ciphertext; final() throws if it has been
//     tampered with.
//
// Versioned wire format on Firestore:
//   { v: 1, iv: <base64>, tag: <base64>, ct: <base64> }
// Version field is mandatory so future schemes (AES-GCM-SIV, KMS envelope,
// etc) can coexist with v1 records without an offline migration.
//
// Backward compatibility: pre-Sprint-3 docs persisted each token field as
// a Base64 string of the plaintext at the same Firestore field name (e.g.
// `accessToken: "ya29..."` Base64-encoded). detectAndDecrypt() recognizes
// the legacy shape and decodes it transparently. Callers re-encrypt the
// payload back through encryptString() on the next write, so the legacy
// path naturally shrinks over time.

const KEY_LENGTH = 32 // bytes — AES-256
const IV_LENGTH = 12 // bytes — GCM recommended
const AUTH_TAG_LENGTH = 16 // bytes — GCM standard
const SCRYPT_SALT = 'adsmart-oauth-v1' // fixed; secret-side entropy carries the security
const CURRENT_VERSION = 1

export interface EncryptedField {
  v: number
  iv: string
  tag: string
  ct: string
}

let cachedKey: Buffer | null = null
let cachedKeySource: string | null = null

function deriveKey(secret: string): Buffer {
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is empty — cannot derive AES key')
  }
  if (cachedKey && cachedKeySource === secret) {
    return cachedKey
  }
  cachedKey = scryptSync(secret, SCRYPT_SALT, KEY_LENGTH)
  cachedKeySource = secret
  return cachedKey
}

// Encrypt a plaintext string with AES-256-GCM. Returns the versioned
// wire-format record; the caller embeds this object verbatim in the
// Firestore document.
export function encryptString(plaintext: string, secret: string): EncryptedField {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encryptString requires a non-empty plaintext')
  }
  const key = deriveKey(secret)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    v: CURRENT_VERSION,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ct.toString('base64'),
  }
}

// Decrypt a v1 EncryptedField back to its UTF-8 plaintext. Throws if the
// auth tag mismatches (tampering, wrong key, corrupted blob).
export function decryptField(field: EncryptedField, secret: string): string {
  if (!field || typeof field !== 'object') {
    throw new Error('decryptField: invalid field')
  }
  if (field.v !== CURRENT_VERSION) {
    throw new Error(`decryptField: unsupported version ${field.v}`)
  }
  if (typeof field.iv !== 'string' || typeof field.tag !== 'string' || typeof field.ct !== 'string') {
    throw new Error('decryptField: missing iv/tag/ct')
  }
  const key = deriveKey(secret)
  const iv = Buffer.from(field.iv, 'base64')
  const tag = Buffer.from(field.tag, 'base64')
  const ct = Buffer.from(field.ct, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(tag)
  try {
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch (err) {
    const cause = err instanceof Error ? `: ${err.message}` : ''
    throw new Error(`decryptField: authentication failed${cause}`)
  }
}

// Type guard for the v1 wire format. Used by detectAndDecrypt to branch.
export function isEncryptedField(value: unknown): value is EncryptedField {
  return (
    typeof value === 'object' &&
    value !== null &&
    'v' in value &&
    'iv' in value &&
    'tag' in value &&
    'ct' in value &&
    (value as EncryptedField).v === CURRENT_VERSION
  )
}

// Read-side helper: accepts either a v1 EncryptedField (preferred) or a
// pre-Sprint-3 legacy Base64 string and returns the plaintext. Callers
// that hold a writable reference SHOULD re-persist the value through
// encryptString() on the next update so the legacy path naturally
// shrinks. Throws if neither shape matches.
export function detectAndDecrypt(value: unknown, secret: string): string {
  if (isEncryptedField(value)) {
    return decryptField(value, secret)
  }
  if (typeof value === 'string' && value.length > 0) {
    // Legacy: Base64 of the plaintext.
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8')
      if (decoded.length === 0) throw new Error('empty decode')
      return decoded
    } catch (err) {
      const cause = err instanceof Error ? `: ${err.message}` : ''
      throw new Error(`detectAndDecrypt: legacy Base64 decode failed${cause}`)
    }
  }
  throw new Error('detectAndDecrypt: value is neither v1 EncryptedField nor legacy string')
}

// Test-only: clear the derived-key cache. Used in tests that swap the
// secret between runs to avoid the module-level cache returning a stale
// key. Not exported via index.ts to keep the production surface minimal.
export function _resetKeyCacheForTests(): void {
  cachedKey = null
  cachedKeySource = null
}
