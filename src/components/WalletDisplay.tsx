import { Wallet } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

export function WalletDisplay() {
  const { formattedBalance, loading } = useWallet()

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Wallet className="w-5 h-5" />
        <span className="text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <div className="text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">Saldo disponível</p>
        <p className="font-semibold text-lg">{formattedBalance}</p>
      </div>
    </div>
  )
}