#!/bin/bash

# Script para configurar variáveis OAuth no Firebase Functions
# Uso: ./setup-oauth.sh

echo "==================================="
echo "   AdSmart OAuth Setup Script"
echo "==================================="
echo ""

# Função para ler input com valor padrão
read_with_default() {
    local prompt="$1"
    local default="$2"
    local varname="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$varname=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$varname=\$input"
    fi
}

# Verificar se está na pasta functions
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Erro: Este script deve ser executado na pasta 'functions'"
    echo "   Use: cd functions && ./scripts/setup-oauth.sh"
    exit 1
fi

echo "📋 Este script irá configurar as variáveis OAuth para:"
echo "   - Google Ads API"
echo "   - Meta Ads API"
echo "   - Chave de criptografia"
echo ""
echo "⚠️  Certifique-se de ter:"
echo "   1. Credenciais OAuth do Google Cloud Console"
echo "   2. App criado no Facebook Developers"
echo "   3. Firebase CLI instalado e autenticado"
echo ""
read -p "Continuar? (y/n): " continue

if [ "$continue" != "y" ]; then
    echo "Configuração cancelada."
    exit 0
fi

echo ""
echo "=== Configuração Google Ads OAuth ==="
echo ""

read_with_default "Google Client ID" "" GOOGLE_CLIENT_ID
read_with_default "Google Client Secret" "" GOOGLE_CLIENT_SECRET
read_with_default "Google Ads Developer Token" "" GOOGLE_DEVELOPER_TOKEN
read_with_default "URL de produção" "https://adsmart.app" PROD_URL

echo ""
echo "=== Configuração Meta Ads OAuth ==="
echo ""

read_with_default "Facebook App ID" "" FACEBOOK_APP_ID
read_with_default "Facebook App Secret" "" FACEBOOK_APP_SECRET

echo ""
echo "=== Gerando chave de criptografia ==="
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Chave gerada: ${ENCRYPTION_KEY:0:10}..."

echo ""
echo "=== Configurando variáveis no Firebase ==="
echo ""

# Configurar Google Ads
echo "Configurando Google Ads..."
firebase functions:config:set google_ads.client_id="$GOOGLE_CLIENT_ID"
firebase functions:config:set google_ads.client_secret="$GOOGLE_CLIENT_SECRET"
firebase functions:config:set google_ads.developer_token="$GOOGLE_DEVELOPER_TOKEN"
firebase functions:config:set google_ads.redirect_uri="$PROD_URL/auth/google-ads/callback"
firebase functions:config:set google_ads.redirect_uri_dev="http://localhost:5173/auth/google-ads/callback"

# Configurar Meta Ads
echo ""
echo "Configurando Meta Ads..."
firebase functions:config:set meta_ads.app_id="$FACEBOOK_APP_ID"
firebase functions:config:set meta_ads.app_secret="$FACEBOOK_APP_SECRET"
firebase functions:config:set meta_ads.redirect_uri="$PROD_URL/auth/meta-ads/callback"
firebase functions:config:set meta_ads.redirect_uri_dev="http://localhost:5173/auth/meta-ads/callback"

# Configurar criptografia
echo ""
echo "Configurando criptografia..."
firebase functions:config:set encryption.key="$ENCRYPTION_KEY"

echo ""
echo "=== Criando arquivo .runtimeconfig.json para desenvolvimento ==="
firebase functions:config:get > .runtimeconfig.json

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Para desenvolvimento local: npm run serve"
echo "   2. Para deploy: firebase deploy --only functions"
echo ""
echo "🔒 Lembre-se:"
echo "   - Nunca commite o arquivo .runtimeconfig.json"
echo "   - Mantenha as credenciais seguras"
echo "   - Configure as URLs de redirect no Google e Facebook"
echo ""
echo "URLs de Redirect configuradas:"
echo "   Google Ads (Prod): $PROD_URL/auth/google-ads/callback"
echo "   Google Ads (Dev): http://localhost:5173/auth/google-ads/callback"
echo "   Meta Ads (Prod): $PROD_URL/auth/meta-ads/callback"
echo "   Meta Ads (Dev): http://localhost:5173/auth/meta-ads/callback"