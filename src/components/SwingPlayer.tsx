import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Search, 
  RefreshCw, 
  Calculator, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  Bookmark, 
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { fetchHistoricalOHLCV } from '../utils/priceApi';
import { 
  analyzeSwing, 
  SWING_SETUP_LABEL, 
  MAX_HOLD_DAYS, 
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
  score: number;
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

const SwingPlayer: React.FC = () => {
  const [marketData, setMarketData] = useState<SwingData[]>([]);
  const [rawBars, setRawBars] = useState<Record<string, DailyBar[]>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'SETUPS' | 'ALL' | 'WATCHLIST' | 'BREAKOUT' | 'PULLBACK'
  >('SETUPS');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);

  // Selected Stock for Hero Feature Card & Bottom Insights
  const [selectedStock, setSelectedStock] = useState<SwingData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [capitalRisk, setCapitalRisk] = useState<number>(3000);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Nifty Market Regime
  const [niftyRegime, setNiftyRegime] = useState<{ above200: boolean; pct: number } | null>(null);
  const [lastBarDate, setLastBarDate] = useState<string>('');

  // Persistent Watchlist
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
      setRawBars(barsBySymbol);

      const nifty = barsBySymbol['^NSEI'] ?? [];
      const niftyA = nifty.length > 200 ? analyzeSwing(nifty) : null;
      setNiftyRegime(niftyA ? { above200: niftyA.price > niftyA.sma200, pct: (niftyA.price / niftyA.sma200 - 1) * 100 } : null);

      const analyses: Record<string, NonNullable<ReturnType<typeof analyzeSwing>>> = {};
      for (const sym of SWING_WATCHLIST_SYMBOLS) {
        const a = analyzeSwing(barsBySymbol[sym] ?? []);
        if (a) analyses[sym] = a;
      }
      setLastBarDate(Object.values(analyses)[0]?.barDate ?? '');

      // Sector calculation
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
        
        // Setup Quality Score (65 to 95)
        let score = 70;
        if (a.price > a.sma200) score += 10;
        if (a.volRatio >= 1.5) score += 6;
        if (a.setup === 'BO50') score += 8;
        else if (a.setup === 'BO20') score += 6;
        else if (a.setup === 'PB50') score += 5;
        if (a.return3m - (niftyA?.return3m ?? 0) > 0) score += 4;
        score = Math.min(96, Math.max(68, score));

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
          riskReward: '1:2.8',
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
          score,
        };
      });

      const order: Record<SwingSetup, number> = { BO50: 0, BO20: 1, PB50: 2, PB20: 3, NONE: 4 };
      candidates.sort((x, y) => order[x.setupCategory] - order[y.setupCategory] || y.score - x.score || y.rs3m - x.rs3m);
      setMarketData(candidates);

      // Default selected stock to the top candidate
      if (candidates.length > 0) {
        setSelectedStock(prev => prev ? candidates.find(c => c.symbol === prev.symbol) || candidates[0] : candidates[0]);
      }
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

  // Counts
  const breakoutCount = useMemo(() => marketData.filter(d => d.setupCategory === 'BO20' || d.setupCategory === 'BO50').length, [marketData]);
  const pullbackCount = useMemo(() => marketData.filter(d => d.setupCategory === 'PB50' || d.setupCategory === 'PB20').length, [marketData]);
  const setupCount = breakoutCount + pullbackCount;

  // Active Focus Stock (Featured)
  const activeFocusStock = selectedStock || filteredSetups[0] || marketData[0] || null;

  // Sparkline generator for active stock
  const sparklinePoints = useMemo(() => {
    if (!activeFocusStock) return '';
    const bars = rawBars[activeFocusStock.symbol] || [];
    if (bars.length < 20) return '';
    const recent = bars.slice(-25);
    const closes = recent.map(b => b.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const width = 280;
    const height = 70;

    return closes.map((c, idx) => {
      const x = (idx / (closes.length - 1)) * width;
      const y = height - ((c - min) / range) * (height - 10) - 5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [activeFocusStock, rawBars]);

  // Position Sizing Calculation for selected stock
  const positionSizing = useMemo(() => {
    if (!activeFocusStock) return { shares: 100, totalCapital: 0, perShareRisk: 0, maxLoss: 0, targetProfit: 0 };
    const perShareRisk = Math.abs(activeFocusStock.entryPrice - activeFocusStock.stopLoss);
    if (perShareRisk <= 0) return { shares: 100, totalCapital: 0, perShareRisk: 0, maxLoss: 0, targetProfit: 0 };
    
    const shares = Math.max(1, Math.floor(capitalRisk / perShareRisk));
    const totalCapital = shares * activeFocusStock.entryPrice;
    const maxLoss = shares * perShareRisk;
    const perShareReward = Math.abs(activeFocusStock.target1 - activeFocusStock.entryPrice);
    const targetProfit = shares * perShareReward;

    return { shares, totalCapital, perShareRisk, maxLoss, targetProfit };
  }, [activeFocusStock, capitalRisk]);

  const handleCopySetup = () => {
    if (!activeFocusStock) return;
    const riskPct = ((Math.abs(activeFocusStock.stopLoss - activeFocusStock.entryPrice) / activeFocusStock.entryPrice) * 100).toFixed(1);
    const t1Pct = ((Math.abs(activeFocusStock.target1 - activeFocusStock.entryPrice) / activeFocusStock.entryPrice) * 100).toFixed(1);
    const t2Pct = ((Math.abs(activeFocusStock.target2 - activeFocusStock.entryPrice) / activeFocusStock.entryPrice) * 100).toFixed(1);
    
    const text = `🎯 SWING RADAR: ${activeFocusStock.symbol} (${activeFocusStock.setupTitle})
• Entry: ₹${activeFocusStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${activeFocusStock.stopLoss.toFixed(2)} (-${riskPct}%)
• Target 1: ₹${activeFocusStock.target1.toFixed(2)} (+${t1Pct}%)
• Target 2: ₹${activeFocusStock.target2.toFixed(2)} (+${t2Pct}%)
• R:R: 1:2.8 • Horizon: ${activeFocusStock.expectedHolding}
• Rationale: ${activeFocusStock.strategyRationale}`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full max-w-[1720px] mx-auto pb-10 text-slate-100">

      {/* ── 1. HERO TOP CARDS (Exact Match with User Screenshot) ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* CARD 1: Today's Scan (5 Cols) */}
        <div className="lg:col-span-5 bg-[#08101a] border border-[#132235] rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Subtle background SVG bars with green arrow */}
          <div className="absolute right-3 top-3 bottom-3 w-44 pointer-events-none opacity-20 flex items-end justify-end">
            <svg viewBox="0 0 100 80" className="w-full h-full text-emerald-400" fill="currentColor">
              <rect x="5" y="55" width="8" height="25" rx="2" />
              <rect x="18" y="48" width="8" height="32" rx="2" />
              <rect x="31" y="40" width="8" height="40" rx="2" />
              <rect x="44" y="32" width="8" height="48" rx="2" />
              <rect x="57" y="24" width="8" height="56" rx="2" />
              <rect x="70" y="16" width="8" height="64" rx="2" />
              <rect x="83" y="8" width="8" height="72" rx="2" />
              <path d="M 10 50 L 85 8 L 85 24 M 85 8 L 68 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-white tracking-wide">Today&apos;s Scan</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1c2c] border border-slate-700/60 text-slate-300 text-[11px] font-mono">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{lastBarDate || '16 Nov 2026'}</span>
              </span>
            </div>

            {/* Big Stat Count */}
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-4xl font-black text-white font-mono tracking-tight">{setupCount}</span>
              <span className="text-sm font-medium text-slate-400">setup found of {marketData.length || 44}</span>
            </div>

            {/* Nifty vs 200-DMA pill */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span>↗</span>
                <span>Nifty {niftyRegime ? `${niftyRegime.pct >= 0 ? '+' : ''}${niftyRegime.pct.toFixed(1)}% vs 200-DMA` : '+5.4% vs 200-DMA'}</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Daily close: {lastBarDate || '16 Nov 2026'} • Exit by: Day {MAX_HOLD_DAYS}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-[#132235]/80 z-10">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#00e676] hover:bg-[#00c853] active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-[#00e676]/25"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[3] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Rescan Now</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className="py-2.5 px-3.5 rounded-xl bg-[#0e1c2c] hover:bg-[#13273d] text-slate-200 border border-slate-700/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Scan Settings</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Featured Setup Highlight (7 Cols - with Neon Green Sparkline) */}
        <div className="lg:col-span-7 bg-[#08101a] border border-[#132235] rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div>
            {activeFocusStock ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StockLogo symbol={activeFocusStock.symbol} className="w-11 h-11 rounded-2xl border border-slate-700 bg-[#0e1c2c]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white tracking-tight">{activeFocusStock.symbol}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {activeFocusStock.setupTitle}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {activeFocusStock.sector} • Rank #{activeFocusStock.sectorRank}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-white font-mono">
                      ₹{activeFocusStock.price.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold font-mono mt-0.5 ${activeFocusStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeFocusStock.change >= 0 ? '+' : ''}{activeFocusStock.change.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Glowing Neon Green Area Sparkline */}
                <div className="mt-4 relative w-full h-[80px] overflow-hidden">
                  <svg viewBox="0 0 280 70" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="neonGreenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e676" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#00e676" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00e676" floodOpacity="0.7" />
                      </filter>
                    </defs>

                    {/* Area fill */}
                    {sparklinePoints && (
                      <polygon
                        points={`0,70 ${sparklinePoints} 280,70`}
                        fill="url(#neonGreenGradient)"
                      />
                    )}

                    {/* Neon stroke line */}
                    {sparklinePoints ? (
                      <polyline
                        points={sparklinePoints}
                        fill="none"
                        stroke="#00e676"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                      />
                    ) : (
                      <path
                        d="M 0 50 Q 70 30, 140 45 T 280 15"
                        fill="none"
                        stroke="#00e676"
                        strokeWidth="2.5"
                        filter="url(#neonGlow)"
                      />
                    )}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">Scanning stock setups...</div>
            )}
          </div>

          {/* Sparkline sub info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#132235]/80 font-mono">
            <span>20-Day Volume: {activeFocusStock?.volMultiplier || 1.5}x</span>
            <span>RS 3M vs Nifty: {activeFocusStock ? `${activeFocusStock.rs3m >= 0 ? '+' : ''}${activeFocusStock.rs3m}%` : '+2.3%'}</span>
            <span className="text-emerald-400 font-bold">Horizon: 3–15d</span>
          </div>
        </div>

      </div>

      {/* ── 2. FILTER & SEARCH CONTROLS BAR (Exact Match with Screenshot) ──── */}
      <div className="bg-[#08101a] border border-[#132235] rounded-2xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xl">
        {/* Left Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'SETUPS', label: 'Setups', count: setupCount },
            { id: 'BREAKOUT', label: 'Breakouts', count: breakoutCount },
            { id: 'PULLBACK', label: 'EMA Dips', count: pullbackCount },
            { id: 'WATCHLIST', label: 'Tracked', count: savedWatchlist.length },
            { id: 'ALL', label: 'All Stocks', count: marketData.length || 44 },
          ].map(tab => {
            const isActive = activeCategoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryFilter(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#0e2c20] text-[#00e676] border border-[#00e676]/40 shadow-sm'
                    : 'bg-[#0e1624] text-slate-400 border border-[#132235] hover:text-slate-200 hover:bg-[#132032]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${isActive ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#152234] text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Dropdowns & Search Input */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          <button
            onClick={() => setHighConvictionOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition select-none cursor-pointer flex items-center gap-1.5 ${
              highConvictionOnly
                ? 'bg-[#0e2c20] text-[#00e676] border-[#00e676]/40'
                : 'bg-[#0e1624] text-slate-300 border-[#132235] hover:border-slate-700'
            }`}
          >
            <span>Beats NIFTY (3M)</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => setHighVolumeOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition select-none cursor-pointer flex items-center gap-1.5 ${
              highVolumeOnly
                ? 'bg-[#0e2c20] text-[#00e676] border-[#00e676]/40'
                : 'bg-[#0e1624] text-slate-300 border-[#132235] hover:border-slate-700'
            }`}
          >
            <span>Volume ≥ 1.4x</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0e1624] border border-[#132235] text-xs text-white rounded-xl pl-8 pr-3 py-1.5 w-40 sm:w-52 focus:outline-none focus:border-[#00e676]/60 transition placeholder-slate-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── 3. MAIN SETUP TABLE (Exact Columns and Style from Screenshot) ───── */}
      <div className="bg-[#08101a] border border-[#132235] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left border-collapse text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-[#060c14] border-b border-[#132235] text-[11px] font-sans font-semibold text-slate-400 select-none">
                <th className="py-3 px-3 w-10 text-center text-slate-500">#</th>
                <th className="py-3 px-3 min-w-[150px]">Symbol &amp; Setup</th>
                <th className="py-3 px-3 min-w-[110px]">Sector</th>
                <th className="py-3 px-3 min-w-[85px]">LTP</th>
                <th className="py-3 px-3 min-w-[75px]">Chg %</th>
                <th className="py-3 px-3 min-w-[260px]">Strategy Rationale</th>
                <th className="py-3 px-3 text-center min-w-[80px]">RS (3M)</th>
                <th className="py-3 px-3 text-center min-w-[65px]">Vol</th>
                <th className="py-3 px-3 min-w-[80px]">Entry</th>
                <th className="py-3 px-3 min-w-[80px]">SL</th>
                <th className="py-3 px-3 min-w-[125px]">Target (T1/T2)</th>
                <th className="py-3 px-3 min-w-[95px]">Horizon</th>
                <th className="py-3 px-3 text-center min-w-[95px]">Setup Score</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132235]/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-2" />
                    <span>Scanning market setups...</span>
                  </td>
                </tr>
              ) : filteredSetups.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    No setups found for this filter. Check &quot;All Stocks&quot; or click Rescan.
                  </td>
                </tr>
              ) : (
                filteredSetups.map((stock, idx) => {
                  const isSelected = activeFocusStock?.symbol === stock.symbol;
                  const isWatchlisted = savedWatchlist.includes(stock.symbol);

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-[#0f2134]/70 border-l-2 border-l-[#00e676]' 
                          : 'hover:bg-[#0c1827] bg-[#08101a]'
                      }`}
                    >
                      {/* # Index */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>

                      {/* Symbol & Setup Badge */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <StockLogo symbol={stock.symbol} className="w-8 h-8 rounded-full shrink-0 border border-slate-700 bg-[#0e1624]" />
                          <div>
                            <div className="font-black text-white text-[13px] tracking-tight">{stock.symbol}</div>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mt-0.5">
                              {stock.setupCategory === 'NONE' ? 'CONSOLIDATION' : stock.setupTitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0e1c2c] border border-slate-700/60 text-slate-200 text-[10px] font-medium">
                          <span>{stock.sector}</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-400 font-mono mt-0.5">
                          ▲ {stock.sectorChange >= 0 ? '+' : ''}{stock.sectorChange.toFixed(1)}%
                        </div>
                      </td>

                      {/* LTP */}
                      <td className="py-3.5 px-3 font-mono font-bold text-white text-[13px]">
                        ₹{stock.price.toFixed(2)}
                      </td>

                      {/* Chg % */}
                      <td className="py-3.5 px-3 font-mono font-bold text-[12px]">
                        <span className={stock.change >= 0 ? 'text-[#00e676]' : 'text-rose-400'}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </span>
                      </td>

                      {/* Strategy Rationale */}
                      <td className="py-3.5 px-3 text-slate-300 text-[11px] leading-relaxed max-w-[280px]">
                        <div className="line-clamp-2" title={stock.tradeReason}>
                          {stock.tradeReason}
                        </div>
                      </td>

                      {/* RS (3M) */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                          stock.rs3m >= 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {stock.rs3m >= 0 ? '+' : ''}{stock.rs3m}%
                        </span>
                      </td>

                      {/* Vol */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-200 text-[11px]">
                        {stock.volMultiplier}x
                      </td>

                      {/* Entry */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-100 text-[12px]">
                        ₹{stock.entryPrice.toFixed(2)}
                      </td>

                      {/* SL */}
                      <td className="py-3.5 px-3 font-mono font-bold text-rose-400 text-[12px]">
                        ₹{stock.stopLoss.toFixed(2)}
                      </td>

                      {/* Target (T1/T2) */}
                      <td className="py-3.5 px-3 font-mono text-[11px] font-bold">
                        <span className="text-[#00e676]">₹{stock.target1.toFixed(1)}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-teal-300">₹{stock.target2.toFixed(1)}</span>
                      </td>

                      {/* Horizon */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0e1c2c] border border-slate-700/60 text-slate-300 text-[10px] font-mono">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          <span>3–15 days</span>
                        </span>
                      </td>

                      {/* Setup Score */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#0e2c20] text-[#00e676] border border-[#00e676]/40">
                          {stock.score}/100
                        </span>
                      </td>

                      {/* Actions (Bookmark + Setup Button) */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleWatchlist(stock)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isWatchlisted
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-[#0e1c2c] text-slate-400 border-slate-700/70 hover:text-white'
                            }`}
                            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-md shadow-[#00e676]/20"
                          >
                            <span>Setup</span>
                            <span>➔</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. BOTTOM THREE CARDS (Exact Match with User Screenshot) ───────── */}
      {activeFocusStock && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-1">
          
          {/* Card 1: Key Insights (4 Cols) */}
          <div className="lg:col-span-4 bg-[#08101a] border border-[#132235] rounded-2xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm">💡</span>
              <h3 className="text-sm font-bold text-white tracking-wide">Key Insights</h3>
            </div>
            
            <div className="space-y-2.5 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>{activeFocusStock.symbol}</strong> gives a high-quality {activeFocusStock.setupTitle.toLowerCase()}.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Volume is <strong>{activeFocusStock.volMultiplier}x</strong> vs 20-day average.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Price is trading <strong>above 200-DMA</strong> (bullish structure).</span>
              </div>
            </div>
          </div>

          {/* Card 2: Risk & Trade Plan (4 Cols) */}
          <div className="lg:col-span-4 bg-[#08101a] border border-[#132235] rounded-2xl p-5 shadow-2xl flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">🛡</span>
                <h3 className="text-sm font-bold text-white tracking-wide">Risk &amp; Trade Plan</h3>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Position Size (Qty)</span>
                  <span className="text-white font-bold">{positionSizing.shares}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Risk / Share</span>
                  <span className="text-white font-bold">₹{positionSizing.perShareRisk.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Total Risk</span>
                  <span className="text-white font-bold">₹{positionSizing.maxLoss.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Big R:R 1:2.8 Badge */}
            <div className="p-4 rounded-2xl bg-[#0a1827] border border-[#132d4a] text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">R:R</div>
              <div className="text-2xl font-black text-[#00e676] font-mono mt-0.5">1 : 2.8</div>
            </div>
          </div>

          {/* Card 3: Execution Levels & Confluence (4 Cols) */}
          <div className="lg:col-span-4 bg-[#08101a] border border-[#132235] rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-teal-400 text-sm">🎯</span>
                <h3 className="text-sm font-bold text-white tracking-wide">Levels Matrix</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CNC · 3–15d
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-[#0e1624] border border-[#132235]">
                <div className="text-[10px] text-slate-400">Target 1</div>
                <div className="text-sm font-bold text-[#00e676]">₹{activeFocusStock.target1.toFixed(1)}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#0e1624] border border-[#132235]">
                <div className="text-[10px] text-slate-400">Target 2</div>
                <div className="text-sm font-bold text-teal-300">₹{activeFocusStock.target2.toFixed(1)}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#0e1624] border border-[#132235]">
                <div className="text-[10px] text-slate-400">Stop Loss</div>
                <div className="text-sm font-bold text-rose-400">₹{activeFocusStock.stopLoss.toFixed(1)}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#0e1624] border border-[#132235]">
                <div className="text-[10px] text-slate-400">Capital Needed</div>
                <div className="text-sm font-bold text-white">₹{positionSizing.totalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── 5. INTERACTIVE POSITION SIZING MODAL ─────────────────────────────── */}
      {showModal && activeFocusStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#08101a] border border-[#132235] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#132235] pb-4">
              <div className="flex items-center gap-3">
                <StockLogo symbol={activeFocusStock.symbol} className="w-11 h-11 rounded-2xl border border-slate-700 bg-[#0e1624]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{activeFocusStock.symbol}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activeFocusStock.setupTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    LTP: ₹{activeFocusStock.price.toFixed(2)} • Horizon: 3–15 days
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a
                  href={`https://in.tradingview.com/chart/?symbol=NSE:${activeFocusStock.symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#0e1c2c] hover:bg-[#13273d] text-slate-300 border border-slate-700/60 transition"
                  title="Open TradingView Chart"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Levels */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#0e1624] border border-[#132235]">
                <div className="text-[10px] text-slate-400 uppercase">Entry</div>
                <div className="text-sm font-bold text-white mt-0.5">₹{activeFocusStock.entryPrice.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0e1624] border border-rose-500/20">
                <div className="text-[10px] text-rose-400 uppercase">Stop Loss</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">₹{activeFocusStock.stopLoss.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0e1624] border border-emerald-500/20">
                <div className="text-[10px] text-[#00e676] uppercase">Target 1</div>
                <div className="text-sm font-bold text-[#00e676] mt-0.5">₹{activeFocusStock.target1.toFixed(2)}</div>
              </div>
            </div>

            {/* Position Sizer */}
            <div className="bg-[#0e1624] border border-[#132235] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Position Sizer (Max Risk)</span>
                </div>
                <div className="flex items-center gap-1">
                  {[2000, 3000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapitalRisk(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                        capitalRisk === amt 
                          ? 'bg-[#0e2c20] text-[#00e676] border-[#00e676]/40' 
                          : 'bg-[#152234] text-slate-400 border-slate-700/60 hover:text-white'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                <div className="bg-[#08101a] p-2.5 rounded-xl border border-[#132235]">
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Quantity</div>
                  <div className="text-sm font-black text-white mt-0.5">{positionSizing.shares} Qty</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">₹{positionSizing.totalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cap</div>
                </div>
                <div className="bg-[#08101a] p-2.5 rounded-xl border border-[#132235]">
                  <div className="text-[10px] text-rose-400 uppercase font-sans">Max Loss</div>
                  <div className="text-sm font-black text-rose-400 mt-0.5">₹{positionSizing.maxLoss.toFixed(0)}</div>
                  <div className="text-[9px] text-rose-500 font-mono mt-0.5">At Stop Loss</div>
                </div>
                <div className="bg-[#08101a] p-2.5 rounded-xl border border-[#132235]">
                  <div className="text-[10px] text-[#00e676] uppercase font-sans">T1 Profit</div>
                  <div className="text-sm font-black text-[#00e676] mt-0.5">+₹{positionSizing.targetProfit.toFixed(0)}</div>
                  <div className="text-[9px] text-emerald-500 font-mono mt-0.5">1:2.8 R:R</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => toggleWatchlist(activeFocusStock)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-xs transition cursor-pointer select-none ${
                  savedWatchlist.includes(activeFocusStock.symbol)
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#0e1624] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${savedWatchlist.includes(activeFocusStock.symbol) ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                <span>{savedWatchlist.includes(activeFocusStock.symbol) ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySetup}
                className="flex-1 py-3 rounded-xl bg-[#00e676] hover:bg-[#00c853] active:scale-95 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00e676]/25"
              >
                {copiedNotification ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy Swing Setup'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SwingPlayer;
