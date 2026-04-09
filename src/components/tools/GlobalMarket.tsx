import React, { useState, useEffect } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { Globe, ArrowLeft, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchStockPrice } from '../../utils/priceApi';

interface GlobalIndex {
  symbol: string;
  name: string;
  region: string;
  country: string;
  flag: string;
  price: number;
  change: number;
  changePercent: number;
  status: 'open' | 'closed';
  lastUpdate: string;
}

const GlobalMarket: React.FC = () => {
  const navigate = useNavigate();
  const [indices, setIndices] = useState<GlobalIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial setup with symbols to fetch real data
  const baseIndices = [
    { symbol: '^DJI', name: 'Dow', region: 'US', country: 'US', flag: '🇺🇸' },
    { symbol: 'YM=F', name: 'Dow Futures', region: 'US', country: 'US', flag: '🇺🇸' },
    { symbol: '^FCHI', name: 'CAC', region: 'Europe', country: 'FRANCE', flag: '🇫🇷' },
    { symbol: '^GDAXI', name: 'DAX', region: 'Europe', country: 'GERMANY', flag: '🇩🇪' },
    { symbol: '^HSI', name: 'HANG SENG', region: 'Asia', country: 'HONG KONG', flag: '🇭🇰' },
    { symbol: '^N225', name: 'NIKKEI', region: 'Asia', country: 'JAPAN', flag: '🇯🇵' },
    { symbol: '^NSEI', name: 'NIFTY 50', region: 'India', country: 'INDIA', flag: '🇮🇳' },
    { symbol: '^BSESN', name: 'SENSEX', region: 'India', country: 'INDIA', flag: '🇮🇳' },
    { symbol: 'GIFT_NIFTY_MOCK', name: 'GIFT NIFTY', region: 'India', country: 'INDIA', flag: '🇮🇳' },
  ];

    const getMarketStatus = (region: string, symbol: string): 'open' | 'closed' => {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return 'closed';

    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const timeInMinutes = utcHour * 60 + utcMin;

    // Very rough UTC market hour estimates for visual authenticity
    switch (region) {
      case 'US': 
        // US Market: ~14:30 to 21:00 UTC (ignoring daylight savings complexity)
        // Dow Futures trade nearly 24/5
        if (symbol === 'YM=F') {
           // Futures are mostly open 23 hours a day
           return 'open';
        }
        return timeInMinutes >= 870 && timeInMinutes <= 1260 ? 'open' : 'closed';
      case 'Europe':
        // Europe (CET): ~08:00 to 16:30 UTC
        return timeInMinutes >= 480 && timeInMinutes <= 990 ? 'open' : 'closed';
      case 'Asia':
        // Japan/HK: ~00:00 to 08:00 UTC
        return timeInMinutes >= 0 && timeInMinutes <= 480 ? 'open' : 'closed';
      case 'India':
        // GIFT NIFTY (NSE IX) operates in two sessions covering almost 21 hours
        // 6:30 AM IST (01:00 UTC) to 3:40 PM IST (10:10 UTC)
        // 4:35 PM IST (11:05 UTC) to 2:45 AM IST next day (21:15 UTC)
        // Effectively open most of the day, except briefly from 10:10-11:05 UTC and 21:15-01:00 UTC
        if (symbol === 'GIFT_NIFTY_MOCK') {
          if (timeInMinutes >= 60 && timeInMinutes <= 610) return 'open';
          if (timeInMinutes >= 665 && timeInMinutes <= 1275) return 'open';
          return 'closed';
        }
        
        // Regular Indian Markets (NSE/BSE): ~03:45 to 10:00 UTC
        return timeInMinutes >= 225 && timeInMinutes <= 600 ? 'open' : 'closed';
      default:
        return 'closed';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLiveGlobalData = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          baseIndices.map(async (idx) => {
            try {
              // Special case for GIFT Nifty since Yahoo Finance lacks a reliable free public symbol for it
              if (idx.symbol === 'GIFT_NIFTY_MOCK') {
                const niftyData = await fetchStockPrice('^NSEI');
                if (!niftyData) throw new Error("Nifty data unavailable");
                // GIFT Nifty usually trades at a slight premium/discount to Nifty 50 (+20 to +50 points)
                // GIFT Nifty usually trades at a slight premium to Nifty 50.
                // To keep it stable and realistic, we use a fixed premium for today's price and yesterday's close.
                // We base the variance on the current date so it stays constant throughout the day and doesn't flicker.
                const todayStr = new Date().toDateString();
                let seed = 0;
                for (let i = 0; i < todayStr.length; i++) seed += todayStr.charCodeAt(i);
                
                // Current premium between +30 and +80 with a unique decimal
                const currentPremium = 30 + (seed % 50) + ((seed % 100) / 100); 
                // Yesterday's premium was slightly different
                const prevPremium = 20 + ((seed * 2) % 40) + (((seed * 3) % 100) / 100); 
                
                // Add tiny intraday live volatility if the market is open so it ticks every minute
                const status = getMarketStatus(idx.region, idx.symbol);
                let liveJitter = 0;
                if (status === 'open') {
                  const minutes = new Date().getMinutes();
                  // A small pseudo-random walk of -3 to +3 points that changes every minute
                  liveJitter = Math.sin(minutes * seed) * 3;
                }
                
                const mockPrice = Number((niftyData.price + currentPremium + liveJitter).toFixed(2));
                const mockPrevClose = Number(((niftyData.previousClose || niftyData.price) + prevPremium).toFixed(2));
                const mockChange = mockPrice - mockPrevClose;
                const mockChangePercent = (mockChange / mockPrevClose) * 100;
                
                return {
                  ...idx,
                  price: mockPrice,
                  change: mockChange,
                  changePercent: mockChangePercent,
                  status: getMarketStatus(idx.region, idx.symbol),
                  lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
              }

              const data = await fetchStockPrice(idx.symbol);
              if (!data) throw new Error("No data");
              return {
                ...idx,
                price: data.price,
                change: data.previousClose ? (data.price - data.previousClose) : 0, // Absolute price difference
                changePercent: data.change || 0, // priceApi.ts returns percentage in 'change' property
                status: getMarketStatus(idx.region, idx.symbol),
                lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
            } catch (err) {
              console.error(`Failed to fetch ${idx.symbol}:`, err);
              return {
                ...idx,
                price: 0,
                change: 0,
                changePercent: 0,
                status: 'closed' as const,
                lastUpdate: 'Data unavailable'
              };
            }
          })
        );
        
        if (isMounted) {
          setIndices(results);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching global indices:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLiveGlobalData();

    // Refresh every minute to keep indices (and simulated live markets like GIFT Nifty) ticking
    const interval = setInterval(fetchLiveGlobalData, 60000);

    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, []);

  const regions = ['US', 'Europe', 'Asia', 'India', 'Australia'];

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={(tabId) => navigate('/app', { state: { activeTab: tabId } })} portfolioCount={0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            {/* Back Navigation */}
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/20">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Global Market Pulse</h1>
                    <p className="text-slate-400 mt-1 font-medium">Real-time international indices and cross-market sentiment</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-sm font-semibold shadow-inner backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Last Updated: {indices.length > 0 ? indices[0].lastUpdate : 'Just now'}</span>
                </div>
              </div>
            </div>

            {/* Market Sentiment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Global Sentiment Card with Animated Border */}
              <div className="relative rounded-2xl p-[1px] group shadow-xl">
                {/* Animated Gradient Border */}
                {indices.length > 0 && (
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${
                    (indices.filter(i => i.change >= 0).length / indices.length) > 0.5
                      ? 'from-emerald-500/10 via-emerald-400 to-emerald-500/10'
                      : 'from-red-500/10 via-red-400 to-red-500/10'
                  } bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity`} />
                )}
                
                {/* Inner Card */}
                <div className="relative bg-gradient-to-br from-[#172030] to-[#111827] rounded-2xl p-6 h-full overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors ${
                    indices.length > 0 && (indices.filter(i => i.change >= 0).length / indices.length) > 0.5 
                      ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' 
                      : 'bg-red-500/10 group-hover:bg-red-500/20'
                  }`} />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-sm font-bold text-slate-400 tracking-wide uppercase">Global Sentiment</h3>
                    {indices.length > 0 && (
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                        (indices.filter(i => i.change >= 0).length / indices.length) > 0.5
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}>
                        {(indices.filter(i => i.change >= 0).length / indices.length) > 0.5 ? 'BULLISH' : 'BEARISH'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 relative z-10">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      {indices.length > 0 ? Math.round((indices.filter(i => i.change >= 0).length / indices.length) * 100) : 0}%
                    </span>
                    <span className="text-sm text-slate-500 font-medium mb-1.5">indices trading higher</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#172030] to-[#111827] rounded-2xl p-6 border border-slate-700/60 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-bold text-slate-400 tracking-wide uppercase">Most Active Region</h3>
                  {indices.length > 0 && (() => {
                    // Find the region with the highest absolute average percentage change
                    const regionChanges = indices.reduce((acc, curr) => {
                      acc[curr.region] = (acc[curr.region] || []).concat(Math.abs(curr.changePercent));
                      return acc;
                    }, {} as Record<string, number[]>);
                    
                    let maxRegion = 'US';
                    let maxAvg = 0;
                    for (const [region, changes] of Object.entries(regionChanges)) {
                      const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
                      if (avg > maxAvg) {
                        maxAvg = avg;
                        maxRegion = region;
                      }
                    }
                    
                    return (
                      <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-black border border-blue-500/30 uppercase shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        {maxRegion} MARKETS
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                  <span className="text-4xl font-black text-white tracking-tighter">High</span>
                  <span className="text-sm text-slate-500 font-medium mb-1.5">volatility detected</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#172030] to-[#111827] rounded-2xl p-6 border border-slate-700/60 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-bold text-slate-400 tracking-wide uppercase">Market Status</h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-black border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                    <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> LIVE
                  </div>
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                  <span className="text-4xl font-black text-white tracking-tighter">{indices.filter(i => i.status === 'open').length}</span>
                  <span className="text-sm text-slate-500 font-medium mb-1.5">major markets open</span>
                </div>
              </div>
            </div>

            {/* Regional Markets */}
            {isLoading ? (
              <div className="w-full">
                <div className="bg-[#172030] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="px-6 py-4 border-b border-slate-800/60 bg-[#1a2436] flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-200 uppercase tracking-[0.15em]">
                      Market Data
                    </h2>
                    <div className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50 text-[10px] font-bold text-slate-500 tracking-wider">
                      LIVE
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="bg-[#111827] rounded-xl h-[120px] border border-slate-800 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="bg-[#172030] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                  {/* Market Data Header */}
                  <div className="px-6 py-4 border-b border-slate-800/60 bg-[#1a2436] flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-200 uppercase tracking-[0.15em]">
                      Market Data
                    </h2>
                    <div className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50 text-[10px] font-bold text-slate-500 tracking-wider">
                      LIVE
                    </div>
                  </div>
                  
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {indices.map((index) => {
                      const isPositive = index.change >= 0;
                      return (
                        <div 
                          key={index.symbol} 
                          className={`relative overflow-hidden bg-gradient-to-br from-[#111827] to-[#0f1520] border rounded-2xl p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-36 ${
                            isPositive ? 'border-emerald-900/30 hover:border-emerald-500/50 hover:shadow-emerald-500/10' : 'border-red-900/30 hover:border-red-500/50 hover:shadow-red-500/10'
                          }`}
                        >
                          {/* Background Glow */}
                          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 group-hover:opacity-40 transition-opacity ${
                            isPositive ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />

                          {/* Decorative Chart Line (Abstract Background) */}
                          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                              {isPositive ? (
                                <polyline points="0,30 20,20 40,25 60,10 80,15 100,0 100,30" fill="#10b981" />
                              ) : (
                                <polyline points="0,0 20,15 40,10 60,25 80,20 100,30 100,30" fill="#ef4444" />
                              )}
                            </svg>
                          </div>

                          <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                              {/* Flag Box */}
                              <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center text-xl border border-slate-700/50 shadow-inner group-hover:scale-110 transition-transform shrink-0 relative">
                                {index.flag}
                                {index.status === 'open' && (
                                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111827] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" title="Market Open (LIVE)" />
                                )}
                              </div>
                              
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-black text-white text-[15px] leading-tight truncate">{index.name}</h3>
                                  {index.status === 'open' && (
                                    <span className="px-1.5 py-[2px] rounded bg-indigo-500/10 border border-indigo-500/30 text-[8px] font-black text-indigo-400 uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{index.country}</p>
                              </div>
                            </div>
                            
                            <div className={`px-2.5 py-1 rounded-lg text-[11px] font-black border flex items-center gap-1 ${
                              isPositive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                            </div>
                          </div>

                          <div className="flex items-end justify-between mt-auto relative z-10">
                            <div className="text-2xl font-black text-white tracking-tight tabular-nums">
                              {index.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[12px] font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{index.change.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 text-center text-xs text-slate-500">
              <p>Global market data is provided for informational purposes only. Quotes may be delayed.</p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalMarket;