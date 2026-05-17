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

const envFile = resolve(functionsDir, '.env')
if (existsSync(envFile)) copyFileSync(envFile, resolve(deployDir, '.env'))

console.log('[prepare-deploy] wrote', deployDir)
