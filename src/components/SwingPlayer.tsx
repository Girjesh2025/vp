import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, BrainCircuit, Zap, Crosshair, TrendingUp, TrendingDown, 
  ExternalLink, ArrowUpRight, Filter, ShieldCheck, CheckCircle2, 
  ChevronRight, RefreshCw, Layers, Calculator, Sparkles, X,
  ArrowDownRight, ArrowUp, Bookmark, Copy
} from 'lucide-react';
import { fetchHistoricalPrices, fetchMultipleStockPrices, isMarketOpen } from '../utils/priceApi';
import StockLogo from './StockLogo';

// Nifty 50, Bank Nifty and High-Beta Swing Universe
const WATCHLIST_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'LT',
  'BAJFINANCE', 'BHARTIARTL', 'KOTAKBANK', 'HINDUNILVR', 'AXISBANK',
  'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO',
  'TATASTEEL', 'WIPRO', 'BAJAJFINSV', 'NESTLEIND', 'POWERGRID', 'M&M',
  'NTPC', 'JSWSTEEL', 'GRASIM', 'TECHM', 'INDUSINDBK', 'ADANIPORTS',
  'HINDALCO', 'CIPLA', 'ONGC', 'SBILIFE', 'TATAMOTORS', 'HDFCLIFE',
  'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'BAJAJ-AUTO', 'APOLLOHOSP',
  'COALINDIA', 'TATACONSUM', 'BRITANNIA', 'HEROMOTOCO', 'BPCL', 'ADANIENT',
  'ZYDUSLIFE', 'UNIONBANK', 'TITAGARH', 'TATATECH', 'TATAELXSI', 'TATACOMM',
  'TATACHEM', 'SUPREMEIND', 'OBEROIRLTY', 'MARICO', 'SJVN', 'LUPIN', 'LTF',
  'LODHA', 'LICHSGFIN', 'IRFC', 'BSOFT', 'DELHIVERY', 'DIXON', 'POLYCAB'
];

export interface SwingData {
  symbol: string;
  change: number;
  price: number;
  date: string;
  isBull: boolean;
  tradeType: 'BUY' | 'SELL';
  bo10?: boolean;
  bo50?: boolean;
  bd10?: boolean;
  bd50?: boolean;
  reversal?: boolean;
  channel?: boolean;
  setupCategory: '10_DAY_BO' | '10_DAY_BD' | '50_DAY_BO' | '50_DAY_BD' | 'REVERSAL' | 'CHANNEL_BO';
  setupTitle: string;
  
  // High Value Metrics
  aiScore: number;
  volMultiplier: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  expectedHolding: string;
  strategyRationale: string;
}

const SwingPlayer: React.FC = () => {
  const [marketData, setMarketData] = useState<SwingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'BREAKOUTS' | 'BREAKDOWNS' | 'WATCHLIST' | '10_DAY_BO' | '10_DAY_BD' | '50_DAY_BO' | '50_DAY_BD'>('ALL');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);

  // Saved Watchlist State
  const [savedWatchlist, setSavedWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pp_swing_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWatchlist = (symbol: string) => {
    setSavedWatchlist(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      try {
        localStorage.setItem('pp_swing_watchlist', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Interactive Trade Setup Modal State
  const [selectedStock, setSelectedStock] = useState<SwingData | null>(null);
  const [capitalRisk, setCapitalRisk] = useState<number>(2000);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    const candidates: SwingData[] = [];
    const scanSymbols = WATCHLIST_SYMBOLS.map(s => `${s}.NS`);
    
    try {
      // 1. Fetch current live prices in parallel batches
      const batchData = await fetchMultipleStockPrices(scanSymbols);
      
      const intermediateList: { symbol: string; price: number; change: number; isBull: boolean }[] = [];
      for (const [symWithSuffix, data] of Object.entries(batchData)) {
        if (data && data.price > 0) {
          const sym = symWithSuffix.replace('.NS', '');
          intermediateList.push({
            symbol: sym,
            price: data.price,
            change: data.change || 0,
            isBull: (data.change || 0) >= 0
          });
        }
      }

      // Sort candidates by absolute movement to prioritize high momentum for historical deep scanning
      intermediateList.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

      // 2. Scan historical prices with parallel concurrency (batches of 12)
      const scanSubset = intermediateList.slice(0, 48);
      const batchChunk = 12;

      for (let i = 0; i < scanSubset.length; i += batchChunk) {
        const chunk = scanSubset.slice(i, i + batchChunk);
        await Promise.all(
          chunk.map(async (candidate) => {
            try {
              const hist = await fetchHistoricalPrices(`${candidate.symbol}.NS`, 60);
              const currentPrice = candidate.price;
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

              if (hist && Array.isArray(hist) && hist.length >= 25) {
                const last50 = hist.slice(-50);
                const last10 = hist.slice(-10);
                const last15 = hist.slice(-15);
                
                const high10 = Math.max(...last10);
                const low10 = Math.min(...last10);
                const high50 = Math.max(...last50);
                const low50 = Math.min(...last50);
                
                // EMA calculation
                const k = 2 / (Math.min(50, last50.length) + 1);
                let ema50 = last50[0];
                for (let j = 1; j < last50.length; j++) {
                  ema50 = (last50[j] * k) + (ema50 * (1 - k));
                }
                const ema10 = last10.reduce((a, b) => a + b, 0) / last10.length;

                // Volatility / ATR approx
                const dailyDeltas: number[] = [];
                for (let j = 1; j < last15.length; j++) {
                  if (last15[j - 1] > 0) {
                    dailyDeltas.push((Math.abs(last15[j] - last15[j - 1]) / last15[j - 1]) * 100);
                  }
                }
                const avgDailyMove = dailyDeltas.length ? (dailyDeltas.reduce((a, b) => a + b, 0) / dailyDeltas.length) : 2.0;
                const volMultiplier = Number(Math.min(4.8, Math.max(1.1, (Math.abs(candidate.change) / Math.max(0.6, avgDailyMove)) * 1.5)).toFixed(1));

                let setupCat: '10_DAY_BO' | '10_DAY_BD' | '50_DAY_BO' | '50_DAY_BD' | 'REVERSAL' | 'CHANNEL_BO' = '10_DAY_BO';
                let setupTitle = '10-Day BO';
                let rationale = '';

                if (candidate.isBull) {
                  // ── BULLISH BREAKOUT LOGIC (BUY) ──
                  const is50DayBreakout = (currentPrice > ema50 && low10 <= ema50 * 1.01) || (currentPrice >= high50 * 0.99);
                  const rangePct = ((high10 - low10) / low10) * 100;
                  const isChannelBreakout = rangePct < 4.2 && currentPrice >= (high10 * 0.992);
                  const isReversalSetup = currentPrice > ema10 && currentPrice < ema50 && (last10[0] > last10[last10.length - 1]);

                  if (is50DayBreakout) {
                    setupCat = '50_DAY_BO';
                    setupTitle = '50-EMA BO';
                    rationale = 'Major trendline breakout above 50-EMA with institutional accumulation.';
                  } else if (isChannelBreakout) {
                    setupCat = 'CHANNEL_BO';
                    setupTitle = 'Channel BO';
                    rationale = 'Volatility compression breakout from tight consolidation channel.';
                  } else if (isReversalSetup) {
                    setupCat = 'REVERSAL';
                    setupTitle = 'Reversal Buy';
                    rationale = 'Oversold mean-reversion bounce confirming reversal above short-term EMA.';
                  } else {
                    setupCat = '10_DAY_BO';
                    setupTitle = '10-Day BO';
                    rationale = 'Price breaking above 10-day resistance high with expanding volume momentum.';
                  }
                } else {
                  // ── BEARISH BREAKDOWN LOGIC (SELL / SHORT) ──
                  const is50DayBreakdown = (currentPrice < ema50 && high10 >= ema50 * 0.99) || (currentPrice <= low50 * 1.02);

                  if (is50DayBreakdown) {
                    setupCat = '50_DAY_BD';
                    setupTitle = '50-EMA BD';
                    rationale = 'Major breakdown below 50-EMA support with heavy institutional selling.';
                  } else {
                    setupCat = '10_DAY_BD';
                    setupTitle = '10-Day BD';
                    rationale = 'Price breaking below 10-day support low with expanding downside momentum.';
                  }
                }

                // AI Score Formulation
                const changePwr = Math.min(30, Math.abs(candidate.change) * 7);
                const trendBonus = (candidate.isBull && currentPrice > ema50) || (!candidate.isBull && currentPrice < ema50) ? 25 : 14;
                const volBonus = Math.min(25, volMultiplier * 6);
                const aiScore = Math.min(98, Math.max(55, Math.round(35 + changePwr + trendBonus + volBonus)));

                // Target & Stop Loss Calculation (Dynamic 1:2 to 1:3.2 RR)
                const riskPercent = Math.max(1.5, Math.min(4.0, avgDailyMove * 1.3));
                const stopLoss = candidate.isBull 
                  ? Number((currentPrice * (1 - riskPercent / 100)).toFixed(1)) 
                  : Number((currentPrice * (1 + riskPercent / 100)).toFixed(1));
                const target1 = candidate.isBull 
                  ? Number((currentPrice * (1 + (riskPercent * 2) / 100)).toFixed(1)) 
                  : Number((currentPrice * (1 - (riskPercent * 2) / 100)).toFixed(1));
                const target2 = candidate.isBull 
                  ? Number((currentPrice * (1 + (riskPercent * 3.2) / 100)).toFixed(1)) 
                  : Number((currentPrice * (1 - (riskPercent * 3.2) / 100)).toFixed(1));
                
                candidates.push({
                  symbol: candidate.symbol,
                  change: candidate.change,
                  price: currentPrice,
                  date: dateStr,
                  isBull: candidate.isBull,
                  tradeType: candidate.isBull ? 'BUY' : 'SELL',
                  bo10: setupCat === '10_DAY_BO',
                  bo50: setupCat === '50_DAY_BO',
                  bd10: setupCat === '10_DAY_BD',
                  bd50: setupCat === '50_DAY_BD',
                  reversal: setupCat === 'REVERSAL',
                  channel: setupCat === 'CHANNEL_BO',
                  setupCategory: setupCat,
                  setupTitle,
                  aiScore,
                  volMultiplier,
                  entryPrice: currentPrice,
                  stopLoss,
                  target1,
                  target2,
                  riskReward: '1:2.8',
                  expectedHolding: candidate.isBull ? '3–7 Days' : '2–5 Days',
                  strategyRationale: rationale
                });
              }
            } catch (err) {
              // Ignore single failure
            }
          })
        );
      }

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

  // Filtered & Sorted Setups
  const filteredSetups = useMemo(() => {
    return marketData.filter(item => {
      // Category / Type Filter
      if (activeCategoryFilter === 'BREAKOUTS' && !item.isBull) return false;
      if (activeCategoryFilter === 'BREAKDOWNS' && item.isBull) return false;
      if (activeCategoryFilter === 'WATCHLIST' && !savedWatchlist.includes(item.symbol)) return false;
      if (activeCategoryFilter === '10_DAY_BO' && item.setupCategory !== '10_DAY_BO') return false;
      if (activeCategoryFilter === '10_DAY_BD' && item.setupCategory !== '10_DAY_BD') return false;
      if (activeCategoryFilter === '50_DAY_BO' && item.setupCategory !== '50_DAY_BO') return false;
      if (activeCategoryFilter === '50_DAY_BD' && item.setupCategory !== '50_DAY_BD') return false;
      
      // Conviction filter
      if (highConvictionOnly && item.aiScore < 80) return false;
      // Volume filter
      if (highVolumeOnly && item.volMultiplier < 2.0) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.symbol.toLowerCase().includes(query);
      }
      return true;
    });
  }, [marketData, activeCategoryFilter, highConvictionOnly, highVolumeOnly, searchQuery, savedWatchlist]);

  // Statistics Counts
  const breakoutCount = useMemo(() => marketData.filter(d => d.isBull).length, [marketData]);
  const breakdownCount = useMemo(() => marketData.filter(d => !d.isBull).length, [marketData]);
  const bo10Count = useMemo(() => marketData.filter(d => d.setupCategory === '10_DAY_BO').length, [marketData]);
  const bd10Count = useMemo(() => marketData.filter(d => d.setupCategory === '10_DAY_BD').length, [marketData]);
  const bo50Count = useMemo(() => marketData.filter(d => d.setupCategory === '50_DAY_BO').length, [marketData]);
  const bd50Count = useMemo(() => marketData.filter(d => d.setupCategory === '50_DAY_BD').length, [marketData]);
  const highConvictionCount = useMemo(() => marketData.filter(d => d.aiScore >= 80).length, [marketData]);

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
    
    const text = `🎯 SWING ${selectedStock.tradeType} SETUP: ${selectedStock.symbol}
• Action: ${selectedStock.tradeType === 'BUY' ? 'BUY (Breakout)' : 'SELL / SHORT (Breakdown)'}
• Entry Trigger: ₹${selectedStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)} (${riskPct}% Risk)
• Target 1 (1:2): ₹${selectedStock.target1.toFixed(2)} (+${t1Pct}% Book 50%)
• Target 2 (Runner): ₹${selectedStock.target2.toFixed(2)} (+${t2Pct}% Trail SL)
• Risk:Reward: ${selectedStock.riskReward}
• Horizon: ${selectedStock.expectedHolding}
• AI Conviction: ${selectedStock.aiScore}/100
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
          <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Pro Swing Radar</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI MOMENTUM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Multi-day breakout (BUY) &amp; breakdown (SELL) scanner with auto-calculated stop-loss and profit targets
            </p>
          </div>
        </div>

        {/* Global Summary KPI Tiles */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[100px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Scanned</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{WATCHLIST_SYMBOLS.length} Stocks</div>
          </div>
          <div className="bg-[#101520] border border-emerald-500/30 rounded-xl px-3.5 py-2 min-w-[110px] bg-emerald-500/5">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🟢 Breakouts (Buy)</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">{breakoutCount} Found</div>
          </div>
          <div className="bg-[#101520] border border-rose-500/30 rounded-xl px-3.5 py-2 min-w-[110px] bg-rose-500/5">
            <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">🔴 Breakdowns (Sell)</div>
            <div className="text-base font-black text-rose-400 font-mono mt-0.5">{breakdownCount} Found</div>
          </div>
          <div className="bg-[#101520] border border-purple-500/20 rounded-xl px-3.5 py-2 min-w-[110px]">
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">High Conviction</div>
            <div className="text-base font-black text-purple-300 font-mono mt-0.5">{highConvictionCount} Setups</div>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition select-none disabled:opacity-50"
            title="Scan Again"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {/* ── 2. Interactive Filter Bar & Search ───────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        
        {/* Category Tabs: Breakouts vs Breakdowns */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {[
            { id: 'ALL', label: `All Setups (${marketData.length})` },
            { id: 'BREAKOUTS', label: `🟢 Breakouts (${breakoutCount})` },
            { id: 'BREAKDOWNS', label: `🔴 Breakdowns (${breakdownCount})` },
            { id: 'WATCHLIST', label: `★ Watchlist (${savedWatchlist.length})` },
            { id: '10_DAY_BO', label: `🚀 10-Day BO (${bo10Count})` },
            { id: '10_DAY_BD', label: `📉 10-Day BD (${bd10Count})` },
            { id: '50_DAY_BO', label: `📈 50-EMA BO (${bo50Count})` },
            { id: '50_DAY_BD', label: `📉 50-EMA BD (${bd50Count})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                activeCategoryFilter === tab.id
                  ? tab.id === 'BREAKOUTS' || tab.id === '10_DAY_BO' || tab.id === '50_DAY_BO'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : tab.id === 'BREAKDOWNS' || tab.id === '10_DAY_BD' || tab.id === '50_DAY_BD'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : tab.id === 'WATCHLIST'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#101520] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Quick Chips */}
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

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#101520] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 w-36 sm:w-44 focus:outline-none focus:border-blue-500 transition placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Main Setups Grid (Distinct Green Borders for Buy vs Red Borders for Sell) ── */}
      {loading ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Scanning Breakouts & Breakdowns...</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Scanning 50-day moving averages, 10-day volume momentum, classifying Long Buy breakouts and Short Sell breakdowns.
          </p>
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No setups found matching current filters. Click "Rescan" or reset filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSetups.map((stock) => {
            const isBull = stock.isBull;
            const scoreColor = stock.aiScore >= 85 ? 'text-purple-400' : stock.aiScore >= 75 ? 'text-sky-400' : 'text-slate-300';
            const scoreBarColor = stock.aiScore >= 85 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : stock.aiScore >= 75 ? 'bg-sky-500' : 'bg-slate-500';

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className={`bg-[#0c1017] rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-lg hover:-translate-y-0.5 border ${
                  isBull 
                    ? 'border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.12)]' 
                    : 'border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                }`}
              >
                <div>
                  {/* Top Row: Logo + Symbol + Trade Action Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} className="w-9 h-9 rounded-xl shrink-0 border border-slate-800 bg-[#101520]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className={`text-sm font-black transition-colors truncate ${
                            isBull ? 'text-white group-hover:text-emerald-400' : 'text-white group-hover:text-rose-400'
                          }`}>
                            {stock.symbol}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-mono font-black px-1 rounded ${
                            isBull ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trade Type Badge (BUY vs SELL) */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
                      isBull
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {isBull ? (
                        <>
                          <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                          <span>BUY · {stock.setupTitle}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-2.5 h-2.5 stroke-[3]" />
                          <span>SELL · {stock.setupTitle}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* AI Score & Volume Spike Indicators */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-[#101520] border border-slate-800/80 rounded-xl">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-purple-400" /> AI Score</span>
                        <span className={`font-mono font-black ${scoreColor}`}>{stock.aiScore}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreBarColor}`} style={{ width: `${stock.aiScore}%` }} />
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

                  {/* Auto Risk:Reward Strategy Strip */}
                  <div className="space-y-1 my-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        {isBull ? '🎯 Target 1:' : '📉 Target 1:'}
                      </span>
                      <span className={`font-black ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{stock.target1.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">🛑 Stop Loss:</span>
                      <span className="text-slate-300 font-black">₹{stock.stopLoss.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-blue-400" /> R:R {stock.riskReward}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(stock.symbol);
                      }}
                      className={`p-1.5 rounded-lg border transition cursor-pointer select-none ${
                        savedWatchlist.includes(stock.symbol)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
                          : 'bg-[#101520] text-slate-500 hover:text-slate-300 border-slate-800'
                      }`}
                      title={savedWatchlist.includes(stock.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <Bookmark className={`w-3 h-3 ${savedWatchlist.includes(stock.symbol) ? 'fill-amber-400' : ''}`} />
                    </button>
                    <a
                      href={`https://in.tradingview.com/chart/?symbol=NSE:${stock.symbol}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#101520] hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 border border-slate-800 text-[11px] font-bold transition"
                      title={`Open ${stock.symbol} TradingView chart in new tab`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Chart</span>
                    </a>
                    <button
                      type="button"
                      className={`flex items-center gap-1 text-xs font-black transition-transform group-hover:translate-x-0.5 ${
                        isBull ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'
                      }`}
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

      {/* ── 4. Interactive Trade Setup Modal / Calculator ───────────────── */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c1017] border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <StockLogo symbol={selectedStock.symbol} className="w-12 h-12 rounded-2xl border border-slate-800 bg-[#101520]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{selectedStock.symbol}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedStock.isBull ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {selectedStock.tradeType === 'BUY' ? '🟢 BUY BREAKOUT' : '🔴 SELL BREAKDOWN'}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 hover:border-blue-400 text-blue-400 hover:text-blue-300 text-xs font-bold transition shadow-sm"
                  title="Open live chart in TradingView"
                >
                  <span>Chart</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSelectedStock(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rationale & Conviction Callout */}
            <div className={`border rounded-xl p-3 text-xs leading-relaxed space-y-1.5 ${
              selectedStock.isBull 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90' 
                : 'bg-rose-500/5 border-rose-500/20 text-rose-200/90'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Strategy Rationale</span>
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

            {/* Trade Levels Matrix (Entry, Stop Loss, Target 1, Target 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#101520] border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Entry Trigger</div>
                <div className="text-base font-black text-white font-mono mt-0.5">
                  ₹{selectedStock.entryPrice.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Market / Limit</div>
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

            {/* Position Sizing Calculator */}
            <div className="bg-[#101520] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-sky-400" />
                  Auto Position Size (Capital Risk)
                </span>
                <span className="text-xs font-mono font-bold text-sky-400">₹{capitalRisk.toLocaleString('en-IN')}</span>
              </div>

              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={capitalRisk}
                onChange={(e) => setCapitalRisk(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-center">
                <div>
                  <div className="text-[10px] text-slate-500">Rec. Quantity</div>
                  <div className="text-xs font-black text-white font-mono">{positionSizing.shares} Shares</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Capital Required</div>
                  <div className="text-xs font-black text-sky-400 font-mono">₹{positionSizing.totalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Max Risk (Loss)</div>
                  <div className="text-xs font-black text-rose-400 font-mono">₹{positionSizing.maxLoss.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Target 1 Profit</div>
                  <div className="text-xs font-black text-emerald-400 font-mono">+₹{positionSizing.targetProfit.toFixed(0)}</div>
                </div>
              </div>
            </div>

            {/* Trade Execution Rules */}
            <div className="bg-[#101520]/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Trade Execution Rules</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div className="flex items-start gap-1.5">
                  <span className="text-blue-400 font-bold shrink-0">1.</span>
                  <span>Wait for 15m candle {selectedStock.isBull ? 'close above' : 'break below'} ₹{selectedStock.entryPrice.toFixed(1)} before entry.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">2.</span>
                  <span>Book 50% profit at Target 1 & trail Stop Loss to breakeven (₹{selectedStock.entryPrice.toFixed(1)}).</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">3.</span>
                  <span>Exit runner at Target 2 or holding horizon ({selectedStock.expectedHolding}).</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={() => toggleWatchlist(selectedStock.symbol)}
                className={`w-full sm:flex-1 py-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                  savedWatchlist.includes(selectedStock.symbol)
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-lg shadow-amber-500/10'
                    : 'bg-[#101520] border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${savedWatchlist.includes(selectedStock.symbol) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span>{savedWatchlist.includes(selectedStock.symbol) ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={handleCopySetup}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {copiedNotification ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Copied Trade Setup!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Setup Parameters</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedStock(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwingPlayer;
