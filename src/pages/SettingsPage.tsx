import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Lock, 
  AlertCircle,
  Check,
  Loader2,
  UserCircle
} from 'lucide-react'
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  sendEmailVerification 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface UserProfile {
  name: string
  phone: string
  documentType: 'cpf' | 'cnpj'
  documentNumber: string
  emailVerified?: boolean
}

export function SettingsPage() {
  const { user } = useAuth()
  
  // Estados do formulário de perfil
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    documentType: 'cpf',
    documentNumber: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // Estados do formulário de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  // Estados de verificação de email
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setProfile({
          name: data.name || user.displayName || '',
          phone: data.phone || '',
          documentType: data.documentType || 'cpf',
          documentNumber: data.documentNumber || ''
        })
      } else {
        // Se não existe, usar dados do auth
        setProfile({
          name: user.displayName || '',
          phone: '',
          documentType: 'cpf',
          documentNumber: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  // Salvar perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage('')
    
    try {
      if (!user) throw new Error('Usuário não autenticado')
      
      // Validar documento
      if (!validateDocument(profile.documentNumber, profile.documentType)) {
        throw new Error(`${profile.documentType.toUpperCase()} inválido`)
      }
      
      // Salvar no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true })
      
      setSaveMessage('Perfil atualizado com sucesso!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error: any) {
      setSaveMessage(error.message || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  // Alterar senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')
    setPasswordError('')
    
    try {
      if (!user || !user.email) throw new Error('Usuário não autenticado')
      
      // Validar senhas
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('As senhas não coincidem')
      }
      
      if (passwordForm.newPassword.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres')
      }
      
      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordForm.currentPassword
      )
      await reauthenticateWithCredential(user, credential)
      
      // Atualizar senha
      await updatePassword(user, passwordForm.newPassword)
      
      setPasswordMessage('Senha alterada com sucesso!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      setTimeout(() => setPasswordMessage(''), 3000)
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Senha atual incorreta')
      } else {
        setPasswordError(error.message || 'Erro ao alterar senha')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  // Enviar email de verificação
  const handleSendVerification = async () => {
    if (!user) return
    
    setSendingVerification(true)
    setVerificationMessage('')
    
    try {
      await sendEmailVerification(user)
      setVerificationMessage('Email de verificação enviado! Verifique sua caixa de entrada.')
      setTimeout(() => setVerificationMessage(''), 5000)
    } catch (error: any) {
      setVerificationMessage('Erro ao enviar email. Tente novamente mais tarde.')
    } finally {
      setSendingVerification(false)
    }
  }

  // Validar CPF
  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(cpf.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(cpf.charAt(10))) return false
    
    return true
  }

  // Validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]/g, '')
    
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cnpj)) return false
    
    let length = cnpj.length - 2
    let numbers = cnpj.substring(0, length)
    let digits = cnpj.substring(length)
    let sum = 0
    let pos = length - 7
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(0))) return false
    
    length = length + 1
    numbers = cnpj.substring(0, length)
    sum = 0
    pos = length - 7
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(1))) return false
    
    return true
  }

  // Validar documento
  const validateDocument = (doc: string, type: 'cpf' | 'cnpj'): boolean => {
    return type === 'cpf' ? validateCPF(doc) : validateCNPJ(doc)
  }

  // Formatar documento
  const formatDocument = (value: string, type: 'cpf' | 'cnpj') => {
    value = value.replace(/\D/g, '')
    
    if (type === 'cpf') {
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
      value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2')
    } else {
      value = value.replace(/(\d{2})(\d)/, '$1.$2')
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
      value = value.replace(/(\d{3})(\d)/, '$1/$2')
      value = value.replace(/(\d{4})(\d)/, '$1-$2')
    }
    
    return value
  }

  // Formatar telefone
  const formatPhone = (value: string) => {
    value = value.replace(/\D/g, '')
    value = value.replace(/(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d{5})(\d)/, '$1-$2')
    return value
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background dark:bg-[#0A0A0A] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background dark:bg-[#0A0A0A]">
        <div className="w-full overflow-x-hidden">
          <div className="px-4 py-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Configurações
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gerencie suas informações pessoais e segurança
                </p>
              </div>

              {/* Alerta de email não verificado */}
              {user && !user.emailVerified && (
                <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                          Email não verificado
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                          Verifique seu email para acessar todos os recursos da plataforma.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={handleSendVerification}
                          disabled={sendingVerification}
                        >
                          {sendingVerification ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Reenviar email de verificação
                            </>
                          )}
                        </Button>
                        {verificationMessage && (
                          <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-300">
                            {verificationMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulário de perfil */}
              <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Seus dados são necessários para realizar depósitos na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-600 border border-[#EDEDED] dark:border-gray-600 rounded-lg cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        O email não pode ser alterado
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: formatPhone(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de documento
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="documentType"
                            value="cpf"
                            checked={profile.documentType === 'cpf'}
                            onChange={() => setProfile({ ...profile, documentType: 'cpf', documentNumber: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">CPF</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="documentType"
                            value="cnpj"
                            checked={profile.documentType === 'cnpj'}
                            onChange={() => setProfile({ ...profile, documentType: 'cnpj', documentNumber: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">CNPJ</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {profile.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profile.documentNumber}
                          onChange={(e) => setProfile({ 
                            ...profile, 
                            documentNumber: formatDocument(e.target.value, profile.documentType) 
                          })}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                          placeholder={profile.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          maxLength={profile.documentType === 'cpf' ? 14 : 18}
                          required
                        />
                      </div>
                    </div>

                    {saveMessage && (
                      <div className={`p-3 rounded-lg flex items-center gap-2 ${
                        saveMessage.includes('sucesso') 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {saveMessage.includes('sucesso') ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        {saveMessage}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar alterações'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Formulário de senha */}
              <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Alterar Senha
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Mantenha sua conta segura com uma senha forte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha atual
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nova senha
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar nova senha
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    {passwordMessage && (
                      <div className="p-3 rounded-lg flex items-center gap-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        {passwordMessage}
                      </div>
                    )}

                    {passwordError && (
                      <div className="p-3 rounded-lg flex items-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {passwordError}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        'Alterar senha'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}