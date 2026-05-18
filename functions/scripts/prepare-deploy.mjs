#!/usr/bin/env node
// Materializes functions/deploy/ — a self-contained directory uploaded by
// firebase deploy. Strategy: emit only what Cloud Build needs (bundle.js +
// a workspace-free package.json + .env), so npm install on Cloud Build
// never sees the workspace:* protocol.

import { mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ============================================================
// Pure functions (exported for testing — see prepare-deploy.test.mjs)
// ============================================================

/**
 * Extract every defineSecret('NAME') declaration from a config source file.
 * Tolerates single/double quotes and arbitrary whitespace. Returns a Set
 * so callers can do O(1) membership checks.
 *
 * @param {string} configSource - Contents of functions/src/config/index.ts
 * @returns {Set<string>} Secret names found
 */
export function extractSecretNames(configSource) {
  const names = new Set()
  const re = /defineSecret\(\s*['"]([A-Z0-9_]+)['"]\s*\)/g
  let m
  while ((m = re.exec(configSource)) !== null) {
    names.add(m[1])
  }
  return names
}

/**
 * Filter a .env content string, stripping any KEY=VALUE line whose KEY is in
 * the secretNames set. Comments and blank lines are preserved. Returns the
 * filtered content + the list of stripped keys (for logging).
 *
 * The Cloud Run env-var semantics that motivate this filter: a name cannot
 * be both a plain env var AND a secret env var. Firebase deploy fails with
 * HTTP 400 if functions/.env and defineSecret() declare the same name.
 *
 * @param {string} envContent - Raw content of functions/.env
 * @param {Set<string>} secretNames - Names declared via defineSecret()
 * @returns {{ content: string, stripped: string[] }}
 */
export function filterEnv(envContent, secretNames) {
  const kept = []
  const stripped = []
  for (const rawLine of envContent.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line || line.startsWith('#')) {
      kept.push(line)
      continue
    }
    const eq = line.indexOf('=')
    if (eq <= 0) {
      kept.push(line)
      continue
    }
    const key = line.slice(0, eq).trim()
    if (secretNames.has(key)) {
      stripped.push(key)
      continue
    }
    kept.push(line)
  }
  return { content: kept.join('\n'), stripped }
}

// ============================================================
// Main (only runs when invoked as a script, not when imported)
// ============================================================

function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const functionsDir = resolve(__dirname, '..')
  const deployDir = resolve(functionsDir, 'deploy')

  if (existsSync(deployDir)) rmSync(deployDir, { recursive: true, force: true })
  mkdirSync(deployDir, { recursive: true })

  const bundle = resolve(functionsDir, 'lib/bundle.js')
  if (!existsSync(bundle)) {
    console.error('[prepare-deploy] lib/bundle.js missing — did you run "bun run build" first?')
    process.exit(1)
  }
  copyFileSync(bundle, resolve(deployDir, 'index.js'))

  const pkg = JSON.parse(readFileSync(resolve(functionsDir, 'package.json'), 'utf8'))
  const cleanDeps = { ...(pkg.dependencies ?? {}) }
  delete cleanDeps['@adsmart/shared']

  const deployPkg = {
    name: pkg.name,
    private: true,
    version: pkg.version ?? '0.0.0',
    engines: pkg.engines,
    main: 'index.js',
    dependencies: cleanDeps,
  }
  writeFileSync(resolve(deployDir, 'package.json'), JSON.stringify(deployPkg, null, 2) + '\n')

  // Materialize functions/deploy/.env from functions/.env, but FILTER OUT any
  // key that is also declared as a defineSecret in config/index.ts. Cloud Run
  // rejects deploys where the same name appears as both a plain env var and a
  // secret env var. Filtering at the deploy boundary is the defense seam: the
  // source .env can leak a key by accident, but this script will refuse to
  // propagate it to the bundle.
  const envFile = resolve(functionsDir, '.env')
  if (existsSync(envFile)) {
    const envContent = readFileSync(envFile, 'utf8')
    const configPath = resolve(functionsDir, 'src/config/index.ts')
    const configSrc = existsSync(configPath) ? readFileSync(configPath, 'utf8') : ''
    const secretNames = extractSecretNames(configSrc)
    const { content, stripped } = filterEnv(envContent, secretNames)

    writeFileSync(resolve(deployDir, '.env'), content)
    if (stripped.length > 0) {
      console.warn(
        `[prepare-deploy] stripped ${stripped.length} secret-shadow key(s) from .env: ${stripped.join(', ')}`,
      )
      console.warn(
        `[prepare-deploy] these keys are declared via defineSecret() in config/index.ts and must NOT also live in .env (Cloud Run rejects the overlap)`,
      )
    }
  }

  console.log('[prepare-deploy] wrote', deployDir)
}

// Only run main when invoked directly (not when imported by tests).
// fileURLToPath handles URL-encoded chars like spaces (%20) correctly.
const isMain = fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) main()
