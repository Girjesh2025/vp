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

const stockCache: StockCache = {
  nse: [],
  bse: [],
  lastUpdated: 0,
  isLoading: false,
  apiAvailable: false
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Convert EODHD stock data to our StockInfo format
const convertEODHDToStockInfo = (eodhd_stock: any, exchange: 'NSE' | 'BSE'): StockInfo => {
  return {
    symbol: eodhd_stock.Code || eodhd_stock.Symbol,
    name: eodhd_stock.Name || eodhd_stock.Code,
    exchange: exchange,
    sector: eodhd_stock.Type || 'Unknown', // EODHD provides type/sector info
    isin: eodhd_stock.ISIN || undefined
  };
};

// Test API availability (CORS-friendly approach)
const testAPIAvailability = async (): Promise<boolean> => {
  const apiKey = import.meta.env.VITE_EODHD_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ EODHD API key not configured, using static database');
    return false;
  }

  try {
    // Try a simple API call to test connectivity
    const testUrl = `https://eodhd.com/api/real-time/AAPL.US?api_token=${apiKey}&fmt=json`;
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ EODHD API is available');
      return true;
    } else {
      console.warn('⚠️ EODHD API test failed, using static database');
      return false;
    }
  } catch (error) {
    console.warn('⚠️ EODHD API not accessible from browser (CORS), using static database:', error);
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
      return searchStaticStocks('', 2000); // Get all static stocks
    }
  }
  
  // Prevent multiple simultaneous API calls
  if (stockCache.isLoading) {
    // Wait for the current loading to complete
    while (stockCache.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return stockCache.apiAvailable ? [...stockCache.nse, ...stockCache.bse] : searchStaticStocks('', 2000);
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
      return searchStaticStocks('', 2000);
    }

    // If API is available, try to fetch data (this will likely fail due to CORS)
    console.log('🔄 Attempting to fetch live stock data...');
    
    // For now, we'll use static database as EODHD doesn't support CORS
    // In a production environment, you'd implement a backend proxy
    console.log('📚 Using static stock database (CORS limitation)');
    stockCache.lastUpdated = now;
    return searchStaticStocks('', 2000);
    
  } finally {
    stockCache.isLoading = false;
  }
};

// Dynamic search using EODHD API with fallback to static database
export const searchStocksDynamic = async (query: string): Promise<StockInfo[]> => {
  const apiKey = import.meta.env.VITE_EODHD_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ EODHD API key not configured, using static database');
    return searchStaticStocks(query, 20);
  }

  if (!query || query.trim().length < 2) {
    // Return popular stocks when no query or query too short
    return searchStaticStocks('', 15).filter(stock => 
      ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'LT', 'BHARTIARTL', 'HINDUNILVR', 'MARUTI', 'ASIANPAINT', 'SBIN', 'WIPRO', 'ONGC', 'TATAMOTORS', 'ADANIPORTS'].includes(stock.symbol)
    );
  }

  try {
    console.log('🔍 Searching stocks dynamically via EODHD API for:', query);
    
    // Search both NSE and BSE exchanges
    const searchPromises = [
      searchExchangeDynamic(query, 'NSE', apiKey),
      searchExchangeDynamic(query, 'BSE', apiKey)
    ];
    
    const results = await Promise.allSettled(searchPromises);
    const allResults: StockInfo[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        console.warn(`Search failed for ${index === 0 ? 'NSE' : 'BSE'}:`, result.reason);
      }
    });
    
    // Remove duplicates and limit results
    const uniqueResults = allResults.filter((stock, index, self) => 
      index === self.findIndex(s => s.symbol === stock.symbol)
    );
    
    // If API search returns results, use them; otherwise fallback to static
    if (uniqueResults.length > 0) {
      return uniqueResults.slice(0, 20);
    } else {
      console.log('No API results found, falling back to static database');
      return searchStaticStocks(query, 20);
    }
    
  } catch (error) {
    console.error('Error in dynamic search:', error);
    return searchStaticStocks(query, 20);
  }
};

// Helper function to search a specific exchange
const searchExchangeDynamic = async (query: string, exchange: 'NSE' | 'BSE', apiKey: string): Promise<StockInfo[]> => {
  const exchangeCode = exchange === 'NSE' ? 'NSE' : 'BSE';
  const url = `https://eodhd.com/api/search/${encodeURIComponent(query)}?api_token=${apiKey}&type=stock&exchange=${exchangeCode}&limit=10`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(stock => ({
        symbol: stock.Code || stock.Symbol,
        name: stock.Name || stock.Code,
        exchange: exchange,
        sector: stock.Type || 'Unknown',
        isin: stock.ISIN || undefined
      }));
    }
    
    return [];
  } catch (error) {
    console.warn(`Search failed for ${exchange}:`, error);
    return [];
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
      return searchStaticStocks('', 15).filter(stock => 
        ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'LT', 'BHARTIARTL', 'HINDUNILVR', 'MARUTI', 'ASIANPAINT', 'SBIN', 'WIPRO', 'ONGC', 'TATAMOTORS', 'ADANIPORTS'].includes(stock.symbol)
      );
    }
    
    return searchStaticStocks(query, 20);
  } catch (error) {
    console.error('Error in searchStocksAPI:', error);
    return searchStaticStocks(query, 20);
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