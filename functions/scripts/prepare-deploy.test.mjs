import { describe, expect, it } from 'vitest'
import { extractSecretNames, filterEnv } from './prepare-deploy.mjs'

describe('extractSecretNames', () => {
  it('finds every defineSecret declaration in config source', () => {
    const source = `
      import { defineSecret } from 'firebase-functions/params'
      export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')
      export const googleAdsDeveloperToken = defineSecret('GOOGLE_ADS_DEVELOPER_TOKEN')
      export const metaAdsAppSecret = defineSecret('META_ADS_APP_SECRET')
      export const encryptionKey = defineSecret('ENCRYPTION_KEY')
    `
    const names = extractSecretNames(source)
    expect([...names].sort()).toEqual([
      'ENCRYPTION_KEY',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'META_ADS_APP_SECRET',
    ])
  })

  it('tolerates single quotes, double quotes, and whitespace variants', () => {
    const source = `
      defineSecret("DOUBLE_QUOTED")
      defineSecret(  'WITH_SPACES'  )
      defineSecret('SINGLE_QUOTED')
    `
    const names = extractSecretNames(source)
    expect(names.has('DOUBLE_QUOTED')).toBe(true)
    expect(names.has('WITH_SPACES')).toBe(true)
    expect(names.has('SINGLE_QUOTED')).toBe(true)
  })

  it('ignores defineString (only defineSecret matches)', () => {
    const source = `
      defineString('GOOGLE_ADS_CLIENT_ID', { default: 'x' })
      defineSecret('GOOGLE_ADS_CLIENT_SECRET')
    `
    const names = extractSecretNames(source)
    expect(names.has('GOOGLE_ADS_CLIENT_SECRET')).toBe(true)
    expect(names.has('GOOGLE_ADS_CLIENT_ID')).toBe(false)
  })

  it('returns empty set when no defineSecret calls present', () => {
    expect(extractSecretNames('').size).toBe(0)
    expect(extractSecretNames('// just a comment').size).toBe(0)
  })
})

describe('filterEnv', () => {
  it('strips keys that match secretNames; preserves the rest', () => {
    const envContent = [
      '# Comment line',
      'GOOGLE_ADS_CLIENT_ID=public-client-id',
      'GOOGLE_ADS_CLIENT_SECRET=leaked-secret-value',
      'META_ADS_APP_ID=public-app-id',
      'META_ADS_APP_SECRET=another-leaked-secret',
      '',
      'NODE_ENV=production',
    ].join('\n')

    const secrets = new Set(['GOOGLE_ADS_CLIENT_SECRET', 'META_ADS_APP_SECRET'])
    const { content, stripped } = filterEnv(envContent, secrets)

    expect(stripped.sort()).toEqual(['GOOGLE_ADS_CLIENT_SECRET', 'META_ADS_APP_SECRET'])
    expect(content).toContain('GOOGLE_ADS_CLIENT_ID=public-client-id')
    expect(content).toContain('META_ADS_APP_ID=public-app-id')
    expect(content).toContain('NODE_ENV=production')
    expect(content).toContain('# Comment line')
    expect(content).not.toContain('GOOGLE_ADS_CLIENT_SECRET')
    expect(content).not.toContain('META_ADS_APP_SECRET')
  })

  it('passes through a clean .env unchanged when no secrets match', () => {
    const envContent = 'GOOGLE_ADS_CLIENT_ID=abc\nNODE_ENV=dev\n'
    const { content, stripped } = filterEnv(envContent, new Set(['SOMETHING_ELSE']))
    expect(stripped).toEqual([])
    expect(content).toContain('GOOGLE_ADS_CLIENT_ID=abc')
    expect(content).toContain('NODE_ENV=dev')
  })

  it('integration: extractSecretNames + filterEnv strips ADR-021 trap keys', () => {
    // Synthetic replay of the actual ADR-021 trap that caused the deploy
    // failure in Sprint 3. functions/.env had these three keys leaking
    // alongside the defineSecret declarations in config/index.ts.
    const configSource = `
      export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')
      export const googleAdsDeveloperToken = defineSecret('GOOGLE_ADS_DEVELOPER_TOKEN')
    `
    const envContent = [
      'GOOGLE_ADS_CLIENT_ID=422483165860-npdsq.apps.googleusercontent.com',
      'GOOGLE_ADS_CLIENT_SECRET=should-be-stripped',
      'GOOGLE_ADS_DEVELOPER_TOKEN=also-should-be-stripped',
      'GOOGLE_ADS_REDIRECT_URI=https://adsmart.app/auth/google-ads/callback',
    ].join('\n')

    const secrets = extractSecretNames(configSource)
    const { content, stripped } = filterEnv(envContent, secrets)

    expect(stripped.sort()).toEqual([
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
    ])
    expect(content).toContain('GOOGLE_ADS_CLIENT_ID=')
    expect(content).toContain('GOOGLE_ADS_REDIRECT_URI=')
    expect(content).not.toContain('should-be-stripped')
    expect(content).not.toContain('also-should-be-stripped')
  })
})
