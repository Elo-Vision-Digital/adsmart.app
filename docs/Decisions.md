# Architecture Decision Records

Retroactive ADRs documenting key decisions made during the AdSmart modernization project.

---

## ADR-001: Keep Firebase, no migration to Next.js/Prisma

**Date:** 2026-04-24
**Status:** Accepted

**Decision:** Maintain the current Firebase stack (Firestore + Cloud Functions + Hosting) rather than migrating to a Next.js + Prisma + PostgreSQL stack.

**Rationale:**
- The project is 80% complete with Firebase. A full migration would reset progress.
- Firebase Auth + Firestore rules provide a coherent security model for the existing use cases.
- Cloud Functions v2 covers all backend needs (OAuth, rate limiting, billing).
- The team (solo developer) would spend more time on migration than on features.

**Trade-offs:**
- Firestore's document model is less flexible than SQL for reporting queries.
- No type-safe ORM (Prisma) — Firestore queries are stringly typed.
- Vendor lock-in to Google/Firebase.

---

## ADR-002: Upgrade all dependencies at once (Big Bang)

**Date:** 2026-04-24
**Status:** Planned (Phase 2)

**Decision:** Bump all major dependencies in a single coordinated effort (React 19, Tailwind 4, Router 7, firebase 11, firebase-admin 13, TS 5.9, motion, zod 4, ESLint 9) rather than incremental individual upgrades.

**Rationale:**
- Incremental upgrades create temporary peer-dependency conflicts (e.g., React 18 + React Router 7).
- One large PR is easier to QA than 7 separate PRs with interdependencies.
- Security baseline (Phase 3) and documentation (Phase 4) are done first, so the upgrade has a safety net.

**Trade-offs:**
- Larger blast radius if something breaks.
- Must do thorough QA after upgrade, especially for Tailwind 4 (visual changes possible).
- Rollback is all-or-nothing rather than per-dependency.

---

## ADR-003: SuitPay → Asaas migration (not in current plan)

**Date:** 2026-04-24
**Status:** Deferred

**Decision:** Do not invest in hardening the SuitPay integration. Replace it with Asaas in a separate project phase.

**Rationale:**
- SuitPay webhook hash validation is optional by design — mandatory enforcement would require protocol changes.
- IP allowlist enforcement would need SuitPay's IP range (not published).
- Investment in a deprecated integration is waste.
- Asaas offers PIX + Boleto and better developer tooling.

**Scope of SuitPay maintenance:**
- Keep it running (no breaking changes).
- Reduce webhook log payload to non-sensitive headers only (done in Phase 3).
- Add `@deprecated` JSDoc markers (done in Phase 3).

---

## ADR-004: Biome replaces ESLint + Prettier in the frontend

**Date:** 2026-04-24
**Status:** Accepted

**Decision:** Use Biome as the single formatter + linter for the frontend, replacing ESLint 8 + Prettier. Functions keep ESLint 8 (→ ESLint 9 in Phase 2).

**Rationale:**
- Biome is 50-100x faster than ESLint + Prettier.
- Single tool reduces config complexity.
- Functions use a Node-specific ESLint config with different conventions; mixing them would complicate the Biome config.

**Trade-offs:**
- Biome rule set differs from ESLint/Prettier — some stylistic differences in output.
- Some ESLint plugins have no Biome equivalent yet.
- Functions remain on ESLint until Phase 2 (ESLint 9 flat config migration).

---

## ADR-005: Secrets via defineSecret (Secret Manager)

**Date:** 2026-04-24
**Status:** Accepted

**Decision:** All Cloud Functions secrets use Firebase Secret Manager via `defineSecret` in `functions/src/config/index.ts`. No `process.env.XXX_SECRET` reads in function code.

**Rationale:**
- Secret Manager integrates with Cloud Functions — secrets are only decrypted for functions that declare them.
- Reduces blast radius: a compromised function can only access its declared secrets.
- Avoids accidentally logging secrets via `process.env` access.

**Migration:** Completed in Phase 3. All OAuth secrets and reCAPTCHA secret moved from `process.env` to `defineSecret`.

---

## ADR-006: Admin access via custom claims + email allowlist fallback

**Date:** 2026-04-24
**Status:** Accepted (transitional)

**Decision:** Check `token.admin === true || ADMIN_EMAILS.includes(email)` for admin access, rather than pure claims or pure allowlist.

**Rationale:**
- Pure claims would lock out the two existing admins until their claims are set in production.
- The allowlist in `AuthContext.tsx` is a transitional safety net.
- New admins should be granted via `admin.auth().setCustomUserClaims(uid, { admin: true })`.

**Exit condition:** Remove `ADMIN_EMAILS` allowlist once all current admins have custom claims set. See `docs/SECURITY.md`.

---

## ADR-007: Documentation before upgrades (Phase ordering)

**Date:** 2026-04-24
**Status:** Accepted

**Decision:** Execute phases in order: Phase 1 (cleanup + tests) → Phase 3 (security) → Phase 4 (docs) → Phase 2 (upgrades).

**Rationale:**
- Security gaps are known — fix them before touching the upgrade blast radius.
- Documentation captures the current behavior contract. After upgrades, docs become the regression oracle.
- The test suite (Phase 1) provides a safety net before both security fixes and upgrades.

---

## ADR-008: i18n via JSON files + custom context

**Date:** (original project decision, pre-modernization)
**Status:** Accepted

**Decision:** Use custom React context with static JSON imports rather than a library like i18next or react-intl.

**Rationale:**
- Zero external dependency.
- Simple `t(key)` API sufficient for the use case.
- JSON files are easy to update and review.

**Trade-offs:**
- No pluralization rules.
- No date/number formatting built-in (use `Intl` directly).
- No lazy loading (all locales bundled, acceptable for 3 small JSON files).
