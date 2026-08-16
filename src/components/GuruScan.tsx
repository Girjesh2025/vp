import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Search, TrendingUp, Shield, Activity, Star, DollarSign, 
  Sparkles, CheckCircle2, XCircle, ArrowUpRight, Check, X,
  Layers, RefreshCw, BarChart2, Award, Zap, ChevronRight
} from 'lucide-react';
import { fetchGuruFundamentals, StockFundamentals } from '../utils/priceApi';
import StockLogo from './StockLogo';

export interface GuruStock extends StockFundamentals {
  score: number;
  reason: string;
  checklist: { label: string; passed: boolean; valueStr: string }[];
  guruVerdict: string;
  moatRating: 'Wide' | 'Narrow' | 'Moderate';
}

export interface GuruProfile {
  id: string;
  name: string;
  title: string;
  philosophy: string;
  quote: string;
  accentColor: string; // Hex for reliable styling
  icon: React.ReactNode;
  imageUrl: string;
}

const GURUS: GuruProfile[] = [
  {
    id: 'minervini',
    name: 'Mark Minervini',
    title: 'Trend & Momentum',
    philosophy: 'Volatility Contraction Pattern (VCP) & Stage 2 Superperformance near 52-week highs.',
    quote: 'Expect the best, plan for the worst, and trade what you see, not what you think.',
    accentColor: '#00e676',
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    imageUrl: 'https://unavatar.io/twitter/markminervini'
  },
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'Economic Moat & Value',
    philosophy: 'High Return on Equity (ROE), low debt burden, and durable competitive advantage.',
    quote: 'It is far better to buy a wonderful company at a fair price than a fair company at a wonderful price.',
    accentColor: '#38bdf8',
    icon: <Shield className="w-5 h-5 text-sky-400" />,
    imageUrl: 'https://unavatar.io/twitter/WarrenBuffett'
  },
  {
    id: 'jhunjhunwala',
    name: 'Rakesh Jhunjhunwala',
    title: 'Indian Bull Compounding',
    philosophy: 'High domestic market tailwinds, operating leverage, and aggressive earnings growth.',
    quote: 'Anticipate trend and benefit from it. Traders should go against human nature.',
    accentColor: '#f59e0b',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    imageUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Rakesh_Jhunjhunwala.jpg/440px-Rakesh_Jhunjhunwala.jpg&w=400&h=400&fit=cover'
  },
  {
    id: 'graham',
    name: 'Benjamin Graham',
    title: 'Deep Margin of Safety',
    philosophy: 'Low P/E, conservative debt ratios, and severe discount to intrinsic value.',
    quote: 'The essence of investment management is the management of risks, not the management of returns.',
    accentColor: '#a855f7',
    icon: <DollarSign className="w-5 h-5 text-purple-400" />,
    imageUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/2a/Benjamin_Graham_%281894-1976%29_portrait_on_23_March_1950.jpg&w=400&h=400&fit=cover'
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    title: 'GARP (Growth At Fair Price)',
    philosophy: 'PEG ratio < 1.2, scalable business models, and strong PEG-adjusted earnings momentum.',
    quote: 'Know what you own, and know why you own it.',
    accentColor: '#ec4899',
    icon: <Star className="w-5 h-5 text-pink-400" />,
    imageUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Peter_Lynch.jpg/440px-Peter_Lynch.jpg&w=400&h=400&fit=cover'
  },
  {
    id: 'oneil',
    name: "William J. O'Neil",
    title: 'CAN SLIM Formula',
    philosophy: 'Accelerating quarterly EPS, annual sales growth, and leadership in sector relative strength.',
    quote: 'The whole secret to winning big in the stock market is to not be right all the time, but to lose the least amount possible when you are wrong.',
    accentColor: '#f43f5e',
    icon: <Activity className="w-5 h-5 text-rose-400" />,
    imageUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/en/b/b3/William_J._O%27Neil_%281933-2023%29_in_2018.jpg&w=400&h=400&fit=cover'
  }
];

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

export default function GuruScan() {
  const [activeGuruId, setActiveGuruId] = useState<string>(GURUS[0].id);
  const [search, setSearch] = useState('');
  const [marketData, setMarketData] = useState<StockFundamentals[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(65);

  // Interactive Stock Detail Modal
  const [selectedStock, setSelectedStock] = useState<GuruStock | null>(null);
  const [copiedThesis, setCopiedThesis] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const batchSize = 16;
      const symbolsToFetch = WATCHLIST_SYMBOLS.map(s => `${s}.NS`);
      const allData: StockFundamentals[] = [];

      for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
        const batch = symbolsToFetch.slice(i, i + batchSize);
        const batchData = await fetchGuruFundamentals(batch);
        for (const data of Object.values(batchData)) {
          if (data && data.price > 0) {
            allData.push(data);
          }
        }
      }
      
      setMarketData(allData);
    } catch (err) {
      console.error('Error fetching market data for Guru Scan', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeGuru = useMemo(() => {
    return GURUS.find(g => g.id === activeGuruId) || GURUS[0];
  }, [activeGuruId]);

  // Dynamic Guru Scoring Engine
  const guruStocks = useMemo<GuruStock[]>(() => {
    if (!marketData || marketData.length === 0) return [];
    const candidates = [...marketData];

    if (activeGuruId === 'minervini') {
      return candidates
        .filter(d => d.high52 > 0 && d.price > d.high52 * 0.78)
        .map(d => {
          const proximity = d.price / d.high52;
          const isNear52W = proximity >= 0.90;
          const isPositiveChange = d.change > 0;
          const isAboveAvg = proximity >= 0.85;

          const checklist = [
            { label: 'Within 15% of 52-Week High', passed: proximity >= 0.85, valueStr: `${((1 - proximity) * 100).toFixed(1)}% below high` },
            { label: 'Stage 2 Momentum Action', passed: isPositiveChange, valueStr: `${d.change >= 0 ? '+' : ''}${d.change.toFixed(2)}% move` },
            { label: 'Relative Strength Leader', passed: proximity >= 0.92, valueStr: `90+ RS Percentile` },
            { label: 'Earnings Growth Stability', passed: (d.growth || 0) > 8, valueStr: `${d.growth?.toFixed(1) || '12'}% CAGR` }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(65, Math.floor((proximity * 55) + (d.change * 4) + (passedCount * 8))));

          return {
            ...d,
            score,
            reason: `Price is within ${((1 - proximity) * 100).toFixed(1)}% of 52W High (${d.high52.toFixed(1)}). Stage 2 momentum candidate.`,
            checklist,
            guruVerdict: score >= 85 ? 'HIGH CONVICTION BREAKOUT' : 'MOMENTUM WATCHLIST',
            moatRating: proximity >= 0.92 ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    } 
    else if (activeGuruId === 'buffett') {
      return candidates
        .filter(d => d.roe > 11 && (d.debtToEquity / 100) < 1.1 && d.peRatio > 0)
        .map(d => {
          const debtRatio = d.debtToEquity / 100;
          const highRoe = d.roe >= 15;
          const lowDebt = debtRatio < 0.6;
          const reasonableValuation = d.peRatio < 40;

          const checklist = [
            { label: 'Return on Equity (ROE) > 15%', passed: highRoe, valueStr: `${d.roe.toFixed(1)}% ROE` },
            { label: 'Conservative Debt to Equity (< 0.6)', passed: lowDebt, valueStr: `${debtRatio.toFixed(2)}x D/E` },
            { label: 'Sustainable Pricing Power', passed: true, valueStr: 'Established Brand Moat' },
            { label: 'Reasonable P/E Valuation', passed: reasonableValuation, valueStr: `${d.peRatio.toFixed(1)}x P/E` }
          ];

          const score = Math.min(99, Math.max(68, Math.floor(65 + (d.roe / 2) - (debtRatio * 15))));

          return {
            ...d,
            score,
            reason: `Excellent Capital Efficiency with ${d.roe.toFixed(1)}% ROE and manageable ${debtRatio.toFixed(2)}x D/E ratio.`,
            checklist,
            guruVerdict: score >= 85 ? 'COMPOUNDING MOAT' : 'QUALITY COMPOUNDER',
            moatRating: d.roe >= 20 && lowDebt ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'jhunjhunwala') {
      return candidates
        .filter(d => (d.growth || 0) > 10 && d.roe > 12)
        .map(d => {
          const growth = d.growth || 15;
          const checklist = [
            { label: 'Aggressive Revenue/EPS Growth (>12%)', passed: growth >= 12, valueStr: `${growth.toFixed(1)}% Growth` },
            { label: 'Domestic Consumption / Capex Wave', passed: true, valueStr: 'India Growth Proxy' },
            { label: 'Healthy Operating Margins', passed: d.roe >= 14, valueStr: `${d.roe.toFixed(1)}% ROE` },
            { label: 'Institutional Sponsorship', passed: true, valueStr: 'High DII/FII Holding' }
          ];

          const score = Math.min(99, Math.max(70, Math.floor(68 + (growth / 2) + (d.change * 2))));

          return {
            ...d,
            score,
            reason: `High beta Indian growth compounder benefiting from secular economic expansion & ${growth.toFixed(1)}% earnings growth.`,
            checklist,
            guruVerdict: score >= 85 ? 'HIGH GROWTH COMPOUNDER' : 'STRONG CYCLE PLAY',
            moatRating: growth >= 18 ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'graham') {
      return candidates
        .filter(d => d.peRatio > 0 && d.peRatio < 28)
        .map(d => {
          const lowPe = d.peRatio <= 18;
          const lowDebt = (d.debtToEquity / 100) < 0.8;
          const positivePrice = d.price > 0;

          const checklist = [
            { label: 'P/E Multiple < 20x', passed: lowPe, valueStr: `${d.peRatio.toFixed(1)}x P/E` },
            { label: 'Solvent Balance Sheet (D/E < 0.8)', passed: lowDebt, valueStr: `${(d.debtToEquity / 100).toFixed(2)}x D/E` },
            { label: 'High Margin of Safety', passed: d.peRatio < 15, valueStr: 'Substantial Discount' },
            { label: 'Positive Net Profitability', passed: true, valueStr: 'Consistently Profitable' }
          ];

          const score = Math.min(99, Math.max(65, Math.floor(100 - (d.peRatio * 1.4))));

          return {
            ...d,
            score,
            reason: `Attractive Deep Value: P/E is ${d.peRatio.toFixed(1)}x with comfortable margin of safety against market averages.`,
            checklist,
            guruVerdict: score >= 85 ? 'DEEP MARGIN OF SAFETY' : 'UNDERVALUED ASSET',
            moatRating: 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'lynch') {
      return candidates
        .filter(d => d.pegRatio > 0 && d.pegRatio < 2.2 && (d.growth || 0) > 0)
        .map(d => {
          const peg = d.pegRatio || 1.1;
          const growth = d.growth || 14;
          const checklist = [
            { label: 'PEG Ratio < 1.2x (GARP Standard)', passed: peg <= 1.2, valueStr: `${peg.toFixed(2)} PEG` },
            { label: 'Double-Digit Growth (>10%)', passed: growth >= 10, valueStr: `${growth.toFixed(1)}% Growth` },
            { label: 'Reasonable P/E Relative to Peers', passed: d.peRatio < 35, valueStr: `${d.peRatio.toFixed(1)}x P/E` },
            { label: 'Simple & Understandable Business', passed: true, valueStr: 'Everyday Consumer/Tech' }
          ];

          const score = Math.min(99, Math.max(68, Math.floor(100 - (peg * 18))));

          return {
            ...d,
            score,
            reason: `GARP Winner: Fast grower with ${growth.toFixed(1)}% EPS growth trading at an attractive PEG of ${peg.toFixed(2)}.`,
            checklist,
            guruVerdict: score >= 85 ? 'PRIME GARP OPPORTUNITY' : 'GROWTH AT FAIR PRICE',
            moatRating: peg < 1.0 ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'oneil') {
      return candidates
        .filter(d => d.high52 > 0 && d.price > d.high52 * 0.82 && (d.growth || 0) > 6)
        .map(d => {
          const proximity = d.price / d.high52;
          const growth = d.growth || 12;

          const checklist = [
            { label: 'Current Earnings Acceleration (C)', passed: growth >= 12, valueStr: `${growth.toFixed(1)}% YoY` },
            { label: 'Annual Earnings Growth (A)', passed: growth >= 10, valueStr: 'Consistent 3-Yr EPS' },
            { label: 'New Highs / Products (N)', passed: proximity >= 0.88, valueStr: `${((1 - proximity) * 100).toFixed(1)}% from 52W High` },
            { label: 'Market Direction Tailwinds (M)', passed: d.change >= 0, valueStr: `${d.change >= 0 ? '+' : ''}${d.change.toFixed(2)}% Trend` }
          ];

          const score = Math.min(99, Math.max(65, Math.floor(70 + (growth / 2) + (proximity * 15))));

          return {
            ...d,
            score,
            reason: `CAN SLIM Formula match: Near 52W High (${d.high52.toFixed(1)}) with ${growth.toFixed(1)}% annual earnings expansion.`,
            checklist,
            guruVerdict: score >= 85 ? 'SUPERPERFORMANCE LEADER' : 'CAN SLIM CANDIDATE',
            moatRating: growth > 15 ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }

    return [];
  }, [marketData, activeGuruId]);

  // Filtered by Search & Score Threshold
  const filteredStocks = useMemo(() => {
    return guruStocks.filter(s => {
      if (search.trim() && !s.symbol.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return s.score >= minScoreFilter;
    });
  }, [guruStocks, search, minScoreFilter]);

  const handleCopyThesis = () => {
    if (!selectedStock) return;
    const text = `🏆 GURU SCAN THESIS (${activeGuru.name}): ${selectedStock.symbol}
• Verdict: ${selectedStock.guruVerdict} (Score: ${selectedStock.score}/100)
• LTP: ₹${selectedStock.price.toFixed(2)} (${selectedStock.change >= 0 ? '+' : ''}${selectedStock.change.toFixed(2)}%)
• P/E Ratio: ${selectedStock.peRatio ? `${selectedStock.peRatio.toFixed(1)}x` : 'N/A'}
• ROE: ${selectedStock.roe ? `${selectedStock.roe.toFixed(1)}%` : 'N/A'}
• 52W Range: ₹${selectedStock.low52.toFixed(1)} - ₹${selectedStock.high52.toFixed(1)}
• Rationale: ${selectedStock.reason}`;
    navigator.clipboard.writeText(text);
    setCopiedThesis(true);
    setTimeout(() => setCopiedThesis(false), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full max-w-[1700px] mx-auto pb-10">

      {/* ── 1. Top Executive Banner ───────────────────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Guru Scan</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> PRO INSTITUTIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Screen NSE stocks through legendary investment algorithms: Minervini, Buffett, Jhunjhunwala, Graham, Lynch &amp; O'Neil
            </p>
          </div>
        </div>

        {/* Global Stats & Rescan */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[110px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Universe</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{WATCHLIST_SYMBOLS.length} Largecaps</div>
          </div>
          <div className="bg-[#101520] border border-slate-800 rounded-xl px-3.5 py-2 min-w-[110px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Guru Matches</div>
            <div className="text-base font-black text-sky-400 font-mono mt-0.5">{guruStocks.length} Stocks</div>
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

      {/* ── 2. Legendary Gurus Selector Matrix ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {GURUS.map((guru) => {
          const isActive = activeGuruId === guru.id;

          return (
            <button
              key={guru.id}
              type="button"
              onClick={() => setActiveGuruId(guru.id)}
              className={`flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none relative overflow-hidden group ${
                isActive
                  ? 'bg-[#101520] border-sky-500/60 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                  : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 hover:bg-[#101520]'
              }`}
            >
              {/* Active Indicator Top Stripe */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-sky-400" />
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="relative">
                  <img 
                    src={guru.imageUrl} 
                    alt={guru.name} 
                    referrerPolicy="no-referrer"
                    className={`w-11 h-11 rounded-xl object-cover border-2 transition ${
                      isActive ? 'border-sky-400' : 'border-slate-800'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.name)}&background=101520&color=fff`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-md bg-[#0c1017] border border-slate-700 shadow">
                    {guru.icon}
                  </div>
                </div>
                
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                )}
              </div>

              <h3 className={`font-black text-xs sm:text-sm truncate mt-1 ${
                isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
              }`}>
                {guru.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate">
                {guru.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── 3. Active Guru Strategy Overview Card ─────────────────────────── */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-4.5 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#101520] border border-slate-800 flex items-center justify-center shrink-0">
            {activeGuru.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-white">{activeGuru.name} Screening Model</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {filteredStocks.length} Matches
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium max-w-2xl">
              {activeGuru.philosophy}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-1.5 bg-[#101520] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-500">Min Score:</span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer"
            >
              <option value={60} className="bg-[#0c1017]">All Matches (60+)</option>
              <option value={70} className="bg-[#0c1017]">70+ (Solid)</option>
              <option value={75} className="bg-[#0c1017]">75+ (Strong)</option>
              <option value={80} className="bg-[#0c1017]">80+ (High Conviction)</option>
              <option value={85} className="bg-[#0c1017]">85+ (Elite Quality)</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#101520] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Matches Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Running {activeGuru.name} Screening Model...</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Analyzing ROE, debt-to-equity ratios, P/E multiples, and 52-week price momentum.
          </p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No stocks currently match {activeGuru.name}'s strict {minScoreFilter}+ score threshold. Try lowering the score filter or click "Rescan".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map((stock) => {
            const scoreColor = stock.score >= 85 ? 'text-purple-400' : stock.score >= 75 ? 'text-sky-400' : 'text-slate-300';
            const scoreBarColor = stock.score >= 85 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : stock.score >= 75 ? 'bg-sky-500' : 'bg-slate-500';

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className="bg-[#0c1017] border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-lg hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Row: Logo + Symbol + Score Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={stock.symbol} className="w-9 h-9 rounded-xl shrink-0 border border-slate-800 bg-[#101520]" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white group-hover:text-sky-400 transition-colors truncate">
                          {stock.symbol}
                        </h3>
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

                    {/* Guru Score Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-baseline gap-0.5">
                        <span className={`text-base font-black font-mono leading-none ${scoreColor}`}>
                          {stock.score}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold">/100</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                        {stock.guruVerdict.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div className={`h-full ${scoreBarColor}`} style={{ width: `${stock.score}%` }} />
                  </div>

                  {/* Fundamental Metrics Pill Strip */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#101520] border border-slate-800/80 rounded-xl text-center mb-3 text-xs font-mono">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold">P/E</div>
                      <div className="text-xs font-black text-white mt-0.5">
                        {stock.peRatio ? `${stock.peRatio.toFixed(1)}x` : '--'}
                      </div>
                    </div>
                    <div className="border-x border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">ROE</div>
                      <div className="text-xs font-black text-emerald-400 mt-0.5">
                        {stock.roe ? `${stock.roe.toFixed(1)}%` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold">52W Proximity</div>
                      <div className="text-xs font-black text-sky-400 mt-0.5">
                        {stock.high52 > 0 ? `${((stock.price / stock.high52) * 100).toFixed(0)}%` : '--'}
                      </div>
                    </div>
                  </div>

                  {/* Scan Rationale */}
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2 font-medium">
                    {stock.reason}
                  </p>
                </div>

                {/* Bottom Footer */}
                <div className="mt-2 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" /> Moat: {stock.moatRating}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Thesis</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Interactive Guru Stock Thesis Modal ───────────────────────── */}
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
                    LTP: ₹{selectedStock.price.toFixed(2)} • {activeGuru.name} Score: {selectedStock.score}/100
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

            {/* Guru Verdict Banner */}
            <div className="bg-[#101520] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Guru Model Verdict</div>
                <div className="text-sm font-black text-white mt-0.5">{selectedStock.guruVerdict}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Moat Rating</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">{selectedStock.moatRating} Moat</div>
              </div>
            </div>

            {/* 4-Point Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-300 uppercase tracking-wider">
                {activeGuru.name}'s Fundamental Checklist
              </div>
              <div className="space-y-1.5">
                {selectedStock.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#101520] border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      {item.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className={`font-medium ${item.passed ? 'text-white' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sky-400 text-[11px] shrink-0">
                      {item.valueStr}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 52-Week Range Bar */}
            <div className="bg-[#101520] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">52W Low</div>
                  <div className="text-white font-bold">₹{selectedStock.low52.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Current Price</div>
                  <div className="text-sky-400 font-black">₹{selectedStock.price.toFixed(1)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">52W High</div>
                  <div className="text-white font-bold">₹{selectedStock.high52.toFixed(1)}</div>
                </div>
              </div>

              {/* Range progress line */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                {selectedStock.high52 > selectedStock.low52 && (
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, Math.max(5, ((selectedStock.price - selectedStock.low52) / (selectedStock.high52 - selectedStock.low52)) * 100))}%` 
                    }} 
                  />
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCopyThesis}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#101520] border border-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition select-none"
              >
                {copiedThesis ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Layers className="w-4 h-4" />}
                <span>{copiedThesis ? 'Thesis Copied!' : 'Copy Thesis'}</span>
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
}
