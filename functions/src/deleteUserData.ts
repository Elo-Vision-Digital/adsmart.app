import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

/**
 * Função para deletar todos os dados de um usuário
 * TODO: Implementar lógica completa de deleção
 */
export const deleteUserData = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const userId = request.auth.uid

  try {
    // TODO: Implementar deleção completa de dados
    // Por enquanto, apenas um placeholder
    console.log(`Deletando dados do usuário: ${userId}`)
    
    // Aqui você deve adicionar a lógica para deletar:
    // - Documentos do usuário
    // - Subcoleções
    // - Arquivos do Storage
    // - Tokens OAuth
    // - etc.

    return {
      success: true,
      message: 'Função de deleção ainda não implementada completamente'
    }
  } catch (error: any) {
    console.error('Erro ao deletar dados do usuário:', error)
    throw new HttpsError('internal', 'Erro ao deletar dados do usuário')
  }
})