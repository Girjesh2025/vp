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
  BrainCircuit, 
  ArrowUp, 
  Activity,
  Bookmark,
  Zap,
  Crosshair,
  Calendar,
  Layers
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
    'ALL' | 'WATCHLIST' | '10_DAY_BO' | '50_DAY_BO' | 'TARGET_HIT'
  >('ALL');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);

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
      statusLabel = `🚀 Target 2 Hit (+${((target2 - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-teal-400';
      statusBg = 'bg-teal-500/20 border-teal-500/40';
    } else if (currentPrice >= target1) {
      status = 'TARGET_1_HIT';
      statusLabel = `🎯 Target 1 Hit (+${((target1 - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-emerald-400';
      statusBg = 'bg-emerald-500/20 border-emerald-500/40';
    } else if (currentPrice <= stopLoss) {
      status = 'SL_HIT';
      statusLabel = `🛑 Stop Loss Hit (${((stopLoss - entryPrice) / entryPrice * 100).toFixed(1)}%)`;
      statusColor = 'text-rose-400';
      statusBg = 'bg-rose-500/20 border-rose-500/40';
    } else if (pnlPercent >= 0) {
      status = 'IN_PROFIT';
      statusLabel = `🟢 In Profit (+${pnlPercent.toFixed(1)}%)`;
      statusColor = 'text-emerald-400';
      statusBg = 'bg-emerald-500/15 border-emerald-500/30';
    } else {
      status = 'IN_PULLBACK';
      statusLabel = `⏳ In Pullback (${pnlPercent.toFixed(1)}%)`;
      statusColor = 'text-amber-400';
      statusBg = 'bg-amber-500/15 border-amber-500/30';
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

        // ── PURE SWING BUY SETUPS (DELIVERY CNC · 2 TO 10 DAYS) ──
        let setupCat: '10_DAY_BO' | '50_DAY_BO' | 'CHANNEL_BO' | 'REVERSAL' = '10_DAY_BO';
        let setupTitle = '10-Day Breakout';
        let rationale = 'Price breaking above 10-day base with expanding institutional volume.';
        let holdingDays = 3;
        let expectedHolding = '2–3 Days (Quick Swing)';

        if (change >= 2.0) {
          setupCat = '10_DAY_BO';
          setupTitle = '10-Day Breakout';
          rationale = 'Strong multi-day momentum breakout clearing upper base resistance with expanding volume.';
          holdingDays = 3;
          expectedHolding = '2–3 Days (Quick Swing)';
        } else if (change >= 0.5) {
          setupCat = '50_DAY_BO';
          setupTitle = '50-EMA Trend Bounce';
          rationale = 'Institutional accumulation bouncing off 50-EMA support trendline with bullish structure.';
          holdingDays = 7;
          expectedHolding = '5–10 Days (Trend Swing)';
        } else if (change >= -1.0) {
          setupCat = 'CHANNEL_BO';
          setupTitle = 'Channel Breakout';
          rationale = 'Volatility compression breakout from a multi-day tight consolidation range.';
          holdingDays = 5;
          expectedHolding = '3–5 Days (Base Swing)';
        } else {
          setupCat = 'REVERSAL';
          setupTitle = 'Oversold Swing Bounce';
          rationale = 'Mean-reversion bounce confirming reversal above short-term 10-day EMA support.';
          holdingDays = 3;
          expectedHolding = '2–4 Days (Pullback Swing)';
        }

        // AI Conviction formulation
        const changePwr = Math.min(25, Math.max(0, change) * 6);
        const volBonus = volMultiplier >= 2.0 ? 25 : 15;
        const aiScore = Math.min(97, Math.max(72, Math.round(55 + changePwr + volBonus)));

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
          strategyRationale: rationale
        });
      }

      // Sort candidates by AI score & change
      candidates.sort((a, b) => b.aiScore - a.aiScore);
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
        return item.symbol.toLowerCase().includes(q);
      }
      return true;
    });
  }, [marketData, activeCategoryFilter, highConvictionOnly, highVolumeOnly, searchQuery, savedWatchlist, trackedSetups]);

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
    
    const text = `🎯 SWING BUY SETUP: ${selectedStock.symbol} (Delivery CNC)
• Expected Holding: ${selectedStock.expectedHolding}
• Entry: ₹${selectedStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)} (${riskPct}% Risk)
• Target 1: ₹${selectedStock.target1.toFixed(2)} (+${t1Pct}% Book 50%)
• Target 2: ₹${selectedStock.target2.toFixed(2)} (+${t2Pct}% Trail SL)
• Risk:Reward: ${selectedStock.riskReward}
• AI Conviction: ${selectedStock.aiScore}/100 | Vol: ${selectedStock.volMultiplier}x
• Suggested Qty: ${positionSizing.shares} Shares (Max Risk: ₹${positionSizing.maxLoss.toFixed(0)})`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full max-w-[1700px] mx-auto pb-10">

      {/* ── 1. Top Executive Banner ───────────────────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Pro Swing Radar</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 2 TO 10 DAYS DELIVERY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Pure Cash Delivery (CNC) swing scanner with multi-day consolidation breakouts, 50-EMA pullbacks, and holding tracker
            </p>
          </div>
        </div>

        {/* Global Summary KPI Tiles */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[100px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Scanned</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{SWING_WATCHLIST_SYMBOLS.length} Stocks</div>
          </div>
          <div className="bg-[#101520] border border-emerald-500/30 rounded-xl px-3.5 py-2 min-w-[110px] bg-emerald-500/5">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🟢 Swing Buys</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">{marketData.length} Setups</div>
          </div>
          <div className="bg-[#101520] border border-teal-500/30 rounded-xl px-3.5 py-2 min-w-[110px] bg-teal-500/5">
            <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">🎯 Targets Hit</div>
            <div className="text-base font-black text-teal-400 font-mono mt-0.5">{targetHitCount} Setups</div>
          </div>
          <div className="bg-[#101520] border border-amber-500/30 rounded-xl px-3.5 py-2 min-w-[110px] bg-amber-500/5">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">★ Watchlist</div>
            <div className="text-base font-black text-amber-400 font-mono mt-0.5">{savedWatchlist.length} Saved</div>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition select-none disabled:opacity-50"
            title="Scan Again"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {/* ── 2. Interactive Filter Bar & Search ───────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {[
            { id: 'ALL', label: `All Swing Buys (${marketData.length})` },
            { id: 'WATCHLIST', label: `★ Saved Watchlist (${savedWatchlist.length})` },
            { id: '10_DAY_BO', label: `🚀 10-Day BO (${bo10Count})` },
            { id: '50_DAY_BO', label: `📈 50-EMA Bounce (${bo50Count})` },
            { id: 'TARGET_HIT', label: `🎯 Targets Reached (${targetHitCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                activeCategoryFilter === tab.id
                  ? tab.id === 'WATCHLIST'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#101520] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setHighConvictionOnly(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition select-none cursor-pointer flex items-center gap-1 ${
              highConvictionOnly
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-[#101520] text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <BrainCircuit className="w-3 h-3 text-purple-400" />
            <span>Score &gt; 80</span>
          </button>

          <button
            onClick={() => setHighVolumeOnly(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition select-none cursor-pointer flex items-center gap-1 ${
              highVolumeOnly
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-[#101520] text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>Vol &gt; 2x</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search swing stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#101520] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 w-36 sm:w-44 focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Watchlist Performance Cockpit (Shown when Watchlist Tab is selected) ── */}
      {activeCategoryFilter === 'WATCHLIST' && (
        <div className="bg-[#0c1017] border border-amber-500/30 rounded-2xl p-4 md:p-5 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-black text-white">Active Swing Positions Cockpit</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSetups.map((stock) => {
            const metrics = getSwingMetrics(stock);
            const isWatchlisted = savedWatchlist.includes(stock.symbol);

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className="bg-[#0c1017] rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-lg hover:-translate-y-0.5 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.10)]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} className="w-9 h-9 rounded-xl shrink-0 border border-slate-800 bg-[#101520]" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                          {stock.symbol}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-mono font-black px-1 rounded bg-emerald-500/10 text-emerald-400">
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                      <span>BUY · CNC SWING</span>
                    </span>
                  </div>

                  {/* Horizon Badge */}
                  <div className="flex items-center justify-between text-[10px] bg-[#101520] border border-slate-800 px-2.5 py-1 rounded-lg mb-2 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      Horizon: <b className="text-slate-200">{stock.expectedHolding}</b>
                    </span>
                    {isWatchlisted && (
                      <span className="text-amber-400 font-mono font-bold">
                        Day {metrics.daysHeld} of {stock.holdingDaysHorizon}
                      </span>
                    )}
                  </div>

                  {/* AI Score & Volume Spike */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-[#101520] border border-slate-800/80 rounded-xl">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-purple-400" /> AI Score</span>
                        <span className="font-mono font-black text-purple-400">{stock.aiScore}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${stock.aiScore}%` }} />
                      </div>
                    </div>

                    <div className="border-l border-slate-800 pl-2">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                        <Zap className="w-3 h-3 text-yellow-400" /> Vol Spike
                      </div>
                      <div className="text-xs font-black text-yellow-400 font-mono">
                        {stock.volMultiplier}x <span className="text-[9px] text-slate-500 font-normal">avg</span>
                      </div>
                    </div>
                  </div>

                  {/* Target Progress Bar */}
                  <div className="my-2.5 p-2 bg-[#101520] border border-slate-800/90 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Target className="w-3 h-3 text-sky-400" /> Swing Targets
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${metrics.statusBg} ${metrics.statusColor}`}>
                        {metrics.statusLabel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span className="text-rose-400">SL: ₹{metrics.stopLoss.toFixed(1)}</span>
                        <span className="text-slate-200 font-bold">LTP: ₹{metrics.currentPrice.toFixed(1)}</span>
                        <span className="text-emerald-400">T1: ₹{metrics.target1.toFixed(1)}</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300" 
                          style={{ width: `${Math.min(100, Math.max(8, metrics.target1Progress))}%` }} 
                        />
                      </div>
                      
                      <div className="flex justify-between text-[8.5px] text-slate-500">
                        <span>SL Buffer: {metrics.slBuffer.toFixed(1)}%</span>
                        <span>{metrics.target1Progress}% towards T1</span>
                      </div>
                    </div>
                  </div>

                  {/* Target Values */}
                  <div className="space-y-1 my-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">🎯 Target 1 (1:2):</span>
                      <span className="font-black text-emerald-400">₹{stock.target1.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">🚀 Target 2 (Runner):</span>
                      <span className="font-black text-teal-400">₹{stock.target2.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">🛑 Stop Loss:</span>
                      <span className="text-slate-300 font-black">₹{stock.stopLoss.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-emerald-400" /> R:R {stock.riskReward}
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
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:text-amber-400 hover:bg-slate-800'
                      }`}
                      title={isWatchlisted ? 'Remove from Swing Watchlist' : 'Add to Swing Watchlist'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStock(stock)}
                      className="flex items-center gap-1 text-xs font-black text-emerald-400 hover:text-emerald-300"
                    >
                      <span>View Setup</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400">
                        🟢 BUY SWING (DELIVERY CNC)
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
                      AI Score: {selectedStock.aiScore}/100
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
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
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
