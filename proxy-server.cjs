const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// API Configuration
const API_SOURCES = {
  YAHOO: 'yahoo',
  ALPHA_VANTAGE: 'alpha_vantage',
  FINNHUB: 'finnhub',
  EODHD: 'eodhd'
};

// API Keys (replace with your own)
const API_KEYS = {
  ALPHA_VANTAGE: 'demo', // Get free key from alphavantage.co
  FINNHUB: 'demo', // Get free key from finnhub.io
  EODHD: '68ded7adeebd01.04469623'
};

// Convert symbol format for different APIs
function formatSymbolForAPI(symbol, apiSource) {
  // Remove .NSE, .BSE suffixes for most APIs
  const cleanSymbol = symbol.replace(/\.(NSE|BSE)$/, '');
  
  switch (apiSource) {
    case API_SOURCES.YAHOO:
      // Yahoo Finance uses .NS for NSE, .BO for BSE
      if (symbol.includes('.NSE')) return `${cleanSymbol}.NS`;
      if (symbol.includes('.BSE')) return `${cleanSymbol}.BO`;
      return cleanSymbol;
    case API_SOURCES.ALPHA_VANTAGE:
    case API_SOURCES.FINNHUB:
      return cleanSymbol;
    case API_SOURCES.EODHD:
      return symbol; // Keep original format
    default:
      return cleanSymbol;
  }
}

// Fetch from Yahoo Finance (Free, no API key needed)
async function fetchFromYahoo(symbol) {
  const formattedSymbol = formatSymbolForAPI(symbol, API_SOURCES.YAHOO);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}`;
  
  console.log(`Fetching ${symbol} from Yahoo Finance...`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance responded with status: ${response.status}`);
  }
  
  const data = await response.json();
  const result = data.chart?.result?.[0];
  
  if (!result || !result.meta) {
    throw new Error('Invalid data from Yahoo Finance');
  }
  
  return {
    close: result.meta.regularMarketPrice || result.meta.previousClose,
    open: result.meta.regularMarketOpen,
    high: result.meta.regularMarketDayHigh,
    low: result.meta.regularMarketDayLow,
    volume: result.meta.regularMarketVolume,
    source: 'Yahoo Finance'
  };
}

// Fetch from Alpha Vantage (Free: 5 calls/minute)
async function fetchFromAlphaVantage(symbol) {
  const formattedSymbol = formatSymbolForAPI(symbol, API_SOURCES.ALPHA_VANTAGE);
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
  
  console.log(`Fetching ${symbol} from Alpha Vantage...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage responded with status: ${response.status}`);
  }
  
  const data = await response.json();
  const quote = data['Global Quote'];
  
  if (!quote || !quote['05. price']) {
    throw new Error('Invalid data from Alpha Vantage');
  }
  
  return {
    close: parseFloat(quote['05. price']),
    open: parseFloat(quote['02. open']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    volume: parseInt(quote['06. volume']),
    source: 'Alpha Vantage'
  };
}

// Fetch from EODHD (Original API)
async function fetchFromEODHD(symbol) {
  const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${API_KEYS.EODHD}&fmt=json`;
  
  console.log(`Fetching ${symbol} from EODHD...`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Stock Portfolio App/1.0',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`EODHD API responded with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data || typeof data.close !== 'number') {
    throw new Error('Invalid data from EODHD');
  }
  
  return {
    close: data.close,
    open: data.open,
    high: data.high,
    low: data.low,
    volume: data.volume,
    source: 'EODHD'
  };
}

// Generate mock data as final fallback
function generateMockData(symbol) {
  const basePrice = Math.random() * 1000 + 100; // Random price between 100-1100
  const variation = 0.05; // 5% variation
  
  return {
    close: Math.round(basePrice * 100) / 100,
    open: Math.round(basePrice * (1 + (Math.random() - 0.5) * variation) * 100) / 100,
    high: Math.round(basePrice * (1 + Math.random() * variation) * 100) / 100,
    low: Math.round(basePrice * (1 - Math.random() * variation) * 100) / 100,
    volume: Math.floor(Math.random() * 1000000) + 10000,
    source: 'Mock Data',
    timestamp: new Date().toISOString()
  };
}

// Main endpoint with fallback system
app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  // Define the order of API sources to try
  const apiSources = [
    fetchFromYahoo,
    fetchFromAlphaVantage,
    fetchFromEODHD
  ];
  
  for (const fetchFunction of apiSources) {
    try {
      const data = await fetchFunction(symbol);
      console.log(`✅ Successfully fetched ${symbol} from ${data.source}: ₹${data.close}`);
      return res.json(data);
    } catch (error) {
      console.log(`❌ ${fetchFunction.name} failed for ${symbol}: ${error.message}`);
      continue; // Try next API source
    }
  }
  
  // If all APIs fail, use mock data
  console.log(`⚠️ All APIs failed for ${symbol}, using mock data`);
  const mockData = generateMockData(symbol);
  res.json(mockData);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    sources: ['Yahoo Finance', 'Alpha Vantage', 'EODHD', 'Mock Data']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Stock API endpoint: http://localhost:${PORT}/api/stock/{symbol}`);
  console.log(`🔄 Using fallback system: Yahoo Finance → Alpha Vantage → EODHD → Mock Data`);
});