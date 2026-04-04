import React, { useState, useEffect, useMemo } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart3, LayoutGrid, TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react';
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

const SectoralFlow: React.FC = () => {
  const navigate = useNavigate();
  
  const [liveData, setLiveData] = useState<Record<string, { price: number; change: number }>>({});
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

      const chunkSize = 12;
      let loaded = 0;
      for (let i = 0; i < symbolArray.length; i += chunkSize) {
        const chunk = symbolArray.slice(i, i + chunkSize);
        const chunkResults: Record<string, { price: number; change: number }> = {};

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
              chunkResults[sym] = { price: data.price, change: data.change || 0 };
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
                  <div className="flex bg-[#111827] rounded-xl p-1 border border-slate-700/40 shadow-inner">
                    <button 
                      onClick={() => setActiveView('chart')}
                      className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                        activeView === 'chart' 
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20' 
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
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20' 
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
                  <div className="bg-gradient-to-br from-[#172030] to-[#111827] rounded-xl p-4 border border-slate-800/60 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Gaining</p>
                    <p className="text-2xl font-black text-emerald-400">{gainingSectors}</p>
                    <p className="text-[10px] text-slate-600 mt-1">sectors positive</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#172030] to-[#111827] rounded-xl p-4 border border-slate-800/60 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-500/5 rounded-full blur-2xl" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Declining</p>
                    <p className="text-2xl font-black text-red-400">{losingSectors}</p>
                    <p className="text-[10px] text-slate-600 mt-1">sectors negative</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#172030] to-[#111827] rounded-xl p-4 border border-slate-800/60 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Top Sector</p>
                    <p className="text-lg font-black text-white">{topSector?.name || '-'}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      {topSector ? `+${topSector.value.toFixed(2)}%` : '-'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#172030] to-[#111827] rounded-xl p-4 border border-slate-800/60 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-500/5 rounded-full blur-2xl" />
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
                  <div className="bg-gradient-to-br from-[#172030] to-[#111827] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.15em]">Sector Momentum</h3>
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium">Avg % change of constituents</span>
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
                  <div className="bg-gradient-to-br from-[#172030] to-[#111827] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40">
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
                            className="relative rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[130px]"
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
                            className="relative rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[100px]"
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
                              className="relative rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[80px]"
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
                <div className="mt-4 pb-10">
                  <div className="flex justify-between items-end mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full" />
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Sector Breakdown</h2>
                        <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">Live Component Prices • Click stock to open chart</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {SECTOR_DEFINITIONS.map((sector) => {
                      const sectorData = sectoralFlowData.find(s => s.name === sector.title);
                      const sectorChange = sectorData?.value ?? 0;
                      const isPositiveSector = sectorChange >= 0;
                      
                      return (
                        <div 
                          key={sector.title} 
                          ref={el => (sectorRefs.current[sector.title] = el)}
                          className={`bg-gradient-to-br from-[#172030] to-[#111827] border rounded-xl overflow-hidden shadow-lg scroll-mt-24 transition-all duration-700 ${
                            highlightedSector === sector.title 
                              ? 'border-violet-500 ring-4 ring-violet-500/30 scale-[1.02]' 
                              : 'border-slate-800/60 hover:border-slate-700/80'
                          }`}
                        >
                          {/* Sector Header */}
                          <div className="flex justify-between items-center p-3.5 border-b border-slate-800/40" style={{
                            background: `linear-gradient(135deg, ${isPositiveSector ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}, transparent)`
                          }}>
                            <div>
                              <h3 className="font-bold text-xs text-white tracking-widest">{sector.ext || sector.title}</h3>
                              <div className={`text-[10px] font-black mt-0.5 ${isPositiveSector ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPositiveSector ? '+' : ''}{sectorChange.toFixed(2)}%
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">{Math.min(12, sector.stocks.length)} ASSETS</span>
                          </div>
                          
                          <div className="p-1">
                            {/* Table Header */}
                            <div className="flex text-[9px] font-bold text-slate-500 uppercase tracking-widest p-2 pb-2 border-b border-slate-800/40 mx-2">
                              <div className="flex-1">SYMBOL</div>
                              <div className="w-16 text-right">LTP</div>
                              <div className="w-16 text-right">%CHG</div>
                            </div>
                            
                            {/* Rows */}
                            <div className="px-1 py-1 h-[270px] overflow-y-auto custom-scrollbar">
                              {sector.stocks.slice(0, 12).map((stockSym, idx) => {
                                const stock = liveData[stockSym] || { price: 0, change: 0 };
                                const isPositive = stock.change >= 0;
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => window.open(`https://in.tradingview.com/chart/?symbol=NSE:${stockSym}`, '_blank')}
                                    className="flex items-center text-xs py-2 px-3 hover:bg-slate-800/70 rounded-lg transition-all group cursor-pointer"
                                  >
                                    <div className="flex-1 font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-1.5">
                                      {stockSym}
                                      <ExternalLink className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="w-16 text-right font-medium text-slate-200">
                                      {stock.price > 0 ? stock.price.toFixed(2) : <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-700 border-t-slate-400 animate-spin" />}
                                    </div>
                                    <div className={`w-16 text-right font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {stock.price > 0 ? `${isPositive ? '+' : ''}${stock.change.toFixed(2)}%` : '-'}
                                    </div>
                                  </div>
                                );
                              })}
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
