import { useCallback, useRef, useState } from 'react'

interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
  message?: string
}

export function useRateLimit(options: RateLimitOptions) {
  const {
    maxAttempts,
    windowMs,
    message = 'Muitas tentativas. Tente novamente mais tarde.',
  } = options
  const [isBlocked, setIsBlocked] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts)
  const attempts = useRef<number[]>([])
  const blockTimeout = useRef<NodeJS.Timeout>()

  const checkLimit = useCallback((): boolean => {
    const now = Date.now()

    // Remove tentativas antigas
    attempts.current = attempts.current.filter((time) => now - time < windowMs)

    if (attempts.current.length >= maxAttempts) {
      setIsBlocked(true)
      setRemainingAttempts(0)

      // Desbloqueia após o período
      if (blockTimeout.current) clearTimeout(blockTimeout.current)
      blockTimeout.current = setTimeout(() => {
        setIsBlocked(false)
        setRemainingAttempts(maxAttempts)
        attempts.current = []
      }, windowMs)

      return false
    }

    attempts.current.push(now)
    setRemainingAttempts(maxAttempts - attempts.current.length)
    return true
  }, [maxAttempts, windowMs])

  return {
    checkLimit,
    isBlocked,
    remainingAttempts,
    message,
  }
}
