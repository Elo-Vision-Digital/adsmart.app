import { Database, Globe, Lock, Mail, Shield, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:text-blue-700 mb-4">
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Última atualização: Janeiro de 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nosso Compromisso com sua Privacidade
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              A Adsmart ("nós", "nosso" ou "nossa") está comprometida em proteger sua privacidade.
              Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e
              protegemos suas informações quando você usa nosso serviço de automação de relatórios
              para Google Ads e Meta Ads.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Informações que Coletamos
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Informações da Conta
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Nome e email (através do Google OAuth)</li>
                  <li>CPF (para faturamento)</li>
                  <li>Dados da empresa (nome, CNPJ, endereço)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Dados de Plataformas de Anúncios
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>
                    Métricas de campanhas do Google Ads (impressões, cliques, conversões, custos)
                  </li>
                  <li>Dados de campanhas do Meta Ads (alcance, engajamento, gastos)</li>
                  <li>Informações de contas publicitárias conectadas</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Dados de Uso</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Logs de acesso e atividades no sistema</li>
                  <li>Preferências de relatórios e templates</li>
                  <li>Histórico de transações e créditos</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Como Usamos suas Informações
              </h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>Para fornecer e melhorar nossos serviços de relatórios automatizados</li>
              <li>Para acessar e processar dados de suas campanhas publicitárias</li>
              <li>Para gerar relatórios personalizados conforme suas preferências</li>
              <li>Para processar pagamentos e gerenciar sua conta</li>
              <li>Para enviar notificações importantes sobre o serviço</li>
              <li>Para cumprir obrigações legais e regulamentares</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Segurança dos Dados
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas
                informações:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Autenticação segura via OAuth 2.0</li>
                <li>Controles de acesso baseados em funções</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e planos de recuperação</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Compartilhamento de Dados
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais, exceto:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Com seu consentimento explícito</li>
                <li>Para cumprir obrigações legais</li>
                <li>Com processadores de pagamento para transações</li>
                <li>
                  Com Google e Meta através de APIs oficiais para acessar seus dados de campanhas
                </li>
              </ul>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Seus Direitos (LGPD)
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou incorretos</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar o consentimento a qualquer momento</li>
                <li>Solicitar a portabilidade de seus dados</li>
                <li>Ser informado sobre o compartilhamento de dados</li>
              </ul>
              <p className="mt-3">
                Para exercer seus direitos, acesse{' '}
                <Link to="/privacy/delete-data" className="text-primary hover:underline">
                  nossa página de exclusão de dados
                </Link>{' '}
                ou entre em contato conosco.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Retenção de Dados
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir
              obrigações legais. Dados de campanhas são mantidos por até 2 anos para permitir
              análises históricas. Após o cancelamento da conta, seus dados são excluídos em até 90
              dias.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cookies e Tecnologias Similares
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Utilizamos cookies essenciais para autenticação e funcionamento do serviço. Não
              utilizamos cookies de rastreamento ou publicidade. Para mais informações, consulte
              nossa{' '}
              <Link to="/cookies" className="text-primary hover:underline">
                Política de Cookies
              </Link>
              .
            </p>
          </section>

          {/* Updates */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Alterações nesta Política
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças
              significativas por email ou através de um aviso em nosso serviço.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Entre em Contato
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>Para questões sobre privacidade ou exercer seus direitos:</p>
              <p>
                Encarregado de Proteção de Dados:{' '}
                <a href="mailto:support@adsmart.app" className="text-primary hover:underline">
                  support@adsmart.app
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
