import { httpsCallable } from 'firebase/functions'
import { useEffect, useState } from 'react'
import { functions } from '@/firebase/config'

export interface ProductPrice {
  id: string
  name: string
  description: string
  price: number
  category: 'google' | 'meta'
  type: 'lancamento' | 'negocio_local'
  isActive: boolean
  updatedAt?: any
  updatedBy?: string
}

interface UseProductPricesReturn {
  prices: ProductPrice[]
  loading: boolean
  error: string | null
  getPriceByCategory: (
    category: 'google' | 'meta',
    type: 'lancamento' | 'negocio_local'
  ) => ProductPrice | undefined
}

export function useProductPrices(): UseProductPricesReturn {
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Definir preços padrão
  const DEFAULT_PRICES: ProductPrice[] = [
    {
      id: 'google_lancamento',
      name: 'Dashboard Google Ads - Lançamento',
      description: 'Dashboard para campanhas de lançamento no Google Ads',
      price: 10.0,
      category: 'google',
      type: 'lancamento',
      isActive: true,
    },
    {
      id: 'meta_lancamento',
      name: 'Dashboard Meta Ads - Lançamento',
      description: 'Dashboard para campanhas de lançamento no Meta Ads',
      price: 10.0,
      category: 'meta',
      type: 'lancamento',
      isActive: true,
    },
    {
      id: 'google_negocio_local',
      name: 'Dashboard Google Ads - Negócios Locais',
      description: 'Dashboard para negócios locais no Google Ads',
      price: 5.0,
      category: 'google',
      type: 'negocio_local',
      isActive: true,
    },
    {
      id: 'meta_negocio_local',
      name: 'Dashboard Meta Ads - Negócios Locais',
      description: 'Dashboard para negócios locais no Meta Ads',
      price: 5.0,
      category: 'meta',
      type: 'negocio_local',
      isActive: true,
    },
  ]

  // Buscar preços quando o componente montar.
  // Padrão "ignore flag" recomendado por React 18 docs (synchronizing-with-effects)
  // para evitar setState em componente desmontado / race conditions sob StrictMode.
  useEffect(() => {
    let ignore = false

    const fetchPrices = async () => {
      try {
        setLoading(true)
        setError(null)

        const getPublicProductPrices = httpsCallable(functions, 'getPublicProductPrices')
        const result = await getPublicProductPrices()

        if (ignore) return

        if (result.data && (result.data as any).success) {
          const pricesData = (result.data as any).prices
          setPrices(pricesData)
        } else {
          throw new Error('Falha ao carregar preços')
        }
      } catch (err) {
        if (ignore) return
        console.error('[useProductPrices] preços em modo degradado — usando DEFAULT_PRICES.', err)
        setError('Erro ao carregar preços. Usando valores padrão.')
        setPrices(DEFAULT_PRICES)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)

    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [])

  // Função auxiliar para buscar preço específico
  const getPriceByCategory = (
    category: 'google' | 'meta',
    type: 'lancamento' | 'negocio_local'
  ) => {
    return prices.find((p) => p.category === category && p.type === type)
  }

  return {
    prices,
    loading,
    error,
    getPriceByCategory,
  }
}
