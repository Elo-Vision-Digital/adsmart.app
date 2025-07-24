// Script para criar usuário de teste para revisão Meta
// Execute com: node scripts/create-test-user.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Firebase Admin
// IMPORTANTE: Você precisa baixar a service account key do Firebase Console
// Firebase Console > Project Settings > Service Accounts > Generate New Private Key
// Salve o arquivo como 'serviceAccountKey.json' na raiz do projeto

let serviceAccount;
try {
  const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountFile);
} catch (error) {
  console.error('❌ Erro: serviceAccountKey.json não encontrado!');
  console.log('\n📝 Para obter este arquivo:');
  console.log('1. Acesse o Firebase Console');
  console.log('2. Vá em Project Settings > Service Accounts');
  console.log('3. Clique em "Generate New Private Key"');
  console.log('4. Salve o arquivo como "serviceAccountKey.json" na raiz do projeto');
  console.log('5. Execute este script novamente\n');
  process.exit(1);
}

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'adsmart-web'
});

const auth = getAuth();
const db = getFirestore();

async function createTestUser() {
  try {
    console.log('🚀 Iniciando criação do usuário de teste...\n');

    // 1. Verificar se o usuário já existe
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail('review.user@adsmart.app');
      console.log('⚠️  Usuário já existe, atualizando...');
      
      // Atualizar senha
      await auth.updateUser(userRecord.uid, {
        password: 'Test!Review2025',
        displayName: 'Meta Review User',
        emailVerified: true
      });
    } catch (error) {
      // Usuário não existe, criar novo
      userRecord = await auth.createUser({
        email: 'review.user@adsmart.app',
        password: 'Test!Review2025',
        displayName: 'Meta Review User',
        emailVerified: true
      });
      console.log('✅ Usuário criado com sucesso');
    }

    console.log('   UID:', userRecord.uid);

    // 2. Criar/atualizar perfil no Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: 'review.user@adsmart.app',
      displayName: 'Meta Review User',
      role: 'reviewer',
      createdAt: FieldValue.serverTimestamp(),
      isTestUser: true
    }, { merge: true });
    console.log('✅ Perfil criado/atualizado no Firestore');

    // 3. Criar/atualizar carteira com créditos
    await db.collection('wallets').doc(userRecord.uid).set({
      userId: userRecord.uid,
      balance: 50000, // R$ 500,00 em centavos
      currency: 'BRL',
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ Carteira criada com R$ 500,00');

    // 4. Adicionar transação de crédito inicial
    await db.collection('transactions').add({
      userId: userRecord.uid,
      type: 'credit',
      amount: 50000,
      description: 'Crédito inicial para teste de revisão Meta',
      status: 'completed',
      createdAt: FieldValue.serverTimestamp()
    });
    console.log('✅ Transação de crédito registrada');

    // 5. Criar contas de anúncios mock
    console.log('\n📊 Criando contas de anúncios mock...');
    
    const mockAccounts = [
      {
        platform: 'meta_ads',
        accountId: 'act_123456789',
        accountName: 'Test Business Account',
        email: 'review.user@adsmart.app',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastSyncAt: FieldValue.serverTimestamp()
      },
      {
        platform: 'google_ads',
        accountId: '123-456-7890',
        accountName: 'Test Google Ads Account',
        email: 'review.user@adsmart.app',
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastSyncAt: FieldValue.serverTimestamp()
      }
    ];

    for (const account of mockAccounts) {
      const docRef = await db.collection('users')
        .doc(userRecord.uid)
        .collection('adAccounts')
        .doc(`${account.platform}_${account.accountId}`)
        .set(account, { merge: true });
      console.log(`✅ Conta ${account.platform} criada`);
    }

    // 6. Criar campanhas mock
    console.log('\n📈 Criando campanhas mock...');
    
    const mockCampaigns = [
      {
        accountId: 'act_123456789',
        platform: 'meta_ads',
        campaignId: 'camp_001',
        campaignName: 'Summer Sale Campaign',
        status: 'active',
        objective: 'CONVERSIONS',
        budget: 10000, // $100.00
        spend: 7500,   // $75.00
        impressions: 125000,
        clicks: 3200,
        lastSyncAt: FieldValue.serverTimestamp()
      },
      {
        accountId: 'act_123456789',
        platform: 'meta_ads',
        campaignId: 'camp_002',
        campaignName: 'Brand Awareness Campaign',
        status: 'paused',
        objective: 'BRAND_AWARENESS',
        budget: 5000,  // $50.00
        spend: 2500,   // $25.00
        impressions: 85000,
        clicks: 1200,
        lastSyncAt: FieldValue.serverTimestamp()
      },
      {
        accountId: 'act_123456789',
        platform: 'meta_ads',
        campaignId: 'camp_003',
        campaignName: 'Holiday Promotion',
        status: 'active',
        objective: 'TRAFFIC',
        budget: 20000, // $200.00
        spend: 18500,  // $185.00
        impressions: 450000,
        clicks: 8900,
        lastSyncAt: FieldValue.serverTimestamp()
      }
    ];

    for (const campaign of mockCampaigns) {
      await db.collection('users')
        .doc(userRecord.uid)
        .collection('campaigns')
        .doc(`${campaign.platform}_${campaign.campaignId}`)
        .set(campaign, { merge: true });
      console.log(`✅ Campanha "${campaign.campaignName}" criada`);
    }

    // 7. Criar páginas mock
    console.log('\n📄 Criando páginas mock...');
    
    const mockPages = [
      {
        pageId: 'page_001',
        pageName: 'Adsmart Official Page',
        followers: 15420,
        likes: 14890,
        engagement: {
          posts: 125,
          comments: 3420,
          shares: 890,
          reactions: 12500
        },
        lastSyncAt: FieldValue.serverTimestamp()
      },
      {
        pageId: 'page_002',
        pageName: 'Adsmart Support',
        followers: 8930,
        likes: 8520,
        engagement: {
          posts: 89,
          comments: 1250,
          shares: 340,
          reactions: 5600
        },
        lastSyncAt: FieldValue.serverTimestamp()
      }
    ];

    for (const page of mockPages) {
      await db.collection('users')
        .doc(userRecord.uid)
        .collection('pages')
        .doc(page.pageId)
        .set(page, { merge: true });
      console.log(`✅ Página "${page.pageName}" criada`);
    }

    // 8. Criar alguns relatórios de exemplo
    console.log('\n📊 Criando relatórios de exemplo...');
    
    const mockReports = [
      {
        userId: userRecord.uid,
        type: 'meta_ads',
        templateId: 'meta_lancamento',
        name: 'Q4 2024 Performance Report',
        status: 'completed',
        campaignIds: ['camp_001', 'camp_003'],
        allCampaigns: false,
        dateRange: {
          startDate: '2024-10-01',
          endDate: '2024-12-31'
        },
        lookerStudioUrl: 'https://lookerstudio.google.com/reporting/sample-report-1',
        cost: 500,
        paidAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp()
      }
    ];

    for (const report of mockReports) {
      await db.collection('reports').add(report);
      console.log(`✅ Relatório "${report.name}" criado`);
    }

    // Resumo final
    console.log('\n✅ ========== CONFIGURAÇÃO COMPLETA ==========\n');
    console.log('📝 Credenciais de teste:');
    console.log('   Email: review.user@adsmart.app');
    console.log('   Senha: Test!Review2025');
    console.log('   UID:', userRecord.uid);
    console.log('\n🎯 Dados criados:');
    console.log('   - 1 usuário com R$ 500,00 de crédito');
    console.log('   - 2 contas de anúncios (Meta e Google)');
    console.log('   - 3 campanhas Meta Ads');
    console.log('   - 2 páginas Facebook');
    console.log('   - 1 relatório de exemplo');
    console.log('\n🌐 URLs para teste:');
    console.log('   Login: https://adsmart-web.web.app/login');
    console.log('   Demo: https://adsmart-web.web.app/meta-review-demo');
    console.log('\n✨ Usuário de teste pronto para revisão Meta!');

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário de teste:', error);
    console.error('Detalhes:', error.message);
  } finally {
    process.exit();
  }
}

// Executar
createTestUser();
