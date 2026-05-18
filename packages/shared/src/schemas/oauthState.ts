import * as z from 'zod'
import { zTimestamp } from '../firestore'

// CSRF state token for OAuth handshakes. Stored at `oauth_states/{stateId}`
// by getXxxAdsAuthUrl callables; consumed and deleted by the corresponding
// callback handler. 10-minute TTL is enforced in code (the callback compares
// `expiresAt` against `new Date()` and throws `deadline-exceeded`).
//
// Reads/writes happen only through Cloud Functions (Admin SDK) — there is
// intentionally no firestore.rules grant for this collection. The shape here
// is for runtime validation inside the handlers, not a client API contract.

export const OAuthPlatformSchema = z.enum(['google_ads', 'meta_ads'])
export type OAuthPlatform = z.infer<typeof OAuthPlatformSchema>

export const OAuthStateSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  platform: OAuthPlatformSchema,
  isLocalEnv: z.boolean(),
  createdAt: zTimestamp(),
  expiresAt: zTimestamp(),
})
export type OAuthState = z.infer<typeof OAuthStateSchema>

// Server-issued one-shot token at `temporary_oauth_tokens/{tokenId}` that
// stashes provider access/refresh tokens between Step 1 (callback returns
// the account list) and Step 2 (user confirms which accounts to connect).
// Contains raw credentials — MUST NEVER be exposed to the client API
// surface; only the opaque `tokenId` flows back. 30-minute TTL.
export const TemporaryOAuthTokenSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  scope: z.string().min(1),
  expiresAt: zTimestamp(),
  createdAt: zTimestamp(),
})
export type TemporaryOAuthToken = z.infer<typeof TemporaryOAuthTokenSchema>
