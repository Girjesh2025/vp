const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');
const zlib = require('zlib');

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
    previousClose: result.meta.previousClose,
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
    previousClose: parseFloat(quote['08. previous close']) || parseFloat(quote['05. price']),
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
    previousClose: data.previousClose || data.close,
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
    previousClose: basePrice,
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

// Seeded mock monthly data for sector indices (used when Yahoo is unavailable)
function generateSectorMockMonthly(symbol) {
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = (n) => {
    let s = (seed * 9301 + n * 49297 + 233280) % 233280;
    return (s / 233280) * 2 - 1; // -1 to +1
  };
  const closes = [];
  let price = 10000 + (seed % 10000);
  for (let i = 0; i < 13; i++) {
    price = price * (1 + rng(i) * 0.06);
    closes.push(Math.round(price));
  }
  // Build chart result identical to Yahoo structure
  const timestamps = closes.map((_, i) => Math.floor(Date.now() / 1000) - (12 - i) * 30 * 86400);
  return {
    chart: {
      result: [{
        meta: { symbol },
        timestamp: timestamps,
        indicators: { quote: [{ close: closes }] }
      }],
      error: null
    }
  };
}

// Historical endpoint using Yahoo Finance directly
app.get('/api/historical/:symbol', async (req, res) => {
  // Decode the symbol so %5E -> ^ is preserved for index symbols
  const symbol = decodeURIComponent(req.params.symbol);
  const { range = '6mo', interval = '1d' } = req.query;

  // For sector indices like ^CNXIT, preserve the caret. Else format for Yahoo.
  const formattedSymbol = symbol.startsWith('^') ? symbol : formatSymbolForAPI(symbol, API_SOURCES.YAHOO);

  const YAHOO_HOSTS = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ];
  const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/',
  };

  for (const host of YAHOO_HOSTS) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(formattedSymbol)}?range=${range}&interval=${interval}`;
      console.log(`📈 [Historical] Fetching ${formattedSymbol} from ${host} (${range}, ${interval})...`);

      const fetchResponse = await fetch(url, { headers: COMMON_HEADERS });
      if (!fetchResponse.ok) {
        console.warn(`⚠️ [Historical] ${host} returned ${fetchResponse.status} for ${formattedSymbol}`);
        continue;
      }
      const data = await fetchResponse.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        console.warn(`⚠️ [Historical] Empty chart result from ${host} for ${formattedSymbol}`);
        continue;
      }
      console.log(`✅ [Historical] Got data for ${formattedSymbol} from ${host}`);
      return res.status(200).json(data);
    } catch (error) {
      console.warn(`❌ [Historical] ${host} error for ${formattedSymbol}:`, error.message);
    }
  }

  // All Yahoo hosts failed — return seeded mock data so charts always render
  console.warn(`⚠️ [Historical] All Yahoo hosts failed for ${formattedSymbol}. Returning seeded mock data.`);
  return res.status(200).json(generateSectorMockMonthly(formattedSymbol));
});

// Search endpoint using Yahoo Finance
app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Missing search query parameter' });
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    console.log(`🔍 Searching for ${q} via Yahoo Finance...`);
    
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!fetchResponse.ok) throw new Error(`Yahoo API returned ${fetchResponse.status}`);
    const data = await fetchResponse.json();

    // Map Yahoo results to our interface
    const results = (data.quotes || [])
      .filter(q => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE' || q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
      .map(q => {
        let exchange = 'Unknown';
        if (q.exchange === 'NSI' || q.symbol.endsWith('.NS')) exchange = 'NSE';
        else if (q.exchange === 'BSE' || q.symbol.endsWith('.BO')) exchange = 'BSE';
        
        return {
          symbol: q.symbol.replace(/\.(NS|BO)$/, ''),
          name: q.longname || q.shortname || q.symbol,
          exchange,
          sector: q.sector || q.industry || 'Unknown',
          isin: undefined
        };
      });

    // Remove duplicates
    const uniqueResults = results.filter((stock, index, self) => 
      index === self.findIndex(s => s.symbol === stock.symbol)
    );
    
    return res.status(200).json(uniqueResults);
  } catch (error) {
    console.error('Yahoo Search API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch search data' });
  }
});

// Fetch Options Chain Data from NSE
app.get('/api/options/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const agent = new https.Agent({ keepAlive: true });
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    agent
  };

  try {
    console.log(`fetching options data for ${symbol}...`);
    // 1. Get cookies
    const cookies = await new Promise((resolve, reject) => {
      https.get('https://www.nseindia.com/', options, (response) => {
        const c = response.headers['set-cookie'] ? response.headers['set-cookie'].map(x => x.split(';')[0]).join('; ') : '';
        resolve(c);
      }).on('error', reject);
    });
    
    // 2. Fetch data
    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookies,
        'Referer': 'https://www.nseindia.com/'
      }
    };
    
    // NSE Options chain API: indices or equities
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol);
    const apiUrl = isIndex 
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`;

    const dataStr = await new Promise((resolve, reject) => {
      https.get(apiUrl, fetchOptions, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (response.headers['content-encoding'] === 'gzip') {
             resolve(zlib.gunzipSync(buffer).toString());
          } else if (response.headers['content-encoding'] === 'br') {
             resolve(zlib.brotliDecompressSync(buffer).toString());
          } else {
             resolve(buffer.toString());
          }
        });
      }).on('error', reject);
    });

    const data = JSON.parse(dataStr);
    return res.json(data);
  } catch (err) {
    console.error(`Error fetching Options data for ${symbol}:`, err);
    return res.status(500).json({ error: `Failed to fetch Options data for ${symbol}` });
  }
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