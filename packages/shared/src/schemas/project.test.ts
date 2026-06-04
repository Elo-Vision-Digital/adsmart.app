import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { ProjectSchema, ProjectClientUpdateSchema } from './project'

describe('ProjectSchema', () => {
  const validTimestamp = Timestamp.now()
  
  const validProject = {
    id: 'proj-123',
    name: 'Acme · Loja',
    color: 'oklch(0.55 0.02 250)',
    initials: 'AC',
    userId: 'user-123',
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
  }

  it('validates a correct Project', () => {
    const result = ProjectSchema.safeParse(validProject)
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const invalid = { ...validProject, name: '' }
    const result = ProjectSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects initials longer than 2 characters', () => {
    const invalid = { ...validProject, initials: 'ABC' }
    const result = ProjectSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('ProjectClientUpdateSchema', () => {
  it('allows valid partial updates', () => {
    const update = {
      name: 'Novo Nome',
      color: '#FF0000',
      initials: 'NN',
    }
    const result = ProjectClientUpdateSchema.safeParse(update)
    expect(result.success).toBe(true)
  })

  it('rejects unknown fields in strict mode', () => {
    const update = {
      name: 'Novo Nome',
      color: '#FF0000',
      initials: 'NN',
      isAdmin: true,
    }
    const result = ProjectClientUpdateSchema.safeParse(update)
    expect(result.success).toBe(false)
  })
})
