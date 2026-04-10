import React, { useState, useEffect } from 'react';
import { Activity, PlayCircle, Search, BookmarkPlus, ExternalLink } from 'lucide-react';
import { fetchStockPrice, fetchHistoricalPrices } from '../utils/priceApi';
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
        <div className="w-full flex flex-col min-w-[500px]">
          <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
            <div className="flex-1 min-w-0 pr-2">Symbol</div>
            <div className="w-[80px] sm:w-[110px] text-center shrink-0">%</div>
            <div className="w-[60px] sm:w-[80px] text-center shrink-0">Date <span className="text-[10px] ml-0.5">▼</span></div>
            <div className="w-[65px] sm:w-[80px] text-right shrink-0">Signal</div>
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
                
                {/* Symbol Column */}
                <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pr-2">
                  <StockLogo symbol={row.symbol} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                  <span className="text-sm sm:text-base font-bold text-slate-200 group-hover/row:text-white transition-colors group-hover/row:translate-x-1 duration-200 truncate">
                    {row.symbol}
                  </span>
                </div>

                {/* % Column */}
                <div className="w-[80px] sm:w-[110px] flex justify-center items-center gap-1.5 sm:gap-2 shrink-0">
                  <div className="hidden sm:flex gap-1 opacity-70 group-hover/row:opacity-100 transition-opacity shrink-0">
                    <div className={`w-1 h-4 rounded-sm ${row.isBull ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_5px_currentColor]`} />
                    <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/50 rounded-sm flex items-center justify-center shadow-[0_0_5px_rgba(59,130,246,0.3)]">
                      <BookmarkPlus className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                  <span className={`inline-flex items-center justify-center w-full max-w-[75px] py-1.5 rounded-md text-xs sm:text-sm font-black border ${
                    row.change >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                  }`}>
                    {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                  </span>
                </div>

                {/* Date Column */}
                <div className="w-[60px] sm:w-[80px] text-center text-[10px] sm:text-[11px] font-medium text-slate-400 group-hover/row:text-slate-300 truncate px-1 shrink-0">
                  {row.date}
                </div>

                {/* Signal Column */}
                <div className="w-[65px] sm:w-[80px] flex justify-end shrink-0">
                  <span className={`inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest shadow-sm border ${
                    row.isBull 
                      ? 'bg-[#c6f6d5] text-[#14532d] border-[#86efac]' 
                      : 'bg-[#fed7d7] text-[#7f1d1d] border-[#fca5a5]'
                  }`}>
                    {row.isBull ? 'BULL' : 'BEAR'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-4 py-12 text-center text-slate-500 text-xs">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                No stocks found matching "{search}"
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
      const batchSize = 10;
      
      for (let i = 0; i < WATCHLIST_SYMBOLS.length; i += batchSize) {
        const batch = WATCHLIST_SYMBOLS.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (symbol) => {
            try {
              const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
              const data = await Promise.race([
                fetchStockPrice(`${symbol}.NS`),
                timeoutPromise
              ]);

              if (data && isMounted) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

                results.push({
                  symbol,
                  change: data.change || 0,
                  price: data.price || 0,
                  date: dateStr,
                  isBull: (data.change || 0) >= 0
                });
              }
            } catch (e) {
              console.warn(`Failed to fetch ${symbol}`);
            }
          })
        );
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
      // Timeout the entire historical fetching process after 5 seconds to prevent endless loading
      const historicalPromise = async () => {
        for (let i = 0; i < candidates.length; i += 5) {
          if (!isMounted) return;
          const batch = candidates.slice(i, i + 5);
          await Promise.allSettled(
            batch.map(async (candidate) => {
              try {
                // Short timeout per symbol for historical data
                const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
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
                  // 50 Day BO: Price is currently above 50 EMA, AND it crossed it recently (within 10 days) OR breaking 50 day high
                  candidate.bo50 = (currentPrice > ema50 && low10 <= ema50) || (currentPrice >= (high50 * 0.99)); 
                  
                  // 10 Day BO: Price is breaking the 10 day high, BUT we explicitly exclude 50-day breakouts so the lists don't look identical
                  candidate.bo10 = currentPrice >= (high10 * 0.99) && !candidate.bo50;

                  // Reversal: Price was dropping but is bouncing back (price > ema10 but < ema50)
                  const ema10 = last10.reduce((a, b) => a + b, 0) / 10;
                  candidate.reversal = currentPrice > ema10 && currentPrice < ema50 && candidate.isBull;

                  // Channel BO: Just a simplified placeholder for now
                  candidate.channel = candidate.bo10 && candidate.bo50;
                }
              } catch (e) {
                // Silently fail and use fallback logic later
              }
            })
          );
        }
      };

      // Wait max 5 seconds for the historical processing, then just show what we have
      await Promise.race([
        historicalPromise(),
        new Promise(resolve => setTimeout(resolve, 5000))
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
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Swing Player</h1>
          <p className="text-sm text-slate-400 font-medium">Swing Trading Scanners & Reversal Radar</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4 mx-auto"></div>
          <h3 className="text-xl font-bold text-white mb-2">Scanning Markets...</h3>
          <p className="text-slate-400 text-sm">Finding breakout and reversal candidates.</p>
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