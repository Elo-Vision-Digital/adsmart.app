import {
  DEFAULT_PRODUCT_PRICES,
  type ProductPrice,
  type ProductPriceCategory,
  type ProductPriceType,
} from '@adsmart/shared'
import { httpsCallable } from 'firebase/functions'
import { useEffect, useState } from 'react'
import { functions } from '@/firebase/config'

// Re-export so existing consumers (TemplateCard, GenerateReportPage) keep
// the same import surface — ADR-016: types flow from @adsmart/shared.
export type { ProductPrice }

interface UseProductPricesReturn {
  prices: ProductPrice[]
  loading: boolean
  error: string | null
  getPriceByCategory: (
    category: ProductPriceCategory,
    type: ProductPriceType
  ) => ProductPrice | undefined
}

// Materialize with a placeholder Timestamp so the type matches without
// reaching into firebase/firestore Timestamp here.
const PLACEHOLDER_TS = { toDate: () => new Date(0) } as unknown as ProductPrice['updatedAt']
const DEFAULT_PRICES: ProductPrice[] = DEFAULT_PRODUCT_PRICES.map((price) => ({
  ...price,
  updatedAt: PLACEHOLDER_TS,
  updatedBy: 'system',
}))

export function useProductPrices(): UseProductPricesReturn {
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const getPriceByCategory = (category: ProductPriceCategory, type: ProductPriceType) => {
    return prices.find((p) => p.category === category && p.type === type)
  }

  return {
    prices,
    loading,
    error,
    getPriceByCategory,
  }
}
