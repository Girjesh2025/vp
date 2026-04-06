import React, { useState, useEffect, useMemo } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart3, LayoutGrid, TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
// Import at the top
import { fetchStockPrice } from '../../utils/priceApi';
import { LOGO_MAP } from '../../utils/logoMap';

const PROXY_URLS = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

/** Fetch Real 20-Day Average % Change via Yahoo Spark API */
const fetchRealSparkData = async (symbols: string[]): Promise<Record<string, number>> => {
  if (symbols.length === 0) return {};
  
  const chunkedSymbols = [];
  for (let i = 0; i < symbols.length; i += 40) {
    chunkedSymbols.push(symbols.slice(i, i + 40));
  }

  const results: Record<string, number> = {};

  for (const chunk of chunkedSymbols) {
    const query = chunk.map(s => `${s}.NS`).join(',');
    const targetUrl = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${query}&range=1mo&interval=1d`;
    
    let success = false;
    for (const proxy of PROXY_URLS) {
      if (success) break;
      try {
        const res = await fetch(`${proxy}${encodeURIComponent(targetUrl)}`);
        if (!res.ok) continue;
        
        const data = await res.json();
        const parsedData = proxy.includes('allorigins') ? JSON.parse(data.contents) : data;
        
        if (parsedData?.spark?.result) {
          parsedData.spark.result.forEach((item: any) => {
            const sym = item.symbol.replace('.NS', '');
            const closes = item.response?.[0]?.indicators?.quote?.[0]?.close;
            if (closes && Array.isArray(closes) && closes.length >= 2) {
              const validCloses = closes.filter(c => typeof c === 'number' && c > 0);
              let totalPercentChange = 0;
              let count = 0;
              for (let i = 1; i < validCloses.length; i++) {
                const pctChange = Math.abs((validCloses[i] - validCloses[i-1]) / validCloses[i-1]) * 100;
                totalPercentChange += pctChange;
                count++;
              }
              results[sym] = count > 0 ? (totalPercentChange / count) : 0.8;
            }
          });
          success = true;
        }
      } catch (e) {
        // Continue to next proxy
      }
    }
  }

  return results;
};

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

/** 
 * Compute a gradient color based on percentage change.
 * Deep red → orange → neutral → light green → deep green
 */
const getHeatmapColor = (val: number): string => {
  if (val <= -3) return '#dc2626';     // Deep red
  if (val <= -2) return '#ef4444';     // Red
  if (val <= -1) return '#f87171';     // Light red
  if (val <= -0.3) return '#fb923c';   // Orange
  if (val < 0.3) return '#64748b';     // Neutral slate
  if (val < 1) return '#4ade80';       // Light green
  if (val < 2) return '#22c55e';       // Green
  if (val < 3) return '#16a34a';       // Medium green
  return '#15803d';                     // Deep green
};

/** Get a background glow color for heatmap tiles */
const getHeatmapGlow = (val: number): string => {
  if (val <= -1) return 'rgba(239,68,68,0.15)';
  if (val >= 1) return 'rgba(34,197,94,0.15)';
  return 'rgba(100,116,139,0.08)';
};

/** Deterministic mock Average % Change (last 20 days) for R.Fac calculation */
const getMockAvgPercentChange20D = (symbol: string): number => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generates an average daily percent change roughly between 0.8% and 2.5%
  return 0.8 + (Math.abs(hash) % 100) / 60; 
};

/** Deterministic gradient generator for stock logos */
const getLogoGradient = (symbol: string): string => {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-orange-400 to-red-500',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-pink-600',
    'from-sky-400 to-indigo-500'
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const SectoralFlow: React.FC = () => {
  const navigate = useNavigate();
  
  const [liveData, setLiveData] = useState<Record<string, { price: number; change: number; avgChange20D: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'chart' | 'heatmap'>('chart');
  const [highlightedSector, setHighlightedSector] = useState<string | null>(null);
  const [hoveredHeatmapTile, setHoveredHeatmapTile] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const sectorRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToSector = (sectorTitle: string) => {
    const target = sectorRefs.current[sectorTitle];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedSector(sectorTitle);
      setTimeout(() => setHighlightedSector(null), 2500);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadLiveMarketData = async () => {
      const allSymbols = new Set<string>();
      SECTOR_DEFINITIONS.forEach(sec => sec.stocks.forEach(s => allSymbols.add(s)));
      const symbolArray = Array.from(allSymbols);
      
      setLoading(false);

      // Start fetching the 20-day average percentage change in the background
      const sparkDataPromise = fetchRealSparkData(symbolArray);

      const chunkSize = 12;
      let loaded = 0;
      for (let i = 0; i < symbolArray.length; i += chunkSize) {
        const chunk = symbolArray.slice(i, i + chunkSize);
        const chunkResults: Record<string, { price: number; change: number; avgChange20D: number }> = {};

        await Promise.allSettled(
          chunk.map(async (sym) => {
            const querySym = sym.startsWith('^') ? sym : `${sym}.NSE`;
            const timeoutPromise = new Promise<{price: number, change: number} | null>((resolve) => 
               setTimeout(() => resolve(null), 4500)
            );
            const data = await Promise.race([
               fetchStockPrice(querySym),
               timeoutPromise
            ]);
            if (data && isMounted) {
              // Temporary avgChange until sparkData resolves
              chunkResults[sym] = { price: data.price, change: data.change || 0, avgChange20D: getMockAvgPercentChange20D(sym) };
            }
          })
        );
        
        loaded += chunk.length;
        if (isMounted) {
          setLoadProgress(Math.round((loaded / symbolArray.length) * 100));
          if (Object.keys(chunkResults).length > 0) {
            setLiveData(prev => ({ ...prev, ...chunkResults }));
          }
        }
      }

      // Once all live data is loaded, wait for spark data and update state with real averages
      if (isMounted) {
        try {
          const realAverages = await sparkDataPromise;
          setLiveData(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(sym => {
              if (realAverages[sym]) {
                updated[sym].avgChange20D = realAverages[sym];
              }
            });
            return updated;
          });
        } catch (err) {
          console.warn("Failed to load real spark averages", err);
        }
      }
    };

    loadLiveMarketData();
    return () => { isMounted = false; };
  }, []);

  // Compute aggregated sector performance
  const sectoralFlowData = useMemo(() => {
    return SECTOR_DEFINITIONS.map(sector => {
      let totalChg = 0;
      let count = 0;
      sector.stocks.forEach(sym => {
        if (liveData[sym]) {
          totalChg += liveData[sym].change;
          count++;
        }
      });
      const avgChange = count > 0 ? totalChg / count : 0;
      return { 
        name: sector.title, 
        value: Number(avgChange.toFixed(2)), 
        stockCount: sector.stocks.length,
        loadedCount: count
      };
    }).sort((a, b) => a.value - b.value);
  }, [liveData]);

  // Summary stats
  const gainingSectors = sectoralFlowData.filter(s => s.value > 0).length;
  const losingSectors = sectoralFlowData.filter(s => s.value < 0).length;
  const topSector = sectoralFlowData[sectoralFlowData.length - 1];
  const bottomSector = sectoralFlowData[0];

  const handleTabChange = (tabId: string) => {
    navigate('/app', { state: { activeTab: tabId } });
  };

  // Custom bar chart tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const isPositive = data.value >= 0;
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: `1px solid ${isPositive ? '#22c55e40' : '#ef444440'}`,
        borderRadius: '12px',
        padding: '14px 18px',
        boxShadow: `0 8px 32px ${isPositive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
        minWidth: '160px'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' as const }}>
          NIFTY {data.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: isPositive ? '#4ade80' : '#f87171', 
            fontSize: '20px', 
            fontWeight: 900 
          }}>
            {isPositive ? '+' : ''}{data.value}%
          </span>
        </div>
        <div style={{ color: '#475569', fontSize: '10px', marginTop: '6px' }}>
          {data.loadedCount}/{data.stockCount} stocks loaded
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={handleTabChange} portfolioCount={0} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Nav Back */}
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Tools
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Connecting to Live Feed</h3>
                <p className="text-slate-400 max-w-md">Initializing dashboard...</p>
              </div>
            ) : (
              <>
                {/* ─── Header Section ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Sectorial Flow</h2>
                        <p className="text-[10px] text-emerald-500 tracking-widest uppercase flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          Live Data • {new Date().toLocaleTimeString()}
                          {loadProgress < 100 && (
                            <span className="text-slate-500 ml-2">({loadProgress}% loaded)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CHART / HEATMAP Toggle */}
                  <div className="flex bg-[#131b26] rounded-xl p-1 border border-slate-700/40 shadow-inner">
                    <button 
                      onClick={() => setActiveView('chart')}
                      className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                        activeView === 'chart' 
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      CHART
                    </button>
                    <button 
                      onClick={() => setActiveView('heatmap')}
                      className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                        activeView === 'heatmap' 
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      HEATMAP
                    </button>
                  </div>
                </div>

                {/* ─── Summary KPI Cards ─── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#131b26] rounded-xl p-4 border border-slate-800 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Gaining</p>
                    <p className="text-2xl font-black text-emerald-400">{gainingSectors}</p>
                    <p className="text-[10px] text-slate-600 mt-1">sectors positive</p>
                  </div>
                  <div className="bg-[#131b26] rounded-xl p-4 border border-slate-800 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Declining</p>
                    <p className="text-2xl font-black text-red-400">{losingSectors}</p>
                    <p className="text-[10px] text-slate-600 mt-1">sectors negative</p>
                  </div>
                  <div className="bg-[#131b26] rounded-xl p-4 border border-slate-800 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Top Sector</p>
                    <p className="text-lg font-black text-white">{topSector?.name || '-'}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      {topSector ? `+${topSector.value.toFixed(2)}%` : '-'}
                    </p>
                  </div>
                  <div className="bg-[#131b26] rounded-xl p-4 border border-slate-800 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Bottom Sector</p>
                    <p className="text-lg font-black text-white">{bottomSector?.name || '-'}</p>
                    <p className="text-[10px] text-red-400 font-bold mt-1">
                      {bottomSector ? `${bottomSector.value.toFixed(2)}%` : '-'}
                    </p>
                  </div>
                </div>

                {/* ─── Main View: CHART or HEATMAP ─── */}
                {activeView === 'chart' ? (
                  /* ════════════ CHART VIEW ════════════ */
                  <div className="bg-[#131b26] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#172030]">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.15em]">Sector Momentum</h3>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Avg % change of constituents</span>
                    </div>
                    <div className="p-6 h-[480px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectoralFlowData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="greenBar" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="redBar" x1="1" y1="0" x2="0" y2="0">
                              <stop offset="0%" stopColor="#dc2626" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b50" />
                          <XAxis 
                            type="number" 
                            axisLine={{ stroke: '#1e293b' }} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }} 
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }} 
                            width={90}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.3 }} />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                            {sectoralFlowData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value >= 0 ? 'url(#greenBar)' : 'url(#redBar)'}
                                onClick={() => scrollToSector(entry.name)}
                                style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  /* ════════════ HEATMAP VIEW ════════════ */
                  <div className="bg-[#131b26] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#172030]">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.15em]">Market Heatmap</h3>
                      </div>
                      {/* Color scale legend */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 font-bold">-3%</span>
                        <div className="flex gap-0.5">
                          {['#dc2626', '#ef4444', '#f87171', '#fb923c', '#64748b', '#4ade80', '#22c55e', '#16a34a', '#15803d'].map((c, i) => (
                            <div key={i} className="w-5 h-2.5 rounded-sm" style={{ background: c }} />
                          ))}
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">+3%</span>
                      </div>
                    </div>

                    {/* Treemap-style Heatmap */}
                    <div className="p-4">
                      {/* Top row - large tiles for top sectors by stock count */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {sectoralFlowData.slice(-3).reverse().map((s) => (
                          <button
                            key={s.name}
                            onClick={() => scrollToSector(s.name)}
                            onMouseEnter={() => setHoveredHeatmapTile(s.name)}
                            onMouseLeave={() => setHoveredHeatmapTile(null)}
                            className="relative rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[130px] overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${getHeatmapColor(s.value)}dd, ${getHeatmapColor(s.value)}99)`,
                              boxShadow: hoveredHeatmapTile === s.name 
                                ? `0 0 30px ${getHeatmapGlow(s.value)}, inset 0 0 30px rgba(255,255,255,0.05)` 
                                : `0 4px 20px ${getHeatmapGlow(s.value)}`,
                              transform: hoveredHeatmapTile === s.name ? 'scale(1.02)' : 'scale(1)',
                            }}
                          >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                              <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 opacity-80 text-white/80">
                                NIFTY {s.name}
                              </div>
                              <div className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
                                {s.value > 0 ? '+' : ''}{s.value.toFixed(2)}%
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-2">
                                {s.value >= 0 
                                  ? <TrendingUp className="w-3.5 h-3.5 text-white/60" /> 
                                  : <TrendingDown className="w-3.5 h-3.5 text-white/60" />
                                }
                                <span className="text-[9px] text-white/50 font-semibold">
                                  {s.loadedCount} stocks
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Middle rows - medium tiles */}
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {sectoralFlowData.slice(Math.max(0, sectoralFlowData.length - 7), sectoralFlowData.length - 3).reverse().map((s) => (
                          <button
                            key={s.name}
                            onClick={() => scrollToSector(s.name)}
                            onMouseEnter={() => setHoveredHeatmapTile(s.name)}
                            onMouseLeave={() => setHoveredHeatmapTile(null)}
                            className="relative rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[100px] overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${getHeatmapColor(s.value)}dd, ${getHeatmapColor(s.value)}99)`,
                              boxShadow: hoveredHeatmapTile === s.name 
                                ? `0 0 25px ${getHeatmapGlow(s.value)}, inset 0 0 20px rgba(255,255,255,0.05)` 
                                : `0 3px 15px ${getHeatmapGlow(s.value)}`,
                              transform: hoveredHeatmapTile === s.name ? 'scale(1.03)' : 'scale(1)',
                            }}
                          >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                              <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-1.5 text-white/70">
                                NIFTY {s.name}
                              </div>
                              <div className="text-xl font-black text-white tracking-tight drop-shadow-md">
                                {s.value > 0 ? '+' : ''}{s.value.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Bottom row - smaller tiles for remaining sectors */}
                      {sectoralFlowData.length > 7 && (
                        <div className="grid grid-cols-5 gap-2">
                          {sectoralFlowData.slice(0, Math.max(0, sectoralFlowData.length - 7)).map((s) => (
                            <button
                              key={s.name}
                              onClick={() => scrollToSector(s.name)}
                              onMouseEnter={() => setHoveredHeatmapTile(s.name)}
                              onMouseLeave={() => setHoveredHeatmapTile(null)}
                              className="relative rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[80px] overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${getHeatmapColor(s.value)}dd, ${getHeatmapColor(s.value)}99)`,
                                boxShadow: hoveredHeatmapTile === s.name 
                                  ? `0 0 20px ${getHeatmapGlow(s.value)}, inset 0 0 15px rgba(255,255,255,0.05)` 
                                  : `0 2px 10px ${getHeatmapGlow(s.value)}`,
                                transform: hoveredHeatmapTile === s.name ? 'scale(1.04)' : 'scale(1)',
                              }}
                            >
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                              <div className="relative z-10">
                                <div className="text-[8px] font-bold uppercase tracking-wider mb-1 text-white/70">
                                  {s.name}
                                </div>
                                <div className="text-base font-black text-white tracking-tight drop-shadow-md">
                                  {s.value > 0 ? '+' : ''}{s.value.toFixed(2)}%
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Sector Breakdown ─── */}
                <div className="mt-8 pb-10">
                  <div className="flex justify-between items-end mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-10 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-md">Sector Breakdown</h2>
                        <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">Live Component Prices • Click stock to open chart</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {SECTOR_DEFINITIONS.map((sector) => {
                      const sectorData = sectoralFlowData.find(s => s.name === sector.title);
                      const sectorChange = sectorData?.value ?? 0;
                      const isPositiveSector = sectorChange >= 0;
                      
                      return (
                        <div 
                          key={sector.title} 
                          ref={el => (sectorRefs.current[sector.title] = el)}
                          className={`relative group bg-gradient-to-br from-[#172030] to-[#0f1520] border rounded-2xl overflow-hidden shadow-xl scroll-mt-24 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${
                            highlightedSector === sector.title 
                              ? 'border-violet-500 ring-4 ring-violet-500/30 scale-[1.02]' 
                              : 'border-slate-700/50 hover:border-slate-500/50 hover:-translate-y-1'
                          }`}
                        >
                          {/* Subtle glow behind the card header */}
                          <div className="absolute top-0 left-0 w-full h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{
                            background: `linear-gradient(to bottom, ${isPositiveSector ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}, transparent)`
                          }} />

                          {/* Sector Header */}
                          <div className="relative flex justify-between items-center p-5 border-b border-slate-700/50" style={{
                            background: `linear-gradient(135deg, ${isPositiveSector ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}, transparent)`
                          }}>
                            <div>
                              <h3 className="font-extrabold text-base text-white tracking-widest drop-shadow-md">{sector.ext || sector.title}</h3>
                              <div className={`text-sm font-black mt-1 flex items-center gap-1.5 ${isPositiveSector ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPositiveSector ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {isPositiveSector ? '+' : ''}{sectorChange.toFixed(2)}%
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-300 bg-[#0f1520] shadow-inner border border-slate-700/50 px-3 py-1.5 rounded-xl">
                              {Math.min(12, sector.stocks.length)} ASSETS
                            </span>
                          </div>
                          
                          <div className="p-2 relative z-10">
                            {/* Table Header */}
                            <div className="flex text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 pr-4 pb-2 border-b border-slate-700/50">
                              <div className="flex-1">SYMBOL</div>
                              <div className="w-16 text-right">LTP</div>
                              <div className="w-[72px] text-center">%</div>
                              <div className="w-10 text-right">R.FAC</div>
                            </div>
                            
                            {/* Rows */}
                            <div className="py-2 h-[340px] overflow-y-auto custom-scrollbar space-y-1">
                              {(() => {
                                const sortedStocks = [...sector.stocks]
                                  .map(stockSym => {
                                    const stock = liveData[stockSym] || { price: 0, change: 0, avgChange20D: getMockAvgPercentChange20D(stockSym) };
                                    const isPositive = stock.change >= 0;
                                    const avgChange20D = stock.avgChange20D || getMockAvgPercentChange20D(stockSym);
                                    const rFacNum = stock.price > 0 ? (Math.abs(stock.change) / avgChange20D) : 0;
                                    const rFac = stock.price > 0 ? rFacNum.toFixed(2) : '-';
                                    return { stockSym, stock, isPositive, rFacNum, rFac };
                                  })
                                  // Sort by descending R.Fac score (highest first)
                                  .sort((a, b) => b.rFacNum - a.rFacNum)
                                  .slice(0, 12);

                                return sortedStocks.map(({ stockSym, stock, isPositive, rFac }) => {
                                  // Re-extract valid string/number values to ensure no React render errors
                                  const renderPrice = stock.price > 0 ? stock.price.toFixed(2) : null;
                                  const renderChange = stock.price > 0 ? `${isPositive ? '+' : ''}${stock.change.toFixed(2)}%` : null;

                                  return (
                                    <div 
                                      key={stockSym} 
                                      onClick={() => window.open(`https://in.tradingview.com/chart/?symbol=NSE:${stockSym}`, '_blank')}
                                      className="flex items-center text-sm py-2.5 px-3 hover:bg-slate-800/80 rounded-xl transition-all group/row cursor-pointer border border-transparent hover:border-slate-700/50"
                                    >
                                      <div className="flex-1 min-w-0 font-bold text-slate-300 group-hover/row:text-white transition-colors flex items-center gap-3">
                                        {/* Stock Logo Avatar */}
                                        <div className={`w-8 h-8 shrink-0 rounded-full bg-[#ffffff] flex items-center justify-center shadow-md ring-1 ring-white/10 group-hover/row:ring-white/30 transition-all overflow-hidden`}>
                                          {LOGO_MAP[stockSym] ? (
                                            <img 
                                              src={`https://assets-netstorage.groww.in/stock-assets/logos/GSTK${LOGO_MAP[stockSym]}.png`} 
                                              alt={stockSym}
                                              className="w-full h-full object-cover p-1.5"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                  parent.className = `w-8 h-8 shrink-0 rounded-full bg-gradient-to-br ${getLogoGradient(stockSym)} flex items-center justify-center text-[11px] text-white font-black shadow-md ring-1 ring-white/10 group-hover/row:ring-white/30 transition-all`;
                                                  parent.innerText = stockSym.substring(0, 2);
                                                }
                                              }}
                                            />
                                          ) : (
                                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getLogoGradient(stockSym)} text-[11px] text-white font-black`}>
                                              {stockSym.substring(0, 2)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="truncate inline-block max-w-[70px] sm:max-w-[120px] lg:max-w-[90px] xl:max-w-[100px] 2xl:max-w-[130px]" title={stockSym}>{stockSym}</span>
                                            <ExternalLink className="w-3 h-3 shrink-0 text-slate-500 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                          </div>
                                          <div className="text-[9px] text-slate-500 font-medium tracking-wider flex items-center gap-1">
                                            <div className={`w-1 h-1 shrink-0 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'} opacity-70`} />
                                            NSE
                                          </div>
                                        </div>
                                      </div>
                                      <div className="w-16 shrink-0 text-right font-semibold text-slate-200">
                                        {renderPrice ? renderPrice : <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-700 border-t-slate-400 animate-spin" />}
                                      </div>
                                      <div className="w-[72px] shrink-0 flex justify-center">
                                        {renderChange ? (
                                          <span className={`min-w-[52px] text-center px-1.5 py-1 rounded-md text-xs font-bold tracking-tight shadow-md ${
                                            isPositive 
                                              ? 'bg-[#c6f6d5] text-[#14532d] shadow-emerald-500/10' 
                                              : 'bg-[#fed7d7] text-[#7f1d1d] shadow-red-500/10'
                                          }`}>
                                            {renderChange}
                                          </span>
                                        ) : '-'}
                                      </div>
                                      <div className="w-10 shrink-0 text-right font-semibold text-slate-300 tracking-wide text-xs pr-1">
                                        {rFac}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
