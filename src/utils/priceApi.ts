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
    name: 'vite-proxy',
    url: '/api/yahoo/',
    transform: (data: any) => data
  },
  {
    name: 'corsproxy',
    url: 'https://corsproxy.io/?',
    transform: (data: any) => data
  },
  {
    name: 'allorigins',
    url: 'https://api.allorigins.win/get?url=',
    transform: (data: any) => JSON.parse(data.contents)
  },
  {
    name: 'codetabs',
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    transform: (data: any) => data
  }
];

const resolveBaseUrl = (): string => {
  try {
    const envBase = (import.meta?.env?.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim())
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : '';
    if (envBase) return envBase;
  } catch (e) {}
  
  // In development, hit the Vite dev server which proxies to 3001
  const isLocalHost = typeof window !== 'undefined' && (/^localhost$/i.test(window.location.hostname) || /^127\.0\.0\.1$/.test(window.location.hostname));
  if (isLocalHost) return ''; // Empty string means it will hit the current origin (Vite dev server)
  
  return '';
};

const getBrokerPreference = () => {
  try {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('pp_user_id') : null;
    const dataSource = typeof window !== 'undefined' ? localStorage.getItem('pp_data_source') : null;
    const broker = typeof window !== 'undefined' ? localStorage.getItem('pp_broker') : null;
    return { userId, dataSource, broker };
  } catch (e) {
    return { userId: null, dataSource: null, broker: null };
  }
};

const toZerodhaInstrument = (symbol: string): string | null => {
  const clean = symbol.replace(/\.(NS|BO|NSE|BSE)$/i, '');
  if (isGlobalOrIndexSymbol(clean)) return null;
  const isBse = /\.BSE$/i.test(symbol) || /\.BO$/i.test(symbol);
  const exchange = isBse ? 'BSE' : 'NSE';
  return `${exchange}:${clean}`;
};

const toFyersSymbol = (symbol: string): string | null => {
  const clean = symbol.replace(/\.(NS|BO|NSE|BSE)$/i, '');
  if (isGlobalOrIndexSymbol(clean)) return null;
  const isBse = /\.BSE$/i.test(symbol) || /\.BO$/i.test(symbol);
  const exchange = isBse ? 'BSE' : 'NSE';
  return `${exchange}:${clean}-EQ`;
};

const parseFyersLtp = (payload: any, fyersSymbol: string): number | null => {
  if (!payload) return null;
  if (payload.s === 'ok') {
    const d = payload.d;
    if (Array.isArray(d)) {
      const row = d.find((x: any) => x?.n === fyersSymbol) ?? d[0];
      const lp = row?.v?.lp ?? row?.v?.ltp ?? row?.v?.last_price ?? row?.v?.lastPrice;
      if (typeof lp === 'number' && lp > 0) return lp;
    }
  }
  const lp = payload?.lp ?? payload?.ltp ?? payload?.last_price ?? payload?.data?.lp;
  if (typeof lp === 'number' && lp > 0) return lp;
  return null;
};

const fetchBrokerPrice = async (symbol: string): Promise<PriceData | null> => {
  const { userId, dataSource, broker } = getBrokerPreference();
  if (!userId || dataSource !== 'broker') return null;
  const baseUrl = resolveBaseUrl();

  if (broker === 'fyers') {
    const fyersSymbol = toFyersSymbol(symbol);
    if (!fyersSymbol) return null;
    const url = `${baseUrl}/api/broker/fyers/quotes?userId=${encodeURIComponent(userId)}&symbols=${encodeURIComponent(fyersSymbol)}`;
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    const ltp = parseFyersLtp(data, fyersSymbol);
    if (typeof ltp !== 'number' || ltp <= 0) return null;
    return { price: Number(ltp.toFixed(2)), change: 0 };
  }

  const instrument = toZerodhaInstrument(symbol);
  if (!instrument) return null;
  const url = `${baseUrl}/api/broker/zerodha/ltp?userId=${encodeURIComponent(userId)}&instrument=${encodeURIComponent(instrument)}`;
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) return null;
  const data = await r.json().catch(() => null);
  const key = data?.data ? Object.keys(data.data)[0] : null;
  const ltp = key ? data.data[key]?.last_price : null;
  if (typeof ltp !== 'number' || ltp <= 0) return null;
  return { price: Number(ltp.toFixed(2)), change: 0 };
};

// Check if a symbol is a global index or futures symbol (e.g. ^DJI, ^NSEI, YM=F)
// These must NOT be converted via toEODHDSymbols — send directly to proxy
const isGlobalOrIndexSymbol = (symbol: string): boolean => {
  return symbol.startsWith('^') || symbol.includes('=');
};

const toYahooSymbol = (symbol: string): string => {
  const clean = symbol.replace(/\.(NSE|BSE)$/i, '');
  if (/\.NSE$/i.test(symbol)) return `${clean}.NS`;
  if (/\.BSE$/i.test(symbol)) return `${clean}.BO`;
  
  // If it's a raw symbol without suffix and not a global index, intelligently guess
  if (!clean.includes('.') && !isGlobalOrIndexSymbol(clean)) {
    const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
    if (usStocks.includes(clean)) return clean; // US stocks don't need suffix on Yahoo
    return `${clean}.NS`; // Default Indian stocks to NSE
  }
  
  return clean;
};

const fetchDirectFallback = async (symbol: string): Promise<PriceData | null> => {
  // First try EODHD if it's a regular stock
  if (!isGlobalOrIndexSymbol(symbol)) {
    const candidates = toEODHDSymbols(symbol);
    for (const cand of candidates) {
      try {
        const url = `https://eodhd.com/api/real-time/${cand}?api_token=68ded7adeebd01.04469623&fmt=json`;
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          if (data && typeof data.close === 'number' && data.close > 0) {
            const prevClose = data.previousClose || data.open || data.close;
            const change = prevClose ? ((data.close - prevClose) / prevClose) * 100 : 0;
            return {
              price: Number(data.close.toFixed(2)),
              change: Number(change.toFixed(2)),
              previousClose: data.previousClose !== undefined ? data.previousClose : undefined,
            };
          }
        }
      } catch (e) {
        console.warn(`[EODHD Fallback] Failed for ${cand}:`, e);
      }
    }
  }

  // Then try Yahoo via our Vite proxy or other proxies
  const yahooSymbol = toYahooSymbol(symbol);
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
  for (const p of PROXY_SERVICES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per proxy
      
      const queryPart = yahooUrl.includes('?') ? yahooUrl.substring(yahooUrl.indexOf('?')) : '';
      const targetUrl = p.name === 'vite-proxy' 
        ? `${p.url}${yahooSymbol}${queryPart}` 
        : `${p.url}${encodeURIComponent(yahooUrl)}`;

      const r = await fetch(targetUrl, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!r.ok) continue;
      
      let raw;
      if (p.name === 'allorigins') {
         const json = await r.json();
         raw = JSON.parse(json.contents);
      } else {
         raw = await r.json();
      }
      
        const data = p.transform ? p.transform(raw) : raw;
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta && (typeof meta.regularMarketPrice === 'number' || typeof meta.previousClose === 'number')) {
          const close = meta.regularMarketPrice ?? meta.previousClose ?? 0;
          const prevClose = meta.previousClose ?? close;
          const change = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
          return {
            price: Number(close.toFixed(2)),
            change: Number(change.toFixed(2)),
            previousClose: meta.previousClose !== undefined && meta.previousClose !== null ? Number(meta.previousClose.toFixed(2)) : undefined,
            high52: meta.fiftyTwoWeekHigh !== undefined ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
            low52: meta.fiftyTwoWeekLow !== undefined ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined
          };
        }
    } catch (e) {
      console.warn(`[Yahoo Fallback] Error using proxy ${p.name}:`, e);
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
      const queryPart = yahooUrl.includes('?') ? yahooUrl.substring(yahooUrl.indexOf('?')) : '';
      const targetUrl = p.name === 'vite-proxy' 
        ? `${p.url}${yahooSymbol}${queryPart}` 
        : `${p.url}${encodeURIComponent(yahooUrl)}`;

      const r = await fetch(targetUrl, { method: 'GET' });
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

export interface YahooOHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const fetchHistoricalOHLCV = async (
  symbol: string,
  opts?: { range?: string; interval?: string; bars?: number }
): Promise<YahooOHLCVBar[]> => {
  const range = opts?.range ?? '6mo';
  const interval = opts?.interval ?? '1d';
  const bars = opts?.bars;

  const yahooSymbol = symbol.startsWith('^') || symbol.includes('=') ? symbol : toYahooSymbol(symbol);
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  for (const p of PROXY_SERVICES) {
    try {
      const queryPart = yahooUrl.includes('?') ? yahooUrl.substring(yahooUrl.indexOf('?')) : '';
      const targetUrl = p.name === 'vite-proxy'
        ? `${p.url}${yahooSymbol}${queryPart}`
        : `${p.url}${encodeURIComponent(yahooUrl)}`;

      const r = await fetch(targetUrl, { method: 'GET' });
      if (!r.ok) continue;
      const raw = await r.json();
      const data = p.transform(raw);
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const timestamps: number[] = result.timestamp ?? [];
      const quote = result.indicators?.quote?.[0];
      const opens: Array<number | null> = quote?.open ?? [];
      const highs: Array<number | null> = quote?.high ?? [];
      const lows: Array<number | null> = quote?.low ?? [];
      const closes: Array<number | null> = quote?.close ?? [];
      const volumes: Array<number | null> = quote?.volume ?? [];

      const out: YahooOHLCVBar[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const open = opens[i];
        const high = highs[i];
        const low = lows[i];
        const close = closes[i];
        const volume = volumes[i];

        if (
          typeof open !== 'number' || open <= 0 ||
          typeof high !== 'number' || high <= 0 ||
          typeof low !== 'number' || low <= 0 ||
          typeof close !== 'number' || close <= 0
        ) continue;

        out.push({
          timestamp: timestamps[i],
          open,
          high,
          low,
          close,
          volume: typeof volume === 'number' && volume >= 0 ? volume : 0,
        });
      }

      if (out.length >= 10) {
        const sliced = typeof bars === 'number' ? out.slice(-bars) : out;
        return sliced;
      }
    } catch (e) {
      console.warn(`[OHLCV] ${p.name} failed for ${symbol}:`, e);
    }
  }

  throw new Error(`fetchHistoricalOHLCV: Unable to obtain OHLCV data for ${symbol}. All proxies failed.`);
};

/**
 * Fetch real intraday prices for sparklines (1-day range, 5-minute interval).
 * Returns an array of numbers (oldest first, newest last).
 */
export const fetchIntradayPrices = async (symbol: string): Promise<number[]> => {
  const yahooSymbol = toYahooSymbol(symbol);
  
  // Use our backend proxy if available to avoid CORS/Cloudflare issues
  try {
    const baseUrl = resolveBaseUrl();
    const apiUrl = `${baseUrl}/api/historical/${encodeURIComponent(yahooSymbol)}?range=1d&interval=5m`;
    
    const r = await fetch(apiUrl);
    if (r.ok) {
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
        const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];
        
        if (validCloses.length > 0) {
          console.log(`✅ [Intraday] Got ${validCloses.length} data points for ${symbol} via backend proxy`);
          return validCloses;
        }
      }
    }
  } catch (e) {
    console.warn(`[Intraday] Backend proxy failed for ${symbol}:`, e);
  }

  // Fallback to PROXY_SERVICES
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=5m`;
  for (const p of PROXY_SERVICES) {
    try {
      const queryPart = yahooUrl.includes('?') ? yahooUrl.substring(yahooUrl.indexOf('?')) : '';
      const targetUrl = p.name === 'vite-proxy' 
        ? `${p.url}${yahooSymbol}${queryPart}` 
        : `${p.url}${encodeURIComponent(yahooUrl)}`;

      const r = await fetch(targetUrl, { method: 'GET' });
      if (!r.ok) continue;
      
      let raw;
      // Handle different proxy response formats
      if (p.name === 'allorigins') {
         const json = await r.json();
         raw = JSON.parse(json.contents);
      } else {
         raw = await r.json();
      }
      
      const result = raw?.chart?.result?.[0];
      if (!result) continue;

      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
      const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];

      if (validCloses.length > 0) {
        console.log(`✅ [Intraday] Got ${validCloses.length} data points for ${symbol} via ${p.name}`);
        return validCloses;
      }
    } catch (e) {
      console.warn(`[Intraday] ${p.name} failed for ${symbol}:`, e);
    }
  }

  throw new Error(`fetchIntradayPrices: Unable to obtain intraday data for ${symbol}. All proxies failed.`);
};

/**
 * Fetch precisely 12-month historical performance for an index or stock using Yahoo's 1mo interval.
 * Outputs an array of 12 numbers representing MoM percentage changes.
 */
export const fetchMonthlySectorPerformance = async (symbol: string): Promise<number[]> => {
  const yahooSymbol = symbol.startsWith('^') ? symbol : toYahooSymbol(symbol);
  
  try {
    const baseUrl = resolveBaseUrl();
    // Use the backend proxy (which avoids all CORS / Cloudflare blocking from external proxies)
    const apiUrl = `${baseUrl}/api/historical/${encodeURIComponent(yahooSymbol)}?range=18mo&interval=1mo`;
    
    const r = await fetch(apiUrl);
    if (!r.ok) throw new Error(`Proxy historical API failed with status ${r.status}`);
    
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (result) {
      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
      const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];

      if (validCloses.length >= 2) {
        const monthlyChanges = [];
        for (let i = 1; i < validCloses.length; i++) {
           const change = ((validCloses[i] - validCloses[i-1]) / validCloses[i-1]) * 100;
           monthlyChanges.push(Number(change.toFixed(2)));
        }
        while (monthlyChanges.length < 12) {
          monthlyChanges.unshift(0);
        }
        return monthlyChanges.slice(-12);
      }
    }
  } catch (e) {
    console.warn(`[Historical Monthly] Proxy failed for ${symbol}:`, e);
  }
  
  return Array(12).fill(0);
};

/**
 * Fetch 2 years of monthly raw close prices + timestamps for a sector index.
 * Use this to build calendar-year heatmaps without re-fetching on year change.
 */
export interface SectorRawMonthly {
  timestamps: number[];
  closes: number[];
}

export const fetchSectorRawMonthly = async (symbol: string): Promise<SectorRawMonthly> => {
  const yahooSymbol = symbol.startsWith('^') ? symbol : toYahooSymbol(symbol);

  // Helper: aggregate daily closes → last close of each month
  const aggregateToMonthly = (ts: number[], rawCloses: (number | null)[]): SectorRawMonthly => {
    // Map: "YYYY-M" → { timestamp of last day in month, last close }
    const monthMap = new Map<string, { timestamp: number; close: number }>();
    for (let i = 0; i < ts.length; i++) {
      const close = rawCloses[i];
      if (typeof close !== 'number' || close <= 0) continue;
      const d = new Date(ts[i] * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      // Keep updating so the last entry in each month wins
      monthMap.set(key, { timestamp: ts[i], close });
    }
    const sorted = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
    return {
      timestamps: sorted.map(e => e.timestamp),
      closes:     sorted.map(e => e.close),
    };
  };

  try {
    const baseUrl = resolveBaseUrl();

    // 1️⃣ Try daily data first — gives full coverage even for newer index symbols
    const dailyUrl = `${baseUrl}/api/historical/${encodeURIComponent(yahooSymbol)}?range=3y&interval=1d`;
    const rd = await fetch(dailyUrl);
    if (rd.ok) {
      const data = await rd.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const ts: number[] = result.timestamp ?? [];
        const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
        const agg = aggregateToMonthly(ts, rawCloses);
        if (agg.timestamps.length >= 12) {
          console.log(`✅ [RawMonthly] ${symbol}: ${agg.timestamps.length} months from daily data`);
          return agg;
        }
      }
    }

    // 2️⃣ Fallback to monthly interval (faster, but shorter history for some symbols)
    const moUrl = `${baseUrl}/api/historical/${encodeURIComponent(yahooSymbol)}?range=3y&interval=1mo`;
    const rm = await fetch(moUrl);
    if (rm.ok) {
      const data = await rm.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const timestamps: number[] = result.timestamp ?? [];
        const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
        const closes = rawCloses.map((c: number | null) => (typeof c === 'number' && c > 0 ? c : 0));
        if (timestamps.length >= 2) {
          console.log(`✅ [RawMonthly] ${symbol}: ${timestamps.length} months from monthly interval`);
          return { timestamps, closes };
        }
      }
    }
  } catch (e) {
    console.warn(`[Raw Monthly] Failed for ${symbol}:`, e);
  }

  // 3️⃣ Seeded mock fallback — deterministic per symbol, covers 3 full years
  console.warn(`⚠️ [RawMonthly] Using mock data for ${symbol}`);
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const timestamps: number[] = [];
  const closes: number[] = [];
  let price = 10000 + (seed % 10000);
  const now = Math.floor(Date.now() / 1000);
  for (let i = 35; i >= 0; i--) {
    const rng = ((seed * 9301 + i * 49297 + 233280) % 233280) / 233280;
    price = price * (1 + (rng - 0.5) * 0.06);
    timestamps.push(now - i * 30 * 86400);
    closes.push(Math.round(price));
  }
  return { timestamps, closes };
};

// Convert to candidate symbols
const toEODHDSymbols = (symbol: string): string[] => {
  const cleanSymbol = symbol.replace(/\.(NS|BO|NSE|BSE)$/i, '');
  const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
  if (usStocks.includes(cleanSymbol)) return [`${cleanSymbol}.US`];
  
  // For Indian stocks, prioritize Yahoo Finance format since we default to Yahoo source
  return [`${cleanSymbol}.NS`, `${cleanSymbol}.BO`, `${cleanSymbol}.NSE`, `${cleanSymbol}.BSE`];
};

// Main function to fetch stock prices using local proxy server
export const fetchMultipleStockPrices = async (symbols: string[]): Promise<Record<string, PriceData>> => {
  const { userId, dataSource, broker } = getBrokerPreference();
  const results: Record<string, PriceData> = {};
  
  if (userId && dataSource === 'broker' && broker === 'fyers' && symbols.length > 0) {
    const baseUrl = resolveBaseUrl();
    const validSymbols = symbols.map(s => ({ original: s, fyers: toFyersSymbol(s) })).filter(s => s.fyers);
    
    // We will batch Fyers requests in chunks of 10 to prevent any single invalid symbol from failing a massive batch
    // and to ensure we don't hit URL length or undocumented API limits.
    const fyersBatchSize = 10;
    
    // Fetch 52-week data from our custom NSE proxy endpoint for all Nifty 500 stocks
    let nseHighLowData: Record<string, { high52: number, low52: number }> = {};
    try {
      const nseUrl = `${baseUrl}/api/nse/highlow`;
      const nseRes = await fetch(nseUrl);
      if (nseRes.ok) {
        nseHighLowData = await nseRes.json();
      }
    } catch (e) {
      console.warn('Failed to fetch NSE high/low data', e);
    }
    
    for (let i = 0; i < validSymbols.length; i += fyersBatchSize) {
      const batch = validSymbols.slice(i, i + fyersBatchSize);
      const fyersSymbolsStr = batch.map(s => s.fyers).join(',');
      
      try {
        const url = `${baseUrl}/api/broker/fyers/quotes?userId=${encodeURIComponent(userId)}&symbols=${encodeURIComponent(fyersSymbolsStr)}`;
        const r = await fetch(url, { method: 'GET' });
        
        if (r.ok) {
          const data = await r.json().catch(() => null);
          if (data && data.d && Array.isArray(data.d)) {
            data.d.forEach((item: any) => {
              if (item.v && item.v.lp) {
                const fSymbol = item.n; 
                const original = batch.find(s => s.fyers === fSymbol)?.original;
                if (original) {
                  // Attach 52-week high/low from NSE cache if available
                  const cleanSym = original.replace(/\.NS$/, '');
                  const hl = nseHighLowData[cleanSym];
                  
                  results[original] = { 
                    price: Number(item.v.lp.toFixed(2)), 
                    change: item.v.chp || 0,
                    high52: hl?.high52,
                    low52: hl?.low52
                  };
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch batch from Fyers', e);
      }
    }
    
    // If we are in Fyers broker mode, we never want to fallback to Yahoo/EODHD for massive batch requests
    // because firing 50+ individual requests will instantly trigger 429 Too Many Requests rate limits.
    return results;
  }

  // Fallback: fetch individually (only if NOT in broker mode)
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const data = await fetchStockPrice(symbol);
      if (data) {
        results[symbol] = data;
      }
    })
  );
  
  return results;
};

export const fetchStockPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    console.log(`🚀 [DEBUG] fetchStockPrice called for symbol: ${symbol}`);
    const baseUrl = resolveBaseUrl();

    const brokerPrice = await fetchBrokerPrice(symbol);
    if (brokerPrice) return brokerPrice;

    // For global indices / futures, send the symbol directly to the proxy (URL-encoded)
    if (isGlobalOrIndexSymbol(symbol)) {
      console.log(`🌍 [DEBUG] Global/index symbol detected: ${symbol}, sending directly to proxy`);
      try {
        const response = await fetch(`${baseUrl}/api/stock/${encodeURIComponent(symbol)}?source=yahoo`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
        if (response.ok) {
          const ct = response.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await response.json();
            if (data && typeof data.close === 'number' && data.close > 0) {
              const prevClose = data.previousClose || data.open || data.close;
              const change = prevClose ? ((data.close - prevClose) / prevClose) * 100 : 0;
              return {
                price: Number(data.close.toFixed(2)),
                change: Number(change.toFixed(2)),
                previousClose: data.previousClose !== undefined ? data.previousClose : undefined,
                high52: data.high52 !== undefined ? data.high52 : undefined,
                low52: data.low52 !== undefined ? data.low52 : undefined,
              };
            }
          }
        }
      } catch (err) {
        console.warn(`⚠️ [DEBUG] Direct proxy fetch failed for ${symbol}:`, err);
      }

      // Fallback for global indices: try Yahoo via CORS proxies
      const yahooFallback = await fetchDirectFallback(symbol);
      if (yahooFallback) return yahooFallback;

      console.warn(`❌ [DEBUG] Unable to fetch authentic price for global symbol ${symbol}`);
      return null;
    }

    // For regular Indian / US stocks, use EODHD symbol conversion
    const candidates = toEODHDSymbols(symbol);
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
            high52: data.high52 !== undefined ? data.high52 : undefined,
            low52: data.low52 !== undefined ? data.low52 : undefined,
          };
        }
      } catch (_) {}
    }

    // Local proxy loop exhausted without returning — try Yahoo proxy directly
    console.warn(`⚠️ [DEBUG] All proxy candidates failed for ${symbol}, trying Yahoo fallback`);
    const yahooFallback = await fetchDirectFallback(symbol);
    if (yahooFallback) return yahooFallback;

    // Fail gracefully instead of showing fake numbers
    console.warn(`❌ [DEBUG] Could not fetch authentic data for ${symbol}`);
    return null;
  } catch (error) {
    console.warn(`❌ [DEBUG] Failed to fetch real price for ${symbol}:`, error);
    const yahooFallback = await fetchDirectFallback(symbol);
    if (yahooFallback) return yahooFallback;
    return null;
  }
};
