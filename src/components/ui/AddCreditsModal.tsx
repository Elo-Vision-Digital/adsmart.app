import { AlertCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AddCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// SuitPay was removed in ADR-021 (2026-05-18). This modal stays in the UI
// because three callers reference it (Header, MobileHeader, TemplatesPage)
// and the "add credits" feature itself is permanent — only the payment
// backend changed. When Stripe integration ships (FUTURE §8), restore the
// amount input + redirect to Stripe Checkout. Until then, surface a clear
// maintenance notice instead of silently failing on a 404 callable.
export function AddCreditsModal({ open, onOpenChange }: AddCreditsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Adicionar Créditos
          </DialogTitle>
          <DialogDescription>O sistema de pagamento está em manutenção.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Pagamento indisponível no momento</p>
                <p>
                  Estamos migrando o sistema de pagamento. A funcionalidade de adicionar créditos
                  via PIX retornará em breve. Se você precisa de créditos urgentemente, entre em
                  contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
