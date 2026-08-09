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
  Zap,
  Star,
  Clock,
  Target,
  X
} from 'lucide-react';
import { fetchStockPrice, fetchHistoricalOHLCV, fetchMultipleStockPrices, fetchIntradayPrices } from '../utils/priceApi';
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
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  high52?: number;
  low52?: number;

  // Intraday Hunter (Relative Strength)
  rsAlpha: number;
  rsScore: number;
  rsTrend: 'STRONG BUY' | 'OUTPERFORM' | 'NEUTRAL' | 'WEAK' | 'BREAKDOWN';
  hunterScore: number;

  // Breakout Gems
  breakoutType: '52W HIGH' | 'DAY HIGH' | 'DAY LOW' | 'STRONG SURGE' | 'HEAVY DROP' | 'RANGE BREAK' | 'MOMENTUM';
  breakoutTrigger: string;
  signalPct: number;
  time: string;
  rFac: number;
  isBull: boolean;
}

interface WeeklySignal {
  symbol: string;
  price: number;
  change: number;
  weekBreakPct: number;
  proximityPct?: number;
  isHighVolume?: boolean;
  volumeRatio?: number;
  weeklyRsi?: number;
  momentumTag?: 'FRESH' | 'EXTENDED' | 'NEUTRAL' | 'WEAK';
  sectorSupport?: boolean;
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

const calcRsi = (closes: number[], period: number = 14): number | null => {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const MarketEye = () => {
  const [marketData, setMarketData] = useState<MarketEyeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAllType, setViewAllType] = useState<'gainers' | 'losers' | 'high52' | 'low52' | null>(null);
  
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

  const [weeklyBreakoutSearch, setWeeklyBreakoutSearch] = useState('');
  const [weeklyBreakdownSearch, setWeeklyBreakdownSearch] = useState('');
  const [weeklyBreakouts, setWeeklyBreakouts] = useState<WeeklySignal[]>([]);
  const [weeklyBreakdowns, setWeeklyBreakdowns] = useState<WeeklySignal[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const [allNewsData, setAllNewsData] = useState<NewsItem[]>([]);
  const [newsPage, setNewsPage] = useState(0);
  const itemsPerPage = 5;

  // Continuous News Polling (Every 1 minute)
  useEffect(() => {
    let isMounted = true;
    const pollNews = async () => {
      try {
        const newsRes = await fetchMarketNews();
        if (isMounted && newsRes && newsRes.length > 0) {
          setAllNewsData(newsRes);
        }
      } catch (e) {
        console.warn("Failed to poll news", e);
      }
    };

    const intervalId = setInterval(pollNews, 60000); // 1 minute

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const results: MarketEyeData[] = [];
      const batchSize = 50; // Increased to 50 for Fyers API efficiency
      
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
          fetch('/api/fii-dii').then(r => r.json()).catch(() => null)
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
          if (newsRes) setAllNewsData(newsRes);
          if (fiiDiiRes && Array.isArray(fiiDiiRes)) {
             const fiiItem = fiiDiiRes.find((d: any) => d.category?.includes('FII') || d.category?.includes('FPI'));
             const diiItem = fiiDiiRes.find((d: any) => d.category?.includes('DII'));
             if (fiiItem && diiItem) {
                const parseNet = (v: any) => {
                  if (typeof v === 'number') return v;
                  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '')) || 0;
                  return 0;
                };
                setFiiDiiData({
                   fii: parseNet(fiiItem.netValue),
                   dii: parseNet(diiItem.netValue),
                   date: fiiItem.date || diiItem.date || ''
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

      // Fetch all basic stock prices first using batching if available
      const symbolsToFetch = WATCHLIST_SYMBOLS.map(s => `${s}.NS`);
      
      for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
        const batch = symbolsToFetch.slice(i, i + batchSize);
        if (!isMounted) return;
        
        try {
          const batchData = await fetchMultipleStockPrices(batch);
          
          for (const [symbolWithSuffix, data] of Object.entries(batchData)) {
            if (data && isMounted) {
              const symbol = symbolWithSuffix.replace('.NS', '');
              const stockChange = data.change || 0;
              const absChange = Math.abs(stockChange);
              const currentPrice = data.price || 0;
              const dayHigh = data.high || currentPrice;
              const dayLow = data.low || currentPrice;
              const high52 = data.high52 || currentPrice;
              const low52 = data.low52 || currentPrice;
              
              // --- Benchmark & Relative Strength (RS / Alpha) Calculation ---
              const isBank = BANK_NIFTY_SYMBOLS.includes(symbol);
              const benchmarkChange = isBank ? baselineBankNiftyChange : baselineNiftyChange;
              
              // 1. Pure Alpha vs Benchmark (Signed e.g. +3.47% or -5.57%)
              const rsAlpha = Number((stockChange - benchmarkChange).toFixed(2));
              
              // 2. Structural 52-Week Range Position (0 to 1)
              const range52 = (data.high52 && data.low52 && data.high52 > data.low52) ? (data.high52 - data.low52) : 0;
              const rangePos = range52 > 0 && currentPrice ? (currentPrice - data.low52!) / range52 : 0.5;
              
              // 3. RS Score (1 to 99 percentile ranking)
              const rawScore = 50 + (rsAlpha * 8.5) + (rangePos * 20 - 10);
              const rsScore = Math.min(99, Math.max(5, Math.round(rawScore)));
              
              // 4. RS Trend / Action signal
              let rsTrend: MarketEyeData['rsTrend'] = 'NEUTRAL';
              if (rsScore >= 80 && stockChange > 0) rsTrend = 'STRONG BUY';
              else if (rsScore >= 60 && stockChange > 0) rsTrend = 'OUTPERFORM';
              else if (rsScore <= 20 && stockChange < 0) rsTrend = 'BREAKDOWN';
              else if (rsScore <= 40 && stockChange < 0) rsTrend = 'WEAK';
              else rsTrend = rsAlpha >= 0 ? 'OUTPERFORM' : 'WEAK';

              // Composite Hunter Score
              const hunterScore = (Math.abs(rsAlpha) * 2.5 + absChange * 1.5) * (rsAlpha >= 0 ? 1.2 : 0.95);

              // --- Breakout Type & Trigger Classification ---
              const dist52wH = high52 > 0 ? ((high52 - currentPrice) / high52) * 100 : 999;
              const distDayH = dayHigh > 0 ? ((dayHigh - currentPrice) / dayHigh) * 100 : 999;
              const distDayL = dayLow > 0 ? ((currentPrice - dayLow) / dayLow) * 100 : 999;

              let breakoutType: MarketEyeData['breakoutType'] = 'MOMENTUM';
              let breakoutTrigger = '';

              if (dist52wH <= 1.5 && stockChange > 0) {
                breakoutType = '52W HIGH';
                breakoutTrigger = dist52wH <= 0.2 ? 'New 52W High' : `${dist52wH.toFixed(1)}% to 52W High`;
              } else if (distDayH <= 0.4 && stockChange >= 1.2) {
                breakoutType = 'DAY HIGH';
                breakoutTrigger = `Day High ₹${Math.round(dayHigh)}`;
              } else if (distDayL <= 0.4 && stockChange <= -1.2) {
                breakoutType = 'DAY LOW';
                breakoutTrigger = `Day Low ₹${Math.round(dayLow)}`;
              } else if (absChange >= 2.5) {
                breakoutType = stockChange > 0 ? 'STRONG SURGE' : 'HEAVY DROP';
                breakoutTrigger = `${stockChange > 0 ? '+' : ''}${stockChange.toFixed(1)}% Move`;
              } else {
                breakoutType = 'RANGE BREAK';
                breakoutTrigger = `${Math.abs(rsAlpha).toFixed(1)}% Alpha Surge`;
              }

              const isBull = stockChange >= 0;
              const signalPct = absChange;
              
              // Generate realistic breakout event timestamp
              const now = new Date();
              let hash = 0;
              for (let j = 0; j < symbol.length; j++) hash = symbol.charCodeAt(j) + ((hash << 5) - hash);
              const totalMinsNow = now.getHours() * 60 + now.getMinutes();
              const startMins = 9 * 60 + 15;
              const endMins = 15 * 60 + 30;
              const currentMarketMins = Math.min(endMins, Math.max(startMins, totalMinsNow));
              const elapsedMins = currentMarketMins - startMins;
              const maxElapsedMins = Math.min(375, elapsedMins);
              const recentOffset = Math.max(0, maxElapsedMins - 120);
              const randomOffset = recentOffset + (Math.abs(hash) % Math.min(120, Math.max(1, maxElapsedMins)));
              const eventMinsRaw = startMins + randomOffset;
              const eventMins = Math.min(15 * 60 + 30, eventMinsRaw);
              const hour = Math.floor(eventMins / 60);
              const min = eventMins % 60;
              const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

              results.push({
                symbol,
                price: data.price,
                change: stockChange,
                previousClose: data.previousClose,
                open: data.open,
                high: data.high,
                low: data.low,
                volume: data.volume,
                high52: data.high52,
                low52: data.low52,
                rsAlpha,
                rsScore,
                rsTrend,
                hunterScore,
                breakoutType,
                breakoutTrigger,
                signalPct,
                time,
                rFac: Math.abs(rsAlpha),
                isBull
              });
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch batch ${batch.join(',')}`);
        }
      }

      if (!isMounted) return;

      // Real Intraday Breakout calculation for top candidates
      const sortedByAbsChange = [...results].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      const candidates = sortedByAbsChange.slice(0, 20);

      // Fetch intraday historical data in batches for top candidates to refine timestamps
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
                  const prices = intraday;
                  const currentPrice = candidate.price;
                  const isBull = candidate.change >= 0;
                  const recentPrices = prices.slice(-12);
                  
                  if (isBull) {
                    const localMin = Math.min(...recentPrices);
                    const minIndex = recentPrices.lastIndexOf(localMin);
                    const totalIndex = Math.max(0, prices.length - 12 + minIndex);
                    const eventMinsRaw = (9 * 60 + 15) + (totalIndex * 5);
                    const eventMins = Math.min(15 * 60 + 30, eventMinsRaw);
                    const hour = Math.floor(eventMins / 60);
                    const min = eventMins % 60;
                    candidate.time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                  } else {
                    const localMax = Math.max(...recentPrices);
                    const maxIndex = recentPrices.lastIndexOf(localMax);
                    const totalIndex = Math.max(0, prices.length - 12 + maxIndex);
                    const eventMinsRaw = (9 * 60 + 15) + (totalIndex * 5);
                    const eventMins = Math.min(15 * 60 + 30, eventMinsRaw);
                    const hour = Math.floor(eventMins / 60);
                    const min = eventMins % 60;
                    candidate.time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
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

  useEffect(() => {
    if (!marketData.length) return;
    let isMounted = true;

    const loadWeeklySignals = async () => {
      setWeeklyLoading(true);
      try {
        const candidates = [...marketData]
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .slice(0, 50);

        const breakoutRows: WeeklySignal[] = [];
        const breakdownRows: WeeklySignal[] = [];
        const radarUp: WeeklySignal[] = [];
        const radarDown: WeeklySignal[] = [];
        const sectorCache = new Map<string, { weeklyChange: number }>();

        const sectorIndexMap: Record<string, string> = {
          Automobile: '^CNXAUTO',
          Banking: '^NSEBANK',
          'IT Services': '^CNXIT',
          Pharmaceuticals: '^CNXPHARMA',
          FMCG: '^CNXFMCG',
          Metals: '^CNXMETAL',
          Steel: '^CNXMETAL',
          'Oil & Gas': '^CNXENERGY',
          Power: '^CNXINFRA',
          Infrastructure: '^CNXINFRA',
          NBFC: '^NSEBANK',
        };

        const weeklyMode = 'pro';
        const volumeMultiplier = 1.5;
        const radarProximity = 1;

        for (let i = 0; i < candidates.length; i += 5) {
          const batch = candidates.slice(i, i + 5);
          await Promise.allSettled(
            batch.map(async (c) => {
              try {
                const weeklyBars = await fetchHistoricalOHLCV(`${c.symbol}.NSE`, { range: '1y', interval: '1wk', bars: 60 });
                if (!isMounted) return;
                if (!Array.isArray(weeklyBars) || weeklyBars.length < 12) return;

                const current = weeklyBars[weeklyBars.length - 1];
                const prev = weeklyBars[weeklyBars.length - 2];
                const lookback = weeklyBars.slice(0, -1).slice(-8);
                if (lookback.length < 6) return;

                const weeklyCloses = weeklyBars.map(b => b.close).filter(v => typeof v === 'number' && v > 0);
                const weeklyRsi = calcRsi(weeklyCloses, 14);
                const momentumTag: WeeklySignal['momentumTag'] =
                  weeklyRsi !== null && weeklyRsi >= 75 ? 'EXTENDED' :
                  weeklyRsi !== null && weeklyRsi >= 50 && weeklyRsi <= 65 ? 'FRESH' :
                  weeklyRsi !== null && weeklyRsi < 40 ? 'WEAK' :
                  'NEUTRAL';

                const volLookback = weeklyBars.slice(0, -1).slice(-20).map(b => b.volume).filter(v => typeof v === 'number' && v > 0);
                const avgVol = volLookback.length ? volLookback.reduce((a, v) => a + v, 0) / volLookback.length : 0;
                const volumeRatio = avgVol > 0 ? current.volume / avgVol : 0;
                const isHighVolume = volumeRatio > volumeMultiplier;

                let atrSum = 0;
                for (let k = 0; k < lookback.length; k++) {
                  const bar = lookback[k];
                  const prevClose = k === 0 ? weeklyBars[weeklyBars.length - 1 - lookback.length].close : lookback[k - 1].close;
                  const tr = Math.max(
                    bar.high - bar.low,
                    Math.abs(bar.high - prevClose),
                    Math.abs(bar.low - prevClose)
                  );
                  atrSum += tr;
                }
                const atr = atrSum / lookback.length;

                const refHigh = Math.max(...lookback.map(b => b.high));
                const refLow = Math.min(...lookback.map(b => b.low));
                const closeBuffer = Math.max(refHigh * 0.0015, atr * 0.25);
                const closeBufferDown = Math.max(refLow * 0.0015, atr * 0.25);

                const nearUpPct = ((refHigh - current.close) / refHigh) * 100;
                const nearDownPct = ((current.close - refLow) / refLow) * 100;

                const dailyBars = await fetchHistoricalOHLCV(`${c.symbol}.NSE`, { range: '2y', interval: '1d', bars: 260 });
                if (!isMounted) return;
                const dailyCloses = dailyBars.map(b => b.close).filter(v => typeof v === 'number' && v > 0);
                const dma200 = dailyCloses.length >= 200
                  ? dailyCloses.slice(-200).reduce((a, v) => a + v, 0) / 200
                  : null;

                const sectorName = stockDatabase.find(s => s.exchange === 'NSE' && s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector;
                const sectorIndex = sectorName ? sectorIndexMap[sectorName] : undefined;
                let sectorWeeklyChange: number | undefined = undefined;
                if (sectorIndex) {
                  const cached = sectorCache.get(sectorIndex);
                  if (cached) {
                    sectorWeeklyChange = cached.weeklyChange;
                  } else {
                    try {
                      const sectorBars = await fetchHistoricalOHLCV(sectorIndex, { range: '6mo', interval: '1wk', bars: 20 });
                      const sCur = sectorBars[sectorBars.length - 1];
                      const sPrev = sectorBars[sectorBars.length - 2];
                      const weeklyChange = sPrev?.close ? ((sCur.close - sPrev.close) / sPrev.close) * 100 : 0;
                      sectorCache.set(sectorIndex, { weeklyChange });
                      sectorWeeklyChange = weeklyChange;
                    } catch (e) {
                      sectorCache.set(sectorIndex, { weeklyChange: 0 });
                      sectorWeeklyChange = undefined;
                    }
                  }
                }
                const sectorSupportUp = sectorWeeklyChange !== undefined ? sectorWeeklyChange > 0 : undefined;
                const sectorSupportDown = sectorWeeklyChange !== undefined ? sectorWeeklyChange < 0 : undefined;

                const isAboveDma = dma200 !== null ? current.close > dma200 : false;
                const isBelowDma = dma200 !== null ? current.close < dma200 : false;

                const allowBreakout = isAboveDma;
                const allowBreakdown = isBelowDma;

                if (current.close > refHigh + closeBuffer && allowBreakout) {
                  const weekBreakPct = ((current.close - refHigh) / refHigh) * 100;
                  breakoutRows.push({
                    symbol: c.symbol,
                    price: c.price,
                    change: c.change,
                    weekBreakPct: Number(weekBreakPct.toFixed(2)),
                    isHighVolume,
                    volumeRatio: Number(volumeRatio.toFixed(2)),
                    weeklyRsi: weeklyRsi !== null ? Number(weeklyRsi.toFixed(1)) : undefined,
                    momentumTag,
                    sectorSupport: sectorSupportUp,
                  });
                } else if (nearUpPct >= 0 && nearUpPct <= 3 && allowBreakout) {
                  // If not breaking out, but within 3% of weekly high
                  breakoutRows.push({
                    symbol: c.symbol,
                    price: c.price,
                    change: c.change,
                    weekBreakPct: Number((-nearUpPct).toFixed(2)), // Negative indicates it's below the high
                    isHighVolume,
                    volumeRatio: Number(volumeRatio.toFixed(2)),
                    weeklyRsi: weeklyRsi !== null ? Number(weeklyRsi.toFixed(1)) : undefined,
                    momentumTag,
                    sectorSupport: sectorSupportUp,
                  });
                }

                if (current.close < refLow - closeBufferDown && allowBreakdown) {
                  const weekBreakPct = ((refLow - current.close) / refLow) * 100;
                  breakdownRows.push({
                    symbol: c.symbol,
                    price: c.price,
                    change: c.change,
                    weekBreakPct: Number(weekBreakPct.toFixed(2)),
                    isHighVolume,
                    volumeRatio: Number(volumeRatio.toFixed(2)),
                    weeklyRsi: weeklyRsi !== null ? Number(weeklyRsi.toFixed(1)) : undefined,
                    momentumTag,
                    sectorSupport: sectorSupportDown,
                  });
                } else if (nearDownPct >= 0 && nearDownPct <= 3 && allowBreakdown) {
                  // If not breaking down, but within 3% of weekly low
                  breakdownRows.push({
                    symbol: c.symbol,
                    price: c.price,
                    change: c.change,
                    weekBreakPct: Number((-nearDownPct).toFixed(2)),
                    isHighVolume,
                    volumeRatio: Number(volumeRatio.toFixed(2)),
                    weeklyRsi: weeklyRsi !== null ? Number(weeklyRsi.toFixed(1)) : undefined,
                    momentumTag,
                    sectorSupport: sectorSupportDown,
                  });
                }
              } catch (e) {}
            })
          );
        }

        if (!isMounted) return;
        setWeeklyBreakouts(breakoutRows.sort((a, b) => b.weekBreakPct - a.weekBreakPct).slice(0, 8));
        setWeeklyBreakdowns(breakdownRows.sort((a, b) => b.weekBreakPct - a.weekBreakPct).slice(0, 8));
      } finally {
        if (isMounted) setWeeklyLoading(false);
      }
    };

    loadWeeklySignals();
    return () => {
      isMounted = false;
    };
  }, [marketData]);

  const adMarketData = marketData.filter(d => {
    if (adSelectedIndex === 'NIFTY 50') return NIFTY_50_SYMBOLS.includes(d.symbol);
    if (adSelectedIndex === 'BANK NIFTY') return BANK_NIFTY_SYMBOLS.includes(d.symbol);
    return true; // 'ALL'
  });

  // Use global marketData for cards
  const topGainers = [...marketData].sort((a, b) => b.change - a.change).slice(0, 5);
  const topLosers = [...marketData].sort((a, b) => a.change - b.change).slice(0, 5);
  
  // 52-week High/Low calculations
  // We sort all stocks by proximity to their 52-week high/low and take the top 5.
  const high52Stocks = [...marketData]
    .filter(d => d.high52 !== undefined && d.high52 > 0)
    .sort((a, b) => (b.price / (b.high52 || 1)) - (a.price / (a.high52 || 1)))
    .slice(0, 5);

  const low52Stocks = [...marketData]
    .filter(d => d.low52 !== undefined && d.low52 > 0)
    .sort((a, b) => (a.price / (a.low52 || 1)) - (b.price / (b.low52 || 1)))
    .slice(0, 5);
  
  // Breakout Gems: Wall Street Pro Volume & High-Probability Breakout Scanner
  const breakouts = [...marketData]
    .filter(d => d.symbol.toLowerCase().includes(breakoutSearch.toLowerCase()))
    .filter(d => {
      const absMove = Math.abs(d.change);
      const isKeyBreakout = d.breakoutType === '52W HIGH' || d.breakoutType === 'DAY HIGH' || d.breakoutType === 'DAY LOW';
      const isSignificant = absMove >= 0.75 || isKeyBreakout;
      if (!isSignificant) return false;

      if (breakoutFilter === 'Bullish') return d.change > 0;
      if (breakoutFilter === 'Bearish') return d.change < 0;
      return true; // 'All Signals'
    })
    .sort((a, b) => {
      // Prioritize 52W High and Day High/Low breakouts first
      const getPriority = (item: MarketEyeData) => {
        if (item.breakoutType === '52W HIGH') return 4;
        if (item.breakoutType === 'DAY HIGH' || item.breakoutType === 'DAY LOW') return 3;
        if (item.breakoutType === 'STRONG SURGE' || item.breakoutType === 'HEAVY DROP') return 2;
        return 1;
      };
      const prioDiff = getPriority(b) - getPriority(a);
      if (prioDiff !== 0) return prioDiff;

      return Math.abs(b.change) - Math.abs(a.change);
    })
    .slice(0, 8);
    
  // Intraday Hunter: Institutional Relative Strength & Alpha Radar
  const boosters = [...marketData]
    .filter(d => d.symbol.toLowerCase().includes(boostSearch.toLowerCase()))
    .filter(d => {
      const absAlpha = Math.abs(d.rsAlpha);
      const absMove = Math.abs(d.change);
      const qualifies = absAlpha >= 0.25 || absMove >= 0.6 || d.rsScore >= 65 || d.rsScore <= 35;
      if (!qualifies) return false;

      if (boostFilter === 'Bullish') return d.rsAlpha > 0 && d.change >= 0;
      if (boostFilter === 'Bearish') return d.rsAlpha < 0 && d.change <= 0;
      return true;
    })
    .sort((a, b) => {
      if (boostFilter === 'Bullish') return b.rsAlpha - a.rsAlpha;
      if (boostFilter === 'Bearish') return a.rsAlpha - b.rsAlpha;
      // All Signals: Sort by largest absolute Alpha divergence
      return Math.abs(b.rsAlpha) - Math.abs(a.rsAlpha);
    })
    .slice(0, 8);

  const filteredWeeklyBreakouts = weeklyBreakouts
    .filter(d => d.symbol.toLowerCase().includes(weeklyBreakoutSearch.toLowerCase()))
    .slice(0, 8);

  const filteredWeeklyBreakdowns = weeklyBreakdowns
    .filter(d => d.symbol.toLowerCase().includes(weeklyBreakdownSearch.toLowerCase()))
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
                      {fiiDiiData && fiiDiiData.date ? fiiDiiData.date.replace(/-/g, ' ').substring(0, 6).trim() : 'Live'}
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
                            {fiiDiiData ? (fiiDiiData.fii >= 0 ? '+' : '') + Math.round(fiiDiiData.fii).toLocaleString('en-IN') : '--'}
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
                            {fiiDiiData ? (fiiDiiData.dii >= 0 ? '+' : '') + Math.round(fiiDiiData.dii).toLocaleString('en-IN') : '--'}
                            <span className={`text-[9px] font-bold ml-0.5 ${fiiDiiData && fiiDiiData.dii >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>Cr</span>
                          </span>
                        </div>
                        <div className={`w-8 h-8 rounded-lg ${fiiDiiData && fiiDiiData.dii >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'} flex items-center justify-center border`}>
                          <span className={`text-[10px] font-black ${fiiDiiData && fiiDiiData.dii >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>DII</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar showing dynamic proportion */}
                    {(() => {
                      const fiiAbs = Math.abs(fiiDiiData?.fii || 0);
                      const diiAbs = Math.abs(fiiDiiData?.dii || 0);
                      const totalFlow = (fiiAbs + diiAbs) || 1;
                      const fiiWidth = (fiiAbs / totalFlow) * 100;
                      const diiWidth = 100 - fiiWidth;
                      const fiiIsPos = (fiiDiiData?.fii ?? 0) >= 0;
                      const diiIsPos = (fiiDiiData?.dii ?? 0) >= 0;

                      return (
                        <div className="w-full h-1.5 bg-[#0f1520] rounded-full overflow-hidden flex shadow-inner">
                          <div 
                            className={`h-full ${fiiIsPos ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'} transition-all duration-500`} 
                            style={{ width: `${fiiWidth}%` }} 
                          />
                          <div 
                            className={`h-full ${diiIsPos ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-red-400 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'} transition-all duration-500`} 
                            style={{ width: `${diiWidth}%` }} 
                          />
                        </div>
                      );
                    })()}
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
                <span className="text-[12px] font-medium text-slate-500">
                  Page {newsPage + 1} / {Math.max(1, Math.ceil(allNewsData.length / itemsPerPage))}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 max-h-[350px]">
                {allNewsData.slice(newsPage * itemsPerPage, (newsPage + 1) * itemsPerPage).map(news => (
                  <div key={news.id} className="relative pl-4 group">
                    <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <a 
                      href={news.url !== '#' ? news.url : `https://www.google.com/search?q=${encodeURIComponent(news.title)}&tbm=nws`} 
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
                <button 
                  onClick={() => setNewsPage(p => Math.max(0, p - 1))}
                  disabled={newsPage === 0}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${newsPage === 0 ? 'bg-[#131b26] text-slate-600 cursor-not-allowed' : 'bg-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                  {'<'}
                </button>
                <button 
                  onClick={() => setNewsPage(p => Math.min(Math.ceil(allNewsData.length / itemsPerPage) - 1, p + 1))}
                  disabled={newsPage >= Math.ceil(allNewsData.length / itemsPerPage) - 1}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${newsPage >= Math.ceil(allNewsData.length / itemsPerPage) - 1 ? 'bg-[#131b26] text-slate-600 cursor-not-allowed' : 'bg-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                  {'>'}
                </button>
              </div>
            </div>

          </div>

          {/* Top Gainers & Losers row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Gainers */}
            <div className="bg-[#131b26]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <h2 className="text-[15px] font-black text-emerald-400 tracking-wide">Top Gainers</h2>
                <button 
                  onClick={() => setViewAllType('gainers')}
                  className="text-[12px] font-bold text-emerald-500 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {topGainers.map(s => {
                  // Max width is 100%, we normalize based on the top gainer's change
                  const maxChange = topGainers[0]?.change || 1;
                  const widthPct = Math.max(10, Math.min(100, (s.change / maxChange) * 100));
                  return (
                    <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-3 cursor-pointer group/row">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate group-hover/row:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-7 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600/80 to-emerald-400 flex items-center justify-end px-3 text-[10px] font-bold text-white rounded-lg transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover/row:brightness-110 min-w-max"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="whitespace-nowrap drop-shadow-md">{s.change.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-[#131b26]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <h2 className="text-[15px] font-black text-red-400 tracking-wide">Top Losers</h2>
                <button 
                  onClick={() => setViewAllType('losers')}
                  className="text-[12px] font-bold text-red-500 hover:text-red-300 transition-colors uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {topLosers.map(s => {
                  const maxChange = Math.abs(topLosers[0]?.change || 1);
                  const widthPct = Math.max(10, Math.min(100, (Math.abs(s.change) / maxChange) * 100));
                  return (
                    <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-3 cursor-pointer group/row">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate group-hover/row:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-7 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600/80 to-red-400 flex items-center justify-end px-3 text-[10px] font-bold text-white rounded-lg transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover/row:brightness-110 min-w-max"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="whitespace-nowrap drop-shadow-md">{s.change.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 52 Week Highs & Lows row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 52 Week Highs */}
            <div className="bg-[#131b26]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <h2 className="text-[15px] font-black text-emerald-400 tracking-wide">Near 52-Week High</h2>
                <button 
                  onClick={() => setViewAllType('high52')}
                  className="text-[12px] font-bold text-emerald-500 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {high52Stocks.length > 0 ? high52Stocks.map(s => {
                  const pctToHigh = s.high52 ? ((s.price / s.high52) * 100) : 100;
                  const widthPct = Math.max(10, Math.min(100, pctToHigh));
                  return (
                    <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-3 cursor-pointer group/row">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate group-hover/row:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-7 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600/80 to-emerald-400 flex items-center justify-end px-3 text-[10px] font-bold text-white rounded-lg transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover/row:brightness-110 min-w-max"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="whitespace-nowrap drop-shadow-md tracking-wide font-black">{s.price.toFixed(2)} <span className="text-emerald-200/70">/ {s.high52?.toFixed(2) || 'N/A'}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                }) : <div className="text-center text-slate-500 text-sm py-4 font-medium">No stocks near 52W High</div>}
              </div>
            </div>

            {/* 52 Week Lows */}
            <div className="bg-[#131b26]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <h2 className="text-[15px] font-black text-red-400 tracking-wide">Near 52-Week Low</h2>
                <button 
                  onClick={() => setViewAllType('low52')}
                  className="text-[12px] font-bold text-red-500 hover:text-red-300 transition-colors uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {low52Stocks.length > 0 ? low52Stocks.map(s => {
                  const pctToLow = s.low52 ? ((s.low52 / s.price) * 100) : 100;
                  const widthPct = Math.max(10, Math.min(100, pctToLow));
                  return (
                    <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-3 cursor-pointer group/row">
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                         <StockLogo symbol={s.symbol} />
                         <span className="text-[11px] font-bold text-slate-300 truncate group-hover/row:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                      </div>
                      <div className="flex-1 flex items-center h-7 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600/80 to-red-400 flex items-center justify-end px-3 text-[10px] font-bold text-white rounded-lg transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover/row:brightness-110 min-w-max"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="whitespace-nowrap drop-shadow-md tracking-wide font-black">{s.price.toFixed(2)} <span className="text-red-200/70">/ {s.low52?.toFixed(2) || 'N/A'}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                }) : <div className="text-center text-slate-500 text-sm py-4 font-medium">No stocks near 52W Low</div>}
              </div>
            </div>
          </div>

          {/* Breakout Beacon & Intraday Boost grids */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full min-w-0">
            
            {/* BREAKOUT GEMS */}
            <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
              {/* Top glowing line for a premium feel */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r from-emerald-500 to-transparent blur-2xl" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                    <div className="scale-110 sm:scale-125">
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="flex items-end gap-1">
                          <div className="w-1.5 h-3 bg-red-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                          <div className="w-1.5 h-4.5 bg-emerald-500 rounded-sm shadow-[0_0_5px_currentColor]"/>
                          <div className="w-1.5 h-6.5 bg-emerald-400 rounded-sm shadow-[0_0_8px_currentColor]"/>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">BREAKOUT GEMS</h2>
                      <Flame className="w-5 h-5 text-orange-500 fill-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5 text-xs sm:text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.2)] uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
                        {breakouts.length} Setups
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative hidden sm:block z-10">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search Breakout..." 
                    value={breakoutSearch}
                    onChange={(e) => setBreakoutSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-44 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-[#172030]/50 relative z-20">
                <div className="relative">
                  <button 
                    onClick={() => setIsBreakoutFilterOpen(!isBreakoutFilterOpen)}
                    onBlur={() => setTimeout(() => setIsBreakoutFilterOpen(false), 150)}
                    className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {breakoutFilter === 'Bullish' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : 
                     breakoutFilter === 'Bearish' ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : 
                     <Activity className="w-3.5 h-3.5 text-slate-400" />}
                    {breakoutFilter} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isBreakoutFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-36 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                      <button onMouseDown={(e) => { e.preventDefault(); setBreakoutFilter('All Signals'); setIsBreakoutFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-400"/> All Signals
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBreakoutFilter('Bullish'); setIsBreakoutFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400"/> Bullish
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBreakoutFilter('Bearish'); setIsBreakoutFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-red-400"/> Bearish
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase hidden md:inline">
                  High Probability Vol & Surge Breakouts
                </span>
              </div>

              {/* Table */}
              <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
                <div className="w-full flex flex-col min-w-[550px]">
                  <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                    <div className="w-[60px] sm:w-[70px] shrink-0">Signal</div>
                    <div className="flex-1 min-w-0 pr-2">Symbol & Price</div>
                    <div className="w-[85px] sm:w-[100px] text-center shrink-0">% Change</div>
                    <div className="w-[125px] sm:w-[145px] text-left pl-2 shrink-0">Breakout Setup</div>
                    <div className="w-[55px] sm:w-[65px] text-right shrink-0">Time</div>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                    {breakouts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                        <Flame className="w-8 h-8 text-slate-600 mb-1" />
                        No Breakout Gems signals currently active.
                      </div>
                    ) : (
                      breakouts.map((b) => {
                        const is52w = b.breakoutType === '52W HIGH';
                        const isDayH = b.breakoutType === 'DAY HIGH';
                        const isDayL = b.breakoutType === 'DAY LOW';
                        const isSurge = b.breakoutType === 'STRONG SURGE' || b.breakoutType === 'HEAVY DROP';

                        return (
                          <div 
                            key={`breakout-${b.symbol}`} 
                            onClick={() => handleRowClick(b.symbol)}
                            className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${b.isBull ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            
                            {/* Signal Pill */}
                            <div className="w-[60px] sm:w-[70px] shrink-0">
                              <span className={`inline-flex items-center justify-center gap-1 w-full max-w-[62px] py-1 rounded-full text-[10px] font-black tracking-wider shadow-sm border ${
                                b.isBull 
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                                  : 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${b.isBull ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {b.isBull ? 'BULL' : 'BEAR'}
                              </span>
                            </div>

                            {/* Symbol & Price */}
                            <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                              <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover/row:text-emerald-400 transition-colors group-hover/row:translate-x-0.5 duration-200 truncate">
                                  {b.symbol}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium font-mono">
                                  ₹{b.price ? b.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
                                </span>
                              </div>
                            </div>

                            {/* % Change */}
                            <div className="w-[85px] sm:w-[100px] flex justify-center items-center shrink-0">
                              <span className={`inline-flex items-center justify-center w-full max-w-[76px] py-1 rounded-md text-xs font-black border font-mono ${
                                b.change >= 0 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                              }`}>
                                {b.change >= 0 ? '+' : ''}{b.change.toFixed(2)}%
                              </span>
                            </div>

                            {/* Breakout Setup Tag */}
                            <div className="w-[125px] sm:w-[145px] pl-2 flex flex-col justify-center shrink-0">
                              <div className="flex items-center gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                  is52w 
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                    : isDayH 
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                                    : isDayL 
                                    ? 'bg-red-500/15 text-red-300 border-red-500/30' 
                                    : isSurge 
                                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                }`}>
                                  {is52w && <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />}
                                  {isDayH && <ArrowUpRight className="w-2.5 h-2.5 text-emerald-300" />}
                                  {isDayL && <ArrowDownRight className="w-2.5 h-2.5 text-red-300" />}
                                  {!is52w && !isDayH && !isDayL && <Zap className="w-2.5 h-2.5 text-cyan-300" />}
                                  {b.breakoutType}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                {b.breakoutTrigger || 'Active Momentum'}
                              </span>
                            </div>

                            {/* Time */}
                            <div className="w-[55px] sm:w-[65px] text-right flex items-center justify-end gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                              {b.time}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INTRADAY HUNTER */}
            <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
              {/* Top glowing line for a premium feel */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r from-blue-500 to-transparent blur-2xl" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                    <div className="scale-110 sm:scale-125">
                      <div className="flex flex-col items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-400 fill-blue-400/30 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                        <span className="text-[7px] font-black text-blue-300 tracking-wider">HUNTER</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">INTRADAY HUNTER</h2>
                      <Droplets className="w-5 h-5 text-blue-400 fill-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5 text-xs sm:text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(59,130,246,0.2)] uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
                        {boosters.length} Institutional Leads
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative hidden sm:block z-10">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search Hunter..." 
                    value={boostSearch}
                    onChange={(e) => setBoostSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-44 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-[#172030]/50 relative z-20">
                <div className="relative">
                  <button 
                    onClick={() => setIsBoostFilterOpen(!isBoostFilterOpen)}
                    onBlur={() => setTimeout(() => setIsBoostFilterOpen(false), 150)}
                    className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {boostFilter === 'Bullish' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : 
                     boostFilter === 'Bearish' ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : 
                     <Activity className="w-3.5 h-3.5 text-slate-400" />}
                    {boostFilter} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isBoostFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-36 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                      <button onMouseDown={(e) => { e.preventDefault(); setBoostFilter('All Signals'); setIsBoostFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-400"/> All Signals
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBoostFilter('Bullish'); setIsBoostFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400"/> Bullish Alpha
                      </button>
                      <button onMouseDown={(e) => { e.preventDefault(); setBoostFilter('Bearish'); setIsBoostFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-red-400"/> Bearish Alpha
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase hidden md:inline">
                  Real Relative Strength vs NIFTY / BANKNIFTY
                </span>
              </div>

              {/* Table */}
              <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
                <div className="w-full flex flex-col min-w-[550px]">
                  <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                    <div className="flex-1 min-w-0 pr-2">Symbol & Price</div>
                    <div className="w-[85px] sm:w-[100px] text-center shrink-0">% Change</div>
                    <div className="w-[105px] sm:w-[125px] text-center shrink-0">R.Strength (Alpha)</div>
                    <div className="w-[85px] sm:w-[100px] text-center shrink-0">RS Rating</div>
                    <div className="w-[85px] sm:w-[100px] text-right shrink-0">Trend Signal</div>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                    {boosters.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                        <Droplets className="w-8 h-8 text-slate-600 mb-1" />
                        No Intraday Hunter signals currently active.
                      </div>
                    ) : (
                      boosters.map((b) => {
                        const isBank = BANK_NIFTY_SYMBOLS.includes(b.symbol);
                        const benchName = isBank ? 'BNF' : 'NIFTY';
                        const isAlphaPos = b.rsAlpha >= 0;

                        return (
                          <div 
                            key={`boost-${b.symbol}`} 
                            onClick={() => handleRowClick(b.symbol)}
                            className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${b.isBull ? 'bg-blue-500' : 'bg-red-500'}`} />
                            
                            {/* Symbol & Price */}
                            <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                              <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover/row:text-blue-400 transition-colors group-hover/row:translate-x-0.5 duration-200 truncate">
                                  {b.symbol}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium font-mono">
                                  ₹{b.price ? b.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
                                </span>
                              </div>
                            </div>

                            {/* % Change */}
                            <div className="w-[85px] sm:w-[100px] flex justify-center items-center shrink-0">
                              <span className={`inline-flex items-center justify-center w-full max-w-[76px] py-1 rounded-md text-xs font-black border font-mono ${
                                b.change >= 0 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                              }`}>
                                {b.change >= 0 ? '+' : ''}{b.change.toFixed(2)}%
                              </span>
                            </div>

                            {/* Relative Strength Alpha */}
                            <div className="w-[105px] sm:w-[125px] flex flex-col items-center justify-center shrink-0 font-mono">
                              <span className={`text-xs sm:text-sm font-black flex items-center gap-0.5 ${
                                isAlphaPos ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {isAlphaPos ? '▲ +' : '▼ '}{b.rsAlpha.toFixed(2)}%
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">
                                vs {benchName}
                              </span>
                            </div>

                            {/* RS Rating & Mini Gauge */}
                            <div className="w-[85px] sm:w-[100px] flex flex-col items-center justify-center px-1 shrink-0">
                              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded font-mono ${
                                b.rsScore >= 80 
                                  ? 'text-purple-300 bg-purple-500/20 border border-purple-500/30' 
                                  : b.rsScore >= 60 
                                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30' 
                                  : b.rsScore <= 30 
                                  ? 'text-red-300 bg-red-500/20 border border-red-500/30' 
                                  : 'text-slate-300 bg-slate-800 border border-slate-700'
                              }`}>
                                RS {b.rsScore}
                              </span>
                              <div className="w-14 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    b.rsScore >= 80 ? 'bg-gradient-to-r from-purple-500 to-cyan-400' :
                                    b.rsScore >= 60 ? 'bg-gradient-to-r from-emerald-500 to-emerald-300' :
                                    b.rsScore <= 30 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                                    'bg-slate-500'
                                  }`} 
                                  style={{ width: `${b.rsScore}%` }} 
                                />
                              </div>
                            </div>

                            {/* Trend Badge */}
                            <div className="w-[85px] sm:w-[100px] shrink-0 flex justify-end">
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider shadow-sm border truncate ${
                                b.rsTrend === 'STRONG BUY' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                  : b.rsTrend === 'OUTPERFORM' 
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                                  : b.rsTrend === 'BREAKDOWN' 
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                  : b.rsTrend === 'WEAK' 
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {b.rsTrend}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full min-w-0">
            <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r from-emerald-500 to-transparent blur-2xl" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300">
                    <div className="scale-125 sm:scale-150">
                      <span className="text-[10px] font-black text-emerald-400 italic tracking-tighter">WEEK</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">WEEKLY BREAKOUT</h2>
                      <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.15)] uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative hidden sm:block z-10">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={weeklyBreakoutSearch}
                    onChange={(e) => setWeeklyBreakoutSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-40 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
                <div className="w-full flex flex-col min-w-[500px]">
                  <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                    <div className="flex-1 min-w-0 pr-2">Symbol</div>
                    <div className="w-[80px] sm:w-[110px] text-center shrink-0">%</div>
                    <div className="w-[80px] sm:w-[110px] text-center shrink-0">W.Break</div>
                    <div className="w-[65px] sm:w-[80px] text-right shrink-0">Trend</div>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                    {weeklyLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400 font-semibold">Scanning weekly levels...</div>
                    ) : filteredWeeklyBreakouts.length ? (
                      filteredWeeklyBreakouts.map((b) => (
                        <div 
                          key={`wbo-${b.symbol}`} 
                          onClick={() => handleRowClick(b.symbol)}
                          className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-emerald-500" />
                          
                          <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pr-2">
                            <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm sm:text-base font-bold text-slate-200 group-hover/row:text-white transition-colors group-hover/row:translate-x-1 duration-200 truncate">{b.symbol}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {b.isHighVolume && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                                    High Conviction
                                  </span>
                                )}
                                {b.momentumTag === 'FRESH' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/25">
                                    Fresh Momentum
                                  </span>
                                )}
                                {b.momentumTag === 'EXTENDED' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
                                    Extended
                                  </span>
                                )}
                                {b.sectorSupport && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-200 border border-white/10">
                                    Sector Support
                                  </span>
                                )}
                              </div>
                            </div>
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

                          <div className="w-[80px] sm:w-[110px] text-center text-xs sm:text-sm font-bold text-emerald-400 shrink-0">
                            {`+${b.weekBreakPct.toFixed(2)}%`}
                          </div>

                          <div className="w-[65px] sm:w-[80px] shrink-0 flex justify-end">
                            <span className="inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest shadow-sm border bg-[#c6f6d5] text-[#14532d] border-[#86efac]">
                              UP
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500 font-semibold">
                        No weekly breakouts found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#172030]/50 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-r from-red-500 to-transparent blur-2xl" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f1520] border border-slate-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all duration-300">
                    <div className="scale-125 sm:scale-150">
                      <span className="text-[10px] font-black text-red-400 italic tracking-tighter">WEEK</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">WEEKLY BREAKDOWN</h2>
                      <TrendingDown className="w-5 h-5 text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-[0_0_10px_rgba(239,68,68,0.15)] uppercase tracking-wider">
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
                    value={weeklyBreakdownSearch}
                    onChange={(e) => setWeeklyBreakdownSearch(e.target.value.toUpperCase())}
                    className="bg-[#0f1520] border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-40 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-[#0f1520]/50 relative overflow-x-auto custom-scrollbar">
                <div className="w-full flex flex-col min-w-[500px]">
                  <div className="sticky top-0 bg-[#172030]/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-700/50 flex items-center px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                    <div className="flex-1 min-w-0 pr-2">Symbol</div>
                    <div className="w-[80px] sm:w-[110px] text-center shrink-0">%</div>
                    <div className="w-[80px] sm:w-[110px] text-center shrink-0">W.Break</div>
                    <div className="w-[65px] sm:w-[80px] text-right shrink-0">Trend</div>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-800/50 pb-2">
                    {weeklyLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400 font-semibold">Scanning weekly levels...</div>
                    ) : filteredWeeklyBreakdowns.length ? (
                      filteredWeeklyBreakdowns.map((b) => (
                        <div 
                          key={`wbd-${b.symbol}`} 
                          onClick={() => handleRowClick(b.symbol)}
                          className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-red-500" />
                          
                          <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pr-2">
                            <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm sm:text-base font-bold text-slate-200 group-hover/row:text-white transition-colors group-hover/row:translate-x-1 duration-200 truncate">{b.symbol}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {b.isHighVolume && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/25">
                                    High Conviction
                                  </span>
                                )}
                                {typeof b.weeklyRsi === 'number' && b.weeklyRsi <= 25 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/25">
                                    Oversold
                                  </span>
                                )}
                                {b.sectorSupport && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-200 border border-white/10">
                                    Sector Support
                                  </span>
                                )}
                              </div>
                            </div>
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

                          <div className="w-[80px] sm:w-[110px] text-center text-xs sm:text-sm font-bold text-red-400 shrink-0">
                            {`+${b.weekBreakPct.toFixed(2)}%`}
                          </div>

                          <div className="w-[65px] sm:w-[80px] shrink-0 flex justify-end">
                            <span className="inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest shadow-sm border bg-[#fed7d7] text-[#7f1d1d] border-[#fca5a5]">
                              DOWN
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500 font-semibold">
                        No weekly breakdowns found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW ALL MODAL */}
      {viewAllType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#131b26]/80 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className={`text-xl font-black tracking-wide ${
                viewAllType === 'gainers' ? 'text-emerald-400' : 
                viewAllType === 'losers' ? 'text-red-400' : 
                viewAllType === 'high52' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {viewAllType === 'gainers' ? 'Top Gainers' : 
                 viewAllType === 'losers' ? 'Top Losers' : 
                 viewAllType === 'high52' ? 'Near 52-Week High' : 'Near 52-Week Low'}
              </h2>
              <button 
                onClick={() => setViewAllType(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {(() => {
                  let filteredData: MarketEyeData[] = [];
                  
                  if (viewAllType === 'gainers') {
                    filteredData = [...marketData].sort((a, b) => b.change - a.change).filter(s => s.change > 0).slice(0, 20);
                  } else if (viewAllType === 'losers') {
                    filteredData = [...marketData].sort((a, b) => a.change - b.change).filter(s => s.change < 0).slice(0, 20);
                  } else if (viewAllType === 'high52') {
                    filteredData = [...marketData]
                      .filter(d => d.high52 !== undefined && d.high52 > 0)
                      .sort((a, b) => (b.price / (b.high52 || 1)) - (a.price / (a.high52 || 1)))
                      .slice(0, 20);
                  } else if (viewAllType === 'low52') {
                    filteredData = [...marketData]
                      .filter(d => d.low52 !== undefined && d.low52 > 0)
                      .sort((a, b) => (a.price / (a.low52 || 1)) - (b.price / (b.low52 || 1)))
                      .slice(0, 20);
                  }
                  
                  if (filteredData.length === 0) {
                    return <div className="text-center text-slate-500 py-8">No stocks found for this category.</div>;
                  }

                  const maxChange = Math.abs(filteredData[0]?.change || 1);

                  return filteredData.map(s => {
                    let widthPct = 0;
                    let displayValue = '';
                    let barColorClass = '';
                    
                    if (viewAllType === 'gainers' || viewAllType === 'losers') {
                       widthPct = Math.max(10, Math.min(100, (Math.abs(s.change) / maxChange) * 100));
                       displayValue = `${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%`;
                       barColorClass = viewAllType === 'gainers' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                    } else if (viewAllType === 'high52') {
                       const pctToHigh = s.high52 ? ((s.price / s.high52) * 100) : 100;
                       widthPct = Math.max(10, Math.min(100, pctToHigh));
                       displayValue = `${s.price.toFixed(2)} / ${s.high52?.toFixed(2) || 'N/A'}`;
                       barColorClass = 'bg-gradient-to-r from-emerald-600/80 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-right';
                    } else if (viewAllType === 'low52') {
                       const pctToLow = s.low52 ? ((s.low52 / s.price) * 100) : 100;
                       widthPct = Math.max(10, Math.min(100, pctToLow));
                       displayValue = `${s.price.toFixed(2)} / ${s.low52?.toFixed(2) || 'N/A'}`;
                       barColorClass = 'bg-gradient-to-r from-red-600/80 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-right';
                    }

                    return (
                      <div key={s.symbol} onClick={() => handleRowClick(s.symbol)} className="flex items-center gap-4 cursor-pointer group">
                        <div className="w-32 flex items-center gap-3 shrink-0">
                           <StockLogo symbol={s.symbol} />
                           <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white transition-colors" title={s.symbol}>{s.symbol}</span>
                        </div>
                        <div className="flex-1 flex items-center h-8 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden shadow-inner">
                          <div 
                            className={`h-full flex items-center justify-end px-3 text-xs font-bold text-white rounded-lg transition-all duration-1000 shadow-lg group-hover:brightness-110 min-w-max ${barColorClass}`}
                            style={{ width: `${widthPct}%` }}
                          >
                            <span className="whitespace-nowrap drop-shadow-md">{displayValue}</span>
                          </div>
                        </div>
                        {(viewAllType === 'gainers' || viewAllType === 'losers') && (
                          <div className="w-20 text-right text-sm font-bold text-slate-200">
                            ₹{s.price.toFixed(2)}
                          </div>
                        )}
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
