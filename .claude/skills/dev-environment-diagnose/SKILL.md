---
name: dev-environment-diagnose
description: Diagnostic procedure for "broken" Firebase behavior on adsmart-web-dev. Use BEFORE reading client/hook code when the user reports CORS errors after login, post-auth flows failing, callables returning 404, or any "it works locally but breaks in dev" symptom. The dev project drifts silently from source because feature-branch work bypasses the autodeploy gate.
---

# Dev environment diagnose — AdSmart

`adsmart-web-dev` is treated as ephemeral and is **not** kept in lockstep with the source tree. Autodeploy (`.github/workflows/deploy.yml`) only fires on push to `develop` or `main`. Long stretches on feature branches let the deployed surface lag source. Drift typically surfaces as Chrome reporting "CORS error" — but the root cause is usually that the callable is undeployed (Cloud Functions returns 404 with no `Access-Control-Allow-Origin` header, which Chrome categorizes as CORS).

## When to invoke

Auto-invoke when the user reports any of these on dev (`adsmart-web-dev`):

- Console error after login or any post-auth flow
- "CORS error" in DevTools network panel
- A callable returning 404 or `INTERNAL` for the first time after schema/code changes
- Behavior diverges from local emulator
- New callable added in source but not visible to client

Do NOT skip these checks. The wrong instinct is to dive into client code; the right instinct is to verify the deployed surface first.

## Diagnostic order

```bash
# 1. List what's actually deployed
bunx firebase functions:list --project adsmart-web-dev

# 2. Compare to source exports
grep -E "^export" functions/src/index.ts | head -30

# 3. If a specific callable is suspect, probe directly
curl -s -o /dev/null -w "%{http_code}\n" \
  https://us-central1-adsmart-web-dev.cloudfunctions.net/<callable_name>
# 404 → undeployed. 401/403 → deployed (auth check failed, which is correct for unauthenticated curl).

# 4. For Firestore-driven failures, verify indexes
bunx firebase firestore:indexes --project adsmart-web-dev
```

Only AFTER all 4 checks pass should you suspect actual client/rules/code issues.

## Reconciliation

Full reconciliation procedure (build, deploy rules+indexes, deploy functions, seed `productPrices`, sanity-check prod parity) lives in [docs/DEPLOYMENT.md → Reconciling dev environment drift](../../docs/DEPLOYMENT.md). Point at that section instead of inventing a new procedure.

Pre-deploy: invoke the `firebase-deploy-recovery` skill for its checklist.

## Production also drifts

The assumption "production doesn't drift because CI deploys on main" can be wrong:

- Functions merged on a non-main branch are not in prod until the next merge-to-main CI run.
- If a function was deleted from source without deploying that deletion, the prod surface still has the stale function.
- When investigating prod-only behavior, run the same `functions:list` diff on `adsmart-web` and compare to source exports.

## Cosmetic-only: dev Identity Platform Console

If `adsmart-web-dev` Identity Platform Console shows a `Function Deleted` reference in `beforeCreate`, it's leftover from a v2 trigger rename. The v2 SDK uses the IdP API path, not the Console UI selection — the actual trigger is correctly wired regardless. To clean the cosmetic display, set the Console dropdown to `None` and save.

## See also

- [`firebase-deploy-recovery`](../firebase-deploy-recovery/SKILL.md) — invoke before any deploy reconciliation
- [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) — reconciliation procedure
- [`docs/Decisions.md`](../../docs/Decisions.md) — ADR-010 (bootstrapUser blocking trigger), ADR-011 (bundle pipeline)
