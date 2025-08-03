import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// Interface para metadados de backup
interface BackupMetadata {
  id: string
  timestamp: admin.firestore.Timestamp
  collections: string[]
  documentCount: number
  status: 'started' | 'completed' | 'failed'
  error?: string
  completedAt?: admin.firestore.Timestamp
}

// Configuração de backup
const BACKUP_CONFIG = {
  schedule: '0 3 * * *', // Todo dia às 3AM
  retentionDays: 30,
  collections: [
    'users',
    'campaigns',
    'reports',
    'securityLogs',
    'rateLimits'
  ]
}

// Função agendada para backup automático
export const scheduledBackup = onSchedule({
  schedule: BACKUP_CONFIG.schedule,
  timeZone: 'America/Sao_Paulo',
  memory: '1GiB',
  timeoutSeconds: 540
}, async (event) => {
    console.log('🔄 Iniciando backup automático do Firestore...')
    
    const backupId = `backup_${Date.now()}`
    const startTime = admin.firestore.Timestamp.now()
    
    try {
      // Registrar início do backup
      await securityLogger.logEvent(
        SecurityEventType.BACKUP_STARTED,
        'system',
        {
          backupId,
          scheduledTime: new Date().toISOString(),
          collections: BACKUP_CONFIG.collections
        },
        SecuritySeverity.INFO
      )

      // Criar metadados do backup
      const backupMetadata: BackupMetadata = {
        id: backupId,
        timestamp: startTime,
        collections: BACKUP_CONFIG.collections,
        documentCount: 0,
        status: 'started'
      }

      // Salvar metadados
      await admin.firestore()
        .collection('backupMetadata')
        .doc(backupId)
        .set(backupMetadata)

      // Exportar dados para o Cloud Storage
      const bucket = admin.storage().bucket()
      let totalDocuments = 0

      for (const collectionName of BACKUP_CONFIG.collections) {
        try {
          const snapshot = await admin.firestore()
            .collection(collectionName)
            .get()

          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            createTime: doc.createTime,
            updateTime: doc.updateTime
          }))

          totalDocuments += documents.length

          // Salvar no Cloud Storage
          const fileName = `backups/${backupId}/${collectionName}.json`
          const file = bucket.file(fileName)
          
          await file.save(JSON.stringify(documents, null, 2), {
            metadata: {
              contentType: 'application/json',
              metadata: {
                backupId,
                collection: collectionName,
                documentCount: documents.length.toString(),
                timestamp: startTime.toDate().toISOString()
              }
            }
          })

          console.log(`✅ Backup da coleção ${collectionName}: ${documents.length} documentos`)
        } catch (error) {
          console.error(`❌ Erro ao fazer backup da coleção ${collectionName}:`, error)
        }
      }

      // Atualizar metadados com sucesso
      await admin.firestore()
        .collection('backupMetadata')
        .doc(backupId)
        .update({
          documentCount: totalDocuments,
          status: 'completed',
          completedAt: admin.firestore.Timestamp.now()
        })

      // Registrar sucesso
      await securityLogger.logEvent(
        SecurityEventType.BACKUP_COMPLETED,
        'system',
        {
          backupId,
          totalDocuments,
          duration: Date.now() - startTime.toMillis(),
          collections: BACKUP_CONFIG.collections
        },
        SecuritySeverity.INFO
      )

      // Limpar backups antigos
      await cleanOldBackups()

      console.log(`✅ Backup ${backupId} concluído com sucesso!`)
      // Removido o return - scheduled functions devem retornar void

    } catch (error: any) {
      console.error('❌ Erro durante o backup:', error)

      // Atualizar metadados com erro
      await admin.firestore()
        .collection('backupMetadata')
        .doc(backupId)
        .update({
          status: 'failed',
          error: error.message,
          completedAt: admin.firestore.Timestamp.now()
        })

      // Registrar falha
      await securityLogger.logEvent(
        SecurityEventType.BACKUP_FAILED,
        'system',
        {
          backupId,
          error: error.message,
          stack: error.stack
        },
        SecuritySeverity.ERROR
      )

      throw error
    }
  })

// Função para limpar backups antigos
async function cleanOldBackups(): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays)
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate)

  try {
    // Buscar backups antigos
    const oldBackups = await admin.firestore()
      .collection('backupMetadata')
      .where('timestamp', '<', cutoffTimestamp)
      .get()

    const bucket = admin.storage().bucket()
    
    for (const doc of oldBackups.docs) {
      const backup = doc.data() as BackupMetadata
      
      // Deletar arquivos do Cloud Storage
      const [files] = await bucket.getFiles({
        prefix: `backups/${backup.id}/`
      })

      for (const file of files) {
        await file.delete()
        console.log(`🗑️ Arquivo deletado: ${file.name}`)
      }

      // Deletar metadados
      await doc.ref.delete()
      console.log(`🗑️ Backup ${backup.id} removido (mais de ${BACKUP_CONFIG.retentionDays} dias)`)
    }

    if (oldBackups.size > 0) {
      await securityLogger.logEvent(
        SecurityEventType.BACKUP_CLEANUP,
        'system',
        {
          deletedCount: oldBackups.size,
          retentionDays: BACKUP_CONFIG.retentionDays
        },
        SecuritySeverity.INFO
      )
    }
  } catch (error) {
    console.error('Erro ao limpar backups antigos:', error)
  }
}

// Função manual para restaurar backup (apenas admins)
export const restoreBackup = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    )
  }

  // ✅ CORRIGIDO: Lista de emails de administradores
  const adminEmails = [
    'agency.elovisiondigital@gmail.com', // ✅ Seu Gmail atual (Firebase)
    'admin@adsmart.app' // ✅ Email corporativo futuro
  ]
  
  if (!adminEmails.includes(request.auth.token.email || '')) {
    throw new HttpsError(
      'permission-denied',
      'Apenas administradores podem restaurar backups'
    )
  }

  const { backupId, collections } = request.data

  if (!backupId) {
    throw new HttpsError(
      'invalid-argument',
      'ID do backup é obrigatório'
    )
  }

  try {
    console.log(`🔄 Iniciando restauração do backup ${backupId}...`)

    const bucket = admin.storage().bucket()
    const collectionsToRestore = collections || BACKUP_CONFIG.collections
    let totalRestored = 0

    for (const collectionName of collectionsToRestore) {
      try {
        const fileName = `backups/${backupId}/${collectionName}.json`
        const file = bucket.file(fileName)
        
        const [exists] = await file.exists()
        if (!exists) {
          console.warn(`⚠️ Arquivo não encontrado: ${fileName}`)
          continue
        }

        const [contents] = await file.download()
        const documents = JSON.parse(contents.toString())

        // Restaurar documentos
        const batch = admin.firestore().batch()
        let batchCount = 0

        for (const doc of documents) {
          const docRef = admin.firestore()
            .collection(collectionName)
            .doc(doc.id)
          
          batch.set(docRef, doc.data)
          batchCount++

          // Commit a cada 500 documentos (limite do Firestore)
          if (batchCount === 500) {
            await batch.commit()
            totalRestored += batchCount
            batchCount = 0
          }
        }

        // Commit documentos restantes
        if (batchCount > 0) {
          await batch.commit()
          totalRestored += batchCount
        }

        console.log(`✅ Coleção ${collectionName} restaurada: ${documents.length} documentos`)
      } catch (error) {
        console.error(`❌ Erro ao restaurar coleção ${collectionName}:`, error)
      }
    }

    // Registrar restauração
    await securityLogger.logEvent(
      SecurityEventType.BACKUP_RESTORED,
      request.auth.uid,
      {
        backupId,
        collections: collectionsToRestore,
        totalRestored,
        restoredBy: request.auth.token.email
      },
      SecuritySeverity.WARNING
    )

    return {
      success: true,
      backupId,
      totalRestored,
      message: `Backup restaurado com sucesso! ${totalRestored} documentos restaurados.`
    }

  } catch (error: any) {
    console.error('❌ Erro durante a restauração:', error)
    throw new HttpsError(
      'internal',
      `Erro ao restaurar backup: ${error.message}`
    )
  }
})
