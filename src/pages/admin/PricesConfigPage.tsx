import type { ProductPrice } from '@adsmart/shared'
import { httpsCallable } from 'firebase/functions'
import { DollarSign, RefreshCw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'

// Firestore Timestamp arrives as `{ seconds, nanoseconds }` over the callable
// wire; the schema's zTimestamp() preprocess only runs on parse, so for UI
// rendering we cast the runtime shape narrowly here.
type SerializedTimestamp = { seconds: number; nanoseconds?: number }

export function PricesConfigPage() {
  const { t } = useLanguage()
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setMessage('')
      const fn = httpsCallable(functions, 'getProductPrices')
      const result = await fn()
      const data = result.data as { success?: boolean; prices?: ProductPrice[] }
      if (data.success && data.prices) {
        setPrices(data.prices)
      }
    } catch (err) {
      console.error('[admin] failed to load prices:', err)
      const msg = err instanceof Error ? err.message : t('admin.messages.loadError')
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // biome-ignore lint/correctness/useExhaustiveDependencies: load reads only setters and stable refs
  }, [])

  const updatePrice = (id: string, newPrice: number) => {
    setPrices((current) => current.map((p) => (p.id === id ? { ...p, price: newPrice } : p)))
  }

  const save = async () => {
    try {
      setSaving(true)
      setMessage('')
      const fn = httpsCallable(functions, 'updateProductPrices')
      const result = await fn({ prices })
      const data = result.data as { success?: boolean }
      if (data.success) {
        setMessage(t('admin.messages.pricesUpdated'))
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('[admin] failed to save prices:', err)
      const msg = err instanceof Error ? err.message : t('admin.messages.loadError')
      setMessage(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          {t('admin.prices.title')}
        </h2>
        <div className="flex gap-2">
          <Button onClick={load} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.prices.reload')}
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? t('admin.prices.saving') : t('admin.prices.save')}
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800 border border-green-200">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('admin.prices.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prices.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t('admin.prices.priceLabel')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t('admin.prices.currency')}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.price}
                    onChange={(e) =>
                      updatePrice(product.id, Number.parseFloat(e.target.value) || 0)
                    }
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  {t('admin.prices.categoryLabel')}:{' '}
                  {t(`admin.prices.category.${product.category}`)}
                </p>
                <p>
                  {t('admin.prices.typeLabel')}:{' '}
                  {t(
                    `admin.prices.type.${product.type === 'negocio_local' ? 'negocioLocal' : 'lancamento'}`
                  )}
                </p>
                {product.updatedAt && (
                  <p>
                    {t('admin.prices.updatedAtLabel')}:{' '}
                    {new Date(
                      (product.updatedAt as unknown as SerializedTimestamp).seconds * 1000
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
