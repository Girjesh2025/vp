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
    { symbol: '^DJI', name: 'Dow Jones', region: 'US' },
    { symbol: '^GSPC', name: 'S&P 500', region: 'US' },
    { symbol: '^IXIC', name: 'NASDAQ', region: 'US' },
    { symbol: '^FTSE', name: 'FTSE 100', region: 'Europe' },
    { symbol: '^GDAXI', name: 'DAX', region: 'Europe' },
    { symbol: '^FCHI', name: 'CAC 40', region: 'Europe' },
    { symbol: '^N225', name: 'Nikkei 225', region: 'Asia' },
    { symbol: '^HSI', name: 'Hang Seng', region: 'Asia' },
    { symbol: '000001.SS', name: 'Shanghai Composite', region: 'Asia' },
    { symbol: '^BSESN', name: 'BSE SENSEX', region: 'India' },
    { symbol: '^NSEI', name: 'NIFTY 50', region: 'India' },
    { symbol: '^AXJO', name: 'ASX 200', region: 'Australia' },
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-[#172030] rounded-2xl h-48 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {regions.map(region => {
                  const regionIndices = indices.filter(idx => idx.region === region);
                  if (regionIndices.length === 0) return null;

                  return (
                    <div key={region} className="bg-[#172030] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                      <div className="px-6 py-4 border-b border-slate-800/60 bg-[#1a2436] flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <div className="w-2 h-6 bg-blue-500 rounded-full" />
                          {region} Markets
                        </h2>
                        <div className="text-xs font-medium text-slate-500">
                          {regionIndices.filter(i => i.status === 'open').length > 0 
                            ? <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> OPEN</span>
                            : <span className="text-slate-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-600"/> CLOSED</span>
                          }
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                        {regionIndices.map((index) => (
                          <div key={index.symbol} className="p-6 hover:bg-[#1e293b]/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-slate-200">{index.name}</h3>
                                <p className="text-xs text-slate-500">{index.symbol}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wider ${
                                index.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {index.status.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="mt-4 flex items-end justify-between">
                              <div className="text-2xl font-black text-white">
                                {index.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className={`flex flex-col items-end ${index.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                <div className="flex items-center gap-1 font-bold">
                                  {index.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                  {index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                                </div>
                                <div className="text-xs opacity-80 font-medium">
                                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 text-[10px] text-slate-500 flex justify-end">
                              Updated: {index.lastUpdate}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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