import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useReports } from '@/hooks/useReports'

// Ícones vetoriais extraídos do protótipo
const GoogleAdsIcon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m57.193 15.502c-7.021-4.054-15.985-1.653-20.039 5.37l-25.162 43.583c-6.494 11.247 3.912 24.878 16.501 21.504 3.785-1.014 6.948-3.442 8.907-6.835l25.162-43.583c4.045-7.005 1.636-15.994-5.369-20.039z"
      fill="#fabc04"
    />
    <path
      d="m88.038 64.455-25.163-43.583c-1.959-3.393-5.123-5.821-8.907-6.835-12.593-3.375-22.991 10.262-16.501 21.504l25.163 43.583c4.053 7.019 13.015 9.425 20.039 5.37 7.004-4.045 9.413-13.034 5.369-20.039z"
      fill="#3c8bd9"
    />
    <path
      d="m38.865 67.993c-2.098-7.831-10.134-12.472-17.966-10.373-12.593 3.374-14.78 20.383-3.538 26.874 11.216 6.475 24.897-3.84 21.504-16.501z"
      fill="#34a852"
    />
  </svg>
)

const MetaAdsIcon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient
        id="meta-gradient-reports"
        x1="5.3"
        x2="506.8"
        y1="255.9"
        y2="255.9"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#0064e0" />
        <stop offset=".1" stopColor="#0075f0" />
        <stop offset=".8" stopColor="#007df6" />
        <stop offset="1" stopColor="#0082fc" />
      </linearGradient>
    </defs>
    <path
      d="m149.4 89.4c-81.6 0-144.1 106.2-144.1 218.5 0 70.3 34 114.7 91 114.7 41 0 70.5-19.3 123-111 0 0 21.9-38.6 36.9-65.2l31.2-52.8c26.5-40.9 48.4-61.3 74.4-61.3 54 0 97.2 79.5 97.2 177.2 0 37.2-12.2 58.8-37.5 58.8-24.2 0-35.8-16-81.8-90l-42.3 36.9c47.9 80.2 74.6 107.4 123 107.4 55.5 0 86.4-45.1 86.4-116.9 0-117.7-63.9-216.5-141.6-216.5-41.1 0-73.3 31-102.4 70.3l-32.3 47.4c-31.9 49-51.3 79.7-51.3 79.7-42.5 66.7-57.2 81.6-80.9 81.6-24.4 0-38.8-21.4-38.8-59.5 0-81.6 40.7-165 89.2-165z"
      fill="url(#meta-gradient-reports)"
    />
  </svg>
)

export function ReportsPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { reports, loading } = useReports()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'google_ads' | 'meta_ads'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'name'>('recent')

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPlatform = filterPlatform === 'all' || report.type === filterPlatform
      return matchesSearch && matchesPlatform
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      const aTime = a.createdAt.getTime()
      const bTime = b.createdAt.getTime()
      return sortBy === 'recent' ? bTime - aTime : aTime - bTime
    })

  const thisMonthCount = reports.filter((r) => {
    const now = new Date()
    return (
      r.createdAt.getMonth() === now.getMonth() && r.createdAt.getFullYear() === now.getFullYear()
    )
  }).length

  const getPlatformIcon = (type: string, size = 16) => {
    if (type === 'google_ads') return <GoogleAdsIcon s={size} />
    if (type === 'meta_ads') return <MetaAdsIcon s={size} />
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge tone="success">
            <Check size={10} strokeWidth={2.8} /> Concluído
          </Badge>
        )
      case 'processing':
        return (
          <Badge tone="warning">
            <RefreshCw size={10} strokeWidth={2.5} className="animate-spin" /> Processando
          </Badge>
        )
      case 'pending':
        return (
          <Badge tone="warning">
            <RefreshCw size={10} strokeWidth={2.5} className="animate-spin" /> Pendente
          </Badge>
        )
      case 'failed':
        return <Badge tone="danger">Falha</Badge>
      default:
        return <Badge tone="neutral">{status}</Badge>
    }
  }

  const formatDateShort = (dateString?: string | null) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  }

  const empty = !loading && filteredReports.length === 0

  return (
    <MainLayout>
      <div className="w-full bg-[var(--bg)] min-h-screen">
        <div className="px-8 py-9 max-w-[1280px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-[36px] font-bold tracking-[-0.025em] leading-[1.05] text-[var(--text)]">
                Meus relatórios
              </h1>
              <p className="mt-2 text-[15px] text-[var(--text-2)]">
                Gerencie e acesse todos os relatórios gerados.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button className="inline-flex items-center gap-2 px-4 h-11 bg-[var(--bg-elev)] border border-[var(--border)] rounded-xl text-[15px] font-semibold text-[var(--text)] hover:bg-[var(--bg-elev-2)] transition-colors">
                <FileText size={15} /> Exportar
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              {
                l: 'Total',
                v: loading ? '...' : reports.length.toString(),
                icon: <FileText size={14} />,
              },
              {
                l: 'Google Ads',
                v: loading
                  ? '...'
                  : reports.filter((r) => r.type === 'google_ads').length.toString(),
                icon: <GoogleAdsIcon s={14} />,
              },
              {
                l: 'Meta Ads',
                v: loading ? '...' : reports.filter((r) => r.type === 'meta_ads').length.toString(),
                icon: <MetaAdsIcon s={14} />,
              },
              {
                l: 'Este mês',
                v: loading ? '...' : thisMonthCount.toString(),
                icon: <Calendar size={14} />,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="p-4 rounded-[14px] bg-[var(--bg-elev)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-1.5 text-[var(--text-2)] mb-2">
                  {s.icon}
                  <span className="text-[13px]">{s.l}</span>
                </div>
                <div className="text-[24px] font-bold tracking-[-0.02em] text-[var(--text)]">
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-2.5 p-3.5 mb-4 items-center bg-[var(--bg-elev)] border border-[var(--border)] rounded-[14px]">
            {/* Search */}
            <div className="relative flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-xl h-11 px-3.5 focus-within:border-[var(--text)] transition-colors">
              <Search size={15} className="text-[var(--text-3)]" />
              <input
                type="text"
                placeholder="Buscar por nome ou conta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 ml-3 bg-transparent border-none outline-none text-[15px] text-[var(--text)] placeholder-[var(--text-3)] min-w-0"
              />
            </div>

            {/* Platform Select */}
            <div className="relative flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-xl h-11 px-3.5 focus-within:border-[var(--text)] transition-colors">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as any)}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-[var(--text)] appearance-none pr-7 cursor-pointer z-10"
              >
                <option value="all">Todas plataformas</option>
                <option value="google_ads">Google Ads</option>
                <option value="meta_ads">Meta Ads</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)]">
                <ChevronDown size={15} strokeWidth={2} />
              </div>
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-xl h-11 px-3.5 focus-within:border-[var(--text)] transition-colors">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-[var(--text)] appearance-none pr-7 cursor-pointer z-10"
              >
                <option value="recent">Mais recentes</option>
                <option value="old">Mais antigos</option>
                <option value="name">Por nome</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)]">
                <ChevronDown size={15} strokeWidth={2} />
              </div>
            </div>

            {/* More Filters */}
            <button className="inline-flex items-center gap-2 px-4 h-11 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[15px] font-semibold text-[var(--text)] hover:bg-[var(--bg-elev-2)] transition-colors">
              <Filter size={14} /> Mais filtros
            </button>
          </div>

          {/* Table or Empty */}
          <div className="bg-[var(--bg-elev)] border border-[var(--border)] rounded-[18px] overflow-hidden">
            {loading ? (
              <div className="py-16 text-center flex flex-col items-center">
                <RefreshCw
                  size={32}
                  className="text-[var(--text-3)] animate-spin mb-4"
                  strokeWidth={2}
                />
                <p className="text-[15px] text-[var(--text-2)]">{t('common.general.loading')}</p>
              </div>
            ) : empty ? (
              <div className="py-[80px] px-6 text-center flex flex-col items-center justify-center">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-[var(--text)] opacity-5 blur-xl rounded-full transition-opacity group-hover:opacity-10 duration-300"></div>
                  <div className="relative w-[72px] h-[72px] rounded-[22px] bg-[var(--bg)] border border-[var(--border)] shadow-[0_2px_12px_rgba(0,0,0,0.03)] inline-flex items-center justify-center text-[var(--text-2)] transition-transform group-hover:scale-105 duration-300">
                    <FileText size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text)] mb-2">
                  Nenhum relatório encontrado
                </h3>
                <p className="text-[15px] text-[var(--text-2)] max-w-[320px] mx-auto leading-relaxed mb-7">
                  Não encontramos dados para a sua busca. Tente ajustar os filtros.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr>
                      {['Relatório', 'Plataforma', 'Período', 'Custo', 'Status', ''].map((h, i) => (
                        <th
                          key={i}
                          className="p-3.5 text-left text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-[0.04em] border-b border-[var(--separator)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report, i) => {
                      // Fallback for period using dateRange or createdAt
                      const start = formatDateShort(report.dateRange?.startDate)
                      const end = formatDateShort(report.dateRange?.endDate)
                      let period = 'Não definido'
                      if (start && end) {
                        period = `${start} — ${end}`
                      } else {
                        // Fallback to month of creation
                        const d = report.createdAt
                        const month = d.toLocaleString('pt-BR', { month: 'long' })
                        period = `Ref: ${month}`
                      }

                      return (
                        <tr
                          key={report.id}
                          className={`hover:bg-[var(--bg-elev-2)] transition-colors cursor-pointer ${i < filteredReports.length - 1 ? 'border-b border-[var(--separator)]' : ''}`}
                          onClick={() => navigate(`/report-success?id=${report.id}`)}
                        >
                          <td className="p-3.5 text-[14px] font-semibold text-[var(--text)]">
                            {report.name}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-2 text-[var(--text-2)]">
                              {report.platforms && report.platforms.length > 0 ? (
                                report.platforms.map((pid) => (
                                  <span
                                    key={pid}
                                    className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-[var(--bg-elev-2)] border border-[var(--border)]"
                                  >
                                    {getPlatformIcon(pid)}
                                  </span>
                                ))
                              ) : (
                                <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-[var(--bg-elev-2)] border border-[var(--border)]">
                                  {getPlatformIcon(report.type)}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3.5 text-[13px] text-[var(--text-2)]">{period}</td>
                          <td className="p-3.5 text-[13px] text-[var(--text-2)]">
                            {report.cost > 0 ? `${report.cost} créd.` : 'Grátis'}
                          </td>
                          <td className="p-3.5">{getStatusBadge(report.status)}</td>
                          <td className="p-3.5 text-right">
                            <button className="w-8 h-8 rounded-lg text-[var(--text-2)] inline-flex items-center justify-center hover:bg-[var(--border)] transition-colors">
                              <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
