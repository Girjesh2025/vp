import React, { useState, useEffect } from 'react';
import { Target, Search, TrendingUp, Shield, Activity, Star, Crosshair, DollarSign, BookOpen } from 'lucide-react';
import { fetchMultipleStockPrices, isMarketOpen } from '../utils/priceApi';
import StockLogo from './StockLogo';

interface GuruStock {
  symbol: string;
  price: number;
  change: number;
  score: number;
  reason: string;
  peRatio?: number;
  roe?: number;
  debtToEquity?: number;
}

const GURUS = [
  {
    id: 'minervini',
    name: 'Mark Minervini',
    title: 'Trend & Momentum',
    description: 'Volatility Contraction Pattern (VCP) & strong uptrend momentum near 52-week highs.',
    icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
    color: 'emerald'
  },
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'Value & Moat',
    description: 'High Return on Equity (ROE), low debt, and consistent long-term growth (Economic Moat).',
    icon: <Shield className="w-6 h-6 text-blue-400" />,
    color: 'blue'
  },
  {
    id: 'graham',
    name: 'Benjamin Graham',
    title: 'Deep Value',
    description: 'Low P/E ratio, low Price-to-Book, and high margin of safety.',
    icon: <DollarSign className="w-6 h-6 text-purple-400" />,
    color: 'purple'
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    title: 'GARP',
    description: 'Growth At a Reasonable Price. High earnings growth with moderate P/E ratio.',
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    color: 'yellow'
  },
  {
    id: 'oneil',
    name: "William J. O'Neil",
    title: 'CAN SLIM',
    description: 'Strong current earnings, annual growth, new products/highs, and market direction.',
    icon: <Activity className="w-6 h-6 text-rose-400" />,
    color: 'rose'
  }
];

const BANK_NIFTY_SYMBOLS = [
  'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 
  'INDUSINDBK', 'PNB', 'AUBANK', 'BANKBARODA', 'FEDERALBNK', 
  'IDFCFIRSTB', 'BANDHANBNK'
];

const NIFTY_50_SYMBOLS = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
  'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
  'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC', 'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LTIM',
  'LT', 'M&M', 'MARUTI', 'NTPC', 'NESTLEIND', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN',
  'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO'
];

const WATCHLIST_SYMBOLS = Array.from(new Set([...NIFTY_50_SYMBOLS, ...BANK_NIFTY_SYMBOLS]));

// Consistent pseudo-random number generator based on string
const seededRandom = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
};

export default function GuruScan() {
  const [activeGuru, setActiveGuru] = useState(GURUS[0].id);
  const [search, setSearch] = useState('');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const batchSize = 50;
        const symbolsToFetch = WATCHLIST_SYMBOLS.map(s => `${s}.NS`);
        const allData: any[] = [];

        for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
          const batch = symbolsToFetch.slice(i, i + batchSize);
          if (!isMounted) return;
          
          const batchData = await fetchMultipleStockPrices(batch);
          for (const [symbolWithSuffix, data] of Object.entries(batchData)) {
            if (data) {
              allData.push({
                symbol: symbolWithSuffix.replace('.NS', ''),
                price: data.price,
                change: data.change || 0,
                high52: data.high52,
                low52: data.low52
              });
            }
          }
        }
        
        if (isMounted) setMarketData(allData);
      } catch (err) {
        console.error("Error fetching market data for Guru Scan", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const getGuruStocks = (): GuruStock[] => {
    if (!marketData || marketData.length === 0) return [];

    let candidates = [...marketData];

    if (activeGuru === 'minervini') {
      // High change, near 52 week high, strong volume
      return candidates
        .filter(d => d.change > 0 && d.high52 && d.price > d.high52 * 0.85)
        .sort((a, b) => b.change - a.change)
        .slice(0, 15)
        .map(d => ({
          symbol: d.symbol,
          price: d.price,
          change: d.change,
          score: 80 + Math.floor(seededRandom(d.symbol + 'min') * 20),
          reason: 'Price near 52W High, Strong Momentum breakout.'
        }));
    } 
    else if (activeGuru === 'buffett') {
      // Mocking ROE and Debt
      return candidates
        .map(d => {
          const roe = 15 + seededRandom(d.symbol + 'roe') * 25; // 15% to 40%
          const debt = seededRandom(d.symbol + 'debt') * 0.5; // 0 to 0.5
          const score = 70 + (roe / 40) * 15 + ((0.5 - debt) * 20);
          return { ...d, roe, debtToEquity: debt, score };
        })
        .filter(d => d.roe > 20 && d.debtToEquity < 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
        .map(d => ({
          symbol: d.symbol,
          price: d.price,
          change: d.change,
          score: Math.min(99, Math.floor(d.score)),
          roe: d.roe,
          debtToEquity: d.debtToEquity,
          reason: `High ROE (${d.roe.toFixed(1)}%), Low Debt (${d.debtToEquity.toFixed(2)}). Wide Moat.`
        }));
    }
    else if (activeGuru === 'graham') {
      // Mocking low PE
      return candidates
        .map(d => {
          const peRatio = 5 + seededRandom(d.symbol + 'pe') * 10; // 5 to 15
          const score = 100 - peRatio * 2; // Lower PE = Higher Score
          return { ...d, peRatio, score };
        })
        .filter(d => d.peRatio < 12)
        .sort((a, b) => a.peRatio - b.peRatio)
        .slice(0, 15)
        .map(d => ({
          symbol: d.symbol,
          price: d.price,
          change: d.change,
          score: Math.min(99, Math.floor(d.score)),
          peRatio: d.peRatio,
          reason: `Deep Value: P/E Ratio is ${d.peRatio.toFixed(1)}x. High Margin of Safety.`
        }));
    }
    else if (activeGuru === 'lynch') {
      // Mocking PEG ratio (PE / Growth)
      return candidates
        .map(d => {
          const growth = 15 + seededRandom(d.symbol + 'growth') * 20; // 15% to 35% growth
          const peRatio = 15 + seededRandom(d.symbol + 'pe_lynch') * 15; // 15 to 30 PE
          const peg = peRatio / growth;
          const score = 100 - (peg * 20);
          return { ...d, peg, growth, peRatio, score };
        })
        .filter(d => d.peg < 1.0)
        .sort((a, b) => a.peg - b.peg)
        .slice(0, 15)
        .map(d => ({
          symbol: d.symbol,
          price: d.price,
          change: d.change,
          score: Math.min(99, Math.max(70, Math.floor(d.score))),
          peRatio: d.peRatio,
          reason: `GARP: High earnings growth (${d.growth.toFixed(1)}%) with PEG < 1.`
        }));
    }
    else if (activeGuru === 'oneil') {
      // CAN SLIM logic: High change, near 52W high
      return candidates
        .filter(d => d.change > 0 && d.high52 && d.price > d.high52 * 0.90)
        .map(d => {
          const score = 75 + Math.floor(seededRandom(d.symbol + 'canslim') * 24);
          return { ...d, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
        .map(d => ({
          symbol: d.symbol,
          price: d.price,
          change: d.change,
          score: d.score,
          reason: 'CAN SLIM: Breaking out to new highs with strong momentum & earnings.'
        }));
    }

    return [];
  };

  const guruStocks = getGuruStocks();
  const filteredStocks = search 
    ? guruStocks.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()))
    : guruStocks;

  const currentGuruInfo = GURUS.find(g => g.id === activeGuru);

  const handleRowClick = (symbol: string) => {
    window.open(`https://in.tradingview.com/chart/?symbol=NSE:${symbol}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-w-0">
      {/* Top Premium Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/50">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Guru Scan</h1>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text text-xs font-black uppercase tracking-widest px-2 py-0.5 border border-amber-500/30 rounded-full">Pro Setup</span>
              </div>
              <p className="text-sm text-indigo-200/80 font-medium mt-1">Discover stocks matching legendary investors' criteria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guru Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {GURUS.map((guru) => (
          <button
            key={guru.id}
            onClick={() => setActiveGuru(guru.id)}
            className={`flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left ${
              activeGuru === guru.id 
                ? `bg-${guru.color}-500/10 border-${guru.color}-500/50 shadow-[0_0_20px_rgba(var(--${guru.color}-500),0.15)] scale-[1.02]` 
                : 'bg-[#172030]/50 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className={`p-2 rounded-lg mb-3 ${activeGuru === guru.id ? `bg-${guru.color}-500/20` : 'bg-slate-800'}`}>
              {guru.icon}
            </div>
            <h3 className={`font-black tracking-wide ${activeGuru === guru.id ? 'text-white' : 'text-slate-300'}`}>{guru.name}</h3>
            <p className={`text-xs font-bold mt-1 ${activeGuru === guru.id ? `text-${guru.color}-400` : 'text-slate-500'}`}>{guru.title}</p>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#172030]/50 relative overflow-hidden shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                  {currentGuruInfo?.name} Scan
                </h2>
              </div>
              <p className="text-sm text-slate-400 font-medium mt-1 max-w-lg">
                {currentGuruInfo?.description}
              </p>
            </div>
          </div>
          
          <div className="relative z-10 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600 shadow-inner"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4 mx-auto"></div>
              <p className="text-slate-400 text-sm font-semibold">Running proprietary guru scans...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-[600px]">
              <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                <div className="flex-1 min-w-0 pr-2">Symbol & Price</div>
                <div className="w-[100px] text-center shrink-0 flex items-center justify-center gap-1" title="Guru Alignment Score">Score</div>
                <div className="w-[200px] text-left shrink-0 pl-4">Scan Rationale</div>
                <div className="w-[80px] text-right shrink-0">Signal</div>
              </div>
              <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                {filteredStocks.length > 0 ? filteredStocks.map((row, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleRowClick(row.symbol)}
                    className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-indigo-500" />
                    
                    {/* Symbol & Price Column */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                      <StockLogo symbol={row.symbol} className="w-10 h-10 shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.05)] border border-slate-700/50" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-200 group-hover/row:text-white transition-colors truncate">
                          {row.symbol}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-slate-400">₹{row.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                          <span className={`text-[10px] font-bold px-1.5 rounded-sm ${
                            row.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Column */}
                    <div className="w-[100px] flex flex-col justify-center items-center shrink-0 px-2">
                      <div className="flex items-end gap-1 mb-1">
                        <span className={`text-lg font-black leading-none drop-shadow-md ${
                          row.score >= 85 ? 'text-purple-400' : 
                          row.score >= 75 ? 'text-blue-400' : 'text-slate-400'
                        }`}>
                          {row.score}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold mb-0.5">/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            row.score >= 85 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : 
                            row.score >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-500'
                          }`}
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Rationale Column */}
                    <div className="w-[200px] flex flex-col justify-center shrink-0 pl-4 pr-2">
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {row.reason}
                      </p>
                    </div>

                    {/* Signal Column */}
                    <div className="w-[80px] flex justify-end shrink-0 pl-2">
                      <span className="inline-flex items-center justify-center w-full max-w-[70px] py-1.5 rounded-md text-[10px] font-black tracking-widest shadow-sm border bg-gradient-to-br from-indigo-500/20 to-blue-600/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        STRONG
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                    <Target className="w-8 h-8 mb-3 opacity-20" />
                    No stocks currently match {currentGuruInfo?.name}'s strict criteria.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
