import type { PriceData } from '../types';

/**
 * Single source of truth for Indian stock market hours.
 * NSE/BSE: Mon–Fri, 9:15 AM – 3:30 PM IST.
 * Exported so all components share one implementation.
 */
export const isMarketOpen = (): boolean => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));

  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false; // Weekend

  const currentTime = istTime.getHours() * 60 + istTime.getMinutes();
  const marketOpen  = 9 * 60 + 15;  // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return currentTime >= marketOpen && currentTime <= marketClose;
};

// Keep internal alias for backward compatibility within this file
const isIndianMarketOpen = isMarketOpen;

// Mock data for development when API is rate limited or fails
const getMockPrice = (symbol: string): PriceData => {
  // Use a seed based on symbol for consistent mock data
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed * 9301 + 49297) % 233280 / 233280; // Simple seeded random
  
  const basePrice = 100 + (random * 2000); // Price between 100-2100
  
  // Show price changes whether market is open or closed, so P&L doesn't disappear in the evening
  const changePercent = (random - 0.5) * 10; // Change between -5% to +5%
  const previousClose = basePrice / (1 + changePercent / 100);
  
  return {
    price: Number(basePrice.toFixed(2)),
    change: Number(changePercent.toFixed(2)),
    previousClose: Number(previousClose.toFixed(2)),
  };
};

// More reliable proxy services
const PROXY_SERVICES = [
  {
    name: 'allorigins',
    url: 'https://api.allorigins.win/get?url=',
    transform: (data: any) => JSON.parse(data.contents)
  },
  {
    name: 'codetabs',
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    transform: (data: any) => data
  },
  {
    name: 'thingproxy',
    url: 'https://thingproxy.freeboard.io/fetch/',
    transform: (data: any) => data
  }
];

const resolveBaseUrl = (): string => {
  const envBase = (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim())
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : '';
  if (envBase) return envBase;
  const isLocalHost = typeof window !== 'undefined' && (/^localhost$/i.test(window.location.hostname) || /^127\.0\.0\.1$/.test(window.location.hostname));
  if (isLocalHost) return 'http://localhost:3001';
  return '';
};

const toYahooSymbol = (symbol: string): string => {
  const clean = symbol.replace(/\.(NSE|BSE)$/i, '');
  if (/\.NSE$/i.test(symbol)) return `${clean}.NS`;
  if (/\.BSE$/i.test(symbol)) return `${clean}.BO`;
  return clean;
};

const fetchYahooViaProxy = async (symbol: string): Promise<PriceData | null> => {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${toYahooSymbol(symbol)}`;
  for (const p of PROXY_SERVICES) {
    try {
      const r = await fetch(`${p.url}${encodeURIComponent(yahooUrl)}`, { method: 'GET' });
      const raw = await r.json();
      const data = p.transform(raw);
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && (typeof meta.regularMarketPrice === 'number' || typeof meta.previousClose === 'number')) {
        const close = meta.regularMarketPrice ?? meta.previousClose ?? 0;
        const prevClose = meta.previousClose ?? close;
        const change = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
        return {
          price: Number(close.toFixed(2)),
          change: Number(change.toFixed(2)),
          previousClose: meta.previousClose !== undefined && meta.previousClose !== null ? Number(meta.previousClose.toFixed(2)) : undefined
        };
      }
    } catch (_) {
    }
  }
  return null;
};

/**
 * Fetch real historical daily closing prices from Yahoo Finance.
 * Returns an array of numbers (oldest first, newest last).
 * Throws if no real data can be obtained — no mock fallback.
 */
export const fetchHistoricalPrices = async (symbol: string, days: number = 60): Promise<number[]> => {
  const yahooSymbol = toYahooSymbol(symbol);

  // Build URL: 6-month range with 1-day interval gives ~120 trading days
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=6mo&interval=1d`;

  for (const p of PROXY_SERVICES) {
    try {
      const r = await fetch(`${p.url}${encodeURIComponent(yahooUrl)}`, { method: 'GET' });
      if (!r.ok) continue;
      const raw = await r.json();
      const data = p.transform(raw);
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
      // Filter out null/undefined/0 entries that Yahoo sometimes includes
      const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];

      if (validCloses.length >= 20) {
        // Return the most recent `days` prices with oldest first
        const subset = validCloses.slice(-days);
        console.log(`✅ [Historical] Got ${subset.length} real prices for ${symbol} via ${p.name}`);
        return subset;
      }
    } catch (e) {
      console.warn(`[Historical] ${p.name} failed for ${symbol}:`, e);
    }
  }

  throw new Error(`fetchHistoricalPrices: Unable to obtain real historical data for ${symbol}. All proxies failed.`);
};

/**
 * Fetch precisely 12-month historical performance for an index or stock using Yahoo's 1mo interval.
 * Outputs an array of 12 numbers representing MoM percentage changes.
 */
export const fetchMonthlySectorPerformance = async (symbol: string): Promise<number[]> => {
  // Sector indices in Yahoo often start with ^, e.g. ^CNXIT, so we don't transform them if they do
  const yahooSymbol = symbol.startsWith('^') ? symbol : toYahooSymbol(symbol);
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=18mo&interval=1mo`;

  for (const p of PROXY_SERVICES) {
    try {
      const r = await fetch(`${p.url}${encodeURIComponent(yahooUrl)}`, { method: 'GET' });
      if (!r.ok) continue;
      const raw = await r.json();
      const data = p.transform(raw);
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
      const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];

      if (validCloses.length >= 2) {
        // Calculate Month-over-Month variation percentages
        const monthlyChanges = [];
        for (let i = 1; i < validCloses.length; i++) {
           const change = ((validCloses[i] - validCloses[i-1]) / validCloses[i-1]) * 100;
           monthlyChanges.push(Number(change.toFixed(2)));
        }
        
        // Pad with zeros if we somehow got less than 12
        while (monthlyChanges.length < 12) {
          monthlyChanges.unshift(0);
        }
        
        return monthlyChanges.slice(-12);
      }
    } catch (e) {
      console.warn(`[Historical Monthly] ${p.name} failed for ${symbol}:`, e);
    }
  }
  
  return Array(12).fill(0);
};

// Convert to candidate symbols
const toEODHDSymbols = (symbol: string): string[] => {
  const cleanSymbol = symbol.replace(/\.(NS|BO|NSE|BSE)$/i, '');
  const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
  if (usStocks.includes(cleanSymbol)) return [`${cleanSymbol}.US`];
  return [`${cleanSymbol}.NSE`, `${cleanSymbol}.BSE`];
};

// Main function to fetch stock prices using local proxy server
export const fetchStockPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    console.log(`🚀 [DEBUG] fetchStockPrice called for symbol: ${symbol}`);
    const candidates = toEODHDSymbols(symbol);
    const baseUrl = resolveBaseUrl();
    console.log(`🔄 [DEBUG] Converted candidates: ${candidates.join(', ')}`);
    
    for (const cand of candidates) {
      try {
        const response = await fetch(`${baseUrl}/api/stock/${cand}?source=yahoo`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
        if (!response.ok) continue;
        const ct = response.headers.get('content-type') || '';
        if (!ct.includes('application/json')) continue;
        const data = await response.json();
        if (data && typeof data.close === 'number' && data.close > 0) {
          const prevClose = data.previousClose || data.open || data.close;
          const change = prevClose ? ((data.close - prevClose) / prevClose) * 100 : 0;
          return {
            price: Number(data.close.toFixed(2)),
            change: Number(change.toFixed(2)),
            previousClose: data.previousClose !== undefined ? data.previousClose : undefined,
          };
        }
      } catch (_) {}
    }

    // Local proxy loop exhausted without returning — try Yahoo proxy then deterministic mock
    console.warn(`⚠️ [DEBUG] All proxy candidates failed for ${symbol}, trying Yahoo fallback`);
    const yahooFallback = await fetchYahooViaProxy(symbol);
    if (yahooFallback) return yahooFallback;

    // Last resort: deterministic mock (seeded by symbol — consistent across renders)
    console.warn(`⚠️ [DEBUG] Using deterministic mock price for ${symbol}`);
    return getMockPrice(symbol);
  } catch (error) {
    console.warn(`❌ [DEBUG] Failed to fetch real price for ${symbol}, using mock data:`, error);
    const yahooFallback = await fetchYahooViaProxy(symbol);
    if (yahooFallback) return yahooFallback;
    return getMockPrice(symbol);
  }
};