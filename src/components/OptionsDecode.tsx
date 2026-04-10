import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, TrendingUp, TrendingDown, Zap, Target, BarChart2,
  Globe, Star, Activity, ChevronRight, Info, RefreshCw, Layers
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Interval = '5m' | '15m' | '30m' | '1h' | '1D';
type Bias = 'strong-bull' | 'mild-bull' | 'neutral' | 'mild-bear' | 'strong-bear';

interface IntervalData {
  bias: Bias;
  callOI: number;
  putOI: number;
  callChange: number;
  putChange: number;
  netPosition: number; // positive = bullish, negative = bearish
  summary: string;
}

// ─── Mock data per interval ───────────────────────────────────────────────────
const INTERVAL_DATA: Record<Interval, IntervalData> = {
  '5m':  { bias: 'mild-bull',   callOI: 12.4, putOI: 10.1, callChange: +8.2,  putChange: -3.4, netPosition: +22,  summary: 'Short-term call unwinding with mild bullish buildup. Big players adding calls cautiously.' },
  '15m': { bias: 'strong-bull', callOI: 18.7, putOI: 11.2, callChange: +14.5, putChange: -8.1, netPosition: +67,  summary: 'Strong call buildup. Institutions buying calls aggressively — bullish momentum building.' },
  '30m': { bias: 'neutral',     callOI: 15.3, putOI: 15.1, callChange: +2.1,  putChange: +1.8, netPosition: +4,   summary: 'Balanced positioning. Big players are waiting — no clear directional bias yet.' },
  '1h':  { bias: 'mild-bear',   callOI: 9.8,  putOI: 13.6, callChange: -5.2,  putChange: +9.7, netPosition: -38,  summary: 'Put buildup visible. Institutions hedging or building short positions on hourly timeframe.' },
  '1D':  { bias: 'strong-bear', callOI: 8.2,  putOI: 19.4, callChange: -11.3, putChange: +18.2, netPosition: -82, summary: 'Heavy put buildup on daily TF. Big players have significant bearish positions — avoid longs.' },
};

const BIAS_CONFIG: Record<Bias, { label: string; color: string; glow: string; bg: string; angle: number; icon: typeof TrendingUp }> = {
  'strong-bull': { label: 'STRONG BULLISH', color: '#10b981', glow: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.1)',  angle: -70, icon: TrendingUp },
  'mild-bull':   { label: 'MILD BULLISH',   color: '#4ade80', glow: 'rgba(74,222,128,0.3)',  bg: 'rgba(74,222,128,0.08)', angle: -30, icon: TrendingUp },
  'neutral':     { label: 'NEUTRAL',        color: '#eab308', glow: 'rgba(234,179,8,0.3)',   bg: 'rgba(234,179,8,0.08)',  angle: 0,   icon: Activity },
  'mild-bear':   { label: 'MILD BEARISH',   color: '#f97316', glow: 'rgba(249,115,22,0.3)',  bg: 'rgba(249,115,22,0.08)', angle: 30,  icon: TrendingDown },
  'strong-bear': { label: 'STRONG BEARISH', color: '#ef4444', glow: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.1)',   angle: 70,  icon: TrendingDown },
};

// ─── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'apex',
    name: 'Option Apex',
    icon: Target,
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.25)',
    tag: 'PEAK ZONES',
    desc: 'Identifies peak Open Interest strike zones where big players have maximum exposure. These act as strong support or resistance levels.',
    bullets: ['Max Pain calculation', 'Peak OI strike mapping', 'Support/resistance via OI'],
  },
  {
    id: 'clock',
    name: 'Option Clock',
    icon: Clock,
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.25)',
    tag: 'TIME INTEL',
    desc: 'Time-based intelligence showing when big players build or unwind positions across different intraday windows (9:15–3:30).',
    bullets: ['Hourly OI change map', 'Position buildup timing', 'Smart money entry windows'],
  },
  {
    id: 'swing',
    name: 'Swing Spectrum',
    icon: BarChart2,
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.25)',
    tag: 'SWING SIGNALS',
    desc: 'Multi-timeframe swing trade signals based on institutional accumulation and distribution patterns across days to weeks.',
    bullets: ['3–10 day swing signals', 'Volume-price divergence', 'Institutional accumulation'],
  },
  {
    id: 'insider',
    name: 'Insider Strategy',
    icon: Star,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.25)',
    tag: 'SMART MONEY',
    desc: 'Tracks unusual options activity — large block trades, sudden spikes in OI, and abnormal IV changes that indicate informed trading.',
    bullets: ['Unusual OI spike alerts', 'Block trade detection', 'IV anomaly tracker'],
  },
  {
    id: 'sector',
    name: 'Sector Scope',
    icon: Globe,
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
    tag: 'SECTOR VIEW',
    desc: 'Sector-wise big player activity — see which sectors (IT, Bank, Auto, Pharma) institutions are bullish or bearish on.',
    bullets: ['NIFTY sectoral OI flow', 'FII/DII by sector', 'Rotation tracker'],
  },
  {
    id: 'pulse',
    name: 'Market Pulse',
    icon: Activity,
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.25)',
    tag: 'HEALTH CHECK',
    desc: 'Real-time market health dashboard — breadth, advance-decline, VIX movement, PCR trend, and FII net activity in one view.',
    bullets: ['Market breadth live', 'VIX & PCR trend', 'FII net activity tracker'],
  },
  {
    id: 'research',
    name: 'Quality Research',
    icon: Layers,
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.25)',
    tag: 'RESEARCH',
    desc: 'Curated, high-conviction trade setups vetted by quantitative models — only the best risk-reward setups make the cut.',
    bullets: ['Quantitative screener', 'Risk/reward ranked ideas', 'Weekly conviction picks'],
  },
];

// ─── Option Clock Visual ───────────────────────────────────────────────────────
const OptionClockVisual: React.FC<{ data: IntervalData; bias: typeof BIAS_CONFIG[Bias] }> = ({ data, bias }) => {
  const total = data.callOI + data.putOI;
  const callPct = (data.callOI / total) * 100;
  const putPct  = (data.putOI  / total) * 100;

  // SVG arc helpers
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const callEnd  = Math.round(callPct * 3.6);     // degrees
  const putStart = callEnd;
  const putEnd   = 360;
  const rotation = data.netPosition; // -100 to +100 → -90 to +90 deg needle

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
        <defs>
          <filter id="glow-clock">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1e2d3d" />
            <stop offset="100%" stopColor="#0a0e17" />
          </radialGradient>
        </defs>

        {/* Outer ring background */}
        <circle cx="110" cy="110" r="100" fill="url(#bg-grad)" stroke="#1e293b" strokeWidth="2" />

        {/* Call OI arc — green */}
        <path d={arc(110, 110, 88, 0, callEnd)} fill="none" stroke="#10b981" strokeWidth="14" strokeLinecap="round" filter="url(#glow-clock)" opacity="0.85" />

        {/* Put OI arc — red */}
        <path d={arc(110, 110, 88, putStart, putEnd)} fill="none" stroke="#ef4444" strokeWidth="14" strokeLinecap="round" filter="url(#glow-clock)" opacity="0.85" />

        {/* Inner decorative ring */}
        <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 8" />

        {/* Needle */}
        <g transform={`translate(110,110) rotate(${rotation * 0.9})`} style={{ transition: 'transform 1.2s cubic-bezier(.34,1.56,.64,1)' }}>
          <polygon points="-2.5,8 2.5,8 0,-62" fill={bias.color} />
          <circle cx="0" cy="0" r="10" fill="#0a0e17" stroke={bias.color} strokeWidth="2.5" />
          <circle cx="0" cy="0" r="4"  fill={bias.color} />
        </g>

        {/* Center text */}
        <text x="110" y="104" textAnchor="middle" fill={bias.color} fontSize="13" fontWeight="900" letterSpacing="1">{bias.label}</text>
        <text x="110" y="120" textAnchor="middle" fill="#64748b" fontSize="9"  fontWeight="600" letterSpacing="2">BIG PLAYER BIAS</text>

        {/* OI legend */}
        <circle cx="28"  cy="200" r="5" fill="#10b981" />
        <text   x="37"  y="204" fill="#94a3b8" fontSize="9.5" fontWeight="600">CALL OI {data.callOI}L</text>
        <circle cx="118" cy="200" r="5" fill="#ef4444" />
        <text   x="127" y="204" fill="#94a3b8" fontSize="9.5" fontWeight="600">PUT OI {data.putOI}L</text>
      </svg>
    </div>
  );
};

// ─── Feature Card ──────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{ f: typeof FEATURES[0] }> = ({ f }) => {
  const Icon = f.icon;
  return (
    <div
      className="group rounded-2xl border p-5 space-y-3 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{ background: `${f.color}08`, borderColor: `${f.color}30`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)` }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px ${f.glow}`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.3)`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}20` }}>
            <Icon className="w-5 h-5" style={{ color: f.color }} />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-100">{f.name}</div>
            <span className="text-[9px] font-bold tracking-[0.18em] px-1.5 py-0.5 rounded" style={{ color: f.color, background: `${f.color}18` }}>{f.tag}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
      <ul className="space-y-1">
        {f.bullets.map((b, i) => (
          <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
            <span style={{ color: f.color }} className="text-[8px]">◆</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const OptionsDecode: React.FC = () => {
  const [interval, setInterval]   = useState<Interval>('15m');
  const [refreshing, setRefreshing] = useState(false);

  const data  = INTERVAL_DATA[interval];
  const bias  = BIAS_CONFIG[data.bias];
  const BiasIcon = bias.icon;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const intervals: Interval[] = ['5m','15m','30m','1h','1D'];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-300 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/8 p-6"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, #12192b 50%, rgba(168,85,247,0.08) 100%)' }}>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full border"
                  style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.1)' }}>
                  Options Decode
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Decode the <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">Big Players'</span> Game Plan
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-lg leading-relaxed">
                See whether institutions and FIIs have built <strong className="text-emerald-400">bullish</strong> or <strong className="text-rose-400">bearish</strong> positions across different time intervals — before you take a trade.
              </p>
            </div>
            <div className="flex flex-col gap-2 items-start md:items-end text-xs shrink-0">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-slate-500">Features</div>
                  <div className="text-white font-black text-lg">7+</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500">Data Points</div>
                  <div className="text-white font-black text-lg">500+</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500">Accuracy</div>
                  <div className="text-emerald-400 font-black text-lg">78%</div>
                </div>
              </div>
              <div className="text-slate-600 text-[10px] tracking-wider">NSE F&O INTELLIGENCE PLATFORM</div>
            </div>
          </div>
        </div>

        {/* ── Option Clock Section ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Clock card */}
          <div className="bg-white/4 backdrop-blur border border-white/8 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-bold text-slate-200">Option Clock</span>
                <span className="text-[10px] text-slate-500 border border-slate-700/50 px-1.5 py-0.5 rounded">LIVE</span>
              </div>
              <button onClick={handleRefresh} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Interval selector */}
            <div className="flex gap-1.5">
              {intervals.map(iv => (
                <button
                  key={iv}
                  onClick={() => setInterval(iv)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                    interval === iv
                      ? 'border-sky-500/60 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                      : 'border-white/8 bg-white/4 text-slate-500 hover:text-slate-300 hover:bg-white/8'
                  }`}
                >
                  {iv}
                </button>
              ))}
            </div>

            {/* Clock visual */}
            <div className="flex justify-center py-2">
              <OptionClockVisual data={data} bias={bias} />
            </div>
          </div>

          {/* Position analysis */}
          <div className="space-y-4">
            {/* Bias pill */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: bias.bg, borderColor: `${bias.color}40` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${bias.color}20` }}>
                  <BiasIcon className="w-5 h-5" style={{ color: bias.color }} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold tracking-wider">BIG PLAYER BIAS · {interval}</div>
                  <div className="font-black text-lg" style={{ color: bias.color }}>{bias.label}</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>

              {/* Net position bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-rose-400 font-semibold">BEARISH</span>
                  <span className="text-slate-500">Net: {data.netPosition > 0 ? '+' : ''}{data.netPosition}</span>
                  <span className="text-emerald-400 font-semibold">BULLISH</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 border border-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.abs(data.netPosition) / 2}%`,
                      marginLeft: data.netPosition >= 0 ? '50%' : `${50 - Math.abs(data.netPosition) / 2}%`,
                      background: data.netPosition >= 0 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* OI stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Call OI', value: `${data.callOI}L`, change: data.callChange, color: '#10b981' },
                { label: 'Put OI',  value: `${data.putOI}L`,  change: data.putChange,  color: '#ef4444' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-4">
                  <div className="text-slate-500 text-xs font-semibold tracking-wider mb-1">{stat.label}</div>
                  <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                  <div className={`text-xs font-bold mt-0.5 ${stat.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stat.change >= 0 ? '▲' : '▼'} {Math.abs(stat.change)}% change
                  </div>
                </div>
              ))}
              <div className="col-span-2 bg-white/4 border border-white/8 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-500 font-semibold tracking-wider">SIGNAL INTERPRETATION</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.netPosition >= 50  && '✅ Strong bullish signal — consider buying calls or futures at dips.'}
                  {data.netPosition >= 10  && data.netPosition < 50 && '🟡 Mild bullish — wait for confirmation before entering call positions.'}
                  {data.netPosition > -10  && data.netPosition < 10 && '⚪ Neutral — avoid directional trades; use range strategies.'}
                  {data.netPosition <= -10 && data.netPosition > -50 && '🟠 Mild bearish — exercise caution; prefer put hedges.'}
                  {data.netPosition <= -50 && '🔴 Strong bearish — avoid buying calls; look for put opportunities.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature Cards ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/6" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-[0.2em] uppercase">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              Included Features
            </div>
            <div className="h-px flex-1 bg-white/6" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map(f => <FeatureCard key={f.id} f={f} />)}
          </div>
        </div>

        {/* ── CTA Banner ────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(56,189,248,0.08))' }}>
          <div className="text-slate-400 text-xs tracking-wider uppercase mb-1">Never miss another trade</div>
          <h2 className="text-xl font-black text-white">
            Be a <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">Profitable Trader</span> with Big Player Intelligence
          </h2>
          <p className="text-slate-500 text-xs mt-2">
            Options Decode · Option Apex · Option Clock · Swing Spectrum · Insider Strategy · Sector Scope · Market Pulse · Quality Research
          </p>
        </div>

      </div>
    </div>
  );
};

export default OptionsDecode;
