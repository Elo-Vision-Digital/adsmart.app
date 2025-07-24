import * as functions from 'firebase-functions'
import { securityLogger } from './securityLogger'

// Função para obter estatísticas de segurança (apenas para admins)
export const getSecurityStats = functions.https.onCall(async (request) => {
  // Verificar se o usuário está autenticado
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    )
  }

  // ✅ CORRIGIDO: Lista de emails de administradores
  const adminEmails = [
    'agency.elovisiondigital@gmail.com', // ✅ Seu Gmail atual
    'admin@adsmart.app' // ✅ Email corporativo futuro
  ]

  // ✅ CORRIGIDO: Lógica simplificada de verificação
  const userEmail = request.auth.token.email
  const isAdmin = request.auth.token.admin || adminEmails.includes(userEmail || '')

  console.log('🔍 DEBUG getSecurityStats:')
  console.log('👤 Email do usuário:', userEmail)
  console.log('🔐 Custom claim admin:', request.auth.token.admin)
  console.log('📧 Email na lista admin:', adminEmails.includes(userEmail || ''))
  console.log('✅ É admin final:', isAdmin)
  console.log('🆔 UID:', request.auth.uid)

  if (!isAdmin) {
    console.log('❌ Acesso negado para:', userEmail)
    throw new functions.https.HttpsError(
      'permission-denied',
      'Acesso negado. Apenas administradores podem acessar estas estatísticas.'
    )
  }

  try {
    console.log('✅ Acesso autorizado para:', userEmail)
    const days = request.data?.days || 7
    const stats = await securityLogger.getSecurityStats(days)
    
    return {
      success: true,
      stats,
      period: `${days} dias`,
      generatedAt: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao obter estatísticas de segurança'
    )
  }
})