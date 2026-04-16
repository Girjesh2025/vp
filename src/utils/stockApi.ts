import type { StockInfo } from '../stockDatabase';
import { searchStocks as searchStaticStocks, getStockBySymbol as getStaticStockBySymbol } from '../stockDatabase';

// Export the StockInfo type for use in other modules
export type { StockInfo };

// Cache for stock lists to avoid repeated API calls
interface StockCache {
  nse: StockInfo[];
  bse: StockInfo[];
  lastUpdated: number;
  isLoading: boolean;
  apiAvailable: boolean;
}

const resolveBaseUrl = (): string => {
  return '';
};

const stockCache: StockCache = {
  nse: [],
  bse: [],
  lastUpdated: 0,
  isLoading: false,
  apiAvailable: false
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Test API availability (CORS-friendly approach)
const testAPIAvailability = async (): Promise<boolean> => {
  try {
    const baseUrl = resolveBaseUrl();
    const testUrl = baseUrl ? `${baseUrl}/api/health` : '/api/health';
    const response = await fetch(testUrl);
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend API not accessible:', error);
    return false;
  }
};

// Get all stocks with intelligent fallback
export const getAllStocks = async (): Promise<StockInfo[]> => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (stockCache.lastUpdated && (now - stockCache.lastUpdated) < CACHE_DURATION) {
    if (stockCache.apiAvailable) {
      return [...stockCache.nse, ...stockCache.bse];
    } else {
      // Return static database stocks
      return searchStaticStocks(''); 
    }
  }
  
  // Prevent multiple simultaneous API calls
  if (stockCache.isLoading) {
    // Wait for the current loading to complete
    while (stockCache.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return stockCache.apiAvailable ? [...stockCache.nse, ...stockCache.bse] : searchStaticStocks('');
  }
  
  stockCache.isLoading = true;
  
  try {
    // Test if API is available
    const apiAvailable = await testAPIAvailability();
    stockCache.apiAvailable = apiAvailable;
    
    if (!apiAvailable) {
      // Use static database
      console.log('📚 Using static stock database (API not available)');
      stockCache.lastUpdated = now;
      return searchStaticStocks('');
    }

    // We now have a proxy server to bypass CORS.
    // However, getting ALL LIVE STOCKS is too expensive.
    // So for "get all stocks", we still return the local database.
    stockCache.lastUpdated = now;
    return searchStaticStocks('');
    
  } finally {
    stockCache.isLoading = false;
  }
};

// Dynamic search using Proxy API with fallback to static database
export const searchStocksDynamic = async (query: string): Promise<StockInfo[]> => {
  if (!query || query.trim().length < 2) {
    // Return popular stocks when no query or query too short
    return searchStaticStocks('').filter(stock => 
      ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'LT', 'BHARTIARTL', 'HINDUNILVR', 'MARUTI', 'ASIANPAINT', 'SBIN', 'WIPRO', 'ONGC', 'TATAMOTORS', 'ADANIPORTS'].includes(stock.symbol)
    );
  }

  try {
    console.log('🔍 Searching stocks dynamically via Proxy API for:', query);
    
    const baseUrl = resolveBaseUrl();
    const url = baseUrl ? `${baseUrl}/api/search?q=${encodeURIComponent(query)}` : `/api/search?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const results: StockInfo[] = await response.json();
      if (results && results.length > 0) {
        return results;
      }
    }
    
    console.log('No API results found, falling back to static database');
    return searchStaticStocks(query);
    
  } catch (error) {
    console.error('Error in dynamic search:', error);
    return searchStaticStocks(query);
  }
};

// Search stocks with intelligent fallback (keeping original for compatibility)
export const searchStocksAPI = async (query: string): Promise<StockInfo[]> => {
  try {
    // For now, use static database due to CORS limitations
    // In production, implement a backend proxy for EODHD API
    console.log('🔍 Searching stocks using static database');
    
    if (!query || query.length < 1) {
      // Return popular stocks when no query
      return searchStaticStocks('').filter(stock => 
        ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'LT', 'BHARTIARTL', 'HINDUNILVR', 'MARUTI', 'ASIANPAINT', 'SBIN', 'WIPRO', 'ONGC', 'TATAMOTORS', 'ADANIPORTS'].includes(stock.symbol)
      );
    }
    
    return searchStaticStocks(query);
  } catch (error) {
    console.error('Error in searchStocksAPI:', error);
    return searchStaticStocks(query);
  }
};

// Get stock by symbol with API validation
export const getStockBySymbolAPI = async (symbol: string): Promise<StockInfo | null> => {
  try {
    // For now, use static database due to CORS limitations
    return getStaticStockBySymbol(symbol) || null;
  } catch (error) {
    console.error('Error in getStockBySymbolAPI:', error);
    return getStaticStockBySymbol(symbol) || null;
  }
};

// Get stocks by exchange
export const getStocksByExchangeAPI = async (exchange: 'NSE' | 'BSE'): Promise<StockInfo[]> => {
  const allStocks = await getAllStocks();
  return allStocks.filter(stock => stock.exchange === exchange);
};

// Clear cache (useful for debugging or manual refresh)
export const clearStockCache = () => {
  stockCache.nse = [];
  stockCache.bse = [];
  stockCache.lastUpdated = 0;
  stockCache.isLoading = false;
  stockCache.apiAvailable = false;
  console.log('Stock cache cleared');
};