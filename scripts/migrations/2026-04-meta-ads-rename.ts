/**
 * One-shot migration: rewrites legacy `reports.type === 'facebook_ads'` to the
 * canonical `'meta_ads'`. Idempotent — the query naturally selects only docs
 * that still need updating, so a re-run finds zero matches.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/sa.json \
 *     bunx tsx scripts/migrations/2026-04-meta-ads-rename.ts \
 *       --project=<projectId> [--dry-run]
 *
 * Credentials: rely on Application Default Credentials. Either set
 * GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON, or run
 * `gcloud auth application-default login` first.
 *
 * Default mode: dry-run (no writes). Pass `--write` (or omit `--dry-run`
 * explicitly with `--no-dry-run`) to actually update documents.
 */

import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

interface CliOptions {
  projectId: string | undefined
  write: boolean
}

function parseArgs(argv: readonly string[]): CliOptions {
  let projectId: string | undefined
  let write = false
  let explicitDryRun = false

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--project=')) {
      projectId = arg.slice('--project='.length)
    } else if (arg === '--dry-run') {
      explicitDryRun = true
    } else if (arg === '--write' || arg === '--no-dry-run') {
      write = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (write && explicitDryRun) {
    throw new Error('Conflicting flags: --write and --dry-run cannot be combined.')
  }

  return {
    projectId: projectId ?? process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT,
    write,
  }
}

async function main(): Promise<void> {
  const { projectId, write } = parseArgs(process.argv)

  initializeApp({
    credential: applicationDefault(),
    projectId,
  })

  const db = getFirestore()
  const reports = db.collection('reports')

  const legacyBefore = await reports.where('type', '==', 'facebook_ads').count().get()
  const legacyCount = legacyBefore.data().count
  const canonicalBefore = await reports.where('type', '==', 'meta_ads').count().get()
  const canonicalCount = canonicalBefore.data().count

  console.log(`[migration] project=${projectId ?? '(from credential)'} mode=${write ? 'WRITE' : 'DRY-RUN'}`)
  console.log(`[migration] before: facebook_ads=${legacyCount}, meta_ads=${canonicalCount}`)

  if (legacyCount === 0) {
    console.log('[migration] nothing to do — already canonical.')
    return
  }

  if (!write) {
    console.log('[migration] DRY-RUN: skipping writes. Pass --write to apply.')
    return
  }

  const snap = await reports.where('type', '==', 'facebook_ads').get()
  const bulkWriter = db.bulkWriter()

  let failed = 0
  bulkWriter.onWriteError((err) => {
    // Default retry policy already runs; we log+abort if final attempt fails.
    if (err.failedAttempts >= 5) {
      failed += 1
      console.error(`[migration] giving up on ${err.documentRef.path}: ${err.message}`)
      return false
    }
    return true
  })

  for (const doc of snap.docs) {
    void bulkWriter.update(doc.ref, {
      type: 'meta_ads',
      _migratedAt: FieldValue.serverTimestamp(),
      _migratedFrom: 'facebook_ads',
    })
  }

  await bulkWriter.close()

  const legacyAfter = await reports.where('type', '==', 'facebook_ads').count().get()
  const canonicalAfter = await reports.where('type', '==', 'meta_ads').count().get()
  console.log(
    `[migration] after:  facebook_ads=${legacyAfter.data().count}, meta_ads=${canonicalAfter.data().count}, failed=${failed}`
  )

  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('[migration] FATAL:', err)
  process.exit(1)
})
