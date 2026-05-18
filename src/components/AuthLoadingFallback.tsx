import { Loader2 } from 'lucide-react'

// Shown during the initial onAuthStateChanged callback resolution. Brief
// (≤200ms in practice) so a minimal centered spinner suffices. Avoids the
// previous "render Provider only when !loading" coupling that hid this
// state implicitly. See docs/Decisions.md ADR-016 §R12.
export function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Carregando" />
    </div>
  )
}
