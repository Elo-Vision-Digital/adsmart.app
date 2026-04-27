import type { GetDashboardMetricsOutput } from '@adsmart/shared'
import { Plug } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  data: GetDashboardMetricsOutput['integrations']
}

export function IntegrationsCard({ data }: Props) {
  const { t } = useLanguage()
  const rows = data.byPlatform.map((p) => ({
    name: t(`admin.dashboard.integrations.platforms.${p.platform}`),
    count: p.distinctUserCount,
  }))
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Plug className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">{t('admin.dashboard.integrations.title')}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('admin.dashboard.integrations.empty')}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.name} className="flex justify-between text-sm">
                <span>{r.name}</span>
                <span className="font-semibold">{r.count}</span>
              </li>
            ))}
          </ul>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
