import type { PriceData } from '../types';

// Check if Indian stock market is open
const isIndianMarketOpen = (): boolean => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes
  
  // Market is closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:15 AM to 3:30 PM IST (555 minutes to 930 minutes)
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  return currentTime >= marketOpen && currentTime <= marketClose;
};

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

// EODHD API configuration
const EODHD_API_TOKEN = '68ded7adeebd01.04469623';
const EODHD_BASE_URL = 'https://eodhd.com/api/real-time';

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
        const open = meta.regularMarketOpen ?? close;
        const change = open ? ((close - open) / open) * 100 : 0;
        return {
          price: Number(close.toFixed(2)),
          change: Number(change.toFixed(2)),
          previousClose: Number((open || close).toFixed(2))
        };
      }
    } catch (_) {
    }
  }
  return null;
};

async function fetchEODHDPrice(symbol: string): Promise<number | null> {
  try {
    console.log(`🔍 [DEBUG] Fetching real-time price for ${symbol} via proxy...`);
    const baseUrl = resolveBaseUrl();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${baseUrl}/api/stock/${symbol}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    console.log(`🔍 [DEBUG] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ [DEBUG] Local proxy failed with status: ${response.status}`);
      return null;
    }
    
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Invalid content-type: ${ct}`);
    }
    const data = await response.json();
    console.log(`🔍 [DEBUG] Response data:`, data);
    
    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`✅ [DEBUG] Successfully fetched price for ${symbol}: ${data.close} via local proxy`);
      return data.close;
    } else {
      console.log(`❌ [DEBUG] Invalid data structure from local proxy for ${symbol}:`, data);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ [DEBUG] Local proxy failed for ${symbol}:`, error);
    return null;
  }
}

// Convert symbol to EODHD format
const toEODHDSymbol = (symbol: string): string => {
  // Remove existing suffixes if present
  const cleanSymbol = symbol.replace(/\.(NS|BO|NSE|BSE)$/, '');
  
  // Check if it's a US stock (common US symbols)
  const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
  
  if (usStocks.includes(cleanSymbol)) {
    // US stocks use .US suffix in EODHD
    return `${cleanSymbol}.US`;
  } else {
    // Default to NSE for Indian stocks
    return `${cleanSymbol}.NSE`;
  }
};

// Main function to fetch stock prices using local proxy server
export const fetchStockPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    console.log(`🚀 [DEBUG] fetchStockPrice called for symbol: ${symbol}`);
    const eodhSymbol = toEODHDSymbol(symbol);
    const baseUrl = resolveBaseUrl();
    console.log(`🔄 [DEBUG] Converted to EODHD symbol: ${eodhSymbol}`);
    
    // Use local proxy server instead of direct API calls
    const response = await fetch(`${baseUrl}/api/stock/${eodhSymbol}?source=yahoo`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Proxy server responded with status: ${response.status}`);
    }

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Invalid content-type: ${ct}`);
    }
    const data = await response.json();
    console.log(`🔍 [DEBUG] Proxy server response for ${symbol}:`, data);

    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`✅ [DEBUG] Successfully got real price for ${symbol}: ${data.close} from ${data.source}`);
      
      // Calculate change if we have previous close data
      const change = data.open && data.close ? ((data.close - data.open) / data.open) * 100 : 0;
      
      return {
        price: Number(data.close.toFixed(2)),
        change: Number(change.toFixed(2)),
        previousClose: data.open || data.close,
      };
    } else {
      throw new Error('Invalid data structure from proxy server');
    }
  } catch (error) {
    console.warn(`❌ [DEBUG] Failed to fetch real price for ${symbol}, using mock data:`, error);
    const yahooFallback = await fetchYahooViaProxy(symbol);
    if (yahooFallback) return yahooFallback;
    return getMockPrice(symbol);
  }
};