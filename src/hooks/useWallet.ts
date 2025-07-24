import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from '@/contexts/AuthContext'

interface Wallet {
  balance: number // em centavos
  currency: 'BRL'
  updatedAt: Date
}

interface Transaction {
  id?: string
  type: 'credit' | 'debit'
  amount: number // em centavos
  description: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export function useWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Observar saldo da carteira
  useEffect(() => {
    if (!user) {
      setWallet(null)
      setLoading(false)
      return
    }

    const walletRef = doc(db, 'users', user.uid, 'wallet', 'current')
    
    const unsubscribe = onSnapshot(walletRef, async (doc) => {
      if (doc.exists()) {
        setWallet(doc.data() as Wallet)
      } else {
        // Criar carteira se não existir
        const newWallet: Wallet = {
          balance: 0,
          currency: 'BRL',
          updatedAt: new Date()
        }
        await setDoc(walletRef, newWallet)
        setWallet(newWallet)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Buscar transações recentes
  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions')
      const q = query(
        transactionsRef,
        orderBy('createdAt', 'desc'),
        limit(50) // Aumentado para 50 transações
      )
      
      const snapshot = await getDocs(q)
      const trans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction))
      
      setTransactions(trans)
    }

    fetchTransactions()
  }, [user, wallet]) // Refetch quando wallet mudar

  // Adicionar créditos
  const addCredits = async (amount: number) => {
    if (!user) throw new Error('Usuário não autenticado')

    const transaction: Transaction = {
      type: 'credit',
      amount,
      description: 'Adição de créditos',
      status: 'completed',
      createdAt: new Date()
    }

    // Adicionar transação
    await addDoc(collection(db, 'users', user.uid, 'transactions'), transaction)

    // Atualizar saldo
    const walletRef = doc(db, 'users', user.uid, 'wallet', 'current')
    const newBalance = (wallet?.balance || 0) + amount
    
    await setDoc(walletRef, {
      balance: newBalance,
      currency: 'BRL',
      updatedAt: new Date()
    }, { merge: true })
  }

  // Debitar valor (para relatórios)
  const debitAmount = async (amount: number, description: string, reportId?: string) => {
    if (!user) throw new Error('Usuário não autenticado')
    if (!wallet || wallet.balance < amount) throw new Error('Saldo insuficiente')

    const transaction: any = {
      type: 'debit',
      amount,
      description,
      status: 'completed',
      createdAt: new Date()
    }

    // Só adicionar reportId se for fornecido
    if (reportId) {
      transaction.reportId = reportId
    }

    // Adicionar transação
    await addDoc(collection(db, 'users', user.uid, 'transactions'), transaction)

    // Atualizar saldo
    const walletRef = doc(db, 'users', user.uid, 'wallet', 'current')
    const newBalance = wallet.balance - amount
    
    await setDoc(walletRef, {
      balance: newBalance,
      currency: 'BRL',
      updatedAt: new Date()
    }, { merge: true })
  }

  // Formatar valor para exibição
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  return {
    wallet,
    transactions,
    loading,
    addCredits,
    debitAmount,
    formatCurrency,
    balance: wallet?.balance || 0,
    formattedBalance: formatCurrency(wallet?.balance || 0)
  }
}