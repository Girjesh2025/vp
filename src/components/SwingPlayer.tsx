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
  Bookmark,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ShieldAlert,
  Compass,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { fetchHistoricalOHLCV } from '../utils/priceApi';
import { 
  analyzeSwing, 
  SWING_SETUP_LABEL, 
  MAX_HOLD_DAYS, 
  SWING_BACKTEST, 
  type SwingSetup, 
  type DailyBar 
} from '../utils/swingScan';
import StockLogo from './StockLogo';

export interface SwingData {
  symbol: string;
  price: number;
  change: number;
  isBull: boolean;
  tradeType: 'BUY';
  setupCategory: SwingSetup;
  setupTitle: string;
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
  isAbove200Sma: boolean;
  pctFrom50Ema: number;
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
  CHOLAFIN: 'FINANCIALS',
  JIOFIN: 'FINANCIALS',

  // REALTY
  DLF: 'REALTY',
  LODHA: 'REALTY',

  // METALS
  JSWSTEEL: 'METALS',
  TATASTEEL: 'METALS',
  COALINDIA: 'METALS',
  VEDL: 'METALS',

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
  SIEMENS: 'CAPITAL GOODS',
};

const SWING_WATCHLIST_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY',
  'SBIN', 'BHARTIARTL', 'ITC', 'LICI', 'HINDUNILVR',
  'LT', 'BAJFINANCE', 'HCLTECH', 'MARUTI', 'SUNPHARMA',
  'ADANIENT', 'TATAMOTORS', 'NTPC', 'AXISBANK', 'ONGC',
  'TITAN', 'KOTAKBANK', 'POWERGRID', 'ULTRACEMCO', 'M&M',
  'COALINDIA', 'BAJAJFINSV', 'ASIANPAINT', 'JSWSTEEL', 'TATASTEEL',
  'WIPRO', 'LODHA', 'ZOMATO', 'TRENT', 'BEL',
  'HAL', 'POLYCAB', 'DIXON', 'PERSISTENT', 'COFORGE',
  'DLF', 'JIOFIN', 'VEDL', 'SIEMENS', 'CHOLAFIN'
];

// One hue per setup, used for the card's top edge, tag and rail dot
const SETUP_TONE: Record<SwingSetup, { text: string; edge: string; tag: string }> = {
  BO50: { text: 'text-emerald-300', edge: 'from-emerald-400/80', tag: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300' },
  BO20: { text: 'text-cyan-300', edge: 'from-cyan-400/80', tag: 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300' },
  PB50: { text: 'text-violet-300', edge: 'from-violet-400/80', tag: 'bg-violet-400/10 border-violet-400/30 text-violet-300' },
  PB20: { text: 'text-sky-300', edge: 'from-sky-400/80', tag: 'bg-sky-400/10 border-sky-400/30 text-sky-300' },
  NONE: { text: 'text-slate-400', edge: 'from-slate-500/40', tag: 'bg-white/5 border-white/10 text-slate-400' },
};

const SETUP_SHORT: Record<SwingSetup, string> = {
  BO50: '50D BREAKOUT', BO20: '20D BREAKOUT', PB50: '50-EMA DIP', PB20: '20-EMA DIP', NONE: 'NO SETUP',
};

const pctFrom = (v: number, base: number) => (base > 0 ? ((v - base) / base) * 100 : 0);

/**
 * The trade on one line: stop → entry → T1 (2R) → T2 (3R), drawn to scale in R.
 * The white dot is the live price, so a tracked trade shows how far it has travelled.
 */
const TradeRail: React.FC<{ entry: number; stop: number; t1: number; t2: number; price: number }> = ({ entry, stop, t1, t2, price }) => {
  const span = t2 - stop;
  const at = (v: number) => `${Math.min(100, Math.max(0, ((v - stop) / span) * 100))}%`;
  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: v >= 1000 ? 0 : 1 })}`;
  return (
    <div className="pt-1">
      <div className="relative h-6">
        <div className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-rose-500/60" style={{ left: 0, width: at(entry) }} />
        <div className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400" style={{ left: at(entry), right: 0 }} />
        {[stop, entry, t1, t2].map((v, i) => (
          <div key={i} className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[2px] h-3 rounded ${i === 0 ? 'bg-rose-400' : i === 1 ? 'bg-slate-300' : 'bg-emerald-300'}`} style={{ left: at(v) }} />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] ring-2 ring-[#0a0e17] transition-[left] duration-500"
          style={{ left: at(price) }}
          title={`Now ${fmt(price)}`}
        />
      </div>
      <div className="grid grid-cols-4 text-[10px] font-mono tabular-nums leading-tight">
        <div className="text-rose-300">{fmt(stop)}<div className="text-rose-400/60">{pctFrom(stop, entry).toFixed(1)}%</div></div>
        <div className="text-slate-200 text-center -translate-x-1/4">{fmt(entry)}<div className="text-slate-500">entry</div></div>
        <div className="text-emerald-300 text-center translate-x-1/4">{fmt(t1)}<div className="text-emerald-400/60">+{pctFrom(t1, entry).toFixed(1)}%</div></div>
        <div className="text-emerald-200 text-right">{fmt(t2)}<div className="text-emerald-400/60">+{pctFrom(t2, entry).toFixed(1)}%</div></div>
      </div>
    </div>
  );
};

const SwingPlayer: React.FC = () => {
  const [marketData, setMarketData] = useState<SwingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'SETUPS' | 'ALL' | 'WATCHLIST' | 'BREAKOUT' | 'PULLBACK' | 'TARGET_HIT'
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
      statusLabel = `Target 2 Done (+${((target2 - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-teal-300';
      statusBg = 'bg-teal-500/20 border-teal-500/40';
    } else if (currentPrice >= target1) {
      status = 'TARGET_1_HIT';
      statusLabel = `Target 1 Hit (+${((target1 - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-emerald-300';
      statusBg = 'bg-emerald-500/20 border-emerald-500/40';
    } else if (currentPrice <= stopLoss) {
      status = 'SL_HIT';
      statusLabel = `Stop Loss Hit (${((stopLoss - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-rose-400';
      statusBg = 'bg-rose-500/20 border-rose-500/40';
    } else if (pnlPercent > 0.1) {
      status = 'IN_PROFIT';
      statusLabel = `In Profit (+${pnlPercent.toFixed(1)}%)`;
      statusColor = 'text-emerald-400';
      statusBg = 'bg-emerald-500/15 border-emerald-500/30';
    } else if (pnlPercent < -0.1) {
      status = 'IN_PULLBACK';
      statusLabel = `Dip (${pnlPercent.toFixed(1)}%)`;
      statusColor = 'text-sky-400';
      statusBg = 'bg-sky-500/15 border-sky-500/30';
    } else {
      status = 'IN_PROFIT';
      statusLabel = 'Ready at Trigger';
      statusColor = 'text-slate-300';
      statusBg = 'bg-slate-800/80 border-slate-700/80';
    }

    const t1Dist = Math.max(0.1, target1 - entryPrice);
    const curDist = Math.max(0, currentPrice - entryPrice);
    const target1Progress = Math.max(0, Math.min(100, Math.round((curDist / t1Dist) * 100)));

    const slBuffer = Math.max(0, ((currentPrice - stopLoss) / currentPrice) * 100);

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

  // Trade Setup Modal State
  const [selectedStock, setSelectedStock] = useState<SwingData | null>(null);
  const [capitalRisk, setCapitalRisk] = useState<number>(3000);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const [niftyRegime, setNiftyRegime] = useState<{ above200: boolean; pct: number } | null>(null);
  const [lastBarDate, setLastBarDate] = useState<string>('');

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    const toBars = (rows: Awaited<ReturnType<typeof fetchHistoricalOHLCV>>): DailyBar[] =>
      rows.map(r => ({ timestamp: r.timestamp, open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume }));

    try {
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
      for (const sym of SWING_WATCHLIST_SYMBOLS) {
        const a = analyzeSwing(barsBySymbol[sym] ?? []);
        if (a) analyses[sym] = a;
      }
      setLastBarDate(Object.values(analyses)[0]?.barDate ?? '');

      // Sector ranking by the average 1-month return of its stocks
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
        const sInfo = sectorRankMap[sector] ?? { rank: 99, avgChange: 0, trend: 'UP' };
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
          expectedHolding: `3–${MAX_HOLD_DAYS} days`,
          holdingDaysHorizon: MAX_HOLD_DAYS,
          strategyRationale: a.reason,
          sector,
          sectorRank: sInfo.rank,
          sectorChange: sInfo.avgChange,
          sectorTrend: sInfo.trend,
          tradeReason: a.reason,
          isAbove200Sma: a.price > a.sma200,
          pctFrom50Ema: Number(((a.price / a.ema50 - 1) * 100).toFixed(1)),
        };
      });

      // Priority sort: BO50 > BO20 > PB50 > PB20 > NONE, then by Relative Strength
      const order: Record<SwingSetup, number> = { BO50: 0, BO20: 1, PB50: 2, PB20: 3, NONE: 4 };
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
      if (activeCategoryFilter === 'PULLBACK' && item.setupCategory !== 'PB50' && item.setupCategory !== 'PB20') return false;
      if (activeCategoryFilter === 'TARGET_HIT') {
        const m = getSwingMetrics(item);
        if (m.status !== 'TARGET_1_HIT' && m.status !== 'TARGET_2_HIT') return false;
      }

      if (highConvictionOnly && item.rs3m <= 0) return false;
      if (highVolumeOnly && item.volMultiplier < 1.4) return false;

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

  // Counts
  const breakoutCount = useMemo(() => marketData.filter(d => d.setupCategory === 'BO20' || d.setupCategory === 'BO50').length, [marketData]);
  const pullbackCount = useMemo(() => marketData.filter(d => d.setupCategory === 'PB50' || d.setupCategory === 'PB20').length, [marketData]);
  const setupCount = breakoutCount + pullbackCount;
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
    
    const text = `🎯 SWING RADAR SETUP: ${selectedStock.symbol} (${selectedStock.setupTitle})
• Sector: ${selectedStock.sector} (Rank #${selectedStock.sectorRank})
• Entry Price: ₹${selectedStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)} (-${riskPct}% Risk)
• Target 1: ₹${selectedStock.target1.toFixed(2)} (+${t1Pct}% Book 50%)
• Target 2: ₹${selectedStock.target2.toFixed(2)} (+${t2Pct}% Runner)
• Risk:Reward: ${selectedStock.riskReward}
• Horizon: ${selectedStock.expectedHolding}
• Rationale: ${selectedStock.strategyRationale}
• Suggested Qty: ${positionSizing.shares} Shares (Max Risk: ₹${positionSizing.maxLoss.toFixed(0)})`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full max-w-[1700px] mx-auto pb-12">

      {/* ── 1. Radar strip: what closed into a setup today (same shape as Index Movers) ── */}
      <section className="flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-64 shrink-0 relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Swing Radar · CNC</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tabular-nums leading-none">{loading ? '–' : setupCount}</span>
              <span className="text-sm text-slate-400">setups of {marketData.length || '…'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              {niftyRegime ? (
                <span className={`inline-flex items-center gap-1 font-bold ${niftyRegime.above200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {niftyRegime.above200 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  Nifty {niftyRegime.pct >= 0 ? '+' : ''}{niftyRegime.pct.toFixed(1)}% vs 200-DMA
                </span>
              ) : <span className="text-slate-500">Nifty trend loading…</span>}
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-500">
              {lastBarDate ? `Daily close ${lastBarDate}` : 'Daily bars'} · exit by day {MAX_HOLD_DAYS}
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Scanning…' : 'Rescan'}
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 content-start">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[68px] rounded-xl border border-white/10 bg-white/5 animate-pulse" />
            ))
          ) : marketData.filter(d => d.setupCategory !== 'NONE').length === 0 ? (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No stock closed into a breakout or EMA dip on the latest bar. Waiting is a position — open <button className="text-emerald-400 font-bold hover:underline" onClick={() => setActiveCategoryFilter('ALL')}>All stocks</button> to watch levels.
            </div>
          ) : (
            marketData.filter(d => d.setupCategory !== 'NONE').slice(0, 10).map(stock => {
              const tone = SETUP_TONE[stock.setupCategory];
              return (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className="group text-left rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 flex items-center gap-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <StockLogo symbol={stock.symbol} className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-100 truncate">{stock.symbol}</div>
                    <div className={`text-[10px] font-bold ${tone.text}`}>{SETUP_SHORT[stock.setupCategory]}</div>
                    <div className={`text-[10px] font-mono ${stock.change >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}% · RS {stock.rs3m >= 0 ? '+' : ''}{stock.rs3m}%
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ── 1b. Evidence line: what these exact rules earned after costs ── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        <span className="font-bold text-slate-300 inline-flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          Backtest {SWING_BACKTEST.period}, after costs
        </span>
        {SWING_BACKTEST.rows.map(r => (
          <span key={r.setup} className="font-mono tabular-nums">
            <span className={SETUP_TONE[r.setup].text}>{SETUP_SHORT[r.setup]}</span>{' '}
            <span className={r.avg >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{r.avg >= 0 ? '+' : ''}{r.avg.toFixed(2)}%</span>
          </span>
        ))}
        <span className="font-mono tabular-nums text-slate-400">
          RANDOM <span className={SWING_BACKTEST.random.avg >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{SWING_BACKTEST.random.avg >= 0 ? '+' : ''}{SWING_BACKTEST.random.avg.toFixed(2)}%</span>
        </span>
        <span className="text-slate-500">per trade · no setup clearly beats a random entry, so use this as a watch list, not buy calls.</span>
      </div>

      {/* ── 2. Filters ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-white/5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'SETUPS', label: 'Setups', n: setupCount },
            { id: 'BREAKOUT', label: 'Breakouts', n: breakoutCount },
            { id: 'PULLBACK', label: 'EMA dips', n: pullbackCount },
            { id: 'WATCHLIST', label: 'Tracked', n: savedWatchlist.length },
            { id: 'ALL', label: 'All stocks', n: marketData.length },
          ].map(tab => {
            const isActive = activeCategoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isActive ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label} <span className={`ml-1 font-mono ${isActive ? 'text-emerald-300' : 'text-slate-500'}`}>{tab.n}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHighConvictionOnly(prev => !prev)}
            aria-pressed={highConvictionOnly}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${highConvictionOnly ? 'bg-violet-400/15 text-violet-200 border-violet-400/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'}`}
          >
            Beats Nifty 3M
          </button>
          <button
            onClick={() => setHighVolumeOnly(prev => !prev)}
            aria-pressed={highVolumeOnly}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${highVolumeOnly ? 'bg-sky-400/15 text-sky-200 border-sky-400/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'}`}
          >
            Volume ≥ 1.4×
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Symbol or sector"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 w-40 focus:outline-none focus:border-emerald-400/60 placeholder-slate-500"
            />
          </div>
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button type="button" onClick={() => handleViewModeChange('grid')} aria-label="Cards" className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => handleViewModeChange('table')} aria-label="Table" className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}>
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Watchlist Performance Cockpit (Shown on Watchlist tab) ──────── */}
      {activeCategoryFilter === 'WATCHLIST' && (
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <h3 className="text-base font-bold text-white">Tracked Swing Positions</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {watchlistMetrics.total} Tracked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time tracking of holding days, target progress, and trailing stop buffer across delivery trades.
              </p>
            </div>

            {watchlistMetrics.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="bg-[#101622] border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">In Profit</div>
                  <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                    {watchlistMetrics.inProfit} / {watchlistMetrics.total}
                  </div>
                </div>
                <div className="bg-[#101622] border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Targets Done</div>
                  <div className="text-xs font-black text-teal-300 font-mono mt-0.5">
                    {watchlistMetrics.targetHits} Hit
                  </div>
                </div>
                <div className="bg-[#101622] border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
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

      {/* ── 4. Main Body: Grid Cards vs Pro Table ─────────────────────────── */}
      {loading ? (
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Scanning Verified Swing Setups...</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Fetching daily bars for top 45 liquid momentum stocks and evaluating volume breakouts &amp; EMA support bounces.
          </p>
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeCategoryFilter === 'WATCHLIST' ? 'No Swing Setups in Watchlist' : 'No Setups Found For This Filter'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeCategoryFilter === 'WATCHLIST'
              ? 'Click the bookmark icon on any swing card to save and track holding days and profit targets!'
              : 'No stocks matched this criteria on the latest daily close. Check "Full Universe" or adjust search filters.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Cards: glass, one accent edge per setup, the trade rail as the centrepiece ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {displayedSetups.map((stock) => {
            const metrics = getSwingMetrics(stock);
            const isWatchlisted = savedWatchlist.includes(stock.symbol);
            const tone = SETUP_TONE[stock.setupCategory];
            return (
              <article
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/[0.08] hover:border-white/20 transition cursor-pointer"
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tone.edge} to-transparent`} />

                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StockLogo symbol={stock.symbol} className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{stock.symbol}</h3>
                      <div className="font-mono tabular-nums text-xs">
                        <span className="text-slate-100 font-bold">₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>{' '}
                        <span className={stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider ${tone.tag}`}>
                    {SETUP_SHORT[stock.setupCategory]}
                  </span>
                </header>

                <div className="mt-3">
                  <TradeRail
                    entry={metrics.entryPrice}
                    stop={metrics.stopLoss}
                    t1={metrics.target1}
                    t2={metrics.target2}
                    price={metrics.currentPrice}
                  />
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-slate-400 line-clamp-2">{stock.tradeReason}</p>

                <footer className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap text-[10px] font-mono tabular-nums text-slate-400">
                    <span title={`Sector rank by 1-month return: ${stock.sector}`}>
                      {stock.sector} <span className={stock.sectorTrend === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>#{stock.sectorRank}</span>
                    </span>
                    <span title="3-month return minus Nifty's">RS <span className={stock.rs3m >= 0 ? 'text-violet-300' : 'text-slate-500'}>{stock.rs3m >= 0 ? '+' : ''}{stock.rs3m}%</span></span>
                    <span title="Today's volume vs 20-day average">Vol <span className={stock.volMultiplier >= 1.4 ? 'text-sky-300' : 'text-slate-500'}>{stock.volMultiplier}×</span></span>
                    {isWatchlisted && <span className={metrics.statusColor}>{metrics.statusLabel} · {metrics.daysHeld}d</span>}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock); }}
                    aria-label={isWatchlisted ? `Stop tracking ${stock.symbol}` : `Track ${stock.symbol}`}
                    className={`shrink-0 p-1.5 rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isWatchlisted ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-emerald-300'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-emerald-300' : ''}`} />
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        /* ── PRO TABULAR VIEW (Dense & Clean) ────────────────────────────────── */
        <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3.5 px-4 bg-[#101622] border-b border-slate-800/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Swing Radar — Delivery CNC Directory
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                {displayedSetups.length} Stocks
              </span>
            </div>
            <span className="text-[10px] text-slate-500 hidden md:block">
              Click headers to sort · Click any row to open Position Sizer
            </span>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#080b12] border-b border-slate-800/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 min-w-[180px]">Symbol &amp; Setup</th>
                  <th
                    onClick={() => handleSort('sectorRank')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-200 transition min-w-[120px]"
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
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition min-w-[90px]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>LTP &amp; Chg%</span>
                      {sortField === 'price'
                        ? <span className="text-emerald-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                    </div>
                  </th>
                  <th className="py-3 px-3 min-w-[200px]">Strategy Rationale</th>
                  <th
                    onClick={() => handleSort('rs3m')}
                    className="py-3 px-3 text-center cursor-pointer hover:text-slate-200 transition min-w-[85px]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>RS 3M · Vol</span>
                      {sortField === 'rs3m'
                        ? <span className="text-emerald-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center min-w-[140px]">Entry · SL · Targets</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">Horizon</th>
                  <th className="py-3 px-4 min-w-[150px]">Swing Status</th>
                  <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {displayedSetups.map((stock, index) => {
                  const metrics = getSwingMetrics(stock);
                  const isWatchlisted = savedWatchlist.includes(stock.symbol);
                  const riskPct = ((Math.abs(stock.stopLoss - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);
                  const t1Pct = (((stock.target1 - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);
                  const t2Pct = (((stock.target2 - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1);

                  const setupBadgeConfig: Record<SwingSetup, { bg: string; text: string; border: string }> = {
                    BO50: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
                    BO20: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
                    PB50: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
                    PB20: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
                    NONE: { bg: 'bg-slate-800/80', text: 'text-slate-400', border: 'border-slate-700/80' },
                  };
                  const sBadge = setupBadgeConfig[stock.setupCategory];

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`cursor-pointer group transition-colors duration-100 hover:bg-[#101827] ${
                        index % 2 === 0 ? 'bg-[#0b0f17]' : 'bg-[#0d121c]'
                      }`}
                    >
                      {/* Symbol + Setup */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <StockLogo
                            symbol={stock.symbol}
                            className="w-8 h-8 rounded-full shrink-0 border border-slate-700/80 bg-[#101622]"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white group-hover:text-emerald-300 transition-colors text-[13px]">
                                {stock.symbol}
                              </span>
                            </div>
                            <span className={`inline-block px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wider border mt-0.5 ${sBadge.bg} ${sBadge.text} ${sBadge.border}`}>
                              {stock.setupTitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sector & Rank */}
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
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
                        <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-0.5 ${
                          stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%</span>
                        </div>
                      </td>

                      {/* Strategy Rationale */}
                      <td className="py-3 px-3 font-sans">
                        <div className="text-[10px] text-slate-300 font-medium leading-snug max-w-[210px] line-clamp-2" title={stock.tradeReason}>
                          {stock.tradeReason}
                        </div>
                      </td>

                      {/* RS · Volume */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                            stock.rs3m > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {stock.rs3m >= 0 ? '+' : ''}{stock.rs3m}%
                          </span>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {stock.volMultiplier}x Vol
                          </div>
                        </div>
                      </td>

                      {/* Entry · SL · T1 · T2 */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-start gap-0.5 text-[10px] font-sans">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 w-5">Ent</span>
                            <span className="font-semibold text-slate-100">₹{stock.entryPrice.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-rose-400 w-5">SL</span>
                            <span className="font-semibold text-rose-400">₹{stock.stopLoss.toFixed(1)}</span>
                            <span className="text-[8px] text-rose-500">-{riskPct}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-400 w-5">T1</span>
                            <span className="font-semibold text-emerald-400">₹{stock.target1.toFixed(1)}</span>
                            <span className="text-[8px] text-emerald-500">+{t1Pct}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Horizon */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-sky-500/10 text-sky-300 border-sky-500/25">
                          {stock.expectedHolding}
                        </span>
                        {isWatchlisted && (
                          <div className="text-[9px] text-emerald-400 font-bold mt-1">
                            Held {metrics.daysHeld}d
                          </div>
                        )}
                      </td>

                      {/* Swing Status + Progress Bar */}
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="space-y-1">
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
                                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Swing Watchlist'}
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
        </div>
      )}

      {/* ── 5. Interactive Trade Setup & Position Sizer Modal ─────────────── */}
      {selectedStock && (() => {
        const modalMetrics = getSwingMetrics(selectedStock);
        const isWatchlisted = savedWatchlist.includes(selectedStock.symbol);
        const riskPct = ((Math.abs(selectedStock.stopLoss - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
        const t1Pct = ((Math.abs(selectedStock.target1 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
        const t2Pct = ((Math.abs(selectedStock.target2 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden space-y-4 max-h-[90vh] overflow-y-auto [scrollbar-width:thin]">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <StockLogo symbol={selectedStock.symbol} className="w-12 h-12 rounded-2xl border border-slate-800 bg-[#101622]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{selectedStock.symbol}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {selectedStock.setupTitle} · CNC
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      LTP: ₹{selectedStock.price.toFixed(2)} ({selectedStock.barDate}) • Horizon: {selectedStock.expectedHolding}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={`https://in.tradingview.com/chart/?symbol=NSE:${selectedStock.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-bold transition shadow-sm"
                    title="TradingView Chart"
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
              <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3.5 text-xs leading-relaxed space-y-1 text-emerald-200/90">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Technical Rationale</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      RS: {selectedStock.rs3m >= 0 ? '+' : ''}{selectedStock.rs3m}% vs Nifty
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                      {selectedStock.volMultiplier}x 20D Vol
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-normal">
                  {selectedStock.strategyRationale}
                </p>
              </div>

              {/* Levels Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#101622] border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Entry Level</div>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    ₹{selectedStock.entryPrice.toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#101622] border border-rose-500/20 rounded-xl p-3 text-center bg-rose-500/5">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Stop Loss</div>
                  <div className="text-base font-black text-rose-400 font-mono mt-0.5">
                    ₹{selectedStock.stopLoss.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-rose-400 font-mono mt-0.5 font-bold">
                    -{riskPct}% Risk
                  </div>
                </div>

                <div className="bg-[#101622] border border-emerald-500/20 rounded-xl p-3 text-center bg-emerald-500/5">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Target 1 (1:2)</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    ₹{selectedStock.target1.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono mt-0.5 font-bold">
                    +{t1Pct}% (Book 50%)
                  </div>
                </div>

                <div className="bg-[#101622] border border-teal-500/20 rounded-xl p-3 text-center bg-teal-500/5">
                  <div className="text-[10px] uppercase font-bold text-teal-300">Target 2 (Runner)</div>
                  <div className="text-base font-black text-teal-300 font-mono mt-0.5">
                    ₹{selectedStock.target2.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-teal-300 font-mono mt-0.5 font-bold">
                    +{t2Pct}% (Trail SL)
                  </div>
                </div>
              </div>

              {/* Swing Position Sizing Calculator */}
              <div className="bg-[#101622] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>Position Sizer (Max Risk: ₹{capitalRisk})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[2000, 3000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCapitalRisk(amt)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                          capitalRisk === amt 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Delivery Qty</div>
                    <div className="text-sm font-black text-white mt-0.5">{positionSizing.shares} Shares</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">₹{positionSizing.totalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cap</div>
                  </div>
                  <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-rose-400 uppercase font-sans">Max Loss (SL)</div>
                    <div className="text-sm font-black text-rose-400 mt-0.5">₹{positionSizing.maxLoss.toFixed(0)}</div>
                    <div className="text-[9px] text-rose-500 font-mono mt-0.5">Capital at risk</div>
                  </div>
                  <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-emerald-400 uppercase font-sans">Target 1 Gain</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">+₹{positionSizing.targetProfit.toFixed(0)}</div>
                    <div className="text-[9px] text-emerald-500 font-mono mt-0.5">1:2 R:R profit</div>
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
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                  <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
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
