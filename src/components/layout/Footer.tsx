import { Link } from 'react-router-dom'
import { Instagram, Linkedin, Mail, MapPin } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { theme } = useTheme()
  const { t } = useLanguage()

  const socialLinks = [
    {
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      href: 'https://instagram.com/adsmart',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      href: 'https://linkedin.com/company/adsmart',
    },
  ]

  const quickLinks = [
    { name: t('sidebar.dashboard'), path: '/dashboard' },
    { name: t('sidebar.templates'), path: '/templates' },
    { name: t('sidebar.integrations'), path: '/accounts' },
    { name: t('sidebar.reports'), path: '/reports' },
  ]

  const legalLinks = [
    { name: t('common.footer.termsOfUse'), path: '/terms' },
    { name: t('common.footer.privacyPolicy'), path: '/privacy' },
  ]

  return (
    <footer className={`${
      theme === 'dark' 
        ? 'bg-white text-black' 
        : 'bg-black text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={theme === 'dark' ? "https://i.imgur.com/T6AehDg.png" : "https://i.imgur.com/CPDcfYm.png"}
                alt="Adsmart" 
                className="h-8 object-contain"
              />
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              {t('footer.tagline')}
            </p>
            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-black/5 text-gray-700 hover:bg-black/10 hover:text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
              theme === 'dark' ? 'text-black' : 'text-white'
            }`}>
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-700 hover:text-black'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
              theme === 'dark' ? 'text-black' : 'text-white'
            }`}>
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-700 hover:text-black'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
              theme === 'dark' ? 'text-black' : 'text-white'
            }`}>
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <a
                  href="mailto:support@adsmart.app"
                  className={`text-sm transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-700 hover:text-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  support@adsmart.app
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {t('footer.location')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - sem borda */}
        <div className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className={`text-sm text-center sm:text-left ${
              theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              © {currentYear} Adsmart - {t('footer.allRightsReserved')}.
            </p>
            <div className={`flex flex-wrap items-center gap-4 text-sm ${
              theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <span>{t('footer.developedBy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-specific spacing to account for bottom navigation */}
      <div className="h-20 md:h-0" />
    </footer>
  )
}