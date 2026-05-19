// charts.jsx — Reusable chart components for AdSmart
// Pure SVG, theme-aware via CSS vars (--chart-1..4).

// ────────────────────────────────────────────────────────────────────────────
// AreaChart — smooth area + line, with optional gridlines and axis hints
// ────────────────────────────────────────────────────────────────────────────
function AreaChart({
  data = [12,18,15,22,28,24,32,38,35,42,48,45,52,58,62],
  width = 320, height = 140,
  showAxis = true,
  padX = 8, padY = 12,
  gradientId,
}) {
  const w = width, h = height;
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const id = gradientId || `ac-${Math.random().toString(36).slice(2,7)}`;

  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (w - 2*padX);
    const y = h - padY - ((v - min) / (max - min || 1)) * (h - 2*padY);
    return [x, y];
  });

  // smooth path (Catmull-Rom-ish via simple cubic)
  const smooth = (points) => {
    if (points.length < 2) return '';
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return d;
  };

  const linePath = smooth(pts);
  const areaPath = `${linePath} L${pts[pts.length-1][0]},${h - padY} L${pts[0][0]},${h - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="var(--chart-1)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {showAxis && [0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={padX} x2={w - padX} y1={padY + p*(h - 2*padY)} y2={padY + p*(h - 2*padY)}
              stroke="var(--separator)" strokeDasharray="2 4" />
      ))}
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke="var(--chart-1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* end dot */}
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4" fill="var(--bg)" stroke="var(--chart-1)" strokeWidth="2.5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BarChart — grouped or single
// ────────────────────────────────────────────────────────────────────────────
function BarChart({
  data = [3,5,4,7,6,9,8,11,9,12,10,14],
  width = 320, height = 120,
  labels,
}) {
  const max = Math.max(...data);
  const w = width, h = height;
  const padTop = 14, padBottom = labels ? 20 : 8;
  const padX = 10;
  const innerW = w - 2*padX;
  const barW = innerW / data.length - 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const x = padX + i * (innerW / data.length) + 2;
        const barH = ((v / max) * (h - padTop - padBottom));
        const y = h - padBottom - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="3"
                  fill={i === data.length - 1 ? 'var(--chart-1)' : 'var(--chart-3)'} />
            {labels && (
              <text x={x + barW/2} y={h - 4} textAnchor="middle"
                    fontSize="9" fill="var(--text-3)" fontWeight="500">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Donut — categorical breakdown
// ────────────────────────────────────────────────────────────────────────────
function Donut({ segments = [{v: 60, c: 'var(--chart-1)'}, {v: 25, c: 'var(--chart-2)'}, {v: 15, c: 'var(--chart-3)'}], size = 120, stroke = 14, center }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.v, 0);
  let acc = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--chart-4)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const pct = s.v / total;
          const length = c * pct;
          const offset = c * (acc / total);
          acc += s.v;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={s.c} strokeWidth={stroke}
                    strokeDasharray={`${length} ${c - length}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt" />
          );
        })}
      </svg>
      {center && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 0,
        }}>
          {center}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stat card with delta + sparkline
// ────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaPos = true, data = [4,7,5,9,6,12,8,14,11,16,13,18], icon }) {
  return (
    <div style={{
      padding: 14, borderRadius: 14,
      background: 'var(--bg-elev)', border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 8,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
        {icon}
        <span className="t-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
          {delta && (
            <div style={{
              fontSize: 11, fontWeight: 600, marginTop: 6,
              color: deltaPos ? 'var(--success)' : 'var(--danger)',
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              {deltaPos ? <IconArrowUp s={11} sw={2.5} /> : <IconArrowDown s={11} sw={2.5} />}
              {delta}
            </div>
          )}
        </div>
        <div style={{ width: 70, height: 32, opacity: 0.9 }}>
          <Sparkline data={data} w={70} h={32} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AreaChart, BarChart, Donut, StatCard });
