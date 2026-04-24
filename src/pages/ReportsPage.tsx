import { ChevronLeft, ChevronRight, FileText, Filter, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

// Mock data para demonstração - será substituído por dados do Firestore
const mockReports = [
  {
    id: '1',
    name: 'Dashboard Google Ads - Lançamento',
    platform: 'google_ads',
    createdAt: new Date('2025-01-10'),
    accountName: 'Minha Conta',
    status: 'completed',
    campaignCount: 5,
  },
  {
    id: '2',
    name: 'Dashboard Meta Ads - Janeiro',
    platform: 'meta_ads',
    createdAt: new Date('2025-01-08'),
    accountName: 'Conta de Anúncio',
    status: 'completed',
    campaignCount: 3,
  },
  {
    id: '3',
    name: 'Análise de Performance Q1',
    platform: 'google_ads',
    createdAt: new Date('2025-01-05'),
    accountName: 'Conta Principal',
    status: 'completed',
    campaignCount: 8,
  },
  {
    id: '4',
    name: 'Dashboard Meta Ads - Dezembro',
    platform: 'meta_ads',
    createdAt: new Date('2024-12-28'),
    accountName: 'Conta de Anúncio',
    status: 'completed',
    campaignCount: 4,
  },
  {
    id: '5',
    name: 'Relatório Black Friday',
    platform: 'google_ads',
    createdAt: new Date('2024-11-25'),
    accountName: 'Minha Conta',
    status: 'completed',
    campaignCount: 12,
  },
  {
    id: '6',
    name: 'Dashboard Natal 2024',
    platform: 'meta_ads',
    createdAt: new Date('2024-12-20'),
    accountName: 'Conta Secundária',
    status: 'completed',
    campaignCount: 6,
  },
  {
    id: '7',
    name: 'Análise Q4 2024',
    platform: 'google_ads',
    createdAt: new Date('2024-12-15'),
    accountName: 'Conta Principal',
    status: 'completed',
    campaignCount: 10,
  },
  {
    id: '8',
    name: 'Dashboard Meta Ads - Novembro',
    platform: 'meta_ads',
    createdAt: new Date('2024-11-30'),
    accountName: 'Conta de Anúncio',
    status: 'completed',
    campaignCount: 7,
  },
]

// Componente para ícone do Google Ads
const GoogleAdsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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

// Componente para ícone do Meta Ads
const MetaAdsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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
  const [searchReport, setSearchReport] = useState('')
  const [reports] = useState(mockReports)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'google_ads' | 'meta_ads'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent')

  const reportsPerPage = 6

  // Filtrar relatórios
  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        report.name.toLowerCase().includes(searchReport.toLowerCase()) ||
        report.accountName.toLowerCase().includes(searchReport.toLowerCase())
      const matchesPlatform = filterPlatform === 'all' || report.platform === filterPlatform
      return matchesSearch && matchesPlatform
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return b.createdAt.getTime() - a.createdAt.getTime()
      } else {
        return a.createdAt.getTime() - b.createdAt.getTime()
      }
    })

  // Paginação
  const indexOfLastReport = currentPage * reportsPerPage
  const indexOfFirstReport = indexOfLastReport - reportsPerPage
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport)
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage)

  // Reset página quando filtros mudam
  const handleFilterChange = (platform: 'all' | 'google_ads' | 'meta_ads') => {
    setFilterPlatform(platform)
    setCurrentPage(1)
  }

  const handleSortChange = (sort: 'recent' | 'oldest') => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background dark:bg-[#0A0A0A]">
        <div className="w-full overflow-x-hidden">
          <div className="px-4 py-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('reportsPage.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{t('reportsPage.subtitle')}</p>
              </div>

              {/* Card principal */}
              <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                <CardHeader className="px-4 md:px-6">
                  <div className="space-y-4">
                    {/* Título e botão */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <CardTitle className="text-lg md:text-xl">
                          {t('reportsPage.totalReports', { count: filteredReports.length })}
                        </CardTitle>
                      </div>
                      <Button
                        onClick={() => navigate('/templates')}
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('reportsPage.createNewReport')}
                      </Button>
                    </div>

                    {/* Barra de pesquisa e filtros */}
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t('reportsPage.searchPlaceholder')}
                          value={searchReport}
                          onChange={(e) => {
                            setSearchReport(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Filtros */}
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={filterPlatform}
                          onChange={(e) => handleFilterChange(e.target.value as any)}
                          className="flex-1 min-w-[140px] px-3 py-1.5 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary text-sm"
                        >
                          <option value="all">{t('reportsPage.filters.allPlatforms')}</option>
                          <option value="google_ads">Google Ads</option>
                          <option value="meta_ads">Meta Ads</option>
                        </select>

                        <select
                          value={sortBy}
                          onChange={(e) => handleSortChange(e.target.value as any)}
                          className="flex-1 min-w-[140px] px-3 py-1.5 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary text-sm"
                        >
                          <option value="recent">{t('reportsPage.filters.mostRecent')}</option>
                          <option value="oldest">{t('reportsPage.filters.oldest')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 md:px-6">
                  {currentReports.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">{t('reportsPage.noReportsFound')}</p>
                      <p className="text-sm">{t('reportsPage.noReportsHint')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Lista de relatórios */}
                      <div className="space-y-3">
                        {currentReports.map((report) => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg border border-[#EDEDED] dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/report-success?id=${report.id}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                {report.platform === 'google_ads' ? (
                                  <GoogleAdsIcon />
                                ) : (
                                  <MetaAdsIcon />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                  {report.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="truncate">
                                    {report.createdAt.toLocaleDateString(t('common.locale'))}
                                  </span>
                                  <span>•</span>
                                  <span className="truncate">{report.accountName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Paginação */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-6">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-2 py-1 md:px-3 md:py-1 text-sm rounded-lg ${
                                  currentPage === page
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card de estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          Google Ads
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {reports.filter((r) => r.platform === 'google_ads').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                        <GoogleAdsIcon />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          Meta Ads
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {reports.filter((r) => r.platform === 'meta_ads').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                        <MetaAdsIcon />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          {t('reportsPage.stats.thisMonth')}
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {
                            reports.filter((r) => {
                              const now = new Date()
                              return (
                                r.createdAt.getMonth() === now.getMonth() &&
                                r.createdAt.getFullYear() === now.getFullYear()
                              )
                            }).length
                          }
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Filter className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
