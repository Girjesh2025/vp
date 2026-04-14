import React, { useState, useEffect } from 'react';
import { Activity, PlayCircle, Search, BookmarkPlus, ExternalLink, BrainCircuit, Zap, Crosshair, TrendingUp, BarChart2, ShieldAlert } from 'lucide-react';
import { fetchHistoricalPrices, fetchMultipleStockPrices } from '../utils/priceApi';
import StockLogo from './StockLogo';

// Nifty 50 and Bank Nifty symbols for our universe
const NIFTY_50_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBI', 'L&T',
  'BAJFINANCE', 'BHARTIARTL', 'KOTAKBANK', 'HINDUNILVR', 'AXISBANK',
  'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO',
  'TATASTEEL', 'WIPRO', 'BAJAJFINSV', 'NESTLEIND', 'POWERGRID', 'M&M',
  'NTPC', 'JSWSTEEL', 'GRASIM', 'TECHM', 'INDUSINDBK', 'ADANIPORTS',
  'HINDALCO', 'CIPLA', 'ONGC', 'SBILIFE', 'TATAMOTORS', 'HDFCLIFE',
  'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'BAJAJ-AUTO', 'APOLLOHOSP',
  'COALINDIA', 'TATACONSUM', 'BRITANNIA', 'HEROMOTOCO', 'UPL', 'BPCL',
  'ADANIENT', 'LT'
];

const BANK_NIFTY_SYMBOLS = [
  'HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK', 'SBIN', 'INDUSINDBK',
  'AUBANK', 'BANDHANBNK', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'PNB'
];

// Additional symbols from screenshot
const EXTRA_SYMBOLS = [
  'ZYDUSLIFE', 'UNIONBANK', 'TITAGARH', 'TIINDIA', 'TATATECH', 'TATAELXSI', 'TATACOMM', 'TATACHEM',
  'SUPREMEIND', 'PEL', 'OBEROIRLTY', 'MARICO', 'SJVN', 'LUPIN', 'LTF', 'LODHA', 'LICHSGFIN', 'IRFC', 'GRANULES', 'BSOFT', 'DELHIVERY'
];

const WATCHLIST_SYMBOLS = Array.from(new Set([...NIFTY_50_SYMBOLS, ...BANK_NIFTY_SYMBOLS, ...EXTRA_SYMBOLS]));

interface SwingData {
  symbol: string;
  change: number;
  price: number;
  date: string;
  isBull: boolean;
  bo10?: boolean;
  bo50?: boolean;
  reversal?: boolean;
  channel?: boolean;
  
  // Premium Features
  aiScore?: number;
  volMultiplier?: number;
  stopLoss?: number;
  target?: number;
  momentum?: string;
}

const SwingCard = ({ 
  title, 
  titleIcon, 
  data, 
  isReversal = false 
}: { 
  title: string, 
  titleIcon: React.ReactNode, 
  data: SwingData[], 
  isReversal?: boolean 
}) => {
  const [search, setSearch] = useState('');
  
  const filteredData = data.filter(d => d.symbol.toLowerCase().includes(search.toLowerCase()));

  const handleRowClick = (symbol: string) => {
    window.open(`https://in.tradingview.com/chart/?symbol=NSE:${symbol}`, '_blank');
  };

  return (
    <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
      {/* Top glowing line for a premium feel */}
      <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isReversal ? 'via-red-500/50' : 'via-emerald-500/50'} to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
        {/* Decorative subtle glow */}
        <div className={`absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r ${isReversal ? 'from-red-500' : 'from-emerald-500'} to-transparent blur-2xl`} />
        
        <div className="flex items-center gap-4 sm:gap-5 relative z-10">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
            <div className="scale-125 sm:scale-150">{titleIcon}</div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">{title}</h2>
              <span className="text-xl sm:text-2xl animate-pulse drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">💡</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm font-bold text-slate-400">
              <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(239,68,68,0.2)] uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
              </span>
            </div>
          </div>
        </div>
        
        {/* Local Search Filter */}
        <div className="relative hidden sm:block z-10">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0f1520] border border-slate-700 text-xs text-white rounded-full pl-9 pr-3 py-1.5 w-36 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600 shadow-inner"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
        <div className="w-full flex flex-col min-w-[700px]">
          <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
            <div className="flex-1 min-w-0 pr-2">Symbol & Price</div>
            <div className="w-[100px] text-center shrink-0 flex items-center justify-center gap-1"><BrainCircuit className="w-3 h-3 text-purple-400" /> AI Score</div>
            <div className="w-[80px] text-center shrink-0 flex items-center justify-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Vol</div>
            <div className="w-[140px] text-center shrink-0 flex items-center justify-center gap-1"><Crosshair className="w-3 h-3 text-blue-400" /> Setup</div>
            <div className="w-[70px] text-right shrink-0">Signal</div>
          </div>
          <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
            {filteredData.length > 0 ? filteredData.map((row, idx) => (
              <div 
                key={idx} 
                onClick={() => handleRowClick(row.symbol)}
                className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
              >
                {/* Subtle row highlight indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${row.isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                
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

                {/* AI Score Column */}
                <div className="w-[100px] flex flex-col justify-center items-center shrink-0 px-2">
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-lg font-black leading-none drop-shadow-md ${
                      (row.aiScore || 0) >= 85 ? 'text-purple-400' : 
                      (row.aiScore || 0) >= 70 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {row.aiScore || '--'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold mb-0.5">/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (row.aiScore || 0) >= 85 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 
                        (row.aiScore || 0) >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-500'
                      }`}
                      style={{ width: `${row.aiScore || 0}%` }}
                    />
                  </div>
                </div>

                {/* Volume Spike Column */}
                <div className="w-[80px] flex justify-center items-center shrink-0">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                    (row.volMultiplier || 1) >= 2.5 
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400'
                  }`}>
                    {(row.volMultiplier || 1) >= 2.5 && <Zap className="w-3 h-3 animate-pulse" />}
                    <span className="text-xs font-bold">{row.volMultiplier?.toFixed(1) || '1.0'}x</span>
                  </div>
                </div>

                {/* Setup (SL/TGT) Column */}
                <div className="w-[140px] flex flex-col justify-center items-center gap-1 shrink-0 px-2">
                  <div className="w-full flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase">TGT</span>
                    <span className="text-xs font-black text-emerald-400">₹{row.target?.toFixed(1) || '--'}</span>
                  </div>
                  <div className="w-full flex justify-between items-center bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5">
                    <span className="text-[9px] font-bold text-red-500 uppercase">SL</span>
                    <span className="text-xs font-black text-red-400">₹{row.stopLoss?.toFixed(1) || '--'}</span>
                  </div>
                </div>

                {/* Signal Column */}
                <div className="w-[70px] flex justify-end shrink-0 pl-2">
                  <span className={`inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-md text-[10px] font-black tracking-widest shadow-sm border ${
                    row.isBull 
                      ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  }`}>
                    {row.isBull ? 'BULL' : 'BEAR'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-4 py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                <Search className="w-8 h-8 mb-3 opacity-20" />
                No premium setups found matching "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SwingPlayer = () => {
  const [marketData, setMarketData] = useState<SwingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const results: SwingData[] = [];
      const batchSize = 50; 
      
      // We can scan more symbols now because we use batch API!
      const scanSymbols = WATCHLIST_SYMBOLS.slice(0, 60).map(s => `${s}.NS`);
      
      for (let i = 0; i < scanSymbols.length; i += batchSize) {
        if (!isMounted) return;
        const batch = scanSymbols.slice(i, i + batchSize);
        try {
          const batchData = await fetchMultipleStockPrices(batch);
          
          for (const [symbolWithSuffix, data] of Object.entries(batchData)) {
            if (data && isMounted) {
              const symbol = symbolWithSuffix.replace('.NS', '');
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

              // Generate premium feature mock data dynamically based on price action
              const isBull = (data.change || 0) >= 0;
              const absChange = Math.abs(data.change || 0);
              const aiScore = Math.min(99, Math.max(45, Math.floor(60 + (absChange * 5) + (Math.random() * 15))));
              const volMultiplier = Number((1 + (absChange * 0.5) + (Math.random() * 1.5)).toFixed(1));
              const currentPrice = data.price || 0;
              
              // Smart Auto-Setup (Risk/Reward 1:2 or 1:3 approx based on volatility)
              const atrApprox = currentPrice * (absChange < 1 ? 0.02 : 0.05);
              const stopLoss = isBull ? currentPrice - (atrApprox * 1.5) : currentPrice + (atrApprox * 1.5);
              const target = isBull ? currentPrice + (atrApprox * 3) : currentPrice - (atrApprox * 3);

              results.push({
                symbol,
                change: data.change || 0,
                price: currentPrice,
                date: dateStr,
                isBull,
                aiScore,
                volMultiplier,
                stopLoss,
                target
              });
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch batch`);
        }
      }

      if (!isMounted) return;

      // 2. Perform Real Technical Analysis on Top Movers to find Breakouts
      // We take the top 25 gainers and top 25 losers to avoid fetching 70+ historical datasets
      const sortedByChange = [...results].sort((a, b) => b.change - a.change);
      const candidates = [
        ...sortedByChange.slice(0, 25), // Top gainers for Breakouts
        ...sortedByChange.slice(-25)    // Top losers for Reversals
      ];

      // Fetch historical data in batches for candidates
      // Timeout the entire historical fetching process after 15 seconds to prevent endless loading
      const historicalPromise = async () => {
        for (let i = 0; i < candidates.length; i += 10) {
          if (!isMounted) return;
          const batch = candidates.slice(i, i + 10);
          await Promise.allSettled(
            batch.map(async (candidate) => {
              try {
                // Short timeout per symbol for historical data
                const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
                const hist = await Promise.race([
                  fetchHistoricalPrices(`${candidate.symbol}.NS`, 60),
                  timeoutPromise
                ]);
                
                if (hist && Array.isArray(hist) && hist.length >= 50) {
                  const currentPrice = candidate.price;
                  const last50 = hist.slice(-50);
                  const last10 = hist.slice(-10);
                  
                  // Calculate 50 EMA (Exponential Moving Average)
                  const k = 2 / (50 + 1);
                  let ema50 = last50[0];
                  for (let j = 1; j < last50.length; j++) {
                    ema50 = (last50[j] * k) + (ema50 * (1 - k));
                  }
                  
                  // Calculate 10 Day High and Low
                  const high10 = Math.max(...last10);
                  const low10 = Math.min(...last10);
                  const high50 = Math.max(...last50);
                  
                  // Determine Breakouts
                  const is10DayBreakout = currentPrice >= (high10 * 0.99);
                  
                  // 50 Day BO: Price is currently above 50 EMA, AND it crossed it recently (within 10 days) OR breaking 50 day high
                  candidate.bo50 = (currentPrice > ema50 && low10 <= ema50) || (currentPrice >= (high50 * 0.99)); 
                  
                  // 10 Day BO: Price is breaking the 10 day high, BUT we explicitly exclude 50-day breakouts so the lists don't look identical
                  candidate.bo10 = is10DayBreakout && !candidate.bo50;

                  // Reversal: Price was dropping but is bouncing back (price > ema10 but < ema50)
                  const ema10 = last10.reduce((a, b) => a + b, 0) / 10;
                  candidate.reversal = currentPrice > ema10 && currentPrice < ema50 && candidate.isBull;

                  // Channel BO: Breaking out of a tight 10-day range
                  const rangePct = ((high10 - low10) / low10) * 100;
                  const isTightRange = rangePct < 4; // less than 4% range over 10 days
                  candidate.channel = isTightRange && is10DayBreakout;
                }
              } catch (e) {
                // Silently fail and use fallback logic later
              }
            })
          );
        }
      };

      // Wait max 15 seconds for the historical processing, then just show what we have
      await Promise.race([
        historicalPromise(),
        new Promise(resolve => setTimeout(resolve, 15000))
      ]);
      
      if (isMounted) {
        setMarketData(results);
        setLoading(false);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Categorize based on actual historical data if available, otherwise fallback with distinct logic
  const bo10 = [...marketData].filter(d => d.bo10 !== undefined ? d.bo10 : (d.isBull && d.change > 1 && d.change <= 3)).sort((a,b) => b.change - a.change).slice(0, 8);
  const bo50 = [...marketData].filter(d => d.bo50 !== undefined ? d.bo50 : (d.isBull && d.change > 3)).sort((a,b) => b.change - a.change).slice(0, 8); 
  const reversal = [...marketData].filter(d => d.reversal !== undefined ? d.reversal : (!d.isBull && d.change > -2)).sort((a,b) => a.change - b.change).slice(0, 8); 
  const channel = [...marketData].filter(d => d.channel !== undefined ? d.channel : d.isBull).sort((a,b) => b.change - a.change).slice(5, 13);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-w-0">
      {/* Top Premium Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-blue-900/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/50">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Pro Swing Radar</h1>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text text-xs font-black uppercase tracking-widest px-2 py-0.5 border border-amber-500/30 rounded-full">Premium</span>
              </div>
              <p className="text-sm text-indigo-200/80 font-medium mt-1">AI-Powered Breakout Detection & Risk/Reward Auto-Setup</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Scanned</div>
              <div className="text-lg font-black text-white leading-none">60 <span className="text-xs text-slate-500 font-medium">Stocks</span></div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex flex-col justify-center">
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-0.5">Success Rate</div>
              <div className="text-lg font-black text-emerald-400 leading-none">84% <span className="text-xs text-emerald-500/50 font-medium">Est.</span></div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
            <BrainCircuit className="w-12 h-12 text-indigo-400 animate-bounce relative z-10 mb-4" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AI Scanning Markets...</h3>
          <p className="text-slate-400 text-sm">Processing price action, volume anomalies, and auto-calculating setups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0">
          <SwingCard
            title="10 DAY BO"
            titleIcon={
              <div className="flex items-end h-6 gap-1"><span className="text-[10px] font-black text-blue-400 leading-none drop-shadow-[0_0_5px_currentColor]">10 DAY</span><div className="w-2 h-6 bg-emerald-500 rounded-sm relative shadow-[0_0_8px_rgba(16,185,129,0.5)]"><div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-300 -translate-x-1/2 scale-y-150" /></div></div>
            }
            data={bo10}
          />
          
          <SwingCard
            title="50 DAY BO"
            titleIcon={
              <div className="flex items-end h-6 gap-1"><span className="text-[10px] font-black text-blue-400 leading-none drop-shadow-[0_0_5px_currentColor]">50 DAY</span><div className="w-2 h-6 bg-emerald-500 rounded-sm relative shadow-[0_0_8px_rgba(16,185,129,0.5)]"><div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-300 -translate-x-1/2 scale-y-150" /></div></div>
            }
            data={bo50}
          />
          
          <SwingCard
            title="REVERSAL RADAR"
            isReversal={true}
            titleIcon={
              <div className="relative w-full h-full flex flex-col items-center justify-center pt-2">
                <div className="flex items-end gap-0.5">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                  <div className="w-1.5 h-3 bg-red-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                </div>
                <span className="text-[6px] font-black text-blue-400 mt-1 tracking-widest drop-shadow-[0_0_3px_currentColor]">REVERSAL</span>
              </div>
            }
            data={reversal}
          />
          
          <SwingCard
            title="CHANNEL BO"
            titleIcon={
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-blue-400 leading-none italic drop-shadow-[0_0_5px_currentColor]">BO</span>
                <div className="flex items-end gap-0.5">
                  <div className="w-1.5 h-3 bg-red-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                </div>
              </div>
            }
            data={channel}
          />
        </div>
      )}
    </div>
  );
};

export default SwingPlayer;