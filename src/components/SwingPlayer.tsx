import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  Search, 
  RefreshCw, 
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
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown
} from 'lucide-react';
import { fetchHistoricalOHLCV } from '../utils/priceApi';
import { analyzeSwing, SWING_SETUP_LABEL, SWING_BACKTEST, MAX_HOLD_DAYS, type SwingSetup, type DailyBar } from '../utils/swingScan';
import StockLogo from './StockLogo';

export interface SwingData {
  symbol: string;
  price: number;
  change: number;
  isBull: boolean;
  tradeType: 'BUY';
  setupCategory: SwingSetup;
  setupTitle: string;
  /** 3-month return minus Nifty's 3-month return, in % points */
  rs3m: number;
  barDate: string;
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
  TMPV: 'AUTO',
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
  ETERNAL: 'CONSUMER TECH',

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
  'ADANIENT', 'TMPV', 'NTPC', 'AXISBANK', 'ONGC',
  'TITAN', 'KOTAKBANK', 'POWERGRID', 'ULTRACEMCO', 'M&M',
  'COALINDIA', 'BAJAJFINSV', 'ASIANPAINT', 'JSWSTEEL', 'WIPRO',
  'LODHA', 'ETERNAL', 'TRENT', 'BEL', 'HAL',
  'POLYCAB', 'DIXON', 'PERSISTENT', 'COFORGE', 'DLF'
];

const SwingPlayer: React.FC = () => {
  const [marketData, setMarketData] = useState<SwingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'SETUPS' | 'ALL' | 'WATCHLIST' | 'BREAKOUT' | 'PB50' | 'TARGET_HIT'
  >('SETUPS');
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
  const [sortField, setSortField] = useState<'default' | 'sectorRank' | 'symbol' | 'price' | 'change' | 'rs3m' | 'vol'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'sectorRank' | 'symbol' | 'price' | 'change' | 'rs3m' | 'vol') => {
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

  const [niftyRegime, setNiftyRegime] = useState<{ above200: boolean; pct: number } | null>(null);
  const [lastBarDate, setLastBarDate] = useState<string>('');
  const [missing, setMissing] = useState<string[]>([]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    const toBars = (rows: Awaited<ReturnType<typeof fetchHistoricalOHLCV>>): DailyBar[] =>
      rows.map(r => ({ timestamp: r.timestamp, open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume }));

    try {
      // 1 year of real daily bars per stock (the last bar is today's, still forming while NSE is open)
      const symbols = ['^NSEI', ...SWING_WATCHLIST_SYMBOLS];
      const barsBySymbol: Record<string, DailyBar[]> = {};
      for (let k = 0; k < symbols.length; k += 8) {
        const chunk = symbols.slice(k, k + 8);
        const rows = await Promise.all(chunk.map(sym =>
          fetchHistoricalOHLCV(sym.startsWith('^') ? sym : `${sym}.NS`, { range: '2y', interval: '1d' }).catch(() => [])
        ));
        chunk.forEach((sym, j) => { barsBySymbol[sym] = toBars(rows[j]); });
      }

      const nifty = barsBySymbol['^NSEI'] ?? [];
      const niftyA = nifty.length > 200 ? analyzeSwing(nifty) : null;
      setNiftyRegime(niftyA ? { above200: niftyA.price > niftyA.sma200, pct: (niftyA.price / niftyA.sma200 - 1) * 100 } : null);

      const analyses: Record<string, NonNullable<ReturnType<typeof analyzeSwing>>> = {};
      const failed: string[] = [];
      for (const sym of SWING_WATCHLIST_SYMBOLS) {
        const a = analyzeSwing(barsBySymbol[sym] ?? []);
        if (a) analyses[sym] = a; else failed.push(sym);
      }
      setMissing(failed);
      setLastBarDate(Object.values(analyses)[0]?.barDate ?? '');

      // Sector rank by the average 1-month return of its stocks in this list
      const sectorStats: Record<string, { total: number; count: number }> = {};
      for (const [sym, a] of Object.entries(analyses)) {
        const sector = STOCK_SECTOR_MAP[sym] || 'DIVERSIFIED';
        sectorStats[sector] ??= { total: 0, count: 0 };
        sectorStats[sector].total += a.return1m;
        sectorStats[sector].count += 1;
      }
      const sectorRankMap: Record<string, { rank: number; avgChange: number; trend: 'UP' | 'DOWN' }> = {};
      Object.entries(sectorStats)
        .map(([sector, st]) => ({ sector, avg: st.total / st.count }))
        .sort((x, y) => y.avg - x.avg)
        .forEach((sec, idx) => {
          sectorRankMap[sec.sector] = { rank: idx + 1, avgChange: Number(sec.avg.toFixed(2)), trend: sec.avg >= 0 ? 'UP' : 'DOWN' };
        });

      const candidates: SwingData[] = Object.entries(analyses).map(([sym, a]) => {
        const sector = STOCK_SECTOR_MAP[sym] || 'DIVERSIFIED';
        const sInfo = sectorRankMap[sector];
        return {
          symbol: sym,
          price: a.price,
          change: Number(a.change.toFixed(2)),
          isBull: true,
          tradeType: 'BUY',
          setupCategory: a.setup,
          setupTitle: SWING_SETUP_LABEL[a.setup],
          rs3m: Number((a.return3m - (niftyA?.return3m ?? 0)).toFixed(1)),
          barDate: a.barDate,
          volMultiplier: Number(a.volRatio.toFixed(1)),
          entryPrice: Number(a.entry.toFixed(2)),
          stopLoss: Number(a.stopLoss.toFixed(2)),
          target1: Number(a.target1.toFixed(2)),
          target2: Number(a.target2.toFixed(2)),
          riskReward: '1:2 / 1:3',
          expectedHolding: `Max ${MAX_HOLD_DAYS} days`,
          holdingDaysHorizon: MAX_HOLD_DAYS,
          strategyRationale: a.reason,
          sector,
          sectorRank: sInfo.rank,
          sectorChange: sInfo.avgChange,
          sectorTrend: sInfo.trend,
          tradeReason: a.reason,
        };
      });

      // Setups first (50D > 20D breakout > pullback), then by strength vs Nifty
      const order: Record<SwingSetup, number> = { BO50: 0, BO20: 1, PB50: 2, NONE: 3 };
      candidates.sort((x, y) => order[x.setupCategory] - order[y.setupCategory] || y.rs3m - x.rs3m);
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
    return marketData.filter(item => {
      if (activeCategoryFilter === 'SETUPS' && item.setupCategory === 'NONE') return false;
      if (activeCategoryFilter === 'WATCHLIST' && !savedWatchlist.includes(item.symbol)) return false;
      if (activeCategoryFilter === 'BREAKOUT' && item.setupCategory !== 'BO20' && item.setupCategory !== 'BO50') return false;
      if (activeCategoryFilter === 'PB50' && item.setupCategory !== 'PB50') return false;
      if (activeCategoryFilter === 'TARGET_HIT') {
        const m = getSwingMetrics(item);
        if (m.status !== 'TARGET_1_HIT' && m.status !== 'TARGET_2_HIT') return false;
      }

      if (highConvictionOnly && item.rs3m <= 0) return false;
      if (highVolumeOnly && item.volMultiplier < 1.5) return false;

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
      else if (sortField === 'rs3m') cmp = a.rs3m - b.rs3m;
      else if (sortField === 'vol') cmp = a.volMultiplier - b.volMultiplier;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredSetups, sortField, sortOrder]);

  // Statistics Counts
  const bo10Count = useMemo(() => marketData.filter(d => d.setupCategory === 'BO20' || d.setupCategory === 'BO50').length, [marketData]);
  const bo50Count = useMemo(() => marketData.filter(d => d.setupCategory === 'PB50').length, [marketData]);
  const setupCount = bo10Count + bo50Count;
  const highConvictionCount = useMemo(() => marketData.filter(d => d.rs3m > 0).length, [marketData]);
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
    
    const text = `SWING WATCH: ${selectedStock.symbol} — ${selectedStock.setupTitle} (Delivery CNC, bar ${selectedStock.barDate})
• ${selectedStock.tradeReason}
• Holding: ${selectedStock.expectedHolding}
• Entry: ₹${selectedStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)} (${riskPct}% Risk)
• Target 1: ₹${selectedStock.target1.toFixed(2)} (+${t1Pct}% Book 50%)
• Target 2: ₹${selectedStock.target2.toFixed(2)} (+${t2Pct}% Trail SL)
• Risk:Reward: ${selectedStock.riskReward}
• RS 3M vs Nifty: ${selectedStock.rs3m >= 0 ? '+' : ''}${selectedStock.rs3m}% | Vol: ${selectedStock.volMultiplier}x 20D avg
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
              Delivery (CNC) swing scanner on real daily bars: 20/50-day breakouts with volume, 50-EMA pullbacks in uptrends. Levels: stop 2×ATR, targets 2R / 3R.
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Stop 2×ATR(14)
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                20/50-Day Breakouts (1.5× vol)
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
              <div className="text-[9px] text-slate-500 font-medium">{lastBarDate ? `Bar ${lastBarDate}` : 'Large caps'}</div>
            </div>

            {/* 2. Swing Buys */}
            <div className="bg-[#101520] border border-emerald-500/20 rounded-xl px-3.5 py-2 min-w-[105px]">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Setups Today</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{setupCount} of {marketData.length}</div>
              <div className="text-[9px] text-slate-400 font-medium">{highConvictionCount} beat Nifty (3M)</div>
            </div>

            {/* 3. Breakout Setups */}
            <div className="bg-[#101520] border border-sky-500/20 rounded-xl px-3.5 py-2 min-w-[105px]">
              <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Breakout / Pullback</div>
              <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">{bo10Count} / {bo50Count}</div>
              <div className="text-[9px] text-slate-400 font-medium">20-50D / 50-EMA</div>
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

      {/* ── 1b. Honest evidence strip: market regime + 5-year backtest of these exact rules ── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Market Regime</div>
          {niftyRegime ? (
            <>
              <div className={`text-sm font-bold mt-1 ${niftyRegime.above200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Nifty {niftyRegime.above200 ? 'above' : 'below'} 200-DMA ({niftyRegime.pct >= 0 ? '+' : ''}{niftyRegime.pct.toFixed(1)}%)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {niftyRegime.above200
                  ? 'Uptrend backdrop. Long swing setups have the wind behind them.'
                  : 'Downtrend backdrop. Long swings fail more often; keep size small or wait.'}
              </p>
            </>
          ) : (
            <div className="text-xs text-slate-500 mt-1">Nifty data unavailable</div>
          )}
          {missing.length > 0 && (
            <p className="text-[10px] text-amber-400/80 mt-2">No data: {missing.join(', ')}</p>
          )}
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Backtest of these rules · {SWING_BACKTEST.period} · net of 0.25% cost
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-mono text-[11px]">
            {[...SWING_BACKTEST.rows.map(r => ({ label: SWING_SETUP_LABEL[r.setup], ...r })), { label: 'Random entry', ...SWING_BACKTEST.random }].map(r => (
              <div key={r.label} className="bg-[#101520] border border-slate-800 rounded-lg px-2.5 py-1.5">
                <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">{r.label}</div>
                <div className={`font-bold ${r.avg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.avg >= 0 ? '+' : ''}{r.avg.toFixed(2)}%/trade</div>
                <div className="text-[9px] text-slate-500">win {r.win}% · {r.trades} trades</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            None of the setups clearly beats a random entry with the same stop and target, so treat this page as a watch list, not buy calls.
            The random baseline is also flattered because the 40 stocks are today&apos;s winners.
          </p>
        </div>
      </div>

      {/* ── 2. Interactive Filter Bar & Search ───────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'SETUPS', label: `Setups Today (${setupCount})` },
            { id: 'ALL', label: `All Stocks (${marketData.length})` },
            { id: 'WATCHLIST', label: `Tracked Positions (${savedWatchlist.length})` },
            { id: 'BREAKOUT', label: `Breakouts (${bo10Count})` },
            { id: 'PB50', label: `50-EMA Pullback (${bo50Count})` },
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
              <span>Beats Nifty 3M</span>
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
              <span>Vol &ge; 1.5x</span>
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
            Loading 2 years of daily bars for 40 stocks and Nifty, then checking breakouts and 50-EMA pullbacks.
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
              : activeCategoryFilter === 'SETUPS'
                ? 'No stock closed into a breakout or 50-EMA pullback on the latest bar. Waiting is a valid position — see "All Stocks".'
                : 'Click "Rescan" or adjust the filters.'}
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

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
                      stock.setupCategory === 'NONE'
                        ? 'bg-slate-800/60 text-slate-400 border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}>
                      {stock.setupCategory !== 'NONE' && <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" />}
                      <span>{stock.setupTitle}</span>
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
                      RS 3M {stock.rs3m >= 0 ? '+' : ''}{stock.rs3m}%
                    </span>
                  </div>

                  {/* Why Chosen Reason Box */}
                  <div className="my-2 p-2 bg-[#101520] border border-slate-800/90 rounded-lg">
                    <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">What the chart shows</div>
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
                        <div className="text-slate-500 text-[9px] uppercase">Close</div>
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
        /* ── PaperProfit-Style Compact Swing Table ────────────────────────── */
        <div className="bg-[#090d16] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">

          {/* Table header bar */}
          <div className="p-3 px-4 bg-[#0d121e] border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Pro Swing Radar — Delivery CNC
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono text-[10px] border border-slate-700/80">
                {displayedSetups.length} Swing Setups
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-medium border border-emerald-500/20">
                Stop 2×ATR · T1 2R · T2 3R
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans hidden md:block">
              Click headers to sort · Click row to open trade calculator
            </span>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#070a12] border-b border-slate-800/60 text-[9px] font-mono text-slate-500 uppercase tracking-widest select-none">
                  <th className="py-2.5 px-3 min-w-[170px]">Symbol &amp; Setup</th>
                  <th
                    onClick={() => handleSort('sectorRank')}
                    className="py-2.5 px-3 cursor-pointer hover:text-slate-300 transition min-w-[120px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Sector · Rank</span>
                      {sortField === 'sectorRank'
                        ? <span className="text-emerald-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('price')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-300 transition min-w-[80px]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>LTP &amp; Chg%</span>
                      {sortField === 'price'
                        ? <span className="text-emerald-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 min-w-[180px]">What the chart shows</th>
                  <th
                    onClick={() => handleSort('rs3m')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-slate-300 transition min-w-[80px]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>RS 3M · Vol</span>
                      {sortField === 'rs3m'
                        ? <span className="text-emerald-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">Entry · SL · Targets</th>
                  <th className="py-2.5 px-3 text-center min-w-[80px]">Holding</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Swing Signal</th>
                  <th className="py-2.5 px-4 min-w-[150px]">Swing Status</th>
                  <th className="py-2.5 px-4 text-center min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 font-mono">
                {displayedSetups.map((stock, index) => {
                  const metrics = getSwingMetrics(stock);
                  const isWatchlisted = savedWatchlist.includes(stock.symbol);
                  const riskPct = ((Math.abs(stock.stopLoss - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);
                  const t1Pct = (((stock.target1 - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);
                  const t2Pct = (((stock.target2 - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);

                  const swingSignal = stock.setupCategory === 'NONE'
                    ? { label: 'NO SETUP', cls: 'bg-slate-800/80 text-slate-400 border-slate-700/60' }
                    : stock.setupCategory === 'PB50'
                    ? { label: 'PULLBACK', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' }
                    : { label: stock.setupCategory === 'BO50' ? '50D BREAKOUT' : '20D BREAKOUT', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`cursor-pointer group transition-colors duration-100 hover:bg-[#0e1525] relative ${
                        index % 2 === 0 ? 'bg-[#090d16]' : 'bg-[#0b1019]'
                      }`}
                    >
                      {/* Symbol + Setup — circular logo, green left border (all BUY/CNC) */}
                      <td className="py-3 px-3 font-sans relative">
                        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-500" />
                        <div className="flex items-center gap-2.5 pl-1.5">
                          <StockLogo
                            symbol={stock.symbol}
                            className="w-8 h-8 rounded-full shrink-0 border-2 border-slate-700/80 bg-[#101520] ring-1 ring-slate-800/80"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white group-hover:text-emerald-300 transition-colors text-[13px] tracking-tight leading-tight">
                                {stock.symbol}
                              </span>
                              <span className="px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wider border leading-tight bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                BUY · CNC
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                              {stock.setupTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector & Rank */}
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            stock.sectorRank === 1
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : stock.sectorRank === 2
                              ? 'bg-slate-300/15 text-slate-200 border-slate-400/30'
                              : stock.sectorRank === 3
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-[#101520] text-slate-400 border-slate-800'
                          }`}>
                            #{stock.sectorRank}
                          </span>
                          <span className="font-bold text-white text-[11px]">{stock.sector}</span>
                        </div>
                        <div className={`text-[10px] font-bold mt-0.5 flex items-center gap-0.5 ${
                          stock.sectorTrend === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span>{stock.sectorTrend === 'UP' ? '▲' : '▼'}</span>
                          <span>{stock.sectorChange >= 0 ? '+' : ''}{stock.sectorChange.toFixed(1)}%</span>
                        </div>
                      </td>

                      {/* LTP & Change */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-white text-[13px] font-sans">
                          ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className={`inline-flex items-center gap-0.5 text-[11px] font-bold mt-0.5 ${
                          stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                          <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%</span>
                        </div>
                      </td>

                      {/* Why Chosen */}
                      <td className="py-3 px-3 font-sans">
                        <div className="text-[10px] text-slate-300 font-medium leading-snug max-w-[200px] line-clamp-2" title={stock.tradeReason}>
                          {stock.tradeReason}
                        </div>
                      </td>

                      {/* Score · Volume — compact combined pill */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[12px] border ${
                            stock.rs3m > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                          }`}>
                            {stock.rs3m >= 0 ? '+' : ''}{stock.rs3m}%
                          </span>
                          <div className={`text-[10px] font-bold ${
                            stock.volMultiplier >= 2.5 ? 'text-amber-300'
                            : stock.volMultiplier >= 1.5 ? 'text-emerald-400'
                            : 'text-slate-400'
                          }`}>
                            {stock.volMultiplier}x <span className="text-[8px] text-slate-500 font-normal">VOL</span>
                          </div>
                        </div>
                      </td>

                      {/* Entry · SL · T1 · T2 — compact price stack */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-start gap-0.5 text-[10px] font-sans">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 w-5">Ent</span>
                            <span className="font-semibold text-slate-100">₹{stock.entryPrice.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 w-5">SL</span>
                            <span className="font-semibold text-rose-400">₹{stock.stopLoss.toFixed(1)}</span>
                            <span className="text-[8px] text-slate-600">-{riskPct}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 w-5">T1</span>
                            <span className="font-semibold text-emerald-400">₹{stock.target1.toFixed(1)}</span>
                            <span className="text-[8px] text-emerald-600">+{t1Pct}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 w-5">T2</span>
                            <span className="font-semibold text-teal-400">₹{stock.target2.toFixed(1)}</span>
                            <span className="text-[8px] text-teal-600">+{t2Pct}%</span>
                          </div>
                          <div className="text-[8px] text-slate-600 mt-0.5">R:R {stock.riskReward}</div>
                        </div>
                      </td>

                      {/* Holding Period */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-sky-500/10 text-sky-300 border-sky-500/25 whitespace-nowrap">
                            {stock.expectedHolding.split(' ')[0]}
                          </span>
                          <span className="text-[8px] text-slate-500 font-sans">
                            time stop
                          </span>
                          {isWatchlisted && (
                            <span className="text-[8px] text-emerald-400 font-bold font-sans">
                              Held {metrics.daysHeld}d
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Swing Signal — PaperProfit OUTPERFORM/STRONG style */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${swingSignal.cls}`}>
                          {swingSignal.label}
                        </span>
                      </td>

                      {/* Swing Status + Progress Bar */}
                      <td className="py-3 px-4 min-w-[150px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border font-sans ${metrics.statusBg} ${metrics.statusColor}`}>
                              {metrics.statusLabel}
                            </span>
                            <span className="text-[9px] text-slate-500 font-sans">
                              {metrics.target1Progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(4, metrics.target1Progress))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleWatchlist(stock)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer select-none ${
                              isWatchlisted
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title={isWatchlisted ? 'Remove from Tracked' : 'Track Swing'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStock(stock)}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 transition shadow-sm"
                          >
                            <span>Setup</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <a
                            href={`https://in.tradingview.com/chart/?symbol=NSE:${stock.symbol}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition"
                            title="TradingView Chart"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
                        {selectedStock.setupTitle} · CNC
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Close: ₹{selectedStock.price.toFixed(2)} ({selectedStock.barDate}) • {selectedStock.expectedHolding}
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
                      RS 3M: {selectedStock.rs3m >= 0 ? '+' : ''}{selectedStock.rs3m}%
                    </span>
                    <span className="text-[10px] font-mono font-bold text-yellow-300 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                      {selectedStock.volMultiplier}x 20D Vol
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
