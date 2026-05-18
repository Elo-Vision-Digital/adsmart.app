import { isAdminUser } from '@adsmart/shared'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { SecurityEventType, SecuritySeverity, securityLogger } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// Interface para configuração de preços
interface ProductPrice {
  id: string
  name: string
  description: string
  price: number
  category: 'google' | 'meta'
  type: 'lancamento' | 'negocio_local'
  isActive: boolean
  updatedAt: admin.firestore.Timestamp
  updatedBy: string
}

// Configuração padrão dos produtos
const DEFAULT_PRICES: Omit<ProductPrice, 'updatedAt' | 'updatedBy'>[] = [
  {
    id: 'google_lancamento',
    name: 'Dashboard Google Ads - Lançamento',
    description: 'Dashboard para campanhas de lançamento no Google Ads',
    price: 10.00,
    category: 'google',
    type: 'lancamento',
    isActive: true
  },
  {
    id: 'meta_lancamento', 
    name: 'Dashboard Meta Ads - Lançamento',
    description: 'Dashboard para campanhas de lançamento no Meta Ads',
    price: 10.00,
    category: 'meta',
    type: 'lancamento',
    isActive: true
  },
  {
    id: 'google_negocio_local',
    name: 'Dashboard Google Ads - Negócios Locais',
    description: 'Dashboard para negócios locais no Google Ads',
    price: 5.00,
    category: 'google',
    type: 'negocio_local',
    isActive: true
  },
  {
    id: 'meta_negocio_local',
    name: 'Dashboard Meta Ads - Negócios Locais', 
    description: 'Dashboard para negócios locais no Meta Ads',
    price: 5.00,
    category: 'meta',
    type: 'negocio_local',
    isActive: true
  }
]

// Função para obter preços dos produtos
export const getProductPrices = functions.https.onCall(async (request) => {
  // ✅ NOVO: Verificar autenticação e admin
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    )
  }

  const userEmail = request.auth.token.email || ''
  const isAdmin = isAdminUser(request.auth.token, userEmail)

  console.log('🔍 DEBUG getProductPrices:')
  console.log('👤 Email do usuário:', userEmail)
  console.log('🔐 É admin:', isAdmin)

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas administradores podem acessar preços'
    )
  }

  try {
    // ✅ CORRIGIDO: Query simplificada sem orderBy problemático
    const snapshot = await admin.firestore()
      .collection('productPrices')
      .get() // Buscar todos os documentos

    if (snapshot.empty) {
      console.log('📦 Nenhum preço encontrado, retornando padrões')
      // Se não há preços configurados, retornar preços padrão
      return { 
        success: true, 
        prices: DEFAULT_PRICES.map(price => ({
          ...price,
          updatedAt: admin.firestore.Timestamp.now(),
          updatedBy: 'system'
        }))
      }
    }

    // ✅ NOVO: Filtrar e ordenar no código (sem índice)
    const allPrices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProductPrice[]

    // Filtrar apenas ativos e ordenar
    const activePrices = allPrices
      .filter(price => price.isActive)
      .sort((a, b) => {
        // Ordenar por categoria primeiro, depois por tipo
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.type.localeCompare(b.type)
      })

    console.log('✅ Preços carregados:', activePrices.length)
    return { success: true, prices: activePrices }

  } catch (error: any) {
    console.error('❌ Erro ao obter preços:', error)
    
    // ✅ FALLBACK: Se der erro na query, retornar dados padrão
    console.log('🔄 Retornando dados padrão devido a erro')
    return { 
      success: true, 
      prices: DEFAULT_PRICES.map(price => ({
        ...price,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: 'system'
      })),
      fallback: true,
      error: error.message
    }
  }
})

// Função para atualizar preços (apenas admins)
export const updateProductPrices = functions.https.onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    )
  }

  // Verificar se é admin
  const userEmail = request.auth.token.email || ''
  if (!isAdminUser(request.auth.token, userEmail)) {
    // Registrar tentativa não autorizada
    await securityLogger.logEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      request.auth.uid,
      {
        action: 'update_product_prices',
        email: userEmail,
        ip: request.rawRequest.ip
      },
      SecuritySeverity.WARNING,
      request.rawRequest
    )

    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas administradores podem alterar preços'
    )
  }

  const { prices } = request.data

  if (!prices || !Array.isArray(prices)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Lista de preços é obrigatória'
    )
  }

  try {
    const batch = admin.firestore().batch()
    const timestamp = admin.firestore.Timestamp.now()

    for (const priceData of prices) {
      // Validar dados
      if (!priceData.id || typeof priceData.price !== 'number' || priceData.price < 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Dados inválidos para produto ${priceData.id || 'desconhecido'}`
        )
      }

      const productPrice: ProductPrice = {
        ...priceData,
        price: Number(priceData.price.toFixed(2)), // Garantir 2 casas decimais
        updatedAt: timestamp,
        updatedBy: userEmail
      }

      const docRef = admin.firestore()
        .collection('productPrices')
        .doc(priceData.id)

      batch.set(docRef, productPrice, { merge: true })
    }

    await batch.commit()

    // Registrar atualização
    await securityLogger.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY, // Usando como log de admin action
      request.auth.uid,
      {
        action: 'product_prices_updated',
        updatedPrices: prices.map(p => ({ id: p.id, price: p.price })),
        email: userEmail
      },
      SecuritySeverity.INFO,
      request.rawRequest
    )

    return {
      success: true,
      message: `${prices.length} preços atualizados com sucesso`,
      updatedAt: timestamp.toDate().toISOString()
    }

  } catch (error: any) {
    console.error('Erro ao atualizar preços:', error)
    throw new functions.https.HttpsError(
      'internal',
      `Erro ao atualizar preços: ${error.message}`
    )
  }
})

// Função para inicializar preços padrão (apenas para setup inicial)
export const initializeDefaultPrices = functions.https.onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    )
  }

  // Verificar se é admin
  const userEmail = request.auth.token.email || ''
  if (!isAdminUser(request.auth.token, userEmail)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas administradores podem inicializar preços'
    )
  }

  try {
    const batch = admin.firestore().batch()
    const timestamp = admin.firestore.Timestamp.now()

    for (const defaultPrice of DEFAULT_PRICES) {
      const productPrice: ProductPrice = {
        ...defaultPrice,
        updatedAt: timestamp,
        updatedBy: userEmail
      }

      const docRef = admin.firestore()
        .collection('productPrices')
        .doc(defaultPrice.id)

      batch.set(docRef, productPrice)
    }

    await batch.commit()

    return {
      success: true,
      message: 'Preços padrão inicializados com sucesso',
      count: DEFAULT_PRICES.length
    }

  } catch (error: any) {
    console.error('Erro ao inicializar preços:', error)
    throw new functions.https.HttpsError(
      'internal',
      `Erro ao inicializar preços: ${error.message}`
    )
  }
})