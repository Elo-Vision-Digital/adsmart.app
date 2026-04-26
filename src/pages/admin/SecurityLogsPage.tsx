import { httpsCallable } from 'firebase/functions'
import { Activity, AlertTriangle, RefreshCw, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'

interface SecurityStats {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  criticalEvents: unknown[]
}

export function SecurityLogsPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const fn = httpsCallable(functions, 'getSecurityStats')
      const result = await fn({ days: 7 })
      const data = result.data as { success?: boolean; stats?: SecurityStats }
      if (data.success && data.stats) {
        setStats(data.stats)
      } else {
        setError(t('admin.messages.loadError'))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.messages.loadError')
      console.error('[admin] failed to load security stats:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // biome-ignore lint/correctness/useExhaustiveDependencies: load reads only setters and stable refs
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          {t('admin.security.title')} ({t('admin.security.lastDays', { days: '7' })})
        </h2>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.security.refresh')}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-100 text-red-800 border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('admin.security.loading')}</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">{t('admin.security.totalEvents')}</h3>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold">{t('admin.security.criticalEvents')}</h3>
                <p className="text-2xl font-bold">{stats.criticalEvents?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-3">{t('admin.security.bySeverity')}</h3>
            <div className="space-y-2">
              {stats.bySeverity &&
                Object.entries(stats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between">
                    <span className="capitalize">{severity}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold mb-3">{t('admin.security.byType')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.byType &&
                Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {type.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="font-bold">{count}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">{t('admin.security.noEvents')}</div>
      )}
    </div>
  )
}
