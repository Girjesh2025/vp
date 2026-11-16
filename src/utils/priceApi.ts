import type { PriceData } from '../types';

/**
 * Single source of truth for Indian stock market hours.
 * NSE/BSE: Mon–Fri, 9:15 AM – 3:30 PM IST.
 * Exported so all components share one implementation.
 */
export const isMarketOpen = (): boolean => {
  const now = new Date();
  
  const IST_OFFSET_MINUTES = 330; // UTC + 5:30
  const istTime = new Date(now.getTime() + IST_OFFSET_MINUTES * 60000);

  const day = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false; // Weekend

  // Format date as YYYY-MM-DD
  const yyyy = istTime.getUTCFullYear();
  const mm = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istTime.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // List of NSE Public Holidays (2024-2026)
  const holidays = [
    // 2024
    '2024-01-22', '2024-01-26', '2024-03-08', '2024-03-25', '2024-03-29', '2024-04-11', '2024-04-17', '2024-05-01', '2024-06-17', '2024-07-17', '2024-08-15', '2024-10-02', '2024-11-01', '2024-11-15', '2024-12-25',
    // 2025
    '2025-01-26', '2025-02-26', '2025-03-14', '2025-03-31', '2025-04-10', '2025-04-14', '2025-04-18', '2025-05-01', '2025-08-15', '2025-08-27', '2025-10-02', '2025-10-21', '2025-10-22', '2025-11-05', '2025-12-25',
    // 2026
    '2026-01-26', '2026-03-03', '2026-03-26', '2026-03-31', '2026-04-03', '2026-04-14', '2026-05-01', '2026-05-28', '2026-06-26', '2026-09-14', '2026-10-02', '2026-10-20', '2026-11-10', '2026-11-24', '2026-12-25'
  ];
  
  if (holidays.includes(dateStr)) return false;

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentTime = hours * 60 + minutes;
  
  const marketOpen  = 9 * 60 + 15;  // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return currentTime >= marketOpen && currentTime <= marketClose;
};


const resolveBaseUrl = (): string => {
  const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (typeof envBase === 'string' && envBase.trim().length > 0) {
    return envBase.replace(/\/+$/, '');
  }

  return '';
};

export const getApiBaseUrl = (): string => resolveBaseUrl();

// Check if a symbol is a global index or futures symbol (e.g. ^DJI, ^NSEI, YM=F)
const isGlobalOrIndexSymbol = (symbol: string): boolean => {
  // ^INDEX, futures/FX (=), or a non-Indian Yahoo exchange suffix such as DX-Y.NYB
  return symbol.startsWith('^') || symbol.includes('=') ||
    (/\.[A-Z]{1,4}$/i.test(symbol) && !/\.(NS|BO|NSE|BSE)$/i.test(symbol));
};

const YAHOO_SYMBOL_ALIASES: Record<string, string> = {
  SBI: 'SBIN',
  'L&T': 'LT',
  TATAMOTORS: 'TMCV',
};

const normalizeYahooBaseSymbol = (symbol: string): string => {
  const clean = symbol.replace(/\.(NS|BO|NSE|BSE)$/i, '');
  return YAHOO_SYMBOL_ALIASES[clean] ?? clean;
};

const toYahooSymbol = (symbol: string): string => {
  const clean = normalizeYahooBaseSymbol(symbol);
  if (/\.NSE$/i.test(symbol) || /\.NS$/i.test(symbol)) return `${clean}.NS`;
  if (/\.BSE$/i.test(symbol) || /\.BO$/i.test(symbol)) return `${clean}.BO`;
  
  // If it's a raw symbol without suffix and not a global index, intelligently guess
  if (!clean.includes('.') && !isGlobalOrIndexSymbol(clean)) {
    const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
    if (usStocks.includes(clean)) return clean; // US stocks don't need suffix on Yahoo
    return `${clean}.NS`; // Default Indian stocks to NSE
  }
  
  return clean;
};

const fetchDirectFallback = async (symbol: string): Promise<PriceData | null> => {
  const yahooSymbol = toYahooSymbol(symbol);
  try {
    const baseUrl = resolveBaseUrl();
    const targetUrl = `${baseUrl}/api/stock/${encodeURIComponent(yahooSymbol)}?source=yahoo`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const r = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (r.ok) {
      const data = await r.json();
      if (data && typeof data.close === 'number') {
        const close = data.close;
        const prevClose = data.previousClose ?? close;
        const change = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
        return {
          price: Number(close.toFixed(2)),
          change: Number(change.toFixed(2)),
          previousClose: data.previousClose !== undefined ? Number(data.previousClose.toFixed(2)) : undefined,
          open: typeof data.open === 'number' ? Number(data.open.toFixed(2)) : undefined,
          high: typeof data.high === 'number' ? Number(data.high.toFixed(2)) : undefined,
          low: typeof data.low === 'number' ? Number(data.low.toFixed(2)) : undefined,
          volume: typeof data.volume === 'number' ? data.volume : undefined,
          high52: data.high52 !== undefined ? Number(data.high52.toFixed(2)) : undefined,
          low52: data.low52 !== undefined ? Number(data.low52.toFixed(2)) : undefined,
        };
      }
    }
  } catch (e) {
    console.warn(`[Yahoo Fallback] Error fetching ${symbol}:`, e);
  }
  return null;
};

/**
 * Fetch real historical daily closing prices from Yahoo Finance.
 * Returns an array of numbers (oldest first, newest last).
 * Throws if no real data can be obtained — no mock fallback.
 */
export const fetchHistoricalPrices = async (symbol: string, days: number = 60): Promise<number[]> => {
  const yahooSymbol = symbol.startsWith('^') || symbol.includes('=') ? symbol : toYahooSymbol(symbol);

  // 1. Try our reliable backend proxy first
  try {
    const baseUrl = resolveBaseUrl();
    // We updated the /api/stock endpoint to handle historical data when ?historical=true
    const apiUrl = `${baseUrl}/api/stock/${encodeURIComponent(yahooSymbol)}?historical=true&range=6mo&interval=1d`;
    
    const r = await fetch(apiUrl);
    if (r.ok) {
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
        const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];
        
        if (validCloses.length >= 20) {
          const subset = validCloses.slice(-days);
          console.log(`✅ [Historical] Got ${subset.length} real prices for ${symbol} via backend proxy`);
          return subset;
        }
      }
    }
  } catch (e) {
    console.warn(`[Historical] Backend proxy failed for ${symbol}:`, e);
  }

  throw new Error(`fetchHistoricalPrices: Unable to obtain real historical data for ${symbol}.`);
};

export interface StockFundamentals {
  symbol: string;
  price: number;
  change: number;
  high52: number;
  low52: number;
  peRatio: number;
  pegRatio: number;
  roe: number;
  debtToEquity: number;
  growth: number;
}

export const fetchGuruFundamentals = async (symbols: string[]): Promise<Record<string, StockFundamentals>> => {
  try {
    const response = await fetch(`/api/fundamentals/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols })
    });
    if (!response.ok) throw new Error('Failed to fetch fundamentals');
    return await response.json();
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    return {};
  }
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
  
  // 1. Try our reliable backend proxy first
  try {
    const baseUrl = resolveBaseUrl();
    const apiUrl = `${baseUrl}/api/stock/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
    
    const r = await fetch(apiUrl);
    if (r.ok) {
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      // Never treat the proxy's synthetic fallback chart as real market data
      if (result && !result.meta?.synthetic) {
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
      }
    }
  } catch (e) {
    console.warn(`[OHLCV] Backend proxy failed for ${symbol}:`, e);
  }

  return [];
};

/**
 * Fetch real intraday prices for sparklines (1-day range, 5-minute interval).
 * Returns an array of numbers (oldest first, newest last).
 */
export const fetchIntradayPrices = async (symbol: string): Promise<number[]> => {
  const yahooSymbol = toYahooSymbol(symbol);
  const requestBases = isGlobalOrIndexSymbol(symbol) ? ['', resolveBaseUrl()].filter((v, i, arr) => arr.indexOf(v) === i) : [resolveBaseUrl()];
  
  // Use our backend proxy if available to avoid CORS/Cloudflare issues
  for (const baseUrl of requestBases) {
    try {
      const apiUrl = `${baseUrl}/api/stock/${encodeURIComponent(yahooSymbol)}?historical=true&range=1d&interval=5m`;
      
      const r = await fetch(apiUrl, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        if (result) {
          const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
          const validCloses = closes.filter((c: number | null) => typeof c === 'number' && c > 0) as number[];
          
          if (validCloses.length > 0) {
            return validCloses;
          }
        }
      }
    } catch (e) {
      console.warn(`[Intraday] Backend proxy failed for ${symbol}:`, e);
    }
  }

  return [];
};



// Convert to candidate symbols
const toEODHDSymbols = (symbol: string): string[] => {
  const cleanSymbol = normalizeYahooBaseSymbol(symbol);
  const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
  if (usStocks.includes(cleanSymbol)) return [`${cleanSymbol}.US`];
  
  // For Indian stocks, prioritize Yahoo Finance format since we default to Yahoo source
  return [`${cleanSymbol}.NS`, `${cleanSymbol}.BO`, `${cleanSymbol}.NSE`, `${cleanSymbol}.BSE`];
};

interface PriceCacheEntry {
  data: PriceData;
  timestamp: number;
}

const priceCache = new Map<string, PriceCacheEntry>();
const inFlightRequests = new Map<string, Promise<PriceData | null>>();
const PRICE_CACHE_TTL_MS = 15000; // 15 seconds fresh memory cache

// Main function to fetch stock prices with concurrency chunking (6 at a time)
export const fetchMultipleStockPrices = async (symbols: string[]): Promise<Record<string, PriceData>> => {
  const results: Record<string, PriceData> = {};
  const CHUNK_SIZE = 6;
  
  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    const chunk = symbols.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (symbol) => {
        const data = await fetchStockPrice(symbol);
        return { symbol, data };
      })
    );
    
    for (const res of chunkResults) {
      if (res.status === 'fulfilled' && res.value.data) {
        results[res.value.symbol] = res.value.data;
      }
    }
  }
  
  return results;
};

export const fetchStockPrice = async (symbol: string): Promise<PriceData | null> => {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL_MS) {
    return cached.data;
  }

  if (inFlightRequests.has(symbol)) {
    return inFlightRequests.get(symbol)!;
  }

  const requestPromise = (async (): Promise<PriceData | null> => {
    try {
      const baseUrl = resolveBaseUrl();
      const requestBases = isGlobalOrIndexSymbol(symbol) ? ['', baseUrl].filter((v, i, arr) => arr.indexOf(v) === i) : [baseUrl];

      // For global indices / futures, send the symbol directly to the proxy (URL-encoded)
      if (isGlobalOrIndexSymbol(symbol)) {
        for (const requestBase of requestBases) {
          try {
            const response = await fetch(`${requestBase}/api/stock/${encodeURIComponent(symbol)}?source=yahoo`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
              mode: 'cors'
            });
            if (response.ok) {
              const ct = response.headers.get('content-type') || '';
              if (ct.includes('application/json')) {
                const data = await response.json();
                if (data?.source === 'Mock Data') continue;
                if (data && typeof data.close === 'number' && data.close > 0) {
                  const prevClose = data.previousClose || data.open || data.close;
                  const change = prevClose ? ((data.close - prevClose) / prevClose) * 100 : 0;
                  const resData: PriceData = {
                    price: Number(data.close.toFixed(2)),
                    change: Number(change.toFixed(2)),
                    previousClose: data.previousClose !== undefined ? data.previousClose : undefined,
                    open: typeof data.open === 'number' ? Number(data.open.toFixed(2)) : undefined,
                    high: typeof data.high === 'number' ? Number(data.high.toFixed(2)) : undefined,
                    low: typeof data.low === 'number' ? Number(data.low.toFixed(2)) : undefined,
                    volume: typeof data.volume === 'number' ? data.volume : undefined,
                    high52: data.high52 !== undefined ? data.high52 : undefined,
                    low52: data.low52 !== undefined ? data.low52 : undefined,
                  };
                  priceCache.set(symbol, { data: resData, timestamp: Date.now() });
                  return resData;
                }
              }
            }
          } catch (err) {
            console.warn(`⚠️ [DEBUG] Direct proxy fetch failed for ${symbol}:`, err);
          }
        }

        // Fallback for global indices: try Yahoo via CORS proxies
        const yahooFallback = await fetchDirectFallback(symbol);
        if (yahooFallback) {
          priceCache.set(symbol, { data: yahooFallback, timestamp: Date.now() });
          return yahooFallback;
        }

        console.warn(`❌ [DEBUG] Unable to fetch authentic price for global symbol ${symbol}`);
        return null;
      }

      // For regular Indian / US stocks, use EODHD symbol conversion
      const candidates = toEODHDSymbols(symbol);
      
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
            const resData: PriceData = {
              price: Number(data.close.toFixed(2)),
              change: Number(change.toFixed(2)),
              previousClose: data.previousClose !== undefined ? data.previousClose : undefined,
              open: typeof data.open === 'number' ? Number(data.open.toFixed(2)) : undefined,
              high: typeof data.high === 'number' ? Number(data.high.toFixed(2)) : undefined,
              low: typeof data.low === 'number' ? Number(data.low.toFixed(2)) : undefined,
              volume: typeof data.volume === 'number' ? data.volume : undefined,
              high52: data.high52 !== undefined ? data.high52 : undefined,
              low52: data.low52 !== undefined ? data.low52 : undefined,
            };
            priceCache.set(symbol, { data: resData, timestamp: Date.now() });
            return resData;
          }
        } catch (_) {}
      }

      // Local proxy loop exhausted without returning — try Yahoo proxy directly
      const yahooFallback = await fetchDirectFallback(symbol);
      if (yahooFallback) {
        priceCache.set(symbol, { data: yahooFallback, timestamp: Date.now() });
        return yahooFallback;
      }

      // Fail gracefully instead of showing fake numbers
      return null;
    } catch (error) {
      console.warn(`❌ [DEBUG] Failed to fetch real price for ${symbol}:`, error);
      const yahooFallback = await fetchDirectFallback(symbol);
      if (yahooFallback) {
        priceCache.set(symbol, { data: yahooFallback, timestamp: Date.now() });
        return yahooFallback;
      }
      return null;
    } finally {
      inFlightRequests.delete(symbol);
    }
  })();

  inFlightRequests.set(symbol, requestPromise);
  return requestPromise;
};
