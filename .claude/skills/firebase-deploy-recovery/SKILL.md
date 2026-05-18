---
name: firebase-deploy-recovery
description: Diagnostic + recovery procedures for AdSmart Cloud Functions v2 deploys. Use when a `firebase deploy` fails with secret/env overlap, missing image, missing secret value, or before migrating an env var from `process.env.X` to `defineSecret('X')`. Built from real incidents 2026-05-18.
---

# Firebase deploy recovery — AdSmart

Auto-invoke when any of these surface:

- `firebase deploy` log contains `Secret environment variable overlaps non secret environment variable: X`
- A `gcloud run services update` on a Cloud Functions v2 service fails with `Image 'gcf-artifacts/...:version_N' not found`
- `In non-interactive mode but have no value for the secret: X`
- `Failed to validate secret versions: ... not found or has no versions`
- About to migrate `process.env.X` → `defineSecret('X')` for a function that's already live in a project

Also auto-invoke before any **first** deploy in a session — run the pre-deploy checklist.

---

## Pre-deploy checklist (run before every `firebase deploy`)

```bash
# 1. Rebuild shared schemas (functions imports z.infer from here)
cd packages/shared && bun run build

# 2. Typecheck and rebuild functions — also runs prepare-deploy.mjs
cd functions && bun run typecheck && bun run build

# 3. Inspect the bundle's .env — no secret-shaped keys allowed
cat functions/deploy/.env | grep -iE 'SECRET|TOKEN|KEY|PASSWORD' && echo "❌ leak" || echo "✅ clean"

# 4. Confirm each declared secret is provisioned in the target project
for SECRET in $(grep "defineSecret('" functions/src/config/index.ts | sed -E "s/.*defineSecret\('([^']+)'\).*/\1/"); do
  echo -n "$SECRET: "
  firebase functions:secrets:get "$SECRET" --project "$TARGET" 2>&1 | grep -E "ENABLED|not found"
done
```

If step 3 leaks any secret-shaped key → fix `functions/.env` AND verify `prepare-deploy.mjs` filter still works.

If step 4 reports "not found" → provision via `firebase functions:secrets:set X --project $TARGET` BEFORE any deploy.

---

## Recovery: "Secret environment variable overlaps non secret environment variable"

**What happened:** A function previously deployed with `X` as a plain env var (loaded from `functions/.env`) is now being deployed with `defineSecret('X')`. Cloud Run forbids the same name in both `environmentVariables` and `secretEnvironmentVariables`. The previously-deployed revision still has the name as a plain env var; the new deploy tries to add it as a secret env var; conflict.

**Why simple fixes don't work:**

- Cleaning `functions/.env` alone is necessary but not sufficient — the conflict lives in the Cloud Run service spec, not in source.
- `gcloud run services update --remove-env-vars` fails with `Image not found` because Firebase CLI 14+ applies an Artifact Registry cleanup policy that deletes images older than 1 day. `gcloud run update` tries to create a new revision reusing the current image; image is gone; abort.
- `firebase deploy --force` has no such flag.
- `gcloud run services replace` with a YAML: same image-not-found root cause.

**Canonical recovery:**

```bash
firebase functions:delete FUNCTION_NAME --project $TARGET --region us-central1 --force
firebase deploy --only functions:FUNCTION_NAME --project $TARGET
```

Implicit-delete (remove the export from `functions/src/index.ts`, run `firebase deploy` without `--only`) also works per Firebase docs.

---

## Recovery: "Image not found" on Cloud Run update

Same root cause as the overlap trap: Firebase CLI 14+ default cleanup policy deletes images > 1 day old. **`gcloud run services update` is NEVER safe on Firebase-managed functions.** Firebase owns the image lifecycle.

Recovery is identical: `firebase functions:delete` + redeploy.

Do NOT manually edit the Cloud Run service spec in Cloud Console — the next `firebase deploy` overwrites it from source.

---

## Hard rules

| Rule | Incident origin |
|---|---|
| `functions/.env` is read by `prepare-deploy.mjs`. Root `.env` is NOT. Before editing, `grep -n "X" functions/scripts/prepare-deploy.mjs` to confirm source. | Sprint 3 — edited root `.env` twice; bundle still had the leaked token. |
| `functions/.env` is for NON-SECRET keys only. Any `*_SECRET`, `*_TOKEN`, OAuth client secret MUST be in Secret Manager via `defineSecret`. Pre-commit hook blocks `process.env.*_SECRET` in code but does NOT scan `.env` files. | Sprint 3 — `GOOGLE_ADS_DEVELOPER_TOKEN` and `SUITPAY_CLIENT_SECRET` lived in `functions/.env` for months and leaked into the Cloud Run service spec. |
| Before activating `defineSecret('X')`, run `firebase functions:secrets:get X --project $TARGET` for each environment. 404 → provision before deploy. | Sprint 1 declared 2 SuitPay secrets without provisioning in dev. Sprint 3 deploy failed months later with "no value for the secret" — root cause was unrelated to Sprint 3 work. |
| Rebuild before every retry. `bun run build` regenerates `lib/bundle.js` AND runs `prepare-deploy.mjs`. Editing source and re-running `firebase deploy` deploys the stale `functions/deploy/` directory. | Sprint 3 — edited `functions/.env`, retried deploy, same error because previous bundle was reused. |
| `gcloud run services update` is NEVER safe on Firebase-managed functions. | Sprint 3 — `--remove-env-vars` blew up with `Image not found`. |
| Each destructive operation (deploy, `functions:delete`, `secrets:set`) needs fresh plain-text authorization. Previous answers don't carry over to retries after the situation changed. | Sprint 3 — auto-mode blocked a retry because the previous authorization was for a different attempt. |
| `<target>` in operator instructions is a placeholder, never a literal. Always substitute `adsmart-web-dev` or `adsmart-web`. | A user ran `firebase deploy --project <target>` verbatim and got a silent no-op. |

---

## Defense-in-depth applied 2026-05-18

`functions/scripts/prepare-deploy.mjs` filters any `.env` key matching a `defineSecret(...)` declaration in `functions/src/config/index.ts` before writing `functions/deploy/.env`. Even if a credential accidentally lands in `functions/.env`, the script refuses to propagate it to the bundle.

The filter has a regression suite (`functions/scripts/prepare-deploy.test.mjs`, 5 cases). If the filter breaks, deploys can still ship secrets-as-env-vars and re-trigger this whole class of incidents.

---

## See also

- [`docs/Decisions.md`](../../docs/Decisions.md) — ADR-002 (Firebase Secret Manager), ADR-021 (SuitPay removal + prepare-deploy hardening)
- [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) — deploy flow + autodeploy via GitHub Actions
- [`docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md`](../../docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md) — `defineString` migration
