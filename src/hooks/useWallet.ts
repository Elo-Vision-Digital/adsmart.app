import type { Transaction, UserWallet } from '@adsmart/shared'
import { TransactionSchema, UserWalletSchema } from '@adsmart/shared'
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/firebase/config'
import { zodConverter } from '@/schemas/firestore-converter'

export function useWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Observar saldo da carteira
  useEffect(() => {
    if (!user) {
      setWallet(null)
      setLoading(false)
      return
    }

    const walletRef = doc(db, 'users', user.uid, 'wallet', 'current').withConverter(
      zodConverter(UserWalletSchema, 'UserWallet')
    )

    const unsubscribe = onSnapshot(walletRef, async (snap) => {
      if (snap.exists()) {
        setWallet(snap.data())
      } else {
        const newWallet: UserWallet = {
          id: 'current',
          balance: 0,
          currency: 'BRL',
          updatedAt: new Date(),
        }
        await setDoc(walletRef, newWallet)
        setWallet(newWallet)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Observar transações em tempo real
  useEffect(() => {
    if (!user) return

    const transactionsRef = collection(db, 'users', user.uid, 'transactions').withConverter(
      zodConverter(TransactionSchema, 'Transaction')
    )
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(50))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map((doc) => doc.data()))
    })

    return () => unsubscribe()
  }, [user])

  // Adicionar créditos
  const addCredits = async (amount: number) => {
    if (!user) throw new Error('Usuário não autenticado')

    const transaction: Omit<Transaction, 'id'> = {
      type: 'credit',
      amount,
      description: 'Adição de créditos',
      status: 'completed',
      createdAt: new Date(),
    }

    // NOTE: blocked by firestore.rules (Phase 3 — client write to `transactions`
    // is rejected). Kept until this flow moves to a callable function.
    await addDoc(collection(db, 'users', user.uid, 'transactions'), transaction)

    // Atualizar saldo
    const walletRef = doc(db, 'users', user.uid, 'wallet', 'current').withConverter(
      zodConverter(UserWalletSchema, 'UserWallet')
    )
    const newBalance = (wallet?.balance || 0) + amount

    await setDoc(
      walletRef,
      {
        id: 'current',
        balance: newBalance,
        currency: 'BRL',
        updatedAt: new Date(),
      },
      { merge: true }
    )
  }

  // Debitar valor (para relatórios)
  const debitAmount = async (amount: number, description: string, reportId?: string) => {
    if (!user) throw new Error('Usuário não autenticado')
    if (!wallet || wallet.balance < amount) throw new Error('Saldo insuficiente')

    const transaction: Omit<Transaction, 'id'> = {
      type: 'debit',
      amount,
      description,
      status: 'completed',
      createdAt: new Date(),
      ...(reportId ? { reportId } : {}),
    }

    // NOTE: blocked by firestore.rules (Phase 3 — client write to `transactions`
    // is rejected). Kept until this flow moves to a callable function.
    await addDoc(collection(db, 'users', user.uid, 'transactions'), transaction)

    // Atualizar saldo
    const walletRef = doc(db, 'users', user.uid, 'wallet', 'current').withConverter(
      zodConverter(UserWalletSchema, 'UserWallet')
    )
    const newBalance = wallet.balance - amount

    await setDoc(
      walletRef,
      {
        id: 'current',
        balance: newBalance,
        currency: 'BRL',
        updatedAt: new Date(),
      },
      { merge: true }
    )
  }

  // Formatar valor para exibição
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
    formattedBalance: formatCurrency(wallet?.balance || 0),
  }
}
