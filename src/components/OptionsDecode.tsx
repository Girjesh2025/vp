import React, { useState, useMemo } from 'react';
import { 
  Activity, ArrowDownRight, ArrowUpRight, BarChart2,
  Zap, ShieldAlert, Crosshair, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ReferenceLine, Cell
} from 'recharts';

// ─── Types & Mock Configurations ───────────────────────────────────────────────
type Instrument = 'NIFTY 50' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX';
type Expiry = 'Current Expiry' | 'Next Expiry' | 'Monthly Expiry';

const INSTRUMENT_CONFIG: Record<Instrument, { spot: number, ivr: number, ivp: number, pcr: number, maxPain: number, gexStatus: string }> = {
  'NIFTY 50': { spot: 22452.15, ivr: 42, ivp: 68, pcr: 1.15, maxPain: 22400, gexStatus: 'Positive Gamma (+)' },
  'BANKNIFTY': { spot: 48123.50, ivr: 58, ivp: 82, pcr: 0.82, maxPain: 48000, gexStatus: 'Negative Gamma (-)' },
  'FINNIFTY': { spot: 21350.25, ivr: 34, ivp: 45, pcr: 1.05, maxPain: 21300, gexStatus: 'Neutral Gamma' },
  'SENSEX': { spot: 74215.30, ivr: 40, ivp: 60, pcr: 1.10, maxPain: 74000, gexStatus: 'Positive Gamma (+)' }
};

const FII_DATA = [
  { category: 'Index Futures', FII: 45000, PRO: 12000, CLIENT: -57000 },
  { category: 'Index Options', FII: 125000, PRO: -45000, CLIENT: -80000 },
  { category: 'Stock Futures', FII: -15000, PRO: 32000, CLIENT: -17000 },
];

const STRADDLE_DECAY = [
  { time: '09:15', premium: 425.5, iv: 18.2 },
  { time: '10:00', premium: 410.2, iv: 17.5 },
  { time: '11:00', premium: 395.0, iv: 16.8 },
  { time: '12:00', premium: 388.5, iv: 16.5 },
  { time: '13:00', premium: 375.2, iv: 15.9 },
  { time: '14:00', premium: 360.8, iv: 15.2 },
  { time: '15:00', premium: 345.5, iv: 14.8 },
  { time: '15:30', premium: 338.0, iv: 14.5 },
];

const STRIKE_OI_FLOW: Record<Instrument, any[]> = {
  'NIFTY 50': [
    { strike: 22200, callChg: -2.5, callChgNeg: 2.5, putChg: 15.2 },
    { strike: 22300, callChg: -1.2, callChgNeg: 1.2, putChg: 22.4 },
    { strike: 22400, callChg: 5.4, callChgNeg: -5.4, putChg: 18.1 },
    { strike: 22500, callChg: 28.5, callChgNeg: -28.5, putChg: -3.2 },
    { strike: 22600, callChg: 35.2, callChgNeg: -35.2, putChg: -5.5 },
    { strike: 22700, callChg: 18.4, callChgNeg: -18.4, putChg: -1.1 },
  ],
  'BANKNIFTY': [
    { strike: 47700, callChg: -4.5, callChgNeg: 4.5, putChg: 12.2 },
    { strike: 47800, callChg: -2.2, callChgNeg: 2.2, putChg: 18.4 },
    { strike: 48000, callChg: 15.4, callChgNeg: -15.4, putChg: 8.1 },
    { strike: 48100, callChg: 28.5, callChgNeg: -28.5, putChg: -6.2 },
    { strike: 48200, callChg: 32.2, callChgNeg: -32.2, putChg: -8.5 },
    { strike: 48500, callChg: 12.4, callChgNeg: -12.4, putChg: -2.1 },
  ],
  'FINNIFTY': [
    { strike: 21100, callChg: -1.5, callChgNeg: 1.5, putChg: 8.2 },
    { strike: 21200, callChg: -0.2, callChgNeg: 0.2, putChg: 12.4 },
    { strike: 21300, callChg: 4.4, callChgNeg: -4.4, putChg: 6.1 },
    { strike: 21400, callChg: 14.5, callChgNeg: -14.5, putChg: -2.2 },
    { strike: 21500, callChg: 18.2, callChgNeg: -18.2, putChg: -4.5 },
    { strike: 21600, callChg: 8.4, callChgNeg: -8.4, putChg: -1.1 },
  ],
  'SENSEX': [
    { strike: 73500, callChg: -3.5, callChgNeg: 3.5, putChg: 10.2 },
    { strike: 73800, callChg: -1.2, callChgNeg: 1.2, putChg: 15.4 },
    { strike: 74000, callChg: 8.4, callChgNeg: -8.4, putChg: 12.1 },
    { strike: 74200, callChg: 22.5, callChgNeg: -22.5, putChg: -4.2 },
    { strike: 74500, callChg: 28.2, callChgNeg: -28.2, putChg: -6.5 },
    { strike: 75000, callChg: 15.4, callChgNeg: -15.4, putChg: -2.1 },
  ]
};

// ─── Custom Tooltip Components ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1520] border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-300 font-bold mb-2 text-xs">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.value > 0 ? '+' : ''}{(entry.value / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Component ────────────────────────────────────────────────────────────
const OptionsDecode: React.FC = () => {
  const [instrument, setInstrument] = useState<Instrument>('NIFTY 50');
  const [expiry, setExpiry] = useState<Expiry>('Current Expiry');

  const config = INSTRUMENT_CONFIG[instrument];
  const strikeData = STRIKE_OI_FLOW[instrument];

  // Colors
  const callColor = '#ef4444'; // Red for Call Writing (Bearish)
  const callUnwindColor = '#fca5a5';
  const putColor = '#10b981'; // Green for Put Writing (Bullish)
  const putUnwindColor = '#6ee7b7';

  // Derived metrics
  const isVolExpensive = config.ivp > 75;
  const isVolCheap = config.ivp < 30;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-300 p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header & Instrument Selectors ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Crosshair className="w-4 h-4 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Quantitative <span className="text-indigo-400">Options</span> Intel</h1>
            </div>
            <p className="text-xs text-slate-400">Institutional grade delta-neutral and directional options flow analytics.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Instrument Tabs */}
            <div className="flex bg-[#131b26] p-1 rounded-xl border border-slate-800">
              {(['NIFTY 50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'] as Instrument[]).map(inst => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    instrument === inst 
                      ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>

            {/* Expiry Dropdown (Visual only for mock) */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-[#131b26] border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:border-slate-700 transition-colors">
                {expiry} <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Top GEX Warning Banner ────────────────────────────────────── */}
        <div className={`rounded-xl border p-4 flex items-center justify-between shadow-lg ${
          config.gexStatus.includes('Positive') 
            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5' 
            : config.gexStatus.includes('Negative')
            ? 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/5'
            : 'bg-slate-800/30 border-slate-700/50'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-5 h-5 ${config.gexStatus.includes('Positive') ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div>
              <h3 className={`text-sm font-bold ${config.gexStatus.includes('Positive') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {config.gexStatus} Environment Detected
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {config.gexStatus.includes('Positive') 
                  ? 'Market Makers are buying dips and selling rips. Expect lower volatility, mean-reversion, and theta decay.' 
                  : 'Market Makers are selling into weakness. Expect high volatility, sudden spikes, and trend continuation.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Core KPI Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">{instrument} SPOT</p>
            <div className="text-2xl font-black text-white">{config.spot.toLocaleString()}</div>
            <div className="text-xs text-sky-400 font-semibold mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> ATM Base
            </div>
          </div>

          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${isVolExpensive ? 'bg-rose-500/10' : isVolCheap ? 'bg-emerald-500/10' : 'bg-amber-500/10'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">IV Percentile (IVP)</p>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-black text-white">{config.ivp}</div>
              <div className="text-lg font-bold text-slate-600 mb-0.5">/ 100</div>
            </div>
            <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${isVolExpensive ? 'text-rose-400' : isVolCheap ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isVolExpensive ? 'Premium is Expensive (Favorable for Sellers)' : isVolCheap ? 'Premium is Cheap (Favorable for Buyers)' : 'Premium is Neutral'}
            </div>
          </div>

          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${config.pcr > 1.2 ? 'bg-emerald-500/10' : config.pcr < 0.8 ? 'bg-rose-500/10' : 'bg-slate-500/10'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">Put-Call Ratio (PCR)</p>
            <div className="text-2xl font-black text-white">{config.pcr.toFixed(2)}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">
              {config.pcr > 1.2 ? 'Oversold / Strong Support' : config.pcr < 0.8 ? 'Overbought / Strong Resistance' : 'Neutral Territory'}
            </div>
          </div>

          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">Max Pain Strike</p>
            <div className="text-2xl font-black text-violet-400">{config.maxPain.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">
              Highest likelihood of expiry
            </div>
          </div>
        </div>

        {/* ── Main Charts Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Institutional Footprint (FII/PRO vs Retail) */}
          <div className="bg-[#131b26] rounded-2xl border border-slate-800 p-5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  Institutional Net Positioning (EOD)
                </h2>
                <p className="text-[10px] text-slate-500 tracking-wider mt-1 uppercase">FII & PRO vs Retail Clients</p>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FII_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                  <Bar dataKey="FII" name="Foreign (FII)" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="PRO" name="Proprietary" fill="#8b5cf6" radius={[4,4,0,0]} />
                  <Bar dataKey="CLIENT" name="Retail Client" fill="#64748b" radius={[4,4,0,0]} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intraday Theta Decay (Straddle Tracking) */}
          <div className="bg-[#131b26] rounded-2xl border border-slate-800 p-5 flex flex-col min-h-[400px]">
             <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  ATM Straddle Decay Tracker
                </h2>
                <p className="text-[10px] text-slate-500 tracking-wider mt-1 uppercase">Combined Call + Put Premium intraday drop</p>
              </div>
              <div className="bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 text-amber-500 text-[10px] font-bold underline decoration-dashed underline-offset-2">
                THETA BLEED
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={STRADDLE_DECAY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDecay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1520', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fcfcfc', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="premium" name="Straddle Price (₹)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorDecay)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strike-wise OI Flow Heatmap (Bottom Full Width) */}
          <div className="col-span-1 lg:col-span-2 bg-[#131b26] rounded-2xl border border-slate-800 p-5 flex flex-col min-h-[450px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Intraday Options Flow (Live Additions/Unwinding)
                </h2>
                <p className="text-[10px] text-slate-500 tracking-wider mt-1 uppercase">Changes in Open Interest at near-ATM strikes (in Lakhs)</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-red-500"/> Call Writing (Bearish)</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-emerald-500"/> Put Writing (Bullish)</div>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strikeData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={{ stroke: '#334155' }} />
                  <YAxis dataKey="strike" type="category" stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    formatter={(value: number, name: string) => [`${Math.abs(value)}L`, name.includes('Call') ? 'Call OI Change' : 'Put OI Change']}
                  />
                  <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
                  
                  {/* Call Bar (Mapping Call Changes to the Left axis side using precalculated negative values) */}
                  <Bar dataKey="callChgNeg" name="Call Writing (Bearish)" radius={[4,0,0,4]}>
                    {strikeData.map((entry, index) => (
                      <Cell key={`call-${index}`} fill={entry.callChg > 0 ? callColor : callUnwindColor} />
                    ))}
                  </Bar>
                  
                  <Bar dataKey="putChg" name="Put Writing (Bullish)" radius={[0,4,4,0]}>
                    {strikeData.map((entry, index) => (
                      <Cell key={`put-${index}`} fill={entry.putChg > 0 ? putColor : putUnwindColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                <strong className="text-slate-200">Pro Tip:</strong> When significant <span className="text-emerald-400">Put Writing</span> coincides with <span className="text-rose-300">Call Unwinding</span> at a strike, it transforms into extremely robust support for the intraday session.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OptionsDecode;
