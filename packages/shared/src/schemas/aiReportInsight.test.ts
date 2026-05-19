import { describe, expect, it } from 'vitest'
import {
  AIReportInsightSchema,
  AIReportRecommendationSchema,
  AIReportTopMetricSchema,
  InsightImpactSchema,
  InsightSentimentSchema,
} from './aiReportInsight'

describe('InsightSentimentSchema', () => {
  it.each(['positive', 'negative', 'neutral'])('parses %s', (s) => {
    expect(InsightSentimentSchema.safeParse(s).success).toBe(true)
  })

  it('rejects unknown sentiment', () => {
    expect(InsightSentimentSchema.safeParse('mixed').success).toBe(false)
  })
})

describe('InsightImpactSchema', () => {
  it.each(['high', 'medium', 'low'])('parses %s', (s) => {
    expect(InsightImpactSchema.safeParse(s).success).toBe(true)
  })
})

describe('AIReportTopMetricSchema', () => {
  it('parses a minimal metric', () => {
    const m = { key: 'revenue', label: 'Receita', value: 12480 }
    const result = AIReportTopMetricSchema.safeParse(m)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sentiment).toBe('neutral')
  })

  it('parses with delta and sentiment', () => {
    const m = {
      key: 'roas',
      label: 'ROAS',
      value: 6.8,
      deltaPercent: 12.5,
      sentiment: 'positive' as const,
    }
    expect(AIReportTopMetricSchema.safeParse(m).success).toBe(true)
  })

  it('accepts null deltaPercent (sem comparação)', () => {
    const m = { key: 'cpa', label: 'CPA', value: 28, deltaPercent: null }
    expect(AIReportTopMetricSchema.safeParse(m).success).toBe(true)
  })
})

describe('AIReportRecommendationSchema', () => {
  it('parses a recommendation', () => {
    const r = {
      title: 'Aumentar orçamento em Search · Brand',
      rationale: 'ROAS 6.8× indica espaço para escalar 30% sem queda esperada de eficiência.',
      impact: 'high' as const,
    }
    expect(AIReportRecommendationSchema.safeParse(r).success).toBe(true)
  })

  it('defaults impact to medium when missing', () => {
    const r = { title: 'Pausar criativo v3', rationale: 'Saturação detectada após 21d.' }
    const result = AIReportRecommendationSchema.safeParse(r)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.impact).toBe('medium')
  })

  it('rejects empty title', () => {
    const r = { title: '', rationale: 'x' }
    expect(AIReportRecommendationSchema.safeParse(r).success).toBe(false)
  })
})

describe('AIReportInsightSchema', () => {
  const valid = {
    id: 'google_ads',
    summary: 'O período apresenta ROAS de 6,8× com tendência de aceleração na campanha Search · Brand.',
    topMetrics: [
      { key: 'revenue', label: 'Receita', value: 12480, sentiment: 'positive' as const },
    ],
    recommendations: [
      {
        title: 'Aumentar orçamento em Search · Brand',
        rationale: 'ROAS 6.8× indica espaço para escalar.',
        impact: 'high' as const,
      },
    ],
    promptVersion: 'insight-v1.0',
    model: 'claude-sonnet-4-6',
    generatedAt: new Date('2026-05-19T15:00:00Z'),
  }

  it('parses a valid insight', () => {
    expect(AIReportInsightSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects insight without topMetrics', () => {
    const invalid = { ...valid, topMetrics: [] }
    expect(AIReportInsightSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects insight with more than 8 topMetrics', () => {
    const tooMany = {
      ...valid,
      topMetrics: Array.from({ length: 9 }, (_, i) => ({
        key: `m${i}`,
        label: `M${i}`,
        value: i,
      })),
    }
    expect(AIReportInsightSchema.safeParse(tooMany).success).toBe(false)
  })

  it('rejects insight with too short summary (< 20 chars)', () => {
    const invalid = { ...valid, summary: 'curto' }
    expect(AIReportInsightSchema.safeParse(invalid).success).toBe(false)
  })

  it('accepts empty recommendations', () => {
    const empty = { ...valid, recommendations: [] }
    expect(AIReportInsightSchema.safeParse(empty).success).toBe(true)
  })
})
