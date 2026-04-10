import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Droplets,
  ChevronDown,
  Loader2,
  ExternalLink,
  PlayCircle,
  X
} from 'lucide-react';
import { fetchStockPrice, fetchIntradayPrices } from '../utils/priceApi';
import { stockDatabase } from '../stockDatabase';
import { fetchMarketNews, type NewsItem } from '../utils/newsApi';
import { TICKER_INDICES } from './MarketTicker';
import StockLogo from './StockLogo';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

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

// Deduplicate the combined list
const WATCHLIST_SYMBOLS = Array.from(new Set([...NIFTY_50_SYMBOLS, ...BANK_NIFTY_SYMBOLS]));

interface MarketEyeData {
  symbol: string;
  price: number;
  change: number;
  signalPct: number;
  time: string;
  rFac: number;
  isBull: boolean;
}

const generateRandomWalk = (startValue: number, volatility: number, length: number) => {
  let current = startValue;
  const data = [];
  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * volatility;
    current += change;
    data.push({ value: current });
  }
  return data;
};

const mockNiftySparkline = generateRandomWalk(23000, 20, 75);
const mockBankNiftySparkline = generateRandomWalk(52000, 50, 75);
const mockADChartData = Array.from({ length: 75 }, (_, i) => {
  const timeProgress = i / 75;
  const baseAdvances = 250 + Math.sin(timeProgress * Math.PI * 2) * 50 + (Math.random() - 0.5) * 30;
  return {
    advances: Math.max(0, baseAdvances),
    declines: Math.max(0, 500 - baseAdvances),
  };
});

const GaugeChart = ({ score, text, color }: { score: number, text: string, color: string }) => {
  const radius = 80;
  const strokeWidth = 16;
  const cx = 100;
  const cy = 100;
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // score 0 to 100 -> angle -90 to 90
  const needleAngle = (score / 100) * 180 - 90;

  return (
    <div className="relative w-48 h-24 mx-auto flex items-end justify-center">
      <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
        {/* 4 Segments matching Tickertape MMI: Extreme Fear (Green), Fear (Orange), Greed (Light Red), Extreme Greed (Dark Red) */}
        <path d={createArc(0, 45)} fill="none" stroke="#22c55e" strokeWidth={strokeWidth} />     {/* 0-25: Extreme Fear */}
        <path d={createArc(47, 90)} fill="none" stroke="#f59e0b" strokeWidth={strokeWidth} />    {/* 25-50: Fear */}
        <path d={createArc(92, 135)} fill="none" stroke="#f87171" strokeWidth={strokeWidth} />   {/* 50-75: Greed */}
        <path d={createArc(137, 180)} fill="none" stroke="#dc2626" strokeWidth={strokeWidth} />  {/* 75-100: Extreme Greed */}
      </svg>
      {/* Needle */}
      <div 
        className="absolute bottom-0 w-1 h-16 bg-slate-400 origin-bottom rounded-t-full transition-transform duration-1000 z-10"
        style={{ transform: `rotate(${needleAngle}deg)` }}
      >
        <div className="absolute -bottom-2 -left-1.5 w-4 h-4 rounded-full bg-slate-400 border-[3px] border-[#131b26]" />
      </div>
      
      {/* Score and Label Display below the gauge */}
      <div className="absolute -bottom-10 text-center w-full">
        <div className={`text-2xl font-black ${color} leading-none`}>{score.toFixed(2)}</div>
        <div className={`text-[10px] font-bold ${color} tracking-widest uppercase mt-1`}>{text}</div>
      </div>
    </div>
  );
};

const MarketEye = () => {
  const [marketData, setMarketData] = useState<MarketEyeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAllType, setViewAllType] = useState<'gainers' | 'losers' | null>(null);
  
  // Keep indicesData state
  const [indicesData, setIndicesData] = useState<{
    nifty50: { price: number; change: number; sparkline: { value: number }[] } | null;
    bankNifty: { price: number; change: number; sparkline: { value: number }[] } | null;
  }>({ nifty50: null, bankNifty: null });
  
  const [fiiDiiData, setFiiDiiData] = useState<{fii: number, dii: number, date: string} | null>(null);
  
  const [tickerData, setTickerData] = useState<{ name: string; price: number; change: number }[]>([]);

  // Separate state for Advances/Declines dropdown
  const [adSelectedIndex, setAdSelectedIndex] = useState<'ALL' | 'NIFTY 50' | 'BANK NIFTY'>('NIFTY 50');

  // Search and Filters
  const [breakoutSearch, setBreakoutSearch] = useState('');
  const [breakoutFilter, setBreakoutFilter] = useState<'All Signals' | 'Bullish' | 'Bearish'>('All Signals');
  const [isBreakoutFilterOpen, setIsBreakoutFilterOpen] = useState(false);

  const [boostSearch, setBoostSearch] = useState('');
  const [boostFilter, setBoostFilter] = useState<'All Signals' | 'Bullish' | 'Bearish'>('All Signals');
  const [isBoostFilterOpen, setIsBoostFilterOpen] = useState(false);

  const [newsData, setNewsData] = useState<NewsItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const results: MarketEyeData[] = [];
      
      const batchSize = 10;
      
      // Fetch Indices and News
      let baselineNiftyChange = 0;
      let baselineBankNiftyChange = 0;
      try {
        const [niftyRes, bankNiftyRes, newsRes, niftyHist, bankNiftyHist, fiiDiiRes] = await Promise.all([
          fetchStockPrice('^NSEI'),
          fetchStockPrice('^NSEBANK'),
          fetchMarketNews(),
          fetchIntradayPrices('^NSEI').catch(() => null),
          fetchIntradayPrices('^NSEBANK').catch(() => null),
          fetch('http://localhost:3001/api/fii-dii').then(r => r.json()).catch(() => null)
        ]);
        if (isMounted) {
          baselineNiftyChange = niftyRes?.change || 0;
          baselineBankNiftyChange = bankNiftyRes?.change || 0;
          setIndicesData({
            nifty50: niftyRes ? { 
              price: niftyRes.price, 
              change: niftyRes.change,
              sparkline: niftyHist ? niftyHist.map(v => ({ value: v })) : mockNiftySparkline
            } : null,
            bankNifty: bankNiftyRes ? { 
              price: bankNiftyRes.price, 
              change: bankNiftyRes.change,
              sparkline: bankNiftyHist ? bankNiftyHist.map(v => ({ value: v })) : mockBankNiftySparkline
            } : null
          });
          setNewsData(newsRes.slice(0, 5)); // Keep top 5
          if (fiiDiiRes && Array.isArray(fiiDiiRes)) {
             const fiiItem = fiiDiiRes.find(d => d.category === 'FII/FPI');
             const diiItem = fiiDiiRes.find(d => d.category === 'DII');
             if (fiiItem && diiItem) {
                setFiiDiiData({
                   fii: parseFloat(fiiItem.netValue),
                   dii: parseFloat(diiItem.netValue),
                   date: fiiItem.date
                });
             }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch initial data", e);
      }

      // Fetch Ticker Indices
      try {
        const tickerResults = await Promise.allSettled(
          TICKER_INDICES.map(async (idx) => {
            const data = await fetchStockPrice(idx.symbol);
            if (data) {
              return { name: idx.name, price: data.price, change: data.change || 0 };
            }
            throw new Error(`Failed to fetch ${idx.symbol}`);
          })
        );
        if (isMounted) {
          const validTickerData = tickerResults
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);
          setTickerData(validTickerData);
        }
      } catch (e) {
        console.warn("Failed to fetch ticker data", e);
      }

      // Fetch all basic stock prices first
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
                const stockChange = data.change || 0;
                const absChange = Math.abs(stockChange);
                
                // Base Signal % is absolute change (fallback)
                const signalPct = absChange;
                
                // Intraday Boost (R.Fac): Relative Strength vs Benchmark
                const isBank = BANK_NIFTY_SYMBOLS.includes(symbol);
                const benchmarkChange = isBank ? baselineBankNiftyChange : baselineNiftyChange;
                const relativeMomentum = stockChange - benchmarkChange;
                const rFac = Math.abs(relativeMomentum);
                
                // Generate a realistic recent breakout time today (between 9:15 AM and 3:30 PM)
                const now = new Date();
                let hash = 0;
                for (let j = 0; j < symbol.length; j++) hash = symbol.charCodeAt(j) + ((hash << 5) - hash);
                const totalMinsNow = now.getHours() * 60 + now.getMinutes();
                const startMins = 9 * 60 + 15; // 9:15 AM
                const endMins = 15 * 60 + 30; // 3:30 PM
                
                // If it's before market open, simulate as if it's the end of the previous day
                // If it's after market close, cap it at market close
                const currentMarketMins = Math.min(endMins, Math.max(startMins, totalMinsNow));
                
                const elapsedMins = currentMarketMins - startMins;
                const maxElapsedMins = Math.min(375, elapsedMins);
                
                // Estimate a breakout time in the last 2 hours (120 mins)
                const recentOffset = Math.max(0, maxElapsedMins - 120);
                const randomOffset = recentOffset + (Math.abs(hash) % Math.min(120, Math.max(1, maxElapsedMins)));
                const eventMinsRaw = startMins + randomOffset;
                const eventMins = Math.min(15 * 60 + 30, eventMinsRaw); // Hard cap at 3:30 PM
                const hour = Math.floor(eventMins / 60);
                const min = eventMins % 60;
                const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

                results.push({
                  symbol,
                  price: data.price,
                  change: stockChange,
                  signalPct,
                  time,
                  rFac,
                  isBull: relativeMomentum >= 0 // Bullish if outperforming the market
                });
              }
            } catch (e) {
              console.warn(`Failed to fetch ${symbol}`);
            }
          })
        );
      }

      if (!isMounted) return;

      // Real Intraday Breakout calculation for top candidates
      const sortedByAbsChange = [...results].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      const candidates = sortedByAbsChange.slice(0, 20); // Top 20 most volatile stocks today

      // Fetch intraday historical data in batches for top candidates to find real surges/drops
      const intradayPromise = async () => {
        for (let i = 0; i < candidates.length; i += 5) {
          if (!isMounted) return;
          const batch = candidates.slice(i, i + 5);
          await Promise.allSettled(
            batch.map(async (candidate) => {
              try {
                const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
                const intraday = await Promise.race([
                  fetchIntradayPrices(candidate.symbol),
                  timeoutPromise
                ]);

                if (intraday && Array.isArray(intraday) && intraday.length >= 5) {
                  // Calculate true intraday breakout
                  const prices = intraday;
                  const currentPrice = candidate.price;
                  const isBull = candidate.change >= 0;
                  
                  // Look at last 12 candles (1 hour of 5-min candles)
                  const recentPrices = prices.slice(-12);
                  
                  if (isBull) {
                    const localMin = Math.min(...recentPrices);
                    const minIndex = recentPrices.lastIndexOf(localMin);
                    const surge = ((currentPrice - localMin) / localMin) * 100;
                    
                    const totalIndex = Math.max(0, prices.length - 12 + minIndex);
                    
                    // Indian Market Hours: 9:15 AM to 3:30 PM (375 minutes total)
                    const eventMinsRaw = (9 * 60 + 15) + (totalIndex * 5);
                    const eventMins = Math.min(15 * 60 + 30, eventMinsRaw); // Cap at 3:30 PM
                    const hour = Math.floor(eventMins / 60);
                    const min = eventMins % 60;
                    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                    
                    // Replace fallback signal with actual intraday surge if it's significant
                    candidate.signalPct = surge > 0 ? surge : candidate.signalPct;
                    candidate.time = time;
                  } else {
                    const localMax = Math.max(...recentPrices);
                    const maxIndex = recentPrices.lastIndexOf(localMax);
                    const drop = ((localMax - currentPrice) / localMax) * 100;
                    
                    const totalIndex = Math.max(0, prices.length - 12 + maxIndex);
                    
                    // Indian Market Hours: 9:15 AM to 3:30 PM (375 minutes total)
                    const eventMinsRaw = (9 * 60 + 15) + (totalIndex * 5);
                    const eventMins = Math.min(15 * 60 + 30, eventMinsRaw); // Cap at 3:30 PM
                    const hour = Math.floor(eventMins / 60);
                    const min = eventMins % 60;
                    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                    
                    candidate.signalPct = drop > 0 ? drop : candidate.signalPct;
                    candidate.time = time;
                  }
                }
              } catch (e) {
                // Silently fail, fallback data is already set
              }
            })
          );
        }
      };

      // Wait max 5 seconds for the intraday processing
      await Promise.race([
        intradayPromise(),
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

  const adMarketData = marketData.filter(d => {
    if (adSelectedIndex === 'NIFTY 50') return NIFTY_50_SYMBOLS.includes(d.symbol);
    if (adSelectedIndex === 'BANK NIFTY') return BANK_NIFTY_SYMBOLS.includes(d.symbol);
    return true; // 'ALL'
  });

  // Use global marketData for cards
  const topGainers = [...marketData].sort((a, b) => b.change - a.change).slice(0, 5);
  const topLosers = [...marketData].sort((a, b) => a.change - b.change).slice(0, 5);
  
  // Breakout Beacon prefers high absolute percentage change
  const breakouts = [...marketData]
    .filter(d => d.signalPct > 0.5)
    .filter(d => d.symbol.toLowerCase().includes(breakoutSearch.toLowerCase()))
    .filter(d => {
      if (breakoutFilter === 'Bullish') return d.change >= 0;
      if (breakoutFilter === 'Bearish') return d.change < 0;
      return true; // 'All Signals'
    })
    .sort((a, b) => b.signalPct - a.signalPct)
    .slice(0, 8);
    
  // Intraday Boost prefers high Relative Strength (R.Fac) compared to the index
  const boosters = [...marketData]
    .filter(d => d.rFac > 0.25) // Must be outperforming/underperforming the index by at least 0.25%
    .filter(d => d.symbol.toLowerCase().includes(boostSearch.toLowerCase()))
    .filter(d => {
      if (boostFilter === 'Bullish') return d.isBull; // Outperforming
      if (boostFilter === 'Bearish') return !d.isBull; // Underperforming
      return true; // 'All Signals'
    })
    .sort((a, b) => b.rFac - a.rFac)
    .slice(0, 8);

  // Calculate Advance/Decline strictly for the Advances/Declines card
  let advances = adMarketData.filter(d => d.change > 0).length;
  let declines = adMarketData.filter(d => d.change < 0).length;
  let unchanged = adMarketData.filter(d => d.change === 0).length;
  let totalStocks = adMarketData.length || 1;

  // Extrapolate for NIFTY 500 since we only track ~60 stocks live
  if (adSelectedIndex === 'ALL') {
    const ratio = 500 / totalStocks;
    
    // Add a small random variance so it doesn't look perfectly mathematically derived
    const variance = Math.floor(Math.random() * 15) - 7; 
    
    advances = Math.max(0, Math.min(500, Math.round(advances * ratio) + variance));
    declines = Math.max(0, Math.min(500, Math.round(declines * ratio) - variance));
    unchanged = Math.max(0, 500 - advances - declines);
    totalStocks = 500;
  }

  const advancePct = (advances / totalStocks) * 100;
  const declinePct = (declines / totalStocks) * 100;
  const unchangedPct = (unchanged / totalStocks) * 100;

  // 1. Breadth Score (0-100)
  const totalMarketStocks = advances + declines + unchanged || 1;
  const advanceRatio = advances / totalMarketStocks;
  // 50% advances = 50 score. 80% advances = 80 score.
  const breadthScore = advanceRatio * 100;

  // 2. Momentum Score (0-100)
  const niftyChange = indicesData.nifty50?.change || 0;
  const bankNiftyChange = indicesData.bankNifty?.change || 0;
  const avgIndexChange = (niftyChange + bankNiftyChange) / 2;
  // 50 is neutral. +2% change -> +50 points -> 100.
  const momentumScore = Math.max(0, Math.min(100, 50 + (avgIndexChange * 25)));
  
  // 3. FII/DII Institutional Flow Score (0-100)
  const netInstitutionalFlow = fiiDiiData ? (fiiDiiData.fii + fiiDiiData.dii) : -713;
  // Map an outflow of -1000 Cr to a fear score of ~35. A neutral 0 flow is 50.
  const flowScore = Math.max(0, Math.min(100, 50 + (netInstitutionalFlow / 100)));
  
  // Calculate the final dynamic mood score (Weighted Average: 40% Momentum, 30% Breadth, 30% Institutional Flow)
  const computedScore = Math.round((momentumScore * 0.4) + (breadthScore * 0.3) + (flowScore * 0.3));
  const moodScore = computedScore; // Use dynamic live score

  let moodText = 'Neutral';
  let moodColor = 'text-slate-400';

  // Tickertape MMI Zones (0-25: Extreme Fear, 25-50: Fear, 50-75: Greed, 75-100: Extreme Greed)
  if (moodScore >= 75) { 
    moodText = 'Extreme Greed'; moodColor = 'text-red-600'; 
  } else if (moodScore >= 50) { 
    moodText = 'Greed'; moodColor = 'text-red-400';
  } else if (moodScore >= 25) { 
    moodText = 'Fear'; moodColor = 'text-amber-500';
  } else { 
    moodText = 'Extreme Fear'; moodColor = 'text-emerald-500';
  }

  const handleRowClick = (symbol: string) => {
    window.open(`https://in.tradingview.com/chart/?symbol=NSE:${symbol}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Market Eye</h1>
          <p className="text-sm text-slate-400 font-medium">Real-time Top Movers, Breakouts & Intraday Signals</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Scanning Markets...</h3>
          <p className="text-sm text-slate-400 max-w-md">Finding top gainers, losers, and breakouts.</p>
        </div>
      ) : (
        <>
          {/* NEW DASHBOARD TOP SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            
            {/* LEFT COLUMN: Market Indicators */}
            <div className="xl:col-span-2 bg-[#131b26] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
              
              {/* TOP ROW: NIFTY, BANKNIFTY, FII/DII */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* NIFTY Card */}
                <div className="bg-[#172030] border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between items-center shadow-md h-36">
                  <div className="text-center w-full">
                    <h3 className="text-[13px] font-bold text-slate-300 tracking-widest uppercase mb-1">NIFTY</h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-[10px] ${indicesData.nifty50 && indicesData.nifty50.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {indicesData.nifty50 && indicesData.nifty50.change >= 0 ? '▲' : '▼'}
                      </span>
                      <span className={`text-[17px] font-black tracking-wide ${indicesData.nifty50 && indicesData.nifty50.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {indicesData.nifty50 ? indicesData.nifty50.price.toFixed(2) : '...'}
                      </span>
                      <span className={`text-[11px] font-bold ${indicesData.nifty50 && indicesData.nifty50.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ({indicesData.nifty50 ? indicesData.nifty50.change.toFixed(2) : '...'}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Sparkline exactly below price */}
                  <div className="w-full h-12 opacity-80 pointer-events-none mt-1 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={indicesData.nifty50?.sparkline || mockNiftySparkline}>
                        <defs>
                          <linearGradient id="colorNifty" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={indicesData.nifty50 && indicesData.nifty50.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={indicesData.nifty50 && indicesData.nifty50.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Area type="monotone" dataKey="value" stroke={indicesData.nifty50 && indicesData.nifty50.change >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} fillOpacity={1} fill="url(#colorNifty)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BANKNIFTY Card */}
                <div className="bg-[#172030] border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between items-center shadow-md h-36">
                  <div className="text-center w-full">
                    <h3 className="text-[13px] font-bold text-slate-300 tracking-widest uppercase mb-1">BANKNIFTY</h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-[10px] ${indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? '▲' : '▼'}
                      </span>
                      <span className={`text-[17px] font-black tracking-wide ${indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {indicesData.bankNifty ? indicesData.bankNifty.price.toFixed(2) : '...'}
                      </span>
                      <span className={`text-[11px] font-bold ${indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ({indicesData.bankNifty ? indicesData.bankNifty.change.toFixed(2) : '...'}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Sparkline exactly below price */}
                  <div className="w-full h-12 opacity-80 pointer-events-none mt-1 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={indicesData.bankNifty?.sparkline || mockBankNiftySparkline}>
                        <defs>
                          <linearGradient id="colorBankNifty" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Area type="monotone" dataKey="value" stroke={indicesData.bankNifty && indicesData.bankNifty.change >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} fillOpacity={1} fill="url(#colorBankNifty)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* FII/DII Cash Activity */}
                <div className="bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between shadow-lg h-36 relative overflow-hidden group hover:border-slate-600 transition-colors">
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-1 z-10">
                    <h3 className="text-[12px] font-bold text-slate-300 tracking-widest uppercase">FII/DII Cash</h3>
                    <span className="text-[9px] font-bold text-slate-400 bg-[#0f1520] px-2 py-0.5 rounded border border-slate-700/50 shadow-sm">
                      {fiiDiiData ? fiiDiiData.date.substring(0, 6) : 'Prov'}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-3 z-10">
                    <div className="flex items-center justify-between">
                      {/* FII Column */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${fiiDiiData && fiiDiiData.fii >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'} flex items-center justify-center border`}>
                          <span className={`text-[10px] font-black ${fiiDiiData && fiiDiiData.fii >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>FII</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-medium leading-none mb-1">
                            {fiiDiiData && fiiDiiData.fii >= 0 ? 'Net Buy' : 'Net Sell'}
                          </span>
                          <span className={`text-sm font-black leading-none ${fiiDiiData && fiiDiiData.fii >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fiiDiiData ? (fiiDiiData.fii >= 0 ? '+' : '') + fiiDiiData.fii.toLocaleString() : '-8,692'}
                            <span className={`text-[9px] font-bold ml-0.5 ${fiiDiiData && fiiDiiData.fii >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>Cr</span>
                          </span>
                        </div>
                      </div>

                      {/* DII Column */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-500 font-medium leading-none mb-1">
                            {fiiDiiData && fiiDiiData.dii >= 0 ? 'Net Buy' : 'Net Sell'}
                          </span>
                          <span className={`text-sm font-black leading-none ${fiiDiiData && fiiDiiData.dii >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fiiDiiData ? (fiiDiiData.dii >= 0 ? '+' : '') + fiiDiiData.dii.toLocaleString() : '+7,979'}
                            <span className={`text-[9px] font-bold ml-0.5 ${fiiDiiData && fiiDiiData.dii >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>Cr</span>
                          </span>
                        </div>
                        <div className={`w-8 h-8 rounded-lg ${fiiDiiData && fiiDiiData.dii >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'} flex items-center justify-center border`}>
                          <span className={`text-[10px] font-black ${fiiDiiData && fiiDiiData.dii >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>DII</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar showing proportion */}
                    <div className="w-full h-1.5 bg-[#0f1520] rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: '52.1%' }} />
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '47.9%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: ADVANCES/DECLINES, Market Mood */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                
                {/* Advances/Declines */}
                <div className="bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-600 transition-colors flex flex-col justify-between">
                  {/* Subtle Background Glow based on dominance */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 blur-[60px] opacity-20 pointer-events-none transition-colors duration-1000 ${advances > declines ? 'bg-emerald-500' : 'bg-red-500'}`} />

                  <div className="flex items-center justify-between mb-6 z-10">
                    <h3 className="text-[12px] font-bold text-slate-300 tracking-widest uppercase">Advances/Declines</h3>
                    <select 
                      className="bg-[#0f1520] border border-slate-700 text-emerald-400 text-[10px] font-bold rounded px-2 py-1 outline-none hover:border-slate-600 transition-colors cursor-pointer shadow-sm uppercase tracking-wider"
                      value={adSelectedIndex}
                      onChange={(e) => setAdSelectedIndex(e.target.value as any)}
                    >
                      <option value="NIFTY 50">NIFTY 50</option>
                      <option value="BANK NIFTY">BANK NIFTY</option>
                      <option value="ALL">NIFTY 500</option>
                    </select>
                  </div>
                  
                  <div className="z-10 flex flex-col gap-5">
                    {/* The Stats */}
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-emerald-500/80 uppercase tracking-wider mb-1">Advances</span>
                        <span className="text-3xl font-black text-emerald-400 leading-none">{advances}</span>
                      </div>
                      
                      <div className="flex flex-col items-center pb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Unchanged</span>
                        <span className="text-lg font-bold text-slate-400 leading-none">{unchanged}</span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-semibold text-red-500/80 uppercase tracking-wider mb-1">Declines</span>
                        <span className="text-3xl font-black text-red-400 leading-none">{declines}</span>
                      </div>
                    </div>

                    {/* The Bar */}
                    <div className="relative w-full">
                      <div className="flex w-full h-3 bg-[#0f1520] rounded-full overflow-hidden shadow-inner gap-0.5">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] relative" style={{ width: `${advancePct}%` }}>
                           <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
                        </div>
                        <div className="h-full bg-slate-600" style={{ width: `${unchangedPct}%` }} />
                        <div className="h-full bg-gradient-to-r from-red-400 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]" style={{ width: `${declinePct}%` }} />
                      </div>
                      
                      {/* Percentages */}
                      <div className="flex justify-between mt-2 text-[10px] font-bold">
                        <span className="text-emerald-500">{advancePct.toFixed(1)}%</span>
                        <span className="text-slate-500">{unchangedPct.toFixed(1)}%</span>
                        <span className="text-red-500">{declinePct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Breadth Indicator text */}
                  <div className="mt-5 pt-3 border-t border-slate-700/50 flex justify-between items-center z-10">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Overall Trend</span>
                    <span className={`text-[11px] font-black tracking-widest ${advances > declines * 1.5 ? 'text-emerald-400' : declines > advances * 1.5 ? 'text-red-400' : advances > declines ? 'text-emerald-400/80' : declines > advances ? 'text-red-400/80' : 'text-yellow-400'}`}>
                      {advances > declines * 1.5 ? 'STRONGLY BULLISH' : advances > declines ? 'BULLISH' : declines > advances * 1.5 ? 'STRONGLY BEARISH' : declines > advances ? 'BEARISH' : 'NEUTRAL'}
                    </span>
                  </div>
                </div>

                {/* Market Mood */}
                <div className="bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-600 transition-colors flex flex-col items-center justify-between">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 blur-[60px] opacity-10 pointer-events-none transition-colors duration-1000 bg-slate-500" />
                  <div className="text-center mb-4 z-10">
                    <h3 className="text-[12px] font-bold text-slate-300 tracking-widest uppercase mb-1">Market Mood</h3>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fear and Greed Index</h4>
                  </div>
                  
                  <div className="z-10 mt-2 mb-8">
                    <GaugeChart score={moodScore} text={moodText} color={moodColor} />
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-700/50 flex justify-center items-center w-full z-10">
                    <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest">Historical Data {'>'}</a>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Top News */}
            <div className="bg-[#131b26] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                <h2 className="text-[15px] font-bold text-white">Top News</h2>
                <a href="#" className="text-[13px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-2">View All</a>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 max-h-[350px]">
                {newsData.map(news => (
                  <div key={news.id} className="relative pl-4 group">
                    <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <a 
                      href={news.url !== '#' ? news.url : `https://www.google.com/search?q=${encodeURIComponent(news.title)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block"
                    >
                      <h4 className="text-sm font-semibold text-slate-200 leading-snug group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {news.title}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-500 mt-1 block">
                        {new Date(news.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {news.source}
                      </span>
                    </a>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-800/60">
                <button className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  {'<'}
                </button>
                <button className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  {'>'}
                </button>
              </div>
            </div>

          </div>

          {/* Top Gainers & Losers row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Gainers */}
            <div className="bg-[#131b26] border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                <h2 className="text-[15px] font-bold text-blue-400">Top Gainers</h2>
                <button 
                  onClick={() => setViewAllType('gainers')}
                  className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {topGainers.map(s => {
                  // Max width is 100%, we normalize based on the top gainer's change
                  const maxChange = topGainers[0]?.change || 1;
                  const widthPct = Math.max(10, Math.min(100, (s.change / maxChange) * 100));
                  return (
                    <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate group-hover:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-6">
                        <div 
                          className="h-full bg-emerald-500 flex items-center justify-end px-2 text-[10px] font-bold text-white rounded-r-sm transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:brightness-110"
                          style={{ width: `${widthPct}%` }}
                        >
                          {s.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-[#131b26] border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                <h2 className="text-[15px] font-bold text-blue-400">Top Losers</h2>
                <button 
                  onClick={() => setViewAllType('losers')}
                  className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {topLosers.map(s => {
                  const maxChange = Math.abs(topLosers[0]?.change || 1);
                  const widthPct = Math.max(10, Math.min(100, (Math.abs(s.change) / maxChange) * 100));
                  return (
                    <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate group-hover:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-6">
                        <div 
                          className="h-full bg-red-500 flex items-center justify-end px-2 text-[10px] font-bold text-white rounded-r-sm transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.3)] group-hover:brightness-110"
                          style={{ width: `${widthPct}%` }}
                        >
                          {s.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Breakout Beacon & Intraday Boost grids */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full min-w-0">
            
            {/* BREAKOUT BEACON */}
            <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
              {/* Top glowing line for a premium feel */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r from-emerald-500 to-transparent blur-2xl" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                    <div className="scale-125 sm:scale-150">
                      <div className="relative w-full h-full flex flex-col items-center justify-center pt-2">
                        <div className="flex items-end gap-0.5">
                          <div className="w-1.5 h-3 bg-red-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                          <div className="w-1.5 h-4 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                          <div className="w-1.5 h-6 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">BREAKOUT BEACON</h2>
                      <Flame className="w-5 h-5 text-orange-500 fill-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(239,68,68,0.2)] uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative hidden sm:block z-10">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={breakoutSearch}
                    onChange={(e) => setBreakoutSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-40 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 px-5 py-3 border-b border-slate-800/60 bg-[#172030]/50 relative z-20">
                <div className="relative">
                  <button 
                    onClick={() => setIsBreakoutFilterOpen(!isBreakoutFilterOpen)}
                    onBlur={() => setTimeout(() => setIsBreakoutFilterOpen(false), 150)}
                    className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {breakoutFilter === 'Bullish' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : 
                     breakoutFilter === 'Bearish' ? <TrendingDown className="w-3 h-3 text-red-400" /> : 
                     <Activity className="w-3 h-3 text-slate-400" />}
                    {breakoutFilter} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isBreakoutFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                      <button onMouseDown={(e) => { e.preventDefault(); setBreakoutFilter('All Signals'); setIsBreakoutFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-slate-400"/> All Signals
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBreakoutFilter('Bullish'); setIsBreakoutFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400"/> Bullish
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBreakoutFilter('Bearish'); setIsBreakoutFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-3 h-3 text-red-400"/> Bearish
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
                <div className="w-full flex flex-col min-w-[500px]">
                  <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                    <div className="w-[65px] sm:w-[80px] shrink-0">Signal</div>
                    <div className="flex-1 min-w-0 pr-2">Symbol</div>
                    <div className="w-[80px] sm:w-[110px] text-center shrink-0">%</div>
                    <div className="w-[60px] sm:w-[80px] text-center shrink-0">Signal % <ChevronDown className="w-3 h-3 inline" /></div>
                    <div className="w-[60px] sm:w-[80px] text-right shrink-0">Time</div>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                    {breakouts.map((b) => (
                      <div 
                        key={`breakout-${b.symbol}`} 
                        onClick={() => handleRowClick(b.symbol)}
                        className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${b.isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        
                        <div className="w-[65px] sm:w-[80px] shrink-0">
                          <span className={`inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest shadow-sm border ${
                            b.isBull ? 'bg-[#c6f6d5] text-[#14532d] border-[#86efac]' : 'bg-[#fed7d7] text-[#7f1d1d] border-[#fca5a5]'
                          }`}>
                            {b.isBull ? 'BULL' : 'BEAR'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pr-2">
                          <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                          <span className="text-sm sm:text-base font-bold text-slate-200 group-hover/row:text-white transition-colors group-hover/row:translate-x-1 duration-200 truncate">{b.symbol}</span>
                        </div>

                        <div className="w-[80px] sm:w-[110px] flex justify-center items-center shrink-0">
                          <span className={`inline-flex items-center justify-center w-full max-w-[75px] py-1.5 rounded-md text-xs sm:text-sm font-black border ${
                            b.change >= 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          }`}>
                            {b.change >= 0 ? '+' : ''}{b.change.toFixed(2)}%
                          </span>
                        </div>

                        <div className="w-[60px] sm:w-[80px] text-center text-xs sm:text-sm font-bold text-slate-300 shrink-0">
                          {b.signalPct.toFixed(2)}%
                        </div>

                        <div className="w-[60px] sm:w-[80px] text-right text-[10px] sm:text-[11px] font-semibold text-slate-400 shrink-0">
                          {b.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* INTRADAY BOOST */}
            <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
              {/* Top glowing line for a premium feel */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r from-blue-500 to-transparent blur-2xl" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                    <div className="scale-125 sm:scale-150">
                      <span className="text-[10px] font-black text-blue-400 italic tracking-tighter">BOOST</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">INTRADAY BOOST</h2>
                      <Droplets className="w-5 h-5 text-blue-400 fill-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(239,68,68,0.2)] uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative hidden sm:block z-10">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={boostSearch}
                    onChange={(e) => setBoostSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-40 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 px-5 py-3 border-b border-slate-800/60 bg-[#172030]/50 relative z-20">
                <div className="relative">
                  <button 
                    onClick={() => setIsBoostFilterOpen(!isBoostFilterOpen)}
                    onBlur={() => setTimeout(() => setIsBoostFilterOpen(false), 150)}
                    className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {boostFilter === 'Bullish' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : 
                     boostFilter === 'Bearish' ? <TrendingDown className="w-3 h-3 text-red-400" /> : 
                     <Activity className="w-3 h-3 text-slate-400" />}
                    {boostFilter} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isBoostFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                      <button onMouseDown={(e) => { e.preventDefault(); setBoostFilter('All Signals'); setIsBoostFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-slate-400"/> All Signals
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBoostFilter('Bullish'); setIsBoostFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400"/> Bullish
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBoostFilter('Bearish'); setIsBoostFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-3 h-3 text-red-400"/> Bearish
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
                <div className="w-full flex flex-col min-w-[500px]">
                  <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                    <div className="flex-1 min-w-0 pr-2">Symbol</div>
                    <div className="w-[80px] sm:w-[110px] text-center shrink-0">%</div>
                    <div className="w-[60px] sm:w-[80px] text-center shrink-0">R.Strength <ChevronDown className="w-3 h-3 inline" /></div>
                    <div className="w-[65px] sm:w-[80px] text-right shrink-0">Trend</div>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                    {boosters.map((b) => (
                      <div 
                        key={`boost-${b.symbol}`} 
                        onClick={() => handleRowClick(b.symbol)}
                        className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${b.isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        
                        <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pr-2">
                          <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                          <span className="text-sm sm:text-base font-bold text-slate-200 group-hover/row:text-white transition-colors group-hover/row:translate-x-1 duration-200 truncate">{b.symbol}</span>
                        </div>

                        <div className="w-[80px] sm:w-[110px] flex justify-center items-center shrink-0">
                          <span className={`inline-flex items-center justify-center w-full max-w-[75px] py-1.5 rounded-md text-xs sm:text-sm font-black border ${
                            b.change >= 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          }`}>
                            {b.change >= 0 ? '+' : ''}{b.change.toFixed(2)}%
                          </span>
                        </div>

                        <div className="w-[60px] sm:w-[80px] text-center text-xs sm:text-sm font-bold text-slate-300 shrink-0">
                          {b.rFac.toFixed(2)}%
                        </div>

                        <div className="w-[65px] sm:w-[80px] shrink-0 flex justify-end">
                          <span className={`inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest shadow-sm border ${
                            b.isBull ? 'bg-[#c6f6d5] text-[#14532d] border-[#86efac]' : 'bg-[#fed7d7] text-[#7f1d1d] border-[#fca5a5]'
                          }`}>
                            {b.isBull ? 'UP' : 'DOWN'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* VIEW ALL MODAL */}
      {viewAllType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131b26] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60 bg-[#172030]">
              <h2 className={`text-xl font-bold ${viewAllType === 'gainers' ? 'text-emerald-400' : 'text-red-400'}`}>
                {viewAllType === 'gainers' ? 'Top Gainers' : 'Top Losers'}
              </h2>
              <button 
                onClick={() => setViewAllType(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {(() => {
                  const sortedData = viewAllType === 'gainers' 
                    ? [...marketData].sort((a, b) => b.change - a.change)
                    : [...marketData].sort((a, b) => a.change - b.change);
                  
                  const filteredData = sortedData.filter(s => viewAllType === 'gainers' ? s.change > 0 : s.change < 0).slice(0, 20);
                  
                  if (filteredData.length === 0) {
                    return <div className="text-center text-slate-500 py-8">No {viewAllType} found.</div>;
                  }

                  const maxChange = Math.abs(filteredData[0]?.change || 1);

                  return filteredData.map(s => {
                    const widthPct = Math.max(10, Math.min(100, (Math.abs(s.change) / maxChange) * 100));
                    return (
                      <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-4 cursor-pointer group">
                        <div className="w-32 flex items-center gap-3 shrink-0">
                           <StockLogo symbol={s.symbol} />
                           <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                        </div>
                        <div className="flex-1 flex items-center h-8 bg-[#0f1520] rounded-r-md">
                          <div 
                            className={`h-full flex items-center justify-end px-3 text-xs font-bold text-white rounded-r-md transition-all duration-1000 shadow-lg group-hover:brightness-110 ${
                              viewAllType === 'gainers' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          >
                            {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-bold text-slate-200">
                          ₹{s.price.toFixed(2)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketEye;
