import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ArrowRight, CheckCircle, Globe, ChevronDown, Star, Moon, Sun, Plus, Minus, CreditCard, Zap, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
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
    { code: 'es', label: 'ES', flag: '🇪🇸' }
  ]

  const currentLang = languageOptions.find(l => l.code === language) || languageOptions[0]

  const testimonials = [
    {
      name: t('testimonials.1.author'),
      role: t('testimonials.1.role'),
      content: t('testimonials.1.content'),
      rating: 5
    },
    {
      name: t('testimonials.2.author'),
      role: t('testimonials.2.role'),
      content: t('testimonials.2.content'),
      rating: 5
    },
    {
      name: t('testimonials.3.author'),
      role: t('testimonials.3.role'),
      content: t('testimonials.3.content'),
      rating: 5
    }
  ]

  const faqs = [
    {
      question: t('faq.1.question'),
      answer: t('faq.1.answer')
    },
    {
      question: t('faq.2.question'),
      answer: t('faq.2.answer')
    },
    {
      question: t('faq.3.question'),
      answer: t('faq.3.answer')
    },
    {
      question: t('faq.4.question'),
      answer: t('faq.4.answer')
    },
    {
      question: t('faq.5.question'),
      answer: t('faq.5.answer')
    }
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
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
                src={theme === 'dark' ? "https://imgur.com/CPDcfYm.png" : "https://imgur.com/T6AehDg.png"}
                alt="AdSmart" 
                className="h-8 object-contain"
              />
            </div>
            
            <nav className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-black/10'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className={`flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10' 
                      : 'hover:bg-black/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLang.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
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
                      {languageOptions.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as 'pt' | 'en' | 'es')
                            setShowLangDropdown(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                            language === lang.code 
                              ? theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
                              : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
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
                  {t('nav.login')}
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
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            {t('hero.title').split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {t('hero.subtitle')}
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
              {t('hero.cta.start')}
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
              {t('hero.cta.demo')}
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
          >
            {[
              { number: "R$ 10", label: t('hero.stats.price') },
              { number: "0", label: t('hero.stats.subscription') },
              { number: "∞", label: t('hero.stats.validity') }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold">{stat.number}</div>
                <div className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>{stat.label}</div>
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
        className={`py-24 px-4 ${
          theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            {t('features.title')}
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              {
                title: t('features.payperuse.title'),
                description: t('features.payperuse.desc'),
                icon: CreditCard
              },
              {
                title: t('features.fast.title'),
                description: t('features.fast.desc'),
                icon: Zap
              },
              {
                title: t('features.templates.title'),
                description: t('features.templates.desc'),
                icon: BarChart3
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-white/10' 
                    : 'bg-black/5'
                }`}>
                  <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-xl mb-3">{feature.title}</h3>
                <p className={`leading-relaxed ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>{feature.description}</p>
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
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl font-bold text-center mb-12"
          >
            {t('testimonials.title')}
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-lg border ${
                  theme === 'dark' 
                    ? 'border-white/20' 
                    : 'border-black/10'
                }`}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className={`mb-4 italic ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{testimonial.role}</div>
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
        className={`py-20 px-4 ${
          theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl font-bold text-center mb-12"
          >
            {t('how.title')}
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "1", title: t('how.step1.title'), desc: t('how.step1.desc') },
              { num: "2", title: t('how.step2.title'), desc: t('how.step2.desc') },
              { num: "3", title: t('how.step3.title'), desc: t('how.step3.desc') }
            ].map((step, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold border-2 ${
                    theme === 'dark' 
                      ? 'border-white' 
                      : 'border-black'
                  }`}
                >
                  {step.num}
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>{step.desc}</p>
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
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            {t('pricing.title')}
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className={`text-xl mb-16 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {t('pricing.subtitle')}
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            className="max-w-lg mx-auto"
          >
            <div className={`rounded-2xl p-10 border-2 ${
              theme === 'dark' 
                ? 'border-white bg-black' 
                : 'border-black bg-white'
            }`}>
              <h3 className="text-2xl font-bold mb-8">{t('pricing.payperuse')}</h3>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">R$ 10,00</span>
                <span className={`ml-2 text-lg ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>{t('pricing.per_report')}</span>
              </div>
              
              <ul className="space-y-4 mb-10 max-w-xs mx-auto">
                {[
                  t('pricing.benefit1'),
                  t('pricing.benefit2'),
                  t('pricing.benefit3'),
                  t('pricing.benefit4')
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 justify-center">
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                      theme === 'dark' ? 'text-white/70' : 'text-black/70'
                    }`} strokeWidth={1.5} />
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
                {t('pricing.cta')}
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
        className={`py-20 px-4 ${
          theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl font-bold text-center mb-12"
          >
            {t('faq.title')}
          </motion.h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`rounded-lg border ${
                  theme === 'dark' 
                    ? 'border-white/20' 
                    : 'border-black/10'
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
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-6 pb-4 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
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
        className={`py-20 px-4 ${
          theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl font-bold mb-4"
          >
            {t('cta.title')}
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className={`text-xl mb-8 ${
              theme === 'dark' ? 'text-gray-800' : 'text-gray-300'
            }`}
          >
            {t('cta.subtitle')}
          </motion.p>
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className={`group ${
                theme === 'dark' 
                  ? 'bg-black text-white hover:bg-gray-800 border border-black' 
                  : 'bg-white text-black hover:bg-gray-200 border border-white'
              }`}
            >
              {t('cta.button')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className={`py-12 px-4 border-t ${
        theme === 'dark' ? 'border-white/20' : 'border-black/10'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img 
                src={theme === 'dark' ? "https://imgur.com/CPDcfYm.png" : "https://imgur.com/T6AehDg.png"}
                alt="AdSmart" 
                className="h-8 object-contain mb-4"
              />
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('footer.tagline').split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    {index === 0 && <br />}
                  </span>
                ))}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {t('footer.features')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {t('footer.pricing')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {t('footer.templates')}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy/delete-data" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    {t('footer.delete_data')}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support@adsmart.app" className={`text-sm transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}>
                    support@adsmart.app
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t mt-8 pt-8 text-center ${
            theme === 'dark' ? 'border-white/20' : 'border-black/10'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              &copy; 2025 Adsmart - Zen Technology - {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}