import { AlertTriangle, CreditCard, FileText, Scale, Shield, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:text-blue-700 mb-4">
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Termos de Uso</h1>
          <p className="text-gray-600 dark:text-gray-400">Última atualização: Janeiro de 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Aceitação dos Termos
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Ao acessar e usar o Adsmart, você concorda com estes Termos de Uso. Se não concordar
              com qualquer parte destes termos, não use nosso serviço. O Adsmart é um serviço de
              automação de relatórios para campanhas do Google Ads e Meta Ads.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Descrição do Serviço
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>O Adsmart oferece:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Integração com contas do Google Ads e Meta Ads</li>
                <li>Geração automatizada de relatórios de performance</li>
                <li>Templates personalizáveis de relatórios</li>
                <li>Exportação de dados e relatórios</li>
                <li>Sistema de créditos para geração de relatórios</li>
              </ul>
            </div>
          </section>

          {/* Account Registration */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cadastro e Conta
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Para usar o Adsmart, você deve:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ter pelo menos 18 anos de idade</li>
                <li>Fornecer informações verdadeiras e completas</li>
                <li>Manter a segurança de sua conta</li>
                <li>Notificar-nos sobre uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
              </ul>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                <p className="text-sm">
                  <strong>Importante:</strong> O CPF cadastrado não pode ser alterado após o
                  primeiro uso, por questões de segurança e conformidade fiscal.
                </p>
              </div>
            </div>
          </section>

          {/* Usage Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Direitos de Uso
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Ao usar o Adsmart, você concorda em:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Usar o serviço apenas para fins legais e autorizados</li>
                <li>Não violar direitos de terceiros</li>
                <li>Não tentar acessar sistemas não autorizados</li>
                <li>Não revender ou redistribuir o serviço sem autorização</li>
                <li>Respeitar os limites de uso e fair use policy</li>
              </ul>
            </div>
          </section>

          {/* Payment Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pagamentos e Créditos
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <h3 className="font-medium text-gray-900 dark:text-white">Sistema de Créditos</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Créditos são necessários para gerar relatórios</li>
                <li>1 crédito = 1 relatório gerado</li>
                <li>Créditos não expiram</li>
                <li>Créditos não são reembolsáveis após a compra</li>
              </ul>

              <h3 className="font-medium text-gray-900 dark:text-white mt-4">
                Formas de Pagamento
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>PIX (processado via SuitPay)</li>
                <li>Cartão de crédito (em breve)</li>
              </ul>

              <h3 className="font-medium text-gray-900 dark:text-white mt-4">
                Política de Reembolso
              </h3>
              <p>
                Reembolsos podem ser solicitados em até 7 dias após a compra, desde que os créditos
                não tenham sido utilizados.
              </p>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Uso de Dados</h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Ao conectar suas contas de anúncios:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Você autoriza o acesso aos dados de suas campanhas</li>
                <li>Usamos os dados apenas para gerar relatórios</li>
                <li>Não modificamos suas campanhas ou configurações</li>
                <li>Não compartilhamos seus dados com terceiros</li>
                <li>Você pode revogar o acesso a qualquer momento</li>
              </ul>
            </div>
          </section>

          {/* Limitations */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Limitações de Responsabilidade
              </h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>O Adsmart não se responsabiliza por:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Interrupções ou erros nos serviços do Google Ads ou Meta Ads</li>
                <li>Perdas decorrentes de decisões baseadas em relatórios</li>
                <li>Dados incorretos fornecidos pelas plataformas de anúncios</li>
                <li>Uso indevido das informações por parte do usuário</li>
              </ul>
              <p className="mt-3">
                O serviço é fornecido "como está", sem garantias de qualquer tipo, expressas ou
                implícitas.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Propriedade Intelectual
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Todo o conteúdo, design, código e tecnologia do Adsmart são propriedade da Zenny
              Tecnologia ou licenciados para uso. É proibida a cópia, modificação ou distribuição
              sem autorização prévia por escrito.
            </p>
          </section>

          {/* Termination */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rescisão</h2>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>Podemos suspender ou encerrar sua conta se você:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Violar estes termos de uso</li>
                <li>Usar o serviço para atividades ilegais</li>
                <li>Tentar burlar limitações do sistema</li>
                <li>Não pagar pelos serviços utilizados</li>
              </ul>
              <p className="mt-3">
                Você pode cancelar sua conta a qualquer momento através das configurações ou
                entrando em contato conosco.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lei Aplicável</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida no foro
              da comarca de São Paulo/SP.
            </p>
          </section>

          {/* Updates */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Alterações nos Termos
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações
              significativas serão notificadas por email ou através do serviço. O uso continuado
              após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contato</h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>Para questões sobre estes termos:</p>
              <p>
                Suporte:{' '}
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
