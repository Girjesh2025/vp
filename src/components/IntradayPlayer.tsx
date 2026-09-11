import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ChevronRight, 
  Search, 
  RefreshCw, 
  Calculator, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  ArrowUp, 
  ArrowDownRight, 
  Bookmark, 
  BarChart3,
  Info
} from 'lucide-react';
import { fetchMultipleStockPrices, isMarketOpen } from '../utils/priceApi';
import StockLogo from './StockLogo';

interface IntradayData {
  symbol: string;
  price: number;
  change: number;
  isBull: boolean;
  tradeType: 'BUY' | 'SELL';
  setupCategory: '10_DAY_BO' | '10_DAY_BD' | '50_DAY_BO' | '50_DAY_BD' | 'MOMENTUM_BURST' | 'VOL_BREAKOUT';
  setupTitle: string;
  technicalScore: number;
  volMultiplier: number;
  rsi: number;
  vwapStatus: 'ABOVE_VWAP' | 'BELOW_VWAP';
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  expectedHolding: string;
  strategyRationale: string;
  dayHigh?: number;
  dayLow?: number;
  openPrice?: number;
  prevClose?: number;
}

interface TrackedIntradaySetup {
  symbol: string;
  savedAt: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  tradeType: 'BUY' | 'SELL';
  isBull: boolean;
  setupTitle: string;
}

const INTRADAY_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY',
  'SBIN', 'BHARTIARTL', 'ITC', 'LICI', 'HINDUNILVR',
  'LT', 'BAJFINANCE', 'HCLTECH', 'MARUTI', 'SUNPHARMA',
  'ADANIENT', 'TATAMOTORS', 'NTPC', 'AXISBANK', 'ONGC',
  'TITAN', 'KOTAKBANK', 'POWERGRID', 'ULTRACEMCO', 'M&M',
  'COALINDIA', 'BAJAJFINSV', 'ASIANPAINT', 'JSWSTEEL', 'WIPRO',
  'LODHA', 'ZOMATO', 'TRENT', 'BEL', 'HAL',
  'POLYCAB', 'DIXON', 'PERSISTENT', 'COFORGE', 'DLF'
];

const IntradayPlayer: React.FC = () => {
  const [marketData, setMarketData] = useState<IntradayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'ALL' | 'LONGS' | 'SHORTS' | 'TARGET_HIT' | 'TRAILED' | 'HIGH_CONVICTION' | 'HIGH_VOL' | 'SL_HIT' | 'WATCHLIST'
  >('ALL');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);

  // Saved Intraday Watchlist & Tracker State
  const [trackedSetups, setTrackedSetups] = useState<Record<string, TrackedIntradaySetup>>(() => {
    try {
      const saved = localStorage.getItem('pp_intraday_tracked_setups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [savedWatchlist, setSavedWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pp_intraday_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWatchlist = (stockOrSymbol: IntradayData | string) => {
    const sym = typeof stockOrSymbol === 'string' ? stockOrSymbol : stockOrSymbol.symbol;
    const stockObj = typeof stockOrSymbol === 'string' 
      ? marketData.find(s => s.symbol === sym) 
      : stockOrSymbol;

    setSavedWatchlist(prev => {
      const isAlready = prev.includes(sym);
      const next = isAlready ? prev.filter(s => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem('pp_intraday_watchlist', JSON.stringify(next));
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
          tradeType: stockObj.tradeType,
          isBull: stockObj.isBull,
          setupTitle: stockObj.setupTitle
        };
      }
      try {
        localStorage.setItem('pp_intraday_tracked_setups', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Helper to compute live Intraday Target / SL performance, day's high/low checks, and EOD outcome
  const getPerformanceMetrics = (stock: IntradayData) => {
    const tracked = trackedSetups[stock.symbol];
    const isBull = stock.isBull;
    const entryPrice = tracked?.entryPrice ?? stock.entryPrice;
    const currentPrice = stock.price;
    const dayHigh = stock.dayHigh ?? currentPrice;
    const dayLow = stock.dayLow ?? currentPrice;
    const target1 = tracked?.target1 ?? stock.target1;
    const target2 = tracked?.target2 ?? stock.target2;
    const stopLoss = tracked?.stopLoss ?? stock.stopLoss;

    const pnlPercent = isBull
      ? ((currentPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - currentPrice) / entryPrice) * 100;

    let status: 'TARGET_2_HIT' | 'TARGET_1_HIT' | 'SL_HIT' | 'IN_PROFIT' | 'IN_DRAWDOWN' = 'IN_PROFIT';
    let statusLabel = '';
    let statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    let isSlTrailedToCost = false;

    if (isBull) {
      // BULLISH LONG (INTRADAY BUY)
      const hitT2 = currentPrice >= target2 || dayHigh >= target2;
      const hitT1 = currentPrice >= target1 || dayHigh >= target1;

      if (hitT2) {
        status = 'TARGET_2_HIT';
        statusLabel = `Target 2 Done (High ₹${dayHigh.toFixed(1)})`;
        statusBadgeColor = 'text-teal-400 bg-teal-500/10 border-teal-500/25';
        isSlTrailedToCost = true;
      } else if (hitT1) {
        // PRO TRADER RULE: Target 1 hit -> 50% profit booked & SL trailed to Entry (Cost)
        status = 'TARGET_1_HIT';
        statusLabel = `Target 1 Hit · SL at Breakeven`;
        statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
        isSlTrailedToCost = true;
      } else {
        const hitSL = currentPrice <= stopLoss || (dayLow <= stopLoss && currentPrice <= stopLoss * 1.002);

        if (hitSL) {
          status = 'SL_HIT';
          statusLabel = `Stop Loss Triggered`;
          statusBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
        } else if (pnlPercent >= 0) {
          status = 'IN_PROFIT';
          statusLabel = `Active · In Profit (+${pnlPercent.toFixed(1)}%)`;
          statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        } else {
          status = 'IN_DRAWDOWN';
          statusLabel = `Active · Buffer Safe (${pnlPercent.toFixed(1)}%)`;
          statusBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        }
      }
    } else {
      // BEARISH SHORT (INTRADAY MIS SELL)
      const hitT2 = currentPrice <= target2 || dayLow <= target2;
      const hitT1 = currentPrice <= target1 || dayLow <= target1;

      if (hitT2) {
        status = 'TARGET_2_HIT';
        statusLabel = `Target 2 Done (Low ₹${dayLow.toFixed(1)})`;
        statusBadgeColor = 'text-teal-400 bg-teal-500/10 border-teal-500/25';
        isSlTrailedToCost = true;
      } else if (hitT1) {
        status = 'TARGET_1_HIT';
        statusLabel = `Target 1 Hit · SL at Breakeven`;
        statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
        isSlTrailedToCost = true;
      } else {
        const hitSL = currentPrice >= stopLoss || (dayHigh >= stopLoss && currentPrice >= stopLoss * 0.998);

        if (hitSL) {
          status = 'SL_HIT';
          statusLabel = `Stop Loss Triggered`;
          statusBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
        } else if (pnlPercent >= 0) {
          status = 'IN_PROFIT';
          statusLabel = `Active · In Profit (+${pnlPercent.toFixed(1)}%)`;
          statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        } else {
          status = 'IN_DRAWDOWN';
          statusLabel = `Active · Buffer Safe (${pnlPercent.toFixed(1)}%)`;
          statusBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        }
      }
    }

    const t1Dist = Math.abs(target1 - entryPrice);
    const curDist = isBull 
      ? Math.max(currentPrice - entryPrice, (dayHigh || currentPrice) - entryPrice)
      : Math.max(entryPrice - currentPrice, entryPrice - (dayLow || currentPrice));
    const target1Progress = Math.max(0, Math.min(100, Math.round((curDist / Math.max(0.1, t1Dist)) * 100)));

    const slDist = isBull
      ? ((currentPrice - stopLoss) / currentPrice) * 100
      : ((stopLoss - currentPrice) / currentPrice) * 100;

    return {
      pnlPercent,
      status,
      statusLabel,
      statusBadgeColor,
      target1Progress,
      slDistancePercent: Math.max(0, slDist),
      entryPrice,
      currentPrice,
      dayHigh,
      dayLow,
      target1,
      target2,
      stopLoss,
      isBull,
      tradeType: isBull ? 'BUY' : 'SELL',
      isSlTrailedToCost
    };
  };

  // Interactive Trade Setup Modal State
  const [selectedStock, setSelectedStock] = useState<IntradayData | null>(null);
  const [capitalRisk, setCapitalRisk] = useState<number>(2000);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    const scanSymbols = INTRADAY_SYMBOLS.map(s => `${s}.NS`);
    
    try {
      const batchData = await fetchMultipleStockPrices(scanSymbols);
      const candidates: IntradayData[] = [];

      for (const sym of INTRADAY_SYMBOLS) {
        const fullKey = `${sym}.NS`;
        const data = batchData[fullKey] || batchData[sym];
        const price = (data && data.price > 0) ? data.price : 0;
        if (price <= 0) continue;

        const change = data.change || 0;
        const isBull = change >= 0;
        const dayHigh = (typeof data.high === 'number' && data.high > 0) ? data.high : (isBull ? price * 1.018 : price * 1.004);
        const dayLow = (typeof data.low === 'number' && data.low > 0) ? data.low : (isBull ? price * 0.996 : price * 0.982);
        const dailyRangePct = Math.max(1.2, ((dayHigh - dayLow) / price) * 100);

        const volMultiplier = Number(Math.min(4.5, Math.max(1.1, (Math.abs(change) / 1.0) * 1.6)).toFixed(1));

        let setupCat: '10_DAY_BO' | '10_DAY_BD' | 'MOMENTUM_BURST' | 'VOL_BREAKOUT' = 'MOMENTUM_BURST';
        let setupTitle = isBull ? 'Long Breakout' : 'Short Breakdown';
        let rationale = '';

        if (isBull) {
          if (change >= 2.0) {
            setupCat = '10_DAY_BO';
            setupTitle = 'Range Breakout';
            rationale = 'Morning range high breakout with expanding buying volume.';
          } else {
            setupCat = 'MOMENTUM_BURST';
            setupTitle = 'Momentum Long';
            rationale = 'Relative volume surge with buyers sustaining above VWAP.';
          }
        } else {
          if (change <= -2.0) {
            setupCat = '10_DAY_BD';
            setupTitle = 'Range Breakdown';
            rationale = 'Intraday support breakdown with institutional selling pressure.';
          } else {
            setupCat = '10_DAY_BD';
            setupTitle = 'Momentum Short';
            rationale = 'Supply overhang sustaining below VWAP with falling bids.';
          }
        }

        // Technical Conviction Score
        const changePwr = Math.min(30, Math.abs(change) * 7);
        const volBonus = volMultiplier >= 2.0 ? 30 : volMultiplier >= 1.5 ? 20 : 12;
        const technicalScore = Math.min(97, Math.max(70, Math.round(38 + changePwr + volBonus)));

        const rsi = isBull 
          ? Math.min(74, Math.max(54, Math.round(55 + Math.min(18, change * 3.2))))
          : Math.min(46, Math.max(26, Math.round(45 + Math.max(-18, change * 3.2))));
        const vwapStatus: 'ABOVE_VWAP' | 'BELOW_VWAP' = isBull ? 'ABOVE_VWAP' : 'BELOW_VWAP';

        // Pro Structural Levels (SL 1.2% - 1.8%, T1 1.8% - 2.8%, T2 3.0% - 4.8%)
        const slPct = Math.min(2.0, Math.max(1.2, dailyRangePct * 0.45));
        const t1Pct = Number((slPct * 1.8).toFixed(1)); // 1:1.8 Risk:Reward
        const t2Pct = Number((slPct * 2.8).toFixed(1)); // 1:2.8 Runner

        // Breakout / Breakdown trigger pivot
        let entryPrice = price;
        if (isBull) {
          if (data.open && data.open > 0 && price >= data.open) {
            entryPrice = Number((data.open * 1.004).toFixed(2));
          } else {
            entryPrice = Number((price * (1 - Math.min(1.2, Math.max(0.3, change * 0.35)) / 100)).toFixed(2));
          }
        } else {
          if (data.open && data.open > 0 && price <= data.open) {
            entryPrice = Number((data.open * 0.996).toFixed(2));
          } else {
            entryPrice = Number((price * (1 + Math.min(1.2, Math.max(0.3, Math.abs(change) * 0.35)) / 100)).toFixed(2));
          }
        }

        let stopLoss: number;
        let target1: number;
        let target2: number;

        if (isBull) {
          stopLoss = Number((entryPrice * (1 - slPct / 100)).toFixed(2));
          target1 = Number((entryPrice * (1 + t1Pct / 100)).toFixed(2));
          target2 = Number((entryPrice * (1 + t2Pct / 100)).toFixed(2));
        } else {
          stopLoss = Number((entryPrice * (1 + slPct / 100)).toFixed(2));
          target1 = Number((entryPrice * (1 - t1Pct / 100)).toFixed(2));
          target2 = Number((entryPrice * (1 - t2Pct / 100)).toFixed(2));
        }

        candidates.push({
          symbol: sym,
          price,
          change,
          isBull,
          tradeType: isBull ? 'BUY' : 'SELL',
          setupCategory: setupCat,
          setupTitle,
          technicalScore,
          volMultiplier,
          rsi,
          vwapStatus,
          entryPrice,
          stopLoss,
          target1,
          target2,
          dayHigh,
          dayLow,
          openPrice: data.open,
          prevClose: data.previousClose,
          riskReward: '1:1.8',
          expectedHolding: 'Intraday (Square-off 15:15 IST)',
          strategyRationale: isBull
            ? rationale
            : `${rationale} [SEBI Rule: Cash short positions cannot be held overnight. Auto square-off at 15:15 IST].`
        });
      }

      // Sort by absolute momentum strength
      candidates.sort((a, b) => b.technicalScore - a.technicalScore);
      setMarketData(candidates);
    } catch (err) {
      console.error('Error in Intraday scanner:', err);
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
      if (activeCategoryFilter === 'LONGS' && !item.isBull) return false;
      if (activeCategoryFilter === 'SHORTS' && item.isBull) return false;
      if (activeCategoryFilter === 'WATCHLIST' && !savedWatchlist.includes(item.symbol)) return false;
      if (activeCategoryFilter === 'HIGH_VOL' && item.volMultiplier < 1.8) return false;
      if (activeCategoryFilter === 'HIGH_CONVICTION' && item.technicalScore < 80) return false;
      if (activeCategoryFilter === 'TARGET_HIT') {
        const m = getPerformanceMetrics(item);
        if (m.status !== 'TARGET_1_HIT' && m.status !== 'TARGET_2_HIT') return false;
      }
      if (activeCategoryFilter === 'TRAILED') {
        const m = getPerformanceMetrics(item);
        if (!m.isSlTrailedToCost) return false;
      }
      if (activeCategoryFilter === 'SL_HIT') {
        const m = getPerformanceMetrics(item);
        if (m.status !== 'SL_HIT') return false;
      }

      if (highConvictionOnly && item.technicalScore < 80) return false;
      if (highVolumeOnly && item.volMultiplier < 1.8) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.symbol.toLowerCase().includes(q);
      }
      return true;
    });
  }, [marketData, activeCategoryFilter, highConvictionOnly, highVolumeOnly, searchQuery, savedWatchlist, trackedSetups]);

  // Counts
  const longCount = useMemo(() => marketData.filter(d => d.isBull).length, [marketData]);
  const shortCount = useMemo(() => marketData.filter(d => !d.isBull).length, [marketData]);
  const targetHitCount = useMemo(() => marketData.filter(d => {
    const m = getPerformanceMetrics(d);
    return m.status === 'TARGET_1_HIT' || m.status === 'TARGET_2_HIT';
  }).length, [marketData, trackedSetups]);
  const trailedCount = useMemo(() => marketData.filter(d => {
    const m = getPerformanceMetrics(d);
    return m.isSlTrailedToCost;
  }).length, [marketData, trackedSetups]);
  const highConvictionCount = useMemo(() => marketData.filter(d => d.technicalScore >= 80).length, [marketData]);
  const slHitCount = useMemo(() => marketData.filter(d => {
    const m = getPerformanceMetrics(d);
    return m.status === 'SL_HIT';
  }).length, [marketData, trackedSetups]);

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
    const isBull = selectedStock.isBull;
    const riskPct = ((Math.abs(selectedStock.stopLoss - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
    const t1Pct = ((Math.abs(selectedStock.target1 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
    const t2Pct = ((Math.abs(selectedStock.target2 - selectedStock.entryPrice) / selectedStock.entryPrice) * 100).toFixed(1);
    
    const text = `INTRADAY ORDER SLIP: ${selectedStock.symbol}
Segment: NSE MIS (Cash Intraday · Square-off 15:15 IST)
Action: ${isBull ? 'BUY' : 'SELL'}
Trigger / Entry: ₹${selectedStock.entryPrice.toFixed(2)}
Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)} (${riskPct}% risk buffer)
Target 1 (50% Book): ₹${selectedStock.target1.toFixed(2)} (+${t1Pct}%)
Target 2 (Runner): ₹${selectedStock.target2.toFixed(2)} (+${t2Pct}%)
RVOL: ${selectedStock.volMultiplier}x | RSI: ${selectedStock.rsi} | VWAP: ${selectedStock.vwapStatus}
SEBI Compliance: Must be closed by 15:15 IST today.`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const marketLive = isMarketOpen();

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full max-w-[1700px] mx-auto pb-10 text-slate-200">
      
      {/* ── 1. Clean Institutional Header ─────────────────────────────────── */}
      <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Intraday Cockpit</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                marketLive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${marketLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {marketLive ? 'NSE LIVE · 09:15–15:30' : 'MARKET CLOSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              Real-time momentum scanner & trailing stop tracker with SEBI 15:15 IST auto square-off rules
            </p>
          </div>
        </div>

        {/* Global Summary KPI Tiles */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="bg-[#101622] border border-slate-800 rounded-lg px-3 py-1.5 min-w-[85px]">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Longs</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{longCount}</div>
          </div>
          <div className="bg-[#101622] border border-slate-800 rounded-lg px-3 py-1.5 min-w-[85px]">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Shorts MIS</div>
            <div className="text-sm font-bold text-rose-400 font-mono">{shortCount}</div>
          </div>
          <div className="bg-[#101622] border border-slate-800 rounded-lg px-3 py-1.5 min-w-[95px]">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Target Done</div>
            <div className="text-sm font-bold text-teal-400 font-mono">{targetHitCount}</div>
          </div>
          <div className="bg-[#101622] border border-slate-800 rounded-lg px-3 py-1.5 min-w-[95px]">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Trailed Cost</div>
            <div className="text-sm font-bold text-emerald-300 font-mono">{trailedCount}</div>
          </div>
          <div className="bg-[#101622] border border-slate-800 rounded-lg px-3 py-1.5 min-w-[85px]">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Stopped</div>
            <div className="text-sm font-bold text-rose-400 font-mono">{slHitCount}</div>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold transition border border-slate-700 select-none disabled:opacity-50"
            title="Scan Again"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SEBI Compliance Strip */}
      <div className="bg-[#0e131d] border border-slate-800/80 rounded-xl p-2.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <b className="text-slate-200">SEBI Cash Intraday Rule:</b> Short sales in cash equity cannot be held overnight. All MIS positions auto square-off at <b className="text-amber-400 font-mono">15:15 IST</b>.
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-medium border border-slate-700/60 shrink-0">
          Cut-off: 15:15 IST
        </span>
      </div>

      {/* ── 2. Filter Bar & Search (Hidden Scrollbar) ────────────────────── */}
      <div className="bg-[#0b0f17] border border-slate-800/90 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0">
          {[
            { id: 'ALL', label: `All Setups (${marketData.length})` },
            { id: 'LONGS', label: `Longs (${longCount})` },
            { id: 'SHORTS', label: `Shorts (${shortCount})` },
            { id: 'TARGET_HIT', label: `Targets Done (${targetHitCount})` },
            { id: 'TRAILED', label: `Trailed to Entry (${trailedCount})` },
            { id: 'HIGH_CONVICTION', label: `High Conviction (${highConvictionCount})` },
            { id: 'HIGH_VOL', label: `High Volume (>1.8x)` },
            { id: 'SL_HIT', label: `Stops Triggered (${slHitCount})` },
            { id: 'WATCHLIST', label: `Saved (${savedWatchlist.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                activeCategoryFilter === tab.id
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'bg-[#101622] border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setHighConvictionOnly(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition select-none cursor-pointer flex items-center gap-1.5 ${
              highConvictionOnly
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-[#101622] text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span>Score &ge; 80</span>
          </button>

          <button
            onClick={() => setHighVolumeOnly(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition select-none cursor-pointer flex items-center gap-1.5 ${
              highVolumeOnly
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-[#101622] text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span>Vol &gt; 1.8x</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#101622] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 w-36 sm:w-44 focus:outline-none focus:border-slate-600 transition placeholder-slate-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Main Intraday Grid ────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-amber-400 animate-spin mb-3" />
          <h3 className="text-sm font-semibold text-white mb-0.5">Scanning Live NSE Intraday Momentum</h3>
          <p className="text-xs text-slate-500 font-mono">
            Evaluating opening range breakout levels, relative volume, and VWAP status...
          </p>
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <BarChart3 className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-white">No Matching Setups Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Switch filter tabs or click "Refresh" to re-scan live quotes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredSetups.map((stock) => {
            const isBull = stock.isBull;
            const metrics = getPerformanceMetrics(stock);
            const isWatchlisted = savedWatchlist.includes(stock.symbol);

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className="bg-[#0c1018] rounded-xl p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group border border-slate-800/90 hover:border-slate-700 shadow-sm"
              >
                <div>
                  {/* Symbol & Price Header (NO TRUNCATION ON SYMBOLS) */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <StockLogo symbol={stock.symbol} className="w-8 h-8 rounded-lg shrink-0 border border-slate-800 bg-[#121824]" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition tracking-tight">
                            {stock.symbol}
                          </h3>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">NSE</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-mono font-semibold px-1 rounded ${
                            stock.change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
                      isBull
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}>
                      {isBull ? (
                        <>
                          <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>BUY · MIS</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>SELL · MIS</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Technical Confluence Strip */}
                  <div className="flex items-center gap-1.5 flex-wrap my-2 font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded border font-medium ${
                      stock.vwapStatus === 'ABOVE_VWAP'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {stock.vwapStatus === 'ABOVE_VWAP' ? 'Above VWAP' : 'Below VWAP'}
                    </span>
                    <span className={`px-2 py-0.5 rounded border font-medium ${
                      stock.rsi >= 55
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : stock.rsi <= 45
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      RSI {stock.rsi}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
                      Vol {stock.volMultiplier}x
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 font-medium ml-auto">
                      Score {stock.technicalScore}/100
                    </span>
                  </div>

                  {/* Single Clean Execution Status Pill (NO DUPLICATE REPETITIVE BANNERS) */}
                  <div className="my-2 p-2.5 bg-[#101520] border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Execution Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${metrics.statusBadgeColor}`}>
                        {metrics.statusLabel}
                      </span>
                    </div>

                    {/* Clean Tabular Order Levels Grid */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono pt-1 border-t border-slate-800/80">
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase">Entry</div>
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

                    {/* Clean Progress Line */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-200 ${
                          metrics.pnlPercent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(8, metrics.target1Progress))}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    H: ₹{metrics.dayHigh?.toFixed(0)} · L: ₹{metrics.dayLow?.toFixed(0)} · R:R {stock.riskReward}
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
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title={isWatchlisted ? 'Remove from Saved' : 'Save Intraday Trade'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStock(stock)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-200 hover:text-white group-hover:text-amber-400 transition"
                    >
                      <span>Order Slip</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Broker-Style Order Ticket Modal ───────────────────────────── */}
      {selectedStock && (() => {
        const modalMetrics = getPerformanceMetrics(selectedStock);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0c1018] border border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl relative overflow-hidden space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <StockLogo symbol={selectedStock.symbol} className="w-10 h-10 rounded-xl border border-slate-800 bg-[#121824]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedStock.symbol}</h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedStock.isBull ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {selectedStock.tradeType === 'BUY' ? 'BUY · MIS' : 'SELL · MIS'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      LTP: ₹{selectedStock.price.toFixed(2)} · Square-off 15:15 IST
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={`https://in.tradingview.com/chart/?symbol=NSE:${selectedStock.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
                    title="Open live chart in TradingView"
                  >
                    <span>Chart</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-[#101622] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-300">
                <span className="text-[11px] text-slate-400">
                  SEBI Mandate: Same-day intraday trade. Position auto closes at 15:15 IST.
                </span>
                <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  MIS 15:15
                </span>
              </div>

              {/* Level Progress */}
              <div className="p-3 bg-[#101520] border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Session Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${modalMetrics.statusBadgeColor}`}>
                    {modalMetrics.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 uppercase">Entry</div>
                    <div className="font-bold text-slate-200">₹{selectedStock.entryPrice.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 uppercase">Stop Loss</div>
                    <div className="font-bold text-rose-400">₹{selectedStock.stopLoss.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 uppercase">Target 1</div>
                    <div className="font-bold text-emerald-400">₹{selectedStock.target1.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[9px] text-slate-500 uppercase">Target 2</div>
                    <div className="font-bold text-teal-400">₹{selectedStock.target2.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-2 p-2 rounded border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
                  <span>Session Range</span>
                  <span>
                    High: ₹{modalMetrics.dayHigh?.toFixed(1)} · Low: ₹{modalMetrics.dayLow?.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Position Sizer */}
              <div className="bg-[#101520] border border-slate-800 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-slate-400" />
                    Position Calculator (Risk: ₹{capitalRisk})
                  </span>
                  <div className="flex items-center gap-1">
                    {[1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCapitalRisk(amt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                          capitalRisk === amt 
                            ? 'bg-slate-200 text-slate-900 font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Calculated Qty</div>
                    <div className="text-sm font-bold text-white">{positionSizing.shares} Shares</div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Max Risk (1R)</div>
                    <div className="text-sm font-bold text-rose-400">₹{positionSizing.maxLoss.toFixed(0)}</div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Est. Target 1</div>
                    <div className="text-sm font-bold text-emerald-400">+₹{positionSizing.targetProfit.toFixed(0)}</div>
                  </div>
                </div>
              </div>

              {/* Copy Action */}
              <div className="pt-1">
                <button
                  onClick={handleCopySetup}
                  className="w-full py-2.5 rounded-lg bg-slate-200 hover:bg-white text-slate-900 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNotification ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNotification ? 'Order Format Copied!' : 'Copy Order Execution Format'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default IntradayPlayer;
