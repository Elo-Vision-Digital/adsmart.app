import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { paymentService } from '@/services/paymentService'
import { Loader2, Copy, CheckCircle, XCircle, Clock } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface PixPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  onSuccess?: () => void
}

export function PixPaymentModal({ 
  open, 
  onOpenChange, 
  amount,
  onSuccess 
}: PixPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'expired' | 'error'>('pending')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  // Criar pagamento quando abrir o modal
  useEffect(() => {
    if (open && !paymentData) {
      createPayment()
    }
  }, [open])

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

  const createPayment = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Iniciando criação de pagamento PIX...')
      console.log('🔍 Valor:', amount)
      
      const data = await paymentService.createPixPayment(amount)
      
      console.log('✅ Resposta do pagamento:', data)
      console.log('🔍 Resposta completa (JSON):', JSON.stringify(data, null, 2))
      console.log('🔍 Payment ID:', data.paymentId)
      console.log('🔍 QR Code Text:', data.qrCodeText)
      console.log('🔍 QR Code Image:', data.qrCode)
      console.log('🔍 Expires At:', data.expiresAt)
      
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
    onOpenChange(false)
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            {paymentStatus === 'pending' && 'Escaneie o QR Code ou copie o código PIX para fazer o pagamento'}
            {paymentStatus === 'completed' && 'Pagamento confirmado com sucesso!'}
            {paymentStatus === 'expired' && 'Este pagamento expirou'}
            {paymentStatus === 'error' && 'Erro ao processar pagamento'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-gray-600">Gerando QR Code...</p>
            </div>
          )}

          {!loading && paymentStatus === 'pending' && paymentData && (
            <div className="space-y-4">
              {/* Valor */}
              <div className="text-center">
                <p className="text-sm text-gray-600">Valor a pagar</p>
                <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {paymentData.qrCodeText ? (
                  <QRCodeSVG 
                    value={paymentData.qrCodeText} 
                    size={200}
                    level="H"
                  />
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
                <span>Este código expira em 1 hora</span>
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
                onClick={createPayment}
              >
                Gerar Novo Código
              </Button>
            </div>
          )}

          {!loading && paymentStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="w-16 h-16 text-red-600 mb-4" />
              <p className="text-xl font-semibold text-red-600">Erro no Pagamento</p>
              <p className="text-gray-600 mt-2">{error || 'Ocorreu um erro ao processar o pagamento'}</p>
              <Button 
                className="mt-4"
                onClick={createPayment}
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {paymentStatus === 'pending' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {(paymentStatus === 'completed' || paymentStatus === 'expired' || paymentStatus === 'error') && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
