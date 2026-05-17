import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/config'

interface CreatePixPaymentResponse {
  success: boolean
  paymentId: string
  qrCode: string
  qrCodeText: string
  amount: number
  expiresAt: string
}

interface CheckPaymentStatusResponse {
  status: 'pending' | 'completed' | 'expired'
  paidAt?: Date
}

class PaymentService {
  /**
   * Cria um pagamento PIX
   * @param amount Valor em reais (ex: 10.00 para R$ 10,00)
   * @param userCpf CPF do usuário (opcional se já cadastrado)
   */
  async createPixPayment(amount: number, userCpf?: string): Promise<CreatePixPaymentResponse> {
    try {
      console.log('💳 Criando pagamento PIX:', amount)

      const createPayment = httpsCallable<
        { amount: number; userCpf?: string },
        CreatePixPaymentResponse
      >(functions, 'createPixPayment')

      const data: any = { amount }

      // Adicionar CPF se fornecido
      if (userCpf) {
        // Remover formatação do CPF
        data.userCpf = userCpf.replace(/\D/g, '')
      }

      const result = await createPayment(data)
      console.log('✅ Pagamento criado:', result.data)

      return result.data
    } catch (error: any) {
      console.error('❌ Erro ao criar pagamento:', error)

      // Tratar erros específicos
      if (error.code === 'functions/invalid-argument') {
        throw new Error(error.message)
      }

      if (error.code === 'functions/unauthenticated') {
        throw new Error('Erro de autenticação. Faça login novamente.')
      }

      if (error.code === 'functions/not-found') {
        throw new Error('Serviço de pagamento indisponível')
      }

      throw new Error(error.message || 'Erro ao processar pagamento')
    }
  }

  /**
   * Verifica o status de um pagamento
   */
  async checkPaymentStatus(paymentId: string): Promise<CheckPaymentStatusResponse> {
    try {
      const checkStatus = httpsCallable<{ paymentId: string }, CheckPaymentStatusResponse>(
        functions,
        'checkPaymentStatus'
      )

      const result = await checkStatus({ paymentId })
      return result.data
    } catch (error: any) {
      console.error('❌ Erro ao verificar status:', error)
      throw new Error(error.message || 'Erro ao verificar pagamento')
    }
  }

  /**
   * Aguarda o pagamento ser confirmado (polling)
   * @param paymentId ID do pagamento
   * @param maxAttempts Número máximo de tentativas (padrão: 60 = 5 minutos)
   * @param interval Intervalo entre tentativas em ms (padrão: 5000 = 5 segundos)
   */
  async waitForPayment(
    paymentId: string,
    maxAttempts: number = 60,
    interval: number = 5000
  ): Promise<boolean> {
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const status = await this.checkPaymentStatus(paymentId)

        if (status.status === 'completed') {
          return true
        }

        if (status.status === 'expired') {
          throw new Error('Pagamento expirado')
        }

        // Aguardar antes da próxima tentativa
        await new Promise((resolve) => setTimeout(resolve, interval))
        attempts++
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
        throw error
      }
    }

    return false
  }
}

export const paymentService = new PaymentService()
