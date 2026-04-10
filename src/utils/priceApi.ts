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
  return [`${cleanSymbol}.NSE`, `${cleanSymbol}.BSE`];
};

// Check if a symbol is a global index or futures symbol (e.g. ^DJI, ^NSEI, YM=F)
// These must NOT be converted via toEODHDSymbols — send directly to proxy
const isGlobalOrIndexSymbol = (symbol: string): boolean => {
  return symbol.startsWith('^') || symbol.includes('=');
};

// Main function to fetch stock prices using local proxy server
export const fetchStockPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    console.log(`🚀 [DEBUG] fetchStockPrice called for symbol: ${symbol}`);
    const baseUrl = resolveBaseUrl();

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
              };
            }
          }
        }
      } catch (err) {
        console.warn(`⚠️ [DEBUG] Direct proxy fetch failed for ${symbol}:`, err);
      }

      // Fallback for global indices: try Yahoo via CORS proxies
      const yahooFallback = await fetchYahooViaProxy(symbol);
      if (yahooFallback) return yahooFallback;

      console.warn(`⚠️ [DEBUG] Using deterministic mock price for ${symbol}`);
      return getMockPrice(symbol);
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