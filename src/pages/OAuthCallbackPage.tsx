import { httpsCallable } from 'firebase/functions'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { functions } from '@/firebase/config'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const platform = window.location.pathname.includes('google') ? 'google' : 'meta'

  useEffect(() => {
    const handleCallback = async () => {
      if (!code || !state) {
        navigate('/accounts', {
          state: {
            error: 'Parâmetros de autorização inválidos',
          },
        })
        return
      }

      try {
        // Chamar função que processa o OAuth e retorna os dados
        const functionName =
          platform === 'google'
            ? 'handleGoogleAdsCallbackWithSelection'
            : 'handleMetaAdsCallbackWithSelection'

        const handleCallback = httpsCallable<{ code: string; state: string }, any>(
          functions,
          functionName
        )

        const result = await handleCallback({ code, state })

        // Redirecionar para accounts com os dados do OAuth
        navigate('/accounts', {
          state: {
            oauthData: result.data,
            platform: platform === 'google' ? 'google_ads' : 'meta_ads',
          },
        })
      } catch (error: any) {
        console.error('Erro no callback OAuth:', error)
        navigate('/accounts', {
          state: {
            error: error.message || 'Erro ao conectar conta',
          },
        })
      }
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
