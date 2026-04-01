import React, { useState, useEffect } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchStockPrice } from '../../utils/priceApi';

// Define the core constituents we want to track for our sectoral flow proxy
const SECTOR_DEFINITIONS = [
  { title: 'DEFENCE', ext: 'NIFTY IND DEFENCE', count: 15, stocks: ['MAZAGON', 'BEL', 'SOLARIND', 'HAL', 'BDL'] },
  { title: 'PSU BANK', ext: 'NIFTY PSU BANK', count: 12, stocks: ['PNB', 'INDIANB', 'UNIONBANK', 'BOI', 'SBIN', 'PSB', 'CANBK'] },
  { title: 'MEDIA', ext: 'NIFTY MEDIA', count: 15, stocks: ['NDTV', 'NETWORK18', 'HATHWAY', 'ZEEL', 'PVRINOX'] },
  { title: 'BANK', ext: 'NIFTY BANK', count: 12, stocks: ['INDUSINDBK', 'SBIN', 'PNB', 'AUBANK', 'CANBK', 'FEDERALBNK', 'AXISBANK'] },
  { title: 'REALTY', ext: 'NIFTY REALTY', count: 10, stocks: ['DLF', 'GODREJPROP', 'PHOENIXLTD', 'OBEROIRLTY', 'PRESTIGE'] },
  { title: 'METAL', ext: 'NIFTY METAL', count: 15, stocks: ['TATASTEEL', 'HINDALCO', 'JSWSTEEL', 'VEDL', 'COALINDIA'] },
  { title: 'IT', ext: 'NIFTY IT', count: 10, stocks: ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM'] },
  { title: 'AUTO', ext: 'NIFTY AUTO', count: 15, stocks: ['TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT'] },
  { title: 'PHARMA', ext: 'NIFTY PHARMA', count: 20, stocks: ['SUNPHARMA', 'CIPLA', 'DRREDDY', 'LUPIN', 'DIVISLAB'] },
  { title: 'FMCG', ext: 'NIFTY FMCG', count: 15, stocks: ['ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'DABUR'] },
  { title: 'ENERGY', ext: 'NIFTY ENERGY', count: 10, stocks: ['RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'BPCL'] },
  { title: 'INFRA', ext: 'NIFTY INFRA', count: 30, stocks: ['LT', 'ADANIPORTS', 'ULTRACEMCO', 'GRASIM', 'AMBUJACEM'] },
];

const SectoralFlow: React.FC = () => {
  const navigate = useNavigate();
  
  const [liveData, setLiveData] = useState<Record<string, { price: number; change: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLiveMarketData = async () => {
      setLoading(true);
      
      // 1. Gather all unique stock symbols across our sectors
      const allSymbols = new Set<string>();
      SECTOR_DEFINITIONS.forEach(sec => sec.stocks.forEach(s => allSymbols.add(s)));
      
      // 2. Add some core indices 
      const indices = ['^NSEI', '^NSEBANK', '^CNXIT', '^CNXAUTO', '^CNXMETAL', '^CNXFMCG', '^CNXPHARMA', '^CNXREALTY'];
      indices.forEach(idx => allSymbols.add(idx));

      const symbolArray = Array.from(allSymbols);
      
      // 3. Fetch in parallel chunks to avoid overwhelming the proxy/browser
      const results: Record<string, { price: number; change: number }> = {};
      const chunkSize = 15;
      
      for (let i = 0; i < symbolArray.length; i += chunkSize) {
        const chunk = symbolArray.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (sym) => {
            // For stocks, append .NSE for accurate Indian market lookup inside priceApi
            const querySym = sym.startsWith('^') ? sym : `${sym}.NSE`;
            const data = await fetchStockPrice(querySym);
            if (data && isMounted) {
              results[sym] = { price: data.price, change: data.change || 0 };
            }
          })
        );
      }
      
      if (isMounted) {
        setLiveData(results);
        setLoading(false);
      }
    };

    loadLiveMarketData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute aggregated sector performance (average % change of constituents)
  const sectoralFlowData = SECTOR_DEFINITIONS.map(sector => {
    let totalChg = 0;
    let count = 0;
    sector.stocks.forEach(sym => {
      if (liveData[sym]) {
        totalChg += liveData[sym].change;
        count++;
      }
    });
    const avgChange = count > 0 ? totalChg / count : 0;
    return { name: sector.title, value: Number(avgChange.toFixed(2)) };
  }).sort((a, b) => a.value - b.value); // Sort ascending so top bar in horizontal layout holds the highest momentum

  // Market Heatmap Data Preparation
  const heatmapData = [
    { name: 'NIFTY 50 INDEX', val: liveData['^NSEI']?.change ?? 0 },
    { name: 'NIFTY BANK', val: liveData['^NSEBANK']?.change ?? 0 },
    { name: 'NIFTY IT', val: liveData['^CNXIT']?.change ?? 0 },
    { name: 'NIFTY AUTO', val: liveData['^CNXAUTO']?.change ?? 0 },
    { name: 'NIFTY METAL', val: liveData['^CNXMETAL']?.change ?? 0 },
    { name: 'NIFTY FMCG', val: liveData['^CNXFMCG']?.change ?? 0 },
    { name: 'NIFTY PHARMA', val: liveData['^CNXPHARMA']?.change ?? 0 },
    { name: 'NIFTY REALTY', val: liveData['^CNXREALTY']?.change ?? 0 },
    // Fill remaining with calculated sector averages if native index fails
    ...sectoralFlowData.slice(-6).map(s => ({ name: `NIFTY ${s.name}`, val: s.value })) 
  ].slice(0, 14); // Keep exactly 14 cards for grid symmetry

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={() => {}} portfolioCount={0} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Nav Back */}
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Fetching Live Market Data</h3>
                <p className="text-slate-400 max-w-md">Querying Yahoo Finance for real-time sector indices and constituent stocks. This may take a few seconds...</p>
              </div>
            ) : (
              <>
                {/* --- 1. Sectorial Flow Bar Chart --- */}
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white uppercase">Sectorial Flow</h2>
                      <p className="text-[10px] text-emerald-500 tracking-widest uppercase mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse" />
                        Live Data • {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex bg-[#1e293b] rounded-lg p-1 border border-slate-700/50">
                      <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-700/50 text-white">CHART</button>
                      <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-400 hover:text-white transition-colors">HEATMAP</button>
                    </div>
                  </div>

                  <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-6 h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectoralFlowData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                        <XAxis 
                          type="number" 
                          axisLine={{ stroke: '#334155' }} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }} 
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 600 }} 
                          width={100}
                        />
                        <Tooltip 
                          cursor={{ fill: '#1e293b', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Momentum']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {sectoralFlowData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* --- 2. Market Heatmap --- */}
                <div className="mt-8">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white uppercase">Market Heatmap</h2>
                      <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Component Values by Volatility</p>
                    </div>
                    <div className="flex bg-[#1e293b] rounded-lg p-1.5 border border-slate-700/50 gap-1.5">
                      <div className="w-4 h-3 rounded-sm bg-red-500" />
                      <div className="w-4 h-3 rounded-sm bg-slate-700" />
                      <div className="w-4 h-3 rounded-sm bg-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {heatmapData.map((idx, index) => {
                      const isPositive = idx.val >= 0;
                      return (
                        <div 
                          key={`${idx.name}-${index}`}
                          className={`rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:scale-105 ${
                            isPositive ? 'bg-[#3eb665] text-white' : 'bg-[#e74c3c] text-white'
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-90 leading-tight h-6 flex items-center justify-center">
                            {idx.name}
                          </div>
                          <div className="text-lg font-black tracking-tight drop-shadow-md">
                            {idx.val > 0 ? '+' : ''}{idx.val.toFixed(2)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* --- 3. Sector Breakdown --- */}
                <div className="mt-8 pb-10">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white uppercase">Sector Breakdown</h2>
                      <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Live Component Values</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {SECTOR_DEFINITIONS.map((sector) => (
                      <div key={sector.title} className="bg-[#172030] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg">
                        <div className="flex justify-between items-center bg-[#1e293b] p-3 border-b border-slate-800/60">
                          <h3 className="font-bold text-[11px] text-white tracking-widest">{sector.ext || sector.title}</h3>
                          <span className="text-[9px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{sector.count} STOCKS</span>
                        </div>
                        
                        <div className="p-1">
                          {/* Table Header */}
                          <div className="flex text-[8px] font-semibold text-slate-500 uppercase tracking-widest p-2 pb-1 border-b border-slate-800/40 mx-2">
                            <div className="flex-1">SYMBOL</div>
                            <div className="w-16 text-right">LTP</div>
                            <div className="w-16 text-right">%CHG</div>
                          </div>
                          
                          {/* Rows */}
                          <div className="px-1 py-1">
                            {sector.stocks.map((stockSym, idx) => {
                              const stock = liveData[stockSym] || { price: 0, change: 0 };
                              const isPositive = stock.change >= 0;
                              return (
                                <div key={idx} className="flex items-center text-[10px] py-1.5 px-2 hover:bg-slate-800/50 rounded transition-colors group">
                                  <div className="flex-1 font-bold text-slate-400 group-hover:text-white transition-colors">
                                    {stockSym} <span className="opacity-40 font-normal">EQ</span>
                                  </div>
                                  <div className="w-16 text-right font-medium text-slate-300">
                                    {stock.price > 0 ? stock.price.toFixed(2) : '-'}
                                  </div>
                                  <div className={`w-16 text-right font-bold ${isPositive ? 'text-[#3eb665]' : 'text-[#e74c3c]'}`}>
                                    {stock.price > 0 ? `${isPositive ? '+' : ''}${stock.change.toFixed(2)}%` : '-'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SectoralFlow;
