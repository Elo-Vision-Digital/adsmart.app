import { type Project, ProjectSchema } from '@adsmart/shared'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/firebase/config'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    const projectsRef = collection(db, 'users', user.uid, 'projects')
    const q = query(projectsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectsList: Project[] = []
        snapshot.forEach((docSnap) => {
          const data = docSnap.data({ serverTimestamps: 'estimate' })
          try {
            // Zod validates and transforms the timestamp object
            const project = ProjectSchema.parse({ id: docSnap.id, ...data })
            projectsList.push(project)
          } catch (err) {
            console.error(`Invalid project data for ${docSnap.id}:`, err)
          }
        })
        setProjects(projectsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching projects:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const createProject = async (projectData: Pick<Project, 'name' | 'initials' | 'color'>) => {
    if (!user) throw new Error('User must be logged in to create a project')
    const newProjectRef = doc(collection(db, 'users', user.uid, 'projects'))

    await setDoc(newProjectRef, {
      ...projectData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return newProjectRef.id
  }

  return { projects, loading, createProject }
}
