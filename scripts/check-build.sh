#!/bin/bash

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Verificando status do build...${NC}"
echo ""

# Verificar frontend build
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend build OK - dist/ encontrado${NC}"
    echo "   Tamanho: $(du -sh dist | cut -f1)"
    echo "   Arquivos: $(find dist -type f | wc -l)"
else
    echo -e "${RED}❌ Frontend não compilado - dist/ não encontrado${NC}"
fi

echo ""

# Verificar functions build
if [ -d "functions/lib" ]; then
    echo -e "${GREEN}✅ Functions build OK - lib/ encontrado${NC}"
    echo "   Tamanho: $(du -sh functions/lib | cut -f1)"
    echo "   Arquivos: $(find functions/lib -type f | wc -l)"
else
    echo -e "${RED}❌ Functions não compiladas - lib/ não encontrado${NC}"
fi

echo ""

# Verificar se há erros TypeScript
echo -e "${YELLOW}🔍 Verificando erros TypeScript...${NC}"
npm run type-check 2>&1 | grep -E "error TS" && echo -e "${RED}❌ Erros TypeScript encontrados${NC}" || echo -e "${GREEN}✅ Sem erros TypeScript${NC}"
