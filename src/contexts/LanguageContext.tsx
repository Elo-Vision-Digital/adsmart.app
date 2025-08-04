import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'pt' | 'en' | 'es'

interface Translations {
  // Common translations (reutilizáveis em toda aplicação)
  common: {
    button: {
      start: string
      login: string
      createAccount: string
      viewDemo: string
      signUp: string
      loginWithGoogle: string
      loginWithFacebook: string
      forgotPassword: string
      deposit: string
      add: string
      search: string
      refresh: string
      delete: string
      manage: string
      createNew: string
      back: string
    }
    form: {
      email: string
      password: string
      name: string
      confirmPassword: string
      rememberMe: string
    }
    validation: {
      requiredField: string
      invalidEmail: string
      passwordMismatch: string
      weakPassword: string
      completeRecaptcha: string
    }
    general: {
      user: string
      settings: string
      logout: string
      noResults: string
      loading: string
      synced: string
      recently: string
      admin: string
      balance: string
    }
    theme: {
      light: string
      dark: string
    }
    perReport: string
    footer: {
      rights: string
      termsOfUse: string
      privacyPolicy: string
    }
    loading: string
    locale: string
    error: {
      generic: string
      tooManyAttempts: string
      deleteAccount: string
    }
    warning: {
      testAccount: string
      rateLimit: string
      rateLimitRemaining: string
    }
  }
  
  // Dashboard translations
  dashboard: {
    myReports: string
    integrations: string
    viewTemplates: string
    searchPlaceholder: string
    noReportsFound: string
    noAccountsConnected: string
    clickToStart: string
    loadingConnections: string
    deleteConfirm: string
    addAccounts: string
    createNewReport: string
  }
  
  // Sidebar translations
  sidebar: {
    dashboard: string
    integrations: string
    reports: string
    templates: string
    finance: string
    settings: string
    administration: string
  }
  
  // Footer translations
  footer: {
    tagline: string
    quickLinks: string
    legal: string
    contact: string
    location: string
    developedBy: string
    allRightsReserved: string
  }
  
  // LoginPage specific translations
  loginPage: {
    title: {
      login: string
      signUp: string
    }
    subtitle: {
      login: string
      signUp: string
    }
    message: {
      noAccount: string
      haveAccount: string
      loginSuccess: string
      signupSuccess: string
    }
    error: {
      invalidCredentials: string
      emailInUse: string
      weakPasswordDetails: string
      socialLoginFailed: string
    }
  }

  // HomePage translations
  homePage: {
    hero: {
      title: string
      subtitle: string
    }
    features: {
      title: string
      subtitle: string
      googleAds: {
        title: string
        description: string
      }
      metaAds: {
        title: string
        description: string
      }
      automation: {
        title: string
        description: string
      }
      insights: {
        title: string
        description: string
      }
    }
    templates: {
      title: string
      subtitle: string
    }
    pricing: {
      title: string
      subtitle: string
      simple: {
        title: string
        subtitle: string
      }
      templates: {
        google: {
          launch: string
          localBusiness: string
        }
        meta: {
          launch: string
          localBusiness: string
        }
      }
    }
    cta: {
      title: string
      subtitle: string
    }
    stats: {
      reports: string
      users: string
      integrations: string
    }
  }

  // ReportsPage translations
  reportsPage: {
    title: string
    subtitle: string
    totalReports: string
    createNewReport: string
    searchPlaceholder: string
    noReportsFound: string
    noReportsHint: string
    filters: {
      allPlatforms: string
      mostRecent: string
      oldest: string
    }
    stats: {
      thisMonth: string
    }
  }

  // TemplatesPage translations
  templatesPage: {
    title: string
    subtitle: string
    backToDashboard: string
    currentBalance: string
    warning: string
    insufficientBalance: {
      title: string
      message: string
      button: string
    }
    howItWorks: {
      title: string
      step1: string
      step2: string
      step3: string
      step4: string
      step5: string
    }
  }

  // TemplateCard translations
  templateCard: {
    featuresIncluded: string
    loading: string
    insufficientBalance: string
    useTemplate: string
    defaultTitle: string
    defaultDescription: string
    templateTypes: {
      launch: string
      localBusiness: string
    }
    templateDescriptions: {
      googleLaunch: string
      metaLaunch: string
      googleLocal: string
      metaLocal: string
    }
  }

  // Template features translations
  templateFeatures: {
    googleLaunch: {
      feature1: string
      feature2: string
      feature3: string
      feature4: string
    }
    metaLaunch: {
      feature1: string
      feature2: string
      feature3: string
      feature4: string
    }
    googleLocal: {
      feature1: string
      feature2: string
      feature3: string
      feature4: string
    }
    metaLocal: {
      feature1: string
      feature2: string
      feature3: string
      feature4: string
    }
  }

  // AccountsPage translations
  accountsPage: {
    title: string
    subtitle: string
    backToDashboard: string
    addDemoAccounts: string
    demo: string
    connect: string
    accountConnected: string
    accountsConnectedPlural: string
    noAccountsConnected: string
    connectGoogleToStart: string
    connectMetaToStart: string
    synced: string
    confirmRemove: string
    mockAccountsAdded: string
    accountsConnectedSuccess: string
    importantInfo: {
      title: string
      description: string
    }
    error: {
      connectGoogle: string
      connectMeta: string
      saveAccounts: string
    }
  }

  // TransactionsPage translations
  transactionsPage: {
    loading: string
    backToDashboard: string
    title: string
    subtitle: string
    currentBalance: string
    recentTransactions: string
    lastTransactions: string
    noTransactions: string
    dateUnavailable: string
    transactionStatus: {
      completed: string
      pending: string
      failed: string
    }
    stats: {
      totalCredits: string
      totalDebits: string
      transactions: string
    }
  }
}

const translations: Record<Language, Translations> = {
  pt: {
    common: {
      button: {
        start: 'Começar Agora',
        login: 'Entrar',
        createAccount: 'Criar Conta Gratuita',
        viewDemo: 'Ver Demonstração',
        signUp: 'Cadastrar',
        loginWithGoogle: 'Entrar com Google',
        loginWithFacebook: 'Entrar com Facebook',
        forgotPassword: 'Esqueceu sua senha?',
        deposit: 'Depositar',
        add: 'Adicionar',
        search: 'Pesquisar',
        refresh: 'Atualizar',
        delete: 'Excluir',
        manage: 'Gerenciar',
        createNew: 'Criar novo',
        back: 'Voltar'
      },
      form: {
        email: 'Email',
        password: 'Senha',
        name: 'Nome',
        confirmPassword: 'Confirmar senha',
        rememberMe: 'Lembrar de mim'
      },
      validation: {
        requiredField: 'Campo obrigatório',
        invalidEmail: 'Email inválido',
        passwordMismatch: 'As senhas não coincidem',
        weakPassword: 'A senha deve ter pelo menos 8 caracteres',
        completeRecaptcha: 'Por favor, complete o ReCAPTCHA'
      },
      general: {
        user: 'Usuário',
        settings: 'Configurações',
        logout: 'Sair',
        noResults: 'Nenhum resultado encontrado',
        loading: 'Carregando...',
        synced: 'Sincronizado',
        recently: 'Recentemente',
        admin: 'Admin',
        balance: 'Saldo'
      },
      theme: {
        light: 'Claro',
        dark: 'Escuro'
      },
      perReport: 'por relatório',
      footer: {
        rights: 'Todos os direitos reservados',
        termsOfUse: 'Termos de Uso',
        privacyPolicy: 'Políticas de Privacidade'
      },
      loading: 'Carregando...',
      locale: 'pt-BR',
      error: {
        generic: 'Erro ao processar solicitação',
        tooManyAttempts: 'Muitas tentativas. Tente novamente em 15 minutos.',
        deleteAccount: 'Erro ao remover conta'
      },
      warning: {
        testAccount: 'Conta de teste identificada - ReCAPTCHA desabilitado',
        rateLimit: 'Muitas tentativas. Tente novamente em 15 minutos.',
        rateLimitRemaining: 'Atenção: Você tem apenas {attempts} tentativas restantes.'
      }
    },
    dashboard: {
      myReports: 'Meus relatórios',
      integrations: 'Integrações',
      viewTemplates: 'Ver templates de Relatório',
      searchPlaceholder: 'Pesquisar...',
      noReportsFound: 'Nenhum relatório encontrado',
      noAccountsConnected: 'Nenhuma conta conectada',
      clickToStart: 'Clique em "Adicionar contas" para começar',
      loadingConnections: 'Carregando conexões...',
      deleteConfirm: 'Tem certeza que deseja remover esta conta?',
      addAccounts: 'Adicionar contas',
      createNewReport: 'Criar novo relatório'
    },
    sidebar: {
      dashboard: 'Dashboard',
      integrations: 'Integrações',
      reports: 'Relatórios',
      templates: 'Templates',
      finance: 'Financeiro',
      settings: 'Configurações',
      administration: 'Administração'
    },
    footer: {
      tagline: 'Mais uma ferramenta, menos uma assinatura! Gere seus relatórios pagando apenas pelo uso.',
      quickLinks: 'Links Rápidos',
      legal: 'Legal',
      contact: 'Contato',
      location: 'São Paulo, SP - Brasil',
      developedBy: 'Desenvolvido com ❤️ por Zen Technology',
      allRightsReserved: 'Todos os direitos reservados'
    },
    loginPage: {
      title: {
        login: 'Fazer Login',
        signUp: 'Criar Conta'
      },
      subtitle: {
        login: 'Por favor preencha os detalhes abaixo',
        signUp: 'Preencha os dados para criar sua conta'
      },
      message: {
        noAccount: 'Não tem uma conta?',
        haveAccount: 'Já possui uma conta?',
        loginSuccess: 'Login realizado com sucesso!',
        signupSuccess: 'Conta criada com sucesso!'
      },
      error: {
        invalidCredentials: 'Email ou senha inválidos',
        emailInUse: 'Este email já está em uso',
        weakPasswordDetails: 'A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais',
        socialLoginFailed: 'Erro ao fazer login social. Tente novamente.'
      }
    },
    homePage: {
      hero: {
        title: 'Relatórios Profissionais de Anúncios em Minutos',
        subtitle: 'Transforme dados do Google Ads e Meta Ads em insights visuais impressionantes com apenas alguns cliques.'
      },
      features: {
        title: 'Tudo que você precisa para análises profissionais',
        subtitle: 'Ferramentas poderosas para transformar seus dados em insights acionáveis',
        googleAds: {
          title: 'Google Ads',
          description: 'Integração completa com Google Ads para análises detalhadas de campanhas'
        },
        metaAds: {
          title: 'Meta Ads',
          description: 'Conecte Facebook e Instagram Ads para relatórios unificados'
        },
        automation: {
          title: 'Automação Inteligente',
          description: 'Geração automática de relatórios com dados em tempo real'
        },
        insights: {
          title: 'Insights Profundos',
          description: 'Análises avançadas e recomendações baseadas em IA'
        }
      },
      templates: {
        title: 'Templates Profissionais Prontos para Usar',
        subtitle: 'Escolha entre nossos modelos otimizados para diferentes tipos de negócio'
      },
      pricing: {
        title: 'Preços Simples e Transparentes',
        subtitle: 'Pague apenas pelos relatórios que gerar',
        simple: {
          title: 'Modelo Simples',
          subtitle: 'Sem mensalidades, pague apenas pelo que usar'
        },
        templates: {
          google: {
            launch: 'Google Ads - Lançamento',
            localBusiness: 'Google Ads - Negócio Local'
          },
          meta: {
            launch: 'Meta Ads - Lançamento', 
            localBusiness: 'Meta Ads - Negócio Local'
          }
        }
      },
      cta: {
        title: 'Pronto para Impressionar seus Clientes?',
        subtitle: 'Comece a criar relatórios profissionais em minutos'
      },
      stats: {
        reports: 'Relatórios Gerados',
        users: 'Usuários Ativos',
        integrations: 'Integrações'
      }
    },
    reportsPage: {
      title: 'Meus Relatórios',
      subtitle: 'Gerencie e acesse todos os seus relatórios gerados',
      totalReports: 'Total de relatórios: {count}',
      createNewReport: 'Criar novo relatório',
      searchPlaceholder: 'Pesquisar por nome ou conta...',
      noReportsFound: 'Nenhum relatório encontrado',
      noReportsHint: 'Tente ajustar os filtros ou criar um novo relatório',
      filters: {
        allPlatforms: 'Todas plataformas',
        mostRecent: 'Mais recentes',
        oldest: 'Mais antigos'
      },
      stats: {
        thisMonth: 'Este mês'
      }
    },
    templatesPage: {
      title: 'Templates de Relatórios',
      subtitle: 'Escolha o modelo ideal para suas análises de marketing',
      backToDashboard: 'Voltar ao Dashboard',
      currentBalance: 'Seu saldo atual',
      warning: 'Aviso',
      insufficientBalance: {
        title: 'Saldo Insuficiente',
        message: 'Você precisa adicionar créditos para gerar relatórios. Seu saldo atual é {balance}.',
        button: 'Adicionar Créditos'
      },
      howItWorks: {
        title: 'Como funciona?',
        step1: 'Escolha o template adequado para sua plataforma de anúncios',
        step2: 'Conecte sua conta do Google Ads ou Meta Ads',
        step3: 'Selecione as campanhas e o período de análise',
        step4: 'Confirme o pagamento (valores atualizados em tempo real)',
        step5: 'Receba o link do seu dashboard personalizado em minutos!'
      }
    },
    templateCard: {
      featuresIncluded: 'Recursos incluídos:',
      loading: 'Carregando...',
      insufficientBalance: 'Saldo Insuficiente',
      useTemplate: 'Usar este Template',
      defaultTitle: 'Dashboard {platform}',
      defaultDescription: 'Dashboard profissional para suas campanhas',
      templateTypes: {
        launch: 'Lançamento',
        localBusiness: 'Negócios Locais'
      },
      templateDescriptions: {
        googleLaunch: 'Dashboard para campanhas de lançamento no Google Ads',
        metaLaunch: 'Dashboard para campanhas de lançamento no Meta Ads',
        googleLocal: 'Dashboard para negócios locais no Google Ads',
        metaLocal: 'Dashboard para negócios locais no Meta Ads'
      }
    },
    templateFeatures: {
      googleLaunch: {
        feature1: 'Análise de conversões e ROI',
        feature2: 'Métricas de engajamento detalhadas',
        feature3: 'Comparativo de períodos',
        feature4: 'Insights automáticos de performance'
      },
      metaLaunch: {
        feature1: 'Análise de público-alvo',
        feature2: 'Performance por formato de anúncio',
        feature3: 'Funil de conversão detalhado',
        feature4: 'Otimizações sugeridas'
      },
      googleLocal: {
        feature1: 'Análise geográfica de conversões',
        feature2: 'Performance por localização',
        feature3: 'Horários de pico de conversão',
        feature4: 'ROI por região'
      },
      metaLocal: {
        feature1: 'Alcance por região',
        feature2: 'Engajamento local',
        feature3: 'Análise demográfica detalhada',
        feature4: 'Custo por lead local'
      }
    },
    accountsPage: {
      title: 'Contas de Anúncios',
      subtitle: 'Conecte suas contas do Google Ads e Meta Ads para gerar relatórios',
      backToDashboard: 'Voltar ao Dashboard',
      addDemoAccounts: 'Adicionar Contas Demo',
      demo: 'Demo',
      connect: 'Conectar',
      accountConnected: 'conta conectada',
      accountsConnectedPlural: 'contas conectadas',
      noAccountsConnected: 'Nenhuma conta conectada',
      connectGoogleToStart: 'Conecte sua conta do Google Ads para começar',
      connectMetaToStart: 'Conecte sua conta do Meta Ads para começar',
      synced: 'Sincronizado',
      confirmRemove: 'Tem certeza que deseja remover esta conta?',
      mockAccountsAdded: 'Contas de demonstração adicionadas!',
      accountsConnectedSuccess: '{count} contas {platform} conectadas com sucesso!',
      importantInfo: {
        title: 'Informação Importante',
        description: 'Para conectar suas contas de anúncios, você precisará autorizar o adsmart a acessar seus dados. Utilizamos conexões seguras OAuth2 e não armazenamos suas senhas. Você pode revogar o acesso a qualquer momento.'
      },
      error: {
        connectGoogle: 'Erro ao conectar com Google Ads. Tente novamente.',
        connectMeta: 'Erro ao conectar com Meta Ads. Tente novamente.',
        saveAccounts: 'Erro ao salvar contas selecionadas'
      }
    },
    transactionsPage: {
      loading: 'Carregando transações...',
      backToDashboard: 'Voltar ao Dashboard',
      title: 'Histórico de Transações',
      subtitle: 'Acompanhe todas as movimentações da sua carteira',
      currentBalance: 'Saldo Atual',
      recentTransactions: 'Transações Recentes',
      lastTransactions: 'Últimas 10 transações realizadas',
      noTransactions: 'Nenhuma transação realizada ainda.',
      dateUnavailable: 'Data indisponível',
      transactionStatus: {
        completed: 'Concluída',
        pending: 'Pendente',
        failed: 'Falhou'
      },
      stats: {
        totalCredits: 'Total de Créditos',
        totalDebits: 'Total de Débitos',
        transactions: 'Transações'
      }
    }
  },
  en: {
    common: {
      button: {
        start: 'Get Started',
        login: 'Log In',
        createAccount: 'Create Free Account',
        viewDemo: 'View Demo',
        signUp: 'Sign Up',
        loginWithGoogle: 'Sign in with Google',
        loginWithFacebook: 'Sign in with Facebook',
        forgotPassword: 'Forgot your password?',
        deposit: 'Deposit',
        add: 'Add',
        search: 'Search',
        refresh: 'Refresh',
        delete: 'Delete',
        manage: 'Manage',
        createNew: 'Create new',
        back: 'Back'
      },
      form: {
        email: 'Email',
        password: 'Password',
        name: 'Name',
        confirmPassword: 'Confirm password',
        rememberMe: 'Remember me'
      },
      validation: {
        requiredField: 'Required field',
        invalidEmail: 'Invalid email',
        passwordMismatch: 'Passwords do not match',
        weakPassword: 'Password must be at least 8 characters',
        completeRecaptcha: 'Please complete the ReCAPTCHA'
      },
      general: {
        user: 'User',
        settings: 'Settings',
        logout: 'Log out',
        noResults: 'No results found',
        loading: 'Loading...',
        synced: 'Synced',
        recently: 'Recently',
        admin: 'Admin',
        balance: 'Balance'
      },
      theme: {
        light: 'Light',
        dark: 'Dark'
      },
      perReport: 'per report',
      footer: {
        rights: 'All rights reserved',
        termsOfUse: 'Terms of Use',
        privacyPolicy: 'Privacy Policy'
      },
      loading: 'Loading...',
      locale: 'en-US',
      error: {
        generic: 'Error processing request',
        tooManyAttempts: 'Too many attempts. Try again in 15 minutes.',
        deleteAccount: 'Error removing account'
      },
      warning: {
        testAccount: 'Test account identified - ReCAPTCHA disabled',
        rateLimit: 'Too many attempts. Try again in 15 minutes.',
        rateLimitRemaining: 'Warning: You have only {attempts} attempts remaining.'
      }
    },
    dashboard: {
      myReports: 'My reports',
      integrations: 'Integrations',
      viewTemplates: 'View Report Templates',
      searchPlaceholder: 'Search...',
      noReportsFound: 'No reports found',
      noAccountsConnected: 'No accounts connected',
      clickToStart: 'Click "Add accounts" to start',
      loadingConnections: 'Loading connections...',
      deleteConfirm: 'Are you sure you want to remove this account?',
      addAccounts: 'Add accounts',
      createNewReport: 'Create new report'
    },
    sidebar: {
      dashboard: 'Dashboard',
      integrations: 'Integrations',
      reports: 'Reports',
      templates: 'Templates',
      finance: 'Finance',
      settings: 'Settings',
      administration: 'Administration'
    },
    footer: {
      tagline: 'One more tool, one less subscription! Generate reports paying only for what you use.',
      quickLinks: 'Quick Links',
      legal: 'Legal',
      contact: 'Contact',
      location: 'São Paulo, SP - Brazil',
      developedBy: 'Developed with ❤️ by Zen Technology',
      allRightsReserved: 'All rights reserved'
    },
    loginPage: {
      title: {
        login: 'Log In',
        signUp: 'Sign Up'
      },
      subtitle: {
        login: 'Please fill in the details below',
        signUp: 'Fill in the details to create your account'
      },
      message: {
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        loginSuccess: 'Successfully logged in!',
        signupSuccess: 'Account created successfully!'
      },
      error: {
        invalidCredentials: 'Invalid email or password',
        emailInUse: 'This email is already in use',
        weakPasswordDetails: 'Password must contain at least 8 characters, including uppercase, lowercase, numbers and special characters',
        socialLoginFailed: 'Social login failed. Please try again.'
      }
    },
    homePage: {
      hero: {
        title: 'Professional Ad Reports in Minutes',
        subtitle: 'Transform Google Ads and Meta Ads data into stunning visual insights with just a few clicks.'
      },
      features: {
        title: 'Everything you need for professional analytics',
        subtitle: 'Powerful tools to transform your data into actionable insights',
        googleAds: {
          title: 'Google Ads',
          description: 'Complete Google Ads integration for detailed campaign analysis'
        },
        metaAds: {
          title: 'Meta Ads',
          description: 'Connect Facebook and Instagram Ads for unified reporting'
        },
        automation: {
          title: 'Smart Automation',
          description: 'Automatic report generation with real-time data'
        },
        insights: {
          title: 'Deep Insights',
          description: 'Advanced analytics and AI-based recommendations'
        }
      },
      templates: {
        title: 'Professional Templates Ready to Use',
        subtitle: 'Choose from our templates optimized for different business types'
      },
      pricing: {
        title: 'Simple and Transparent Pricing',
        subtitle: 'Pay only for the reports you generate',
        simple: {
          title: 'Simple Model',
          subtitle: 'No monthly fees, pay only for what you use'
        },
        templates: {
          google: {
            launch: 'Google Ads - Launch',
            localBusiness: 'Google Ads - Local Business'
          },
          meta: {
            launch: 'Meta Ads - Launch',
            localBusiness: 'Meta Ads - Local Business'
          }
        }
      },
      cta: {
        title: 'Ready to Impress your Clients?',
        subtitle: 'Start creating professional reports in minutes'
      },
      stats: {
        reports: 'Reports Generated',
        users: 'Active Users',
        integrations: 'Integrations'
      }
    },
    reportsPage: {
      title: 'My Reports',
      subtitle: 'Manage and access all your generated reports',
      totalReports: 'Total reports: {count}',
      createNewReport: 'Create new report',
      searchPlaceholder: 'Search by name or account...',
      noReportsFound: 'No reports found',
      noReportsHint: 'Try adjusting the filters or create a new report',
      filters: {
        allPlatforms: 'All platforms',
        mostRecent: 'Most recent',
        oldest: 'Oldest'
      },
      stats: {
        thisMonth: 'This month'
      }
    },
    templatesPage: {
      title: 'Report Templates',
      subtitle: 'Choose the ideal template for your marketing analysis',
      backToDashboard: 'Back to Dashboard',
      currentBalance: 'Your current balance',
      warning: 'Warning',
      insufficientBalance: {
        title: 'Insufficient Balance',
        message: 'You need to add credits to generate reports. Your current balance is {balance}.',
        button: 'Add Credits'
      },
      howItWorks: {
        title: 'How it works?',
        step1: 'Choose the appropriate template for your ads platform',
        step2: 'Connect your Google Ads or Meta Ads account',
        step3: 'Select campaigns and analysis period',
        step4: 'Confirm payment (real-time updated values)',
        step5: 'Receive your personalized dashboard link in minutes!'
      }
    },
    templateCard: {
      featuresIncluded: 'Features included:',
      loading: 'Loading...',
      insufficientBalance: 'Insufficient Balance',
      useTemplate: 'Use this Template',
      defaultTitle: '{platform} Dashboard',
      defaultDescription: 'Professional dashboard for your campaigns',
      templateTypes: {
        launch: 'Launch',
        localBusiness: 'Local Business'
      },
      templateDescriptions: {
        googleLaunch: 'Dashboard for launch campaigns on Google Ads',
        metaLaunch: 'Dashboard for launch campaigns on Meta Ads',
        googleLocal: 'Dashboard for local businesses on Google Ads',
        metaLocal: 'Dashboard for local businesses on Meta Ads'
      }
    },
    templateFeatures: {
      googleLaunch: {
        feature1: 'Conversion and ROI analysis',
        feature2: 'Detailed engagement metrics',
        feature3: 'Period comparison',
        feature4: 'Automatic performance insights'
      },
      metaLaunch: {
        feature1: 'Target audience analysis',
        feature2: 'Performance by ad format',
        feature3: 'Detailed conversion funnel',
        feature4: 'Suggested optimizations'
      },
      googleLocal: {
        feature1: 'Geographic conversion analysis',
        feature2: 'Performance by location',
        feature3: 'Peak conversion hours',
        feature4: 'ROI by region'
      },
      metaLocal: {
        feature1: 'Reach by region',
        feature2: 'Local engagement',
        feature3: 'Detailed demographic analysis',
        feature4: 'Cost per local lead'
      }
    },
    accountsPage: {
      title: 'Ad Accounts',
      subtitle: 'Connect your Google Ads and Meta Ads accounts to generate reports',
      backToDashboard: 'Back to Dashboard',
      addDemoAccounts: 'Add Demo Accounts',
      demo: 'Demo',
      connect: 'Connect',
      accountConnected: 'account connected',
      accountsConnectedPlural: 'accounts connected',
      noAccountsConnected: 'No accounts connected',
      connectGoogleToStart: 'Connect your Google Ads account to start',
      connectMetaToStart: 'Connect your Meta Ads account to start',
      synced: 'Synced',
      confirmRemove: 'Are you sure you want to remove this account?',
      mockAccountsAdded: 'Demo accounts added!',
      accountsConnectedSuccess: '{count} {platform} accounts connected successfully!',
      importantInfo: {
        title: 'Important Information',
        description: 'To connect your ad accounts, you will need to authorize adsmart to access your data. We use secure OAuth2 connections and do not store your passwords. You can revoke access at any time.'
      },
      error: {
        connectGoogle: 'Error connecting to Google Ads. Please try again.',
        connectMeta: 'Error connecting to Meta Ads. Please try again.',
        saveAccounts: 'Error saving selected accounts'
      }
    },
    transactionsPage: {
      loading: 'Loading transactions...',
      backToDashboard: 'Back to Dashboard',
      title: 'Transaction History',
      subtitle: 'Track all your wallet movements',
      currentBalance: 'Current Balance',
      recentTransactions: 'Recent Transactions',
      lastTransactions: 'Last 10 transactions',
      noTransactions: 'No transactions yet.',
      dateUnavailable: 'Date unavailable',
      transactionStatus: {
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed'
      },
      stats: {
        totalCredits: 'Total Credits',
        totalDebits: 'Total Debits',
        transactions: 'Transactions'
      }
    }
  },
  es: {
    common: {
      button: {
        start: 'Comenzar Ahora',
        login: 'Iniciar Sesión',
        createAccount: 'Crear Cuenta Gratis',
        viewDemo: 'Ver Demostración',
        signUp: 'Registrarse',
        loginWithGoogle: 'Iniciar sesión con Google',
        loginWithFacebook: 'Iniciar sesión con Facebook',
        forgotPassword: '¿Olvidaste tu contraseña?',
        deposit: 'Depositar',
        add: 'Agregar',
        search: 'Buscar',
        refresh: 'Actualizar',
        delete: 'Eliminar',
        manage: 'Gestionar',
        createNew: 'Crear nuevo',
        back: 'Volver'
      },
      form: {
        email: 'Correo electrónico',
        password: 'Contraseña',
        name: 'Nombre',
        confirmPassword: 'Confirmar contraseña',
        rememberMe: 'Recordarme'
      },
      validation: {
        requiredField: 'Campo obligatorio',
        invalidEmail: 'Correo electrónico inválido',
        passwordMismatch: 'Las contraseñas no coinciden',
        weakPassword: 'La contraseña debe tener al menos 8 caracteres',
        completeRecaptcha: 'Por favor, complete el ReCAPTCHA'
      },
      general: {
        user: 'Usuario',
        settings: 'Configuraciones',
        logout: 'Salir',
        noResults: 'No se encontraron resultados',
        loading: 'Cargando...',
        synced: 'Sincronizado',
        recently: 'Recientemente',
        admin: 'Admin',
        balance: 'Saldo'
      },
      theme: {
        light: 'Claro',
        dark: 'Oscuro'
      },
      perReport: 'por informe',
      footer: {
        rights: 'Todos los derechos reservados',
        termsOfUse: 'Términos de Uso',
        privacyPolicy: 'Políticas de Privacidad'
      },
      loading: 'Cargando...',
      locale: 'es-ES',
      error: {
        generic: 'Error al procesar la solicitud',
        tooManyAttempts: 'Demasiados intentos. Intente nuevamente en 15 minutos.',
        deleteAccount: 'Error al eliminar la cuenta'
      },
      warning: {
        testAccount: 'Cuenta de prueba identificada - ReCAPTCHA deshabilitado',
        rateLimit: 'Demasiados intentos. Intente nuevamente en 15 minutos.',
        rateLimitRemaining: 'Atención: Solo tienes {attempts} intentos restantes.'
      }
    },
    dashboard: {
      myReports: 'Mis informes',
      integrations: 'Integraciones',
      viewTemplates: 'Ver plantillas de Informe',
      searchPlaceholder: 'Buscar...',
      noReportsFound: 'No se encontraron informes',
      noAccountsConnected: 'No hay cuentas conectadas',
      clickToStart: 'Haz clic en "Agregar cuentas" para comenzar',
      loadingConnections: 'Cargando conexiones...',
      deleteConfirm: '¿Estás seguro de que deseas eliminar esta cuenta?',
      addAccounts: 'Agregar cuentas',
      createNewReport: 'Crear nuevo informe'
    },
    sidebar: {
      dashboard: 'Dashboard',
      integrations: 'Integraciones',
      reports: 'Informes',
      templates: 'Plantillas',
      finance: 'Financiero',
      settings: 'Configuraciones',
      administration: 'Administración'
    },
    footer: {
      tagline: '¡Una herramienta más, una suscripción menos! Genera informes pagando solo por el uso.',
      quickLinks: 'Enlaces Rápidos',
      legal: 'Legal',
      contact: 'Contacto',
      location: 'São Paulo, SP - Brasil',
      developedBy: 'Desarrollado con ❤️ por Zen Technology',
      allRightsReserved: 'Todos los derechos reservados'
    },
    loginPage: {
      title: {
        login: 'Iniciar Sesión',
        signUp: 'Crear Cuenta'
      },
      subtitle: {
        login: 'Por favor complete los detalles a continuación',
        signUp: 'Complete los datos para crear su cuenta'
      },
      message: {
        noAccount: '¿No tienes una cuenta?',
        haveAccount: '¿Ya tienes una cuenta?',
        loginSuccess: '¡Inicio de sesión exitoso!',
        signupSuccess: '¡Cuenta creada exitosamente!'
      },
      error: {
        invalidCredentials: 'Correo electrónico o contraseña inválidos',
        emailInUse: 'Este correo electrónico ya está en uso',
        weakPasswordDetails: 'La contraseña debe contener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales',
        socialLoginFailed: 'Error al iniciar sesión social. Intente nuevamente.'
      }
    },
    homePage: {
      hero: {
        title: 'Informes Profesionales de Anuncios en Minutos',
        subtitle: 'Transforma datos de Google Ads y Meta Ads en insights visuales impresionantes con solo unos clics.'
      },
      features: {
        title: 'Todo lo que necesitas para análisis profesionales',
        subtitle: 'Herramientas poderosas para transformar tus datos en insights accionables',
        googleAds: {
          title: 'Google Ads',
          description: 'Integración completa con Google Ads para análisis detallados de campañas'
        },
        metaAds: {
          title: 'Meta Ads',
          description: 'Conecta Facebook e Instagram Ads para informes unificados'
        },
        automation: {
          title: 'Automatización Inteligente',
          description: 'Generación automática de informes con datos en tiempo real'
        },
        insights: {
          title: 'Insights Profundos',
          description: 'Análisis avanzados y recomendaciones basadas en IA'
        }
      },
      templates: {
        title: 'Plantillas Profesionales Listas para Usar',
        subtitle: 'Elige entre nuestras plantillas optimizadas para diferentes tipos de negocio'
      },
      pricing: {
        title: 'Precios Simples y Transparentes',
        subtitle: 'Paga solo por los informes que generes',
        simple: {
          title: 'Modelo Simple',
          subtitle: 'Sin mensualidades, paga solo por lo que uses'
        },
        templates: {
          google: {
            launch: 'Google Ads - Lanzamiento',
            localBusiness: 'Google Ads - Negocio Local'
          },
          meta: {
            launch: 'Meta Ads - Lanzamiento',
            localBusiness: 'Meta Ads - Negocio Local'
          }
        }
      },
      cta: {
        title: '¿Listo para Impresionar a tus Clientes?',
        subtitle: 'Comienza a crear informes profesionales en minutos'
      },
      stats: {
        reports: 'Informes Generados',
        users: 'Usuarios Activos',
        integrations: 'Integraciones'
      }
    },
    reportsPage: {
      title: 'Mis Informes',
      subtitle: 'Gestiona y accede a todos tus informes generados',
      totalReports: 'Total de informes: {count}',
      createNewReport: 'Crear nuevo informe',
      searchPlaceholder: 'Buscar por nombre o cuenta...',
      noReportsFound: 'No se encontraron informes',
      noReportsHint: 'Intenta ajustar los filtros o crear un nuevo informe',
      filters: {
        allPlatforms: 'Todas las plataformas',
        mostRecent: 'Más recientes',
        oldest: 'Más antiguos'
      },
      stats: {
        thisMonth: 'Este mes'
      }
    },
    templatesPage: {
      title: 'Plantillas de Informes',
      subtitle: 'Elige la plantilla ideal para tus análisis de marketing',
      backToDashboard: 'Volver al Dashboard',
      currentBalance: 'Tu saldo actual',
      warning: 'Advertencia',
      insufficientBalance: {
        title: 'Saldo Insuficiente',
        message: 'Necesitas agregar créditos para generar informes. Tu saldo actual es {balance}.',
        button: 'Agregar Créditos'
      },
      howItWorks: {
        title: '¿Cómo funciona?',
        step1: 'Elige la plantilla adecuada para tu plataforma de anuncios',
        step2: 'Conecta tu cuenta de Google Ads o Meta Ads',
        step3: 'Selecciona las campañas y el período de análisis',
        step4: 'Confirma el pago (valores actualizados en tiempo real)',
        step5: '¡Recibe el enlace de tu dashboard personalizado en minutos!'
      }
    },
    templateCard: {
      featuresIncluded: 'Recursos incluidos:',
      loading: 'Cargando...',
      insufficientBalance: 'Saldo Insuficiente',
      useTemplate: 'Usar esta Plantilla',
      defaultTitle: 'Dashboard {platform}',
      defaultDescription: 'Dashboard profesional para tus campañas',
      templateTypes: {
        launch: 'Lanzamiento',
        localBusiness: 'Negocios Locales'
      },
      templateDescriptions: {
        googleLaunch: 'Dashboard para campañas de lanzamiento en Google Ads',
        metaLaunch: 'Dashboard para campañas de lanzamiento en Meta Ads',
        googleLocal: 'Dashboard para negocios locales en Google Ads',
        metaLocal: 'Dashboard para negocios locales en Meta Ads'
      }
    },
    templateFeatures: {
      googleLaunch: {
        feature1: 'Análisis de conversiones y ROI',
        feature2: 'Métricas de engagement detalladas',
        feature3: 'Comparativo de períodos',
        feature4: 'Insights automáticos de rendimiento'
      },
      metaLaunch: {
        feature1: 'Análisis de público objetivo',
        feature2: 'Rendimiento por formato de anuncio',
        feature3: 'Embudo de conversión detallado',
        feature4: 'Optimizaciones sugeridas'
      },
      googleLocal: {
        feature1: 'Análisis geográfico de conversiones',
        feature2: 'Rendimiento por ubicación',
        feature3: 'Horarios pico de conversión',
        feature4: 'ROI por región'
      },
      metaLocal: {
        feature1: 'Alcance por región',
        feature2: 'Engagement local',
        feature3: 'Análisis demográfico detallado',
        feature4: 'Costo por lead local'
      }
    },
    accountsPage: {
      title: 'Cuentas de Anuncios',
      subtitle: 'Conecta tus cuentas de Google Ads y Meta Ads para generar informes',
      backToDashboard: 'Volver al Dashboard',
      addDemoAccounts: 'Agregar Cuentas Demo',
      demo: 'Demo',
      connect: 'Conectar',
      accountConnected: 'cuenta conectada',
      accountsConnectedPlural: 'cuentas conectadas',
      noAccountsConnected: 'No hay cuentas conectadas',
      connectGoogleToStart: 'Conecta tu cuenta de Google Ads para comenzar',
      connectMetaToStart: 'Conecta tu cuenta de Meta Ads para comenzar',
      synced: 'Sincronizado',
      confirmRemove: '¿Estás seguro de que deseas eliminar esta cuenta?',
      mockAccountsAdded: '¡Cuentas de demostración agregadas!',
      accountsConnectedSuccess: '¡{count} cuentas de {platform} conectadas con éxito!',
      importantInfo: {
        title: 'Información Importante',
        description: 'Para conectar tus cuentas de anuncios, deberás autorizar a adsmart a acceder a tus datos. Utilizamos conexiones seguras OAuth2 y no almacenamos tus contraseñas. Puedes revocar el acceso en cualquier momento.'
      },
      error: {
        connectGoogle: 'Error al conectar con Google Ads. Intenta nuevamente.',
        connectMeta: 'Error al conectar con Meta Ads. Intenta nuevamente.',
        saveAccounts: 'Error al guardar las cuentas seleccionadas'
      }
    },
    transactionsPage: {
      loading: 'Cargando transacciones...',
      backToDashboard: 'Volver al Dashboard',
      title: 'Historial de Transacciones',
      subtitle: 'Rastrea todos los movimientos de tu billetera',
      currentBalance: 'Saldo Actual',
      recentTransactions: 'Transacciones Recientes',
      lastTransactions: 'Últimas 10 transacciones',
      noTransactions: 'No hay transacciones aún.',
      dateUnavailable: 'Fecha no disponible',
      transactionStatus: {
        completed: 'Completada',
        pending: 'Pendiente',
        failed: 'Falló'
      },
      stats: {
        totalCredits: 'Total de Créditos',
        totalDebits: 'Total de Débitos',
        transactions: 'Transacciones'
      }
    }
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      return saved as Language
    }
    
    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'pt') return 'pt'
    if (browserLang === 'es') return 'es'
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value === 'string' && params) {
      // Replace placeholders with actual values
      return value.replace(/{(\w+)}/g, (match, param) => {
        return params[param]?.toString() || match
      })
    }
    
    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}