import React, { useState, useEffect } from 'react';
import { Target, Search, TrendingUp, Shield, Activity, Star, Crosshair, DollarSign, BookOpen } from 'lucide-react';
import { fetchGuruFundamentals, StockFundamentals } from '../utils/priceApi';
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
    color: 'emerald',
    imageUrl: 'https://unavatar.io/twitter/markminervini'
  },
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'Value & Moat',
    description: 'High Return on Equity (ROE), low debt, and consistent long-term growth (Economic Moat).',
    icon: <Shield className="w-6 h-6 text-blue-400" />,
    color: 'blue',
    imageUrl: 'https://unavatar.io/twitter/WarrenBuffett'
  },
  {
    id: 'graham',
    name: 'Benjamin Graham',
    title: 'Deep Value',
    description: 'Low P/E ratio, low Price-to-Book, and high margin of safety.',
    icon: <DollarSign className="w-6 h-6 text-purple-400" />,
    color: 'purple',
    imageUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/2a/Benjamin_Graham_%281894-1976%29_portrait_on_23_March_1950.jpg&w=400&h=400&fit=cover'
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    title: 'GARP',
    description: 'Growth At a Reasonable Price. High earnings growth with moderate P/E ratio.',
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    color: 'yellow',
    imageUrl: 'https://images.openai.com/static-rsc-4/UPEZlz3hyLhsLamSPyukvLazAITm9gBp8xquXh6Nfxa9u44jTP3MHWPTquB9agdQME4aipAXa62RYj-pq_Oo1HVR3Nn68H6-VO4pGaB_Wpr5JEj46tFAsfadJQT9JEWDMKpc58er6zilI3f_HxY7q9P590QxtXDXAaKFjpDnZXMoU3W6KkBoaL0VkdBu616N?purpose=fullsize'
  },
  {
    id: 'oneil',
    name: "William J. O'Neil",
    title: 'CAN SLIM',
    description: 'Strong current earnings, annual growth, new products/highs, and market direction.',
    icon: <Activity className="w-6 h-6 text-rose-400" />,
    color: 'rose',
    imageUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/en/b/b3/William_J._O%27Neil_%281933-2023%29_in_2018.jpg&w=400&h=400&fit=cover'
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
  const [marketData, setMarketData] = useState<StockFundamentals[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const batchSize = 15;
        const symbolsToFetch = WATCHLIST_SYMBOLS.map(s => `${s}.NS`);
        const allData: StockFundamentals[] = [];

        for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
          const batch = symbolsToFetch.slice(i, i + batchSize);
          if (!isMounted) return;
          
          const batchData = await fetchGuruFundamentals(batch);
          for (const data of Object.values(batchData)) {
            if (data && data.price > 0) {
              allData.push(data);
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
      return candidates
        .filter(d => d.high52 > 0 && d.price > d.high52 * 0.80) // Relaxed to 80%
        .sort((a, b) => b.change - a.change)
        .slice(0, 15)
        .map(d => {
          const proximity = d.price / d.high52;
          const score = Math.min(99, Math.floor((proximity * 50) + (d.change * 5)));
          return {
            ...d,
            score: Math.max(70, score),
            reason: `Price is within ${((1 - proximity) * 100).toFixed(1)}% of 52W High. Strong trend.`
          };
        });
    } 
    else if (activeGuru === 'buffett') {
      return candidates
        .filter(d => d.roe > 10 && (d.debtToEquity / 100) < 1.0 && d.peRatio > 0) // Relaxed ROE and Debt
        .sort((a, b) => b.roe - a.roe)
        .slice(0, 15)
        .map(d => {
          const debtRatio = d.debtToEquity / 100;
          const score = Math.min(99, Math.floor(70 + (d.roe / 2) - (debtRatio * 20)));
          return {
            ...d,
            score: Math.max(70, score),
            reason: `High ROE (${d.roe.toFixed(1)}%), Low D/E (${debtRatio.toFixed(2)}). Wide Moat.`
          };
        });
    }
    else if (activeGuru === 'graham') {
      return candidates
        .filter(d => d.peRatio > 0 && d.peRatio < 25) // Relaxed PE to 25
        .sort((a, b) => a.peRatio - b.peRatio)
        .slice(0, 15)
        .map(d => {
          const score = Math.min(99, Math.floor(100 - (d.peRatio * 1.5)));
          return {
            ...d,
            score: Math.max(70, score),
            reason: `Deep Value: P/E Ratio is ${d.peRatio.toFixed(1)}x. High Margin of Safety.`
          };
        });
    }
    else if (activeGuru === 'lynch') {
      return candidates
        .filter(d => d.pegRatio > 0 && d.pegRatio < 2.0 && d.growth > 0) // Relaxed PEG and Growth
        .sort((a, b) => a.pegRatio - b.pegRatio)
        .slice(0, 15)
        .map(d => {
          const score = Math.min(99, Math.floor(100 - (d.pegRatio * 20)));
          return {
            ...d,
            score: Math.max(70, score),
            reason: `GARP: High growth (${d.growth.toFixed(1)}%) with PEG ratio of ${d.pegRatio.toFixed(2)}.`
          };
        });
    }
    else if (activeGuru === 'oneil') {
      return candidates
        .filter(d => d.high52 > 0 && d.price > d.high52 * 0.85 && d.growth > 5) // Relaxed 52w and growth
        .sort((a, b) => b.growth - a.growth)
        .slice(0, 15)
        .map(d => {
          const score = Math.min(99, Math.floor(75 + (d.growth / 2) + (d.change * 2)));
          return {
            ...d,
            score: Math.max(70, score),
            reason: `CAN SLIM: Near 52W High with ${d.growth.toFixed(1)}% earnings growth.`
          };
        });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {GURUS.map((guru) => (
          <button
            key={guru.id}
            onClick={() => setActiveGuru(guru.id)}
            className={`flex flex-row items-center gap-4 p-3 sm:p-4 rounded-2xl border transition-all duration-300 text-left w-full ${
              activeGuru === guru.id 
                ? `bg-${guru.color}-500/10 border-${guru.color}-500/50 shadow-[0_0_20px_rgba(var(--${guru.color}-500),0.15)] scale-[1.02]` 
                : 'bg-[#172030]/50 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="relative shrink-0">
              <img 
                src={guru.imageUrl} 
                alt={guru.name} 
                referrerPolicy="no-referrer"
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 transition-all duration-300 ${
                  activeGuru === guru.id ? `border-${guru.color}-500 shadow-[0_0_15px_rgba(var(--${guru.color}-500),0.4)]` : 'border-slate-700'
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.name)}&background=172030&color=fff`;
                }}
              />
              <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg border shadow-lg ${
                activeGuru === guru.id ? `bg-${guru.color}-500/20 border-${guru.color}-500/50 backdrop-blur-md` : 'bg-slate-800 border-slate-700'
              }`}>
                {React.cloneElement(guru.icon as React.ReactElement, { className: `w-3.5 h-3.5 ${activeGuru === guru.id ? `text-${guru.color}-400` : 'text-slate-400'}` })}
              </div>
            </div>
            
            <div className="flex flex-col justify-center min-w-0">
              <h3 className={`font-black tracking-wide text-sm sm:text-base truncate ${activeGuru === guru.id ? 'text-white' : 'text-slate-300'}`}>{guru.name}</h3>
              <p className={`text-[10px] sm:text-xs font-bold mt-0.5 truncate ${activeGuru === guru.id ? `text-${guru.color}-400` : 'text-slate-500'}`}>{guru.title}</p>
            </div>
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
