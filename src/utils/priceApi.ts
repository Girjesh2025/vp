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
  
  // If market is closed, show no change (previous close price)
  if (!isIndianMarketOpen()) {
    return {
      price: Number(basePrice.toFixed(2)),
      change: 0, // No change when market is closed
      previousClose: Number(basePrice.toFixed(2)),
    };
  }
  
  // Only show price changes when market is open
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
          previousClose: Number(prevClose.toFixed(2))
        };
      }
    } catch (_) {
    }
  }
  return null;
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
            previousClose: prevClose,
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