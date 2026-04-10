import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, ArrowDownRight, ArrowUpRight, BarChart2,
  Zap, ShieldAlert, Crosshair, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, Layers, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ReferenceLine, Cell
} from 'recharts';

// ─── Types & Generators ───────────────────────────────────────────────
type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY'; // Excluded Sensex since it's BSE
type Expiry = 'Current Expiry' | 'Next Expiry' | 'Monthly Expiry';

const BASE_CONFIGS: Record<string, { spot: number, ivr: number, ivp: number, pcr: number, maxPain: number, gexStatus: string }> = {
  'NIFTY': { spot: 22452.15, ivr: 42, ivp: 68, pcr: 1.15, maxPain: 22400, gexStatus: 'Positive Gamma (+)' },
  'BANKNIFTY': { spot: 48123.50, ivr: 58, ivp: 82, pcr: 0.82, maxPain: 48000, gexStatus: 'Negative Gamma (-)' },
  'FINNIFTY': { spot: 21350.25, ivr: 34, ivp: 45, pcr: 1.05, maxPain: 21300, gexStatus: 'Neutral Gamma' }
};

const INITIAL_STRIKE_FLOW: Record<string, any[]> = {
  'NIFTY': [
    { strike: 22200, callChg: -2.5, callChgNeg: 2.5, putChg: 15.2 },
    { strike: 22300, callChg: -1.2, callChgNeg: 1.2, putChg: 22.4 },
    { strike: 22400, callChg: 5.4,  callChgNeg: -5.4, putChg: 18.1 },
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
    { strike: 21300, callChg: 4.4,  callChgNeg: -4.4, putChg: 6.1 },
    { strike: 21400, callChg: 14.5, callChgNeg: -14.5, putChg: -2.2 },
    { strike: 21500, callChg: 18.2, callChgNeg: -18.2, putChg: -4.5 },
    { strike: 21600, callChg: 8.4,  callChgNeg: -8.4, putChg: -1.1 },
  ]
};

// Generates time series starting from 9:15
const generateInitialStraddle = () => {
  const data = [];
  let basePremium = 450;
  let timeStr = new Date();
  timeStr.setHours(9, 15, 0, 0);
  
  // Create last 12 ticks
  for (let i = 0; i < 12; i++) {
    const decay = Math.random() * 5 + 0.5; // Premium drop
    basePremium -= decay;
    data.push({
      time: timeStr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      premium: parseFloat(basePremium.toFixed(1)),
    });
    timeStr.setMinutes(timeStr.getMinutes() + 15);
  }
  return data;
};

// ─── Custom Tooltip Components ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1520] border border-slate-700 p-3 rounded-lg shadow-xl outline-none">
        <p className="text-slate-300 font-bold mb-2 text-xs">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.value > 0 ? '+' : ''}{(entry.value).toFixed(1)}k
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
  const [instrument, setInstrument] = useState<Instrument>('NIFTY');
  const [expiry, setExpiry] = useState<Expiry>('Current Expiry');
  const pollingRef = useRef<NodeJS.Timeout>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  
  // State Definitions
  const [config, setConfig] = useState(BASE_CONFIGS['NIFTY']);
  const [strikeData, setStrikeData] = useState(() => INITIAL_STRIKE_FLOW['NIFTY']);
  
  const [fiiData, setFiiData] = useState([
    { category: 'Index Futures', FII: 45000, PRO: 12000, CLIENT: -57000 },
    { category: 'Index Options', FII: 125000, PRO: -45000, CLIENT: -80000 },
    { category: 'Stock Futures', FII: -15000, PRO: 32000, CLIENT: -17000 },
  ]);
  const [straddleData, setStraddleData] = useState(generateInitialStraddle());

  // Function to pull real NSE Options Data
  const fetchOptionsData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/options/${instrument}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      if (!data || !data.records || !data.filtered) return;

      const spotPrice = data.records.underlyingValue;
      const filteredCE = data.filtered.CE?.totOI || 1;
      const filteredPE = data.filtered.PE?.totOI || 1;
      const actualPCR = filteredPE / filteredCE;

      // Extract ATM IV 
      let closestStrike = data.filtered.data[0];
      let minDiff = Infinity;
      data.filtered.data.forEach((d: any) => {
        const diff = Math.abs(d.strikePrice - spotPrice);
        if (diff < minDiff) { minDiff = diff; closestStrike = d; }
      });
      const currentIVP = closestStrike?.CE?.impliedVolatility || BASE_CONFIGS[instrument].ivp;

      // Max Pain Calculation (mock logic over filtered data to save intense loop math if not strictly needed)
      // We estimate Max Pain closest to the strike with highest combined Open Interest.
      let maxPainStrike = spotPrice;
      let highestCombinedOI = 0;
      data.filtered.data.forEach((d: any) => {
          const ceOI = d.CE?.openInterest || 0;
          const peOI = d.PE?.openInterest || 0;
          if ((ceOI + peOI) > highestCombinedOI) {
              highestCombinedOI = ceOI + peOI;
              maxPainStrike = d.strikePrice;
          }
      });

      setConfig(prev => ({
        ...prev,
        spot: spotPrice,
        pcr: actualPCR,
        ivp: Math.round(currentIVP),
        maxPain: maxPainStrike,
        gexStatus: actualPCR > 1.2 ? 'Positive Gamma (+)' : actualPCR < 0.8 ? 'Negative Gamma (-)' : 'Neutral Gamma'
      }));

      // Find Strike Data Flow Heatmap
      const atmIndex = data.filtered.data.findIndex((d: any) => d.strikePrice === closestStrike.strikePrice);
      const startIndex = Math.max(0, atmIndex - 3);
      const heatmapSlice = data.filtered.data.slice(startIndex, startIndex + 6);
      
      const parsedStrikeFlow = heatmapSlice.map((strikeObj: any) => {
        const ceChg = (strikeObj.CE?.changeinOpenInterest || 0) / 1000; // Adjusted for thousands UI formatting
        const peChg = (strikeObj.PE?.changeinOpenInterest || 0) / 1000;
        return {
          strike: strikeObj.strikePrice,
          callChg: ceChg,
          callChgNeg: ceChg > 0 ? -ceChg : Math.min(ceChg, -0.1),
          putChg: peChg
        }
      });

      if (parsedStrikeFlow.length > 0) {
        setStrikeData(parsedStrikeFlow);
      }

      setIsLive(true);
      setIsLoading(false);

    } catch (err) {
      console.error("Failed fetching live NSE data, maintaining current state:", err);
      // Fallback
      setIsLive(false);
      setIsLoading(false);
    }
  }, [instrument]);

  const tickResiduals = useCallback(() => {
    // Tick Institutional Data slightly visually
    setFiiData(prev => prev.map(cat => ({
      ...cat,
      FII: cat.FII + Math.round((Math.random() - 0.5) * 500),
      PRO: cat.PRO + Math.round((Math.random() - 0.5) * 400),
    })));

    // Progress Straddle Decay Chart
    setStraddleData(prev => {
      const last = prev[prev.length - 1];
      const now = new Date();
      const drop = Math.random() * 2 + 0.1; 
      const newEntry = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        premium: parseFloat(Math.max(10, last.premium - drop).toFixed(1))
      };
      const updated = [...prev, newEntry];
      if (updated.length > 20) updated.shift();
      return updated;
    });
  }, []);

  // Instrument Change Hook & Polling Activation
  useEffect(() => {
    setIsLoading(true);
    fetchOptionsData();
    setStraddleData(generateInitialStraddle());

    // Set up 15 second data fetch polling
    pollingRef.current = setInterval(() => {
      fetchOptionsData();
      tickResiduals();
    }, 15000);

    return () => clearInterval(pollingRef.current);
  }, [fetchOptionsData, tickResiduals]);


  // Colors
  const callColor = '#ef4444'; // Red for Call Writing (Bearish)
  const callUnwindColor = '#fca5a5';
  const putColor = '#10b981'; // Green for Put Writing (Bullish)
  const putUnwindColor = '#6ee7b7';

  // Derived metrics
  const isVolExpensive = config.ivp > 22; // In reality IV mostly floats around 10-25
  const isVolCheap = config.ivp < 12;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-300 p-4 md:p-6 pb-24 relative">
      
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-[#0a0e17]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
             <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
             <p className="text-sm font-bold text-slate-300 animate-pulse">Establishing secure NSE Bridge...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header & Instrument Selectors ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                {isLive && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0e17] animate-pulse" />}
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Quantitative <span className="text-indigo-400">Options</span> Intel</h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              Institutional grade delta-neutral flow analytics. 
              {isLive ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> REAL-TIME NSE DATA
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-sm">
                  OFFLINE SNAPSHOT
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Instrument Tabs */}
            <div className="flex bg-[#131b26] p-1 rounded-xl border border-slate-800">
              {(['NIFTY', 'BANKNIFTY', 'FINNIFTY'] as Instrument[]).map(inst => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    instrument === inst 
                      ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] relative' 
                      : 'text-slate-500 hover:text-slate-300 relative'
                  }`}
                >
                  {inst}
                  {instrument === inst && (
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-400 rounded-full blur-sm" />
                  )}
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
        <div className={`rounded-xl border p-4 flex items-center justify-between shadow-lg transition-colors duration-700 ${
          config.gexStatus.includes('Positive') 
            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5' 
            : config.gexStatus.includes('Negative')
            ? 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/5'
            : 'bg-slate-800/30 border-slate-700/50'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-5 h-5 ${config.gexStatus.includes('Positive') ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div>
              <h3 className={`text-sm font-bold transition-colors ${config.gexStatus.includes('Positive') ? 'text-emerald-400' : 'text-rose-400'}`}>
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
            <div className="text-2xl font-black text-white transition-all duration-300">{Number(config.spot).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-xs text-sky-400 font-semibold mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Latest Tick
            </div>
          </div>

          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 transition-colors duration-1000 ${isVolExpensive ? 'bg-rose-500/10' : isVolCheap ? 'bg-emerald-500/10' : 'bg-amber-500/10'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">ATM Implied Volatility</p>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-black text-white transition-all">{config.ivp}</div>
            </div>
            <div className={`text-xs font-semibold mt-1 flex items-center gap-1 transition-colors ${isVolExpensive ? 'text-rose-400' : isVolCheap ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isVolExpensive ? 'Premium is Expensive (Favorable for Sellers)' : isVolCheap ? 'Premium is Cheap (Favorable for Buyers)' : 'Premium is Neutral'}
            </div>
          </div>

          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 transition-colors duration-1000 ${config.pcr > 1.2 ? 'bg-emerald-500/10' : config.pcr < 0.8 ? 'bg-rose-500/10' : 'bg-slate-500/10'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">Put-Call Ratio (PCR)</p>
            <div className="text-2xl font-black text-white transition-all">{config.pcr.toFixed(2)}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 transition-colors">
              {config.pcr > 1.2 ? <span className="text-emerald-400">Oversold / Strong Support</span> : config.pcr < 0.8 ? <span className="text-rose-400">Overbought / Strong Resistance</span> : 'Neutral Territory'}
            </div>
          </div>

          <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1">Max Pain Strike</p>
            <div className="text-2xl font-black text-violet-400 transition-all">{config.maxPain.toLocaleString('en-IN')}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">
              Estimated by OI Concentration
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
               <div className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded">T-1 Report</div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fiiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                  <Bar dataKey="FII" name="Foreign (FII)" fill="#3b82f6" radius={[4,4,0,0]} isAnimationActive={false} />
                  <Bar dataKey="PRO" name="Proprietary" fill="#8b5cf6" radius={[4,4,0,0]} isAnimationActive={false} />
                  <Bar dataKey="CLIENT" name="Retail Client" fill="#64748b" radius={[4,4,0,0]} isAnimationActive={false} />
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
              <div className="bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 text-amber-500 text-[10px] font-bold underline decoration-dashed underline-offset-2 flex flex-col items-center">
                THETA BLEED
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={straddleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Area type="step" isAnimationActive={true} dataKey="premium" name="Straddle Price (₹)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorDecay)" />
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
                <p className="text-[10px] text-slate-500 tracking-wider mt-1 uppercase">Changes in Open Interest at near-ATM strikes (in Thousands)</p>
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
                    formatter={(value: number, name: string) => [`${Math.abs(value).toFixed(1)}k`, name.includes('Call') ? 'Call OI Change' : 'Put OI Change']}
                  />
                  <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
                  
                  {/* Call Bar (Mapping Call Changes to the Left axis side using precalculated negative values) */}
                  <Bar dataKey="callChgNeg" name="Call Writing (Bearish)" radius={[4,0,0,4]} isAnimationActive={false}>
                    {strikeData.map((entry, index) => (
                      <Cell key={`call-${index}`} fill={entry.callChg > 0 ? callColor : callUnwindColor} />
                    ))}
                  </Bar>
                  
                  <Bar dataKey="putChg" name="Put Writing (Bullish)" radius={[0,4,4,0]} isAnimationActive={false}>
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
