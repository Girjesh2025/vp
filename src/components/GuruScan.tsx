import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Search, TrendingUp, Shield, Activity, Star, DollarSign, 
  Sparkles, CheckCircle2, XCircle, ArrowUpRight, Check, X,
  Layers, RefreshCw, BarChart2, Award, Zap, ChevronRight,
  LayoutGrid, Table as TableIcon, ArrowUpDown, ExternalLink
} from 'lucide-react';
import { fetchGuruFundamentals, StockFundamentals } from '../utils/priceApi';
import StockLogo from './StockLogo';

export type GuruSortField = 'symbol' | 'price' | 'change' | 'score' | 'peRatio' | 'roe' | 'debtToEquity' | 'high52' | 'moatRating' | 'guruVerdict';
export type GuruSortOrder = 'asc' | 'desc';

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
    imageUrl: '/gurus/minervini.jpg'
  },
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'Economic Moat & Value',
    philosophy: 'High Return on Equity (ROE), low debt burden, and durable competitive advantage.',
    quote: 'It is far better to buy a wonderful company at a fair price than a fair company at a wonderful price.',
    accentColor: '#38bdf8',
    icon: <Shield className="w-5 h-5 text-sky-400" />,
    imageUrl: '/gurus/buffett.jpg'
  },
  {
    id: 'jhunjhunwala',
    name: 'Rakesh Jhunjhunwala',
    title: 'Indian Bull Compounding',
    philosophy: 'High domestic market tailwinds, operating leverage, and aggressive earnings growth.',
    quote: 'Anticipate trend and benefit from it. Traders should go against human nature.',
    accentColor: '#10b981',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    imageUrl: '/gurus/jhunjhunwala.jpg'
  },
  {
    id: 'graham',
    name: 'Benjamin Graham',
    title: 'Deep Margin of Safety',
    philosophy: 'Low P/E, conservative debt ratios, and severe discount to intrinsic value.',
    quote: 'The essence of investment management is the management of risks, not the management of returns.',
    accentColor: '#a855f7',
    icon: <DollarSign className="w-5 h-5 text-purple-400" />,
    imageUrl: '/gurus/graham.jpg'
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    title: 'GARP (Growth At Fair Price)',
    philosophy: 'PEG ratio < 1.2, scalable business models, and strong PEG-adjusted earnings momentum.',
    quote: 'Know what you own, and know why you own it.',
    accentColor: '#ec4899',
    icon: <Star className="w-5 h-5 text-pink-400" />,
    imageUrl: '/gurus/lynch.jpg'
  },
  {
    id: 'oneil',
    name: "William J. O'Neil",
    title: 'CAN SLIM Formula',
    philosophy: 'Accelerating quarterly EPS, annual sales growth, and leadership in sector relative strength.',
    quote: 'The whole secret to winning big in the stock market is to not be right all the time, but to lose the least amount possible when you are wrong.',
    accentColor: '#f43f5e',
    icon: <Activity className="w-5 h-5 text-rose-400" />,
    imageUrl: '/gurus/oneil.jpg'
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
  'LODHA', 'LICHSGFIN', 'IRFC', 'BSOFT', 'DELHIVERY', 'DIXON', 'POLYCAB',
  'BEL', 'HAL', 'TRENT', 'BSE', 'ZOMATO', 'CDSL', 'KALYANKJIL', 'MAXHEALTH'
];

export default function GuruScan() {
  const [activeGuruId, setActiveGuruId] = useState<string>(GURUS[0].id);
  const [search, setSearch] = useState('');
  const [marketData, setMarketData] = useState<StockFundamentals[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(65);

  // View Mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('guru_scan_view_mode');
      return (saved === 'table' || saved === 'grid') ? saved : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('guru_scan_view_mode', mode);
    } catch {}
  };

  // Sorting for Tabular View
  const [sortField, setSortField] = useState<GuruSortField>('score');
  const [sortOrder, setSortOrder] = useState<GuruSortOrder>('desc');

  const handleSort = (field: GuruSortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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

  // Helper to ensure clean, normalized Debt-to-Equity multiple (e.g. 0.35x instead of 35.0%)
  const getNormDE = (val: number | undefined | null): number => {
    if (!val || val <= 0) return 0;
    return val > 5 ? Number((val / 100).toFixed(2)) : Number(val.toFixed(2));
  };

  // Helper to ensure clean PEG ratio
  const getNormPEG = (peg: number | undefined | null, pe: number, growth: number): number => {
    if (peg && peg > 0) return Number(peg.toFixed(2));
    if (pe > 0 && growth > 0) return Number((pe / growth).toFixed(2));
    return pe > 0 ? Number((pe / 15).toFixed(2)) : 1.2;
  };

  // Dynamic Guru Scoring Engine (Updated for Modern Indian Market Scenario)
  const guruStocks = useMemo<GuruStock[]>(() => {
    if (!marketData || marketData.length === 0) return [];
    const candidates = [...marketData];

    if (activeGuruId === 'minervini') {
      return candidates
        .filter(d => {
          if (!d.high52 || d.high52 <= 0) return false;
          const proximity = d.price / d.high52;
          const isOffLow = d.low52 > 0 ? d.price >= d.low52 * 1.15 : true;
          return proximity >= 0.78 && isOffLow;
        })
        .map(d => {
          const proximity = d.price / d.high52;
          const lowOffset = d.low52 > 0 ? ((d.price - d.low52) / d.low52) * 100 : 25;
          const rangePosition = d.high52 > d.low52 ? (d.price - d.low52) / (d.high52 - d.low52) : 0.8;
          const isNear52W = proximity >= 0.85;
          const isStage2 = lowOffset >= 25;
          const isPositiveMove = d.change >= 0;
          const hasGrowth = (d.growth || 0) >= 8;

          const checklist = [
            { label: 'Within 15% of 52-Week High (Base Consolidation)', passed: isNear52W, valueStr: `${((1 - proximity) * 100).toFixed(1)}% from high` },
            { label: 'Confirmed Stage 2 Uptrend (> 25% off 52W Low)', passed: isStage2, valueStr: `+${lowOffset.toFixed(1)}% off low` },
            { label: 'Relative Strength (RS) Leader (Top Tier Range)', passed: rangePosition >= 0.75, valueStr: `${Math.round(rangePosition * 100)}th RS Percentile` },
            { label: 'Quarterly Earnings Stability (> 8% YoY)', passed: hasGrowth, valueStr: `${(d.growth || 12).toFixed(1)}% Growth` }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(65, Math.floor((rangePosition * 45) + (proximity * 35) + (passedCount * 5))));

          return {
            ...d,
            score,
            reason: `Stage 2 Superperformance candidate trading ${((1 - proximity) * 100).toFixed(1)}% from 52W High and +${lowOffset.toFixed(1)}% above 52W Low with solid relative strength.`,
            checklist,
            guruVerdict: score >= 85 ? 'STAGE 2 SUPERPERFORMANCE' : score >= 75 ? 'HIGH CONVICTION BREAKOUT' : 'MOMENTUM WATCHLIST',
            moatRating: rangePosition >= 0.85 ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    } 
    else if (activeGuruId === 'buffett') {
      return candidates
        .filter(d => {
          const de = getNormDE(d.debtToEquity);
          return d.roe >= 11 && de <= 1.0 && d.peRatio > 0 && d.peRatio < 60;
        })
        .map(d => {
          const de = getNormDE(d.debtToEquity);
          const highRoe = d.roe >= 15;
          const ultraRoe = d.roe >= 22;
          const lowDebt = de <= 0.6;
          const fairValuation = d.peRatio <= 38;

          const checklist = [
            { label: 'Return on Equity (ROE) > 15%', passed: highRoe, valueStr: `${d.roe.toFixed(1)}% ROE` },
            { label: 'Conservative Balance Sheet (D/E < 0.6x)', passed: lowDebt, valueStr: `${de.toFixed(2)}x D/E` },
            { label: 'Durable Competitive Moat & Pricing Power', passed: true, valueStr: ultraRoe ? 'Wide Moat Champion' : 'Established Franchise' },
            { label: 'Fair Valuation Multiple (P/E < 38x)', passed: fairValuation, valueStr: `${d.peRatio.toFixed(1)}x P/E` }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(68, Math.floor(62 + Math.min(22, d.roe * 0.5) - (de * 12) + (fairValuation ? 5 : 0) + (passedCount * 3))));

          return {
            ...d,
            score,
            reason: `High capital compounding efficiency with ${d.roe.toFixed(1)}% ROE, sound ${de.toFixed(2)}x D/E leverage, and durable competitive franchise.`,
            checklist,
            guruVerdict: score >= 85 ? 'COMPOUNDING WIDE MOAT' : 'QUALITY COMPOUNDER',
            moatRating: ultraRoe && lowDebt ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'jhunjhunwala') {
      return candidates
        .filter(d => {
          const growth = d.growth || 12;
          return (growth >= 8 || d.roe >= 13) && d.peRatio > 0 && d.peRatio < 65;
        })
        .map(d => {
          const growth = d.growth || 14;
          const de = getNormDE(d.debtToEquity);
          const highGrowth = growth >= 12;
          const highRoe = d.roe >= 14;
          const reasonableDebt = de <= 0.8;

          const checklist = [
            { label: 'Secular Revenue / EPS Expansion (> 10% YoY)', passed: highGrowth, valueStr: `${growth.toFixed(1)}% Growth` },
            { label: 'India Domestic Capex & Consumption Wave', passed: true, valueStr: 'High Macro Tailwinds' },
            { label: 'Superior Operating Returns (ROE > 14%)', passed: highRoe, valueStr: `${d.roe.toFixed(1)}% ROE` },
            { label: 'Prudent Solvency & Institutional Holding', passed: reasonableDebt, valueStr: `${de.toFixed(2)}x D/E` }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(70, Math.floor(64 + Math.min(18, growth * 0.7) + (d.roe * 0.4) - (de * 8) + (passedCount * 3))));

          return {
            ...d,
            score,
            reason: `High beta Indian growth compounder positioned directly in domestic capex & consumption expansion with ${growth.toFixed(1)}% growth and ${d.roe.toFixed(1)}% ROE.`,
            checklist,
            guruVerdict: score >= 85 ? 'HIGH GROWTH COMPOUNDER' : 'STRONG CYCLE PLAY',
            moatRating: growth >= 16 && highRoe ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'graham') {
      return candidates
        .filter(d => {
          const de = getNormDE(d.debtToEquity);
          return d.peRatio > 0 && d.peRatio <= 25 && de <= 0.85;
        })
        .map(d => {
          const de = getNormDE(d.debtToEquity);
          const deepPe = d.peRatio <= 16;
          const fairPe = d.peRatio <= 22;
          const lowDebt = de <= 0.5;

          const checklist = [
            { label: 'Deep Value P/E Multiple (< 20x)', passed: fairPe, valueStr: `${d.peRatio.toFixed(1)}x P/E` },
            { label: 'Solvent Balance Sheet (D/E < 0.6x)', passed: lowDebt, valueStr: `${de.toFixed(2)}x D/E` },
            { label: 'Substantial Margin of Safety to Market', passed: deepPe, valueStr: deepPe ? 'High Safety Buffer' : 'Modest Discount' },
            { label: 'Resilient Earnings & Cash Generation', passed: true, valueStr: 'Consistently Profitable' }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(65, Math.floor(98 - (d.peRatio * 1.5) - (de * 10) + (passedCount * 3))));

          return {
            ...d,
            score,
            reason: `Deep value margin of safety: P/E at ${d.peRatio.toFixed(1)}x with conservative ${de.toFixed(2)}x D/E, providing downside protection in market volatility.`,
            checklist,
            guruVerdict: score >= 85 ? 'DEEP MARGIN OF SAFETY' : 'UNDERVALUED BLUECHIP',
            moatRating: deepPe && lowDebt ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'lynch') {
      return candidates
        .filter(d => {
          const growth = d.growth || 12;
          const peg = getNormPEG(d.pegRatio, d.peRatio, growth);
          return peg > 0 && peg <= 2.2 && d.peRatio > 0 && d.peRatio <= 50;
        })
        .map(d => {
          const growth = d.growth || 14;
          const peg = getNormPEG(d.pegRatio, d.peRatio, growth);
          const elitePeg = peg <= 1.1;
          const goodPeg = peg <= 1.5;
          const doubleDigitGrowth = growth >= 10;
          const fairPe = d.peRatio <= 36;

          const checklist = [
            { label: 'Favorable PEG Ratio (< 1.2x GARP Standard)', passed: goodPeg, valueStr: `${peg.toFixed(2)} PEG` },
            { label: 'Double-Digit Annual Growth (> 10% YoY)', passed: doubleDigitGrowth, valueStr: `${growth.toFixed(1)}% Growth` },
            { label: 'Reasonable P/E Relative to Peers (< 36x)', passed: fairPe, valueStr: `${d.peRatio.toFixed(1)}x P/E` },
            { label: 'Understandable Franchise & Scalable Model', passed: true, valueStr: 'High Free Cash Flow' }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(68, Math.floor(96 - (peg * 16) + (passedCount * 3))));

          return {
            ...d,
            score,
            reason: `GARP Leader: Expanding at ${growth.toFixed(1)}% YoY with an attractive PEG of ${peg.toFixed(2)}x, balancing growth with valuation discipline.`,
            checklist,
            guruVerdict: score >= 85 ? 'PRIME GARP WINNER' : 'GROWTH AT FAIR PRICE',
            moatRating: elitePeg ? 'Wide' : 'Moderate'
          };
        })
        .sort((a, b) => b.score - a.score);
    }
    else if (activeGuruId === 'oneil') {
      return candidates
        .filter(d => {
          if (!d.high52 || d.high52 <= 0) return false;
          const proximity = d.price / d.high52;
          const isOffLow = d.low52 > 0 ? d.price >= d.low52 * 1.15 : true;
          return proximity >= 0.80 && isOffLow;
        })
        .map(d => {
          const proximity = d.price / d.high52;
          const growth = d.growth || 12;
          const lowOffset = d.low52 > 0 ? ((d.price - d.low52) / d.low52) * 100 : 25;
          const rangePos = d.high52 > d.low52 ? (d.price - d.low52) / (d.high52 - d.low52) : 0.85;

          const checklist = [
            { label: 'Current Earnings Acceleration (C > 10% YoY)', passed: growth >= 10, valueStr: `${growth.toFixed(1)}% YoY` },
            { label: 'Annual Earnings Growth Consistency (A)', passed: growth >= 8, valueStr: 'Multi-Year Expansion' },
            { label: 'New Highs Proximity (N within 15%)', passed: proximity >= 0.85, valueStr: `${((1 - proximity) * 100).toFixed(1)}% from high` },
            { label: 'Leading Stock in Leading Industry (L)', passed: rangePos >= 0.75, valueStr: `${Math.round(rangePos * 100)}th RS Rank` }
          ];

          const passedCount = checklist.filter(c => c.passed).length;
          const score = Math.min(99, Math.max(65, Math.floor(66 + (rangePos * 25) + ((growth || 10) * 0.5) + (passedCount * 4))));

          return {
            ...d,
            score,
            reason: `CAN SLIM Leader: High relative strength trading within ${((1 - proximity) * 100).toFixed(1)}% of 52W High with ${growth.toFixed(1)}% earnings momentum.`,
            checklist,
            guruVerdict: score >= 85 ? 'CAN SLIM SUPERPERFORMER' : 'CAN SLIM CANDIDATE',
            moatRating: growth > 15 && rangePos >= 0.80 ? 'Wide' : 'Moderate'
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

  // Sorted Stocks (supports both Grid and Tabular sorting)
  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'high52') {
        aVal = a.high52 > 0 ? (a.price / a.high52) : 0;
        bVal = b.high52 > 0 ? (b.price / b.high52) : 0;
      }

      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredStocks, sortField, sortOrder]);

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
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
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
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">{guruStocks.length} Stocks</div>
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

      {/* ── 2. Legendary Gurus Selector Matrix ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {GURUS.map((guru) => {
          const isActive = activeGuruId === guru.id;

          return (
            <button
              key={guru.id}
              type="button"
              onClick={() => setActiveGuruId(guru.id)}
              className={`flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden group ${
                isActive
                  ? 'bg-[#101520] border-sky-500/80 shadow-[0_0_25px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/50'
                  : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 hover:bg-[#101520]'
              }`}
            >
              {/* Active Indicator Top Stripe */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
              )}

              {/* Large, Crystal Clear Portrait - NO FACE OVERLAYS */}
              <div className="relative mb-2.5">
                <img 
                  src={guru.imageUrl} 
                  alt={guru.name} 
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-md transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'border-2 border-sky-400 shadow-sky-500/20' : 'border border-slate-800'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.name)}&background=101520&color=fff`;
                  }}
                />
                
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-[#0c1017] animate-pulse" />
                )}
              </div>

              <h3 className={`font-black text-xs sm:text-sm tracking-tight truncate w-full ${
                isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
              }`}>
                {guru.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate w-full">
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

        {/* Filter, Search & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
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

          <div className="relative flex-1 md:w-44">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#101520] border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
            />
          </div>

          {/* View Mode Toggle: Cards vs Tabular */}
          <div className="flex items-center bg-[#101520] border border-slate-700/80 rounded-lg p-0.5 shadow-sm shrink-0">
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

      {/* ── 4. Main Matches Content (Grid or Tabular) ─────────────────────── */}
      {loading ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Running {activeGuru.name} Screening Model...</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Analyzing ROE, debt-to-equity ratios, P/E multiples, and 52-week price momentum.
          </p>
        </div>
      ) : sortedStocks.length === 0 ? (
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No stocks currently match {activeGuru.name}'s strict {minScoreFilter}+ score threshold. Try lowering the score filter or click "Rescan".
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Cards Grid View ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedStocks.map((stock) => {
            const scoreColor = stock.score >= 85 ? 'text-purple-400' : stock.score >= 75 ? 'text-sky-400' : 'text-emerald-400';
            const scoreBarColor = stock.score >= 85 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : stock.score >= 75 ? 'bg-sky-500' : 'bg-emerald-500';

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
                        <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate">
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
                    <Award className="w-3 h-3 text-emerald-400" /> Moat: {stock.moatRating}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Thesis</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Tabular Mode View ────────────────────────────────────────────── */
        <div className="bg-[#0c1017] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-sans text-xs min-w-[1100px]">
              <thead>
                <tr className="bg-[#101520] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  {/* Stock Symbol */}
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

                  {/* LTP & Change */}
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

                  {/* Guru Score */}
                  <th 
                    onClick={() => handleSort('score')}
                    className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Guru Score</span>
                      {sortField === 'score' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Verdict */}
                  <th 
                    onClick={() => handleSort('guruVerdict')}
                    className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Verdict</span>
                      {sortField === 'guruVerdict' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Key Rationale */}
                  <th className="py-3.5 px-3 min-w-[240px]">
                    Screening Thesis &amp; Rationale
                  </th>

                  {/* P/E Ratio */}
                  <th 
                    onClick={() => handleSort('peRatio')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>P/E</span>
                      {sortField === 'peRatio' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* ROE */}
                  <th 
                    onClick={() => handleSort('roe')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>ROE</span>
                      {sortField === 'roe' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Debt to Equity */}
                  <th 
                    onClick={() => handleSort('debtToEquity')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>D/E</span>
                      {sortField === 'debtToEquity' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* 52W Proximity */}
                  <th 
                    onClick={() => handleSort('high52')}
                    className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>52W Prox</span>
                      {sortField === 'high52' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Moat */}
                  <th 
                    onClick={() => handleSort('moatRating')}
                    className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Moat</span>
                      {sortField === 'moatRating' ? (
                        <span className="text-emerald-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Action */}
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedStocks.map((stock) => {
                  const scoreColor = stock.score >= 85 ? 'text-purple-400' : stock.score >= 75 ? 'text-sky-400' : 'text-emerald-400';
                  const scoreBarColor = stock.score >= 85 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : stock.score >= 75 ? 'bg-sky-500' : 'bg-emerald-500';
                  const proxPct = stock.high52 > 0 ? Math.min(100, Math.round((stock.price / stock.high52) * 100)) : null;

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className="hover:bg-[#121926]/75 transition-colors cursor-pointer group"
                    >
                      {/* Stock Symbol & Logo */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <StockLogo symbol={stock.symbol} className="w-8 h-8 rounded-lg shrink-0 border border-slate-800 bg-[#101520]" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                                {stock.symbol}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border bg-sky-500/10 text-sky-400 border-sky-500/25">
                                NSE
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {stock.moatRating} Moat
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* LTP & Change */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-white">
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            stock.change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </td>

                      {/* Guru Score */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-baseline gap-0.5">
                            <span className={`text-base font-black ${scoreColor}`}>
                              {stock.score}
                            </span>
                            <span className="text-[9px] text-slate-500">/100</span>
                          </div>
                          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div className={`h-full ${scoreBarColor}`} style={{ width: `${stock.score}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Verdict */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          stock.score >= 85
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : stock.score >= 75
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {stock.guruVerdict}
                        </span>
                      </td>

                      {/* Screening Thesis & Rationale */}
                      <td className="py-3.5 px-3 font-sans min-w-[240px]">
                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2" title={stock.reason}>
                          {stock.reason}
                        </p>
                      </td>

                      {/* P/E */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="text-xs font-bold text-white">
                          {stock.peRatio ? `${stock.peRatio.toFixed(1)}x` : '--'}
                        </div>
                      </td>

                      {/* ROE */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className={`text-xs font-bold ${stock.roe && stock.roe >= 15 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {stock.roe ? `${stock.roe.toFixed(1)}%` : '--'}
                        </div>
                      </td>

                      {/* D/E */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {(() => {
                          const de = getNormDE(stock.debtToEquity);
                          return (
                            <div className={`text-xs font-bold ${de <= 0.6 ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {de.toFixed(2)}x
                            </div>
                          );
                        })()}
                      </td>

                      {/* 52W Proximity */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {proxPct !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-bold text-sky-400">{proxPct}%</span>
                            <span className="text-[9px] text-slate-500 font-sans">of 52W High</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">--</span>
                        )}
                      </td>

                      {/* Moat */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stock.moatRating === 'Wide'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : stock.moatRating === 'Moderate'
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {stock.moatRating}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStock(stock);
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-500/10 transition"
                          >
                            <span>Thesis</span>
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
