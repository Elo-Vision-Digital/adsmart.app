import { DASHBOARD_METRICS_MAX_RANGE_DAYS } from '@adsmart/shared'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import type { DateRange as DPDateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  type DateRange,
  type DateRangePreset,
  getDateRangeFromPreset,
} from './getDateRangeFromPreset'

const PRESETS: DateRangePreset[] = ['today', '7d', '30d', '60d', '90d', '180d', '365d']

interface Props {
  value: DateRange | null
  onChange: (range: DateRange) => void
}

export function DateRangeFilter({ value, onChange }: Props) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<DateRangePreset | 'custom' | null>(null)
  const [customRange, setCustomRange] = useState<DPDateRange | undefined>(undefined)
  const [customError, setCustomError] = useState<string | null>(null)

  const onPreset = (preset: DateRangePreset) => {
    setActivePreset(preset)
    onChange(getDateRangeFromPreset(preset))
  }

  const submitCustom = () => {
    setCustomError(null)
    const from = customRange?.from
    const to = customRange?.to
    if (!from || !to) return
    if (to.getTime() < from.getTime()) {
      setCustomError(t('admin.dashboard.errors.invalidRange'))
      return
    }
    const days = (to.getTime() - from.getTime()) / 86_400_000
    if (days > DASHBOARD_METRICS_MAX_RANGE_DAYS) {
      setCustomError(t('admin.dashboard.errors.rangeTooLong'))
      return
    }
    const start = new Date(from)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setUTCHours(23, 59, 59, 999)
    setActivePreset('custom')
    onChange({ startDate: start.toISOString(), endDate: end.toISOString() })
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p}
          variant={activePreset === p ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPreset(p)}
        >
          {t(`admin.dashboard.ranges.${p}`)}
        </Button>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={activePreset === 'custom' ? 'default' : 'outline'} size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t('admin.dashboard.ranges.custom')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>{t('admin.dashboard.ranges.custom')}</DialogTitle>
          </DialogHeader>
          <Calendar mode="range" selected={customRange} onSelect={(r) => setCustomRange(r)} />
          {customError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{customError}</p>
          ) : null}
          <DialogFooter>
            <Button onClick={submitCustom} disabled={!customRange?.from || !customRange?.to}>
              {t('common.button.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {value ? (
        <span className="text-xs text-muted-foreground ml-2">
          {new Date(value.startDate).toLocaleDateString('pt-BR')} →{' '}
          {new Date(value.endDate).toLocaleDateString('pt-BR')}
        </span>
      ) : null}
    </div>
  )
}
