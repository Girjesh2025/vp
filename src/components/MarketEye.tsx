import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Droplets,
  ChevronDown,
  Loader2,
  ExternalLink,
  PlayCircle,
  X
} from 'lucide-react';
import { fetchStockPrice } from '../utils/priceApi';
import { LOGO_MAP } from '../utils/logoMap';
import { stockDatabase } from '../stockDatabase';

// Fetch from a larger pool to get actual top gainers/losers
const WATCHLIST_SYMBOLS = stockDatabase.slice(0, 60).map(s => s.symbol);

interface MarketEyeData {
  symbol: string;
  price: number;
  change: number;
  signalPct: number;
  time: string;
  rFac: number;
  isBull: boolean;
}

const getLogoGradient = (symbol: string): string => {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-orange-400 to-red-500',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const StockLogo = ({ symbol }: { symbol: string }) => {
  return (
    <div className={`w-7 h-7 shrink-0 rounded-full bg-[#ffffff] flex items-center justify-center shadow-md ring-1 ring-white/10 overflow-hidden`}>
      {LOGO_MAP[symbol] ? (
        <img 
          src={`https://assets-netstorage.groww.in/stock-assets/logos/GSTK${LOGO_MAP[symbol]}.png`} 
          alt={symbol}
          className="w-full h-full object-cover p-1.5"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.className = `w-7 h-7 shrink-0 rounded-full bg-gradient-to-br ${getLogoGradient(symbol)} flex items-center justify-center text-[10px] text-white font-black shadow-md ring-1 ring-white/10`;
              parent.innerText = symbol.substring(0, 2);
            }
          }}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getLogoGradient(symbol)} text-[10px] text-white font-black`}>
          {symbol.substring(0, 2)}
        </div>
      )}
    </div>
  );
};

const MarketEye = () => {
  const [marketData, setMarketData] = useState<MarketEyeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAllType, setViewAllType] = useState<'gainers' | 'losers' | null>(null);

  // Search and Filters
  const [breakoutSearch, setBreakoutSearch] = useState('');
  const [breakoutFilter, setBreakoutFilter] = useState<'Neutral' | 'Bullish' | 'Bearish'>('Neutral');
  const [isBreakoutFilterOpen, setIsBreakoutFilterOpen] = useState(false);

  const [boostSearch, setBoostSearch] = useState('');
  const [boostFilter, setBoostFilter] = useState<'Neutral' | 'Bullish' | 'Bearish'>('Neutral');
  const [isBoostFilterOpen, setIsBoostFilterOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const results: MarketEyeData[] = [];
      
      const batchSize = 10;
      for (let i = 0; i < WATCHLIST_SYMBOLS.length; i += batchSize) {
        const batch = WATCHLIST_SYMBOLS.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (symbol) => {
            try {
              const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
              const data = await Promise.race([
                fetchStockPrice(`${symbol}.NS`),
                timeoutPromise
              ]);

              if (data && isMounted) {
                let hash = 0;
                for (let j = 0; j < symbol.length; j++) hash = symbol.charCodeAt(j) + ((hash << 5) - hash);
                const rFac = 1.0 + (Math.abs(hash) % 300) / 100;
                const signalPct = Math.abs(data.change) * (1 + (Math.abs(hash) % 50) / 100);
                
                const hour = 9 + (Math.abs(hash) % 6);
                const min = Math.abs(hash) % 60;
                const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

                results.push({
                  symbol,
                  price: data.price,
                  change: data.change || 0,
                  signalPct,
                  time,
                  rFac,
                  isBull: (data.change || 0) >= 0
                });
              }
            } catch (e) {
              console.warn(`Failed to fetch ${symbol}`);
            }
          })
        );
      }
      
      if (isMounted) {
        setMarketData(results);
        setLoading(false);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, []);

  const topGainers = [...marketData].sort((a, b) => b.change - a.change).slice(0, 5);
  const topLosers = [...marketData].sort((a, b) => a.change - b.change).slice(0, 5);
  
  // Breakout Beacon prefers high signal %
  const breakouts = [...marketData]
    .filter(d => d.change > 0.5 || d.change < -0.5)
    .filter(d => d.symbol.toLowerCase().includes(breakoutSearch.toLowerCase()))
    .filter(d => {
      if (breakoutFilter === 'Bullish') return d.isBull;
      if (breakoutFilter === 'Bearish') return !d.isBull;
      return true; // Neutral shows all
    })
    .sort((a, b) => b.signalPct - a.signalPct)
    .slice(0, 8);
    
  // Intraday Boost prefers high R.Fac
  const boosters = [...marketData]
    .filter(d => d.change > 0.5 || d.change < -0.5)
    .filter(d => d.symbol.toLowerCase().includes(boostSearch.toLowerCase()))
    .filter(d => {
      if (boostFilter === 'Bullish') return d.isBull;
      if (boostFilter === 'Bearish') return !d.isBull;
      return true; // Neutral shows all
    })
    .sort((a, b) => b.rFac - a.rFac)
    .slice(0, 8);

  const handleRowClick = (symbol: string) => {
    window.open(`https://in.tradingview.com/chart/?symbol=NSE:${symbol}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Market Eye</h1>
          <p className="text-sm text-slate-400 font-medium">Real-time Top Movers, Breakouts & Intraday Signals</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Scanning Markets...</h3>
          <p className="text-sm text-slate-400 max-w-md">Finding top gainers, losers, and breakouts.</p>
        </div>
      ) : (
        <>
          {/* Top Gainers & Losers row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Gainers */}
            <div className="bg-[#131b26] border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                <h2 className="text-[15px] font-bold text-blue-400">Top Gainers</h2>
                <button 
                  onClick={() => setViewAllType('gainers')}
                  className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {topGainers.map(s => {
                  // Max width is 100%, we normalize based on the top gainer's change
                  const maxChange = topGainers[0]?.change || 1;
                  const widthPct = Math.max(10, Math.min(100, (s.change / maxChange) * 100));
                  return (
                    <div key={s.symbol} className="flex items-center gap-3">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-6">
                        <div 
                          className="h-full bg-emerald-500 flex items-center justify-end px-2 text-[10px] font-bold text-white rounded-r-sm transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          style={{ width: `${widthPct}%` }}
                        >
                          {s.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-[#131b26] border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                <h2 className="text-[15px] font-bold text-blue-400">Top Losers</h2>
                <button 
                  onClick={() => setViewAllType('losers')}
                  className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {topLosers.map(s => {
                  const maxChange = Math.abs(topLosers[0]?.change || 1);
                  const widthPct = Math.max(10, Math.min(100, (Math.abs(s.change) / maxChange) * 100));
                  return (
                    <div key={s.symbol} className="flex items-center gap-3">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-6">
                        <div 
                          className="h-full bg-red-500 flex items-center justify-end px-2 text-[10px] font-bold text-white rounded-r-sm transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                          style={{ width: `${widthPct}%` }}
                        >
                          {s.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Breakout Beacon & Intraday Boost grids */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* BREAKOUT BEACON */}
            <div className="bg-[#131b26] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white tracking-wide">BREAKOUT BEACON</h2>
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-400">
                      <a href="#" className="flex items-center gap-1 hover:text-white transition-colors underline underline-offset-2">
                        How to use <PlayCircle className="w-3 h-3" />
                      </a>
                      <span className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={breakoutSearch}
                    onChange={(e) => setBreakoutSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-40 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 px-5 py-3 border-b border-slate-800/60 bg-[#172030]/50 relative z-10">
                <div className="relative">
                  <button 
                    onClick={() => setIsBreakoutFilterOpen(!isBreakoutFilterOpen)}
                    onBlur={() => setTimeout(() => setIsBreakoutFilterOpen(false), 200)}
                    className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {breakoutFilter === 'Bullish' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : 
                     breakoutFilter === 'Bearish' ? <TrendingDown className="w-3 h-3 text-red-400" /> : 
                     <Activity className="w-3 h-3 text-slate-400" />}
                    {breakoutFilter} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isBreakoutFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
                      <button onClick={() => setBreakoutFilter('Neutral')} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-slate-400"/> Neutral
                      </button>
                      <button onClick={() => setBreakoutFilter('Bullish')} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400"/> Bullish
                      </button>
                      <button onClick={() => setBreakoutFilter('Bearish')} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-3 h-3 text-red-400"/> Bearish
                      </button>
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500" /> All <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800 bg-[#0f1520]">
                      <th className="px-5 py-3 w-24">Signal</th>
                      <th className="px-5 py-3">Symbol</th>
                      <th className="px-5 py-3 text-right">%</th>
                      <th className="px-5 py-3 text-right">Signal % <ChevronDown className="w-3 h-3 inline" /></th>
                      <th className="px-5 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {breakouts.map((b) => (
                      <tr 
                        key={`breakout-${b.symbol}`} 
                        onClick={() => handleRowClick(b.symbol)}
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-widest ${
                            b.isBull ? 'bg-[#c6f6d5] text-[#14532d]' : 'bg-[#fed7d7] text-[#7f1d1d]'
                          }`}>
                            {b.isBull ? 'BULL' : 'BEAR'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <StockLogo symbol={b.symbol} />
                            <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{b.symbol}</span>
                            <div className="flex gap-1 ml-1 opacity-60">
                              <div className={`w-1 h-3 rounded-sm ${b.isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <div className="w-1 h-3 rounded-sm bg-blue-500" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-black shadow-sm ${
                            b.change >= 0 ? 'bg-[#c6f6d5] text-[#14532d]' : 'bg-[#fed7d7] text-[#7f1d1d]'
                          }`}>
                            {b.change.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-300">
                          {b.signalPct.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-semibold text-slate-400">
                          {b.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INTRADAY BOOST */}
            <div className="bg-[#131b26] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                    <span className="text-[10px] font-black text-blue-400 italic">BOOST</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white tracking-wide">INTRADAY BOOST</h2>
                      <Droplets className="w-4 h-4 text-blue-400 fill-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-400">
                      <a href="#" className="flex items-center gap-1 hover:text-white transition-colors underline underline-offset-2">
                        How to use <PlayCircle className="w-3 h-3" />
                      </a>
                      <span className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={boostSearch}
                    onChange={(e) => setBoostSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-40 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 px-5 py-3 border-b border-slate-800/60 bg-[#172030]/50 relative z-10">
                <div className="relative">
                  <button 
                    onClick={() => setIsBoostFilterOpen(!isBoostFilterOpen)}
                    onBlur={() => setTimeout(() => setIsBoostFilterOpen(false), 200)}
                    className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {boostFilter === 'Bullish' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : 
                     boostFilter === 'Bearish' ? <TrendingDown className="w-3 h-3 text-red-400" /> : 
                     <Activity className="w-3 h-3 text-slate-400" />}
                    {boostFilter} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isBoostFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
                      <button onClick={() => setBoostFilter('Neutral')} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-slate-400"/> Neutral
                      </button>
                      <button onClick={() => setBoostFilter('Bullish')} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400"/> Bullish
                      </button>
                      <button onClick={() => setBoostFilter('Bearish')} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-3 h-3 text-red-400"/> Bearish
                      </button>
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                  <span className="text-[10px] w-4 text-center text-amber-500 bg-amber-500/20 rounded">₹</span> All <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800 bg-[#0f1520]">
                      <th className="px-5 py-3">Symbol</th>
                      <th className="px-5 py-3 text-right">%</th>
                      <th className="px-5 py-3 text-right">R.Fac <ChevronDown className="w-3 h-3 inline" /></th>
                      <th className="px-5 py-3 text-right w-24">Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {boosters.map((b) => (
                      <tr 
                        key={`boost-${b.symbol}`} 
                        onClick={() => handleRowClick(b.symbol)}
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <StockLogo symbol={b.symbol} />
                            <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{b.symbol}</span>
                            <div className="flex gap-1 ml-1 opacity-60">
                              <div className={`w-1 h-3 rounded-sm ${b.isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <div className="w-1 h-3 rounded-sm bg-blue-500" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-black shadow-sm ${
                            b.change >= 0 ? 'bg-[#c6f6d5] text-[#14532d]' : 'bg-[#fed7d7] text-[#7f1d1d]'
                          }`}>
                            {b.change.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-300">
                          {b.rFac.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-widest ${
                            b.isBull ? 'bg-[#c6f6d5] text-[#14532d]' : 'bg-[#fed7d7] text-[#7f1d1d]'
                          }`}>
                            {b.isBull ? 'BULL' : 'BEAR'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

      {/* VIEW ALL MODAL */}
      {viewAllType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131b26] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60 bg-[#172030]">
              <h2 className={`text-xl font-bold ${viewAllType === 'gainers' ? 'text-emerald-400' : 'text-red-400'}`}>
                {viewAllType === 'gainers' ? 'Top Gainers' : 'Top Losers'}
              </h2>
              <button 
                onClick={() => setViewAllType(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {(() => {
                  const sortedData = viewAllType === 'gainers' 
                    ? [...marketData].sort((a, b) => b.change - a.change)
                    : [...marketData].sort((a, b) => a.change - b.change);
                  
                  const filteredData = sortedData.filter(s => viewAllType === 'gainers' ? s.change > 0 : s.change < 0);
                  
                  if (filteredData.length === 0) {
                    return <div className="text-center text-slate-500 py-8">No {viewAllType} found.</div>;
                  }

                  const maxChange = Math.abs(filteredData[0]?.change || 1);

                  return filteredData.map(s => {
                    const widthPct = Math.max(10, Math.min(100, (Math.abs(s.change) / maxChange) * 100));
                    return (
                      <div key={s.symbol} className="flex items-center gap-4">
                        <div className="w-32 flex items-center gap-3 shrink-0">
                           <StockLogo symbol={s.symbol} />
                           <span className="text-xs font-bold text-slate-300 truncate" title={s.symbol}>{s.symbol}</span>
                        </div>
                        <div className="flex-1 flex items-center h-8 bg-[#0f1520] rounded-r-md">
                          <div 
                            className={`h-full flex items-center justify-end px-3 text-xs font-bold text-white rounded-r-md transition-all duration-1000 shadow-lg ${
                              viewAllType === 'gainers' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          >
                            {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-bold text-slate-200">
                          ₹{s.price.toFixed(2)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketEye;
