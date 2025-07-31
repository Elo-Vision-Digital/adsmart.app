#!/bin/bash

echo "🚀 Iniciando migração para Firebase Secrets..."

# SuitPay (já deve estar configurado, mas vamos garantir)
echo "📦 Configurando SuitPay secrets..."
firebase functions:secrets:set SUITPAY_CLIENT_ID
# Digite: zennytecnologiagmailcom_1751904729049

firebase functions:secrets:set SUITPAY_CLIENT_SECRET
# Digite: f76b02c253a65976a6006151062c9f420556ac455e5f02cecc0f7bc79ba3ba76

# Google Ads
echo "📦 Configurando Google Ads secrets..."
firebase functions:secrets:set GOOGLE_ADS_CLIENT_SECRET
# Digite: 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

# Meta Ads
echo "📦 Configurando Meta Ads secrets..."
firebase functions:secrets:set META_ADS_APP_SECRET
# Digite: 2f0e01c4fd98450545053e84c90f250a

# Security
echo "🔒 Configurando Security secrets..."
firebase functions:secrets:set ENCRYPTION_KEY
# Digite: 0188d654038fe3bfefbf4678a874f72e97bf8f6395d85d5ac9d540f1bf5f3213

firebase functions:secrets:set RECAPTCHA_SECRET_KEY
# Digite: 6LewF4MrAAAAAAa8HeYzf6zUz84zSc4Z-DXwHGj9

echo "✅ Secrets configurados!"

# Limpar configurações antigas
echo "🧹 Limpando configurações antigas..."
firebase functions:config:unset suitpay
firebase functions:config:unset google_ads.client_secret
firebase functions:config:unset meta_ads.app_secret
firebase functions:config:unset encryption
firebase functions:config:unset recaptcha

echo "✅ Migração concluída!"
echo ""
echo "⚠️  IMPORTANTE: Não esqueça de:"
echo "1. Atualizar o arquivo functions/.env removendo as credenciais sensíveis"
echo "2. Adicionar .env ao .gitignore se ainda não estiver"
echo "3. Fazer commit das mudanças"
echo "4. Fazer deploy das funções"