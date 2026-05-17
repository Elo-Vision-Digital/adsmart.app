interface LogoProps {
  variant?: 'black' | 'white'
  className?: string
}

export function Logo({ variant = 'black', className = '' }: LogoProps) {
  const logoUrls = {
    black: 'https://i.imgur.com/T6AehDg.png',
    white: 'https://i.imgur.com/CPDcfYm.png',
  }

  return (
    <img
      src={logoUrls[variant]}
      alt="adsmart"
      className={className}
      onError={(e) => {
        // Fallback para SVG se a imagem não carregar
        e.currentTarget.style.display = 'none'
        const svg = document.createElement('div')
        svg.innerHTML = `<svg viewBox="0 0 200 60" class="${className}">
          <text x="50%" y="50%" font-family="Montserrat, sans-serif" font-size="32" font-weight="700" 
            text-anchor="middle" dominant-baseline="middle" fill="${variant === 'black' ? '#000' : '#FFF'}">
            adsmart
          </text>
        </svg>`
        e.currentTarget.parentNode?.appendChild(svg.firstChild as Node)
      }}
    />
  )
}
