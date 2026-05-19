// icons.jsx — SF Symbols-inspired line icons for AdSmart
// All icons render at currentColor; size via the `s` prop.

const Ic = ({ d, s = 20, sw = 1.6, fill = 'none', children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0, display: 'block' }}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IconHome = (p) => <Ic {...p} d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.5z" />;
const IconPlug = (p) => <Ic {...p}><path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 01-10 0V9zM12 17v4" /></Ic>;
const IconReport = (p) => <Ic {...p}><path d="M5 3h11l3 3v15a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M8 13h8M8 17h5M8 9h4" /></Ic>;
const IconTemplate = (p) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M3 9h18M9 9v12" /></Ic>;
const IconSettings = (p) => <Ic {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /></Ic>;
const IconShield = (p) => <Ic {...p} d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />;
const IconWallet = (p) => <Ic {...p}><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M3 10h18M16 15h2" /></Ic>;
const IconUser = (p) => <Ic {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></Ic>;
const IconMail = (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></Ic>;
const IconPhone = (p) => <Ic {...p} d="M5 4h3l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />;
const IconLock = (p) => <Ic {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Ic>;
const IconChevR = (p) => <Ic {...p} d="M9 5l7 7-7 7" />;
const IconChevL = (p) => <Ic {...p} d="M15 5l-7 7 7 7" />;
const IconChevD = (p) => <Ic {...p} d="M5 9l7 7 7-7" />;
const IconChevU = (p) => <Ic {...p} d="M5 15l7-7 7 7" />;
const IconClose = (p) => <Ic {...p} d="M6 6l12 12M18 6L6 18" />;
const IconPlus = (p) => <Ic {...p} d="M12 5v14M5 12h14" />;
const IconSearch = (p) => <Ic {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Ic>;
const IconCheck = (p) => <Ic {...p} d="M4 12l5 5L20 6" />;
const IconCheckCircle = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></Ic>;
const IconArrowUp = (p) => <Ic {...p} d="M12 19V5M5 12l7-7 7 7" />;
const IconArrowDown = (p) => <Ic {...p} d="M12 5v14M19 12l-7 7-7-7" />;
const IconTrendUp = (p) => <Ic {...p} d="M3 17l6-6 4 4 8-8M14 7h7v7" />;
const IconGlobe = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></Ic>;
const IconMoon = (p) => <Ic {...p} d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />;
const IconSun = (p) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Ic>;
const IconLogout = (p) => <Ic {...p}><path d="M16 17l5-5-5-5M21 12H9M13 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v16a1 1 0 001 1h8a1 1 0 001-1v-1" /></Ic>;
const IconCalendar = (p) => <Ic {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Ic>;
const IconCard = (p) => <Ic {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></Ic>;
const IconDoc = (p) => <Ic {...p}><path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></Ic>;
const IconBell = (p) => <Ic {...p}><path d="M6 9a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0" /></Ic>;
const IconHeadset = (p) => <Ic {...p}><path d="M4 13a8 8 0 0116 0v5a2 2 0 01-2 2h-2v-7h4M4 13v5a2 2 0 002 2h2v-7H4" /></Ic>;
const IconMore = (p) => <Ic {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Ic>;
const IconFilter = (p) => <Ic {...p} d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />;
const IconLink = (p) => <Ic {...p} d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" />;
const IconRefresh = (p) => <Ic {...p}><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" /></Ic>;
const IconWarning = (p) => <Ic {...p}><path d="M12 3l10 17H2L12 3z" /><path d="M12 10v5M12 18v.5" /></Ic>;
const IconInbox = (p) => <Ic {...p}><path d="M3 13l3-9h12l3 9v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /><path d="M3 13h5l1 2h6l1-2h5" /></Ic>;
const IconSparkle = (p) => <Ic {...p}><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" /></Ic>;
const IconGoogle = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'block' }}>
    <path fill="#FBBC05" d="M5.5 12c0-1 .2-1.9.5-2.8V6.4H2.7A10 10 0 002 12c0 1.9.5 3.7 1.3 5.2l3.2-2.6c-.3-.8-.5-1.7-.5-2.6z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3-3A10 10 0 002 6.4l3.3 2.8a6.6 6.6 0 016.7-4.8z" />
    <path fill="#34A853" d="M12 18.6a6.6 6.6 0 01-6.7-4.7l-3.2 2.5A10 10 0 0012 22c2.6 0 5-.9 6.8-2.5L15.6 17a6.4 6.4 0 01-3.6 1.6z" />
    <path fill="#4285F4" d="M22 12c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.3 1.3-1 2.4-2 3.2l3.2 2.5A10 10 0 0022 12z" />
  </svg>
);
const IconMeta = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 287 191" style={{ flexShrink: 0, display: 'block' }}>
    <defs>
      <linearGradient id={`metaA-${s}`} x1="62" y1="101" x2="260" y2="91" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0064E0"/>
        <stop offset="0.4" stopColor="#0082FB"/>
      </linearGradient>
      <linearGradient id={`metaB-${s}`} x1="41" y1="53" x2="41" y2="126" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0082FB"/>
        <stop offset="1" stopColor="#0064E0"/>
      </linearGradient>
    </defs>
    <path fill="#0081FB" d="M31 126c0 11 2 19 6 24a19 19 0 0016 9c8 0 16-2 30-22 11-15 25-38 34-52l15-24c11-16 23-35 37-47 14-13 26-19 39-19 21 0 41 12 56 35 17 25 25 57 25 89 0 20-4 34-10 45-7 11-19 22-39 22v-31c17 0 22-16 22-35 0-26-6-55-20-77-9-15-22-24-36-24-15 0-27 11-40 31-7 11-14 24-23 38l-9 16c-18 32-23 40-32 52-13 17-26 25-44 25-21 0-35-9-43-23C3 157 0 142 0 125z"/>
    <path fill={`url(#metaA-${s})`} d="M24 37C39 15 59 0 83 0c14 0 27 4 41 16 16 12 32 34 53 68l7 12c18 30 28 45 34 52 7 9 13 12 20 12 18 0 22-16 22-35l27-1c0 19-4 34-10 45-7 11-19 22-39 22-13 0-24-3-37-15-10-9-21-25-30-40L146 94c-13-22-25-38-32-45-7-8-17-17-32-17-12 0-23 9-32 22z"/>
    <path fill={`url(#metaB-${s})`} d="M82 31c-12 0-23 9-32 22C38 72 31 100 31 126c0 11 2 19 6 24L10 168C3 157 0 142 0 125 0 94 8 62 24 37 39 15 59 0 83 0z"/>
  </svg>
);

Object.assign(window, {
  IconHome, IconPlug, IconReport, IconTemplate, IconSettings, IconShield,
  IconWallet, IconUser, IconMail, IconPhone, IconLock,
  IconChevR, IconChevL, IconChevD, IconChevU,
  IconClose, IconPlus, IconSearch, IconCheck, IconCheckCircle,
  IconArrowUp, IconArrowDown, IconTrendUp,
  IconGlobe, IconMoon, IconSun, IconLogout, IconCalendar, IconCard,
  IconDoc, IconBell, IconHeadset, IconMore, IconFilter, IconLink,
  IconRefresh, IconWarning, IconInbox, IconSparkle,
  IconGoogle, IconMeta,
});
