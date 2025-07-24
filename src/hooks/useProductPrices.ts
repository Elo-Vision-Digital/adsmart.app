import { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
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
  refetch: () => Promise<void>
  getPriceByCategory: (category: 'google' | 'meta', type: 'lancamento' | 'negocio_local') => ProductPrice | undefined
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
      price: 10.00,
      category: 'google',
      type: 'lancamento',
      isActive: true
    },
    {
      id: 'meta_lancamento',
      name: 'Dashboard Meta Ads - Lançamento',
      description: 'Dashboard para campanhas de lançamento no Meta Ads',
      price: 10.00,
      category: 'meta',
      type: 'lancamento',
      isActive: true
    },
    {
      id: 'google_negocio_local',
      name: 'Dashboard Google Ads - Negócios Locais',
      description: 'Dashboard para negócios locais no Google Ads',
      price: 5.00,
      category: 'google',
      type: 'negocio_local',
      isActive: true
    },
    {
      id: 'meta_negocio_local',
      name: 'Dashboard Meta Ads - Negócios Locais',
      description: 'Dashboard para negócios locais no Meta Ads',
      price: 5.00,
      category: 'meta',
      type: 'negocio_local',
      isActive: true
    }
  ]

  // Buscar preços via Cloud Function
  const fetchPrices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const getPublicProductPrices = httpsCallable(functions, 'getPublicProductPrices')
      const result = await getPublicProductPrices()
      
      if (result.data && (result.data as any).success) {
        const pricesData = (result.data as any).prices
        setPrices(pricesData)
        console.log('✅ Preços carregados:', pricesData.length)
      } else {
        throw new Error('Falha ao carregar preços')
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar preços:', err)
      setError('Erro ao carregar preços. Usando valores padrão.')
      // Usar preços padrão em caso de erro
      setPrices(DEFAULT_PRICES)
    } finally {
      setLoading(false)
    }
  }

  // Buscar preços quando o componente montar
  useEffect(() => {
    fetchPrices()
    
    // Recarregar preços a cada 30 segundos para pegar atualizações
    const interval = setInterval(() => {
      fetchPrices()
    }, 30000) // 30 segundos
    
    return () => clearInterval(interval)
  }, [])

  // Função auxiliar para buscar preço específico
  const getPriceByCategory = (category: 'google' | 'meta', type: 'lancamento' | 'negocio_local') => {
    return prices.find(p => p.category === category && p.type === type)
  }

  // Função para recarregar preços manualmente
  const refetch = async () => {
    await fetchPrices()
  }

  return {
    prices,
    loading,
    error,
    refetch,
    getPriceByCategory
  }
}