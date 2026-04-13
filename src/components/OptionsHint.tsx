import React, { useState } from 'react';
import { Info, TrendingUp, TrendingDown, Zap, Target, Clock, Shield, AlertTriangle, ChevronDown, Activity, Sparkles, BookOpen, ArrowRight, Flame } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StrategyCard {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  setup: string;
  when: string;
  maxProfit: string;
  maxLoss: string;
  idealIV: string;
  complexity: 1 | 2 | 3;
  legs: string[];
  payoffSvg: React.ReactNode;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STRATEGIES: StrategyCard[] = [
  {
    name: 'Bull Call Spread',
    type: 'bullish',
    setup: 'Buy lower strike CALL + Sell higher strike CALL (same expiry)',
    when: 'Moderately bullish; want to reduce premium cost vs naked call',
    maxProfit: 'Difference between strikes − net premium paid',
    maxLoss: 'Net premium paid (limited)',
    idealIV: 'Low to moderate IV — cheaper to buy',
    complexity: 2,
    legs: ['BUY 1 ATM Call', 'SELL 1 OTM Call'],
    payoffSvg: <path d="M 5 25 L 15 25 L 25 10 L 35 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Bear Put Spread',
    type: 'bearish',
    setup: 'Buy higher strike PUT + Sell lower strike PUT (same expiry)',
    when: 'Moderately bearish; defined risk trade on downside',
    maxProfit: 'Difference between strikes − net premium paid',
    maxLoss: 'Net premium paid (limited)',
    idealIV: 'Low to moderate IV',
    complexity: 2,
    legs: ['BUY 1 ATM Put', 'SELL 1 OTM Put'],
    payoffSvg: <path d="M 5 10 L 15 10 L 25 25 L 35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Iron Condor',
    type: 'neutral',
    setup: 'Sell OTM Call + Buy further OTM Call + Sell OTM Put + Buy further OTM Put',
    when: 'Market expected to stay range-bound; high IV (sell premium)',
    maxProfit: 'Net credit received upfront',
    maxLoss: 'Spread width − net credit',
    idealIV: 'High IV — sell expensive premium',
    complexity: 3,
    legs: ['SELL OTM Call', 'BUY far OTM Call', 'SELL OTM Put', 'BUY far OTM Put'],
    payoffSvg: <path d="M 5 25 L 10 25 L 15 10 L 25 10 L 30 25 L 35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Long Straddle',
    type: 'volatile',
    setup: 'Buy ATM Call + Buy ATM Put (same strike, same expiry)',
    when: 'Big move expected but direction unknown (earnings, RBI policy)',
    maxProfit: 'Unlimited (on breakout in either direction)',
    maxLoss: 'Total premium paid for both options',
    idealIV: 'Low IV — buy cheap before an event',
    complexity: 2,
    legs: ['BUY 1 ATM Call', 'BUY 1 ATM Put'],
    payoffSvg: <path d="M 5 10 L 20 25 L 35 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Short Strangle',
    type: 'neutral',
    setup: 'Sell OTM Call + Sell OTM Put (different strikes, same expiry)',
    when: 'Market expected range-bound; collect theta decay',
    maxProfit: 'Net credit received (limited)',
    maxLoss: 'Unlimited (naked legs — risky!)',
    idealIV: 'Very high IV — collect inflated premium',
    complexity: 3,
    legs: ['SELL OTM Call', 'SELL OTM Put'],
    payoffSvg: <path d="M 5 25 L 12 10 L 28 10 L 35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
  {
    name: 'Covered Call',
    type: 'bullish',
    setup: 'Own underlying stock + Sell OTM Call',
    when: 'Mildly bullish; generate income from existing stock holding',
    maxProfit: 'Strike price − buy price + premium received',
    maxLoss: 'Stock price − premium received (stock can fall)',
    idealIV: 'High IV — sell expensive call for more premium',
    complexity: 1,
    legs: ['HOLD stock', 'SELL OTM Call'],
    payoffSvg: <path d="M 5 30 L 20 10 L 35 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  },
];

const PCR_ZONES = [
  { range: '< 0.5', label: 'Extreme Bullishness / Top Signal', color: 'rgb(220,38,38)', bg: 'rgba(220,38,38,0.1)', hint: 'Too many bulls — contrarian BEARISH warning. Smart money may start shorting.' },
  { range: '0.5 – 0.7', label: 'Bullish Zone', color: 'rgb(249,115,22)', bg: 'rgba(249,115,22,0.1)', hint: 'More calls being written — mild bullish sentiment. Market likely trending up.' },
  { range: '0.7 – 1.0', label: 'Neutral / Balanced', color: 'rgb(234,179,8)', bg: 'rgba(234,179,8,0.1)', hint: 'Balanced put/call activity. Market is indecisive. Wait for direction.' },
  { range: '1.0 – 1.2', label: 'Bearish Zone', color: 'rgb(34,197,94)', bg: 'rgba(34,197,94,0.1)', hint: 'More puts being written — mild bearish sentiment. Support may hold.' },
  { range: '> 1.2', label: 'Extreme Fear / Bottom Signal', color: 'rgb(16,185,129)', bg: 'rgba(16,185,129,0.1)', hint: 'Too many bears — contrarian BULLISH reversal signal. Good time to look for longs.' },
];

const IV_TIPS = [
  { label: 'High IV (>20%)', icon: '🔥', action: 'SELL premium strategies', strategies: 'Iron Condor, Short Strangle, Covered Call', reason: 'High IV means options are expensive. Favor selling to collect inflated premiums that decay.', color: 'from-orange-500/20 to-red-500/5', border: 'border-orange-500/30', text: 'text-orange-400' },
  { label: 'Low IV (<12%)', icon: '❄️', action: 'BUY premium strategies', strategies: 'Long Straddle, Long Strangle, Debit Spreads', reason: 'Low IV means options are cheap. Favor buying before an expected event (earnings, policy).', color: 'from-blue-500/20 to-cyan-500/5', border: 'border-blue-500/30', text: 'text-blue-400' },
  { label: 'IV Crush Risk', icon: '⚠️', action: 'AVOID buying before events', strategies: 'Don\'t buy naked options just before earnings/events', reason: 'After big events, IV collapses even if price moves. Buy early or use spreads.', color: 'from-amber-500/20 to-yellow-500/5', border: 'border-amber-500/30', text: 'text-amber-400' },
];

const STRIKE_GUIDE = [
  { tag: 'ITM', full: 'In The Money', call: 'Strike < CMP', put: 'Strike > CMP', premium: '🔴 High', delta: 80, deltaText: '0.6 – 1.0', use: 'Near delta-1 exposure; less time decay risk; expensive', color: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-500/30', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' },
  { tag: 'ATM', full: 'At The Money', call: 'Strike ≈ CMP', put: 'Strike ≈ CMP', premium: '🟡 Medium', delta: 50, deltaText: '~0.5', use: 'Most liquid; highest gamma & theta; best for directional trades', color: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
  { tag: 'OTM', full: 'Out of The Money', call: 'Strike > CMP', put: 'Strike < CMP', premium: '🟢 Low', delta: 25, deltaText: '0.1 – 0.4', use: 'Cheap lottery tickets; high risk; use for spread legs or event plays', color: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
const typeConfig = {
  bullish:  { color: '#22c55e', gradient: 'from-emerald-500/10 to-emerald-900/5', border: 'border-emerald-500/30', label: 'BULLISH',  icon: TrendingUp, glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
  bearish:  { color: '#f87171', gradient: 'from-rose-500/10 to-rose-900/5', border: 'border-rose-500/30', label: 'BEARISH',  icon: TrendingDown, glow: 'drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' },
  neutral:  { color: '#60a5fa', gradient: 'from-blue-500/10 to-blue-900/5', border: 'border-blue-500/30', label: 'NEUTRAL',  icon: Target, glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' },
  volatile: { color: '#c084fc', gradient: 'from-purple-500/10 to-purple-900/5', border: 'border-purple-500/30', label: 'VOLATILE', icon: Zap, glow: 'drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' },
};

const StrategyCardComp: React.FC<{ s: StrategyCard }> = ({ s }) => {
  const [open, setOpen] = useState(false);
  const cfg = typeConfig[s.type];
  const Icon = cfg.icon;
  
  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl transition-all duration-500 cursor-pointer group bg-gradient-to-br ${cfg.gradient} ${cfg.border} overflow-hidden hover:scale-[1.02] hover:-translate-y-1 relative`}
      style={{ boxShadow: open ? `0 12px 40px ${cfg.color}20` : `0 4px 20px rgba(0,0,0,0.2)` }}
      onClick={() => setOpen(!open)}
    >
      {/* Background Glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-700`} style={{ background: cfg.color }} />
      
      <div className="p-6 flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-5 w-full">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-12 shadow-xl border border-white/5" style={{ background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}10)` }}>
            <Icon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="font-black text-slate-100 text-lg tracking-wide group-hover:text-white transition-colors truncate">{s.name}</div>
              <svg width="48" height="40" viewBox="0 0 40 35" className={`opacity-60 group-hover:opacity-100 transition-all duration-500 ${cfg.glow} group-hover:scale-110`} style={{ color: cfg.color }}>
                {s.payoffSvg}
              </svg>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-inner" style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
              <span className="text-xs text-slate-400 font-bold bg-black/20 px-3 py-1 rounded-lg border border-white/5 shadow-inner">
                <span className="text-amber-400">{'★'.repeat(s.complexity)}</span>
                <span className="text-slate-600">{'★'.repeat(3 - s.complexity)}</span> 
                <span className="ml-1.5 opacity-80">Complexity</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5 bg-black/20">
            
            {/* Legs */}
            <div className="flex flex-wrap gap-2.5">
              {s.legs.map((leg, i) => (
                <span key={i} className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 shadow-md flex items-center gap-2 hover:bg-white/10 transition-colors">
                  <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: leg.includes('BUY') ? '#22c55e' : leg.includes('SELL') ? '#f87171' : '#60a5fa', color: leg.includes('BUY') ? '#22c55e' : leg.includes('SELL') ? '#f87171' : '#60a5fa' }} />
                  {leg}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                <div className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> When to Use</div>
                <div className="text-slate-300 font-bold leading-relaxed">{s.when}</div>
              </div>
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                <div className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Ideal IV</div>
                <div className="text-slate-300 font-bold leading-relaxed">{s.idealIV}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/20 rounded-2xl p-4 border border-emerald-900/50 relative overflow-hidden group/profit shadow-lg">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/profit:opacity-100 transition-opacity duration-500" />
                <div className="text-emerald-500/80 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Max Profit</div>
                <div className="text-emerald-400 font-black text-sm relative z-10">{s.maxProfit}</div>
              </div>
              <div className="bg-gradient-to-br from-rose-950/60 to-rose-900/20 rounded-2xl p-4 border border-rose-900/50 relative overflow-hidden group/loss shadow-lg">
                <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover/loss:opacity-100 transition-opacity duration-500" />
                <div className="text-rose-500/80 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5"/> Max Loss</div>
                <div className="text-rose-400 font-black text-sm relative z-10">{s.maxLoss}</div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5 text-xs shadow-inner">
              <div className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Setup Explanation</div>
              <div className="text-slate-300 font-bold leading-relaxed">{s.setup}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const OptionsHint: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategies' | 'pcr' | 'iv' | 'strikes' | 'theta'>('strategies');

  const tabs = [
    { id: 'strategies', label: 'Strategies', icon: Target },
    { id: 'pcr',        label: 'PCR Guide',  icon: Activity },
    { id: 'iv',         label: 'IV Guide',   icon: Flame },
    { id: 'strikes',    label: 'Strikes',    icon: Shield },
    { id: 'theta',      label: 'Theta',      icon: Clock },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-300 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Enhanced Hero Section ── */}
        <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#131b2c] to-[#0f1522] border border-[#1e293b] shadow-2xl">
          {/* Abstract glowing orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[80px] transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px]" />
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          </div>

          <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-[11px] font-black tracking-widest text-violet-300 uppercase">Pro Options Suite</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-3">
                Options Masterclass
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
                Elevate your trading with our definitive guide to options strategies, PCR interpretation, IV crush avoidance, and mastering theta decay.
              </p>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2 p-5 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <Shield className="w-4 h-4" /> Suitable for NSE F&O
              </div>
              <div className="text-xs text-slate-500 font-medium">Educational & Analytical Use Only</div>
            </div>
          </div>
        </div>

        {/* ── Modern Tab Navigation ── */}
        <div className="flex justify-start sm:justify-center overflow-x-auto pb-2 custom-scrollbar hide-scroll-indicator">
          <div className="inline-flex p-1.5 bg-[#131b2c]/80 backdrop-blur-xl border border-[#1e293b] rounded-2xl shadow-xl gap-1">
            {tabs.map(t => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out overflow-hidden group ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-90" />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="relative z-10 tracking-wide">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content Container ── */}
        <div className="relative z-10 animate-fade-in-up">
          
          {/* ── Strategies Tab ── */}
          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">Click any strategy card to expand setup details and payoff charts.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {STRATEGIES.map(s => <StrategyCardComp key={s.name} s={s} />)}
              </div>
            </div>
          )}

          {/* ── PCR Tab ── */}
          {activeTab === 'pcr' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-blue-900/20 to-[#131b2c] border border-blue-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Activity className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">Put-Call Ratio (PCR)</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    <strong className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">PCR = Total Put OI / Total Call OI</strong><br /><br />
                    PCR measures the ratio of put options to call options outstanding. It is widely used as a <strong className="text-slate-200">contrarian sentiment indicator</strong>. Extreme readings often signal an impending market reversal.
                  </p>

                  {/* PCR Visual Gauge */}
                  <div className="bg-black/30 rounded-2xl p-5 border border-white/5 mb-6 relative overflow-hidden">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span>PCR Sentiment Meter</span>
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                      <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-slate-200 z-10" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                      <span>0.5 (Top)</span>
                      <span>1.0 (Neutral)</span>
                      <span>1.5 (Bottom)</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group/rule">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/rule:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-2.5 mb-2 relative z-10">
                      <AlertTriangle className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                      <span className="text-sm font-black text-amber-400 uppercase tracking-widest">Golden Rule</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed font-medium relative z-10">PCR is a lagging indicator. Always combine it with price action, support/resistance, and volume. Never trade PCR in isolation.</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-8">
                <div className="bg-gradient-to-b from-[#131b2c] to-[#0f1522] border border-[#1e293b] rounded-3xl p-6 md:p-8 shadow-xl h-full flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-slate-800/20 rounded-full blur-[100px] pointer-events-none" />
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4" /> PCR Heatmap Zones
                  </h4>
                  <div className="space-y-4 relative z-10">
                    {PCR_ZONES.map((z, i) => (
                      <div key={i} className="relative group rounded-2xl p-5 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-5 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-0.5">
                        {/* Background color hint */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2.5 shadow-[0_0_10px_currentColor]" style={{ background: z.color, color: z.color }} />
                        
                        <div className="w-full sm:w-32 shrink-0">
                          <div className="text-2xl font-black tracking-tight" style={{ color: z.color, textShadow: `0 0 15px ${z.color}40` }}>{z.range}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">PCR Range</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="inline-flex px-3 py-1 rounded-lg text-xs font-black mb-2.5 border shadow-sm" style={{ color: z.color, borderColor: `${z.color}30`, background: `${z.color}15` }}>
                            {z.label}
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium">{z.hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── IV Tab ── */}
          {activeTab === 'iv' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-500/10 via-[#131b2c] to-blue-500/10 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-500 relative z-10">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Implied Volatility (IV)</h3>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
                    IV represents the market's forecast of a likely movement in a security's price. <strong className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">High IV = Expensive Options</strong>. <strong className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">Low IV = Cheap Options</strong>. The absolute cardinal rule of options trading is to <strong className="text-white border-b-2 border-yellow-500">Buy Low IV, Sell High IV.</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {IV_TIPS.map((tip, i) => (
                  <div key={i} className={`bg-gradient-to-b ${tip.color} ${tip.border} border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -top-10 -right-10 p-4 opacity-20 text-8xl group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 blur-[2px] group-hover:blur-0">{tip.icon}</div>
                    <div className="relative z-10">
                      <div className={`text-2xl font-black ${tip.text} mb-2 tracking-tight`}>{tip.label}</div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3.5 py-1.5 rounded-full mb-5 backdrop-blur-md border border-white/20 shadow-lg">
                        <ArrowRight className="w-3.5 h-3.5" /> {tip.action}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-6 h-20 font-medium">{tip.reason}</p>
                      <div className="bg-black/40 rounded-2xl p-5 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Ideal Strategies</div>
                        <div className={`text-sm font-bold ${tip.text} leading-snug`}>{tip.strategies}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Strikes Tab ── */}
          {activeTab === 'strikes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {STRIKE_GUIDE.map((g, i) => (
                  <div key={i} className={`bg-gradient-to-b from-[#1a233a] to-[#131b2c] border ${g.border} rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]`}>
                    {/* Glowing Accent */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${g.bg} ${g.glow} opacity-80 group-hover:opacity-100 transition-opacity`} />
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 ${g.bg}`} />
                    
                    <div className="flex items-center gap-5 mb-8 relative z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl ${g.bg} ${g.glow} transform group-hover:rotate-6 transition-transform duration-500`}>
                        {g.tag}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{g.full}</h3>
                        <div className={`text-xs font-bold ${g.color} tracking-widest uppercase mt-1`}>{g.premium} Premium</div>
                      </div>
                    </div>

                    {/* Delta Progress Bar */}
                    <div className="mb-8 relative z-10">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
                        <span>Delta Exposure</span>
                        <span className={g.color}>{g.deltaText}</span>
                      </div>
                      <div className="h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className={`h-full ${g.bg} rounded-full relative overflow-hidden`} style={{ width: `${g.delta}%` }}>
                           <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Call Strike</span>
                        <span className="text-sm font-black text-slate-200">{g.call}</span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Put Strike</span>
                        <span className="text-sm font-black text-slate-200">{g.put}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Best Used For</div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{g.use}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-3xl p-6 md:p-8 flex items-start md:items-center gap-5 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative z-10 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="relative z-10">
                  <h4 className="text-base font-black text-blue-400 mb-2 tracking-tight">Professional Insight</h4>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    For directional trades, prefer <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">ATM options</strong> for high gamma and liquidity. For generating income, sell <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">OTM options</strong>. Always check the bid-ask spread before entering — a wide spread means the option is illiquid and should be avoided.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Theta Tab ── */}
          {activeTab === 'theta' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/20 via-[#131b2c] to-rose-900/20 border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Theta (Time Decay)</h3>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    Theta measures <strong className="text-rose-300">how much option premium erodes per day</strong>. Time is a silent killer for option <em className="text-white font-bold">buyers</em> and the greatest ally for option <em className="text-white font-bold">sellers</em>. Understanding the theta curve is critical to profitability.
                  </p>
                </div>
              </div>

              {/* Theta Decay Visual Curve */}
              <div className="bg-[#131b2c] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-700" />
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> The Theta Decay Curve
                </h4>
                
                <div className="relative h-48 sm:h-64 w-full flex items-end">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border-l border-b border-white/10 flex flex-col justify-between pb-8 pl-8">
                    <div className="border-b border-white/5 w-full h-0"></div>
                    <div className="border-b border-white/5 w-full h-0"></div>
                    <div className="border-b border-white/5 w-full h-0"></div>
                  </div>
                  
                  {/* Axis Labels */}
                  <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] font-bold text-slate-500 text-right pr-2 py-1">
                    <span>100%</span>
                    <span>50%</span>
                    <span>0%</span>
                  </div>
                  <div className="absolute bottom-0 left-8 right-0 h-8 flex justify-between text-[10px] font-bold text-slate-500 pt-2 px-1">
                    <span>90 Days</span>
                    <span>60 Days</span>
                    <span>30 Days</span>
                    <span className="text-rose-400">0 Days</span>
                  </div>

                  {/* The Curve SVG */}
                  <svg className="absolute inset-0 w-full h-full pb-8 pl-8 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="thetaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="70%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <path 
                      d="M 0,0 Q 40,5 70,30 T 100,100" 
                      fill="none" 
                      stroke="url(#thetaGradient)" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      filter="url(#glow)"
                      className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                    />
                    
                    {/* Data Points */}
                    <circle cx="0" cy="0" r="2" fill="#8b5cf6" />
                    <circle cx="33" cy="4" r="2" fill="#a855f7" />
                    <circle cx="66" cy="22" r="2" fill="#d946ef" />
                    <circle cx="85" cy="55" r="3" fill="#f43f5e" className="animate-pulse" />
                    <circle cx="100" cy="100" r="4" fill="#e11d48" />
                    
                    {/* Danger Zone Highlight */}
                    <rect x="85" y="0" width="15" height="100" fill="url(#dangerZone)" opacity="0.2" />
                    <defs>
                      <linearGradient id="dangerZone" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Tooltips/Annotations */}
                  <div className="absolute top-[10%] left-[20%] text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 backdrop-blur-sm hidden sm:block">
                    Slow Decay (30-90 Days)
                  </div>
                  <div className="absolute top-[40%] right-[15%] text-xs font-bold text-rose-300 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 backdrop-blur-sm hidden sm:block">
                    Rapid Decay (&lt;14 Days)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: '📉', title: 'The Buyer\'s Dilemma', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', desc: 'If you buy an option and price doesn\'t move, you LOSE premium daily. The option loses value even in a perfectly flat market.', tips: ['Buy options with enough DTE (>14 days)', 'Set a stop-loss on premium (e.g., exit if 40% lost)', 'Prefer buying when IV is extremely low'] },
                  { icon: '📈', title: 'The Seller\'s Advantage', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'If you sell an option and price doesn\'t move, you EARN premium daily via theta decay — especially powerful in range-bound markets.', tips: ['Sell 30–45 DTE for fastest decay curve', 'Use spreads to limit risk on naked sells', 'Close at 50% profit to reduce gamma risk'] },
                  { icon: '⚡', title: 'Theta Acceleration', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Theta decay is NOT linear. It accelerates dramatically in the last 7–14 days before expiry as extrinsic value collapses.', tips: ['Avoid buying options in final week', 'Excellent week for weekly option sellers', 'ATM options have highest theta in final week'] },
                  { icon: '⚖️', title: 'Theta vs Delta', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Buyers need Delta (price movement) to overcome Theta destruction. Sellers need the market to stay quiet so Theta earns more than Delta costs.', tips: ['Buyer needs: Big + Fast move', 'Seller needs: Slow / No move', 'Events spike IV → buy early, sell after'] },
                ].map((item, i) => (
                  <div key={i} className={`bg-[#131b2c] rounded-3xl border ${item.border} p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${item.bg}`}>
                        {item.icon}
                      </div>
                      <h4 className={`text-lg font-black ${item.color}`}>{item.title}</h4>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 h-16">{item.desc}</p>
                    <div className="space-y-2">
                      {item.tips.map((t, j) => (
                        <div key={j} className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${item.bg.replace('/10', '')}`} />
                          <span className="text-xs font-medium text-slate-300 leading-snug">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-rose-400" />
                  <span className="text-base font-black text-rose-400 uppercase tracking-widest">The Golden Rule</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-white">Never hold a bought option through expiry hoping for a miracle.</strong> Theta will destroy 100% of extrinsic value by expiry. Set clear time-based exits — if your thesis hasn't played out in 50% of the remaining DTE (Days to Expiry), <strong className="text-rose-300">exit the position.</strong>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OptionsHint;
