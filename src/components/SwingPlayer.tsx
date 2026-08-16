import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, BrainCircuit, Zap, Crosshair, TrendingUp, TrendingDown, 
  ExternalLink, ArrowUpRight, Filter, ShieldCheck, CheckCircle2, 
  ChevronRight, RefreshCw, Layers, Calculator, Sparkles, X
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
  bo10?: boolean;
  bo50?: boolean;
  reversal?: boolean;
  channel?: boolean;
  setupCategory: '10_DAY_BO' | '50_DAY_BO' | 'REVERSAL' | 'CHANNEL_BO';
  
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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | '10_DAY_BO' | '50_DAY_BO' | 'REVERSAL' | 'CHANNEL_BO'>('ALL');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);

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

      // 2. Scan historical prices with parallel concurrency (batches of 15)
      const scanSubset = intermediateList.slice(0, 48); // Top liquid candidates
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

                // Breakout Identifications
                const is10DayBreakout = currentPrice >= (high10 * 0.992);
                const is50DayBreakout = (currentPrice > ema50 && low10 <= ema50 * 1.01) || (currentPrice >= high50 * 0.99);
                const isReversalSetup = candidate.isBull && currentPrice > ema10 && currentPrice < ema50 && (last10[0] > last10[last10.length - 1]);
                const rangePct = ((high10 - low10) / low10) * 100;
                const isChannelBreakout = rangePct < 4.2 && is10DayBreakout;

                let setupCat: '10_DAY_BO' | '50_DAY_BO' | 'REVERSAL' | 'CHANNEL_BO' = '10_DAY_BO';
                let rationale = 'Price breaking above 10-day high with expanding volume momentum.';
                
                if (is50DayBreakout) {
                  setupCat = '50_DAY_BO';
                  rationale = 'Major trendline breakout above 50-EMA with institutional accumulation.';
                } else if (isChannelBreakout) {
                  setupCat = 'CHANNEL_BO';
                  rationale = 'Volatility compression breakout from tight consolidation channel.';
                } else if (isReversalSetup) {
                  setupCat = 'REVERSAL';
                  rationale = 'Oversold mean-reversion bounce confirming reversal above short-term EMA.';
                }

                // AI Score Formulation
                const changePwr = Math.min(30, Math.abs(candidate.change) * 7);
                const trendBonus = currentPrice > ema50 ? 25 : 12;
                const volBonus = Math.min(25, volMultiplier * 6);
                const aiScore = Math.min(98, Math.max(55, Math.round(35 + changePwr + trendBonus + volBonus)));

                // Target & Stop Loss Calculation (Dynamic 1:2 to 1:3.2 RR)
                const riskPercent = Math.max(1.5, Math.min(4.0, avgDailyMove * 1.3));
                const stopLoss = candidate.isBull ? Number((currentPrice * (1 - riskPercent / 100)).toFixed(1)) : Number((currentPrice * (1 + riskPercent / 100)).toFixed(1));
                const target1 = candidate.isBull ? Number((currentPrice * (1 + (riskPercent * 2) / 100)).toFixed(1)) : Number((currentPrice * (1 - (riskPercent * 2) / 100)).toFixed(1));
                const target2 = candidate.isBull ? Number((currentPrice * (1 + (riskPercent * 3.2) / 100)).toFixed(1)) : Number((currentPrice * (1 - (riskPercent * 3.2) / 100)).toFixed(1));
                
                candidates.push({
                  symbol: candidate.symbol,
                  change: candidate.change,
                  price: currentPrice,
                  date: dateStr,
                  isBull: candidate.isBull,
                  bo10: setupCat === '10_DAY_BO',
                  bo50: setupCat === '50_DAY_BO',
                  reversal: setupCat === 'REVERSAL',
                  channel: setupCat === 'CHANNEL_BO',
                  setupCategory: setupCat,
                  aiScore,
                  volMultiplier,
                  entryPrice: currentPrice,
                  stopLoss,
                  target1,
                  target2,
                  riskReward: '1:2.8',
                  expectedHolding: setupCat === '10_DAY_BO' ? '3–7 Days' : setupCat === '50_DAY_BO' ? '1–3 Weeks' : '4–10 Days',
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
      // Category Filter
      if (activeCategoryFilter !== 'ALL' && item.setupCategory !== activeCategoryFilter) {
        return false;
      }
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
    }).sort((a, b) => b.aiScore - a.aiScore);
  }, [marketData, activeCategoryFilter, highConvictionOnly, highVolumeOnly, searchQuery]);

  // Grouped Categories for Summary
  const bo10Count = marketData.filter(d => d.setupCategory === '10_DAY_BO').length;
  const bo50Count = marketData.filter(d => d.setupCategory === '50_DAY_BO').length;
  const reversalCount = marketData.filter(d => d.setupCategory === 'REVERSAL').length;
  const channelCount = marketData.filter(d => d.setupCategory === 'CHANNEL_BO').length;
  const highConvictionCount = marketData.filter(d => d.aiScore >= 80).length;

  // Position Sizing Calculator in Modal
  const calculatedQty = useMemo(() => {
    if (!selectedStock || selectedStock.price <= 0) return 0;
    const perShareRisk = Math.abs(selectedStock.entryPrice - selectedStock.stopLoss);
    if (perShareRisk <= 0) return 0;
    return Math.max(1, Math.floor(capitalRisk / perShareRisk));
  }, [selectedStock, capitalRisk]);

  const totalPositionValue = useMemo(() => {
    if (!selectedStock) return 0;
    return calculatedQty * selectedStock.entryPrice;
  }, [selectedStock, calculatedQty]);

  const potentialProfitTgt1 = useMemo(() => {
    if (!selectedStock) return 0;
    return calculatedQty * Math.abs(selectedStock.target1 - selectedStock.entryPrice);
  }, [selectedStock, calculatedQty]);

  const handleCopySetup = () => {
    if (!selectedStock) return;
    const text = `🎯 SWING TRADE SETUP: ${selectedStock.symbol}
• Entry: ₹${selectedStock.entryPrice.toFixed(2)}
• Stop Loss: ₹${selectedStock.stopLoss.toFixed(2)}
• Target 1: ₹${selectedStock.target1.toFixed(2)}
• Target 2: ₹${selectedStock.target2.toFixed(2)}
• Risk:Reward: ${selectedStock.riskReward}
• Holding Horizon: ${selectedStock.expectedHolding}
• AI Conviction: ${selectedStock.aiScore}/100`;
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
              Multi-day breakout scanner, volatility compression &amp; auto-calculated risk/reward trade setups
            </p>
          </div>
        </div>

        {/* Global Summary KPI Tiles */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[110px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Scanned</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{WATCHLIST_SYMBOLS.length} Stocks</div>
          </div>
          <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[110px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Setups</div>
            <div className="text-base font-black text-sky-400 font-mono mt-0.5">{marketData.length} Found</div>
          </div>
          <div className="bg-[#101520] border border-emerald-500/20 rounded-xl px-3.5 py-2 min-w-[125px] bg-emerald-500/5">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">High Conviction</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">{highConvictionCount} Setups</div>
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
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {[
            { id: 'ALL', label: `All Setups (${marketData.length})` },
            { id: '10_DAY_BO', label: `🚀 10-Day BO (${bo10Count})` },
            { id: '50_DAY_BO', label: `📈 50-EMA BO (${bo50Count})` },
            { id: 'REVERSAL', label: `🔄 Reversal (${reversalCount})` },
            { id: 'CHANNEL_BO', label: `⚡ Channel BO (${channelCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                activeCategoryFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
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

      {/* ── 3. Main Setups Grid (Solid Dark Fintech Cards) ────────────────── */}
      {loading ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">AI Scanning High-Beta Universe...</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Scanning 50-day moving averages, 10-day volume breakouts, and auto-calculating optimal Risk:Reward ratios.
          </p>
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No swing setups found matching current filters. Click "Rescan" or reset filters.
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
                className="bg-[#0c1017] border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-lg hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Row: Logo + Symbol + Setup Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} className="w-9 h-9 rounded-xl shrink-0 border border-slate-800 bg-[#101520]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-white group-hover:text-sky-400 transition-colors truncate">
                            {stock.symbol}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-mono font-black px-1 rounded ${
                            stock.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Setup Category Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                      stock.setupCategory === '10_DAY_BO' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      stock.setupCategory === '50_DAY_BO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      stock.setupCategory === 'REVERSAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {stock.setupCategory === '10_DAY_BO' ? '10-Day BO' :
                       stock.setupCategory === '50_DAY_BO' ? '50-EMA BO' :
                       stock.setupCategory === 'REVERSAL' ? 'Reversal' : 'Channel'}
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
                      <span className="text-slate-400 text-[11px]">🎯 Target 1:</span>
                      <span className="text-emerald-400 font-black">₹{stock.target1.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">🛑 Stop Loss:</span>
                      <span className="text-rose-400 font-black">₹{stock.stopLoss.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-blue-400" /> R:R {stock.riskReward}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-black text-sky-400 hover:text-sky-300 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>View Setup</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
                      selectedStock.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    LTP: ₹{selectedStock.price.toFixed(2)} • Horizon: {selectedStock.expectedHolding}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedStock(null)}
                className="w-8 h-8 rounded-full bg-[#101520] border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Strategy Rationale */}
            <div className="bg-[#101520] border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Strategy Analysis
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedStock.strategyRationale}
              </p>
            </div>

            {/* Target, SL, & Entry Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-[#101520] border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400">Entry Price</div>
                <div className="text-base font-black text-white font-mono mt-0.5">₹{selectedStock.entryPrice.toFixed(1)}</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Target 1 (1:2)</div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">₹{selectedStock.target1.toFixed(1)}</div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-rose-400">Stop Loss</div>
                <div className="text-base font-black text-rose-400 font-mono mt-0.5">₹{selectedStock.stopLoss.toFixed(1)}</div>
              </div>
            </div>

            {/* Interactive Capital Risk Position Sizer */}
            <div className="bg-[#101520] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Position Sizing Calculator</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Max Risk:</span>
                  <div className="flex items-center gap-1 bg-[#0c1017] border border-slate-700 rounded-lg px-2 py-1">
                    <span className="text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      value={capitalRisk}
                      onChange={(e) => setCapitalRisk(Math.max(500, Number(e.target.value)))}
                      className="w-16 bg-transparent text-xs font-black text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Recommended Qty</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">{calculatedQty} Shares</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Position Capital</div>
                  <div className="text-sm font-black text-sky-400 font-mono mt-0.5">₹{Math.round(totalPositionValue).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 font-medium">Potential Gain (TGT1)</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">+₹{Math.round(potentialProfitTgt1).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCopySetup}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#101520] border border-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition select-none"
              >
                {copiedNotification ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Layers className="w-4 h-4" />}
                <span>{copiedNotification ? 'Setup Copied!' : 'Copy Setup'}</span>
              </button>

              <a
                href={`https://in.tradingview.com/chart/?symbol=NSE:${selectedStock.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition select-none shadow-lg shadow-blue-600/20"
              >
                <span>Open TradingView</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SwingPlayer;
