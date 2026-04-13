import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, ArrowDownRight, ArrowUpRight, BarChart2,
  Zap, ShieldAlert, Crosshair, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, Layers, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ReferenceLine, Cell
} from 'recharts';
import { fetchStockPrice } from '../utils/priceApi';

// ─── Types & Generators ───────────────────────────────────────────────
type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY'; 
type Expiry = 'Current Expiry' | 'Next Expiry' | 'Monthly Expiry';

const INDEX_MAP: Record<string, string> = {
  'NIFTY': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'FINNIFTY': 'NIFTY_FIN_SERVICE.NS'
};

// More accurate current live placeholders in case Yahoo completely fails
const BASE_CONFIGS: Record<string, { spot: number, ivr: number, ivp: number, pcr: number, maxPain: number, gexStatus: string }> = {
  'NIFTY': { spot: 24500.50, ivr: 42, ivp: 68, pcr: 1.15, maxPain: 24500, gexStatus: 'Positive Gamma (+)' },
  'BANKNIFTY': { spot: 53100.20, ivr: 58, ivp: 82, pcr: 0.82, maxPain: 53000, gexStatus: 'Negative Gamma (-)' },
  'FINNIFTY': { spot: 23400.15, ivr: 34, ivp: 45, pcr: 1.05, maxPain: 23400, gexStatus: 'Neutral Gamma' }
};

const INITIAL_STRIKE_FLOW: Record<string, any[]> = {
  'NIFTY': [
    { strike: 24200, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 24300, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 24400, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 24500, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 24600, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 24700, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
  ],
  'BANKNIFTY': [
    { strike: 52700, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 52800, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 53000, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 53100, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 53200, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 53500, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
  ],
  'FINNIFTY': [
    { strike: 23100, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 23200, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 23300, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 23400, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 23500, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
    { strike: 23600, callChg: 0, callChgVis: 0, putChg: 0, putChgVis: 0 },
  ]
};

// Removed fake initial straddle logic

// ─── Custom Tooltip Components ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] outline-none min-w-[160px]">
        <p className="text-white font-black mb-3 text-xs tracking-wider uppercase border-b border-white/10 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                <span className="text-slate-400 font-bold">{entry.name}</span>
              </div>
              <span className="font-black text-white drop-shadow-md">
                {entry.value > 0 ? '+' : ''}{(entry.value).toFixed(1)}k
              </span>
            </div>
          ))}
        </div>
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
  const apiBaseUrl = (() => {
    const envUrl = (import.meta as any)?.env?.VITE_API_URL || (import.meta as any)?.env?.VITE_API_BASE_URL;
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const defaultUrl = isProd ? 'https://first-nivesh.onrender.com' : 'http://localhost:3001';
    return envUrl && typeof envUrl === 'string' && envUrl.trim() ? envUrl.trim() : defaultUrl;
  })();

  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const isLiveRef = useRef(false);
  
  // State Definitions
  const [config, setConfig] = useState(BASE_CONFIGS['NIFTY']);
  const [strikeData, setStrikeData] = useState(() => INITIAL_STRIKE_FLOW['NIFTY']);
  
  const [fiiData, setFiiData] = useState([
    { category: 'Index Futures', FII: 45000, PRO: 12000, CLIENT: -57000 },
    { category: 'Index Options', FII: 125000, PRO: -45000, CLIENT: -80000 },
    { category: 'Stock Futures', FII: -15000, PRO: 32000, CLIENT: -17000 },
  ]);
  const [straddleData, setStraddleData] = useState<{time: string, premium: number}[]>([]);

  // Function to pull real NSE Options Data
  const fetchOptionsData = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/options/${instrument}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      if (!data || !data.records || !data.filtered) {
         throw new Error("Proxy returned empty NSE chain payload (Usually NSE server block)");
      }

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

      // Max Pain Calculation 
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
            callChgVis: ceChg !== 0 ? -Math.abs(ceChg) : -0.1, // Always negative for visual left side
            putChg: peChg,
            putChgVis: peChg !== 0 ? Math.abs(peChg) : 0.1 // Always positive for visual right side
          }
        });

      if (parsedStrikeFlow.length > 0) {
        setStrikeData(parsedStrikeFlow);
      }

      // Calculate Real ATM Straddle Premium
      const atmCE = closestStrike?.CE?.lastPrice || 0;
      const atmPE = closestStrike?.PE?.lastPrice || 0;
      const realStraddlePremium = parseFloat((atmCE + atmPE).toFixed(1));

      setStraddleData(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        // Avoid duplicate points for the same minute
        if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
           return prev; 
        }
        const newEntry = { time: timeStr, premium: realStraddlePremium };
        const updated = [...prev, newEntry];
        if (updated.length > 30) updated.shift();
        return updated;
      });

      setIsLive(true);
      isLiveRef.current = true;
      setIsLoading(false);

    } catch (err) {
      console.warn("Falling back to Hybrid Engine due to proxy chain failure:", err);
      // Guarantee the Spot Price is accurate via external priceAPI!
      const ticker = INDEX_MAP[instrument];
      if (ticker) {
         try {
           const liveSpotData = await fetchStockPrice(ticker);
           if (liveSpotData && liveSpotData.price) {
             const liveSpot = liveSpotData.price;
             setConfig(prev => ({ ...prev, spot: liveSpot, maxPain: liveSpot - (liveSpot % 100) }));
             // No longer simulating fake strike data here
           }
         } catch (e) {
           console.error("Secondary fallback stock fetch failed", e);
           setConfig(BASE_CONFIGS[instrument]);
           // Fallback to static base data, but no random simulation
         }
      }
      setIsLive(false);
      isLiveRef.current = false;
      setIsLoading(false);
    }
  }, [apiBaseUrl, instrument]);

  // Instrument Change Hook & Polling Activation
  useEffect(() => {
    setIsLoading(true);
    fetchOptionsData();
    setStraddleData([]); // Reset chart on instrument change

    // Set up 15 second data fetch polling
    pollingRef.current = setInterval(() => {
      fetchOptionsData();
    }, 15000);

    return () => clearInterval(pollingRef.current);
  }, [fetchOptionsData]);


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
                <span className="flex items-center gap-1 text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-sm">
                  HYBRID ENGINE (LIVE SPOT)
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Instrument Tabs */}
            <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
              {(['NIFTY', 'BANKNIFTY', 'FINNIFTY'] as Instrument[]).map(inst => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                    instrument === inst 
                      ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] relative' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>

            {/* Expiry Dropdown (Visual only for mock) */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
                {expiry} <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Top GEX Warning Banner ────────────────────────────────────── */}
        <div className={`rounded-xl backdrop-blur-md border p-5 flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-700 relative overflow-hidden group ${
          config.gexStatus.includes('Positive') 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : config.gexStatus.includes('Negative')
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-slate-800/40 border-slate-700/50'
        }`}>
          {/* Animated Background Glow */}
          <div className={`absolute top-1/2 left-10 w-32 h-32 -translate-y-1/2 rounded-full blur-[40px] opacity-40 transition-colors duration-700 ${
            config.gexStatus.includes('Positive') ? 'bg-emerald-500' : config.gexStatus.includes('Negative') ? 'bg-rose-500' : 'bg-slate-500'
          }`}></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-full shadow-inner flex items-center justify-center shrink-0 ${
              config.gexStatus.includes('Positive') ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20' : 'bg-rose-500/20 text-rose-400 shadow-rose-500/20'
            }`}>
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base font-black tracking-wide uppercase drop-shadow-md transition-colors ${config.gexStatus.includes('Positive') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {config.gexStatus} Environment Detected
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                {config.gexStatus.includes('Positive') 
                  ? 'Market Makers are buying dips and selling rips. Expect lower volatility, mean-reversion, and theta decay.' 
                  : 'Market Makers are selling into weakness. Expect high volatility, sudden spikes, and trend continuation.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Core KPI Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SPOT CARD */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/10 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-500/20 transition-all" />
            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1 drop-shadow-sm">{instrument} SPOT</p>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-md transition-all duration-300">{Number(config.spot).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-[11px] text-sky-400 font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wide bg-sky-500/10 w-fit px-2 py-0.5 rounded border border-sky-500/20">
              <Activity className="w-3.5 h-3.5" /> Latest Tick
            </div>
          </div>

          {/* IV CARD */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/10 transition-all cursor-default">
            <div className={`absolute top-0 right-0 w-32 h-32 transition-colors duration-1000 ${isVolExpensive ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : isVolCheap ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-amber-500/10 group-hover:bg-amber-500/20'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1 drop-shadow-sm">ATM Implied Volatility</p>
            <div className="flex items-end gap-2">
              <div className={`text-3xl font-black tracking-tight drop-shadow-md transition-all ${isVolExpensive ? 'text-rose-400' : isVolCheap ? 'text-emerald-400' : 'text-amber-400'}`}>{config.ivp}</div>
            </div>
            <div className={`text-[11px] font-bold mt-2 flex items-center gap-1.5 transition-colors ${isVolExpensive ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : isVolCheap ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'} w-fit px-2 py-0.5 rounded`}>
              {isVolExpensive ? 'Premium is Expensive (Favorable for Sellers)' : isVolCheap ? 'Premium is Cheap (Favorable for Buyers)' : 'Premium is Neutral'}
            </div>
          </div>

          {/* PCR CARD */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/10 transition-all cursor-default">
            <div className={`absolute top-0 right-0 w-32 h-32 transition-colors duration-1000 ${config.pcr > 1.2 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : config.pcr < 0.8 ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-slate-500/10 group-hover:bg-slate-500/20'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1 drop-shadow-sm">Put-Call Ratio (PCR)</p>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-md transition-all">{config.pcr.toFixed(2)}</div>
            <div className={`text-[11px] font-bold mt-2 transition-colors w-fit px-2 py-0.5 rounded border ${config.pcr > 1.2 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : config.pcr < 0.8 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-slate-300 bg-slate-700/30 border-slate-600/50'}`}>
              {config.pcr > 1.2 ? 'Oversold / Strong Support' : config.pcr < 0.8 ? 'Overbought / Strong Resistance' : 'Neutral Territory'}
            </div>
          </div>

          {/* MAX PAIN CARD */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/10 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/20 transition-all" />
            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1 drop-shadow-sm">Max Pain Strike</p>
            <div className="text-3xl font-black text-violet-400 tracking-tight drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all">{config.maxPain.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-violet-300 font-bold mt-2 bg-violet-500/10 border border-violet-500/20 w-fit px-2 py-0.5 rounded tracking-wide">
              Estimated by OI Concentration
            </div>
          </div>
        </div>

        {/* ── Main Charts Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Institutional Footprint (FII/PRO vs Retail) */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col min-h-[400px] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  Institutional Net Positioning (EOD)
                </h2>
                <p className="text-[10px] text-slate-400 tracking-wider mt-1 uppercase font-bold">FII & PRO vs Retail Clients</p>
              </div>
               <div className="text-[10px] font-bold text-slate-300 border border-white/20 bg-white/5 px-2 py-1 rounded shadow-sm">T-1 Report</div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fiiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4} barSize={24}>
                  <defs>
                    <linearGradient id="fiiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="proGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                    <linearGradient id="retailGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff', opacity: 0.05 }} />
                  <Bar dataKey="FII" name="Foreign (FII)" fill="url(#fiiGradient)" radius={[4,4,0,0]} isAnimationActive={true} />
                  <Bar dataKey="PRO" name="Proprietary" fill="url(#proGradient)" radius={[4,4,0,0]} isAnimationActive={true} />
                  <Bar dataKey="CLIENT" name="Retail Client" fill="url(#retailGradient)" radius={[4,4,0,0]} isAnimationActive={true} />
                  <ReferenceLine y={0} stroke="#ffffff" strokeOpacity={0.2} strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intraday Theta Decay (Straddle Tracking) */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col min-h-[400px] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group hover:bg-white/10 transition-all">
             <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  ATM Straddle Decay Tracker
                </h2>
                <p className="text-[10px] text-slate-400 tracking-wider mt-1 uppercase font-bold">Combined Call + Put Premium intraday drop</p>
              </div>
              <div className="bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/30 text-amber-400 text-[10px] font-black tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                THETA BLEED
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={straddleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDecay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 21, 32, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.36)' }}
                    itemStyle={{ color: '#fcfcfc', fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                  <Area type="step" isAnimationActive={true} dataKey="premium" name="Straddle Price (₹)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorDecay)" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strike-wise OI Flow Heatmap (Bottom Full Width) */}
          <div className="col-span-1 lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col min-h-[450px] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group hover:bg-white/10 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Intraday Options Flow (Live Additions/Unwinding)
                </h2>
                <p className="text-[10px] text-slate-400 tracking-wider mt-1 uppercase font-bold">Changes in Open Interest at near-ATM strikes (in Thousands)</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 text-[10px] sm:text-[11px] font-bold tracking-wide">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-full shadow-sm"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"/> Call Writing</div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-full shadow-sm"><div className="w-2 h-2 rounded-full bg-rose-300"/> Call Unwind</div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-full shadow-sm"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"/> Put Writing</div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-full shadow-sm"><div className="w-2 h-2 rounded-full bg-emerald-300"/> Put Unwind</div>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strikeData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                    tickFormatter={(val) => `${Math.abs(val).toFixed(0)}k`}
                    domain={([dataMin, dataMax]) => {
                      const maxAbs = Math.max(Math.abs(dataMin), Math.abs(dataMax));
                      // Add 10% padding to the max value for better visuals
                      const paddedMax = Math.ceil(maxAbs * 1.1);
                      return [-paddedMax, paddedMax];
                    }}
                  />
                  <YAxis dataKey="strike" type="category" stroke="#f8fafc" fontSize={12} fontWeight="900" tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff', opacity: 0.05 }}
                    contentStyle={{ backgroundColor: 'rgba(15, 21, 32, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.36)' }}
                    itemStyle={{ color: '#fcfcfc', fontSize: '13px', fontWeight: 'bold' }}
                    formatter={(value: number, name: string, props: any) => {
                      const isCall = name.includes('Call');
                      const actualValue = isCall ? props.payload.callChg : props.payload.putChg;
                      const label = isCall 
                        ? (actualValue > 0 ? 'Call Writing' : 'Call Unwinding') 
                        : (actualValue > 0 ? 'Put Writing' : 'Put Unwinding');
                      return [`${Math.abs(actualValue).toFixed(1)}k`, label];
                    }}
                  />
                  <ReferenceLine x={0} stroke="#ffffff" strokeOpacity={0.2} strokeWidth={2} />
                  
                  {/* Call Bar */}
                  <Bar dataKey="callChgVis" name="Call Writing (Bearish)" radius={[4,0,0,4]} isAnimationActive={true}>
                    {strikeData.map((entry, index) => (
                      <Cell key={`call-${index}`} fill={entry.callChg > 0 ? '#f43f5e' : '#fda4af'} style={{ filter: entry.callChg > 0 ? 'drop-shadow(0 0 4px rgba(244,63,94,0.4))' : 'none' }} />
                    ))}
                  </Bar>
                  
                  <Bar dataKey="putChgVis" name="Put Writing (Bullish)" radius={[0,4,4,0]} isAnimationActive={true}>
                    {strikeData.map((entry, index) => (
                      <Cell key={`put-${index}`} fill={entry.putChg > 0 ? '#10b981' : '#6ee7b7'} style={{ filter: entry.putChg > 0 ? 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' : 'none' }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3 shadow-inner">
              <div className="bg-emerald-500/20 p-1 rounded-full shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                <strong className="text-white tracking-wide uppercase mr-2">Pro Tip:</strong> When significant <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Put Writing</span> coincides with <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Call Unwinding</span> at a strike, it transforms into extremely robust support for the intraday session.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OptionsDecode;
