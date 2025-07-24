import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

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

// ✅ NOVA FUNÇÃO: Buscar preços públicos (não requer admin)
export const getPublicProductPrices = functions.https.onCall(async (request) => {
  try {
    console.log('🔍 Buscando preços públicos...')
    
    // Buscar TODOS os documentos sem filtro (evita problema de índice)
    const snapshot = await admin.firestore()
      .collection('productPrices')
      .get()

    if (snapshot.empty) {
      console.log('📦 Nenhum preço encontrado, retornando padrões')
      // Se não há preços configurados, retornar preços padrão
      return { 
        success: true, 
        prices: DEFAULT_PRICES.map(price => ({
          ...price,
          updatedAt: admin.firestore.Timestamp.now(),
          updatedBy: 'system'
        })),
        source: 'default'
      }
    }

    // Converter documentos em array
    const allPrices: ProductPrice[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      allPrices.push({
        id: doc.id,
        name: data.name || 'Produto sem nome',
        description: data.description || '',
        price: data.price || 0,
        category: data.category || 'google',
        type: data.type || 'lancamento',
        isActive: data.isActive !== false, // Default true se não definido
        updatedAt: data.updatedAt || admin.firestore.Timestamp.now(),
        updatedBy: data.updatedBy || 'system'
      } as ProductPrice)
    })

    // Filtrar apenas os ativos (em memória para evitar índice)
    const activePrices = allPrices.filter(price => price.isActive)

    // Se não houver preços ativos, retornar padrões
    if (activePrices.length === 0) {
      console.log('⚠️ Nenhum preço ativo encontrado, retornando padrões')
      return { 
        success: true, 
        prices: DEFAULT_PRICES.map(price => ({
          ...price,
          updatedAt: admin.firestore.Timestamp.now(),
          updatedBy: 'system'
        })),
        source: 'default'
      }
    }

    // Ordenar por categoria e tipo
    activePrices.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.type.localeCompare(b.type)
    })

    console.log(`✅ ${activePrices.length} preços ativos encontrados de ${allPrices.length} total`)
    
    return { 
      success: true, 
      prices: activePrices,
      source: 'firestore'
    }

  } catch (error: any) {
    console.error('❌ Erro ao buscar preços públicos:', error)
    console.error('Stack:', error.stack)
    
    // Em caso de erro, retornar preços padrão
    return { 
      success: true, 
      prices: DEFAULT_PRICES.map(price => ({
        ...price,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: 'system'
      })),
      source: 'default',
      error: error.message
    }
  }
})