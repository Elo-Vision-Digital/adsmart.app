#!/bin/bash

# Script de Debug para SuitPay - AdSmart
# Este script ajuda a diagnosticar problemas com a integração SuitPay

echo "🔍 Debug SuitPay - AdSmart"
echo "=========================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está na pasta raiz
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script da pasta raiz do projeto${NC}"
    exit 1
fi

echo "📁 Verificando estrutura do projeto..."
echo ""

# Verificar arquivo .env nas functions
if [ -f "functions/.env" ]; then
    echo -e "${GREEN}✅ Arquivo functions/.env encontrado${NC}"
    
    # Verificar se tem as credenciais SuitPay
    if grep -q "SUITPAY_CLIENT_ID" functions/.env; then
        echo -e "${GREEN}✅ SUITPAY_CLIENT_ID configurado${NC}"
        
        # Verificar se não é o placeholder
        if grep -q "SEU_CLIENT_ID_AQUI" functions/.env; then
            echo -e "${RED}❌ SUITPAY_CLIENT_ID ainda com placeholder!${NC}"
            echo -e "${YELLOW}   → Substitua por suas credenciais reais${NC}"
        fi
    else
        echo -e "${RED}❌ SUITPAY_CLIENT_ID não encontrado no .env${NC}"
    fi
    
    if grep -q "SUITPAY_CLIENT_SECRET" functions/.env; then
        echo -e "${GREEN}✅ SUITPAY_CLIENT_SECRET configurado${NC}"
        
        # Verificar se não é o placeholder
        if grep -q "SEU_CLIENT_SECRET_AQUI" functions/.env; then
            echo -e "${RED}❌ SUITPAY_CLIENT_SECRET ainda com placeholder!${NC}"
            echo -e "${YELLOW}   → Substitua por suas credenciais reais${NC}"
        fi
    else
        echo -e "${RED}❌ SUITPAY_CLIENT_SECRET não encontrado no .env${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo functions/.env não encontrado${NC}"
    echo -e "${YELLOW}   → Crie o arquivo com base no .env.example${NC}"
fi

echo ""
echo "🔨 Verificando build das functions..."
echo ""

# Verificar se o diretório lib existe
if [ -d "functions/lib" ]; then
    echo -e "${GREEN}✅ Diretório functions/lib existe${NC}"
    
    # Verificar se tem arquivos compilados
    if [ -f "functions/lib/index.js" ]; then
        echo -e "${GREEN}✅ functions/lib/index.js encontrado${NC}"
    else
        echo -e "${RED}❌ functions/lib/index.js não encontrado${NC}"
        echo -e "${YELLOW}   → Execute: cd functions && npm run build${NC}"
    fi
else
    echo -e "${RED}❌ Diretório functions/lib não existe${NC}"
    echo -e "${YELLOW}   → Execute: cd functions && npm run build${NC}"
fi

echo ""
echo "🔐 Verificando Firebase Secrets..."
echo ""

# Verificar se Firebase CLI está instalado
if command -v firebase &> /dev/null; then
    echo -e "${GREEN}✅ Firebase CLI instalado${NC}"
    
    # Listar secrets configurados
    echo ""
    echo "📝 Secrets configurados:"
    firebase functions:secrets:access SUITPAY_CLIENT_ID 2>/dev/null || echo -e "${YELLOW}   → SUITPAY_CLIENT_ID não configurado como secret${NC}"
    firebase functions:secrets:access SUITPAY_CLIENT_SECRET 2>/dev/null || echo -e "${YELLOW}   → SUITPAY_CLIENT_SECRET não configurado como secret${NC}"
else
    echo -e "${RED}❌ Firebase CLI não instalado${NC}"
fi

echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure as credenciais no arquivo functions/.env"
echo "2. Execute: cd functions && npm run build"
echo "3. Deploy: firebase deploy --only functions:createPixPayment,functions:suitpayWebhook"
echo "4. Monitore os logs: firebase functions:log --only createPixPayment -n 50"
echo ""
echo "🔍 Para debug detalhado, verifique:"
echo "   - Logs do Firebase Functions"
echo "   - Console do navegador (F12)"
echo "   - Status no painel SuitPay"
echo ""
echo "✨ Boa sorte!"