// Single source of truth for AdSmart admin identity. Consumed by both the
// client (src/contexts/AuthContext.tsx) and Cloud Functions (priceManager,
// adminWalletManager, getDashboardMetrics). Pre-ADR-016 each consumer had
// its own copy; drift was observed in PR review and was the motivation for
// unifying here. See docs/Decisions.md ADR-016.
//
// The custom claim `admin === true` is the canonical authority. The email
// allowlist is a transition fallback so existing admins are not locked out
// before their custom claims are provisioned. Removal of the fallback is
// deferred to ADR-017 (see docs/SECURITY.md).

export const ADMIN_EMAILS: readonly string[] = [
  'agency.elovisiondigital@gmail.com',
  'admin@adsmart.app',
] as const

export interface IdTokenClaims {
  admin?: boolean
  [key: string]: unknown
}

export function isAdminUser(
  claims: IdTokenClaims | undefined | null,
  email: string | null | undefined
): boolean {
  if (claims?.admin === true) return true
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
