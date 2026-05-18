import * as z from 'zod'
import { zTimestamp } from '../firestore'

// Per-user-per-action rate-limit counter at `rateLimits/{userId}_{action}`.
// Writes only via the rateLimiter utility in Cloud Functions (Admin SDK);
// firestore.rules grant read to the owner so a UI could surface its own
// counter, but no production view does so today.
export const RateLimitSchema = z.object({
  id: z.string().min(1),
  attempts: z.number().int().nonnegative(),
  firstAttempt: zTimestamp(),
  lastAttempt: zTimestamp(),
  blocked: z.boolean(),
})
export type RateLimit = z.infer<typeof RateLimitSchema>
