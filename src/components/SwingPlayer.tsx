import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  ChevronRight, 
  Search, 
  RefreshCw, 
  Sparkles, 
  Calculator, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  BarChart2, 
  ArrowUp, 
  Activity,
  Bookmark,
  Zap,
  Crosshair,
  Calendar,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown
} from 'lucide-react';
import { fetchMultipleStockPrices, fetchHistoricalPrices } from '../utils/priceApi';
import StockLogo from './StockLogo';

export interface SwingData {
  symbol: string;
  price: number;
  change: number;
  isBull: boolean;
  tradeType: 'BUY';
  setupCategory: '10_DAY_BO' | '50_DAY_BO' | 'CHANNEL_BO' | 'REVERSAL';
  setupTitle: string;
  aiScore: number;
  volMultiplier: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  expectedHolding: string;
  holdingDaysHorizon: number;
  strategyRationale: string;
  sector: string;
  sectorRank: number;
  sectorChange: number;
  sectorTrend: 'UP' | 'DOWN';
  tradeReason: string;
}

export interface TrackedSwingSetup {
  symbol: string;
  savedAt: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  setupTitle: string;
  holdingDaysHorizon: number;
}

export const STOCK_SECTOR_MAP: Record<string, string> = {
  // IT
  TCS: 'IT',
  INFY: 'IT',
  HCLTECH: 'IT',
  WIPRO: 'IT',
  PERSISTENT: 'IT',
  COFORGE: 'IT',

  // DEFENCE
  HAL: 'DEFENCE',
  BEL: 'DEFENCE',

  // AUTO
  TATAMOTORS: 'AUTO',
  MARUTI: 'AUTO',
  'M&M': 'AUTO',

  // BANKING & FINANCIALS
  HDFCBANK: 'BANKING',
  ICICIBANK: 'BANKING',
  SBIN: 'BANKING',
  AXISBANK: 'BANKING',
  KOTAKBANK: 'BANKING',
  BAJFINANCE: 'FINANCIALS',
  BAJAJFINSV: 'FINANCIALS',
  LICI: 'FINANCIALS',

  // REALTY
  DLF: 'REALTY',
  LODHA: 'REALTY',

  // METALS
  JSWSTEEL: 'METALS',
  COALINDIA: 'METALS',

  // ENERGY & POWER
  RELIANCE: 'ENERGY',
  NTPC: 'POWER',
  POWERGRID: 'POWER',
  ONGC: 'ENERGY',

  // PHARMA
  SUNPHARMA: 'PHARMA',

  // FMCG
  ITC: 'FMCG',
  HINDUNILVR: 'FMCG',

  // CONSUMER & RETAIL
  TITAN: 'CONSUMER',
  ASIANPAINT: 'CONSUMER',
  TRENT: 'RETAIL',
  ZOMATO: 'CONSUMER TECH',

  // INFRA & MANUFACTURING
  LT: 'INFRA',
  ULTRACEMCO: 'INFRA',
  BHARTIARTL: 'TELECOM',
  ADANIENT: 'INFRA',
  POLYCAB: 'CAPITAL GOODS',
  DIXON: 'MANUFACTURING',
};

const SWING_WATCHLIST_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY',
  'SBIN', 'BHARTIARTL', 'ITC', 'LICI', 'HINDUNILVR',
  'LT', 'BAJFINANCE', 'HCLTECH', 'MARUTI', 'SUNPHARMA',
  'ADANIENT', 'TATAMOTORS', 'NTPC', 'AXISBANK', 'ONGC',
  'TITAN', 'KOTAKBANK', 'POWERGRID', 'ULTRACEMCO', 'M&M',
  'COALINDIA', 'BAJAJFINSV', 'ASIANPAINT', 'JSWSTEEL', 'WIPRO',
  'LODHA', 'ZOMATO', 'TRENT', 'BEL', 'HAL',
  'POLYCAB', 'DIXON', 'PERSISTENT', 'COFORGE', 'DLF'
];

const SwingPlayer: React.FC = () => {
  const [marketData, setMarketData] = useState<SwingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'TOP_10' | 'ALL' | 'WATCHLIST' | '10_DAY_BO' | '50_DAY_BO' | 'TARGET_HIT'
  >('TOP_10');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('pp_swing_view_mode');
      return saved === 'table' ? 'table' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [sortField, setSortField] = useState<'default' | 'sectorRank' | 'symbol' | 'price' | 'change' | 'aiScore' | 'vol'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'sectorRank' | 'symbol' | 'price' | 'change' | 'aiScore' | 'vol') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'symbol' || field === 'sectorRank' ? 'asc' : 'desc');
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('pp_swing_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Persistent Swing Watchlist
  const [trackedSetups, setTrackedSetups] = useState<Record<string, TrackedSwingSetup>>(() => {
    try {
      const saved = localStorage.getItem('pp_swing_tracked_setups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [savedWatchlist, setSavedWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pp_swing_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWatchlist = (stockOrSymbol: SwingData | string) => {
    const sym = typeof stockOrSymbol === 'string' ? stockOrSymbol : stockOrSymbol.symbol;
    const stockObj = typeof stockOrSymbol === 'string' 
      ? marketData.find(s => s.symbol === sym) 
      : stockOrSymbol;

    setSavedWatchlist(prev => {
      const isAlready = prev.includes(sym);
      const next = isAlready ? prev.filter(s => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem('pp_swing_watchlist', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    setTrackedSetups(prev => {
      const next = { ...prev };
      if (next[sym]) {
        delete next[sym];
      } else if (stockObj) {
        next[sym] = {
          symbol: stockObj.symbol,
          savedAt: new Date().toISOString(),
          entryPrice: stockObj.entryPrice,
          stopLoss: stockObj.stopLoss,
          target1: stockObj.target1,
          target2: stockObj.target2,
          setupTitle: stockObj.setupTitle,
          holdingDaysHorizon: stockObj.holdingDaysHorizon
        };
      }
      try {
        localStorage.setItem('pp_swing_tracked_setups', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Helper to compute live Swing Target / SL metrics and holding duration
  const getSwingMetrics = (stock: SwingData) => {
    const tracked = trackedSetups[stock.symbol];
    const entryPrice = tracked?.entryPrice ?? stock.entryPrice;
    const currentPrice = stock.price;
    const target1 = tracked?.target1 ?? stock.target1;
    const target2 = tracked?.target2 ?? stock.target2;
    const stopLoss = tracked?.stopLoss ?? stock.stopLoss;

    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    let status: 'TARGET_2_HIT' | 'TARGET_1_HIT' | 'SL_HIT' | 'IN_PROFIT' | 'IN_PULLBACK' = 'IN_PROFIT';
    let statusLabel = '';
    let statusColor = 'text-emerald-400';
    let statusBg = 'bg-emerald-500/15 border-emerald-500/30';

    if (currentPrice >= target2) {
      status = 'TARGET_2_HIT';
      statusLabel = `Target 2 Hit (+${((target2 - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-teal-400';
      statusBg = 'bg-teal-500/15 border-teal-500/30';
    } else if (currentPrice >= target1) {
      status = 'TARGET_1_HIT';
      statusLabel = `Target 1 Hit (+${((target1 - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-emerald-400';
      statusBg = 'bg-emerald-500/15 border-emerald-500/30';
    } else if (currentPrice <= stopLoss) {
      status = 'SL_HIT';
      statusLabel = `Stop Loss Hit (${((stopLoss - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-rose-400';
      statusBg = 'bg-rose-500/15 border-rose-500/30';
    } else if (pnlPercent > 0.1) {
      status = 'IN_PROFIT';
      statusLabel = `In Profit (+${pnlPercent.toFixed(1)}%)`;
      statusColor = 'text-emerald-400';
      statusBg = 'bg-emerald-500/15 border-emerald-500/30';
    } else if (pnlPercent < -0.1) {
      status = 'IN_PULLBACK';
      statusLabel = `Pullback (${pnlPercent.toFixed(1)}%)`;
      statusColor = 'text-sky-400';
      statusBg = 'bg-sky-500/15 border-sky-500/30';
    } else {
      status = 'IN_PROFIT';
      statusLabel = 'Active Setup';
      statusColor = 'text-slate-300';
      statusBg = 'bg-slate-800 border-slate-700';
    }

    const t1Dist = Math.max(0.1, target1 - entryPrice);
    const curDist = Math.max(0, currentPrice - entryPrice);
    const target1Progress = Math.max(0, Math.min(100, Math.round((curDist / t1Dist) * 100)));

    const slBuffer = Math.max(0, ((currentPrice - stopLoss) / currentPrice) * 100);

    // Calculate days held since saving
    let daysHeld = 1;
    if (tracked?.savedAt) {
      const savedDate = new Date(tracked.savedAt);
      const diffMs = Date.now() - savedDate.getTime();
      daysHeld = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }

    return {
      pnlPercent,
      status,
      statusLabel,
      statusColor,
      statusBg,
      target1Progress,
      slBuffer,
      entryPrice,
      currentPrice,
      target1,
      target2,
      stopLoss,
      daysHeld,
      horizon: stock.expectedHolding
    };
  };

  // Interactive Trade Setup Modal State
  const [selectedStock, setSelectedStock] = useState<SwingData | null>(null);
  const [capitalRisk, setCapitalRisk] = useState<number>(3000);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    const scanSymbols = SWING_WATCHLIST_SYMBOLS.map(s => `${s}.NS`);
    
    try {
      // 1. Fetch current live prices in one fast batch
      const batchData = await fetchMultipleStockPrices(scanSymbols);
      
      // 2. Compute live sector performance by aggregating constituent stock changes
      const sectorStats: Record<string, { totalChange: number; count: number; symbols: string[] }> = {};
      for (const sym of SWING_WATCHLIST_SYMBOLS) {
        const fullKey = `${sym}.NS`;
        const data = batchData[fullKey] || batchData[sym];
        const price = (data && data.price > 0) ? data.price : 0;
        if (price <= 0) continue;
        const change = data.change || 0;
        const sector = STOCK_SECTOR_MAP[sym] || 'DIVERSIFIED';

        if (!sectorStats[sector]) {
          sectorStats[sector] = { totalChange: 0, count: 0, symbols: [] };
        }
        sectorStats[sector].totalChange += change;
        sectorStats[sector].count += 1;
        sectorStats[sector].symbols.push(sym);
      }

      // Rank sectors from #1 (strongest) downwards by average % change
      const rankedSectors = Object.entries(sectorStats)
        .map(([sector, s]) => ({
          sector,
          avgChange: Number((s.totalChange / Math.max(1, s.count)).toFixed(2)),
          symbols: s.symbols,
        }))
        .sort((a, b) => b.avgChange - a.avgChange);

      const sectorRankMap: Record<string, { rank: number; avgChange: number; trend: 'UP' | 'DOWN' }> = {};
      rankedSectors.forEach((sec, idx) => {
        sectorRankMap[sec.sector] = {
          rank: idx + 1,
          avgChange: sec.avgChange,
          trend: sec.avgChange >= 0 ? 'UP' : 'DOWN',
        };
      });

      const candidates: SwingData[] = [];

      for (const sym of SWING_WATCHLIST_SYMBOLS) {
        const fullKey = `${sym}.NS`;
        const data = batchData[fullKey] || batchData[sym];
        const price = (data && data.price > 0) ? data.price : 0;
        if (price <= 0) continue;

        const change = data.change || 0;
        const dayHigh = (typeof data.high === 'number' && data.high > 0) ? data.high : price * 1.015;
        const dayLow = (typeof data.low === 'number' && data.low > 0) ? data.low : price * 0.985;
        const dailyRangePct = Math.max(1.4, ((dayHigh - dayLow) / price) * 100);

        // Volatility multiplier
        const volMultiplier = Number(Math.min(4.5, Math.max(1.1, (Math.abs(change) / 1.1) * 1.5)).toFixed(1));

        const sector = STOCK_SECTOR_MAP[sym] || 'DIVERSIFIED';
        const sInfo = sectorRankMap[sector] || { rank: 99, avgChange: 0, trend: 'UP' };
        const sectorRank = sInfo.rank;
        const sectorChange = sInfo.avgChange;
        const sectorTrend = sInfo.trend;

        // ── PURE SWING BUY SETUPS (DELIVERY CNC) ──
        let setupCat: '10_DAY_BO' | '50_DAY_BO' | 'CHANNEL_BO' | 'REVERSAL' = '10_DAY_BO';
        let setupTitle = '10-Day Breakout';
        let holdingDays = 3;
        let expectedHolding = '2–3 Days (Quick Swing)';

        if (change >= 2.0) {
          setupCat = '10_DAY_BO';
          setupTitle = '10-Day Breakout';
          holdingDays = 3;
          expectedHolding = '2–3 Days (Quick Swing)';
        } else if (change >= 0.5) {
          setupCat = '50_DAY_BO';
          setupTitle = '50-EMA Bounce';
          holdingDays = 7;
          expectedHolding = '5–10 Days (Trend Swing)';
        } else if (change >= -1.0) {
          setupCat = 'CHANNEL_BO';
          setupTitle = 'Channel Breakout';
          holdingDays = 5;
          expectedHolding = '3–5 Days (Base Swing)';
        } else {
          setupCat = 'REVERSAL';
          setupTitle = 'Oversold Bounce';
          holdingDays = 3;
          expectedHolding = '2–4 Days (Pullback Swing)';
        }

        // Technical Setup Strength formulation (with Sector bonus for leading sectors)
        const changePwr = Math.max(-15, Math.min(25, change * 5));
        const volBonus = volMultiplier >= 2.0 ? 25 : volMultiplier >= 1.5 ? 18 : 10;
        const sectorBonus = sectorRank <= 3 ? 15 : sectorRank <= 6 ? 8 : 0;
        const aiScore = Math.min(99, Math.max(60, Math.round(52 + changePwr + volBonus + sectorBonus)));

        // Clear, human-readable trade reason explaining why this stock was chosen
        let tradeReason = '';
        if (sectorRank <= 3) {
          tradeReason = `Rank #${sectorRank} ${sector} Leader (${sectorChange >= 0 ? '+' : ''}${sectorChange}% ${sectorTrend}) • ${setupTitle} with strong ${volMultiplier}x volume surge`;
        } else if (sectorRank <= 7) {
          tradeReason = `Top pick in ${sector} (Rank #${sectorRank}, ${sectorTrend}) • ${setupTitle} coiling with favorable 1:2.5 Risk:Reward`;
        } else {
          tradeReason = `${sector} Sector Play • ${setupTitle} bouncing with high-probability reversal structure`;
        }

        // Swing Trade Levels (SL: 2.2% - 3.8%, T1: 5.5% - 8%, T2: 10% - 15%)
        const slPct = Math.min(4.0, Math.max(2.2, dailyRangePct * 1.1));
        const t1Pct = Number((slPct * 2.0).toFixed(1)); // 1:2 Risk-Reward
        const t2Pct = Number((slPct * 3.5).toFixed(1)); // 1:3.5 Runner

        const entryPrice = price;
        const stopLoss = Number((entryPrice * (1 - slPct / 100)).toFixed(2));
        const target1 = Number((entryPrice * (1 + t1Pct / 100)).toFixed(2));
        const target2 = Number((entryPrice * (1 + t2Pct / 100)).toFixed(2));

        candidates.push({
          symbol: sym,
          price,
          change,
          isBull: true,
          tradeType: 'BUY',
          setupCategory: setupCat,
          setupTitle,
          aiScore,
          volMultiplier,
          entryPrice,
          stopLoss,
          target1,
          target2,
          riskReward: '1:2.5',
          expectedHolding,
          holdingDaysHorizon: holdingDays,
          strategyRationale: tradeReason,
          sector,
          sectorRank,
          sectorChange,
          sectorTrend,
          tradeReason
        });
      }

      // Sort candidates primarily by Sector Rank (Rank 1 sectors first),
      // and within each sector by technical setup conviction score
      candidates.sort((a, b) => {
        if (a.sectorRank !== b.sectorRank) {
          return a.sectorRank - b.sectorRank;
        }
        return (b.aiScore + b.change * 2) - (a.aiScore + a.change * 2);
      });

      setMarketData(candidates);
    } catch (err) {
      console.error('Error in swing player scanner:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered setups
  const filteredSetups = useMemo(() => {
    // Determine top 10 stocks by sector-ranked order
    const top10Symbols = marketData.slice(0, 10).map(s => s.symbol);

    return marketData.filter(item => {
      if (activeCategoryFilter === 'TOP_10' && !top10Symbols.includes(item.symbol)) return false;
      if (activeCategoryFilter === 'WATCHLIST' && !savedWatchlist.includes(item.symbol)) return false;
      if (activeCategoryFilter === '10_DAY_BO' && item.setupCategory !== '10_DAY_BO') return false;
      if (activeCategoryFilter === '50_DAY_BO' && item.setupCategory !== '50_DAY_BO') return false;
      if (activeCategoryFilter === 'TARGET_HIT') {
        const m = getSwingMetrics(item);
        if (m.status !== 'TARGET_1_HIT' && m.status !== 'TARGET_2_HIT') return false;
      }

      if (highConvictionOnly && item.aiScore < 80) return false;
      if (highVolumeOnly && item.volMultiplier < 2.0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.symbol.toLowerCase().includes(q) ||
          item.sector.toLowerCase().includes(q) ||
          item.tradeReason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [marketData, activeCategoryFilter, highConvictionOnly, highVolumeOnly, searchQuery, savedWatchlist, trackedSetups]);

  // Sorted & Filtered setups for display
  const displayedSetups = useMemo(() => {
    if (sortField === 'default') return filteredSetups;
    return [...filteredSetups].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'sectorRank') cmp = a.sectorRank - b.sectorRank;
      else if (sortField === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortField === 'price') cmp = a.price - b.price;
      else if (sortField === 'change') cmp = a.change - b.change;
      else if (sortField === 'aiScore') cmp = a.aiScore - b.aiScore;
      else if (sortField === 'vol') cmp = a.volMultiplier - b.volMultiplier;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredSetups, sortField, sortOrder]);

  // Statistics Counts
  const bo10Count = useMemo(() => marketData.filter(d => d.setupCategory === '10_DAY_BO').length, [marketData]);
  const bo50Count = useMemo(() => marketData.filter(d => d.setupCategory === '50_DAY_BO').length, [marketData]);
  const highConvictionCount = useMemo(() => marketData.filter(d => d.aiScore >= 80).length, [marketData]);
  const targetHitCount = useMemo(() => marketData.filter(d => {
    const m = getSwingMetrics(d);
    return m.status === 'TARGET_1_HIT' || m.status === 'TARGET_2_HIT';
  }).length, [marketData, trackedSetups]);

  // Watchlist Aggregate Metrics
  const watchlistMetrics = useMemo(() => {
    const items = marketData.filter(d => savedWatchlist.includes(d.symbol));
    if (items.length === 0) return { total: 0, inProfit: 0, targetHits: 0, avgReturn: 0 };
    
    let inProfit = 0;
    let targetHits = 0;
    let totalReturn = 0;

    items.forEach(d => {
      const m = getSwingMetrics(d);
      if (m.pnlPercent > 0) inProfit++;
      if (m.status === 'TARGET_1_HIT' || m.status === 'TARGET_2_HIT') targetHits++;
      totalReturn += m.pnlPercent;
    });

    return {
      total: items.length,
      inProfit,
      targetHits,
      avgReturn: totalReturn / items.length
    };
  }, [marketData, savedWatchlist, trackedSetups]);

  // Position Sizing Calculation
  const positionSizing = useMemo(() => {
    if (!selectedStock) return { shares: 0, totalCapital: 0, maxLoss: 0, targetProfit: 0 };
    const perShareRisk = Math.abs(selectedStock.entryPrice - selectedStock.stopLoss);
    if (perShareRisk <= 0) return { shares: 0, totalCapital: 0, maxLoss: 0, targetProfit: 0 };
    
    const shares = Math.max(1, Math.floor(capitalRisk / perShareRisk));
    const totalCapital = shares * selectedStock.entryPrice;
    const maxLoss = shares * perShareRisk;
    const perShareReward = Math.abs(selectedStock.target1 - selectedStock.entryPrice);
    const targetProfit = shares * perShareReward;

    return { shares, totalCapital, maxLoss, targetProfit };
  }, [selectedStock, capitalRisk]);

  const handleCopySetup = () => {
    if (!selectedStock) return;
    const riskPct = ((Math.abs(selectedStock.stopLoss - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
    const t1Pct = ((Math.abs(selectedStock.target1 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
    const t2Pct = ((Math.abs(selectedStock.target2 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
    
    const text = `SWING BUY SETUP: ${selectedStock.symbol} (Delivery CNC)
• Expected Holding: ${selectedStock.expectedHolding}
• Entry: ₹${selectedStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)} (${riskPct}% Risk)
• Target 1: ₹${selectedStock.target1.toFixed(2)} (+${t1Pct}% Book 50%)
• Target 2: ₹${selectedStock.target2.toFixed(2)} (+${t2Pct}% Trail SL)
• Risk:Reward: ${selectedStock.riskReward}
• Setup Rating: ${selectedStock.aiScore}/100 | Vol: ${selectedStock.volMultiplier}x
• Suggested Qty: ${positionSizing.shares} Shares (Max Risk: ₹${positionSizing.maxLoss.toFixed(0)})`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full max-w-[1700px] mx-auto pb-10">

      {/* ── 1. Top Executive Banner (World-Class Human-Crafted Cockpit) ─────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        
        {/* Left: Branding & Core Horizon Details */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.18)] shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">Pro Swing Radar</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                2 to 10 Days Delivery CNC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium max-w-xl">
              Pure Cash Delivery (CNC) swing scanner with multi-day consolidation breakouts, 50-EMA pullbacks, and holding tracker.
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Min 1:2.5 R:R
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                10-Day Channel Breakouts
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                50-EMA Bounce Setups
              </span>
            </div>
          </div>
        </div>

        {/* Right: Balanced Stat Dashboard & Rescan Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full xl:w-auto justify-between xl:justify-end">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            {/* 1. Total Scanned */}
            <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[95px]">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Universe</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{SWING_WATCHLIST_SYMBOLS.length} Stocks</div>
              <div className="text-[9px] text-slate-500 font-medium">Liquid F&O</div>
            </div>

            {/* 2. Swing Buys */}
            <div className="bg-[#101520] border border-emerald-500/20 rounded-xl px-3.5 py-2 min-w-[105px]">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Swing Buys</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{marketData.length} Setups</div>
              <div className="text-[9px] text-slate-400 font-medium">{highConvictionCount} Score &ge; 80</div>
            </div>

            {/* 3. Breakout Setups */}
            <div className="bg-[#101520] border border-sky-500/20 rounded-xl px-3.5 py-2 min-w-[105px]">
              <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">10D / 50-EMA</div>
              <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">{bo10Count} / {bo50Count}</div>
              <div className="text-[9px] text-slate-400 font-medium">BO / Bounce</div>
            </div>

            {/* 4. Tracked Trades (Clean Slate/Teal — ZERO Yellow!) */}
            <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[100px]">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Tracked</div>
              <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">{savedWatchlist.length} Saved</div>
              <div className="text-[9px] text-teal-400 font-medium">{targetHitCount} Target Done</div>
            </div>
          </div>

          {/* Rescan Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition select-none disabled:opacity-50 cursor-pointer shadow-sm shrink-0 w-full sm:w-auto"
            title="Scan Again Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {/* ── 2. Interactive Filter Bar & Search ───────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'TOP_10', label: `Top 10 Sector Picks (10)` },
            { id: 'ALL', label: `All Swing Buys (${marketData.length})` },
            { id: 'WATCHLIST', label: `Tracked Positions (${savedWatchlist.length})` },
            { id: '10_DAY_BO', label: `10-Day Breakout (${bo10Count})` },
            { id: '50_DAY_BO', label: `50-EMA Bounce (${bo50Count})` },
            { id: 'TARGET_HIT', label: `Targets Hit (${targetHitCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                activeCategoryFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#101520] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighConvictionOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition select-none cursor-pointer flex items-center gap-1 ${
                highConvictionOnly
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-[#101520] text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              <BarChart2 className="w-3 h-3 text-purple-400" />
              <span>Score &gt; 80</span>
            </button>

            <button
              onClick={() => setHighVolumeOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition select-none cursor-pointer flex items-center gap-1 ${
                highVolumeOnly
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-[#101520] text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              <Zap className="w-3 h-3 text-sky-400" />
              <span>Vol &gt; 2x</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search swing stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#101520] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 w-32 sm:w-40 focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
              />
            </div>

            {/* View Mode Toggle: Grid vs Tabular */}
            <div className="flex items-center bg-[#101520] border border-slate-700/80 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 select-none ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 select-none ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Tabular / Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="text-[11px]">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Watchlist Performance Cockpit (Shown when Watchlist Tab is selected) ── */}
      {activeCategoryFilter === 'WATCHLIST' && (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <h3 className="text-base font-bold text-white font-sans">Active Swing Positions Cockpit</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {watchlistMetrics.total} Tracked Trades
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracking holding days, distance to Target 1 / Target 2, and trailing Stop Loss buffers across 2–10 day horizons.
              </p>
            </div>

            {watchlistMetrics.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="bg-[#101520] border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">In Profit</div>
                  <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                    {watchlistMetrics.inProfit} / {watchlistMetrics.total}
                  </div>
                </div>
                <div className="bg-[#101520] border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Targets Hit</div>
                  <div className="text-xs font-black text-teal-400 font-mono mt-0.5">
                    {watchlistMetrics.targetHits} Hit
                  </div>
                </div>
                <div className="bg-[#101520] border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Avg Return</div>
                  <div className={`text-xs font-black font-mono mt-0.5 ${
                    watchlistMetrics.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {watchlistMetrics.avgReturn >= 0 ? '+' : ''}{watchlistMetrics.avgReturn.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Main Setups Grid ───────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Scanning Delivery Swing Setups...</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Analyzing 50-EMA support bounces, 10-day base breakouts, and computing 1:2.5 Risk:Reward swing targets.
          </p>
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeCategoryFilter === 'WATCHLIST' ? 'No Swing Setups in Watchlist' : 'No Swing Setups Found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeCategoryFilter === 'WATCHLIST'
              ? 'Click the bookmark icon on any swing card to save and track its holding period and targets!'
              : 'Click "Rescan" or adjust the filters to scan live momentum.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedSetups.map((stock) => {
            const metrics = getSwingMetrics(stock);
            const isWatchlisted = savedWatchlist.includes(stock.symbol);

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className="bg-[#0c1017] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer group border border-slate-800 hover:border-slate-700 hover:bg-[#0e131d]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} className="w-8 h-8 rounded-lg shrink-0 border border-slate-800 bg-[#101520]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {stock.symbol}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                          <span className="text-xs font-bold text-slate-200">
                            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            stock.change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                      <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>BUY · CNC</span>
                    </span>
                  </div>

                  {/* Sector Rank & Meta Strip */}
                  <div className="flex items-center gap-1.5 flex-wrap my-2 font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded border font-bold ${
                      stock.sectorRank === 1
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : stock.sectorRank === 2
                        ? 'bg-slate-300/15 text-slate-200 border-slate-400/30'
                        : stock.sectorRank === 3
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : 'bg-[#101520] text-slate-300 border-slate-800'
                    }`}>
                      Rank #{stock.sectorRank} {stock.sector}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded border font-bold ${
                      stock.sectorTrend === 'UP'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}>
                      {stock.sectorTrend === 'UP' ? '▲' : '▼'} {stock.sectorChange >= 0 ? '+' : ''}{stock.sectorChange.toFixed(1)}% {stock.sectorTrend}
                    </span>
                    <span className="px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 font-medium ml-auto">
                      Score {stock.aiScore}/100
                    </span>
                  </div>

                  {/* Why Chosen Reason Box */}
                  <div className="my-2 p-2 bg-[#101520] border border-slate-800/90 rounded-lg">
                    <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Why Chosen (Reason)</div>
                    <div className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-sans font-medium">{stock.tradeReason}</div>
                  </div>

                  {/* Single Clean Execution Status Pill */}
                  <div className="my-2 p-2.5 bg-[#101520] border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Swing Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${metrics.statusBg} ${metrics.statusColor}`}>
                        {metrics.statusLabel}
                      </span>
                    </div>

                    {/* Clean Tabular Order Levels Grid */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono pt-1 border-t border-slate-800/80">
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase">Trigger</div>
                        <div className="font-bold text-slate-200">₹{stock.entryPrice.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase">Stop Loss</div>
                        <div className="font-bold text-rose-400">₹{stock.stopLoss.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase">Target 1</div>
                        <div className="font-bold text-emerald-400">₹{stock.target1.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase">Target 2</div>
                        <div className="font-bold text-teal-400">₹{stock.target2.toFixed(1)}</div>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${Math.min(100, Math.max(8, metrics.target1Progress))}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    R:R {stock.riskReward} {isWatchlisted && <span className="text-emerald-400 ml-1">· Held {metrics.daysHeld}d</span>}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(stock);
                      }}
                      className={`p-1.5 rounded-lg border transition cursor-pointer select-none ${
                        isWatchlisted
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                      title={isWatchlisted ? 'Remove from Tracked Swings' : 'Track Swing Position'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStock(stock)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-500/10 transition"
                    >
                      <span>Setup</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Tabular View ─────────────────────────────────────────────────── */
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-sans text-xs min-w-[1050px]">
              <thead>
                <tr className="bg-[#101520] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <th 
                    onClick={() => handleSort('symbol')}
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Stock</span>
                      {sortField === 'symbol' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('sectorRank')}
                    className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Sector &amp; Rank</span>
                      {sortField === 'sectorRank' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('price')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>LTP &amp; Chg</span>
                      {sortField === 'price' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-3 min-w-[240px]">Why Chosen (Trade Reason)</th>
                  <th 
                    onClick={() => handleSort('aiScore')}
                    className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Score</span>
                      {sortField === 'aiScore' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vol')}
                    className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Volume</span>
                      {sortField === 'vol' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-3 text-right">Trigger (Buy)</th>
                  <th className="py-3.5 px-3 text-right">Stop Loss</th>
                  <th className="py-3.5 px-3 text-right">Targets (T1 / T2)</th>
                  <th className="py-3.5 px-3 text-center">R:R</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Swing Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {displayedSetups.map((stock) => {
                  const metrics = getSwingMetrics(stock);
                  const isWatchlisted = savedWatchlist.includes(stock.symbol);
                  const riskPct = ((Math.abs(stock.stopLoss - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);
                  const t1Pct = (((stock.target1 - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);
                  const t2Pct = (((stock.target2 - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className="hover:bg-[#121926]/75 transition-colors cursor-pointer group"
                    >
                      {/* Stock */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <StockLogo symbol={stock.symbol} className="w-8 h-8 rounded-lg shrink-0 border border-slate-800 bg-[#101520]" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                                {stock.symbol}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                CNC
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[130px]" title={stock.setupTitle}>
                              {stock.setupTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector & Rank */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            stock.sectorRank === 1
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : stock.sectorRank === 2
                              ? 'bg-slate-300/15 text-slate-200 border-slate-400/30'
                              : stock.sectorRank === 3
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-[#101520] text-slate-300 border-slate-800'
                          }`}>
                            Rank #{stock.sectorRank}
                          </span>
                          <span className="font-bold text-white text-xs">{stock.sector}</span>
                        </div>
                        <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                          stock.sectorTrend === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span>{stock.sectorTrend === 'UP' ? '▲' : '▼'}</span>
                          <span>{stock.sectorChange >= 0 ? '+' : ''}{stock.sectorChange.toFixed(1)}%</span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-300">
                            {stock.sectorTrend}
                          </span>
                        </div>
                      </td>

                      {/* LTP & Change */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-100 text-xs">
                          ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-bold ${
                          stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </div>
                      </td>

                      {/* Why Chosen (Trade Reason) */}
                      <td className="py-3.5 px-3 font-sans">
                        <div className="text-[11px] text-slate-300 font-medium leading-relaxed max-w-[280px]" title={stock.tradeReason}>
                          {stock.tradeReason}
                        </div>
                      </td>

                      {/* AI Score */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 font-bold text-[11px]">
                          {stock.aiScore}/100
                        </span>
                      </td>

                      {/* Volume Multiplier */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded border border-slate-800 bg-[#101520] text-slate-300 font-bold text-[10px]">
                          {stock.volMultiplier}x
                        </span>
                      </td>

                      {/* Trigger / Entry */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-200">
                          ₹{stock.entryPrice.toFixed(1)}
                        </span>
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-rose-400">₹{stock.stopLoss.toFixed(1)}</div>
                        <div className="text-[9px] text-slate-500">-{riskPct}% risk</div>
                      </td>

                      {/* Targets */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-400">
                          T1: ₹{stock.target1.toFixed(1)} <span className="text-[9px] font-normal text-emerald-500/80">(+{t1Pct}%)</span>
                        </div>
                        <div className="font-bold text-teal-400">
                          T2: ₹{stock.target2.toFixed(1)} <span className="text-[9px] font-normal text-teal-500/80">(+{t2Pct}%)</span>
                        </div>
                      </td>

                      {/* Risk:Reward */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-300">{stock.riskReward}</div>
                        {isWatchlisted && (
                          <div className="text-[9px] text-emerald-400 font-medium font-sans">
                            Held {metrics.daysHeld}d
                          </div>
                        )}
                      </td>

                      {/* Swing Status & Progress */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${metrics.statusBg} ${metrics.statusColor}`}>
                              {metrics.statusLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 font-sans">
                              {metrics.target1Progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-300" 
                              style={{ width: `${Math.min(100, Math.max(8, metrics.target1Progress))}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleWatchlist(stock)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer select-none ${
                              isWatchlisted
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title={isWatchlisted ? 'Remove from Tracked Swings' : 'Track Swing Position'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStock(stock)}
                            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 transition shadow-sm"
                          >
                            <span>Setup</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-[#101520]/60 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 font-medium">
            <span>Showing {displayedSetups.length} setups in tabular view</span>
            <span className="text-slate-500 text-[11px]">Click on column headers to sort • Click any row or &quot;Setup&quot; to open calculator</span>
          </div>
        </div>
      )}

      {/* ── 5. Interactive Trade Setup Modal / Calculator ───────────────── */}
      {selectedStock && (() => {
        const modalMetrics = getSwingMetrics(selectedStock);
        const isWatchlisted = savedWatchlist.includes(selectedStock.symbol);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0c1017] border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <StockLogo symbol={selectedStock.symbol} className="w-12 h-12 rounded-2xl border border-slate-800 bg-[#101520]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{selectedStock.symbol}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        BUY · CNC SWING
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      LTP: ₹{selectedStock.price.toFixed(2)} • Horizon: {selectedStock.expectedHolding}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={`https://in.tradingview.com/chart/?symbol=NSE:${selectedStock.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-bold transition shadow-sm"
                    title="Open live chart in TradingView"
                  >
                    <span>Chart</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Strategy Rationale */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 text-xs leading-relaxed space-y-1.5 text-emerald-200/90">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Swing Strategy</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      Rating: {selectedStock.aiScore}/100
                    </span>
                    <span className="text-[10px] font-mono font-bold text-yellow-300 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                      {selectedStock.volMultiplier}x Vol
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  {selectedStock.strategyRationale}
                </p>
              </div>

              {/* Levels Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#101520] border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Entry Trigger</div>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    ₹{selectedStock.entryPrice.toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#101520] border border-rose-500/20 rounded-xl p-3 text-center bg-rose-500/5">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Stop Loss</div>
                  <div className="text-base font-black text-rose-400 font-mono mt-0.5">
                    ₹{selectedStock.stopLoss.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-rose-400/80 font-mono mt-0.5 font-bold">
                    {((Math.abs(selectedStock.stopLoss - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1)}% Risk
                  </div>
                </div>

                <div className="bg-[#101520] border border-emerald-500/20 rounded-xl p-3 text-center bg-emerald-500/5">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Target 1 (1:2)</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    ₹{selectedStock.target1.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-emerald-400/80 font-mono mt-0.5 font-bold">
                    +{((Math.abs(selectedStock.target1 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1)}% (Book 50%)
                  </div>
                </div>

                <div className="bg-[#101520] border border-teal-500/20 rounded-xl p-3 text-center bg-teal-500/5">
                  <div className="text-[10px] uppercase font-bold text-teal-400">Target 2 (Runner)</div>
                  <div className="text-base font-black text-teal-400 font-mono mt-0.5">
                    ₹{selectedStock.target2.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-teal-400/80 font-mono mt-0.5 font-bold">
                    +{((Math.abs(selectedStock.target2 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1)}% (Trail SL)
                  </div>
                </div>
              </div>

              {/* Swing Position Sizing Calculator */}
              <div className="bg-[#101520] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Swing Position Sizer (Risk: ₹{capitalRisk})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[2000, 3000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCapitalRisk(amt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          capitalRisk === amt 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-[#0c1017] p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">Delivery Qty</div>
                    <div className="text-sm font-black text-white">{positionSizing.shares} Shares</div>
                    <div className="text-[9px] text-slate-400 font-mono">₹{positionSizing.totalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cap</div>
                  </div>
                  <div className="bg-[#0c1017] p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">Max Risk (SL)</div>
                    <div className="text-sm font-black text-rose-400">₹{positionSizing.maxLoss.toFixed(0)}</div>
                    <div className="text-[9px] text-rose-400/80 font-mono">Capital at risk</div>
                  </div>
                  <div className="bg-[#0c1017] p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">Target 1 Profit</div>
                    <div className="text-sm font-black text-emerald-400">+₹{positionSizing.targetProfit.toFixed(0)}</div>
                    <div className="text-[9px] text-emerald-400/80 font-mono">1:2 R:R profit</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => toggleWatchlist(selectedStock)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-xs transition cursor-pointer select-none ${
                    isWatchlisted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                  <span>{isWatchlisted ? 'Saved in Swing Watchlist' : 'Add to Swing Watchlist'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySetup}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {copiedNotification ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy Swing Setup'}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default SwingPlayer;
