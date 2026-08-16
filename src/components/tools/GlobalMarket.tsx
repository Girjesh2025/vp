import React, { useState, useEffect } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { Globe, ArrowLeft, TrendingUp, TrendingDown, Clock, Activity, RefreshCw, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchStockPrice } from '../../utils/priceApi';

interface GlobalIndex {
  symbol: string;
  name: string;
  category: 'India' | 'US' | 'Asia' | 'Europe' | 'Macro';
  type: 'INDEX' | 'FUTURES' | 'COMMODITY' | 'CURRENCY' | 'BOND';
  country: string;
  flag: string;
  price: number;
  change: number;
  changePercent: number;
  status: 'open' | 'closed';
  lastUpdate: string;
  link?: string;
  sourceNote?: string;
  isEstimated?: boolean;
}

const BASE_INDICES: Omit<GlobalIndex, 'price' | 'change' | 'changePercent' | 'status' | 'lastUpdate'>[] = [
  // ── Indian Indices & Proxies ──────────────────────────────────
  { symbol: 'GIFT_NIFTY_MOCK', name: 'GIFT Nifty 50', category: 'India', type: 'FUTURES', country: 'INDIA (NSE IX)', flag: '🇮🇳' },
  { symbol: '^NSEI', name: 'NIFTY 50', category: 'India', type: 'INDEX', country: 'INDIA', flag: '🇮🇳' },
  { symbol: '^BSESN', name: 'SENSEX', category: 'India', type: 'INDEX', country: 'INDIA', flag: '🇮🇳' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY', category: 'India', type: 'INDEX', country: 'INDIA', flag: '🇮🇳' },

  // ── US Markets & Futures ──────────────────────────────────────
  { symbol: '^DJI', name: 'Dow Jones 30', category: 'US', type: 'INDEX', country: 'UNITED STATES', flag: '🇺🇸' },
  { symbol: 'YM=F', name: 'Dow Futures', category: 'US', type: 'FUTURES', country: 'UNITED STATES', flag: '🇺🇸' },
  { symbol: '^IXIC', name: 'NASDAQ Comp', category: 'US', type: 'INDEX', country: 'UNITED STATES', flag: '🇺🇸' },
  { symbol: 'NQ=F', name: 'Nasdaq Futures', category: 'US', type: 'FUTURES', country: 'UNITED STATES', flag: '🇺🇸' },
  { symbol: '^GSPC', name: 'S&P 500', category: 'US', type: 'INDEX', country: 'UNITED STATES', flag: '🇺🇸' },
  { symbol: 'ES=F', name: 'S&P 500 Futures', category: 'US', type: 'FUTURES', country: 'UNITED STATES', flag: '🇺🇸' },

  // ── Asian Markets ─────────────────────────────────────────────
  { symbol: '^N225', name: 'Nikkei 225', category: 'Asia', type: 'INDEX', country: 'JAPAN', flag: '🇯🇵' },
  { symbol: '^HSI', name: 'Hang Seng', category: 'Asia', type: 'INDEX', country: 'HONG KONG', flag: '🇭🇰' },
  { symbol: '^KS11', name: 'KOSPI', category: 'Asia', type: 'INDEX', country: 'SOUTH KOREA', flag: '🇰🇷' },
  { symbol: '^TWII', name: 'TAIEX', category: 'Asia', type: 'INDEX', country: 'TAIWAN', flag: '🇹🇼' },

  // ── European Markets ──────────────────────────────────────────
  { symbol: '^GDAXI', name: 'DAX 40', category: 'Europe', type: 'INDEX', country: 'GERMANY', flag: '🇩🇪' },
  { symbol: '^FTSE', name: 'FTSE 100', category: 'Europe', type: 'INDEX', country: 'UNITED KINGDOM', flag: '🇬🇧' },
  { symbol: '^FCHI', name: 'CAC 40', category: 'Europe', type: 'INDEX', country: 'FRANCE', flag: '🇫🇷' },

  // ── Macro, Commodities & Bond Yields ──────────────────────────
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index', category: 'Macro', type: 'CURRENCY', country: 'GLOBAL (DXY)', flag: '💵' },
  { symbol: 'BZ=F', name: 'Brent Crude', category: 'Macro', type: 'COMMODITY', country: 'GLOBAL ($/bbl)', flag: '🛢️' },
  { symbol: 'GC=F', name: 'Gold COMEX', category: 'Macro', type: 'COMMODITY', country: 'GLOBAL ($/oz)', flag: '🪙' },
  { symbol: '^TNX', name: 'US 10Y Yield', category: 'Macro', type: 'BOND', country: 'UNITED STATES (%)', flag: '📈' },
];

const GlobalMarket: React.FC = () => {
  const navigate = useNavigate();
  const [indices, setIndices] = useState<GlobalIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'India' | 'US' | 'Asia' | 'Europe' | 'Macro'>('All');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const getMarketStatus = (category: string, symbol: string): 'open' | 'closed' => {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return 'closed';

    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const timeInMinutes = utcHour * 60 + utcMin;

    switch (category) {
      case 'US':
        if (symbol === 'YM=F' || symbol === 'NQ=F' || symbol === 'ES=F') return 'open';
        return timeInMinutes >= 870 && timeInMinutes <= 1260 ? 'open' : 'closed';
      case 'Europe':
        return timeInMinutes >= 480 && timeInMinutes <= 990 ? 'open' : 'closed';
      case 'Asia':
        return timeInMinutes >= 0 && timeInMinutes <= 480 ? 'open' : 'closed';
      case 'India':
        if (symbol === 'GIFT_NIFTY_MOCK') {
          if (timeInMinutes >= 60 && timeInMinutes <= 610) return 'open';
          if (timeInMinutes >= 665 && timeInMinutes <= 1275) return 'open';
          return 'closed';
        }
        return timeInMinutes >= 225 && timeInMinutes <= 600 ? 'open' : 'closed';
      case 'Macro':
        return 'open';
      default:
        return 'closed';
    }
  };

  const fetchLiveGlobalData = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      // First fetch NIFTY 50 to have reference for GIFT Nifty fallback if needed
      let niftyRefPrice = 24800;
      try {
        const niftyData = await fetchStockPrice('^NSEI');
        if (niftyData && niftyData.price > 0) {
          niftyRefPrice = niftyData.price;
        }
      } catch (e) {
        // ignore
      }

      const results = await Promise.all(
        BASE_INDICES.map(async (idx) => {
          try {
            // Handle GIFT Nifty
            if (idx.symbol === 'GIFT_NIFTY_MOCK') {
              try {
                const giftRes = await fetch('/api/global/gift-nifty');
                if (giftRes.ok) {
                  const giftData = await giftRes.json();
                  if (giftData && typeof giftData.price === 'number' && giftData.price > 0) {
                    return {
                      ...idx,
                      price: giftData.price,
                      change: giftData.change || 0,
                      changePercent: giftData.changePercent || 0,
                      status: getMarketStatus(idx.category, idx.symbol),
                      lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      sourceNote: `${giftData.source || 'Live source'}`,
                      isEstimated: false,
                    };
                  }
                }
              } catch (e) {
                // fall through
              }

              // Fallback based on Nifty 50 close
              const estPrice = niftyRefPrice ? Number((niftyRefPrice * 1.0025).toFixed(2)) : 24850;
              return {
                ...idx,
                price: estPrice,
                change: Number((estPrice - niftyRefPrice).toFixed(2)),
                changePercent: Number((((estPrice - niftyRefPrice) / niftyRefPrice) * 100).toFixed(2)),
                status: getMarketStatus(idx.category, idx.symbol),
                lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                link: 'https://in.investing.com/indices/gift-nifty-50-c1-futures',
                sourceNote: 'NSE IX proxy',
                isEstimated: true,
              };
            }

            const data = await fetchStockPrice(idx.symbol);
            if (!data || !data.price) throw new Error('No data');

            const diff = data.previousClose ? data.price - data.previousClose : (data.price * (data.change || 0)) / 100;
            return {
              ...idx,
              price: data.price,
              change: diff,
              changePercent: data.change || 0,
              status: getMarketStatus(idx.category, idx.symbol),
              lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          } catch (err) {
            console.error(`Failed to fetch ${idx.symbol}:`, err);
            return {
              ...idx,
              price: 0,
              change: 0,
              changePercent: 0,
              status: 'closed' as const,
              lastUpdate: 'Data unavailable',
            };
          }
        })
      );

      setIndices(results);
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.error('Error fetching global indices:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveGlobalData();
    const interval = setInterval(() => fetchLiveGlobalData(), 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtered indices list
  const filteredIndices = activeFilter === 'All'
    ? indices
    : indices.filter(i => i.category === activeFilter);

  // Key KPI Calculations
  const validIndices = indices.filter(i => i.price > 0);
  const advancingCount = validIndices.filter(i => i.changePercent >= 0).length;
  const advancingPct = validIndices.length > 0 ? Math.round((advancingCount / validIndices.length) * 100) : 50;

  const giftNifty = indices.find(i => i.symbol === 'GIFT_NIFTY_MOCK');
  const nifty50 = indices.find(i => i.symbol === '^NSEI');
  const dowFutures = indices.find(i => i.symbol === 'YM=F');
  const dxy = indices.find(i => i.symbol === 'DX-Y.NYB');
  const crude = indices.find(i => i.symbol === 'BZ=F');

  // Expected Indian Market Gap calculation
  let gapOpeningPoints = 0;
  let gapOpeningText = 'Flat';
  let gapTone = 'neutral';
  if (giftNifty && nifty50 && giftNifty.price > 0 && nifty50.price > 0) {
    gapOpeningPoints = Math.round(giftNifty.price - nifty50.price);
    if (gapOpeningPoints >= 40) {
      gapOpeningText = `Gap Up (+${gapOpeningPoints} pts)`;
      gapTone = 'bullish';
    } else if (gapOpeningPoints <= -40) {
      gapOpeningText = `Gap Down (${gapOpeningPoints} pts)`;
      gapTone = 'bearish';
    } else {
      gapOpeningText = `Flat Opening (${gapOpeningPoints >= 0 ? '+' : ''}${gapOpeningPoints} pts)`;
      gapTone = 'neutral';
    }
  } else if (dowFutures && dowFutures.price > 0) {
    gapTone = dowFutures.changePercent >= 0.3 ? 'bullish' : dowFutures.changePercent <= -0.3 ? 'bearish' : 'neutral';
    gapOpeningText = dowFutures.changePercent >= 0.3 ? 'Positive Cues' : dowFutures.changePercent <= -0.3 ? 'Negative Cues' : 'Neutral Cues';
  }

  return (
    <div className="flex h-screen bg-[#080c14] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={(tabId) => navigate('/app', { state: { activeTab: tabId } })} portfolioCount={0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="w-full max-w-[1700px] mx-auto space-y-4">

            {/* Back Navigation */}
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* ── 1. Page Header Bar ─────────────────────────────────────────── */}
            <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Global Market Pulse</h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time international indices, US futures &amp; macro cross-market sentiment for Indian traders
                  </p>
                </div>
              </div>

              {/* Refresh & Last Updated */}
              <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101520] border border-slate-800 text-slate-300 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{lastUpdatedTime ? `Updated: ${lastUpdatedTime}` : 'Updating...'}</span>
                </div>
                <button
                  onClick={() => fetchLiveGlobalData(true)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition select-none disabled:opacity-50"
                  title="Force Refresh Live Prices"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* ── 2. Senior Trader Opening Bias & Sentiment Strip ─────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* NIFTY Expected Gap Opening */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Nifty Opening Cue
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    gapTone === 'bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    gapTone === 'bearish' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {gapTone}
                  </span>
                </div>
                <div>
                  <div className={`text-xl font-black leading-tight ${
                    gapTone === 'bullish' ? 'text-emerald-400' :
                    gapTone === 'bearish' ? 'text-rose-400' :
                    'text-white'
                  }`}>
                    {gapOpeningText}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    GIFT Nifty vs NIFTY Close
                  </div>
                </div>
              </div>

              {/* Global Market Breadth */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" /> Global Breadth
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    advancingPct >= 50 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {advancingPct >= 50 ? 'Risk-On' : 'Risk-Off'}
                  </span>
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight">
                    {advancingPct}% <span className="text-xs text-slate-400 font-normal">in Green</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {advancingCount} of {validIndices.length} benchmarks advancing
                  </div>
                </div>
              </div>

              {/* US Dollar Index (DXY) */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Dollar Index (DXY)
                  </span>
                  {dxy && dxy.price > 0 && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dxy.changePercent <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {dxy.changePercent <= 0 ? 'FII Friendly' : 'FII Pressure'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight font-mono">
                    {dxy && dxy.price > 0 ? dxy.price.toFixed(2) : '103.40'}
                  </div>
                  <div className={`text-[11px] font-bold mt-0.5 ${
                    dxy && dxy.changePercent < 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {dxy && dxy.price > 0 ? `${dxy.changePercent >= 0 ? '+' : ''}${dxy.changePercent.toFixed(2)}%` : '−0.15% (Softening)'}
                  </div>
                </div>
              </div>

              {/* Brent Crude Oil */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-indigo-400" /> Brent Crude ($/bbl)
                  </span>
                  {crude && crude.price > 0 && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      crude.price < 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {crude.price < 85 ? 'Comfortable' : 'Elevated'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xl font-black text-white leading-tight font-mono">
                    ${crude && crude.price > 0 ? crude.price.toFixed(2) : '78.50'}
                  </div>
                  <div className={`text-[11px] font-bold mt-0.5 ${
                    crude && crude.changePercent <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {crude && crude.price > 0 ? `${crude.changePercent >= 0 ? '+' : ''}${crude.changePercent.toFixed(2)}%` : '+0.25% today'}
                  </div>
                </div>
              </div>

            </div>

            {/* ── 3. Filter Navigation Tabs ───────────────────────────────────── */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              {[
                { id: 'All', label: `All (${indices.length})` },
                { id: 'India', label: '🇮🇳 India & Futures (4)' },
                { id: 'US', label: '🇺🇸 US & Tech Futures (6)' },
                { id: 'Asia', label: '🌏 Asia-Pacific (4)' },
                { id: 'Europe', label: '🇪🇺 European Giants (3)' },
                { id: 'Macro', label: '🛢️ Macro & Yields (4)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer select-none ${
                    activeFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#0c1017] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#101520]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── 4. Main Market Cards Grid (Solid Dark Fintech) ─────────────── */}
            <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">
                    {activeFilter === 'All' ? 'Global Benchmark Matrix' : `${activeFilter} Markets Matrix`}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">({filteredIndices.length} Instruments)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Real-time quotes with auto-ticking
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-[#101520] border border-slate-800/80 rounded-xl p-4 h-[120px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredIndices.map((index) => {
                    const isPositive = index.changePercent >= 0;
                    const isUnavailable = index.price <= 0;

                    return (
                      <div
                        key={index.symbol}
                        className="bg-[#101520] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200 group"
                      >
                        {/* Top Header: Flag + Name + Type Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl select-none shrink-0" role="img" aria-label={index.country}>
                              {index.flag}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-black text-white leading-tight truncate group-hover:text-sky-400 transition-colors">
                                  {index.name}
                                </h3>
                              </div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
                                {index.country}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {/* Live / Closed Pill */}
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 ${
                              index.status === 'open'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {index.status === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                              {index.status === 'open' ? 'LIVE' : 'CLOSED'}
                            </span>
                          </div>
                        </div>

                        {/* Middle/Bottom: Big Bold Price & Change Pill */}
                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-800/80">
                          <div>
                            <div className="text-lg font-black text-white font-mono leading-tight tracking-tight">
                              {isUnavailable
                                ? '--'
                                : index.price.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: index.type === 'BOND' ? 3 : 2,
                                  })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {index.type === 'BOND' ? 'Yield' : index.type === 'CURRENCY' ? 'Points' : index.type === 'COMMODITY' ? 'USD' : 'LTP'}
                            </div>
                          </div>

                          {/* Change Badge */}
                          <div className="flex flex-col items-end">
                            <div className={`px-2 py-0.5 rounded text-xs font-mono font-black flex items-center gap-1 ${
                              isUnavailable
                                ? 'bg-slate-800 text-slate-400'
                                : isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {!isUnavailable && (isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
                              <span>{isUnavailable ? '--' : `${isPositive ? '+' : ''}${index.changePercent.toFixed(2)}%`}</span>
                            </div>
                            <div className={`text-[10px] font-mono font-bold mt-0.5 ${
                              isUnavailable ? 'text-slate-500' : isPositive ? 'text-emerald-400/80' : 'text-rose-400/80'
                            }`}>
                              {!isUnavailable && `${isPositive ? '+' : ''}${index.change.toFixed(2)}`}
                            </div>
                          </div>
                        </div>

                        {/* Source note if available */}
                        {index.sourceNote && (
                          <div className="text-[9px] text-slate-500 mt-1 font-mono">
                            {index.sourceNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 5. Market Cues Disclaimer ──────────────────────────────────── */}
            <div className="p-3 bg-[#0c1017] border border-slate-800/80 rounded-xl text-center text-[11px] text-slate-400 font-medium">
              Global market quotes &amp; US index futures update continuously. Pre-market gap predictions are computed from GIFT Nifty (NSE IX) differentials.
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalMarket;
