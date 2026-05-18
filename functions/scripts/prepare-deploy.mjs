#!/usr/bin/env node
// Materializes functions/deploy/ — a self-contained directory uploaded by
// firebase deploy. Strategy: emit only what Cloud Build needs (bundle.js +
// a workspace-free package.json + .env), so npm install on Cloud Build
// never sees the workspace:* protocol.

import { mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
// propagate it to the bundle. Validated against Firebase Functions v2 +
// Cloud Run env-var semantics (Firebase developer-knowledge MCP + Cloud Run
// docs, 2026-05-18).
const envFile = resolve(functionsDir, '.env')
if (existsSync(envFile)) {
  const envContent = readFileSync(envFile, 'utf8')

  const configPath = resolve(functionsDir, 'src/config/index.ts')
  const secretNames = new Set()
  if (existsSync(configPath)) {
    const configSrc = readFileSync(configPath, 'utf8')
    const re = /defineSecret\(\s*['"]([A-Z0-9_]+)['"]\s*\)/g
    let m
    while ((m = re.exec(configSrc)) !== null) {
      secretNames.add(m[1])
    }
  }

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

  writeFileSync(resolve(deployDir, '.env'), kept.join('\n'))
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
