import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'pt' | 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Traduções
const translations = {
  pt: {
    // Header
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Entrar',
    
    // Hero
    'hero.title': 'Mais uma ferramenta,\nmenos uma assinatura!',
    'hero.subtitle': 'Gere seus relatórios pagando apenas pelo uso. Sem mensalidades, sem complicações.',
    'hero.cta.start': 'Começar Agora',
    'hero.cta.demo': 'Ver Demonstração',
    'hero.stats.price': 'por relatório',
    'hero.stats.subscription': 'mensalidades',
    'hero.stats.validity': 'validade dos créditos',
    
    // Features
    'features.title': 'Por que escolher o AdSmart?',
    'features.payperuse.title': 'Pague por uso',
    'features.payperuse.desc': 'Sem assinaturas mensais. Compre créditos e use quando precisar.',
    'features.fast.title': 'Relatórios em minutos',
    'features.fast.desc': 'Conecte suas contas e gere relatórios profissionais instantaneamente.',
    'features.templates.title': 'Templates prontos',
    'features.templates.desc': 'Modelos do Looker Studio otimizados para suas campanhas.',
    
    // Testimonials
    'testimonials.title': 'O que nossos clientes dizem',
    'testimonials.1.content': 'Economizamos 10 horas por semana com relatórios automatizados. Vale cada centavo!',
    'testimonials.1.author': 'João Silva',
    'testimonials.1.role': 'CEO, Agência Digital Pro',
    'testimonials.2.content': 'Finalmente posso focar em otimizar campanhas ao invés de criar relatórios manualmente.',
    'testimonials.2.author': 'Maria Santos',
    'testimonials.2.role': 'Gestora de Tráfego',
    'testimonials.3.content': 'Perfeito para quem não quer mais uma assinatura mensal. Pago apenas quando preciso!',
    'testimonials.3.author': 'Pedro Costa',
    'testimonials.3.role': 'Freelancer',
    
    // How it works
    'how.title': 'Como funciona?',
    'how.step1.title': 'Conecte suas contas',
    'how.step1.desc': 'Google Ads e Meta Ads via OAuth seguro',
    'how.step2.title': 'Escolha um template',
    'how.step2.desc': 'Modelos profissionais do Looker Studio',
    'how.step3.title': 'Gere o relatório',
    'how.step3.desc': 'Pronto! Compartilhe com seus clientes',
    
    // Pricing
    'pricing.title': 'Preços transparentes',
    'pricing.subtitle': 'Sem pegadinhas, sem letras miúdas',
    'pricing.payperuse': 'Pay Per Use',
    'pricing.per_report': 'por relatório',
    'pricing.benefit1': 'Créditos nunca expiram',
    'pricing.benefit2': 'Sem mensalidade',
    'pricing.benefit3': 'Compre quando precisar',
    'pricing.benefit4': 'Pagamento via PIX',
    'pricing.cta': 'Começar Agora',
    
    // FAQ
    'faq.title': 'Perguntas frequentes',
    'faq.1.question': 'Como funciona o sistema de créditos?',
    'faq.1.answer': 'Você compra créditos via PIX e usa quando precisar. Cada relatório consome 1 crédito (R$ 10,00). Os créditos nunca expiram!',
    'faq.2.question': 'Preciso pagar mensalidade?',
    'faq.2.answer': 'Não! Esse é nosso diferencial. Você paga apenas pelos relatórios que gerar, sem assinaturas ou taxas mensais.',
    'faq.3.question': 'Quais plataformas são suportadas?',
    'faq.3.answer': 'Atualmente suportamos Google Ads e Meta Ads (Facebook e Instagram). Novos canais em breve!',
    'faq.4.question': 'Os relatórios são personalizáveis?',
    'faq.4.answer': 'Sim! Oferecemos templates profissionais do Looker Studio que podem ser customizados com sua marca.',
    'faq.5.question': 'É seguro conectar minhas contas?',
    'faq.5.answer': 'Totalmente! Usamos OAuth oficial do Google e Meta. Nunca temos acesso às suas senhas.',
    
    // CTA
    'cta.title': 'Pronto para economizar tempo e dinheiro?',
    'cta.subtitle': 'Junte-se a centenas de agências que já descobriram uma forma melhor',
    'cta.button': 'Criar Conta Gratuita',
    
    // Footer
    'footer.tagline': 'Mais uma ferramenta,\nmenos uma assinatura.',
    'footer.product': 'Produto',
    'footer.features': 'Recursos',
    'footer.pricing': 'Preços',
    'footer.templates': 'Templates',
    'footer.legal': 'Legal',
    'footer.terms': 'Termos de Uso',
    'footer.privacy': 'Política de Privacidade',
    'footer.contact': 'Contato',
    'footer.delete_data': 'Excluir Dados',
    'footer.copyright': 'Todos os direitos reservados.',
  },
  en: {
    // Header
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Sign In',
    
    // Hero
    'hero.title': 'One more tool,\none less subscription!',
    'hero.subtitle': 'Generate your reports paying only for what you use. No monthly fees, no complications.',
    'hero.cta.start': 'Get Started',
    'hero.cta.demo': 'View Demo',
    'hero.stats.price': 'per report',
    'hero.stats.subscription': 'subscriptions',
    'hero.stats.validity': 'credit validity',
    
    // Features
    'features.title': 'Why choose AdSmart?',
    'features.payperuse.title': 'Pay per use',
    'features.payperuse.desc': 'No monthly subscriptions. Buy credits and use when needed.',
    'features.fast.title': 'Reports in minutes',
    'features.fast.desc': 'Connect your accounts and generate professional reports instantly.',
    'features.templates.title': 'Ready templates',
    'features.templates.desc': 'Looker Studio templates optimized for your campaigns.',
    
    // Testimonials
    'testimonials.title': 'What our clients say',
    'testimonials.1.content': 'We save 10 hours per week with automated reports. Worth every penny!',
    'testimonials.1.author': 'John Smith',
    'testimonials.1.role': 'CEO, Digital Pro Agency',
    'testimonials.2.content': 'Finally I can focus on optimizing campaigns instead of manually creating reports.',
    'testimonials.2.author': 'Sarah Johnson',
    'testimonials.2.role': 'Traffic Manager',
    'testimonials.3.content': 'Perfect for those who don\'t want another monthly subscription. I only pay when I need!',
    'testimonials.3.author': 'Mike Davis',
    'testimonials.3.role': 'Freelancer',
    
    // How it works
    'how.title': 'How it works?',
    'how.step1.title': 'Connect your accounts',
    'how.step1.desc': 'Google Ads and Meta Ads via secure OAuth',
    'how.step2.title': 'Choose a template',
    'how.step2.desc': 'Professional Looker Studio templates',
    'how.step3.title': 'Generate the report',
    'how.step3.desc': 'Done! Share with your clients',
    
    // Pricing
    'pricing.title': 'Transparent pricing',
    'pricing.subtitle': 'No tricks, no fine print',
    'pricing.payperuse': 'Pay Per Use',
    'pricing.per_report': 'per report',
    'pricing.benefit1': 'Credits never expire',
    'pricing.benefit2': 'No monthly fee',
    'pricing.benefit3': 'Buy when needed',
    'pricing.benefit4': 'Payment via PIX',
    'pricing.cta': 'Get Started',
    
    // FAQ
    'faq.title': 'Frequently asked questions',
    'faq.1.question': 'How does the credit system work?',
    'faq.1.answer': 'You buy credits via PIX and use them when needed. Each report consumes 1 credit ($10.00). Credits never expire!',
    'faq.2.question': 'Do I need to pay monthly?',
    'faq.2.answer': 'No! That\'s our differentiator. You only pay for the reports you generate, no subscriptions or monthly fees.',
    'faq.3.question': 'Which platforms are supported?',
    'faq.3.answer': 'We currently support Google Ads and Meta Ads (Facebook and Instagram). New channels coming soon!',
    'faq.4.question': 'Are reports customizable?',
    'faq.4.answer': 'Yes! We offer professional Looker Studio templates that can be customized with your brand.',
    'faq.5.question': 'Is it safe to connect my accounts?',
    'faq.5.answer': 'Absolutely! We use official OAuth from Google and Meta. We never have access to your passwords.',
    
    // CTA
    'cta.title': 'Ready to save time and money?',
    'cta.subtitle': 'Join hundreds of agencies that have already discovered a better way',
    'cta.button': 'Create Free Account',
    
    // Footer
    'footer.tagline': 'One more tool,\none less subscription.',
    'footer.product': 'Product',
    'footer.features': 'Features',
    'footer.pricing': 'Pricing',
    'footer.templates': 'Templates',
    'footer.legal': 'Legal',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.contact': 'Contact',
    'footer.delete_data': 'Delete Data',
    'footer.copyright': 'All rights reserved.',
  },
  es: {
    // Header
    'nav.dashboard': 'Panel',
    'nav.login': 'Iniciar Sesión',
    
    // Hero
    'hero.title': 'Una herramienta más,\n¡una suscripción menos!',
    'hero.subtitle': 'Genera tus informes pagando solo por el uso. Sin mensualidades, sin complicaciones.',
    'hero.cta.start': 'Empezar Ahora',
    'hero.cta.demo': 'Ver Demostración',
    'hero.stats.price': 'por informe',
    'hero.stats.subscription': 'suscripciones',
    'hero.stats.validity': 'validez de créditos',
    
    // Features
    'features.title': '¿Por qué elegir AdSmart?',
    'features.payperuse.title': 'Paga por uso',
    'features.payperuse.desc': 'Sin suscripciones mensuales. Compra créditos y usa cuando necesites.',
    'features.fast.title': 'Informes en minutos',
    'features.fast.desc': 'Conecta tus cuentas y genera informes profesionales al instante.',
    'features.templates.title': 'Plantillas listas',
    'features.templates.desc': 'Plantillas de Looker Studio optimizadas para tus campañas.',
    
    // Testimonials
    'testimonials.title': 'Lo que dicen nuestros clientes',
    'testimonials.1.content': '¡Ahorramos 10 horas por semana con informes automatizados. Vale cada centavo!',
    'testimonials.1.author': 'María García',
    'testimonials.1.role': 'CEO, Agencia Digital Pro',
    'testimonials.2.content': 'Finalmente puedo enfocarme en optimizar campañas en lugar de crear informes manualmente.',
    'testimonials.2.author': 'Juan Rodríguez',
    'testimonials.2.role': 'Gestor de Tráfico',
    'testimonials.3.content': 'Perfecto para quienes no quieren otra suscripción mensual. ¡Solo pago cuando necesito!',
    'testimonials.3.author': 'Luis Martínez',
    'testimonials.3.role': 'Freelancer',
    
    // How it works
    'how.title': '¿Cómo funciona?',
    'how.step1.title': 'Conecta tus cuentas',
    'how.step1.desc': 'Google Ads y Meta Ads vía OAuth seguro',
    'how.step2.title': 'Elige una plantilla',
    'how.step2.desc': 'Plantillas profesionales de Looker Studio',
    'how.step3.title': 'Genera el informe',
    'how.step3.desc': '¡Listo! Comparte con tus clientes',
    
    // Pricing
    'pricing.title': 'Precios transparentes',
    'pricing.subtitle': 'Sin trucos, sin letra pequeña',
    'pricing.payperuse': 'Pago Por Uso',
    'pricing.per_report': 'por informe',
    'pricing.benefit1': 'Los créditos nunca expiran',
    'pricing.benefit2': 'Sin mensualidad',
    'pricing.benefit3': 'Compra cuando necesites',
    'pricing.benefit4': 'Pago vía PIX',
    'pricing.cta': 'Empezar Ahora',
    
    // FAQ
    'faq.title': 'Preguntas frecuentes',
    'faq.1.question': '¿Cómo funciona el sistema de créditos?',
    'faq.1.answer': 'Compras créditos vía PIX y los usas cuando necesites. Cada informe consume 1 crédito (R$ 10,00). ¡Los créditos nunca expiran!',
    'faq.2.question': '¿Necesito pagar mensualidad?',
    'faq.2.answer': '¡No! Ese es nuestro diferencial. Solo pagas por los informes que generes, sin suscripciones ni tarifas mensuales.',
    'faq.3.question': '¿Qué plataformas son compatibles?',
    'faq.3.answer': 'Actualmente soportamos Google Ads y Meta Ads (Facebook e Instagram). ¡Nuevos canales próximamente!',
    'faq.4.question': '¿Los informes son personalizables?',
    'faq.4.answer': 'Sí! Ofrecemos plantillas profesionales de Looker Studio que pueden personalizarse con tu marca.',
    'faq.5.question': '¿Es seguro conectar mis cuentas?',
    'faq.5.answer': '¡Totalmente! Usamos OAuth oficial de Google y Meta. Nunca tenemos acceso a tus contraseñas.',
    
    // CTA
    'cta.title': '¿Listo para ahorrar tiempo y dinero?',
    'cta.subtitle': 'Únete a cientos de agencias que ya descubrieron una forma mejor',
    'cta.button': 'Crear Cuenta Gratuita',
    
    // Footer
    'footer.tagline': 'Una herramienta más,\nuna suscripción menos.',
    'footer.product': 'Producto',
    'footer.features': 'Recursos',
    'footer.pricing': 'Precios',
    'footer.templates': 'Plantillas',
    'footer.legal': 'Legal',
    'footer.terms': 'Términos de Servicio',
    'footer.privacy': 'Política de Privacidad',
    'footer.contact': 'Contacto',
    'footer.delete_data': 'Eliminar Datos',
    'footer.copyright': 'Todos los derechos reservados.',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt')

  useEffect(() => {
    // Detectar idioma do navegador ou pegar do localStorage
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && ['pt', 'en', 'es'].includes(savedLang)) {
      setLanguageState(savedLang)
    } else {
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('en')) {
        setLanguageState('en')
      } else if (browserLang.startsWith('es')) {
        setLanguageState('es')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Atualizar lang do HTML
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['pt']] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}