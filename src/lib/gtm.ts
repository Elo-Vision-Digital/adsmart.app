/**
 * Google Tag Manager bootstrap.
 *
 * Moved out of index.html so the site's CSP (script-src 'self') can
 * forbid arbitrary inline scripts while still loading GTM.
 *
 * Call initGtm() as early as possible in main.tsx (before React render).
 */
export function initGtm(containerId: string): void {
  const w = window as unknown as Record<string, unknown>
  const existing = w.dataLayer as unknown[] | undefined
  const dataLayer: unknown[] = existing ?? []
  w.dataLayer = dataLayer
  dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const firstScript = document.getElementsByTagName('script')[0]
  const gtmScript = document.createElement('script')
  gtmScript.async = true
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`
  firstScript.parentNode?.insertBefore(gtmScript, firstScript)
}
