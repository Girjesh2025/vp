const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');
require('dotenv').config();
const { fyersModel } = require('fyers-api-v3');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const brokerSessions = new Map();

const getZerodhaConfig = () => {
  return {
    apiKey: process.env.ZERODHA_API_KEY,
    apiSecret: process.env.ZERODHA_API_SECRET,
  };
};

const getFyersConfig = () => {
  return {
    clientId: process.env.FYERS_APP_ID,
    secretKey: process.env.FYERS_SECRET_KEY,
    redirectUri: process.env.FYERS_REDIRECT_URI,
  };
};

const createFyers = () => {
  const { clientId, redirectUri } = getFyersConfig();
  const fyers = new fyersModel({ path: process.cwd(), enableLogging: false });
  fyers.setAppId(clientId);
  fyers.setRedirectUrl(redirectUri);
  return fyers;
};

const requireUserId = (req, res) => {
  const userId = req.query.userId || (req.body && req.body.userId);
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'Missing userId' });
    return null;
  }
  return userId;
};

const getUserBrokerSession = (userId, brokerName) => {
  const existing = brokerSessions.get(userId);
  if (!existing) return null;
  if (brokerName && existing.broker !== brokerName) return null;
  return existing;
};

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

const GIFT_NIFTY_CONFIG = {
  cacheMs: 5 * 60 * 1000,
};

let cachedGiftNifty = null;
let lastGiftNiftyFetch = 0;

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
    high52: result.meta.fiftyTwoWeekHigh,
    low52: result.meta.fiftyTwoWeekLow,
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

// Yahoo Quote endpoint for multiple symbols
app.get('/api/yahoo-quotes', async (req, res) => {
  const symbols = req.query.symbols;
  if (!symbols || typeof symbols !== 'string') {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const formattedSymbols = symbols.split(',').map(s => {
    if (s.startsWith('^')) return s;
    const clean = s.replace(/\.(NS|BO|NSE|BSE)$/i, '');
    return `${clean}.NS`;
  }).join(',');

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(formattedSymbols)}`;
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!fetchResponse.ok) throw new Error(`Yahoo API returned ${fetchResponse.status}`);
    const data = await fetchResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Yahoo Quotes API Error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch quote data' });
  }
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

const { NseIndia } = require('stock-nse-india');
const nseIndia = new NseIndia();

let cachedNseHighLow = null;
let lastNseHighLowFetch = 0;

// Fetch 52-week high/low for top 500 stocks from NSE
app.get('/api/nse/highlow', async (req, res) => {
  try {
    const now = Date.now();
    // Cache for 15 minutes
    if (cachedNseHighLow && (now - lastNseHighLowFetch) < 15 * 60 * 1000) {
      return res.json(cachedNseHighLow);
    }
    
    console.log('Fetching Nifty 500 high/low from NSE...');
    const data = await nseIndia.getEquityStockIndices('NIFTY 500');
    
    if (data && data.data && data.data.length > 0) {
      const result = {};
      data.data.forEach(item => {
        if (item.symbol !== 'NIFTY 500') {
          result[item.symbol] = {
            high52: item.yearHigh,
            low52: item.yearLow
          };
        }
      });
      
      cachedNseHighLow = result;
      lastNseHighLowFetch = now;
      return res.json(result);
    } else {
      throw new Error("Invalid response from NSE API");
    }
  } catch (err) {
    console.error('Error fetching NSE high/low:', err.message);
    if (cachedNseHighLow) return res.json(cachedNseHighLow); // Return stale cache if error
    return res.status(500).json({ error: 'Failed to fetch NSE high/low data' });
  }
});

// Fetch Options Chain Data from NSE
app.get('/api/options/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    console.log(`fetching options data for ${symbol}...`);
    
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol);
    
    const data = isIndex 
      ? await nseIndia.getIndexOptionChain(symbol)
      : await nseIndia.getEquityOptionChain(symbol);

    if (!data || !data.records) {
      throw new Error("Invalid response from NSE API");
    }

    return res.json(data);
  } catch (err) {
    console.error(`Error fetching Options data for ${symbol}:`, err.message);
    return res.status(500).json({ error: `Failed to fetch Options data for ${symbol}` });
  }
});

app.get('/api/broker/status', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  console.log(`[broker] GET /api/broker/status userId=${userId}`);
  const session = brokerSessions.get(userId);
  if (!session) return res.json({ connected: false });
  return res.json({
    connected: true,
    broker: session.broker,
    createdAt: session.createdAt,
  });
});

app.post('/api/broker/zerodha/login-url', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { apiKey } = getZerodhaConfig();
  if (!apiKey) return res.status(500).json({ error: 'ZERODHA_API_KEY not configured' });
  const loginUrl = `https://kite.trade/connect/login?api_key=${encodeURIComponent(apiKey)}&v=3`;
  return res.json({ loginUrl });
});

app.post('/api/broker/zerodha/exchange', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { requestToken } = req.body || {};
  if (!requestToken || typeof requestToken !== 'string') return res.status(400).json({ error: 'Missing requestToken' });

  const { apiKey, apiSecret } = getZerodhaConfig();
  if (!apiKey || !apiSecret) return res.status(500).json({ error: 'Zerodha not configured' });

  const checksum = crypto.createHash('sha256').update(`${apiKey}${requestToken}${apiSecret}`).digest('hex');
  const form = new URLSearchParams();
  form.append('api_key', apiKey);
  form.append('request_token', requestToken);
  form.append('checksum', checksum);

  const r = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Kite-Version': '3',
    },
    body: form.toString(),
  });

  const data = await r.json().catch(() => null);
  if (!r.ok || !data || !data.data || !data.data.access_token) {
    return res.status(400).json({ error: 'Failed to exchange token', details: data });
  }

  brokerSessions.set(userId, {
    broker: 'zerodha',
    accessToken: data.data.access_token,
    createdAt: new Date().toISOString(),
    user: data.data.user_id,
  });

  return res.json({ connected: true, broker: 'zerodha' });
});

app.post('/api/broker/fyers/login-url', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  console.log(`[broker] POST /api/broker/fyers/login-url userId=${userId}`);
  const { clientId, redirectUri } = getFyersConfig();
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'FYERS_APP_ID or FYERS_REDIRECT_URI not configured' });
  const fyers = createFyers();
  const loginUrl = fyers.generateAuthCode();
  return res.json({ loginUrl });
});

app.post('/api/broker/fyers/exchange', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { authCode } = req.body || {};
  if (!authCode || typeof authCode !== 'string') return res.status(400).json({ error: 'Missing authCode' });
  console.log(`[broker] POST /api/broker/fyers/exchange userId=${userId} authCodePresent=${Boolean(authCode)}`);

  const { clientId, secretKey, redirectUri } = getFyersConfig();
  if (!clientId || !secretKey || !redirectUri) return res.status(500).json({ error: 'Fyers not configured' });

  const fyers = createFyers();
  try {
    console.log(`Attempting Fyers token exchange for App ID: ${clientId} with Redirect URI: ${redirectUri}`);
    
    // Bypass the SDK and use a direct fetch with browser-like headers to avoid Cloudflare blocks
    const appIdHash = crypto.createHash('sha256').update(`${clientId}:${secretKey}`).digest('hex');
    
    const tokenRes = await fetch('https://api-t1.fyers.in/api/v3/validate-authcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        appIdHash: appIdHash,
        code: authCode
      })
    });
    console.log(`[broker] Fyers validate-authcode status=${tokenRes.status} ok=${tokenRes.ok}`);

    const responseText = await tokenRes.text();
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (e) {
      response = responseText;
    }
    
    // Check if response is a Cloudflare HTML page instead of JSON
    if (typeof response === 'string' && response.includes('<html')) {
      console.error('Fyers API returned an HTML page (likely Cloudflare block):', response.substring(0, 200) + '...');
      return res.status(400).json({ 
        error: 'Fyers API blocked the request (Cloudflare/WAF issue).', 
        details: response.substring(0, 500) 
      });
    }
    
    if (response.s === 'error') {
      console.error('Fyers token exchange error:', response);
      return res.status(400).json({ error: response.message || 'Fyers token exchange failed', details: response });
    }
    if (!response || response.s !== 'ok' || !response.access_token) {
      console.error('Fyers token exchange invalid response:', response);
      return res.status(400).json({ error: 'Failed to exchange token', details: response });
    }
    console.log(`[broker] Fyers token exchange success userId=${userId}`);
    brokerSessions.set(userId, {
      broker: 'fyers',
      accessToken: response.access_token,
      createdAt: new Date().toISOString(),
      clientId,
    });
    
    // Automatically fetch holdings right after login to make them available immediately
    fyers.setAccessToken(response.access_token);
    let holdings = [];
    try {
      console.log(`[broker] Attempting immediate holdings fetch for userId=${userId}`);
      const holdingsRes = await fyers.get_holdings();
      console.log(`[broker] Immediate holdings fetch response keys=${Object.keys(holdingsRes || {}).join(',')}`);
      if (holdingsRes && holdingsRes.holdings) {
        holdings = holdingsRes.holdings;
        console.log(`[broker] Immediate holdings count=${holdings.length}`);
      }
    } catch (holdingsErr) {
      console.warn('Failed to automatically fetch holdings on login', holdingsErr);
    }
    
    return res.json({ connected: true, broker: 'fyers', holdings });
  } catch (e) {
    console.error('Fyers exchange route exception:', e);
    return res.status(400).json({ error: 'Failed to exchange token' });
  }
});

app.post('/api/broker/disconnect', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  brokerSessions.delete(userId);
  return res.json({ connected: false });
});

app.get('/api/broker/zerodha/ltp', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { instrument } = req.query || {};
  if (!instrument || typeof instrument !== 'string') return res.status(400).json({ error: 'Missing instrument' });
  const { apiKey } = getZerodhaConfig();
  if (!apiKey) return res.status(500).json({ error: 'ZERODHA_API_KEY not configured' });
  const session = getUserBrokerSession(userId, 'zerodha');
  if (!session) return res.status(401).json({ error: 'Broker not connected' });

  const url = `https://api.kite.trade/quote/ltp?i=${encodeURIComponent(instrument)}`;
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Kite-Version': '3',
      'Authorization': `token ${apiKey}:${session.accessToken}`,
      'Accept': 'application/json',
    },
  });

  const data = await r.json().catch(() => null);
  if (!r.ok) return res.status(400).json({ error: 'Failed to fetch quote', details: data });
  return res.json(data);
});

app.get('/api/broker/fyers/quotes', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { symbols } = req.query || {};
  if (!symbols || typeof symbols !== 'string') return res.status(400).json({ error: 'Missing symbols' });
  console.log(`[broker] GET /api/broker/fyers/quotes userId=${userId} symbols=${symbols}`);
  const session = getUserBrokerSession(userId, 'fyers');
  if (!session) return res.status(401).json({ error: 'Broker not connected' });

  const { clientId, redirectUri } = getFyersConfig();
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'Fyers not configured' });

  const fyers = createFyers();
  fyers.setAccessToken(session.accessToken);

  const list = symbols.split(',').map(s => s.trim()).filter(Boolean);
  try {
    const out = await fyers.getQuotes(list);
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: 'Failed to fetch quotes' });
  }
});

app.get('/api/broker/fyers/holdings', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  console.log(`[broker] GET /api/broker/fyers/holdings userId=${userId}`);
  const session = getUserBrokerSession(userId, 'fyers');
  if (!session) return res.status(401).json({ error: 'Broker not connected' });

  const { clientId, redirectUri } = getFyersConfig();
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'Fyers not configured' });

  const fyers = createFyers();
  fyers.setAccessToken(session.accessToken);

  try {
    const out = await fyers.get_holdings();
    return res.json(out);
  } catch (e) {
    return res.status(400).json({ error: 'Failed to fetch holdings', message: e.message });
  }
});

app.get('/api/global/gift-nifty', async (req, res) => {
  const now = Date.now();
  if (cachedGiftNifty && (now - lastGiftNiftyFetch) < GIFT_NIFTY_CONFIG.cacheMs) {
    return res.json(cachedGiftNifty);
  }

  const url = 'https://dhan.co/indices/gift-nifty-share-price/';
  console.log('[global] GET /api/global/gift-nifty source=dhan');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const html = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Dhan responded with status ${response.status}`,
        details: html.slice(0, 300),
        source: 'Dhan',
      });
    }

    const priceMatch = html.match(/text-\[28px\][^>]*>([\d,]+\.\d+)<\/p>/);
    const changeBlockMatch = html.match(/text-lg font-CircularBook[^>]*text-\[#(?:E15858|16A34A)\]">([+-]?[\d,]+\.\d+).*?\(([+-]?[\d.]+)\s*%\)/);
    const updatedMatch = html.match(/Last Updated on.*?(\d{1,2}\s+\w+\s+\d{4}).*?at\s+(\d{1,2}:\d{2})/);
    const openMatch = html.match(/Open at<\/p><p[^>]*>([\d,]+\.\d+)<\/p>/);

    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : NaN;
    const change = changeBlockMatch ? parseFloat(changeBlockMatch[1].replace(/,/g, '')) : NaN;
    const changePercent = changeBlockMatch ? parseFloat(changeBlockMatch[2].replace(/,/g, '')) : NaN;
    const open = openMatch ? parseFloat(openMatch[1].replace(/,/g, '')) : undefined;

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(502).json({
        error: 'Invalid data from Dhan for GIFT NIFTY',
        details: html.slice(0, 300),
        source: 'Dhan',
      });
    }
    const safeChange = Number.isFinite(change) ? change : 0;
    const safeChangePercent = Number.isFinite(changePercent) ? changePercent : 0;

    cachedGiftNifty = {
      price: Number(price.toFixed(2)),
      change: Number(safeChange.toFixed(2)),
      changePercent: Number(safeChangePercent.toFixed(2)),
      previousClose: typeof open === 'number' ? open : undefined,
      source: 'Dhan',
      symbol: 'GIFTNIFTY',
      fetchedAt: updatedMatch ? `${updatedMatch[1]} ${updatedMatch[2]}` : new Date().toISOString(),
      link: 'https://dhan.co/indices/gift-nifty-share-price/',
    };
    lastGiftNiftyFetch = now;

    return res.json(cachedGiftNifty);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch GIFT NIFTY from Dhan',
      details: error.message,
      source: 'Dhan',
    });
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
