import { type GetDashboardMetricsOutput, GetDashboardMetricsOutputSchema } from '@adsmart/shared'
import { httpsCallable } from 'firebase/functions'
import { BarChart3 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'
import { DashboardSkeleton } from './dashboard/DashboardSkeleton'
import { DateRangeFilter } from './dashboard/DateRangeFilter'
import { type DateRange, getDateRangeFromPreset } from './dashboard/getDateRangeFromPreset'
import { IntegrationsCard } from './dashboard/IntegrationsCard'
import { RevenueCard } from './dashboard/RevenueCard'
import { UsersCard } from './dashboard/UsersCard'

export function AdminDashboardPage() {
  const { t } = useLanguage()
  const [range, setRange] = useState<DateRange>(() => getDateRangeFromPreset('30d'))
  const [data, setData] = useState<GetDashboardMetricsOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async (r: DateRange) => {
    setLoading(true)
    setError(null)
    try {
      const callable = httpsCallable(functions, 'getDashboardMetrics')
      const result = await callable(r)
      const parsed = GetDashboardMetricsOutputSchema.safeParse(result.data)
      if (!parsed.success) throw new Error('invalid_payload')
      setData(parsed.data)
    } catch (err) {
      console.error('[admin/dashboard] failed to load:', err)
      setError('loadFailed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMetrics(range)
  }, [range, fetchMetrics])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        {t('admin.dashboard.title')}
      </h2>
      <DateRangeFilter value={range} onChange={setRange} />
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700 dark:text-red-300">
            {t('admin.dashboard.errors.loadFailed')}
          </span>
          <Button size="sm" onClick={() => void fetchMetrics(range)}>
            {t('admin.dashboard.errors.retry')}
          </Button>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <RevenueCard data={data.revenue} />
          <UsersCard data={data.users} />
          <IntegrationsCard data={data.integrations} />
        </div>
      ) : null}
    </div>
  )
}
