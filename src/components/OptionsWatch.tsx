import React, { useState, useMemo, useEffect } from 'react';
import { Zap, BarChart3, Activity, Target } from 'lucide-react';
import { getApiBaseUrl } from '../utils/priceApi';

type IndexName = 'NIFTY 50' | 'BANK NIFTY' | 'FINNIFTY' | 'SENSEX';

interface StrikeData {
  strike: number;
  bulls: number;       // Put writers (Support)
  bears: number;       // Call writers (Resistance)
  bullsChange: number; // Daily change in Put OI
  bearsChange: number; // Daily change in Call OI
  isATM?: boolean;
}

const INDEXES: IndexName[] = ['NIFTY 50', 'BANK NIFTY', 'FINNIFTY', 'SENSEX'];

const INDEX_API_SYMBOL: Record<IndexName, string | null> = {
  'NIFTY 50': 'NIFTY',
  'BANK NIFTY': 'BANKNIFTY',
  'FINNIFTY': 'FINNIFTY',
  'SENSEX': null,
};

const OptionsWatch: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<IndexName>('NIFTY 50');
  const [timeProgress, setTimeProgress] = useState<number>(100);
  const [maxTimeProgress, setMaxTimeProgress] = useState<number>(100);
  const [chainData, setChainData] = useState<StrikeData[]>([]);
  const [underlyingValue, setUnderlyingValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  // Set the slider to reflect the current real-world time between 9:15 AM and 3:30 PM
  useEffect(() => {
    const istParts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const weekday = istParts.find((p) => p.type === 'weekday')?.value ?? '';
    const hourStr = istParts.find((p) => p.type === 'hour')?.value ?? '0';
    const minuteStr = istParts.find((p) => p.type === 'minute')?.value ?? '0';

    const currentHours = Number(hourStr);
    const currentMinutes = Number(minuteStr);

    const isWeekday = weekday !== 'Sat' && weekday !== 'Sun';
    const openMinutes = 9 * 60 + 15;
    const closeMinutes = 15 * 60 + 30;
    const nowMinutes = currentHours * 60 + currentMinutes;

    const openNow = isWeekday && nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
    setIsMarketOpen(openNow);

    if (!isWeekday) {
      setTimeProgress(0);
      setMaxTimeProgress(0);
      return;
    }

    if (!openNow) {
      const progress = nowMinutes < openMinutes ? 0 : 100;
      setTimeProgress(progress);
      setMaxTimeProgress(progress);
      return;
    }

    const totalMarketMinutes = closeMinutes - openMinutes;
    const elapsedMinutes = Math.max(0, Math.min(totalMarketMinutes, nowMinutes - openMinutes));
    const progress = (elapsedMinutes / totalMarketMinutes) * 100;

    setTimeProgress(progress);
    setMaxTimeProgress(progress);
  }, []);

  // --- Formatters ---
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatRaw = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getTimeStringFromProgress = (progress: number) => {
    const openMinutes = 9 * 60 + 15;
    const totalMarketMinutes = (15 * 60 + 30) - openMinutes; // 375 mins
    const currentTotalMinutes = openMinutes + (progress / 100) * totalMarketMinutes;
    
    const hours = Math.floor(currentTotalMinutes / 60);
    const minutes = Math.floor(currentTotalMinutes % 60);
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? (hours === 12 ? 12 : hours - 12) : hours;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // --- Data Crunching ---
  type OptionLeg = {
    openInterest?: number;
    changeinOpenInterest?: number;
  };

  type OptionChainRow = {
    strikePrice?: number;
    CE?: OptionLeg;
    PE?: OptionLeg;
  };

  type OptionChainResponse = {
    filtered?: {
      underlyingValue?: number;
      data?: OptionChainRow[];
    };
    records?: {
      underlyingValue?: number;
      data?: OptionChainRow[];
    };
  };

  useEffect(() => {
    let cancelled = false;

    const fetchChain = async () => {
      const apiSymbol = INDEX_API_SYMBOL[selectedIndex];
      if (!apiSymbol) {
        setChainData([]);
        setUnderlyingValue(null);
        setLoadError('Options chain not available for this index.');
        setIsLoading(false);
        setLastUpdatedAt(null);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/options/${encodeURIComponent(apiSymbol)}`);
        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const payload = (await res.json()) as OptionChainResponse;
        const rows = payload.filtered?.data ?? payload.records?.data ?? [];
        const underlying = payload.filtered?.underlyingValue ?? payload.records?.underlyingValue ?? null;

        const normalized = rows
          .map((row): StrikeData | null => {
            if (typeof row.strikePrice !== 'number') return null;
            const peOi = row.PE?.openInterest ?? 0;
            const ceOi = row.CE?.openInterest ?? 0;
            const peChg = row.PE?.changeinOpenInterest ?? 0;
            const ceChg = row.CE?.changeinOpenInterest ?? 0;

            return {
              strike: row.strikePrice,
              bulls: Number.isFinite(peOi) ? peOi : 0,
              bears: Number.isFinite(ceOi) ? ceOi : 0,
              bullsChange: Number.isFinite(peChg) ? peChg : 0,
              bearsChange: Number.isFinite(ceChg) ? ceChg : 0,
            };
          })
          .filter((v): v is StrikeData => v !== null && Number.isFinite(v.strike));

        const sortedAsc = normalized.slice().sort((a, b) => a.strike - b.strike);
        if (!sortedAsc.length) {
          throw new Error('No option chain rows returned');
        }

        let atmIndex = Math.floor(sortedAsc.length / 2);
        if (typeof underlying === 'number' && Number.isFinite(underlying)) {
          let bestIndex = atmIndex;
          let bestDist = Number.POSITIVE_INFINITY;
          sortedAsc.forEach((r, i) => {
            const dist = Math.abs(r.strike - underlying);
            if (dist < bestDist) {
              bestDist = dist;
              bestIndex = i;
            }
          });
          atmIndex = bestIndex;
        }

        const windowSize = 21;
        const half = Math.floor(windowSize / 2);
        let start = Math.max(0, atmIndex - half);
        let end = Math.min(sortedAsc.length, start + windowSize);
        start = Math.max(0, end - windowSize);

        const window = sortedAsc.slice(start, end);
        const atmStrike = sortedAsc[atmIndex]?.strike ?? window[Math.floor(window.length / 2)]?.strike ?? 0;
        const finalRows = window
          .map((r) => ({
            ...r,
            isATM: r.strike === atmStrike,
          }))
          .sort((a, b) => b.strike - a.strike);

        if (cancelled) return;
        setChainData(finalRows);
        setUnderlyingValue(typeof underlying === 'number' && Number.isFinite(underlying) ? underlying : null);
        setLastUpdatedAt(Date.now());
      } catch (e) {
        if (cancelled) return;
        setChainData([]);
        setUnderlyingValue(null);
        setLoadError(e instanceof Error ? e.message : 'Failed to load');
        setLastUpdatedAt(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchChain();
    const intervalId = window.setInterval(fetchChain, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedIndex]);

  const currentData = chainData;

  const emptyStrike: StrikeData = useMemo(
    () => ({ strike: 0, bulls: 0, bears: 0, bullsChange: 0, bearsChange: 0 }),
    []
  );

  const maxBarValue = useMemo(() => {
    if (!currentData.length) return 0;
    return currentData.reduce((max, d) => Math.max(max, d.bulls, d.bears), 0);
  }, [currentData]);

  const totalBulls = useMemo(() => currentData.reduce((acc, curr) => acc + curr.bulls, 0), [currentData]);
  const totalBears = useMemo(() => currentData.reduce((acc, curr) => acc + curr.bears, 0), [currentData]);
  const totalBullsChg = useMemo(() => currentData.reduce((acc, curr) => acc + curr.bullsChange, 0), [currentData]);
  const totalBearsChg = useMemo(() => currentData.reduce((acc, curr) => acc + curr.bearsChange, 0), [currentData]);

  const atmStrikeData = useMemo(() => {
    if (!currentData.length) return emptyStrike;
    return currentData.find((d) => d.isATM) ?? currentData[Math.floor(currentData.length / 2)] ?? emptyStrike;
  }, [currentData, emptyStrike]);

  const maxSupport = useMemo(() => {
    if (!currentData.length) return emptyStrike;
    return currentData.reduce((prev, curr) => (curr.bulls > prev.bulls ? curr : prev), currentData[0]);
  }, [currentData, emptyStrike]);

  const maxResistance = useMemo(() => {
    if (!currentData.length) return emptyStrike;
    return currentData.reduce((prev, curr) => (curr.bears > prev.bears ? curr : prev), currentData[0]);
  }, [currentData, emptyStrike]);
  
  // --- Analytics Derivations ---
  const pcr = totalBears > 0 ? (totalBulls / totalBears).toFixed(2) : '0.00';
  const pcrVal = parseFloat(pcr);
  
  let marketBias = 'Neutral';
  let biasColor = 'text-yellow-400';
  let biasBg = 'bg-yellow-500/10 border-yellow-500/20';
  
  // Momentum logic based on today's change vs absolute PCR
  if (pcrVal > 1.2 || (pcrVal > 1.0 && totalBullsChg > totalBearsChg * 1.5)) {
    marketBias = 'Bullish';
    biasColor = 'text-emerald-400';
    biasBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (pcrVal < 0.8 || (pcrVal < 1.0 && totalBearsChg > totalBullsChg * 1.5)) {
    marketBias = 'Bearish';
    biasColor = 'text-rose-400';
    biasBg = 'bg-rose-500/10 border-rose-500/20';
  }

  // --- Visuals ---
  // Freeze maximum possible capacity for Net charts so vertical bars visibly grow instead of reshaping axes
  const totalNet = Math.max(totalBulls, totalBears);

  const yTicksNet = [1.0, 0.8, 0.6, 0.4, 0.2, 0].map(val => totalNet * val);
  const bullPct = totalBulls + totalBears > 0 ? (totalBulls / (totalBulls + totalBears)) * 100 : 50;
  const bearPct = 100 - bullPct;
  const times = ['9:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:30'];
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return null;
    return new Date(lastUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }, [lastUpdatedAt]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#111111] p-6 text-slate-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Top Navigation & Filters ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            {INDEXES.map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                disabled={!INDEX_API_SYMBOL[idx]}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedIndex === idx
                    ? 'bg-[#60a5fa]/20 text-[#60a5fa] border-2 border-[#60a5fa]/50 shadow-[0_0_12px_rgba(37,99,235,0.25)]'
                    : 'bg-[#1a1a1a] text-[#888] border-2 border-[#2a2a2a] hover:bg-[#222] hover:text-[#bbb]'
                } ${INDEX_API_SYMBOL[idx] ? '' : 'opacity-40 cursor-not-allowed hover:bg-[#1a1a1a] hover:text-[#888]'}`}
              >
                {idx}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <span
               className={`w-2 h-2 rounded-full ${
                 loadError ? 'bg-rose-500' : isMarketOpen ? 'bg-emerald-500' : 'bg-[#555]'
               } ${!isLoading && !loadError && isMarketOpen ? 'animate-pulse' : ''}`}
             />
             <div className="text-xs text-[#666] font-mono tracking-widest uppercase">
                {isLoading
                  ? 'Loading Data'
                  : loadError
                    ? 'Data Unavailable'
                    : isMarketOpen
                      ? `Market Live • ${lastUpdatedLabel ?? ''}`
                      : `Market Closed • ${lastUpdatedLabel ?? ''}`}
             </div>
          </div>
        </div>

        {/* ── Trader Insights Panel (NEW AI/ANALYTICS BAR) ─────────────────── */}
        <div className={`rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl transition-colors duration-500 ${biasBg}`}>
           <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-black/30 backdrop-blur-md">
                 <Zap className={`w-5 h-5 ${biasColor}`} />
              </div>
              <div>
                 <div className="text-[10px] text-[#888] tracking-widest font-black uppercase mb-0.5">Trader Insight • {selectedIndex}</div>
                 <div className="text-sm font-medium text-slate-200">
                    Market bias is currently <span className={`font-black uppercase tracking-wide ${biasColor}`}>{marketBias}</span>. 
                    Immediate Support lies at <strong className="text-emerald-400 font-mono">{maxSupport.strike}</strong> while Resistance is fierce at <strong className="text-rose-400 font-mono">{maxResistance.strike}</strong>.
                 </div>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-4 items-center shrink-0">
              {/* Micro-stat blocks */}
              <div className="bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-center shadow-inner">
                 <div className="text-[9px] text-[#666] uppercase font-bold">ATM Strike</div>
                 <div className="text-sky-400 font-mono font-bold text-sm tracking-wide">{atmStrikeData.strike}</div>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-center shadow-inner">
                 <div className="text-[9px] text-[#666] uppercase font-bold">Spot</div>
                 <div className="text-slate-200 font-mono font-bold text-sm tracking-wide">
                   {underlyingValue ? formatRaw(Math.round(underlyingValue)) : '--'}
                 </div>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-center shadow-inner">
                 <div className="text-[9px] text-[#666] uppercase font-bold">Today's OI Shift</div>
                 <div className="text-sm font-mono font-bold tracking-wide flex gap-2">
                    <span className={totalBullsChg > 0 ? 'text-emerald-400' : 'text-[#888]'}>{totalBullsChg > 0 ? '+' : ''}{formatNumber(totalBullsChg)} Puts</span>
                    <span className={totalBearsChg > 0 ? 'text-rose-400' : 'text-[#888]'}>{totalBearsChg > 0 ? '+' : ''}{formatNumber(totalBearsChg)} Calls</span>
                 </div>
              </div>
           </div>
        </div>

        {/* ── Top Time Slider Panel ────────────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <BarChart3 className="w-48 h-48 -mt-10 -mr-10" />
          </div>
          
          <div className="relative w-full h-8 flex items-center z-10 group">
            {/* Hitbox Input for absolute scrubbing precision */}
            <input 
               type="range" 
               min="0" max="100" 
               value={timeProgress}
               disabled
               className="absolute inset-0 w-full h-full opacity-0 cursor-not-allowed z-30"
            />

            {/* Base Track */}
            <div className="absolute w-full h-1.5 bg-[#2a2a2a] rounded-full"></div>
            
            {/* Future Track (Disabled portion) */}
            <div 
               className="absolute right-0 h-1.5 bg-black/40 rounded-r-full"
               style={{ width: `${100 - maxTimeProgress}%` }}
            ></div>
            
            {/* Filled Glow Track */}
            <div 
               className="absolute left-0 h-1.5 bg-gradient-to-r from-[#0f1520] via-sky-500/80 to-sky-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)] pointer-events-none"
               style={{ width: `${timeProgress}%` }}
            ></div>
            
            {/* Ticks visually overlaid on the track */}
            <div className="absolute w-full flex justify-between px-1 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-[1px] h-2.5 bg-[#444] z-0"></div>
              ))}
            </div>

            {/* Custom Interactive Thumb */}
            <div 
               className="absolute w-6 h-6 bg-[#1a1a1a] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] z-20 border-2 border-sky-400 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform"
               style={{ left: `calc(${timeProgress}% - 12px)` }}
            >
               <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,189,248,1)]"></div>
               
               {/* Time Tooltip Bubble (always visible on hover, or strictly floating above) */}
               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-sky-500/50 text-sky-400 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {getTimeStringFromProgress(timeProgress)}
                  {/* Tooltip triangle pointer */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#1a1a1a]"></div>
               </div>
            </div>
          </div>
          
          {/* Time Labels */}
          <div className="flex justify-between mt-4 text-[11px] font-bold text-[#555] pointer-events-none select-none relative z-10 uppercase tracking-wider">
            {times.map((t, i) => {
               // Approximately mapping labels to percentages: 9:15=0%, 15:30=100%
               const threshold = i * (100 / (times.length - 1));
               const isActive = timeProgress >= threshold;
               return (
                 <div key={t} className={`transition-colors duration-300 ${isActive ? 'text-sky-400' : ''}`}>
                    {t}
                 </div>
               );
            })}
          </div>
        </div>

        {/* ── Main Dashboard Layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: OI Clock Chart (Spans 2 columns) */}
          <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-2">
                <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                   <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-200 tracking-wide">Live OI Clock </h2>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-400 rounded-sm shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                  <span className="text-[#aaa]">Calls (Resistance)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                  <span className="text-[#aaa]">Puts (Support)</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative pr-4 z-10">
              {/* Absolute Center Y-Axis Line */}
              <div className="absolute left-[calc(50%+24px)] top-0 bottom-6 w-px bg-gradient-to-b from-transparent via-[#444] to-transparent z-0"></div>
              
              <div className="w-full flex flex-col space-y-2.5 min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[400px] text-sm text-[#777]">
                    Loading option chain...
                  </div>
                ) : loadError ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-sm text-[#777] gap-2 text-center px-6">
                    <div className="text-slate-200 font-semibold">Options Watch data is unavailable</div>
                    <div className="text-xs text-[#666] font-mono">{loadError}</div>
                  </div>
                ) : (
                currentData.map((row) => {
                  const isMaxSupport = row.strike === maxSupport.strike;
                  const isMaxResist  = row.strike === maxResistance.strike;

                  return (
                    <div key={row.strike} className={`flex flex-row items-center relative group text-[10px] py-1 ${row.isATM ? 'bg-sky-500/5 rounded-lg -mx-2 px-2 border border-sky-500/10' : ''}`}>
                      
                      {/* Strike Label */}
                      <div className="w-14 flex items-center justify-end pr-3 shrink-0 relative">
                         {row.isATM && <span className="absolute -left-1 text-[8px] bg-sky-500 text-black font-black px-1 rounded uppercase tracking-wider">ATM</span>}
                         <span className={`font-mono text-[11px] ${row.isATM ? 'text-sky-300 font-bold' : 'text-[#888] font-medium'}`}>
                           {row.strike}
                         </span>
                      </div>
                      
                      {/* Bars Container */}
                      <div className="flex-1 flex flex-row items-center relative z-10 h-6">
                        
                        {/* Bears (Call Writers) - Extending Left */}
                        <div className="w-1/2 flex justify-end pr-1 h-full relative">
                          {/* Inner bar representing total OI */}
                          <div 
                            className="bg-gradient-to-l from-rose-500 to-red-600 h-full flex items-center justify-start relative shadow-[0_0_15px_rgba(244,63,94,0.15)] opacity-90 rounded-l cursor-crosshair hover:opacity-100 transition-all border border-red-500/50 hover:border-red-400" 
                            style={{ width: `${maxBarValue > 0 ? (row.bears / maxBarValue) * 100 : 0}%` }}
                          >
                             {/* Change indicator inside or next to the bar */}
                             <span className="absolute -left-12 text-[#666] group-hover:text-rose-300 font-mono text-[8px] transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100">
                               {row.bearsChange > 0 ? '+' : ''}{formatNumber(row.bearsChange)} chg
                             </span>
                             {isMaxResist && (
                                <span className="absolute -top-3 right-0 text-[8px] font-bold text-rose-400 tracking-wider">MAX RESISTANCE</span>
                             )}
                          </div>
                          {/* Raw Volume Text fixed near center */}
                          <div className="absolute right-2 pt-1.5 text-white font-mono text-[9px] drop-shadow-md z-20 pointer-events-none opacity-80 group-hover:opacity-100">
                            {formatNumber(row.bears)}
                          </div>
                        </div>
                        
                        {/* Bulls (Put Writers) - Extending Right */}
                        <div className="w-1/2 flex justify-start pl-1 h-full relative">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-400 h-full flex items-center justify-end relative shadow-[0_0_15px_rgba(52,211,153,0.15)] opacity-90 rounded-r cursor-crosshair hover:opacity-100 transition-all border border-emerald-500/50 hover:border-emerald-300" 
                            style={{ width: `${maxBarValue > 0 ? (row.bulls / maxBarValue) * 100 : 0}%` }}
                          >
                             {/* Change indicator */}
                             <span className="absolute -right-12 text-[#666] group-hover:text-emerald-300 font-mono text-[8px] transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100">
                               {row.bullsChange > 0 ? '+' : ''}{formatNumber(row.bullsChange)} chg
                             </span>
                             {isMaxSupport && (
                                <span className="absolute -top-3 left-0 text-[8px] font-bold text-emerald-400 tracking-wider">MAX SUPPORT</span>
                             )}
                          </div>
                           {/* Raw Volume Text fixed near center */}
                           <div className="absolute left-2 pt-1.5 text-black font-semibold font-mono text-[9px] drop-shadow-md z-20 pointer-events-none opacity-80 group-hover:opacity-100">
                            {formatNumber(row.bulls)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between items-center text-[#555] text-[9px] font-mono mt-4 ml-12 px-2 border-t border-[#333] pt-3">
                <span>-3.0M <span className="text-[8px] uppercase tracking-wider text-rose-500/50">Calls</span></span>
                <span>-1.5M</span>
                <span className="text-white bg-[#222] px-2 py-0.5 rounded border border-[#444]">0</span>
                <span>1.5M</span>
                <span>3.0M <span className="text-[8px] uppercase tracking-wider text-emerald-500/50">Puts</span></span>
              </div>
            </div>
          </div>

          {/* Right Layout: Stacked Analytical Charts */}
          <div className="flex flex-col gap-6">
            
            {/* Net Position (Top Right) */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl flex-1 flex flex-col min-h-[260px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                   <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-200 tracking-wide">Net Position</h2>
              </div>
              
              <div className="flex-1 relative flex flex-col z-10">
                
                {/* Top Section: Y-Axis & Chart Flex Row */}
                <div className="flex-1 relative flex">
                  {/* Y-Axis Ticks */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[9px] text-[#666] font-mono select-none z-10">
                    {yTicksNet.map((tick, i) => (
                      <span key={i} className="leading-none">{formatNumber(tick)}</span>
                    ))}
                  </div>
                  
                  {/* Chart Area */}
                  <div className="flex-1 ml-10 flex items-end justify-around relative border-b border-[#444] pb-0 pt-2 px-8">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between -z-0 pointer-events-none pb-0">
                      {yTicksNet.map((_, i) => (
                        <div key={i} className="w-full h-px bg-[#2a2a2a] border-b border-dashed border-[#111]"></div>
                      ))}
                    </div>
                    
                    {/* Bulls Bar */}
                    <div className="w-16 flex flex-col items-center group z-10 h-full justify-end relative cursor-crosshair">
                      <div className="absolute -top-8 bg-black/80 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                         {formatRaw(totalBulls)}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-90 rounded-t shadow-[0_0_20px_rgba(52,211,153,0.2)] group-hover:opacity-100 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-all origin-bottom border-t-2 border-emerald-300"
                        style={{ height: `${Math.max(2, (totalBulls / totalNet) * 100)}%` }}
                      />
                    </div>
                    
                    {/* Bears Bar */}
                    <div className="w-16 flex flex-col items-center group z-10 h-full justify-end relative cursor-crosshair">
                      <div className="absolute -top-8 bg-black/80 border border-rose-500/30 text-rose-400 font-mono text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                         {formatRaw(totalBears)}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-red-600 to-rose-400 opacity-80 rounded-t shadow-[0_0_20px_rgba(244,63,94,0.15)] group-hover:opacity-100 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all origin-bottom border-t-2 border-rose-300"
                        style={{ height: `${Math.max(2, (totalBears / totalNet) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Section: X-Axis Labels in normal flow */}
                <div className="ml-10 flex justify-around px-8 pt-3 pb-1">
                   <div className="flex flex-col items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]"></span>
                      <span className="text-[9px] text-[#888] font-bold tracking-wider uppercase">Put Writers</span>
                   </div>
                   <div className="flex flex-col items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_5px_#f43f5e]"></span>
                      <span className="text-[9px] text-[#888] font-bold tracking-wider uppercase">Call Writers</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Distribution (Bottom Right) */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl flex-1 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                   <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                     <Target className="w-4 h-4 text-violet-400" />
                   </div>
                   <h2 className="text-sm font-bold text-slate-200 tracking-wide">Distribution</h2>
                </div>
                {/* Micro PCR pill */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${biasBg} ${biasColor}`}>
                  PCR {pcr}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center py-6 relative w-full z-10">
                
                {/* Donut Chart SVG completely upgraded */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  
                  {/* Decorative faint outer rings */}
                  <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none"></div>
                  <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none"></div>

                  {/* Donut labels */}
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 font-mono flex flex-col items-center">
                    <span className="text-emerald-400 text-sm font-bold drop-shadow-md">{bullPct.toFixed(1)}%</span>
                  </div>
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 font-mono flex flex-col items-center">
                    <span className="text-rose-400 text-sm font-bold drop-shadow-md">{bearPct.toFixed(1)}%</span>
                  </div>
                  
                  <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90 drop-shadow-2xl">
                    <circle 
                      cx="50"  cy="50" r="40" 
                      fill="transparent" 
                      stroke="#f43f5e" 
                      strokeWidth="12" 
                      className="opacity-90 transition-all duration-700"
                    />
                    <circle 
                      cx="50"  cy="50" r="40" 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="12" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (bullPct / 100) * 251.2}
                      strokeLinecap="round"
                      className="transition-all duration-700 hover:stroke-[14px]"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-full m-4 backdrop-blur-[2px] shadow-inner">
                    <div className="text-[9px] text-[#888] uppercase tracking-widest mb-1">TOTAL OI</div>
                    <div className="text-sm text-white font-mono font-bold tracking-wider">
                       {formatNumber(totalBulls + totalBears)}
                    </div>
                  </div>
                </div>

                {/* Info Text Area */}
                <div className="mt-8 text-center bg-black/20 p-3 rounded-lg border border-white/5 w-full">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Based on market distribution, <strong className={bullPct > bearPct ? "text-emerald-400" : "text-rose-400"}>{Math.max(bullPct, bearPct).toFixed(1)}%</strong> of options writers are positioned for a <strong className="text-white uppercase">{marketBias}</strong> trend.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OptionsWatch;
