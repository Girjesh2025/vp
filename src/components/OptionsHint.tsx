import React, { useState } from 'react';
import { Info, TrendingUp, TrendingDown, Zap, Target, Clock, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

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
  },
  {
    name: 'Long Straddle',
    type: 'volatile',
    setup: 'Buy ATM Call + Buy ATM Put (same strike, same expiry)',
    when: 'Big move expected but direction unknown (earnings, budget, RBI policy)',
    maxProfit: 'Unlimited (on breakout in either direction)',
    maxLoss: 'Total premium paid for both options',
    idealIV: 'Low IV — buy cheap before an event',
    complexity: 2,
    legs: ['BUY 1 ATM Call', 'BUY 1 ATM Put'],
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
  },
];

const PCR_ZONES = [
  { range: '< 0.5', label: 'Extreme Bullishness / Top Signal', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', hint: 'Too many bulls — contrarian BEARISH warning. Smart money may start shorting.' },
  { range: '0.5 – 0.7', label: 'Bullish Zone', color: '#f97316', bg: 'rgba(249,115,22,0.1)', hint: 'More calls being written — mild bullish sentiment. Market likely trending up.' },
  { range: '0.7 – 1.0', label: 'Neutral / Balanced', color: '#eab308', bg: 'rgba(234,179,8,0.1)', hint: 'Balanced put/call activity. Market is indecisive. Wait for direction.' },
  { range: '1.0 – 1.2', label: 'Bearish Zone', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', hint: 'More puts being written — mild bearish sentiment. Support may hold.' },
  { range: '> 1.2', label: 'Extreme Fear / Bottom Signal', color: '#10b981', bg: 'rgba(16,185,129,0.1)', hint: 'Too many bears — contrarian BULLISH reversal signal. Good time to look for longs.' },
];

const IV_TIPS = [
  { label: 'High IV (>20%)', icon: '🔥', action: 'SELL premium strategies', strategies: 'Iron Condor, Short Strangle, Covered Call, Credit Spreads', reason: 'High IV means options are expensive. Favor selling to collect inflated premiums that decay.', color: '#f97316' },
  { label: 'Low IV (<12%)', icon: '❄️', action: 'BUY premium strategies', strategies: 'Long Straddle, Long Strangle, Debit Spreads, Calls/Puts', reason: 'Low IV means options are cheap. Favor buying before an expected event (earnings, policy).', color: '#60a5fa' },
  { label: 'IV Crush Risk', icon: '⚠️', action: 'AVOID buying before events', strategies: 'Don\'t buy naked options just before earnings/events', reason: 'After big events, IV collapses even if price moves. Buy early or use spreads.', color: '#eab308' },
];

const STRIKE_GUIDE = [
  { tag: 'ITM', full: 'In The Money', call: 'Strike < CMP', put: 'Strike > CMP', premium: '🔴 High', delta: '0.6 – 1.0', use: 'Near delta-1 exposure; less time decay risk; expensive', color: '#f97316' },
  { tag: 'ATM', full: 'At The Money', call: 'Strike ≈ CMP', put: 'Strike ≈ CMP', premium: '🟡 Medium', delta: '~0.5', use: 'Most liquid; highest gamma & theta; best for directional trades', color: '#eab308' },
  { tag: 'OTM', full: 'Out of The Money', call: 'Strike > CMP', put: 'Strike < CMP', premium: '🟢 Low', delta: '0.1 – 0.4', use: 'Cheap lottery tickets; high risk; use for spread legs or event plays', color: '#22c55e' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
const typeConfig = {
  bullish:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   label: 'BULLISH',  icon: TrendingUp },
  bearish:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: 'BEARISH',  icon: TrendingDown },
  neutral:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  label: 'NEUTRAL',  icon: Target },
  volatile: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)', label: 'VOLATILE', icon: Zap },
};

const StrategyCardComp: React.FC<{ s: StrategyCard }> = ({ s }) => {
  const [open, setOpen] = useState(false);
  const cfg = typeConfig[s.type];
  const Icon = cfg.icon;
  return (
    <div
      className="rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer group"
      style={{ background: cfg.bg, borderColor: cfg.border, boxShadow: open ? `0 8px 32px ${cfg.bg}` : 'none' }}
      onClick={() => setOpen(!open)}
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}22` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm tracking-wide">{s.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>{cfg.label}</span>
              <span className="text-[10px] text-slate-500">{'★'.repeat(s.complexity)}{'☆'.repeat(3 - s.complexity)} Complexity</span>
            </div>
          </div>
        </div>
        <div className="text-slate-500 shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 mt-1 pt-3">
          {/* Legs */}
          <div className="flex flex-wrap gap-2">
            {s.legs.map((leg, i) => (
              <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">{leg}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/20 rounded-xl p-3">
              <div className="text-slate-500 mb-1 text-[10px] uppercase tracking-wider">When to Use</div>
              <div className="text-slate-200">{s.when}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-3">
              <div className="text-slate-500 mb-1 text-[10px] uppercase tracking-wider">Ideal IV</div>
              <div className="text-slate-200">{s.idealIV}</div>
            </div>
            <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-900/40">
              <div className="text-emerald-500 mb-1 text-[10px] uppercase tracking-wider">Max Profit</div>
              <div className="text-emerald-300 font-semibold">{s.maxProfit}</div>
            </div>
            <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-900/40">
              <div className="text-rose-500 mb-1 text-[10px] uppercase tracking-wider">Max Loss</div>
              <div className="text-rose-300 font-semibold">{s.maxLoss}</div>
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-xs">
            <div className="text-slate-500 mb-1 text-[10px] uppercase tracking-wider">Setup</div>
            <div className="text-slate-300">{s.setup}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const OptionsHint: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategies' | 'pcr' | 'iv' | 'strikes' | 'theta'>('strategies');

  const tabs = [
    { id: 'strategies', label: '🎯 Strategies', desc: 'Strategy cards' },
    { id: 'pcr',        label: '📊 PCR Guide',  desc: 'Put-Call Ratio' },
    { id: 'iv',         label: '🔥 IV Guide',   desc: 'Implied Volatility' },
    { id: 'strikes',    label: '🎖 Strikes',    desc: 'ITM / ATM / OTM' },
    { id: 'theta',      label: '⏰ Theta',      desc: 'Time Decay' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-300 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-br from-violet-900/30 via-[#12192b] to-emerald-900/20 p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60 pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💡</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 tracking-widest uppercase">Options Guide</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Options Trading Guide</h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Strategy hints, PCR interpretation, IV guidance, strike selection tips, and theta decay warnings — all in one place.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 text-right">
              <div className="text-xs text-slate-500">Suitable for NSE F&O</div>
              <div className="text-xs text-violet-400">Educational use only</div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                activeTab === t.id
                  ? 'bg-violet-600/30 border-violet-500/50 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                  : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Strategies Tab ───────────────────────────────────────── */}
        {activeTab === 'strategies' && (
          <div className="space-y-4">
            <p className="text-slate-500 text-xs">Click any strategy to expand details. Choose based on your market view and IV environment.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STRATEGIES.map(s => <StrategyCardComp key={s.name} s={s} />)}
            </div>
          </div>
        )}

        {/* ── PCR Tab ──────────────────────────────────────────────── */}
        {activeTab === 'pcr' && (
          <div className="space-y-4">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-slate-200">What is PCR?</span>
              </div>
              <p className="text-slate-400 text-sm">
                <strong className="text-slate-200">Put-Call Ratio = Total Put OI / Total Call OI</strong><br />
                PCR measures the ratio of put options to call options outstanding. It's a contrarian sentiment indicator — extreme readings often signal reversals.
              </p>
            </div>
            <div className="space-y-3">
              {PCR_ZONES.map((z, i) => (
                <div key={i} className="rounded-2xl border p-4 transition-all hover:scale-[1.01] duration-200" style={{ background: z.bg, borderColor: `${z.color}40` }}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="text-sm font-black tracking-wider" style={{ color: z.color }}>PCR {z.range}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: z.color, borderColor: `${z.color}50`, background: `${z.color}15` }}>{z.label}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{z.hint}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">Remember</span>
              </div>
              <p className="text-slate-400 text-sm">PCR is a lagging/contrarian indicator. Use it with price action, support/resistance, and other confluence factors — never in isolation.</p>
            </div>
          </div>
        )}

        {/* ── IV Tab ───────────────────────────────────────────────── */}
        {activeTab === 'iv' && (
          <div className="space-y-4">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-slate-200">What is IV?</span>
              </div>
              <p className="text-slate-400 text-sm">
                <strong className="text-slate-200">Implied Volatility (IV)</strong> is the market's forecast of likely movement in the asset. High IV = expensive options. Low IV = cheap options. The cardinal rule: <strong className="text-yellow-300">Buy low IV, Sell high IV.</strong>
              </p>
            </div>
            {IV_TIPS.map((tip, i) => (
              <div key={i} className="rounded-2xl border p-5 transition-all duration-200" style={{ background: `${tip.color}10`, borderColor: `${tip.color}40` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <div className="font-black text-sm" style={{ color: tip.color }}>{tip.label}</div>
                    <div className="text-xs font-bold text-slate-300 tracking-wider mt-0.5">→ {tip.action}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-2">{tip.reason}</div>
                <div className="bg-black/20 rounded-xl px-3 py-2 text-xs font-medium text-slate-300">
                  <span className="text-slate-500 mr-1">Best for:</span> {tip.strategies}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Strikes Tab ──────────────────────────────────────────── */}
        {activeTab === 'strikes' && (
          <div className="space-y-4">
            <p className="text-slate-500 text-xs">CMP = Current Market Price of the underlying</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STRIKE_GUIDE.map((g, i) => (
                <div key={i} className="rounded-2xl border p-5 space-y-3 transition-all hover:scale-[1.02] duration-200" style={{ background: `${g.color}10`, borderColor: `${g.color}40` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: `${g.color}25`, color: g.color }}>{g.tag}</div>
                    <div>
                      <div className="font-black text-slate-100 text-sm">{g.full}</div>
                      <div className="text-[10px] text-slate-500">Delta ≈ {g.delta}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="bg-black/20 rounded-lg p-2.5">
                      <span className="text-slate-500">Call: </span><span className="text-slate-300 font-medium">{g.call}</span>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2.5">
                      <span className="text-slate-500">Put: </span><span className="text-slate-300 font-medium">{g.put}</span>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2.5">
                      <span className="text-slate-500">Premium: </span><span className="font-semibold">{g.premium}</span>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2.5">
                      <span className="text-slate-500">Best for: </span><span className="text-slate-300">{g.use}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-4">
              <span className="text-blue-300 font-bold text-sm">💡 Pro Tip: </span>
              <span className="text-slate-400 text-sm">For directional trades, prefer ATM options for high gamma. For income, sell OTM. For hedging, buy OTM puts. Always check bid-ask spread — wide spread = illiquid = avoid.</span>
            </div>
          </div>
        )}

        {/* ── Theta Tab ────────────────────────────────────────────── */}
        {activeTab === 'theta' && (
          <div className="space-y-4">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-slate-200">Theta (Time Decay)</span>
              </div>
              <p className="text-slate-400 text-sm">
                Theta measures <strong className="text-slate-200">how much option premium erodes per day</strong>. Time is always working against option <em>buyers</em> and in favor of option <em>sellers</em>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '📉', title: 'Theta Buyer Problem', color: '#f87171', desc: 'If you buy an option and price doesn\'t move, you LOSE premium daily. The option loses value even in a flat market.', tips: ['Buy options with enough DTE (>14 days)', 'Set a stop-loss on premium (e.g., exit if 40% lost)', 'Prefer buying when IV is low'] },
                { icon: '📈', title: 'Theta Seller Advantage', color: '#4ade80', desc: 'If you sell an option and price doesn\'t move, you EARN premium daily via theta decay — especially powerful in range-bound markets.', tips: ['Sell 30–45 DTE for fastest decay curve', 'Use spreads to limit risk on naked sells', 'Close at 50% profit to reduce gamma risk'] },
                { icon: '⚡', title: 'Theta Acceleration', color: '#f59e0b', desc: 'Theta decay is NOT linear. It accelerates dramatically in the last 7–14 days before expiry (extrinsic value collapses).', tips: ['Avoid buying options in final week', 'Excellent week for weekly option sellers', 'ATM options have highest theta in final week'] },
                { icon: '🛡', title: 'Theta vs Delta', color: '#818cf8', desc: 'Buyers need Delta (price movement) to overcome Theta destruction. Sellers need the market to stay quiet so Theta earns more than Delta costs.', tips: ['Buyer needs: Big + Fast move', 'Seller needs: Slow / No move', 'Events spike IV → buy early, sell after'] },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border p-4 space-y-3" style={{ background: `${item.color}08`, borderColor: `${item.color}30` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-black text-sm" style={{ color: item.color }}>{item.title}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  <ul className="space-y-1">
                    {item.tips.map((t, j) => (
                      <li key={j} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span style={{ color: item.color }} className="mt-0.5 shrink-0">▸</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-bold text-rose-300">Golden Rule</span>
              </div>
              <p className="text-slate-400 text-sm">
                <strong className="text-slate-200">Never hold a bought option through expiry hoping for a miracle.</strong> Theta will destroy 100% of extrinsic value by expiry. Set clear time-based exits — if your thesis hasn't played out in 50% of the remaining DTE, exit the position.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OptionsHint;
