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
                change: data.change || 0,
                changePercent: data.previousClose 
                  ? ((data.price - data.previousClose) / data.previousClose) * 100 
                  : 0,
                status: 'closed' as const, // In a real app, determine status based on region timezone
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Global Market Overview</h1>
                  <p className="text-sm text-slate-400">Real-time pulse of international indices and cross-market sentiment</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Last Updated: Just now</span>
              </div>
            </div>

            {/* Market Sentiment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#172030] rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400">Global Sentiment</h3>
                  {indices.length > 0 && (
                    <div className={`px-2 py-1 rounded text-xs font-bold border ${
                      (indices.filter(i => i.change >= 0).length / indices.length) > 0.5
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {(indices.filter(i => i.change >= 0).length / indices.length) > 0.5 ? 'BULLISH' : 'BEARISH'}
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-white">
                    {indices.length > 0 ? Math.round((indices.filter(i => i.change >= 0).length / indices.length) * 100) : 0}%
                  </span>
                  <span className="text-sm text-slate-500 mb-1">indices trading higher</span>
                </div>
              </div>

              <div className="bg-[#172030] rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400">Most Active Region</h3>
                  <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">US MARKETS</div>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-white">High</span>
                  <span className="text-sm text-slate-500 mb-1">volatility detected</span>
                </div>
              </div>

              <div className="bg-[#172030] rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400">Market Status</h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    <Activity className="w-3 h-3 text-emerald-400" /> LIVE
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-white">{indices.filter(i => i.status === 'open').length}</span>
                  <span className="text-sm text-slate-500 mb-1">major markets open</span>
                </div>
              </div>
            </div>

            {/* Regional Markets */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-[#172030] rounded-2xl h-32 border border-slate-800 animate-pulse" />
                ))}
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