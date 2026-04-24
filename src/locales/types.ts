export type Language = 'pt' | 'en' | 'es'

export interface Translations {
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
      saveChanges: string
      sending: string
    }
    form: {
      email: string
      password: string
      name: string
      confirmPassword: string
      rememberMe: string
      fullName: string
      phone: string
      documentType: string
      currentPassword: string
      newPassword: string
      confirmNewPassword: string
    }
    validation: {
      requiredField: string
      invalidEmail: string
      passwordMismatch: string
      weakPassword: string
      completeRecaptcha: string
      emailCannotBeChanged: string
      minimumCharacters: string
      invalidDocument: string
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
      saving: string
      changing: string
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
      saveProfile: string
      changePassword: string
      sendVerificationEmail: string
      wrongPassword: string
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

  // SettingsPage translations
  settingsPage: {
    title: string
    subtitle: string
    personalInfo: {
      title: string
      subtitle: string
    }
    changePassword: {
      title: string
      subtitle: string
    }
    emailVerification: {
      notVerified: string
      verifyToAccess: string
      resendVerification: string
      verificationSent: string
      errorSending: string
    }
    messages: {
      profileUpdated: string
      passwordChanged: string
      passwordsDoNotMatch: string
      passwordTooShort: string
      currentPasswordIncorrect: string
    }
  }
}
