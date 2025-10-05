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

async function fetchEODHDPrice(symbol: string): Promise<number | null> {
  try {
    console.log(`Fetching real-time price for ${symbol} via local proxy...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`http://localhost:3001/api/stock/${symbol}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`Local proxy failed with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`Successfully fetched price for ${symbol}: ${data.close} via local proxy`);
      return data.close;
    } else {
      console.log(`Invalid data structure from local proxy for ${symbol}:`, data);
      return null;
    }
    
  } catch (error) {
    console.log(`Local proxy failed for ${symbol}:`, error);
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

// Main function to fetch stock prices
export const fetchStockPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    const eodhSymbol = toEODHDSymbol(symbol);
    const price = await fetchEODHDPrice(eodhSymbol);
    
    if (price === null) {
      console.warn(`Failed to fetch real price for ${symbol}, using mock data`);
      return getMockPrice(symbol);
    }
    
    // Return simplified price data structure
    return {
      price: Number(price.toFixed(2)),
      change: 0, // Real-time change data would need additional API calls
      previousClose: price, // Simplified for now
    };
  } catch (error) {
    console.warn(`Failed to fetch real price for ${symbol}, using mock data:`, error);
    
    // Fallback to mock data if API fails
    return getMockPrice(symbol);
  }
};