import type { GetDashboardMetricsOutput } from '@adsmart/shared'
import { Users } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  data: GetDashboardMetricsOutput['users']
}

export function UsersCard({ data }: Props) {
  const { t } = useLanguage()
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">{t('admin.dashboard.users.title')}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.users.new')}</p>
          <p className="text-2xl font-bold">{data.newCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.users.active')}</p>
          <p className="text-2xl font-bold">{data.activeCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.users.total')}</p>
          <p className="text-2xl font-bold">{data.totalCount}</p>
        </div>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="users-new" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip />
            <Area
              type="monotone"
              dataKey="newCount"
              stroke="hsl(var(--primary))"
              fill="url(#users-new)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
