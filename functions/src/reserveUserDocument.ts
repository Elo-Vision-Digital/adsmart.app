import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

if (!admin.apps.length) {
  admin.initializeApp()
}

// Strip CPF/CNPJ formatting characters so the dedupe key is stable
// regardless of how the user typed the value.
const normalize = (raw: string) => raw.replace(/\D/g, '')

// CPF: 11 digits, valid check digits.
function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cpf.charAt(i), 10) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== Number.parseInt(cpf.charAt(9), 10)) return false
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cpf.charAt(i), 10) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  return digit === Number.parseInt(cpf.charAt(10), 10)
}

// CNPJ: 14 digits, valid check digits.
function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false

  const calcDigit = (slice: string, weights: number[]) => {
    const sum = slice
      .split('')
      .reduce((acc, ch, i) => acc + Number.parseInt(ch, 10) * weights[i], 0)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const d1 = calcDigit(cnpj.slice(0, 12), firstWeights)
  if (d1 !== Number.parseInt(cnpj.charAt(12), 10)) return false
  const d2 = calcDigit(cnpj.slice(0, 13), secondWeights)
  return d2 === Number.parseInt(cnpj.charAt(13), 10)
}

interface ReserveRequest {
  documentType: 'cpf' | 'cnpj'
  documentNumber: string
}

interface ReserveResponse {
  success: true
  documentNumber: string
  documentType: 'cpf' | 'cnpj'
}

// Atomically reserves the document for the caller. The reservation is the
// single source of truth for "is this CPF/CNPJ already taken?" — the
// transaction reads userDocuments/{normalized} and either:
//   - claims it for the caller (writes both userDocuments/{n} and
//     users/{uid}.{documentType,documentNumber}), or
//   - throws already-exists if a different uid already holds it, or
//   - throws failed-precondition if the caller already has a different
//     document on file (immutability).
export const reserveUserDocument = onCall<ReserveRequest, Promise<ReserveResponse>>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }
    const uid = request.auth.uid

    const { documentType, documentNumber } = request.data ?? {}
    if (documentType !== 'cpf' && documentType !== 'cnpj') {
      throw new HttpsError('invalid-argument', 'Tipo de documento inválido')
    }
    if (typeof documentNumber !== 'string' || documentNumber.trim() === '') {
      throw new HttpsError('invalid-argument', 'Documento é obrigatório')
    }

    const normalized = normalize(documentNumber)
    const isValid = documentType === 'cpf' ? isValidCpf(normalized) : isValidCnpj(normalized)
    if (!isValid) {
      throw new HttpsError(
        'invalid-argument',
        documentType === 'cpf' ? 'CPF inválido' : 'CNPJ inválido'
      )
    }

    const db = admin.firestore()
    const docRef = db.collection('userDocuments').doc(normalized)
    const userRef = db.collection('users').doc(uid)

    await db.runTransaction(async (tx) => {
      const [docSnap, userSnap] = await Promise.all([tx.get(docRef), tx.get(userRef)])

      if (docSnap.exists) {
        const owner = docSnap.get('userId')
        if (owner !== uid) {
          throw new HttpsError('already-exists', 'Documento já cadastrado por outro usuário')
        }
        return
      }

      const existingNumber = userSnap.get('documentNumber')
      if (
        existingNumber &&
        typeof existingNumber === 'string' &&
        existingNumber.trim() !== '' &&
        normalize(existingNumber) !== normalized
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Documento já cadastrado para esta conta e não pode ser alterado'
        )
      }

      const existingType = userSnap.get('documentType')
      if (existingType && existingType !== documentType && existingNumber) {
        throw new HttpsError(
          'failed-precondition',
          'Tipo de documento já cadastrado e não pode ser alterado'
        )
      }

      const now = admin.firestore.Timestamp.now()
      tx.set(docRef, { userId: uid, documentType, createdAt: now })
      tx.set(
        userRef,
        { documentType, documentNumber: normalized, updatedAt: now },
        { merge: true }
      )
    })

    return { success: true, documentType, documentNumber: normalized }
  }
)
