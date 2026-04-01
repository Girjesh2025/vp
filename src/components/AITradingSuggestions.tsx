import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Brain, Target, Clock, BarChart3,
  AlertTriangle, RefreshCw, Activity, ChevronDown, ChevronUp,
  Info, CheckCircle, AlertCircle, BarChart2, PieChart, Sparkles, Briefcase
} from 'lucide-react';
import { aiTradingService, AIAnalysis } from '../utils/aiTradingService';

// ─── Top NSE / BSE stocks for AI Market Picks ───────────────────────────────
const TOP_NSE_BSE_STOCKS = [
  // Nifty 50
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','SBIN','HINDUNILVR','BHARTIARTL',
  'ITC','KOTAKBANK','LT','BAJFINANCE','HCLTECH','AXISBANK','NTPC','MARUTI',
  'SUNPHARMA','WIPRO','ADANIENT','TATAMOTORS','POWERGRID','COALINDIA','ONGC',
  'TITAN','ULTRACEMCO','NESTLEIND','BAJAJFINSV','TECHM','DRREDDY','ASIANPAINT',
  'BRITANNIA','CIPLA','EICHERMOT','HEROMOTOCO','INDUSINDBK','GRASIM','DIVISLAB',
  'BPCL','TATACONSUM','APOLLOHOSP','ADANIPORTS','JSWSTEEL','TATASTEEL','M&M',
  'HINDALCO','HDFCLIFE','SBILIFE','UPL','BAJAJ-AUTO','VEDL',
  // Popular Midcap / Others
  'PIDILITIND','HAVELLS','DABUR','MUTHOOTFIN','IRCTC','NAUKRI','ZOMATO',
  'PAYTM','POLICYBZR','DELHIVERY','PFC','RECLTD','IRFC','HAL','BEL',
  'BHEL','SAIL','NALCO','NMDC','GAIL','IOC','HPCL',
  'BANKBARODA','PNB','CANARABANK','UNIONBANK','IDFCFIRSTB','FEDERALBNK',
  'PERSISTENT','LTTS','COFORGE','MPHASIS','OFSS','KPITTECH',
];

interface AITradingSuggestionsProps {
  portfolioSymbols?: string[];
}

type Mode = 'portfolio' | 'market';

const AITradingSuggestions: React.FC<AITradingSuggestionsProps> = ({ portfolioSymbols = [] }) => {
  const [mode, setMode] = useState<Mode>('portfolio');
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'aiScore' | 'confidence' | 'expectedReturn'>('aiScore');
  const [filterBy, setFilterBy] = useState<'all' | 'buy' | 'sell' | 'hold'>('all');
  const [progress, setProgress] = useState(0); // 0-100 for market scan

  const portfolioSymbolsUniq = [...new Set(portfolioSymbols?.filter(Boolean) ?? [])];

  const marketScanRef = useRef<boolean>(false);

  const analyzePortfolioStocks = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      if (portfolioSymbolsUniq.length === 0) { setAnalyses([]); return; }
      const results = await aiTradingService.analyzePortfolio(portfolioSymbolsUniq);
      const seen = new Set<string>();
      setAnalyses(results.filter(r => { if (seen.has(r.symbol)) return false; seen.add(r.symbol); return true; }));
    } catch (err) {
      setError('Failed to analyze portfolio stocks.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeMarketStocks = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    marketScanRef.current = true;
    const stocksToScan = [...new Set([...portfolioSymbolsUniq, ...TOP_NSE_BSE_STOCKS])];
    const batchSize = 5;
    const allResults: AIAnalysis[] = [];
    try {
      for (let i = 0; i < stocksToScan.length; i += batchSize) {
        if (!marketScanRef.current) break;
        const batch = stocksToScan.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(symbol => aiTradingService.analyzeStock(symbol).catch(() => null))
        );
        batchResults.forEach(r => { if (r) allResults.push(r); });
        setProgress(Math.round(((i + batchSize) / stocksToScan.length) * 100));
        // Small delay to not overwhelm API
        if (i + batchSize < stocksToScan.length) await new Promise(res => setTimeout(res, 300));
      }
      // Deduplicate + sort by AI score
      const seen = new Set<string>();
      const unique = allResults.filter(r => { if (seen.has(r.symbol)) return false; seen.add(r.symbol); return true; });
      setAnalyses(unique.sort((a, b) => b.aiScore - a.aiScore));
    } catch (err) {
      setError('Market scan failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress(100);
      marketScanRef.current = false;
    }
  };

  const runAnalysis = () => {
    marketScanRef.current = false;
    if (mode === 'portfolio') analyzePortfolioStocks();
    else analyzeMarketStocks();
  };

  useEffect(() => {
    marketScanRef.current = false;
    setAnalyses([]);
    setFilterBy('all');
    if (mode === 'portfolio') {
      if (portfolioSymbolsUniq.length > 0) analyzePortfolioStocks();
    }
    // Don't auto-start market scan (too many API calls)
  }, [mode, portfolioSymbols?.join(',')]);

  // ─── UI Helpers ─────────────────────────────────────────────────────────────
  const recStyle = (r: string) => {
    if (r === 'STRONG_BUY') return { bg: '#dcfce7', border: '#86efac', text: '#15803d', dot: '#22c55e' };
    if (r === 'BUY') return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '#4ade80' };
    if (r === 'WEAK_BUY') return { bg: '#f0fdf4', border: '#d1fae5', text: '#059669', dot: '#6ee7b7' };
    if (r === 'STRONG_SELL') return { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', dot: '#ef4444' };
    if (r === 'SELL') return { bg: '#fff1f2', border: '#fecaca', text: '#e11d48', dot: '#f87171' };
    if (r === 'WEAK_SELL') return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', dot: '#fb923c' };
    return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', dot: '#94a3b8' };
  };

  const recIcon = (r: string) => r.includes('BUY') ? <TrendingUp className="w-4 h-4" /> : r.includes('SELL') ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />;
  const sentimentIcon = (s: string) => {
    if (s === 'VERY_BULLISH') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (s === 'BULLISH') return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (s === 'VERY_BEARISH') return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
    if (s === 'BEARISH') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <BarChart2 className="w-3.5 h-3.5 text-slate-400" />;
  };

  const aiScoreGrad = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-green-400';
    if (score >= 70) return 'from-blue-500 to-cyan-400';
    if (score >= 55) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-orange-400';
  };

  const riskBg = (r: string) => {
    if (r === 'VERY_LOW' || r === 'LOW') return 'bg-green-50 text-green-700 border-green-200';
    if (r === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const sectorColors: Record<string, string> = {
    Technology: '#6366f1', Banking: '#0ea5e9', Energy: '#f59e0b',
    Pharma: '#10b981', Auto: '#ef4444', FMCG: '#8b5cf6', Diversified: '#64748b',
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;

  // Filter + Sort
  const filtered = analyses.filter(a => {
    if (filterBy === 'buy') return a.signals.recommendation.includes('BUY');
    if (filterBy === 'sell') return a.signals.recommendation.includes('SELL');
    if (filterBy === 'hold') return a.signals.recommendation === 'HOLD';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'confidence') return b.signals.confidence - a.signals.confidence;
    if (sortBy === 'expectedReturn') return Math.abs(b.signals.expectedReturn) - Math.abs(a.signals.expectedReturn);
    return b.aiScore - a.aiScore;
  });

  const isPortfolioMode = mode === 'portfolio';
  
  // totalStocksToScan for Market mode includes portfolio stocks + curated stocks (deduplicated)
  const totalMarketStocks = [...new Set([...portfolioSymbolsUniq, ...TOP_NSE_BSE_STOCKS])].length;
  const totalStocksToScan = isPortfolioMode ? portfolioSymbolsUniq.length : totalMarketStocks;

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl border border-slate-700/50">
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Brain className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">AI Trading Signals</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {isPortfolioMode ? 'Technical analysis for your portfolio stocks' : `Scanning ${totalStocksToScan} NSE & BSE stocks for opportunities`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">{analyses.length}</div>
              <div className="text-xs text-slate-400">{isPortfolioMode ? 'Analyzed' : 'Found'}</div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl font-semibold text-sm disabled:opacity-50 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? (isPortfolioMode ? 'Analyzing…' : `Scanning ${progress}%`) : (isPortfolioMode ? 'Refresh' : 'Scan Market')}
            </button>
          </div>
        </div>

        {/* Market scan progress bar */}
        {loading && !isPortfolioMode && (
          <div className="mt-4 relative">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Scanning NSE & BSE stocks… {progress}% complete</p>
          </div>
        )}
      </div>

      {/* ── Mode Toggle ── */}
      <div className="flex items-center gap-3 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setMode('portfolio')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            isPortfolioMode
              ? 'bg-white shadow text-slate-900 border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          My Portfolio ({portfolioSymbolsUniq.length} stocks)
        </button>
        <button
          onClick={() => setMode('market')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            !isPortfolioMode
              ? 'bg-white shadow text-slate-900 border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          🇮🇳 AI Market Picks ({totalMarketStocks} NSE/BSE stocks)
        </button>
      </div>

      {/* Market mode — start prompt when no analysis yet */}
      {!isPortfolioMode && analyses.length === 0 && !loading && (
        <div className="text-center py-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Scan NSE & BSE for Opportunities</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            The AI will analyze <strong>{totalStocksToScan} stocks</strong> including Nifty 50, popular midcaps, banking stocks, and more — then rank the best trading opportunities.
          </p>
          <button
            onClick={runAnalysis}
            className="flex items-center gap-2 mx-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-300 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            Start AI Market Scan
          </button>
          <p className="text-xs text-slate-400 mt-4">Takes ~30-60 seconds to scan all stocks</p>
        </div>
      )}

      {/* ── Controls (show after analysis loaded) ── */}
      {analyses.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['all', 'buy', 'sell', 'hold'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterBy(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  filterBy === f
                    ? 'bg-slate-900 text-white border-slate-700 shadow'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f === 'all' ? 'All Signals' : f === 'buy' ? '🟢 Buy' : f === 'sell' ? '🔴 Sell' : '🔵 Hold'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="aiScore">AI Score</option>
              <option value="confidence">Confidence</option>
              <option value="expectedReturn">Expected Return</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
              <Activity className="w-3.5 h-3.5" />
              {isPortfolioMode ? 'Portfolio Analysis' : `${analyses.length} stocks scanned`}
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(isPortfolioMode ? Math.min(portfolioSymbolsUniq.length, 6) : 9)].map((_, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-slate-100 rounded-lg w-20" />
                <div className="h-6 bg-slate-100 rounded-full w-16" />
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-28 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-full mb-2" />
              <div className="h-4 bg-slate-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {/* ── Cards Grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(a => {
            const c = recStyle(a.signals.recommendation);
            const expanded = selectedStock === a.symbol;
            const sColor = sectorColors[a.marketData.sector ?? ''] ?? '#64748b';
            const isInPortfolio = portfolioSymbolsUniq.includes(a.symbol);

            return (
              <div
                key={a.symbol}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setSelectedStock(expanded ? null : a.symbol)}
              >
                <div className="h-1 w-full" style={{ background: c.dot }} />
                <div className="p-5">
                  {/* Row 1 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: sColor }}>
                        {a.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="font-black text-slate-900 text-base leading-tight">{a.symbol}</div>
                          {isInPortfolio && !isPortfolioMode && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-semibold">In Portfolio</span>
                          )}
                        </div>
                        {a.marketData.sector && <div className="text-xs text-slate-400">{a.marketData.sector}</div>}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${aiScoreGrad(a.aiScore)} text-white text-xs font-bold shadow-sm`}>
                      <Brain className="w-3 h-3" />
                      {a.aiScore}
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-2xl font-black text-slate-900">{fmt(a.currentPrice)}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {sentimentIcon(a.marketSentiment)}
                        <span className="text-xs text-slate-500">{a.marketSentiment.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold"
                      style={{ background: c.bg, borderColor: c.border, color: c.text }}
                    >
                      <span style={{ color: c.dot }}>{recIcon(a.signals.recommendation)}</span>
                      {a.signals.recommendation.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Confidence</div>
                      <div className="text-sm font-bold text-slate-800">{a.signals.confidence}%</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">Return</div>
                      <div className={`text-sm font-bold ${a.signals.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmtPct(a.signals.expectedReturn)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">R:R</div>
                      <div className="text-sm font-bold text-blue-600">{a.signals.riskRewardRatio.toFixed(1)}x</div>
                    </div>
                  </div>

                  {/* SL / Target */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-red-500 font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      SL {fmt(a.signals.stopLoss)}
                    </div>
                    <div className="h-px flex-1 bg-slate-100 mx-2" />
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      TGT {fmt(a.signals.targetPrice)}
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  {/* Risk + expand */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${riskBg(a.signals.riskLevel)}`}>
                      {a.signals.riskLevel.replace('_', ' ')} Risk
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Details</>}
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-4">
                    {/* Technical */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-700">Technical Indicators</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'RSI', value: a.signals.technicalIndicators.rsi.toFixed(1), note: a.signals.technicalIndicators.rsi < 30 ? 'Oversold' : a.signals.technicalIndicators.rsi > 70 ? 'Overbought' : 'Neutral', color: a.signals.technicalIndicators.rsi < 30 ? '#10b981' : a.signals.technicalIndicators.rsi > 70 ? '#ef4444' : '#3b82f6' },
                          { label: 'ADX', value: a.signals.technicalIndicators.adx.toFixed(1), note: a.trendStrength.replace('_', ' '), color: '#8b5cf6' },
                          { label: 'Stoch %K', value: a.signals.technicalIndicators.stochastic.k.toFixed(1), note: '', color: '#0ea5e9' },
                          { label: 'Williams %R', value: a.signals.technicalIndicators.williams.toFixed(1), note: '', color: '#f59e0b' },
                        ].map(ind => (
                          <div key={ind.label} className="bg-white rounded-xl p-3 border border-slate-100">
                            <div className="text-xs text-slate-400">{ind.label}</div>
                            <div className="text-lg font-bold" style={{ color: ind.color }}>{ind.value}</div>
                            {ind.note && <div className="text-xs text-slate-500">{ind.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price targets */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-700">Price Targets</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="text-xs font-semibold text-emerald-700">🎯 Target</span>
                          <span className="font-bold text-emerald-600">{fmt(a.signals.targetPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-red-50 rounded-xl border border-red-100">
                          <span className="text-xs font-semibold text-red-700">🛡️ Stop Loss</span>
                          <span className="font-bold text-red-600">{fmt(a.signals.stopLoss)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                          <span className="text-xs font-semibold text-blue-700">⚖️ R:R Ratio</span>
                          <span className="font-bold text-blue-600">{a.signals.riskRewardRatio.toFixed(2)}:1</span>
                        </div>
                      </div>
                    </div>

                    {/* Market data */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <PieChart className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-700">Market Data</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="text-xs text-slate-400">52W High</div><div className="font-bold text-slate-800">{fmt(a.marketData.week52High)}</div></div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="text-xs text-slate-400">52W Low</div><div className="font-bold text-slate-800">{fmt(a.marketData.week52Low)}</div></div>
                        {a.marketData.pe && <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="text-xs text-slate-400">P/E Ratio</div><div className="font-bold text-slate-800">{a.marketData.pe.toFixed(1)}</div></div>}
                        <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="text-xs text-slate-400">Time Horizon</div><div className="font-bold text-slate-800 text-sm">{a.signals.timeHorizon}</div></div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-700">AI Reasoning</span>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-2">
                        {a.signals.reasoning.slice(0, 4).map((r, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-slate-600 leading-relaxed">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Horizon:</span><span className="font-semibold text-slate-800">{a.signals.timeHorizon}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <span>Momentum:</span><span className="font-semibold text-slate-800">{a.momentum.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No filter match */}
      {!loading && filtered.length === 0 && analyses.length > 0 && (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No stocks match this filter</h3>
          <p className="text-slate-400 text-sm">Try "All Signals" to see all results.</p>
        </div>
      )}

      {/* Empty portfolio mode */}
      {!loading && isPortfolioMode && analyses.length === 0 && portfolioSymbolsUniq.length === 0 && (
        <div className="text-center py-16">
          <Brain className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">No stocks to analyze</h3>
          <p className="text-slate-400 text-sm mb-4">Add stocks to your portfolio, or switch to AI Market Picks to discover new opportunities.</p>
          <button onClick={() => setMode('market')} className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition-all">
            Try AI Market Picks →
          </button>
        </div>
      )}

      {/* Disclaimer */}
      {!loading && analyses.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> AI signals are for educational purposes only. Not financial advice. This is a paper trading platform — no real money involved. Always do your own research.
          </p>
        </div>
      )}
    </div>
  );
};

export default AITradingSuggestions;