import React, { useState, useEffect, useMemo } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart3, LayoutGrid, TrendingUp, TrendingDown, Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, LabelList } from 'recharts';
import { fetchStockPrice } from '../../utils/priceApi';
import StockLogo from '../StockLogo';

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
    try {
      const res = await fetch(`/api/yahoo/spark?symbols=${encodeURIComponent(query)}&range=1mo&interval=1d`);
      if (!res.ok) continue;

      const parsedData = await res.json();

      if (parsedData?.spark?.result) {
        parsedData.spark.result.forEach((item: any) => {
          const sym = item.symbol.replace('.NS', '');
          const closes = item.response?.[0]?.indicators?.quote?.[0]?.close;
          if (closes && Array.isArray(closes) && closes.length >= 2) {
            const validCloses = closes.filter((c: any) => typeof c === 'number' && c > 0) as number[];
            let totalPercentChange = 0;
            let count = 0;
            for (let i = 1; i < validCloses.length; i++) {
              const pctChange = Math.abs((validCloses[i] - validCloses[i - 1]) / validCloses[i - 1]) * 100;
              totalPercentChange += pctChange;
              count++;
            }
            results[sym] = count > 0 ? totalPercentChange / count : 0.8;
          }
        });
      }
    } catch (e) {}
  }

  return results;
};

const fetchSectorIndexData = async (
  symbols: string[]
): Promise<Record<string, { price: number; change: number; previousClose: number }>> => {
  if (symbols.length === 0) return {};

  try {
    const response = await fetch(
      `/api/yahoo/spark?symbols=${encodeURIComponent(symbols.join(','))}&range=1d&interval=1d`
    );
    if (!response.ok) return {};

    const parsed = await response.json();
    const results: Record<string, { price: number; change: number; previousClose: number }> = {};

    const items = parsed?.spark?.result;
    if (!Array.isArray(items)) return {};

    items.forEach((item: any) => {
      const symbol = item?.symbol;
      const responseNode = item?.response?.[0];
      const closes = responseNode?.indicators?.quote?.[0]?.close;
      const validCloses = Array.isArray(closes)
        ? closes.filter((value: unknown) => typeof value === 'number' && Number.isFinite(value))
        : [];

      const price =
        typeof validCloses[validCloses.length - 1] === 'number'
          ? validCloses[validCloses.length - 1]
          : responseNode?.meta?.regularMarketPrice;
      const previousClose =
        responseNode?.meta?.chartPreviousClose ??
        responseNode?.meta?.previousClose ??
        item?.previousClose ??
        price;

      if (
        typeof symbol === 'string' &&
        typeof price === 'number' &&
        Number.isFinite(price) &&
        typeof previousClose === 'number' &&
        Number.isFinite(previousClose) &&
        previousClose > 0
      ) {
        const change = ((price - previousClose) / previousClose) * 100;
        results[symbol] = {
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          previousClose: Number(previousClose.toFixed(2)),
        };
      }
    });

    return results;
  } catch {
    return {};
  }
};

// Define the core constituents we want to track for our sectoral flow proxy
const SECTOR_DEFINITIONS = [
  { title: 'DEFENCE', ext: 'NIFTY IND DEFENCE', symbol: '', stocks: ['HAL', 'BEL', 'MAZAGON', 'BDL', 'ASTRAMICRO', 'PARAS', 'MTARTECH', 'DATAPATTNS', 'BEML', 'GRSE', 'MIDHANI', 'SOLARIND', 'BHEL', 'APOLLOMICRO', 'ZENITHEXPO'] },
  { title: 'PSU BANK', ext: 'NIFTY PSU BANK', symbol: '^CNXPSUBANK', stocks: ['SBIN', 'PNB', 'BANKINDIA', 'CANBK', 'UNIONBANK', 'INDIANB', 'BANKBARODA', 'MAHABANK', 'PSB', 'CENTRALBK', 'IOB', 'UCOBANK'] },
  { title: 'MEDIA', ext: 'NIFTY MEDIA', symbol: '^CNXMEDIA', stocks: ['ZEEL', 'NETWORK18', 'PVRINOX', 'NDTV', 'SUNTV', 'TV18BRDCST', 'DISHTV', 'HATHWAY', 'NAVKARCORP', 'DBCORP'] },
  { title: 'BANK', ext: 'NIFTY BANK', symbol: '^NSEBANK', stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK', 'PNB', 'AUBANK', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK'] },
  { title: 'REALTY', ext: 'NIFTY REALTY', symbol: '^CNXREALTY', stocks: ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'LODHA', 'BRIGADE', 'SOBHA', 'MAHLIFE', 'PHOENIXLTD'] },
  { title: 'METAL', ext: 'NIFTY METAL', symbol: '^CNXMETAL', stocks: ['TATASTEEL', 'HINDALCO', 'JSWSTEEL', 'COALINDIA', 'VEDL', 'SAIL', 'NMDC', 'JINDALSTEL', 'NATIONALUM', 'HINDZINC', 'APLALAPOLLO', 'WELCORP', 'RATNAMANI'] },
  { title: 'IT', ext: 'NIFTY IT', symbol: '^CNXIT', stocks: ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 'PERSISTENT', 'OFSS', 'COFORGE', 'MPHASIS'] },
  { title: 'AUTO', ext: 'NIFTY AUTO', symbol: '^CNXAUTO', stocks: ['TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR', 'BOSCHLTD', 'ASHOKLEY', 'MRF', 'TIINDIA', 'MOTHERSON', 'SONACOMS', 'BALKRISIND', 'BHARATFORG'] },
  { title: 'PHARMA', ext: 'NIFTY PHARMA', symbol: '^CNXPHARMA', stocks: ['SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'LUPIN', 'AUROPHARMA', 'APOLLOHOSP', 'TORNTPHARM', 'ZYDUSLIFE', 'MANKIND', 'BIOCON', 'SYNGENE', 'ABBOTINDIA', 'IPCALAB', 'GLENMARK', 'AJANTPHARM', 'LAURUSLABS', 'NATCOPHARM', 'GRANULES', 'JBCHEPHARM'] },
  { title: 'FMCG', ext: 'NIFTY FMCG', symbol: '^CNXFMCG', stocks: ['ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'GODREJCP', 'TATACONSUM', 'MARICO', 'VBL', 'COLPAL', 'UBL', 'PGHH', 'RADICO', 'EMAMILTD', 'BALRAMCHIN'] },
  { title: 'ENERGY', ext: 'NIFTY ENERGY', symbol: '^CNXENERGY', stocks: ['RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'BPCL', 'COALINDIA', 'TATAPOWER', 'IOC', 'HPCL', 'ADANIGREEN'] },
  { title: 'INFRA', ext: 'NIFTY INFRA', symbol: '^CNXINFRA', stocks: ['LT', 'ADANIPORTS', 'ULTRACEMCO', 'GRASIM', 'AMBUJACEM', 'SHREECEM', 'BHARTIARTL', 'ACC', 'LODHA', 'PVRINOX', 'NTPC', 'POWERGRID', 'ONGC', 'IOC'] },
];

/** 
 * Compute a vibrant neon color based on percentage change.
 */
const getHeatmapColor = (val: number): string => {
  if (val <= -2.0) return '#d50000'; // Deep Vivid Red
  if (val <= -1.0) return '#ff1744'; // Electric Neon Red
  if (val < 0) return '#ff5252'; // Bright Light Red
  if (val === 0) return '#334155'; // Neutral Slate
  if (val < 1.0) return '#00e676'; // Electric Neon Green
  if (val < 2.0) return '#00c853'; // Vivid Emerald
  return '#00b0ff'; // Super High Cyan / Green
};

/** Get a background glow color for heatmap tiles */
const getHeatmapGlow = (val: number): string => {
  if (val <= -1) return 'rgba(255,23,68,0.35)';
  if (val >= 1) return 'rgba(0,230,118,0.35)';
  return 'rgba(100,116,139,0.1)';
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
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

type SectorMover = {
  symbol: string;
  change: number;
};

type SectorSnapshot = {
  name: string;
  value: number;
  displayChange: number;
  indexPrice: number | null;
  equalWeightValue: number;
  breadth: number;
  advanceCount: number;
  declineCount: number;
  avgRfac: number;
  stockCount: number;
  loadedCount: number;
  coveragePct: number;
  momentumLift: number;
  convictionScore: number;
  participationScore: number;
  dominanceScore: number;
  consistencyScore: number;
  tradeSetup: 'Long Continuation' | 'Short Pressure' | 'Long Watch' | 'Short Watch' | 'Mixed';
  leader: SectorMover | null;
  laggard: SectorMover | null;
};

const formatSignedPct = (value?: number | null, digits = 2): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
};

const SectoralFlow: React.FC = () => {
  const navigate = useNavigate();
  
  const [liveData, setLiveData] = useState<Record<string, { price: number; change: number; avgChange20D: number }>>({});
  const [sectorIndexData, setSectorIndexData] = useState<Record<string, { price: number; change: number; previousClose: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'chart' | 'heatmap'>('chart');
  const [highlightedSector, setHighlightedSector] = useState<string | null>(null);
  const [hoveredHeatmapTile, setHoveredHeatmapTile] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<'all' | 'bullish' | 'bearish' | 'conviction'>('all');
  const [loadProgress, setLoadProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
      const isInitialLoad = refreshKey === 0;
      const allSymbols = new Set<string>();
      SECTOR_DEFINITIONS.forEach(sec => sec.stocks.forEach(s => allSymbols.add(s)));
      const symbolArray = Array.from(allSymbols);
      if (isMounted) {
        setError(null);
        setLoadProgress(0);
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      }

      // Start fetching the 20-day average percentage change in the background
      const sparkDataPromise = fetchRealSparkData(symbolArray);
      const sectorSymbols = SECTOR_DEFINITIONS.map((sector) => sector.symbol).filter(Boolean);
      const sectorIndexPromise = fetchSectorIndexData(sectorSymbols);
      const nextLiveData: Record<string, { price: number; change: number; avgChange20D: number }> = {};

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
            Object.assign(nextLiveData, chunkResults);
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

        let sectorIndices: Record<string, { price: number; change: number; previousClose: number }> = {};
        try {
          sectorIndices = await sectorIndexPromise;
          if (Object.keys(sectorIndices).length > 0) {
            setSectorIndexData(sectorIndices);
          }
        } catch (err) {
          console.warn('Failed to load official sector indices', err);
        }

        if (Object.keys(nextLiveData).length === 0 && Object.keys(sectorIndices).length === 0) {
          setError('Live sector data is currently unavailable. Please refresh and try again.');
        } else {
          setLastUpdatedAt(Date.now());
        }

        setLoadProgress(100);
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadLiveMarketData();
    return () => { isMounted = false; };
  }, [refreshKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 120000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Compute aggregated sector performance
  const sectoralFlowData = useMemo<SectorSnapshot[]>(() => {
    return SECTOR_DEFINITIONS.map(sector => {
      let totalChg = 0;
      let count = 0;
      let advances = 0;
      let declines = 0;
      let rfacSum = 0;
      let absChangeSum = 0;
      const stockChanges: number[] = [];
      let topStock: SectorMover | null = null;
      let laggardStock: SectorMover | null = null;

      sector.stocks.forEach((sym) => {
        if (liveData[sym] && liveData[sym].price > 0) {
          const stock = liveData[sym];
          totalChg += stock.change;
          absChangeSum += Math.abs(stock.change);
          stockChanges.push(stock.change);
          count++;
          if (stock.change >= 0) advances++;
          else declines++;

          const avgChange20D = stock.avgChange20D || getMockAvgPercentChange20D(sym);
          rfacSum += Math.abs(stock.change) / Math.max(avgChange20D, 0.1);

          if (!topStock || stock.change > topStock.change) {
            topStock = { symbol: sym, change: stock.change };
          }
          if (!laggardStock || stock.change < laggardStock.change) {
            laggardStock = { symbol: sym, change: stock.change };
          }
        }
      });

      const avgChange = count > 0 ? totalChg / count : 0;
      const officialIndex = sector.symbol ? sectorIndexData[sector.symbol] : undefined;
      const displayChange = officialIndex?.change ?? avgChange;
      const breadth = count > 0 ? ((advances - declines) / count) * 100 : 0;
      const avgRfac = count > 0 ? rfacSum / count : 0;
      const coverageRatio = sector.stocks.length > 0 ? count / sector.stocks.length : 0;
      const avgAbsChange = count > 0 ? absChangeSum / count : 0;
      const variance =
        count > 0 ? stockChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / count : 0;
      const stdDev = Math.sqrt(variance);
      const directionalBias = avgChange !== 0 ? Math.sign(avgChange) : Math.sign(breadth || 0);
      const alignedCount = directionalBias >= 0 ? advances : declines;
      const participationRatio = count > 0 ? alignedCount / count : 0;
      const participationScore = clamp((participationRatio - 0.5) / 0.5, 0, 1);
      const consistencyScore = clamp(1 - stdDev / Math.max(avgAbsChange, 0.3), 0, 1);
      const impulseScore = clamp((avgRfac - 1) / 1.7, 0, 1);
      const strengthScore = clamp(Math.abs(displayChange) / 2.4, 0, 1);
      const topStockChange = (topStock as SectorMover | null)?.change ?? 0;
      const leaderDominance = absChangeSum > 0 ? Math.abs(topStockChange) / absChangeSum : 0;
      const dominancePenalty = clamp((leaderDominance - 0.34) / 0.36, 0, 1);
      const convictionScore = clamp(
        strengthScore * 0.28 +
          participationScore * 0.28 +
          consistencyScore * 0.18 +
          impulseScore * 0.16 +
          coverageRatio * 0.1 -
          dominancePenalty * 0.14,
        0,
        1
      );
      const breadthAdjustment = (breadth / 100) * Math.max(Math.abs(avgChange), 0.32) * 0.8;
      const impulseAdjustment = directionalBias * impulseScore * 0.42;
      const convictionAdjustment = directionalBias * convictionScore * Math.max(Math.abs(displayChange) * 0.42, 0.22);
      const consistencyAdjustment = directionalBias * consistencyScore * 0.18;
      const dominanceAdjustment = directionalBias * dominancePenalty * -0.16;
      const coverageAdjustment = (coverageRatio - 1) * 0.18;
      const momentumScore =
        displayChange +
        breadthAdjustment +
        impulseAdjustment +
        convictionAdjustment +
        consistencyAdjustment +
        dominanceAdjustment +
        coverageAdjustment;
      const momentumLift = momentumScore - displayChange;
      const tradeSetup: SectorSnapshot['tradeSetup'] =
        convictionScore >= 0.7 && directionalBias > 0 && breadth >= 18
          ? 'Long Continuation'
          : convictionScore >= 0.7 && directionalBias < 0 && breadth <= -18
            ? 'Short Pressure'
            : convictionScore >= 0.5 && directionalBias > 0 && breadth >= 5
              ? 'Long Watch'
              : convictionScore >= 0.5 && directionalBias < 0 && breadth <= -5
                ? 'Short Watch'
                : 'Mixed';

      return { 
        name: sector.title, 
        value: Number(momentumScore.toFixed(2)),
        displayChange: Number(displayChange.toFixed(2)),
        indexPrice: officialIndex?.price ?? null,
        equalWeightValue: Number(avgChange.toFixed(2)),
        breadth: Number(breadth.toFixed(1)),
        advanceCount: advances,
        declineCount: declines,
        avgRfac: Number(avgRfac.toFixed(2)),
        stockCount: sector.stocks.length,
        loadedCount: count,
        coveragePct: sector.stocks.length > 0 ? Math.round((count / sector.stocks.length) * 100) : 0,
        momentumLift: Number(momentumLift.toFixed(2)),
        convictionScore: Number((convictionScore * 100).toFixed(0)),
        participationScore: Number((participationScore * 100).toFixed(0)),
        dominanceScore: Number((leaderDominance * 100).toFixed(0)),
        consistencyScore: Number((consistencyScore * 100).toFixed(0)),
        tradeSetup,
        leader: topStock,
        laggard: laggardStock,
      };
    }).sort((a, b) => a.displayChange - b.displayChange);
  }, [liveData, sectorIndexData]);

  // Summary stats
  const gainingSectors = sectoralFlowData.filter(s => s.displayChange > 0).length;
  const losingSectors = sectoralFlowData.filter(s => s.displayChange < 0).length;
  const topSector = sectoralFlowData[sectoralFlowData.length - 1];
  const bottomSector = sectoralFlowData[0];
  const positiveBreadthSectors = sectoralFlowData.filter((s) => s.breadth > 0).length;
  const totalTrackedSymbols = useMemo(() => new Set(SECTOR_DEFINITIONS.flatMap((sector) => sector.stocks)).size, []);
  const loadedSymbols = Object.keys(liveData).length;
  const coveragePct = totalTrackedSymbols > 0 ? Math.round((loadedSymbols / totalTrackedSymbols) * 100) : 0;
  const bestTradeSetup = useMemo(() => {
    return [...sectoralFlowData].sort(
      (a, b) => b.convictionScore * Math.abs(b.value) - a.convictionScore * Math.abs(a.value)
    )[0];
  }, [sectoralFlowData]);
  const sectorMomentumLeaders = useMemo(() => {
    return [...sectoralFlowData].sort((a, b) => b.value - a.value);
  }, [sectoralFlowData]);
  const chartDomain = useMemo(() => {
    const values = sectorMomentumLeaders.map((item) => item.value);
    const maxValue = Math.max(...values, 0.8);
    const minValue = Math.min(...values, 0);
    const upperPad = Math.max(0.45, Number((maxValue * 0.16).toFixed(2)));
    const lowerPad = Math.max(0.28, Number((Math.abs(minValue) * 0.45).toFixed(2)));
    return [Number((minValue - lowerPad).toFixed(2)), Number((maxValue + upperPad).toFixed(2))];
  }, [sectorMomentumLeaders]);
  const handleTabChange = (tabId: string) => {
    navigate('/app', { state: { activeTab: tabId } });
  };

  // Custom bar chart tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const isPositive = data.displayChange >= 0;
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,15,24,0.98) 0%, rgba(19,27,38,0.98) 100%)',
        border: `1px solid ${isPositive ? 'rgba(52, 211, 153, 0.28)' : 'rgba(248, 113, 113, 0.28)'}`,
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: `0 10px 28px ${isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
        minWidth: '132px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '5px', textTransform: 'uppercase' as const }}>
          NIFTY {data.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ 
            color: isPositive ? '#4ade80' : '#f87171', 
            fontSize: '18px', 
            fontWeight: 900 
          }}>
            {isPositive ? '+' : ''}{data.displayChange}%
          </span>
          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 700 }}>
            {data.indexPrice ? `${data.indexPrice}` : `${data.loadedCount}/${data.stockCount}`}
          </span>
        </div>
        <div style={{ color: '#64748b', fontSize: '9px', marginTop: '5px', lineHeight: 1.4 }}>
          Momentum {data.value >= 0 ? '+' : ''}{data.value}% | Breadth {data.breadth >= 0 ? '+' : ''}{data.breadth}%
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '7px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '9px', color: '#dbeafe', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.16)', padding: '2px 6px', borderRadius: '999px' }}>
            Conv {data.convictionScore}%
          </span>
          <span style={{ fontSize: '9px', color: isPositive ? '#bbf7d0' : '#fecaca', background: isPositive ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${isPositive ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.16)'}`, padding: '2px 6px', borderRadius: '999px' }}>
            {data.tradeSetup}
          </span>
        </div>
      </div>
    );
  };

  const filteredSectors = useMemo(() => {
    if (sectorFilter === 'bullish') {
      return SECTOR_DEFINITIONS.filter(sec => {
        const sData = sectoralFlowData.find(s => s.name === sec.title);
        return (sData?.displayChange ?? 0) > 0;
      });
    }
    if (sectorFilter === 'bearish') {
      return SECTOR_DEFINITIONS.filter(sec => {
        const sData = sectoralFlowData.find(s => s.name === sec.title);
        return (sData?.displayChange ?? 0) < 0;
      });
    }
    if (sectorFilter === 'conviction') {
      return [...SECTOR_DEFINITIONS].sort((a, b) => {
        const sA = sectoralFlowData.find(s => s.name === a.title);
        const sB = sectoralFlowData.find(s => s.name === b.title);
        return (sB?.convictionScore ?? 0) - (sA?.convictionScore ?? 0);
      });
    }
    return SECTOR_DEFINITIONS;
  }, [sectorFilter, sectoralFlowData]);

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={handleTabChange} portfolioCount={0} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#080c14]">
          <div className="w-full max-w-[1700px] mx-auto space-y-6">
            
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
                        <h2 className="text-2xl font-bold tracking-tight text-white">Sectoral Flow</h2>
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
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="rounded-full border border-slate-700/60 bg-[#0f1520] px-2.5 py-1">
                            Coverage {loadedSymbols}/{totalTrackedSymbols}
                          </span>
                          <span className="rounded-full border border-slate-700/60 bg-[#0f1520] px-2.5 py-1">
                            Last update {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : '--'}
                          </span>
                          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-indigo-200">
                            Composite momentum ranking
                          </span>
                          {error && (
                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-red-300">
                              {error}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CHART / HEATMAP Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRefreshKey((prev) => prev + 1)}
                      disabled={refreshing}
                      className="flex items-center gap-2 rounded-xl border border-slate-700/40 bg-[#131b26] px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-slate-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                      REFRESH
                    </button>
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
                </div>

                {/* ─── Summary KPI Cards (Clean Solid Fintech Style) ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-[#0c1017] rounded-xl p-4 border border-slate-800/90">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Top Leader</p>
                    <p className="text-xl font-black text-white">{topSector?.name || '-'}</p>
                    <p className="text-xs text-emerald-400 font-bold mt-1 font-mono">
                      {topSector ? formatSignedPct(topSector.displayChange) : '-'}
                    </p>
                  </div>
                  <div className="bg-[#0c1017] rounded-xl p-4 border border-slate-800/90">
                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">Top Laggard</p>
                    <p className="text-xl font-black text-white">{bottomSector?.name || '-'}</p>
                    <p className="text-xs text-rose-400 font-bold mt-1 font-mono">
                      {bottomSector ? formatSignedPct(bottomSector.displayChange) : '-'}
                    </p>
                  </div>
                  <div className="bg-[#0c1017] rounded-xl p-4 border border-slate-800/90">
                    <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-1">Live Coverage</p>
                    <p className="text-2xl font-black text-sky-300 font-mono">{coveragePct}%</p>
                    <p className="text-[10px] text-slate-400 mt-1">{loadedSymbols} symbols loaded</p>
                  </div>
                  <div className="bg-[#0c1017] rounded-xl p-4 border border-slate-800/90">
                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">Market Breadth</p>
                    <p className="text-2xl font-black text-violet-300 font-mono">{positiveBreadthSectors} / 12</p>
                    <p className="text-[10px] text-slate-400 mt-1">sectors advancing</p>
                  </div>
                  <div className="bg-[#0c1017] rounded-xl p-4 border border-slate-800/90 col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Best Setup</p>
                    <p className="text-lg font-black text-amber-300 truncate">{bestTradeSetup?.name || '-'}</p>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">{bestTradeSetup?.tradeSetup || '-'}</p>
                  </div>
                </div>

                {loadedSymbols > 0 && coveragePct < 100 && (
                  <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    <p className="whitespace-nowrap">
                      Sector flow is currently computed using partial live data. Loaded coverage is {loadedSymbols}/{totalTrackedSymbols}, so rankings may still shift.
                    </p>
                  </div>
                )}

                {/* ─── Main View: CHART or HEATMAP ─── */}
                {activeView === 'chart' ? (
                  /* ════════════ CHART VIEW ════════════ */
                  <div className="bg-[#0c1017] border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101520]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                        <h3 className="text-xs font-black text-slate-200 uppercase tracking-[0.15em]">Sector Momentum (Live)</h3>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Conviction-adjusted score using move, breadth, impulse and participation</span>
                    </div>
                    <div className="p-5 h-[520px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorMomentumLeaders} margin={{ top: 28, right: 16, left: -14, bottom: 42 }} barCategoryGap="20%">
                          <defs>
                            <linearGradient id="neonGreenBar" x1="0" y1="1" x2="0" y2="0">
                              <stop offset="0%" stopColor="#004d40" stopOpacity={1} />
                              <stop offset="50%" stopColor="#00c853" stopOpacity={1} />
                              <stop offset="100%" stopColor="#00e676" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="neonRedBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff1744" stopOpacity={1} />
                              <stop offset="50%" stopColor="#d50000" stopOpacity={1} />
                              <stop offset="100%" stopColor="#3e0007" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                          <XAxis
                            dataKey="name"
                            type="category"
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                            tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 800 }}
                            angle={-35}
                            textAnchor="end"
                            tickMargin={8}
                            height={48}
                          />
                          <YAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                            domain={chartDomain}
                            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={34} minPointSize={4}>
                            <LabelList
                              dataKey="value"
                              position="top"
                              formatter={(val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                              fill="#f1f5f9"
                              fontSize={11}
                              fontWeight={800}
                              offset={8}
                            />
                            {sectorMomentumLeaders.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.value >= 0 ? 'url(#neonGreenBar)' : 'url(#neonRedBar)'}
                                onClick={() => scrollToSector(entry.name)}
                                style={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  /* ════════════ INSTITUTIONAL HEATMAP VIEW (12 SECTORS MATRIX) ════════════ */
                  <div className="bg-[#0c1017] border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101520] gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <h3 className="text-xs font-black text-slate-200 uppercase tracking-[0.15em]">Institutional Sector Heatmap (12 Sectors)</h3>
                      </div>
                      {/* Color Scale Legend */}
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span>-2%</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-4 h-2.5 rounded-sm bg-[#991b1b]" title="Deep Bearish" />
                          <div className="w-4 h-2.5 rounded-sm bg-[#e11d48]" title="Bearish" />
                          <div className="w-4 h-2.5 rounded-sm bg-[#334155]" title="Neutral" />
                          <div className="w-4 h-2.5 rounded-sm bg-[#059669]" title="Bullish" />
                          <div className="w-4 h-2.5 rounded-sm bg-[#00e676]" title="Strong Bullish" />
                        </div>
                        <span>+2%</span>
                      </div>
                    </div>

                    <div className="p-5 bg-[#080c14]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {[...sectoralFlowData].reverse().map((s) => {
                          const isPos = s.displayChange >= 0;
                          const total = s.stockCount || 1;
                          const advPct = (s.advanceCount / total) * 100;
                          const decPct = (s.declineCount / total) * 100;
                          
                          // Tone down background to clean dark fintech tones with colored accent borders
                          let cardBg = 'bg-[#0e1420] border-slate-800';
                          let changeColor = 'text-slate-300';
                          let changeBadge = 'bg-slate-800/60 text-slate-300 border-slate-700';

                          if (s.displayChange >= 1.0) {
                            cardBg = 'bg-gradient-to-br from-[#062419] to-[#0a151b] border-emerald-500/40 hover:border-emerald-400';
                            changeColor = 'text-[#00e676]';
                            changeBadge = 'bg-emerald-500/15 text-[#00e676] border-emerald-500/30';
                          } else if (s.displayChange > 0) {
                            cardBg = 'bg-gradient-to-br from-[#081a14] to-[#0a151b] border-emerald-600/30 hover:border-emerald-400';
                            changeColor = 'text-emerald-400';
                            changeBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          } else if (s.displayChange <= -1.0) {
                            cardBg = 'bg-gradient-to-br from-[#29080e] to-[#120a10] border-rose-500/40 hover:border-rose-400';
                            changeColor = 'text-[#ff1744]';
                            changeBadge = 'bg-rose-500/15 text-[#ff1744] border-rose-500/30';
                          } else {
                            cardBg = 'bg-gradient-to-br from-[#1a0a0f] to-[#120a10] border-rose-600/30 hover:border-rose-400';
                            changeColor = 'text-rose-400';
                            changeBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                          }

                          return (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => scrollToSector(s.name)}
                              className={`relative rounded-xl p-4 flex flex-col text-left transition-all duration-200 border group ${cardBg} hover:-translate-y-0.5 hover:shadow-lg`}
                            >
                              {/* Header Row */}
                              <div className="flex items-center justify-between w-full mb-2">
                                <span className="text-white font-extrabold text-sm tracking-wider uppercase group-hover:text-sky-300 transition-colors">
                                  {s.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 bg-black/40 border border-white/5 px-2 py-0.5 rounded">
                                  {s.loadedCount}/{s.stockCount} Stocks
                                </span>
                              </div>

                              {/* Main Change & Setup */}
                              <div className="flex items-baseline justify-between w-full my-1.5">
                                <div className={`text-2xl font-black font-mono tracking-tight ${changeColor}`}>
                                  {formatSignedPct(s.displayChange)}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${changeBadge}`}>
                                  {s.tradeSetup}
                                </span>
                              </div>

                              {/* Advance / Decline Progress Bar */}
                              <div className="w-full mt-2.5 mb-1.5 space-y-1">
                                <div className="w-full h-1.5 rounded-full flex overflow-hidden bg-slate-900">
                                  <div className="h-full bg-[#00e676] transition-all duration-300" style={{ width: `${advPct}%` }} />
                                  <div className="h-full bg-[#ff1744] transition-all duration-300" style={{ width: `${decPct}%` }} />
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                  <span className="text-emerald-400">{s.advanceCount} Up</span>
                                  <span>Br {s.breadth >= 0 ? '+' : ''}{s.breadth.toFixed(0)}%</span>
                                  <span className="text-rose-400">{s.declineCount} Down</span>
                                </div>
                              </div>

                              {/* Leader Stock pill */}
                              {s.leader && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] w-full text-slate-400">
                                  <span className="truncate">Leader: <strong className="text-slate-200">{s.leader.symbol}</strong></span>
                                  <span className={s.leader.change >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {formatSignedPct(s.leader.change)}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Sector Breakdown ─── */}
                <div className="mt-8 pb-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-10 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-md">Sector Breakdown</h2>
                        <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">Live Component Prices • Click stock to open chart</p>
                      </div>
                    </div>

                    {/* Sector Filters for high productivity */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#111827] border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSectorFilter('all')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                          sectorFilter === 'all'
                            ? 'bg-blue-600/30 text-sky-300 border border-sky-400/40 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All (12)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorFilter('bullish')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                          sectorFilter === 'bullish'
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(0,230,118,0.25)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🚀 Bullish Leaders
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorFilter('bearish')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                          sectorFilter === 'bearish'
                            ? 'bg-rose-600/30 text-rose-300 border border-rose-400/40 shadow-[0_0_10px_rgba(255,23,68,0.25)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔻 Bearish Laggards
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorFilter('conviction')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                          sectorFilter === 'conviction'
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚡ High Conviction
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {filteredSectors.map((sector) => {
                      const sectorData = sectoralFlowData.find(s => s.name === sector.title);
                      const sectorChange = sectorData?.displayChange ?? 0;
                      const equalWeightChange = sectorData?.equalWeightValue ?? 0;
                      const isPositiveSector = sectorChange >= 0;
                      
                      let advances = 0;
                      let declines = 0;
                      let totalTracked = 0;
                      sector.stocks.forEach(sym => {
                        const stock = liveData[sym];
                        if (stock && stock.price > 0) {
                          totalTracked++;
                          if (stock.change >= 0) advances++;
                          else declines++;
                        }
                      });
                      
                      const advancePct = totalTracked > 0 ? (advances / totalTracked) * 100 : 0;
                      const declinePct = totalTracked > 0 ? (declines / totalTracked) * 100 : 0;
                      
                      return (
                        <div 
                          key={sector.title} 
                          ref={el => (sectorRefs.current[sector.title] = el)}
                          className={`relative group bg-[#0c1017] border rounded-2xl overflow-hidden scroll-mt-24 transition-all ${
                            highlightedSector === sector.title 
                              ? 'border-indigo-500 ring-2 ring-indigo-500/40' 
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Sector Header */}
                          <div className="relative flex flex-col p-4.5 border-b border-slate-800 bg-[#101520]">
                            <div className="flex justify-between items-start w-full">
                              <div>
                                <h3 className="font-extrabold text-sm text-white tracking-wider flex items-center gap-2">
                                  {sector.ext || sector.title}
                                  <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                                  </span>
                                </h3>
                                <div className={`text-base font-black mt-1 flex items-center gap-1.5 ${isPositiveSector ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isPositiveSector ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                  {isPositiveSector ? '+' : ''}{sectorChange.toFixed(2)}%
                                </div>
                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
                                  <span className="rounded-md border border-slate-800 bg-[#090d14] px-2 py-0.5 text-slate-300">
                                    Equal Avg {equalWeightChange >= 0 ? '+' : ''}{equalWeightChange.toFixed(2)}%
                                  </span>
                                  <span className="rounded-md border border-slate-800 bg-[#090d14] px-2 py-0.5 text-slate-300">
                                    Breadth {(sectorData?.breadth ?? 0) >= 0 ? '+' : ''}{(sectorData?.breadth ?? 0).toFixed(1)}%
                                  </span>
                                  <span className="rounded-md border border-slate-800 bg-[#090d14] px-2 py-0.5 text-slate-300">
                                    Conviction {(sectorData?.convictionScore ?? 0).toFixed(0)}%
                                  </span>
                                  <span className={`rounded-md border px-2 py-0.5 ${isPositiveSector ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
                                    {sectorData?.tradeSetup ?? 'Mixed'}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-[#090d14] border border-slate-800 px-2.5 py-1 rounded-md tracking-wider uppercase">
                                {totalTracked} ASSETS
                              </span>
                            </div>
                            
                            {/* Breadth Progress Bar */}
                            <div className="w-full mt-4 space-y-1.5">
                              <div className="w-full h-2 rounded-full flex overflow-hidden bg-slate-900">
                                <div className="h-full bg-[#00e676] transition-all duration-500" style={{ width: `${advancePct}%` }} />
                                <div className="h-full bg-[#ff1744] transition-all duration-500" style={{ width: `${declinePct}%` }} />
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-emerald-400 flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                                  {advances} stocks ({advancePct.toFixed(1)}% Up)
                                </span>
                                <span className="text-rose-400 flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-[#ff1744]" />
                                  {declines} stocks ({declinePct.toFixed(1)}% Down)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 px-5 pt-4">
                            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Leader</p>
                              <p className="mt-1 text-sm font-black text-white">{sectorData?.leader?.symbol || '--'}</p>
                              <p className="text-xs text-emerald-300">
                                {formatSignedPct(sectorData?.leader?.change)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-red-500/15 bg-red-500/8 px-3 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-300">Laggard</p>
                              <p className="mt-1 text-sm font-black text-white">{sectorData?.laggard?.symbol || '--'}</p>
                              <p className="text-xs text-red-300">
                                {formatSignedPct(sectorData?.laggard?.change)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/8 px-3 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">Setup</p>
                              <p className="mt-1 text-sm font-black text-white">{sectorData?.tradeSetup || 'Mixed'}</p>
                              <p className="text-xs text-indigo-300">
                                Conviction {(sectorData?.convictionScore ?? 0).toFixed(0)}%
                              </p>
                            </div>
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
                                        <StockLogo symbol={stockSym} className="w-8 h-8 group-hover/row:ring-white/30 transition-all" />
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
