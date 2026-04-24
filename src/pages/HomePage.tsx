import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Globe,
  Minus,
  Moon,
  Plus,
  Star,
  Sun,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const languageOptions = [
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
  ]

  const currentLang = languageOptions.find((l) => l.code === language) || languageOptions[0]

  const testimonials = [
    {
      name: 'João Silva',
      role: 'CEO, Agência Digital Pro',
      content:
        language === 'pt'
          ? 'Economizamos 10 horas por semana com relatórios automatizados. Vale cada centavo!'
          : language === 'en'
            ? 'We save 10 hours per week with automated reports. Worth every penny!'
            : '¡Ahorramos 10 horas por semana con informes automatizados. Vale cada centavo!',
      rating: 5,
    },
    {
      name: 'Maria Santos',
      role:
        language === 'pt'
          ? 'Gestora de Tráfego'
          : language === 'en'
            ? 'Traffic Manager'
            : 'Gestora de Tráfico',
      content:
        language === 'pt'
          ? 'Finalmente posso focar em otimizar campanhas ao invés de criar relatórios manualmente.'
          : language === 'en'
            ? 'Finally I can focus on optimizing campaigns instead of creating reports manually.'
            : 'Finalmente puedo concentrarme en optimizar campañas en lugar de crear informes manualmente.',
      rating: 5,
    },
    {
      name: 'Pedro Costa',
      role: 'Freelancer',
      content:
        language === 'pt'
          ? 'Perfeito para quem não quer mais uma assinatura mensal. Pago apenas quando preciso!'
          : language === 'en'
            ? "Perfect for those who don't want another monthly subscription. I pay only when I need!"
            : '¡Perfecto para quienes no quieren otra suscripción mensual. Pago solo cuando lo necesito!',
      rating: 5,
    },
  ]

  const faqs = [
    {
      question:
        language === 'pt'
          ? 'Como funciona o sistema de créditos?'
          : language === 'en'
            ? 'How does the credit system work?'
            : '¿Cómo funciona el sistema de créditos?',
      answer:
        language === 'pt'
          ? 'Você compra créditos via PIX e usa quando precisar. Cada relatório consome 1 crédito (R$ 10,00). Os créditos nunca expiram!'
          : language === 'en'
            ? 'You buy credits via PIX and use them when needed. Each report consumes 1 credit (R$ 10.00). Credits never expire!'
            : 'Compras créditos vía PIX y los usas cuando lo necesites. Cada informe consume 1 crédito (R$ 10,00). ¡Los créditos nunca expiran!',
    },
    {
      question:
        language === 'pt'
          ? 'Preciso pagar mensalidade?'
          : language === 'en'
            ? 'Do I need to pay a monthly fee?'
            : '¿Necesito pagar una mensualidad?',
      answer:
        language === 'pt'
          ? 'Não! Esse é nosso diferencial. Você paga apenas pelos relatórios que gerar, sem assinaturas ou taxas mensais.'
          : language === 'en'
            ? "No! That's our differentiator. You only pay for the reports you generate, no subscriptions or monthly fees."
            : '¡No! Ese es nuestro diferencial. Solo pagas por los informes que generes, sin suscripciones ni tarifas mensuales.',
    },
    {
      question:
        language === 'pt'
          ? 'Quais plataformas são suportadas?'
          : language === 'en'
            ? 'Which platforms are supported?'
            : '¿Qué plataformas son compatibles?',
      answer:
        language === 'pt'
          ? 'Atualmente suportamos Google Ads e Meta Ads (Facebook e Instagram). Novos canais em breve!'
          : language === 'en'
            ? 'We currently support Google Ads and Meta Ads (Facebook and Instagram). New channels coming soon!'
            : 'Actualmente soportamos Google Ads y Meta Ads (Facebook e Instagram). ¡Nuevos canales próximamente!',
    },
    {
      question:
        language === 'pt'
          ? 'Os relatórios são personalizáveis?'
          : language === 'en'
            ? 'Are the reports customizable?'
            : '¿Los informes son personalizables?',
      answer:
        language === 'pt'
          ? 'Sim! Oferecemos templates profissionais do Looker Studio que podem ser customizados com sua marca.'
          : language === 'en'
            ? 'Yes! We offer professional Looker Studio templates that can be customized with your brand.'
            : '¡Sí! Ofrecemos plantillas profesionales de Looker Studio que pueden personalizarse con tu marca.',
    },
    {
      question:
        language === 'pt'
          ? 'É seguro conectar minhas contas?'
          : language === 'en'
            ? 'Is it safe to connect my accounts?'
            : '¿Es seguro conectar mis cuentas?',
      answer:
        language === 'pt'
          ? 'Totalmente! Usamos OAuth oficial do Google e Meta. Nunca temos acesso às suas senhas.'
          : language === 'en'
            ? 'Absolutely! We use official OAuth from Google and Meta. We never have access to your passwords.'
            : '¡Totalmente! Usamos OAuth oficial de Google y Meta. Nunca tenemos acceso a tus contraseñas.',
    },
  ]

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? theme === 'dark'
              ? 'bg-black/80 backdrop-blur-sm border-b border-white/10'
              : 'bg-white/80 backdrop-blur-sm border-b border-black/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src={
                  theme === 'dark'
                    ? 'https://imgur.com/CPDcfYm.png'
                    : 'https://imgur.com/T6AehDg.png'
                }
                alt="AdSmart"
                className="h-8 object-contain"
              />
            </div>

            <nav className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className={`flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLang.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {showLangDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-black border border-white/20'
                          : 'bg-white border border-black/10'
                      }`}
                    >
                      {languageOptions.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as 'pt' | 'en' | 'es')
                            setShowLangDropdown(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                            language === lang.code
                              ? theme === 'dark'
                                ? 'bg-white/10'
                                : 'bg-black/10'
                              : theme === 'dark'
                                ? 'hover:bg-white/5'
                                : 'hover:bg-black/5'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user ? (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className={`${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className={`${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {t('common.button.login')}
                </Button>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-7xl mx-auto text-center"
        >
          <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold mb-6">
            {language === 'pt'
              ? 'Mais uma ferramenta,'
              : language === 'en'
                ? 'One more tool,'
                : 'Una herramienta más,'}
            <br />
            {language === 'pt'
              ? 'menos uma assinatura!'
              : language === 'en'
                ? 'one less subscription!'
                : '¡una suscripción menos!'}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {t('homePage.hero.subtitle')}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className={`group ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {t('common.button.start')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className={`${
                theme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              {t('common.button.viewDemo')}
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
          >
            {[
              { number: 'R$ 10', label: t('common.perReport') },
              {
                number: '0',
                label:
                  language === 'pt'
                    ? 'mensalidades'
                    : language === 'en'
                      ? 'subscriptions'
                      : 'suscripciones',
              },
              {
                number: '∞',
                label:
                  language === 'pt'
                    ? 'validade dos créditos'
                    : language === 'en'
                      ? 'credit validity'
                      : 'validez de créditos',
              },
            ].map((stat, index) => (
              <motion.div key={index} whileHover={{ scale: 1.05 }} className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stat.number}</div>
                <div
                  className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section - Refined */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className={`py-24 px-4 ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            {t('homePage.features.title')}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              {
                title:
                  language === 'pt'
                    ? 'Pague por uso'
                    : language === 'en'
                      ? 'Pay per use'
                      : 'Paga por uso',
                description:
                  language === 'pt'
                    ? 'Sem assinaturas mensais. Compre créditos e use quando precisar.'
                    : language === 'en'
                      ? 'No monthly subscriptions. Buy credits and use when needed.'
                      : 'Sin suscripciones mensuales. Compra créditos y úsalos cuando lo necesites.',
                icon: CreditCard,
              },
              {
                title:
                  language === 'pt'
                    ? 'Relatórios em minutos'
                    : language === 'en'
                      ? 'Reports in minutes'
                      : 'Informes en minutos',
                description:
                  language === 'pt'
                    ? 'Conecte suas contas e gere relatórios profissionais instantaneamente.'
                    : language === 'en'
                      ? 'Connect your accounts and generate professional reports instantly.'
                      : 'Conecta tus cuentas y genera informes profesionales al instante.',
                icon: Zap,
              },
              {
                title:
                  language === 'pt'
                    ? 'Templates prontos'
                    : language === 'en'
                      ? 'Ready templates'
                      : 'Plantillas listas',
                description:
                  language === 'pt'
                    ? 'Modelos do Looker Studio otimizados para suas campanhas.'
                    : language === 'en'
                      ? 'Looker Studio templates optimized for your campaigns.'
                      : 'Plantillas de Looker Studio optimizadas para tus campañas.',
                icon: BarChart3,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                    theme === 'dark' ? 'bg-white/10' : 'bg-black/5'
                  }`}
                >
                  <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-xl mb-3">{feature.title}</h3>
                <p
                  className={`leading-relaxed ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-center mb-12">
            {language === 'pt'
              ? 'O que nossos clientes dizem'
              : language === 'en'
                ? 'What our clients say'
                : 'Lo que dicen nuestros clientes'}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-lg border ${
                  theme === 'dark' ? 'border-white/20' : 'border-black/10'
                }`}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p
                  className={`mb-4 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div
                    className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How it Works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className={`py-20 px-4 ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-center mb-12">
            {language === 'pt'
              ? 'Como funciona?'
              : language === 'en'
                ? 'How it works?'
                : '¿Cómo funciona?'}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '1',
                title:
                  language === 'pt'
                    ? 'Conecte suas contas'
                    : language === 'en'
                      ? 'Connect your accounts'
                      : 'Conecta tus cuentas',
                desc:
                  language === 'pt'
                    ? 'Google Ads e Meta Ads via OAuth seguro'
                    : language === 'en'
                      ? 'Google Ads and Meta Ads via secure OAuth'
                      : 'Google Ads y Meta Ads vía OAuth seguro',
              },
              {
                num: '2',
                title:
                  language === 'pt'
                    ? 'Escolha um template'
                    : language === 'en'
                      ? 'Choose a template'
                      : 'Elige una plantilla',
                desc:
                  language === 'pt'
                    ? 'Modelos profissionais do Looker Studio'
                    : language === 'en'
                      ? 'Professional Looker Studio templates'
                      : 'Plantillas profesionales de Looker Studio',
              },
              {
                num: '3',
                title:
                  language === 'pt'
                    ? 'Gere o relatório'
                    : language === 'en'
                      ? 'Generate the report'
                      : 'Genera el informe',
                desc:
                  language === 'pt'
                    ? 'Pronto! Compartilhe com seus clientes'
                    : language === 'en'
                      ? 'Done! Share with your clients'
                      : '¡Listo! Comparte con tus clientes',
              },
            ].map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold border-2 ${
                    theme === 'dark' ? 'border-white' : 'border-black'
                  }`}
                >
                  {step.num}
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section - Refined */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-24 px-4"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
            {t('homePage.pricing.title')}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className={`text-xl mb-16 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {t('homePage.pricing.subtitle')}
          </motion.p>

          <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} className="max-w-lg mx-auto">
            <div
              className={`rounded-2xl p-10 border-2 ${
                theme === 'dark' ? 'border-white bg-black' : 'border-black bg-white'
              }`}
            >
              <h3 className="text-2xl font-bold mb-8">Pay Per Use</h3>

              <div className="mb-8">
                <span className="text-5xl font-bold">R$ 10,00</span>
                <span
                  className={`ml-2 text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {t('common.perReport')}
                </span>
              </div>

              <ul className="space-y-4 mb-10 max-w-xs mx-auto">
                {[
                  language === 'pt'
                    ? 'Créditos nunca expiram'
                    : language === 'en'
                      ? 'Credits never expire'
                      : 'Los créditos nunca expiran',
                  language === 'pt'
                    ? 'Sem mensalidade'
                    : language === 'en'
                      ? 'No monthly fee'
                      : 'Sin mensualidad',
                  language === 'pt'
                    ? 'Compre quando precisar'
                    : language === 'en'
                      ? 'Buy when needed'
                      : 'Compra cuando lo necesites',
                  language === 'pt'
                    ? 'Pagamento via PIX'
                    : language === 'en'
                      ? 'Payment via PIX'
                      : 'Pago vía PIX',
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 justify-center">
                    <CheckCircle
                      className={`w-5 h-5 flex-shrink-0 ${
                        theme === 'dark' ? 'text-white/70' : 'text-black/70'
                      }`}
                      strokeWidth={1.5}
                    />
                    <span className="text-left">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className={`w-full max-w-xs ${
                  theme === 'dark'
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                {t('common.button.start')}
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className={`py-20 px-4 ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}
      >
        <div className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-center mb-12">
            {language === 'pt'
              ? 'Perguntas frequentes'
              : language === 'en'
                ? 'Frequently asked questions'
                : 'Preguntas frecuentes'}
          </motion.h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`rounded-lg border ${
                  theme === 'dark' ? 'border-white/20' : 'border-black/10'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="font-semibold">{faq.question}</span>
                  {openFaq === index ? (
                    <Minus className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`px-6 pb-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className={`py-20 px-4 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 variants={fadeInUp} className="text-3xl font-bold mb-4">
            {t('homePage.cta.title')}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-800' : 'text-gray-300'}`}
          >
            {t('homePage.cta.subtitle')}
          </motion.p>
          <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className={`group ${
                theme === 'dark'
                  ? 'bg-black text-white hover:bg-gray-800 border border-black'
                  : 'bg-white text-black hover:bg-gray-200 border border-white'
              }`}
            >
              {t('common.button.createAccount')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer
        className={`py-12 px-4 border-t ${
          theme === 'dark' ? 'border-white/20' : 'border-black/10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img
                src={
                  theme === 'dark'
                    ? 'https://imgur.com/CPDcfYm.png'
                    : 'https://imgur.com/T6AehDg.png'
                }
                alt="AdSmart"
                className="h-8 object-contain mb-4"
              />
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'pt'
                  ? 'Mais uma ferramenta,'
                  : language === 'en'
                    ? 'One more tool,'
                    : 'Una herramienta más,'}
                <br />
                {language === 'pt'
                  ? 'menos uma assinatura.'
                  : language === 'en'
                    ? 'one less subscription.'
                    : 'una suscripción menos.'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">
                {language === 'pt' ? 'Produto' : language === 'en' ? 'Product' : 'Producto'}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/login"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'pt'
                      ? 'Recursos'
                      : language === 'en'
                        ? 'Features'
                        : 'Características'}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'pt' ? 'Preços' : language === 'en' ? 'Pricing' : 'Precios'}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Templates
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/terms"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {t('common.footer.termsOfUse')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {t('common.footer.privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy/delete-data"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'pt'
                      ? 'Excluir Dados'
                      : language === 'en'
                        ? 'Delete Data'
                        : 'Eliminar Datos'}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">
                {language === 'pt' ? 'Contato' : language === 'en' ? 'Contact' : 'Contacto'}
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="mailto:support@adsmart.app"
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    support@adsmart.app
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className={`border-t mt-8 pt-8 text-center ${
              theme === 'dark' ? 'border-white/20' : 'border-black/10'
            }`}
          >
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              &copy; 2025 Adsmart - Zen Technology - {t('common.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
