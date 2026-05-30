interface IconProps {
  className?: string
  size?: number
  color?: string
}

export const SearchIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
    <path
      d="M16.5303 15.4697L16 14.9393L14.9393 16L15.4697 16.5303L16.5303 15.4697ZM18.9697 20.0303C19.2626 20.3232 19.7374 20.3232 20.0303 20.0303C20.3232 19.7374 20.3232 19.2626 20.0303 18.9697L18.9697 20.0303ZM16 16L15.4697 16.5303L18.9697 20.0303L19.5 19.5L20.0303 18.9697L16.5303 15.4697L16 16Z"
      fill={color}
    />
  </svg>
)

export const ChevronLeftIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M15 6L8.89802 11.6326C8.68354 11.8306 8.68354 12.1694 8.89802 12.3674L15 18"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const ChevronRightIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M9 18L15.102 12.3674C15.3165 12.1694 15.3165 11.8306 15.102 11.6326L9 6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const HomeIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M10 21H5C3.89543 21 3 20.1046 3 19V12.2969C3 11.7852 3.19615 11.2929 3.54809 10.9215L10.5481 3.53257C11.3369 2.69989 12.663 2.69989 13.4519 3.53257L20.4519 10.9215C20.8038 11.2929 21 11.7852 21 12.2969V19C21 20.1046 20.1046 21 19 21H14M10 21V15.5C10 15.2239 10.2239 15 10.5 15H13.5C13.7761 15 14 15.2239 14 15.5V21M10 21H14"
      stroke={color}
      strokeWidth="1.5"
    />
  </svg>
)

export const IntegrationsIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M18.1559 5.58354H16.1719V0.833133C16.1719 0.37291 15.7942 0 15.328 0C14.8618 0 14.484 0.37291 14.484 0.833133V5.58354H10.5158V0.833133C10.5158 0.37291 10.1381 0 9.67181 0C9.20572 0 8.82785 0.37291 8.82785 0.833133V5.58354H6.84397C6.37776 5.58354 6 5.95645 6 6.41668V12C6 15.2555 8.46956 17.9506 11.6563 18.3606V23.1669C11.6563 23.6271 12.0339 24 12.5002 24C12.9663 24 13.3442 23.6271 13.3442 23.1669V18.3606C16.5306 17.9507 19 15.2555 19 12V6.41668C18.9999 5.95645 18.6221 5.58354 18.1559 5.58354ZM17.312 11.9999C17.312 14.6191 15.1533 16.7501 12.5001 16.7501C9.84657 16.7501 7.68782 14.6191 7.68782 11.9999V7.24981H17.3118L17.312 11.9999Z"
      fill={color}
    />
  </svg>
)

export const ReportsIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M8.65526 20.4135H14.0346C18.5173 20.4135 20.3104 18.6204 20.3104 14.1376V8.75828C20.3104 4.27553 18.5173 2.48242 14.0346 2.48242H8.65526C4.1725 2.48242 2.37939 4.27553 2.37939 8.75828V14.1376C2.37939 18.6204 4.1725 20.4135 8.65526 20.4135Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.55189 9.20656C10.5381 9.20656 11.345 8.39966 11.345 7.41346V4.27553C11.345 3.28932 10.5381 2.48242 9.55189 2.48242C8.56569 2.48242 7.75879 3.28932 7.75879 4.27553V7.41346C7.75879 8.39966 8.55672 9.20656 9.55189 9.20656Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.9308 14.1376C15.917 14.1376 16.7239 13.3307 16.7239 12.3445V4.27553C16.7239 3.28932 15.917 2.48242 14.9308 2.48242C13.9446 2.48242 13.1377 3.28932 13.1377 4.27553V12.3445C13.1377 13.3307 13.9356 14.1376 14.9308 14.1376Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const NotificationIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M7.2798 10.0666C7.48379 7.58099 9.58399 5.60569 12.0779 5.59042C14.5491 5.57528 16.5667 7.53275 16.8167 9.99132C16.9708 11.5062 17.3972 12.9016 18.2536 14.387C19.1227 15.8946 18.1938 18 16.4536 18H7.70451C5.95987 18 5.05178 15.842 5.93027 14.3347C6.77156 12.8912 7.15964 11.5309 7.2798 10.0666Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <path d="M12 3V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18"
      stroke={color}
      strokeWidth="1.5"
    />
  </svg>
)

export const LogoutIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M10 12L19 12M19 12L17 10M19 12L17 14M15 16V19C15 20.1046 14.1046 21 13 21H7C5.89543 21 5 20.1046 5 19L5 5C5 3.89543 5.89543 3 7 3L13 3C14.1046 3 15 3.89543 15 5V8"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const SunIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" />
    <path d="M12 19.5V22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 2V4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4.5 12L2 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M22 12L19.5 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M17.3032 6.69678L19.071 4.92901"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.92896 19.0713L6.69672 17.3035"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17.3032 17.3032L19.071 19.071"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.92896 4.92871L6.69672 6.69648"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const MoonIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.9562 15.1359C16.4234 14.8673 14.8947 13.7416 13.9736 12.0223C12.8847 9.98963 12.9628 7.72039 14.0142 6.27944C14.122 6.13175 14.24 5.99276 14.368 5.86362C14.6149 5.61455 14.5435 5.14979 14.1963 5.09307C13.9699 5.05608 13.7399 5.02981 13.5067 5.01481C13.354 5.00499 13.2 5 13.0447 5C9.15403 5 6 8.13401 6 12C6 15.866 9.15403 19 13.0447 19C15.2587 19 17.2342 17.9852 18.5256 16.3981C18.6724 16.2178 18.8103 16.0301 18.9387 15.8356C19.1217 15.5585 18.8679 15.2066 18.5345 15.1961C18.3425 15.19 18.1493 15.1697 17.9562 15.1359Z"
      stroke={color}
      strokeWidth="1.5"
    />
  </svg>
)

export const FinanceIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M10.7516 16.8604V18.8904C10.7516 20.6104 9.15158 22.0004 7.18158 22.0004C5.21158 22.0004 3.60156 20.6104 3.60156 18.8904V16.8604C3.60156 18.5804 5.20158 19.8004 7.18158 19.8004C9.15158 19.8004 10.7516 18.5704 10.7516 16.8604Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.7498 14.1097C10.7498 14.6097 10.6098 15.0697 10.3698 15.4697C9.77981 16.4397 8.5698 17.0497 7.1698 17.0497C5.7698 17.0497 4.55979 16.4297 3.96979 15.4697C3.72979 15.0697 3.58984 14.6097 3.58984 14.1097C3.58984 13.2497 3.98982 12.4797 4.62982 11.9197C5.27982 11.3497 6.16979 11.0098 7.15979 11.0098C8.14979 11.0098 9.03982 11.3597 9.68982 11.9197C10.3498 12.4697 10.7498 13.2497 10.7498 14.1097Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.7516 14.11V16.86C10.7516 18.58 9.15158 19.8 7.18158 19.8C5.21158 19.8 3.60156 18.57 3.60156 16.86V14.11C3.60156 12.39 5.20158 11 7.18158 11C8.17158 11 9.06161 11.35 9.71161 11.91C10.3516 12.47 10.7516 13.25 10.7516 14.11Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22.0002 10.9702V13.0302C22.0002 13.5802 21.5602 14.0302 21.0002 14.0502H19.0402C17.9602 14.0502 16.9702 13.2602 16.8802 12.1802C16.8202 11.5502 17.0602 10.9602 17.4802 10.5502C17.8502 10.1702 18.3602 9.9502 18.9202 9.9502H21.0002C21.5602 9.9702 22.0002 10.4202 22.0002 10.9702Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 10.5V8.5C2 5.78 3.64 3.88 6.19 3.56C6.45 3.52 6.72 3.5 7 3.5H16C16.26 3.5 16.51 3.50999 16.75 3.54999C19.33 3.84999 21 5.76 21 8.5V9.95001H18.92C18.36 9.95001 17.85 10.17 17.48 10.55C17.06 10.96 16.82 11.55 16.88 12.18C16.97 13.26 17.96 14.05 19.04 14.05H21V15.5C21 18.5 19 20.5 16 20.5H13.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SettingsIcon = ({ className, size = 24, color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
