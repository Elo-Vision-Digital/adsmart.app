import {
  DEFAULT_PRODUCT_PRICES,
  isAdminUser,
  type ProductPrice,
  ProductPriceSchema,
  UpdateProductPricesInputSchema,
} from '@adsmart/shared'
import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { config } from './config'
import { SecurityEventType, SecuritySeverity, securityLogger } from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

const PRICES_COLLECTION = 'productPrices'

function materializeDefaults(updatedBy: string): ProductPrice[] {
  const now = admin.firestore.Timestamp.now()
  return DEFAULT_PRODUCT_PRICES.map((price) =>
    ProductPriceSchema.parse({ ...price, updatedAt: now, updatedBy }),
  )
}

export const getProductPrices = onCall({ region: config.project.region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const userEmail = request.auth.token.email ?? ''
  if (!isAdminUser(request.auth.token, userEmail)) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem acessar preços')
  }

  const snapshot = await admin.firestore().collection(PRICES_COLLECTION).get()

  if (snapshot.empty) {
    return { success: true, prices: materializeDefaults('system') }
  }

  const prices = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as ProductPrice)
    .filter((price) => price.isActive)
    .sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return a.type.localeCompare(b.type)
    })

  return { success: true, prices }
})

export const updateProductPrices = onCall(
  { region: config.project.region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    const userEmail = request.auth.token.email ?? ''
    if (!isAdminUser(request.auth.token, userEmail)) {
      await securityLogger.logEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        request.auth.uid,
        {
          action: 'update_product_prices',
          email: userEmail,
          ip: request.rawRequest.ip,
        },
        SecuritySeverity.WARNING,
        request.rawRequest,
      )
      throw new HttpsError('permission-denied', 'Apenas administradores podem alterar preços')
    }

    const parsed = UpdateProductPricesInputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError(
        'invalid-argument',
        parsed.error.issues[0]?.message ?? 'Dados inválidos',
      )
    }

    const { prices } = parsed.data
    const batch = admin.firestore().batch()
    const timestamp = admin.firestore.Timestamp.now()

    for (const priceInput of prices) {
      const productPrice = ProductPriceSchema.parse({
        ...priceInput,
        price: Number(priceInput.price.toFixed(2)),
        updatedAt: timestamp,
        updatedBy: userEmail,
      })
      const docRef = admin.firestore().collection(PRICES_COLLECTION).doc(priceInput.id)
      batch.set(docRef, productPrice, { merge: true })
    }

    await batch.commit()

    await securityLogger.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      request.auth.uid,
      {
        action: 'product_prices_updated',
        updatedPrices: prices.map((p) => ({ id: p.id, price: p.price })),
        email: userEmail,
      },
      SecuritySeverity.INFO,
      request.rawRequest,
    )

    return {
      success: true,
      message: `${prices.length} preços atualizados com sucesso`,
      updatedAt: timestamp.toDate().toISOString(),
    }
  },
)

export const initializeDefaultPrices = onCall(
  { region: config.project.region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    const userEmail = request.auth.token.email ?? ''
    if (!isAdminUser(request.auth.token, userEmail)) {
      throw new HttpsError('permission-denied', 'Apenas administradores podem inicializar preços')
    }

    const batch = admin.firestore().batch()
    const timestamp = admin.firestore.Timestamp.now()

    for (const defaultPrice of DEFAULT_PRODUCT_PRICES) {
      const productPrice = ProductPriceSchema.parse({
        ...defaultPrice,
        updatedAt: timestamp,
        updatedBy: userEmail,
      })
      const docRef = admin.firestore().collection(PRICES_COLLECTION).doc(defaultPrice.id)
      batch.set(docRef, productPrice)
    }

    await batch.commit()

    return {
      success: true,
      message: 'Preços padrão inicializados com sucesso',
      count: DEFAULT_PRODUCT_PRICES.length,
    }
  },
)
