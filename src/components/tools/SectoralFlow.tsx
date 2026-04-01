import React, { useState, useEffect } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchStockPrice } from '../../utils/priceApi';

// Define the core constituents we want to track for our sectoral flow proxy
const SECTOR_DEFINITIONS = [
  { title: 'DEFENCE', ext: 'NIFTY IND DEFENCE', stocks: ['HAL', 'BEL', 'MAZAGON', 'BDL', 'ASTRAMICRO', 'PARAS', 'MTARTECH', 'DATAPATTNS', 'BEML', 'GRSE', 'MIDHANI', 'SOLARIND', 'BHEL'] },
  { title: 'PSU BANK', ext: 'NIFTY PSU BANK', stocks: ['SBIN', 'PNB', 'BANKINDIA', 'CANBK', 'UNIONBANK', 'INDIANB', 'BANKBARODA', 'MAHABANK', 'PSB', 'CENTRALBK', 'IOB', 'UCOBANK'] },
  { title: 'MEDIA', ext: 'NIFTY MEDIA', stocks: ['ZEEL', 'NETWORK18', 'PVRINOX', 'NDTV', 'SUNTV', 'TV18BRDCST', 'DISHTV', 'HATHWAY', 'NAVKARCORP', 'DBCORP'] },
  { title: 'BANK', ext: 'NIFTY BANK', stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK', 'PNB', 'AUBANK', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK'] },
  { title: 'REALTY', ext: 'NIFTY REALTY', stocks: ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'LODHA', 'BRIGADE', 'SOBHA', 'MAHLIFE', 'PHOENIXLTD'] },
  { title: 'METAL', ext: 'NIFTY METAL', stocks: ['TATASTEEL', 'HINDALCO', 'JSWSTEEL', 'COALINDIA', 'VEDL', 'SAIL', 'NMDC', 'JINDALSTEL', 'NATIONALUM', 'HINDZINC', 'APLALAPOLLO', 'WELCORP', 'RATNAMANI'] },
  { title: 'IT', ext: 'NIFTY IT', stocks: ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 'PERSISTENT', 'OFSS', 'COFORGE', 'MPHASIS'] },
  { title: 'AUTO', ext: 'NIFTY AUTO', stocks: ['TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR', 'BOSCHLTD', 'ASHOKLEY', 'MRF', 'TIINDIA', 'MOTHERSON', 'SONACOMS', 'BALKRISIND', 'BHARATFORG'] },
  { title: 'PHARMA', ext: 'NIFTY PHARMA', stocks: ['SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'LUPIN', 'AUROPHARMA', 'APOLLOHOSP', 'TORNTPHARM', 'ZYDUSLIFE', 'MANKIND', 'BIOCON', 'SYNGENE', 'ABBOTINDIA', 'IPCALAB', 'GLENMARK', 'AJANTPHARM', 'LAURUSLABS', 'NATCOPHARM', 'GRANULES', 'JBCHEPHARM'] },
  { title: 'FMCG', ext: 'NIFTY FMCG', stocks: ['ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'GODREJCP', 'TATACONSUM', 'MARICO', 'VBL', 'COLPAL', 'UBL', 'PGHH', 'RADICO', 'EMAMILTD', 'BALRAMCHIN'] },
  { title: 'ENERGY', ext: 'NIFTY ENERGY', stocks: ['RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'BPCL', 'COALINDIA', 'TATAPOWER', 'IOC', 'HPCL', 'ADANIGREEN'] },
  { title: 'INFRA', ext: 'NIFTY INFRA', stocks: ['LT', 'ADANIPORTS', 'ULTRACEMCO', 'GRASIM', 'AMBUJACEM', 'SHREECEM', 'BHARTIARTL', 'ACC', 'LODHA', 'PVRINOX', 'NTPC', 'POWERGRID', 'ONGC', 'IOC'] },
];

const SectoralFlow: React.FC = () => {
  const navigate = useNavigate();
  
  const [liveData, setLiveData] = useState<Record<string, { price: number; change: number }>>({});
  const [loading, setLoading] = useState(true);
  const [highlightedSector, setHighlightedSector] = useState<string | null>(null);
  const sectorRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToSector = (sectorTitle: string) => {
    const target = sectorRefs.current[sectorTitle];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedSector(sectorTitle);
      setTimeout(() => setHighlightedSector(null), 2500); // Remove highlight after 2.5s
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadLiveMarketData = async () => {
      // Show the UI immediately so it responds fast. Loading stays true for maybe 1 render tick, then clears.
      
      const allSymbols = new Set<string>();
      SECTOR_DEFINITIONS.forEach(sec => sec.stocks.forEach(s => allSymbols.add(s)));
      // Note: Removed indices fetch since Yahoo indices time out easily.
      // We will generate the Sector Heatmap exclusively via valid component aggregates.

      const symbolArray = Array.from(allSymbols);
      
      // Let the component start rendering skeleton data initially
      setLoading(false);

      const chunkSize = 12; // Moderate chunk size
      for (let i = 0; i < symbolArray.length; i += chunkSize) {
        const chunk = symbolArray.slice(i, i + chunkSize);
        
        const chunkResults: Record<string, { price: number; change: number }> = {};
        
        // Use Promise.allSettled to not fail the chunk if one timeouts
        await Promise.allSettled(
          chunk.map(async (sym) => {
            const querySym = sym.startsWith('^') ? sym : `${sym}.NSE`;
            
            // Limit each individual fetch to 4.5 seconds to forcefully free up proxy congestion
            const timeoutPromise = new Promise<{price: number, change: number} | null>((resolve) => 
               setTimeout(() => resolve(null), 4500)
            );
            
            const data = await Promise.race([
               fetchStockPrice(querySym),
               timeoutPromise
            ]);

            if (data && isMounted) {
              chunkResults[sym] = { price: data.price, change: data.change || 0 };
            }
          })
        );
        
        // Progressively incrementally update the UI with new data chunks
        if (isMounted && Object.keys(chunkResults).length > 0) {
           setLiveData(prev => ({ ...prev, ...chunkResults }));
        }
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
  // Display the sectors from the BarChart as the Grid Heatmap
  const heatmapData = sectoralFlowData.map(s => ({
    // For visual mapping, if the title isn't already prefixed with NIFTY
    name: s.name.startsWith('NIFTY') ? s.name : `NIFTY ${s.name}`,
    val: s.value,
    originalName: s.name // used for scroll targeting
  }));

  const handleTabChange = (tabId: string) => {
    navigate('/app', { state: { activeTab: tabId } });
  };

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={handleTabChange} portfolioCount={0} />
      
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
                <h3 className="text-xl font-bold text-white mb-2">Connecting to Live Feed</h3>
                <p className="text-slate-400 max-w-md">Initializing dashboard...</p>
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
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Momentum']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {sectoralFlowData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.value > 0 ? '#10b981' : '#ef4444'} 
                              onClick={() => scrollToSector(entry.name)}
                              style={{ cursor: 'pointer', transition: 'filter 0.2s' }}
                              className="hover:brightness-125"
                            />
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

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {heatmapData.map((idx, index) => {
                      const isPositive = idx.val >= 0;
                      return (
                        <button 
                          key={`${idx.name}-${index}`}
                          onClick={() => scrollToSector(idx.originalName)}
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
                        </button>
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
                      <div 
                        key={sector.title} 
                        ref={el => (sectorRefs.current[sector.title] = el)}
                        className={`bg-[#172030] border rounded-xl overflow-hidden shadow-lg scroll-mt-24 transition-all duration-700 ${
                          highlightedSector === sector.title 
                            ? 'border-emerald-500 ring-4 ring-emerald-500/30' 
                            : 'border-slate-800/60'
                        }`}
                      >
                        <div className="flex justify-between items-center bg-[#1e293b] p-3.5 border-b border-slate-800/60">
                          <h3 className="font-bold text-xs text-white tracking-widest">{sector.ext || sector.title}</h3>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded">{sector.stocks.length} STOCKS</span>
                        </div>
                        
                        <div className="p-1">
                          {/* Table Header */}
                          <div className="flex text-[9px] font-bold text-slate-500 uppercase tracking-widest p-2 pb-2 border-b border-slate-800/40 mx-2">
                            <div className="flex-1">SYMBOL</div>
                            <div className="w-16 text-right">LTP</div>
                            <div className="w-16 text-right">%CHG</div>
                          </div>
                          
                          {/* Rows */}
                          <div className="px-1 py-1 max-h-[380px] overflow-y-auto custom-scrollbar">
                            {sector.stocks.map((stockSym, idx) => {
                              const stock = liveData[stockSym] || { price: 0, change: 0 };
                              const isPositive = stock.change >= 0;
                              return (
                                <div key={idx} className="flex items-center text-xs py-2 px-3 hover:bg-slate-800/70 rounded transition-colors group">
                                  <div className="flex-1 font-bold text-slate-300 group-hover:text-white transition-colors">
                                    {stockSym} <span className="opacity-40 font-normal text-[10px] ml-1">EQ</span>
                                  </div>
                                  <div className="w-16 text-right font-medium text-slate-200">
                                    {stock.price > 0 ? stock.price.toFixed(2) : '-'}
                                  </div>
                                  <div className={`w-16 text-right font-bold tracking-tight ${isPositive ? 'text-[#3eb665]' : 'text-[#e74c3c]'}`}>
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
