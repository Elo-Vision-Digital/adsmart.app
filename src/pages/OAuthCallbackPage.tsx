import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { oauthService } from '@/services/oauthServices'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const platform = window.location.pathname.includes('google') ? 'google' : 'meta'

  useEffect(() => {
    const handleCallback = async () => {
      if (!code || !state) {
        setError('Parâmetros de autorização inválidos')
        setTimeout(() => navigate('/accounts'), 3000)
        return
      }

      try {
        if (platform === 'google') {
          await oauthService.handleGoogleAdsCallback(code, state)
        } else {
          await oauthService.handleMetaAdsCallback(code, state)
        }
        
        // Sucesso - redirecionar para contas
        navigate('/accounts', { 
          state: { 
            success: true, 
            message: `Conta ${platform === 'google' ? 'Google Ads' : 'Meta Ads'} conectada com sucesso!` 
          } 
        })
      } catch (error: any) {
        console.error('Erro no callback OAuth:', error)
        setError(error.message || 'Erro ao conectar conta')
        setTimeout(() => navigate('/accounts'), 3000)
      }
    }

    handleCallback()
  }, [code, state, platform, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <p className="text-gray-500">Redirecionando...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Processando autorização...</p>
            <p className="text-gray-500 mt-2">
              Conectando sua conta {platform === 'google' ? 'Google Ads' : 'Meta Ads'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}