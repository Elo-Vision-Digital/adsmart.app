import { httpsCallable } from 'firebase/functions'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { functions } from '@/firebase/config'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const platform = window.location.pathname.includes('google') ? 'google' : 'meta'

  const isProcessing = useRef(false)

  useEffect(() => {
    if (isProcessing.current) return
    isProcessing.current = true

    const handleCallback = async () => {
      if (!code || !state) {
        const channel = new BroadcastChannel('oauth_callback')
        channel.postMessage({
          type: 'OAUTH_ERROR',
          payload: { error: 'Parâmetros de autorização inválidos' },
        })
        channel.close()
        window.close()

        // Fallback
        setTimeout(() => {
          navigate('/integrations', { state: { error: 'Parâmetros de autorização inválidos' } })
        }, 1000)
        return
      }

      // NOVO FLUXO PARA DESENVOLVIMENTO LOCAL
      if (state.startsWith('local_') && window.location.hostname !== 'localhost') {
        const localOrigin = 'http://localhost:5173'
        window.location.href = `${localOrigin}${window.location.pathname}?code=${code}&state=${state}`
        return
      }

      // Usar BroadcastChannel para contornar o problema de window.opener null devido ao COOP
      const channel = new BroadcastChannel('oauth_callback')
      channel.postMessage({
        type: 'OAUTH_CODE_RECEIVED',
        payload: { code, state, platform: platform === 'google' ? 'google_ads' : 'meta_ads' },
      })
      channel.close()

      // Tentar fechar a janela. Se falhar (ex: mobile), usar o fallback.
      window.close()

      // Fallback para mobile ou navegadores que bloqueiam window.close()
      setTimeout(async () => {
        try {
          const functionName =
            platform === 'google' ? 'handleGoogleAdsCallback' : 'handleMetaAdsCallback'

          const handleCallbackFn = httpsCallable<{ code: string; state: string }, any>(
            functions,
            functionName
          )

          const result = await handleCallbackFn({ code, state })

          navigate('/integrations', {
            state: {
              oauthData: result.data,
              platform: platform === 'google' ? 'google_ads' : 'meta_ads',
            },
          })
        } catch (error: any) {
          console.error('Erro no callback OAuth:', error)
          navigate('/integrations', { state: { error: error.message || 'Erro ao conectar conta' } })
        }
      }, 1000)
    }

    // Iniciar processamento imediatamente
    handleCallback()
  }, [code, state, platform, navigate])

  // UI simplificada e mais rápida
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-base font-medium">Processando autorização...</p>
        <p className="text-sm text-gray-500 mt-1">
          Conectando sua conta {platform === 'google' ? 'Google Ads' : 'Meta Ads'}
        </p>
      </div>
    </div>
  )
}
