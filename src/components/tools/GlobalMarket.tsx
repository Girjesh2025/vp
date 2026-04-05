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
  ];

  const getMarketStatus = (region: string): 'open' | 'closed' => {
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
        return timeInMinutes >= 870 && timeInMinutes <= 1260 ? 'open' : 'closed';
      case 'Europe':
        // Europe (CET): ~08:00 to 16:30 UTC
        return timeInMinutes >= 480 && timeInMinutes <= 990 ? 'open' : 'closed';
      case 'Asia':
        // Japan/HK: ~00:00 to 08:00 UTC
        return timeInMinutes >= 0 && timeInMinutes <= 480 ? 'open' : 'closed';
      case 'India':
        // India: ~03:45 to 10:00 UTC
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
              const data = await fetchStockPrice(idx.symbol);
              if (!data) throw new Error("No data");
              return {
                ...idx,
                price: data.price,
                change: data.previousClose ? (data.price - data.previousClose) : 0, // Absolute price difference
                changePercent: data.change || 0, // priceApi.ts returns percentage in 'change' property
                status: getMarketStatus(idx.region),
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

    return () => { isMounted = false; };
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
                  
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {indices.map((index) => (
                      <div 
                        key={index.symbol} 
                        className="bg-[#111827] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {/* Flag Circle */}
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl border border-slate-700 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                              {index.flag}
                            </div>
                            
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-sm leading-tight truncate">{index.name}</h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{index.country}</p>
                            </div>
                          </div>
                          
                          <div className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            index.change >= 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-auto">
                          <div className="text-xl font-black text-white tracking-tight">
                            {index.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[11px] font-bold ${index.change >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                            {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
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