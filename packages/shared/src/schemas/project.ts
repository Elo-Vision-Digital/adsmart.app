import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'O nome do projeto é obrigatório').max(100),
  color: z.string(),
  initials: z.string().max(2),
  userId: z.string(), // Opcional se for sempre sub-coleção, mas bom para query group se precisar
  createdAt: zTimestamp(),
  updatedAt: zTimestamp(),
})

export type Project = z.infer<typeof ProjectSchema>

export const ProjectClientUpdateSchema = ProjectSchema.pick({
  name: true,
  color: true,
  initials: true,
}).strict()

export type ProjectClientUpdate = z.infer<typeof ProjectClientUpdateSchema>
