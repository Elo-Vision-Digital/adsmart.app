import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWallet } from '@/hooks/useWallet'
import { CreditCard } from 'lucide-react'
import { PixPaymentModal } from './PixPaymentModal'

interface AddCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCreditsModal({ open, onOpenChange }: AddCreditsModalProps) {
  const { formatCurrency } = useWallet()
  const [amount, setAmount] = useState('')
  const [showPixModal, setShowPixModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(0)

  const predefinedAmounts = [10, 25, 50, 100] // em reais

  const handleAddCredits = () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) return

    // Abrir modal de pagamento PIX
    setSelectedAmount(value)
    setShowPixModal(true)
  }

  const handlePaymentSuccess = () => {
    // Fechar ambos os modais
    setShowPixModal(false)
    onOpenChange(false)
    setAmount('')
    // A carteira será atualizada automaticamente via webhook
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Créditos</DialogTitle>
            <DialogDescription>
              Adicione créditos à sua carteira para gerar relatórios. Cada relatório custa R$ 5,00.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {predefinedAmounts.map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  onClick={() => setAmount(value.toString())}
                  className="w-full"
                >
                  {formatCurrency(value * 100)}
                </Button>
              ))}
            </div>

            <div className="grid gap-2">
              <label htmlFor="custom-amount" className="text-sm font-medium">
                Ou digite um valor personalizado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  R$
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  step="0.01"
                  min="5"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💳 Pagamento seguro via PIX. Os créditos são adicionados instantaneamente após a confirmação do pagamento.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCredits} 
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Continuar para Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PixPaymentModal
        open={showPixModal}
        onOpenChange={setShowPixModal}
        amount={selectedAmount}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}