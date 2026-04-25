import {
  collection,
  type DocumentData,
  onSnapshot,
  orderBy,
  type QueryDocumentSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/firebase/config'
import type { Report } from '@/types'

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return undefined
}

// Docs antigos no Firestore podem ter type === 'facebook_ads'; o schema canônico é 'meta_ads'.
const normalizeType = (raw: unknown): Report['type'] =>
  raw === 'facebook_ads' ? 'meta_ads' : (raw as Report['type'])

const mapReport = (snapshot: QueryDocumentSnapshot<DocumentData>): Report => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    userId: data.userId,
    type: normalizeType(data.type),
    templateId: data.templateId,
    name: data.name,
    status: data.status,
    campaignIds: data.campaignIds,
    allCampaigns: data.allCampaigns ?? false,
    dateRange: data.dateRange ?? { startDate: '', endDate: '' },
    lookerStudioUrl: data.lookerStudioUrl,
    cost: data.cost ?? 0,
    paidAt: toDate(data.paidAt),
    createdAt: toDate(data.createdAt) ?? new Date(0),
    completedAt: toDate(data.completedAt),
    error: data.error,
  }
}

export function useReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setReports([])
      setLoading(false)
      return
    }

    setLoading(true)
    const reportsRef = collection(db, 'reports')
    const q = query(reportsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setReports(snapshot.docs.map(mapReport))
        setLoading(false)
      },
      (err) => {
        console.error('Erro ao carregar relatórios:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  return { reports, loading, error }
}
