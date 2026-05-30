import { ArrowDown, ArrowUp, FileText, Filter, Loader2, Plus } from 'lucide-react'
import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWallet } from '@/hooks/useWallet'

export function TransactionsPage() {
  const { transactions, loading, formatCurrency, balance } = useWallet()
  const { t } = useLanguage()

  // Filtro de estado local
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')

  // Aplica o filtro
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true
    return tx.type === filter
  })

  // Agregações Mockadas para o painel lateral (pois o banco não provê essas queries otimizadas ainda)
  const mockStats = [
    {
      l: 'Créditos recebidos (mês)',
      v: '+200',
      tone: 'success',
      icon: <ArrowDown size={14} strokeWidth={2.2} />,
    },
    {
      l: 'Créditos gastos (mês)',
      v: '−8',
      tone: 'neutral',
      icon: <ArrowUp size={14} strokeWidth={2.2} />,
    },
    {
      l: 'Relatórios gerados',
      v: '6',
      tone: 'neutral',
      icon: <FileText size={14} />,
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--text-3)] font-medium">
            <Loader2 size={16} className="animate-spin" /> Carregando carteira...
          </div>
        </div>
      </MainLayout>
    )
  }

  // Formatador de data preservado da implementação anterior
  const formatDate = (createdAt: any, formatType: 'date' | 'time') => {
    try {
      if (!createdAt) return '—'
      const date =
        createdAt instanceof Date
          ? createdAt
          : typeof createdAt.toDate === 'function'
            ? createdAt.toDate()
            : createdAt.seconds
              ? new Date(createdAt.seconds * 1000)
              : null

      if (!date) return '—'

      if (formatType === 'date') {
        return date.toLocaleString(t('common.locale'), {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      }
      return date.toLocaleString(t('common.locale'), {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  return (
    <MainLayout>
      <div className="w-full px-4 py-8 md:px-8 max-w-[1100px] mx-auto pb-10">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-[36px] font-bold tracking-[-0.025em] leading-[1.05] text-[var(--text)]">
            Créditos
          </h1>
          <p className="text-[15px] text-[var(--text-2)] mt-2">
            1 crédito = R$ 5,00. Use para gerar relatórios — lançamento custa 2 créditos.
          </p>
        </div>

        {/* Top row: balance hero + summary cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-6">
          {/* Balance hero */}
          <div className="p-7 rounded-[22px] bg-[var(--accent)] text-[var(--accent-fg)] relative overflow-hidden flex flex-col justify-between">
            {/* Decorações visuais de fundo */}
            <div className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full border border-current opacity-[0.08] pointer-events-none" />
            <div className="absolute -right-2.5 -top-2.5 w-[130px] h-[130px] rounded-full border border-current opacity-[0.14] pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[12px] font-semibold uppercase tracking-wide opacity-70">
                Créditos disponíveis
              </span>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="text-[60px] font-bold tracking-[-0.03em] leading-none">
                  {balance}
                </span>
                <span className="text-[22px] opacity-65">créditos</span>
              </div>
              <div className="text-[13px] mt-2 opacity-60">
                Equivale a {formatCurrency(balance * 5)} · gera até {Math.floor(balance / 2)}{' '}
                relatórios Lançamento
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-8 relative z-10">
              <button
                type="button"
                className="flex-1 h-11 rounded-xl bg-[var(--accent-fg)] text-[var(--accent)] text-[14px] font-[650] flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Plus size={16} strokeWidth={2.2} /> Comprar créditos
              </button>
              <button
                type="button"
                className="flex-1 h-11 rounded-xl text-[var(--accent-fg)] text-[14px] font-[650] flex items-center justify-center gap-1.5 backdrop-blur-md transition-opacity hover:bg-white/10"
                style={{
                  background: 'color-mix(in srgb, var(--accent-fg) 14%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-fg) 22%, transparent)',
                }}
              >
                Exportar extrato
              </button>
            </div>
          </div>

          {/* Side stats */}
          <div className="grid grid-cols-1 gap-3">
            {mockStats.map((s, i) => (
              <div
                key={i}
                className="p-4 rounded-[14px] bg-[var(--bg-elev)] border border-[var(--border)] flex items-center gap-3.5"
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: s.tone === 'success' ? 'var(--success-bg)' : 'var(--bg-elev-2)',
                    color: s.tone === 'success' ? 'var(--success)' : 'var(--text-2)',
                  }}
                >
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] text-[var(--text-2)]">{s.l}</div>
                  <div className="text-[18px] font-bold tracking-[-0.015em] mt-0.5 text-[var(--text)]">
                    {s.v}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controles: Segmented + Filtro Periodo */}
        <div className="flex items-center justify-between mb-3.5 mt-8">
          <div className="flex p-1 bg-[var(--bg-elev)] border border-[var(--border)] rounded-lg">
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'credit', label: 'Entradas' },
              { id: 'debit', label: 'Saídas' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id as any)}
                type="button"
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2 ${
                  filter === opt.id
                    ? 'bg-[var(--bg)] shadow-sm text-[var(--text)] border border-[var(--border)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elev)] border border-[var(--border)] text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--bg-elev-2)] transition-colors"
          >
            <Filter size={14} /> Filtrar período
          </button>
        </div>

        {/* Transactions list */}
        <div className="rounded-[18px] overflow-hidden bg-[var(--bg-elev)] border border-[var(--border)]">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-3)] mx-auto mb-3">
                <FileText size={20} />
              </div>
              <p className="text-[14px] font-medium text-[var(--text-2)]">
                Nenhuma transação encontrada nesta categoria.
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx, i, arr) => (
              <React.Fragment key={tx.id}>
                <div className="flex items-center gap-4 py-4 px-5 hover:bg-[var(--bg-elev-2)] transition-colors">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: tx.type === 'credit' ? 'var(--success-bg)' : 'var(--bg-elev-2)',
                      color: tx.type === 'credit' ? 'var(--success)' : 'var(--text-2)',
                    }}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDown size={18} strokeWidth={2.2} />
                    ) : (
                      <ArrowUp size={18} strokeWidth={2.2} />
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-[600] text-[var(--text)] truncate">
                      {tx.description}
                    </div>
                    {/* Exibe um fallback refinado se não houver sub-label */}
                    <div className="text-[13px] text-[var(--text-2)] mt-0.5 truncate">
                      {tx.type === 'credit' ? 'Créditos adicionados' : 'Relatório gerado'}
                    </div>
                  </div>

                  {/* Data & Hora */}
                  <div className="text-right min-w-[120px]">
                    <div className="text-[13px] text-[var(--text-2)]">
                      {formatDate(tx.createdAt, 'date')}
                    </div>
                    <div className="text-[13px] text-[var(--text-3)] mt-0.5">
                      {formatDate(tx.createdAt, 'time')}
                    </div>
                  </div>

                  {/* Valor & Status */}
                  <div className="text-right min-w-[140px]">
                    <div
                      className="text-[15px] font-[700]"
                      style={{
                        color: tx.type === 'credit' ? 'var(--success)' : 'var(--text)',
                      }}
                    >
                      {tx.type === 'credit' ? '+' : '−'}
                      {tx.amount} {tx.amount === 1 ? 'crédito' : 'créditos'}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <Badge
                        tone={
                          tx.status === 'completed'
                            ? 'success'
                            : tx.status === 'pending'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {tx.status === 'completed'
                          ? 'Concluída'
                          : tx.status === 'pending'
                            ? 'Processando'
                            : 'Falha'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-[var(--separator)] ml-[76px]" />}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
