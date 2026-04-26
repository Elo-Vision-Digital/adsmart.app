import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/firebase/config'
import { zodConverter } from '@/schemas/firestore-converter'
import { ReportSchema } from '@/schemas/report'
import type { Report } from '@/types'

const reportsCollection = collection(db, 'reports').withConverter(
  zodConverter(ReportSchema, 'Report')
)

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
    const q = query(
      reportsCollection,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setReports(snapshot.docs.map((doc) => doc.data()))
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
