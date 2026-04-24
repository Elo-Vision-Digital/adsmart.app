import { doc, getDoc } from 'firebase/firestore'
import { AlertCircle, CheckCircle, Clock, Copy, Loader2, XCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/firebase/config'
import { paymentService } from '@/services/paymentService'

// import { useNavigate } from 'react-router-dom'

interface PixPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  onSuccess?: () => void
}

export function PixPaymentModal({ open, onOpenChange, amount, onSuccess }: PixPaymentModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'expired' | 'error'>(
    'pending'
  )
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  // Estados para CPF
  const [userCpf, setUserCpf] = useState('')
  const [cpfError, setCpfError] = useState('')
  const [needsCpf, setNeedsCpf] = useState(false)
  const [checkingCpf, setCheckingCpf] = useState(true)

  // Verificar se usuário já tem CPF cadastrado
  useEffect(() => {
    const checkUserCpf = async () => {
      if (!user || !open) return

      try {
        setCheckingCpf(true)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userData = userDoc.data()

        if (userData?.cpf) {
          setUserCpf(userData.cpf)
          setNeedsCpf(false)
        } else {
          setNeedsCpf(true)
        }
      } catch (error) {
        console.error('Erro ao verificar CPF:', error)
        setNeedsCpf(true)
      } finally {
        setCheckingCpf(false)
      }
    }

    checkUserCpf()
  }, [user, open])

  // Criar pagamento quando tiver CPF
  useEffect(() => {
    if (open && !checkingCpf && !needsCpf && !paymentData) {
      createPayment()
    }
  }, [open, checkingCpf, needsCpf])

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!paymentData || paymentStatus !== 'pending') return

    const interval = setInterval(async () => {
      try {
        setChecking(true)
        const status = await paymentService.checkPaymentStatus(paymentData.paymentId)

        if (status.status === 'completed') {
          setPaymentStatus('completed')
          clearInterval(interval)

          // Aguardar um pouco para mostrar o sucesso e então fechar
          setTimeout(() => {
            onSuccess?.()
            handleClose()
          }, 2000)
        } else if (status.status === 'expired') {
          setPaymentStatus('expired')
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
      } finally {
        setChecking(false)
      }
    }, 5000) // Verificar a cada 5 segundos

    return () => clearInterval(interval)
  }, [paymentData, paymentStatus, onSuccess])

  const formatCpf = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')

    // Aplica a máscara
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
        .replace(/(\d{3})(\d{3})/, '$1.$2')
    }

    return value
  }

  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')

    if (numbers.length !== 11) {
      return 'CPF deve ter 11 dígitos'
    }

    // Validação básica de CPF (evita números sequenciais)
    if (/^(\d)\1{10}$/.test(numbers)) {
      return 'CPF inválido'
    }

    return ''
  }

  const handleCpfSubmit = async () => {
    const error = validateCpf(userCpf)
    if (error) {
      setCpfError(error)
      return
    }

    setCpfError('')
    setNeedsCpf(false)
    createPayment()
  }

  const createPayment = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Iniciando criação de pagamento PIX...')
      console.log('🔍 Valor:', amount)
      console.log('🔍 CPF:', userCpf.replace(/\D/g, '').substring(0, 3) + '***')

      const data = await paymentService.createPixPayment(amount, userCpf)

      console.log('✅ Resposta do pagamento:', data)

      setPaymentData(data)
      setPaymentStatus('pending')
    } catch (error: any) {
      console.error('❌ Erro ao criar pagamento:', error)
      setError(error.message || 'Erro ao criar pagamento')
      setPaymentStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = async () => {
    if (!paymentData?.qrCodeText) return

    try {
      await navigator.clipboard.writeText(paymentData.qrCodeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const handleClose = () => {
    setPaymentData(null)
    setPaymentStatus('pending')
    setError(null)
    setCpfError('')
    onOpenChange(false)
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            {checkingCpf && 'Verificando dados...'}
            {!checkingCpf && needsCpf && 'Precisamos do seu CPF para gerar o PIX'}
            {!checkingCpf &&
              !needsCpf &&
              paymentStatus === 'pending' &&
              'Escaneie o QR Code ou copie o código PIX'}
            {paymentStatus === 'completed' && 'Pagamento confirmado com sucesso!'}
            {paymentStatus === 'expired' && 'Este pagamento expirou'}
            {paymentStatus === 'error' && 'Erro ao processar pagamento'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {checkingCpf && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-gray-600">Verificando dados...</p>
            </div>
          )}

          {!checkingCpf && needsCpf && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">CPF necessário para pagamento PIX</p>
                    <p>Por questões de segurança, o PIX requer um CPF válido.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={userCpf}
                  onChange={(e) => {
                    setUserCpf(formatCpf(e.target.value))
                    setCpfError('')
                  }}
                  maxLength={14}
                  className={cpfError ? 'border-red-500' : ''}
                />
                {cpfError && <p className="text-sm text-red-600">{cpfError}</p>}
              </div>

              <Button onClick={handleCpfSubmit} disabled={!userCpf || loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Continuar para pagamento'
                )}
              </Button>
            </div>
          )}

          {!checkingCpf && !needsCpf && loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-gray-600">Gerando QR Code...</p>
            </div>
          )}

          {!checkingCpf && !needsCpf && !loading && paymentStatus === 'pending' && paymentData && (
            <div className="space-y-4">
              {/* Valor */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Valor a pagar</p>
                <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {paymentData.qrCodeText ? (
                  <QRCodeSVG value={paymentData.qrCodeText} size={200} level="H" />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center rounded">
                    <p className="text-gray-500 text-sm text-center">QR Code não disponível</p>
                  </div>
                )}
              </div>

              {/* Código PIX */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">Ou copie o código PIX</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentData.qrCodeText || 'Código não disponível'}
                    readOnly
                    className="flex-1 p-2 text-xs bg-gray-100 rounded-md font-mono truncate"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPixCode}
                    disabled={!paymentData.qrCodeText}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status de verificação */}
              {checking && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando pagamento...</span>
                </div>
              )}

              {/* Instruções */}
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Como pagar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              {/* Tempo de expiração */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Este código expira em 24 horas</span>
              </div>
            </div>
          )}

          {!loading && paymentStatus === 'completed' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
              <p className="text-xl font-semibold text-green-600">Pagamento Confirmado!</p>
              <p className="text-gray-600 mt-2">Seus créditos foram adicionados à carteira</p>
            </div>
          )}

          {!loading && paymentStatus === 'expired' && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="w-16 h-16 text-red-600 mb-4" />
              <p className="text-xl font-semibold text-red-600">Pagamento Expirado</p>
              <p className="text-gray-600 mt-2">Este código PIX não é mais válido</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setPaymentStatus('pending')
                  setPaymentData(null)
                  createPayment()
                }}
              >
                Gerar Novo Código
              </Button>
            </div>
          )}

          {!loading && paymentStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="w-16 h-16 text-red-600 mb-4" />
              <p className="text-xl font-semibold text-red-600">Erro no Pagamento</p>
              <p className="text-gray-600 mt-2">
                {error || 'Ocorreu um erro ao processar o pagamento'}
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setPaymentStatus('pending')
                  setError(null)
                  createPayment()
                }}
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {(needsCpf || paymentStatus === 'pending') && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {(paymentStatus === 'completed' ||
            paymentStatus === 'expired' ||
            paymentStatus === 'error') && <Button onClick={handleClose}>Fechar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
