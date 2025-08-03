#!/bin/bash

# ========================================
# Script de Build, Deploy e Limpeza - Adsmart
# ========================================
# Autor: Sistema Adsmart
# Descrição: Automatiza o processo de build, deploy e limpeza de cache
# ========================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório base do projeto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Função para imprimir com cor
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar dependências
check_dependencies() {
    print_color $BLUE "🔍 Verificando dependências..."
    
    local deps=("node" "npm" "firebase")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command_exists "$dep"; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        print_color $RED "❌ Dependências faltando: ${missing[*]}"
        print_color $YELLOW "Por favor, instale as dependências antes de continuar."
        exit 1
    fi
    
    print_color $GREEN "✅ Todas as dependências encontradas!"
}

# Função para limpar caches
clean_caches() {
    print_color $BLUE "🧹 Limpando caches..."
    
    # Limpar cache do npm
    npm cache clean --force 2>/dev/null || true
    
    # Limpar diretórios de build anteriores
    rm -rf dist/ 2>/dev/null || true
    rm -rf functions/lib/ 2>/dev/null || true
    rm -rf .firebase/ 2>/dev/null || true
    
    # Limpar arquivos temporários
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    # Limpar cache do Vite
    rm -rf node_modules/.vite 2>/dev/null || true
    
    print_color $GREEN "✅ Caches limpos!"
}

# Função para fazer backup do .env
backup_env() {
    print_color $BLUE "💾 Fazendo backup dos arquivos .env..."
    
    # Criar diretório de backup se não existir
    mkdir -p .backups
    
    # Backup com timestamp
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    if [ -f ".env" ]; then
        cp .env ".backups/.env.backup_${timestamp}"
    fi
    
    if [ -f "functions/.env" ]; then
        cp functions/.env ".backups/functions.env.backup_${timestamp}"
    fi
    
    print_color $GREEN "✅ Backup criado em .backups/"
}

# Função para instalar dependências
install_dependencies() {
    print_color $BLUE "📦 Instalando dependências..."
    
    # Frontend
    print_color $YELLOW "   → Instalando dependências do frontend..."
    npm ci --silent || npm install
    
    # Functions
    print_color $YELLOW "   → Instalando dependências das functions..."
    cd functions
    npm ci --silent || npm install
    cd ..
    
    print_color $GREEN "✅ Dependências instaladas!"
}

# Função para fazer build do frontend
build_frontend() {
    print_color $BLUE "🔨 Build do frontend..."
    
    # Verificar TypeScript
    print_color $YELLOW "   → Verificando tipos TypeScript..."
    npm run type-check 2>/dev/null || true
    
    # Build
    print_color $YELLOW "   → Compilando frontend..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_color $RED "❌ Erro no build do frontend!"
        exit 1
    fi
    
    print_color $GREEN "✅ Frontend compilado!"
}

# Função para fazer build das functions
build_functions() {
    print_color $BLUE "🔨 Build das Firebase Functions..."
    
    cd functions
    
    # Limpar build anterior
    npm run clean 2>/dev/null || rm -rf lib/
    
    # Compilar
    print_color $YELLOW "   → Compilando functions..."
    npm run build
    
    if [ ! -d "lib" ]; then
        print_color $RED "❌ Erro no build das functions!"
        exit 1
    fi
    
    cd ..
    
    print_color $GREEN "✅ Functions compiladas!"
}

# Função para validar configurações
validate_config() {
    print_color $BLUE "🔍 Validando configurações..."
    
    # Verificar .env principal
    if [ ! -f ".env" ]; then
        print_color $RED "❌ Arquivo .env não encontrado!"
        exit 1
    fi
    
    # Verificar .env das functions
    if [ ! -f "functions/.env" ]; then
        print_color $RED "❌ Arquivo functions/.env não encontrado!"
        exit 1
    fi
    
    # Verificar variáveis essenciais
    local required_vars=(
        "VITE_FIREBASE_PROJECT_ID"
        "VITE_FIREBASE_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            print_color $RED "❌ Variável ${var} não encontrada no .env!"
            exit 1
        fi
    done
    
    print_color $GREEN "✅ Configurações válidas!"
}

# Função para fazer deploy
deploy_firebase() {
    print_color $BLUE "🚀 Iniciando deploy no Firebase..."
    
    # Verificar se está logado no Firebase
    if ! firebase projects:list >/dev/null 2>&1; then
        print_color $YELLOW "⚠️  Não está logado no Firebase. Fazendo login..."
        firebase login
    fi
    
    # Selecionar projeto
    local project_id=$(grep "VITE_FIREBASE_PROJECT_ID=" .env | cut -d '=' -f2)
    firebase use "$project_id" 2>/dev/null || {
        print_color $YELLOW "⚠️  Selecionando projeto ${project_id}..."
        firebase use --add
    }
    
    # Deploy Functions
    print_color $YELLOW "   → Deploy das Functions..."
    firebase deploy --only functions
    
    # Deploy Hosting
    print_color $YELLOW "   → Deploy do Hosting..."
    firebase deploy --only hosting
    
    # Deploy Rules (se necessário)
    if [ -f "firestore.rules" ]; then
        print_color $YELLOW "   → Deploy das Firestore Rules..."
        firebase deploy --only firestore:rules
    fi
    
    print_color $GREEN "✅ Deploy concluído!"
}

# Função para limpar CDN/Cache do navegador
clear_cdn_cache() {
    print_color $BLUE "🌐 Instruções para limpar cache CDN..."
    
    cat << EOF

Para garantir que todos vejam a versão mais recente:

1. ${YELLOW}Cache do Navegador:${NC}
   - Chrome/Edge: Cmd+Shift+R (Mac) ou Ctrl+Shift+F5 (Windows)
   - Firefox: Cmd+Shift+R (Mac) ou Ctrl+F5 (Windows)
   - Safari: Cmd+Option+R

2. ${YELLOW}Firebase Hosting Cache:${NC}
   - O cache é automaticamente invalidado no deploy
   - Pode levar até 10 minutos para propagar globalmente

3. ${YELLOW}Service Workers:${NC}
   - Abra o DevTools > Application > Service Workers
   - Clique em "Unregister" se houver algum registrado

EOF
}

# Função para mostrar resumo
show_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_color $GREEN "\n🎉 Deploy concluído com sucesso!"
    print_color $BLUE "\n📊 Resumo:"
    echo "   • Tempo total: ${duration}s"
    echo "   • Frontend: dist/"
    echo "   • Functions: functions/lib/"
    echo "   • URL: https://adsmart.app"
    
    print_color $YELLOW "\n📝 Próximos passos:"
    echo "   1. Teste a aplicação em https://adsmart.app"
    echo "   2. Verifique os logs: firebase functions:log --tail"
    echo "   3. Monitore erros no Firebase Console"
}

# Menu principal
show_menu() {
    print_color $BLUE "\n🚀 ADSMART - Deploy Script"
    echo "=========================="
    echo "1) Deploy Completo (Build + Deploy)"
    echo "2) Apenas Build"
    echo "3) Apenas Deploy"
    echo "4) Limpar Caches"
    echo "5) Deploy Functions apenas"
    echo "6) Deploy Hosting apenas"
    echo "0) Sair"
    echo "=========================="
    read -p "Escolha uma opção: " choice
}

# Função principal
main() {
    start_time=$(date +%s)
    
    # Verificar dependências sempre
    check_dependencies
    
    case $1 in
        --full|--complete|-f)
            # Deploy completo direto
            validate_config
            backup_env
            clean_caches
            install_dependencies
            build_frontend
            build_functions
            deploy_firebase
            clear_cdn_cache
            show_summary
            ;;
        --build|-b)
            # Apenas build
            validate_config
            clean_caches
            install_dependencies
            build_frontend
            build_functions
            print_color $GREEN "✅ Build concluído!"
            ;;
        --deploy|-d)
            # Apenas deploy (assume que já foi feito build)
            validate_config
            deploy_firebase
            clear_cdn_cache
            show_summary
            ;;
        --clean|-c)
            # Apenas limpar
            clean_caches
            ;;
        *)
            # Menu interativo
            while true; do
                show_menu
                
                case $choice in
                    1)
                        validate_config
                        backup_env
                        clean_caches
                        install_dependencies
                        build_frontend
                        build_functions
                        deploy_firebase
                        clear_cdn_cache
                        show_summary
                        break
                        ;;
                    2)
                        validate_config
                        clean_caches
                        install_dependencies
                        build_frontend
                        build_functions
                        print_color $GREEN "✅ Build concluído!"
                        break
                        ;;
                    3)
                        validate_config
                        deploy_firebase
                        clear_cdn_cache
                        show_summary
                        break
                        ;;
                    4)
                        clean_caches
                        break
                        ;;
                    5)
                        validate_config
                        print_color $YELLOW "🚀 Deploy apenas das Functions..."
                        firebase deploy --only functions
                        print_color $GREEN "✅ Functions deployadas!"
                        break
                        ;;
                    6)
                        validate_config
                        print_color $YELLOW "🚀 Deploy apenas do Hosting..."
                        firebase deploy --only hosting
                        print_color $GREEN "✅ Hosting deployado!"
                        break
                        ;;
                    0)
                        print_color $YELLOW "👋 Saindo..."
                        exit 0
                        ;;
                    *)
                        print_color $RED "❌ Opção inválida!"
                        ;;
                esac
            done
            ;;
    esac
}

# Executar script
main "$@"