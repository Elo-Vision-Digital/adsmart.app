// laptop-mock.jsx — Notebook illustration with a live-looking dashboard inside
// Used as preview image for every template card. 4 kinds:
//   growth   — ascending area chart + KPI cards (lançamento Google)
//   audience — donut + demographic bars (lançamento Meta)
//   geo      — map silhouette with pins + city ranking (locais Google)
//   funnel   — conversion funnel bars (locais Meta)

function LaptopMock({ kind = 'growth', dark = false }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`lm-bg-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bg-elev-2)"/>
          <stop offset="100%" stopColor="var(--bg-elev)"/>
        </linearGradient>
        <linearGradient id={`lm-fill-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={`lm-key-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--text)" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="var(--text)" stopOpacity="0.22"/>
        </linearGradient>
      </defs>

      {/* Ambient backdrop */}
      <rect width="320" height="180" fill={`url(#lm-bg-${kind})`}/>

      {/* Soft glow behind laptop */}
      <ellipse cx="160" cy="100" rx="130" ry="40"
               fill="var(--chart-1)" opacity="0.05"/>

      {/* Shadow under laptop */}
      <ellipse cx="160" cy="166" rx="118" ry="3.5" fill="rgba(0,0,0,0.18)"/>

      {/* Keyboard base (trapezoid) */}
      <path d="M28 150 L292 150 L302 160 L18 160 Z" fill={`url(#lm-key-${kind})`}/>
      <line x1="28" y1="150" x2="292" y2="150" stroke="var(--border-strong)" strokeWidth="0.5"/>
      <rect x="143" y="153" width="34" height="2" rx="1" fill="var(--text-3)" opacity="0.7"/>

      {/* Screen outer bezel — fixed dark frame so it reads as a laptop in both themes */}
      <rect x="38" y="18" width="244" height="134" rx="6" fill="#1F1F23"/>
      {/* Screen body */}
      <rect x="41" y="21" width="238" height="128" rx="4" fill="var(--bg)"/>

      {/* Window chrome */}
      <rect x="41" y="21" width="238" height="14" rx="4" fill="var(--bg-elev)"/>
      <circle cx="49" cy="28" r="2" fill="#FF5F57"/>
      <circle cx="56" cy="28" r="2" fill="#FEBC2E"/>
      <circle cx="63" cy="28" r="2" fill="#28C840"/>
      <rect x="130" y="24.5" width="60" height="7" rx="3" fill="var(--bg-elev-2)"/>

      {/* Sidebar */}
      <rect x="41" y="35" width="34" height="114" fill="var(--bg-elev)"/>
      <circle cx="58" cy="45" r="2.5" fill="var(--chart-1)"/>
      <rect x="48" y="56" width="20" height="2.5" rx="1" fill="var(--text)" opacity="0.7"/>
      {[68, 80, 92, 104, 116].map(y => (
        <rect key={y} x="48" y={y} width="20" height="2" rx="1" fill="var(--text-3)" opacity="0.5"/>
      ))}
      <circle cx="58" cy="138" r="3" fill="var(--bg-elev-2)" stroke="var(--text-3)" strokeWidth="0.5"/>

      {/* Content area */}
      <g transform="translate(82, 40)">
        {kind === 'growth'   && <LMGrowth />}
        {kind === 'audience' && <LMAudience />}
        {kind === 'geo'      && <LMGeo />}
        {kind === 'funnel'   && <LMFunnel />}
      </g>
    </svg>
  );
}

// ─── Growth dashboard (Lançamento Google) ──────────────────────────────────
function LMGrowth() {
  return (
    <>
      {/* Page title */}
      <rect x="0" y="0" width="56" height="5" rx="2" fill="var(--text)"/>
      <rect x="0" y="8" width="80" height="2.5" rx="1.5" fill="var(--text-3)" opacity="0.6"/>
      {/* Date filter */}
      <rect x="160" y="-1" width="32" height="8" rx="4" fill="var(--bg-elev)"/>
      <rect x="164" y="2" width="6" height="2" rx="1" fill="var(--text)" opacity="0.8"/>

      {/* KPI cards */}
      {[
        { x: 0,   pct: 80, color: 'var(--chart-1)' },
        { x: 66,  pct: 65, color: 'var(--chart-3)' },
        { x: 132, pct: 92, color: 'var(--chart-1)' },
      ].map((k, i) => (
        <g key={i}>
          <rect x={k.x} y="16" width="60" height="22" rx="2.5" fill="var(--bg-elev)"/>
          <rect x={k.x + 4} y="20" width="14" height="2" rx="1" fill="var(--text-3)" opacity="0.6"/>
          <rect x={k.x + 4} y="25" width="24" height="5" rx="1" fill="var(--text)"/>
          <rect x={k.x + 4} y="33" width={12 + i*4} height="2" rx="1" fill={k.color}/>
        </g>
      ))}

      {/* Big chart */}
      <rect x="0" y="44" width="192" height="58" rx="3" fill="var(--bg-elev)"/>
      {/* Gridlines */}
      {[55, 68, 81, 94].map(y => (
        <line key={y} x1="6" y1={y} x2="186" y2={y} stroke="var(--border)" strokeDasharray="1 2" opacity="0.5"/>
      ))}
      {/* Area + line (rising) */}
      <path d="M6,96 C24,86 40,80 60,68 C82,56 100,60 120,46 C142,32 160,28 186,18 L186,99 L6,99 Z"
            fill="url(#lm-fill-growth)"/>
      <path d="M6,96 C24,86 40,80 60,68 C82,56 100,60 120,46 C142,32 160,28 186,18"
            fill="none" stroke="var(--chart-1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      {/* End dot */}
      <circle cx="186" cy="18" r="2.5" fill="var(--bg)" stroke="var(--chart-1)" strokeWidth="1.5"/>
      {/* Scaling arrow badge */}
      <g transform="translate(172, 52)">
        <rect x="-12" y="-5" width="24" height="10" rx="5" fill="var(--chart-1)"/>
        <path d="M-7 1 L-4 -2 L-1 1" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round"/>
        <rect x="2" y="-1" width="8" height="2" rx="0.5" fill="white"/>
      </g>
    </>
  );
}

// ─── Audience dashboard (Lançamento Meta) ──────────────────────────────────
function LMAudience() {
  return (
    <>
      <rect x="0" y="0" width="60" height="5" rx="2" fill="var(--text)"/>
      <rect x="0" y="8" width="80" height="2.5" rx="1.5" fill="var(--text-3)" opacity="0.6"/>

      {/* Donut card */}
      <rect x="0" y="16" width="76" height="86" rx="3" fill="var(--bg-elev)"/>
      <rect x="4" y="20" width="22" height="2.5" rx="1" fill="var(--text)" opacity="0.7"/>
      <g transform="translate(38, 64)">
        <circle r="22" fill="none" stroke="var(--chart-4)" strokeWidth="6"/>
        {/* 62% slice */}
        <circle r="22" fill="none" stroke="var(--chart-1)" strokeWidth="6"
                strokeDasharray="86 138" transform="rotate(-90)" strokeLinecap="round"/>
        <text textAnchor="middle" y="3" fontSize="8" fontWeight="700" fill="var(--text)">62%</text>
      </g>
      {/* Legend */}
      <g transform="translate(4, 92)">
        <circle cx="2" cy="2" r="1.5" fill="var(--chart-1)"/>
        <rect x="6" y="1" width="18" height="2" rx="1" fill="var(--text-3)" opacity="0.6"/>
        <circle cx="38" cy="2" r="1.5" fill="var(--chart-3)"/>
        <rect x="42" y="1" width="18" height="2" rx="1" fill="var(--text-3)" opacity="0.6"/>
      </g>

      {/* Demographic bars card */}
      <rect x="82" y="16" width="110" height="86" rx="3" fill="var(--bg-elev)"/>
      <rect x="86" y="20" width="32" height="2.5" rx="1" fill="var(--text)" opacity="0.7"/>
      <rect x="86" y="25" width="22" height="2" rx="1" fill="var(--text-3)" opacity="0.5"/>
      {[
        { l: '18-24', v: 38, sub: 17 },
        { l: '25-34', v: 78, sub: 26 },
        { l: '35-44', v: 58, sub: 19 },
        { l: '45-54', v: 32, sub: 11 },
        { l: '55+',   v: 22, sub: 8  },
      ].map((b, i) => (
        <g key={i} transform={`translate(86, ${36 + i*11})`}>
          <rect x="0" y="2" width="14" height="2" rx="0.5" fill="var(--text-3)" opacity="0.7"/>
          <rect x="18" y="1.5" width="80" height="3.5" rx="1.5" fill="var(--bg)"/>
          <rect x="18" y="1.5" width={b.v * 0.8} height="3.5" rx="1.5"
                fill={i === 1 ? 'var(--chart-1)' : 'var(--chart-3)'}/>
        </g>
      ))}
    </>
  );
}

// ─── Geo dashboard (Negócios Locais Google) ────────────────────────────────
function LMGeo() {
  const pins = [
    { x: 50, y: 28, sz: 5 },
    { x: 70, y: 38, sz: 7 },  // SP biggest
    { x: 42, y: 48, sz: 4 },
    { x: 78, y: 58, sz: 5 },
    { x: 58, y: 64, sz: 5 },
    { x: 64, y: 22, sz: 4 },
  ];
  return (
    <>
      <rect x="0" y="0" width="56" height="5" rx="2" fill="var(--text)"/>
      <rect x="0" y="8" width="80" height="2.5" rx="1.5" fill="var(--text-3)" opacity="0.6"/>

      {/* Map card */}
      <rect x="0" y="16" width="128" height="86" rx="3" fill="var(--bg-elev)"/>
      {/* Stylized Brazil silhouette */}
      <g transform="translate(8, 22)">
        <path d="M28 8 L48 4 L70 8 L82 18 L88 30 L86 44 L82 56 L72 66 L60 72 L44 70 L32 64 L22 54 L18 42 L20 28 L24 16 Z"
              fill="var(--bg)" stroke="var(--text-3)" strokeWidth="0.6" opacity="0.8"/>
        {/* Regional shading */}
        <path d="M48 16 L70 14 L78 22 L72 32 L60 30 L50 24 Z" fill="var(--chart-1)" opacity="0.15"/>
        <path d="M40 36 L62 36 L70 46 L60 56 L46 56 L38 48 Z" fill="var(--chart-1)" opacity="0.2"/>
        {/* Pins */}
        {pins.map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${p.y})`}>
            <circle r={p.sz + 2.5} fill="var(--chart-1)" opacity="0.15"/>
            <circle r={p.sz} fill="var(--chart-1)"/>
            <circle r={Math.max(1, p.sz - 2.5)} fill="var(--bg)"/>
          </g>
        ))}
      </g>

      {/* Right column: city ranking */}
      <g transform="translate(134, 16)">
        <rect x="0" y="0" width="58" height="86" rx="3" fill="var(--bg-elev)"/>
        <rect x="4" y="5" width="22" height="2.5" rx="1" fill="var(--text)" opacity="0.7"/>
        {[
          { c: 'SP', v: 92 },
          { c: 'RJ', v: 68 },
          { c: 'MG', v: 54 },
          { c: 'BSB',v: 42 },
          { c: 'POA',v: 32 },
        ].map((c, i) => (
          <g key={i} transform={`translate(4, ${13 + i*14})`}>
            <rect x="0" y="0" width="50" height="11" rx="1.5" fill="var(--bg)"/>
            <rect x="2" y="2" width="12" height="2.5" rx="0.5" fill="var(--text)" opacity="0.8"/>
            <rect x="2" y="6.5" width={c.v * 0.36} height="2" rx="1" fill="var(--chart-1)"/>
          </g>
        ))}
      </g>
    </>
  );
}

// ─── Funnel dashboard (Negócios Locais Meta) ───────────────────────────────
function LMFunnel() {
  return (
    <>
      <rect x="0" y="0" width="56" height="5" rx="2" fill="var(--text)"/>
      <rect x="0" y="8" width="80" height="2.5" rx="1.5" fill="var(--text-3)" opacity="0.6"/>

      {/* Side: KPI strip */}
      <g transform="translate(0, 16)">
        {['2.4M', '380K', '84K'].map((v, i) => (
          <g key={i} transform={`translate(${i*54}, 0)`}>
            <rect width="50" height="20" rx="2.5" fill="var(--bg-elev)"/>
            <rect x="4" y="4" width="14" height="2" rx="0.5" fill="var(--text-3)" opacity="0.5"/>
            <text x="4" y="15" fontSize="6.5" fontWeight="700" fill="var(--text)">{v}</text>
          </g>
        ))}
      </g>

      {/* Funnel card */}
      <rect x="0" y="42" width="192" height="60" rx="3" fill="var(--bg-elev)"/>
      <rect x="4" y="46" width="32" height="2.5" rx="1" fill="var(--text)" opacity="0.7"/>
      {[
        { w: 172, op: 1.00, label: '2.4M' },
        { w: 138, op: 0.78, label: '380K' },
        { w: 100, op: 0.58, label: '84K' },
        { w: 64,  op: 0.42, label: '4.2K' },
        { w: 32,  op: 0.28, label: '840' },
      ].map((b, i) => (
        <g key={i} transform={`translate(${10 + (172 - b.w)/2}, ${54 + i*8})`}>
          <rect width={b.w} height="6" rx="2" fill="var(--chart-1)" opacity={b.op}/>
          <text x={b.w + 4} y="4.5" fontSize="5" fontWeight="600" fill="var(--text-2)">{b.label}</text>
        </g>
      ))}
    </>
  );
}

Object.assign(window, { LaptopMock });
