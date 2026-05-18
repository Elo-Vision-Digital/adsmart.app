#!/usr/bin/env node
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export function extractSecretNames(configSource) {
  const names = new Set()
  const re = /defineSecret\(\s*['"]([A-Z0-9_]+)['"]\s*\)/g
  let m
  while ((m = re.exec(configSource)) !== null) {
    names.add(m[1])
  }
  return names
}

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
        '[prepare-deploy] these keys are declared via defineSecret() in config/index.ts and must NOT also live in .env (Cloud Run rejects the overlap)',
      )
    }
  }

  console.log('[prepare-deploy] wrote', deployDir)
}

const isMain = fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) main()
