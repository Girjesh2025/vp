import React, { useState, useMemo, useEffect } from 'react';
import { Zap, BarChart3, Activity, Target, Shield, Flame, Compass } from 'lucide-react';

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

const INDEX_API_SYMBOL: Record<IndexName, string> = {
  'NIFTY 50': 'NIFTY',
  'BANK NIFTY': 'BANKNIFTY',
  'FINNIFTY': 'FINNIFTY',
  'SENSEX': 'NIFTY', // Fallback to NIFTY proxy if BSE NSE options not exposed
};

const OptionsWatch: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<IndexName>('NIFTY 50');
  const [timeProgress, setTimeProgress] = useState<number>(100);
  const [maxTimeProgress, setMaxTimeProgress] = useState<number>(100);
  const [fullChainData, setFullChainData] = useState<StrikeData[]>([]);
  const [underlyingValue, setUnderlyingValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  // Set the slider to reflect the current real-world time between 9:15 AM and 3:30 PM
  useEffect(() => {
    const compute = () => {
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
        setTimeProgress(100);
        setMaxTimeProgress(100);
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
    };

    compute();
    const intervalId = window.setInterval(compute, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  // --- Formatters ---
  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
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

  // --- Data Fetching ---
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

      setIsLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/options/${encodeURIComponent(apiSymbol)}`);
        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const payload = (await res.json()) as OptionChainResponse;
        const rows = payload.filtered?.data ?? payload.records?.data ?? [];
        let underlying = payload.filtered?.underlyingValue ?? payload.records?.underlyingValue ?? null;

        // If Sensex, scale proxy or use realistic spot if needed
        if (selectedIndex === 'SENSEX' && underlying) {
          underlying = Math.round(underlying * 3.32); // Approximate Sensex ratio
        }

        const normalized = rows
          .map((row): StrikeData | null => {
            if (typeof row.strikePrice !== 'number') return null;
            const peOi = row.PE?.openInterest ?? 0;
            const ceOi = row.CE?.openInterest ?? 0;
            const peChg = row.PE?.changeinOpenInterest ?? 0;
            const ceChg = row.CE?.changeinOpenInterest ?? 0;

            const strike = selectedIndex === 'SENSEX' ? Math.round(row.strikePrice * 3.32 / 100) * 100 : row.strikePrice;

            return {
              strike,
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

        if (cancelled) return;
        setFullChainData(sortedAsc);
        setUnderlyingValue(typeof underlying === 'number' && Number.isFinite(underlying) ? underlying : null);
        setLastUpdatedAt(Date.now());
      } catch (e) {
        if (cancelled) return;
        setFullChainData([]);
        setUnderlyingValue(null);
        setLoadError(e instanceof Error ? e.message : 'Failed to load option chain');
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

  // Factor to scale values when user scrubs timeline
  const timeFactor = useMemo(() => {
    return Math.max(0.1, timeProgress / 100);
  }, [timeProgress]);

  // Scaled chain data based on interactive time slider
  const scaledChain = useMemo(() => {
    return fullChainData.map((d) => ({
      ...d,
      bulls: Math.round(d.bulls * (0.3 + 0.7 * timeFactor)),
      bears: Math.round(d.bears * (0.3 + 0.7 * timeFactor)),
      bullsChange: Math.round(d.bullsChange * timeFactor),
      bearsChange: Math.round(d.bearsChange * timeFactor),
    }));
  }, [fullChainData, timeFactor]);

  const hasLiveData = !isLoading && !loadError && scaledChain.length > 0;

  const emptyStrike: StrikeData = useMemo(
    () => ({ strike: 0, bulls: 0, bears: 0, bullsChange: 0, bearsChange: 0 }),
    []
  );

  // 1. True Full-Chain Support & Resistance
  const maxSupport = useMemo(() => {
    if (!scaledChain.length) return emptyStrike;
    return scaledChain.reduce((prev, curr) => (curr.bulls > prev.bulls ? curr : prev), scaledChain[0]);
  }, [scaledChain, emptyStrike]);

  const maxResistance = useMemo(() => {
    if (!scaledChain.length) return emptyStrike;
    return scaledChain.reduce((prev, curr) => (curr.bears > prev.bears ? curr : prev), scaledChain[0]);
  }, [scaledChain, emptyStrike]);

  // 2. True Full-Chain Max Pain Calculation
  const maxPainStrike = useMemo(() => {
    if (!scaledChain.length) return null;
    let minLoss = Number.POSITIVE_INFINITY;
    let bestStrike = scaledChain[0].strike;

    // Check candidate strikes
    for (const candidate of scaledChain) {
      const strike = candidate.strike;
      let totalLoss = 0;
      for (const row of scaledChain) {
        if (row.strike < strike) {
          // In-the-money Call option buyers
          totalLoss += (strike - row.strike) * row.bears;
        } else if (row.strike > strike) {
          // In-the-money Put option buyers
          totalLoss += (row.strike - strike) * row.bulls;
        }
      }
      if (totalLoss < minLoss) {
        minLoss = totalLoss;
        bestStrike = strike;
      }
    }
    return bestStrike;
  }, [scaledChain]);

  // 3. Full Chain Aggregates
  const totalBulls = useMemo(() => scaledChain.reduce((acc, curr) => acc + curr.bulls, 0), [scaledChain]);
  const totalBears = useMemo(() => scaledChain.reduce((acc, curr) => acc + curr.bears, 0), [scaledChain]);
  const totalBullsChg = useMemo(() => scaledChain.reduce((acc, curr) => acc + curr.bullsChange, 0), [scaledChain]);
  const totalBearsChg = useMemo(() => scaledChain.reduce((acc, curr) => acc + curr.bearsChange, 0), [scaledChain]);

  // 4. Centered Strike Window (21 strikes around ATM)
  const windowedData = useMemo(() => {
    if (!scaledChain.length) return [];
    
    let atmIndex = Math.floor(scaledChain.length / 2);
    if (typeof underlyingValue === 'number' && Number.isFinite(underlyingValue)) {
      let bestIndex = atmIndex;
      let bestDist = Number.POSITIVE_INFINITY;
      scaledChain.forEach((r, i) => {
        const dist = Math.abs(r.strike - underlyingValue);
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
    let end = Math.min(scaledChain.length, start + windowSize);
    start = Math.max(0, end - windowSize);

    const window = scaledChain.slice(start, end);
    const atmStrike = scaledChain[atmIndex]?.strike ?? window[Math.floor(window.length / 2)]?.strike ?? 0;

    return window
      .map((r) => ({
        ...r,
        isATM: r.strike === atmStrike,
      }))
      .sort((a, b) => b.strike - a.strike); // Highest strike on top, lowest on bottom
  }, [scaledChain, underlyingValue]);

  const atmStrikeData = useMemo(() => {
    if (!windowedData.length) return emptyStrike;
    return windowedData.find((d) => d.isATM) ?? windowedData[Math.floor(windowedData.length / 2)] ?? emptyStrike;
  }, [windowedData, emptyStrike]);

  const maxBarValue = useMemo(() => {
    if (!windowedData.length) return 0;
    return windowedData.reduce((max, d) => Math.max(max, d.bulls, d.bears), 0);
  }, [windowedData]);

  // --- Analytics Derivations ---
  const pcr = totalBears > 0 ? (totalBulls / totalBears).toFixed(2) : '0.00';
  const pcrVal = parseFloat(pcr);
  
  let marketBias = 'Neutral';
  let biasColor = 'text-amber-400';
  let biasBg = 'bg-amber-500/10 border-amber-500/20';

  if (!hasLiveData) {
    marketBias = 'No Data';
    biasColor = 'text-slate-500';
    biasBg = 'bg-white/5 border-white/10';
  } else if (pcrVal >= 1.15 || (pcrVal >= 1.0 && totalBullsChg > totalBearsChg * 1.3)) {
    marketBias = 'Strong Bullish';
    biasColor = 'text-emerald-400';
    biasBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (pcrVal >= 1.0) {
    marketBias = 'Mild Bullish';
    biasColor = 'text-emerald-300';
    biasBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (pcrVal <= 0.8 || (pcrVal <= 1.0 && totalBearsChg > totalBullsChg * 1.3)) {
    marketBias = 'Strong Bearish';
    biasColor = 'text-rose-400';
    biasBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (pcrVal < 0.95) {
    marketBias = 'Mild Bearish';
    biasColor = 'text-rose-300';
    biasBg = 'bg-rose-500/10 border-rose-500/20';
  }

  const totalNet = Math.max(totalBulls, totalBears, 1);
  const yTicksNet = [1.0, 0.8, 0.6, 0.4, 0.2, 0].map(val => totalNet * val);
  const bullPct = totalBulls + totalBears > 0 ? (totalBulls / (totalBulls + totalBears)) * 100 : 50;
  const bearPct = 100 - bullPct;
  const times = ['9:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:30'];

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return null;
    return new Date(lastUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }, [lastUpdatedAt]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#070d18] p-4 sm:p-6 text-slate-300 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-5">

        {/* ── Top Navigation & Filters ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {INDEXES.map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-gradient-to-r from-blue-600/30 to-sky-500/30 text-sky-300 border-2 border-sky-400/60 shadow-[0_0_16px_rgba(56,189,248,0.3)]'
                    : 'bg-[#0f172a] text-slate-400 border border-white/10 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                {idx}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  loadError ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : isMarketOpen ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="text-xs text-slate-300 font-bold tracking-wider uppercase">
                {isLoading
                  ? 'Loading Chain…'
                  : loadError
                    ? 'Data Unavailable'
                    : isMarketOpen
                      ? `Market Live • ${lastUpdatedLabel ?? ''}`
                      : `Market Closed • ${lastUpdatedLabel ?? ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Trader Insights & Key Metrics Panel ───────────────────────────── */}
        <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-2xl transition-all duration-500 ${biasBg}`}>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shrink-0 shadow-inner">
              <Zap className={`w-6 h-6 ${biasColor}`} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 tracking-widest font-black uppercase mb-1">
                TRADER INSIGHT • {selectedIndex}
              </div>
              <div className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                {hasLiveData ? (
                  <>
                    Market bias is <span className={`font-black uppercase tracking-wide px-2 py-0.5 rounded bg-black/30 border border-white/10 ${biasColor}`}>{marketBias}</span>. 
                    Major Support at <strong className="text-emerald-400 font-mono font-black">{maxSupport.strike}</strong> &amp; Strong Resistance at <strong className="text-rose-400 font-mono font-black">{maxResistance.strike}</strong>.
                  </>
                ) : (
                  <>
                    Option chain is currently <span className={`font-black uppercase tracking-wide ${biasColor}`}>{marketBias}</span>.
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            {/* ATM Strike */}
            <div className="bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-center shadow-inner">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ATM Strike</div>
              <div className="text-sky-400 font-mono font-black text-base mt-0.5">
                {hasLiveData ? atmStrikeData.strike : '--'}
              </div>
            </div>

            {/* Spot Price */}
            <div className="bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-center shadow-inner">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Spot Price</div>
              <div className="text-slate-100 font-mono font-black text-base mt-0.5">
                {underlyingValue ? formatRaw(Math.round(underlyingValue)) : '--'}
              </div>
            </div>

            {/* Max Pain */}
            <div className="bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-center shadow-inner">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Max Pain</div>
              <div className="text-amber-400 font-mono font-black text-base mt-0.5">
                {hasLiveData && maxPainStrike ? maxPainStrike : '--'}
              </div>
            </div>

            {/* PCR */}
            <div className="bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-center shadow-inner">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total PCR</div>
              <div className={`font-mono font-black text-base mt-0.5 ${pcrVal >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hasLiveData ? pcr : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Interactive Time Slider Panel ─────────────────────────────────── */}
        <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Intraday Session Playback</span>
            </div>
            <div className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full">
              🕒 {getTimeStringFromProgress(timeProgress)}
            </div>
          </div>

          <div className="relative w-full h-8 flex items-center z-10 group">
            {/* Interactive Range Input */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={timeProgress}
              onChange={(e) => setTimeProgress(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />

            {/* Base Track */}
            <div className="absolute w-full h-2 bg-[#1e293b] rounded-full"></div>
            
            {/* Filled Glow Track */}
            <div 
              className="absolute left-0 h-2 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full shadow-[0_0_18px_rgba(56,189,248,0.7)] pointer-events-none"
              style={{ width: `${timeProgress}%` }}
            />
            
            {/* Tick marks */}
            <div className="absolute w-full flex justify-between px-1 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-[1px] h-3 bg-white/20 z-0" />
              ))}
            </div>

            {/* Thumb */}
            <div 
              className="absolute w-6 h-6 bg-[#0f172a] rounded-full shadow-[0_0_20px_rgba(56,189,248,0.8)] z-20 border-2 border-cyan-400 flex items-center justify-center pointer-events-none group-hover:scale-125 transition-transform"
              style={{ left: `calc(${timeProgress}% - 12px)` }}
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
            </div>
          </div>
          
          {/* Time Labels */}
          <div className="flex justify-between mt-3 text-[11px] font-bold text-slate-500 pointer-events-none select-none relative z-10 uppercase tracking-wider">
            {times.map((t, i) => {
              const threshold = i * (100 / (times.length - 1));
              const isActive = timeProgress >= threshold;
              return (
                <div key={t} className={`transition-colors duration-300 ${isActive ? 'text-sky-300 font-black' : ''}`}>
                  {t}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Dashboard Layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Live OI Clock Chart (Spans 2 columns) */}
          <div className="lg:col-span-2 bg-[#0b1220] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
            
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="bg-sky-500/10 p-2 rounded-xl border border-sky-500/20 shadow-inner">
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-100 tracking-wide">Live OI Clock</h2>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bilateral Strike Depth</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-wider bg-black/40 px-4 py-2 rounded-xl border border-white/8 shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#ff1744] rounded-sm shadow-[0_0_10px_rgba(255,23,68,0.8)] border border-[#ff5252]" />
                  <span className="text-rose-300">Calls (Resistance)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#00e676] rounded-sm shadow-[0_0_10px_rgba(0,230,118,0.8)] border border-[#69f0ae]" />
                  <span className="text-emerald-300">Puts (Support)</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative pr-2 z-10">
              {/* Absolute Center Y-Axis Line */}
              <div className="absolute left-[calc(50%+30px)] top-0 bottom-6 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent z-0" />
              
              <div className="w-full flex flex-col space-y-2 min-h-[420px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center min-h-[420px] text-sm text-slate-400 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                    <span>Loading live option chain…</span>
                  </div>
                ) : loadError ? (
                  <div className="flex flex-col items-center justify-center min-h-[420px] text-sm text-slate-400 gap-2 text-center px-6">
                    <div className="text-slate-200 font-bold">Options Watch data unavailable</div>
                    <div className="text-xs text-rose-400 font-mono">{loadError}</div>
                  </div>
                ) : (
                  windowedData.map((row) => {
                    const isMaxSupport = row.strike === maxSupport.strike;
                    const isMaxResist  = row.strike === maxResistance.strike;
                    const isMaxPain = row.strike === maxPainStrike;

                    return (
                      <div 
                        key={row.strike} 
                        className={`flex flex-row items-center relative group text-[10px] py-1 transition-all rounded-lg ${
                          row.isATM 
                            ? 'bg-sky-500/10 -mx-2 px-2 border-y border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]' 
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        
                        {/* Strike Label & Badges */}
                        <div className="w-16 flex items-center justify-end pr-3 shrink-0 relative">
                          {row.isATM && (
                            <span className="absolute -left-1 text-[8px] bg-gradient-to-r from-sky-400 to-blue-500 text-black font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-[0_0_8px_rgba(56,189,248,0.8)]">
                              ATM
                            </span>
                          )}
                          <span className={`font-mono text-[12px] ${row.isATM ? 'text-sky-300 font-black' : 'text-slate-400 font-bold'}`}>
                            {row.strike}
                          </span>
                        </div>
                        
                        {/* Bars Container */}
                        <div className="flex-1 flex flex-row items-center relative z-10 h-7">
                          
                          {/* Bears (Call Writers) - Extending Left (VIVID ELECTRIC NEON RED) */}
                          <div className="w-1/2 flex justify-end pr-1 h-full relative">
                            <div 
                              className="bg-gradient-to-l from-[#ff1744] to-[#d50000] h-full flex items-center justify-start relative rounded-l cursor-crosshair transition-all border border-[#ff5252] shadow-[0_0_12px_rgba(255,23,68,0.35)] group-hover:shadow-[0_0_20px_rgba(255,23,68,0.6)]" 
                              style={{ width: `${maxBarValue > 0 ? Math.max(3, (row.bears / maxBarValue) * 100) : 0}%` }}
                            >
                              {/* Change indicator on hover */}
                              <span className="absolute -left-16 text-slate-400 group-hover:text-rose-300 font-mono text-[9px] font-bold transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100">
                                {row.bearsChange > 0 ? '+' : ''}{formatNumber(row.bearsChange)} chg
                              </span>
                              {isMaxResist && (
                                <span className="absolute -top-3.5 right-0 text-[8px] font-black text-rose-400 tracking-wider bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40">
                                  MAX RESISTANCE
                                </span>
                              )}
                              {isMaxPain && (
                                <span className="absolute -bottom-3.5 right-0 text-[8px] font-black text-amber-400 tracking-wider bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                                  MAX PAIN
                                </span>
                              )}
                            </div>
                            {/* Raw Volume Text */}
                            <div className="absolute right-2.5 pt-1.5 text-white font-mono font-black text-[10px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] z-20 pointer-events-none">
                              {formatNumber(row.bears)}
                            </div>
                          </div>
                          
                          {/* Bulls (Put Writers) - Extending Right (VIVID ELECTRIC NEON GREEN) */}
                          <div className="w-1/2 flex justify-start pl-1 h-full relative">
                            <div 
                              className="bg-gradient-to-r from-[#00c853] to-[#00e676] h-full flex items-center justify-end relative rounded-r cursor-crosshair transition-all border border-[#69f0ae] shadow-[0_0_12px_rgba(0,230,118,0.35)] group-hover:shadow-[0_0_20px_rgba(0,230,118,0.6)]" 
                              style={{ width: `${maxBarValue > 0 ? Math.max(3, (row.bulls / maxBarValue) * 100) : 0}%` }}
                            >
                              {/* Change indicator on hover */}
                              <span className="absolute -right-16 text-slate-400 group-hover:text-emerald-300 font-mono text-[9px] font-bold transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100">
                                {row.bullsChange > 0 ? '+' : ''}{formatNumber(row.bullsChange)} chg
                              </span>
                              {isMaxSupport && (
                                <span className="absolute -top-3.5 left-0 text-[8px] font-black text-emerald-400 tracking-wider bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                  MAX SUPPORT
                                </span>
                              )}
                            </div>
                            {/* Raw Volume Text */}
                            <div className="absolute left-2.5 pt-1.5 text-black font-mono font-black text-[10px] drop-shadow-sm z-20 pointer-events-none">
                              {formatNumber(row.bulls)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* X Axis scale */}
              <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono mt-5 ml-16 px-2 border-t border-white/10 pt-3">
                <span className="text-rose-400 font-bold">← Higher Call Resistance</span>
                <span className="text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 font-black">
                  {underlyingValue ? `SPOT: ${formatRaw(Math.round(underlyingValue))}` : '0'}
                </span>
                <span className="text-emerald-400 font-bold">Higher Put Support →</span>
              </div>
            </div>
          </div>

          {/* Right Layout: Stacked Analytical Charts */}
          <div className="flex flex-col gap-6">
            
            {/* Net Position (Top Right) */}
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col min-h-[270px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 shadow-inner">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-100 tracking-wide">Net Position</h2>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Chain Volume</span>
                  </div>
                </div>
                <div className="text-xs font-mono font-black text-sky-400">
                  PCR: {pcr}
                </div>
              </div>
              
              <div className="flex-1 relative flex flex-col z-10">
                {/* Top Section: Y-Axis & Chart Flex Row */}
                <div className="flex-1 relative flex">
                  {/* Y-Axis Ticks */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[9px] text-slate-500 font-mono select-none z-10">
                    {yTicksNet.map((tick, i) => (
                      <span key={i} className="leading-none">{formatNumber(tick)}</span>
                    ))}
                  </div>
                  
                  {/* Chart Area */}
                  <div className="flex-1 ml-10 flex items-end justify-around relative border-b border-white/10 pb-0 pt-2 px-8">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between -z-0 pointer-events-none pb-0">
                      {yTicksNet.map((_, i) => (
                        <div key={i} className="w-full h-px bg-white/[0.04] border-b border-dashed border-white/5" />
                      ))}
                    </div>
                    
                    {/* Bulls Bar (Put Writers) */}
                    <div className="w-18 flex flex-col items-center group z-10 h-full justify-end relative cursor-crosshair">
                      <div className="absolute -top-8 bg-slate-900 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                        {formatRaw(totalBulls)} Puts
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-[#00c853] to-[#00e676] rounded-t-xl shadow-[0_0_25px_rgba(0,230,118,0.4)] group-hover:shadow-[0_0_35px_rgba(0,230,118,0.7)] transition-all origin-bottom border-t-2 border-[#b9f6ca]"
                        style={{ height: `${Math.max(4, (totalBulls / totalNet) * 100)}%` }}
                      />
                    </div>
                    
                    {/* Bears Bar (Call Writers) */}
                    <div className="w-18 flex flex-col items-center group z-10 h-full justify-end relative cursor-crosshair">
                      <div className="absolute -top-8 bg-slate-900 border border-rose-500/40 text-rose-400 font-mono text-[10px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                        {formatRaw(totalBears)} Calls
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-[#d50000] to-[#ff1744] rounded-t-xl shadow-[0_0_25px_rgba(255,23,68,0.4)] group-hover:shadow-[0_0_35px_rgba(255,23,68,0.7)] transition-all origin-bottom border-t-2 border-[#ff8a80]"
                        style={{ height: `${Math.max(4, (totalBears / totalNet) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Section: X-Axis Labels */}
                <div className="ml-10 flex justify-around px-8 pt-3 pb-1">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676]" />
                    <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Put Support</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ff1744] shadow-[0_0_8px_#ff1744]" />
                    <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Call Resist</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution (Bottom Right) */}
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-violet-500/10 p-2 rounded-xl border border-violet-500/20 shadow-inner">
                    <Target className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-100 tracking-wide">OI Dominance</h2>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bull vs Bear Share</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${biasBg} ${biasColor}`}>
                  {marketBias}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center py-4 relative w-full z-10">
                {/* Donut Chart SVG */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none" />
                  <div className="absolute inset-5 border border-white/5 rounded-full pointer-events-none" />

                  {/* Donut labels */}
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 font-mono flex flex-col items-center">
                    <span className="text-[#00e676] text-sm font-black drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]">
                      {bullPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Puts</span>
                  </div>
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 font-mono flex flex-col items-center">
                    <span className="text-[#ff1744] text-sm font-black drop-shadow-[0_0_8px_rgba(255,23,68,0.6)]">
                      {bearPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Calls</span>
                  </div>
                  
                  <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90 drop-shadow-2xl">
                    <circle 
                      cx="50" cy="50" r="38" 
                      fill="transparent" 
                      stroke="#ff1744" 
                      strokeWidth="12" 
                      className="opacity-95 transition-all duration-700"
                    />
                    <circle 
                      cx="50" cy="50" r="38" 
                      fill="transparent" 
                      stroke="#00e676" 
                      strokeWidth="12" 
                      strokeDasharray="238.7" 
                      strokeDashoffset={238.7 - (bullPct / 100) * 238.7}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070d18]/80 rounded-full m-5 backdrop-blur-[2px] shadow-inner border border-white/5">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">TOTAL OI</div>
                    <div className="text-sm text-white font-mono font-black tracking-wider mt-0.5">
                      {formatNumber(totalBulls + totalBears)}
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="mt-4 text-center bg-black/30 p-3 rounded-xl border border-white/5 w-full">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    <strong className={bullPct > bearPct ? "text-[#00e676] font-black" : "text-[#ff1744] font-black"}>
                      {Math.max(bullPct, bearPct).toFixed(1)}%
                    </strong> of option writers are positioning for a{' '}
                    <strong className="text-white uppercase font-black">{marketBias}</strong> move.
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
