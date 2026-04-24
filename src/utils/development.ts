/**
 * Detecta se a aplicação está rodando em desenvolvimento
 * Verifica por localhost ou IPs locais comuns
 */
export const isDevelopment = (): boolean => {
  const hostname = window.location.hostname

  return (
    // Localhost
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    // IPs privados classe C (192.168.x.x)
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    // IPs privados classe A (10.x.x.x)
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    // IPs privados classe B (172.16-31.x.x)
    /^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/.test(hostname) ||
    // Ambiente de desenvolvimento explícito
    import.meta.env.DEV
  )
}

/**
 * Retorna configurações específicas para desenvolvimento
 */
export const getDevConfig = () => ({
  // TEMPORÁRIO: Forçar reCAPTCHA em desenvolvimento para teste
  skipRecaptcha: false, // MUDADO DE isDevelopment() PARA false

  // Token especial para desenvolvimento
  devRecaptchaToken: 'local-dev',

  // Mensagem de aviso para o usuário
  devWarningMessage: 'Modo desenvolvimento: Testando reCAPTCHA real',

  // IPs permitidos para desenvolvimento
  allowedDevIps: ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', 'localhost', '127.0.0.1'],
})

/**
 * Verifica se um IP específico é local/privado
 */
export const isPrivateIP = (ip: string): boolean => {
  const parts = ip.split('.')
  if (parts.length !== 4) return false

  const [a, b] = parts.map(Number)

  return (
    // 10.x.x.x
    a === 10 ||
    // 172.16-31.x.x
    (a === 172 && b >= 16 && b <= 31) ||
    // 192.168.x.x
    (a === 192 && b === 168) ||
    // 127.x.x.x (loopback)
    a === 127
  )
}
