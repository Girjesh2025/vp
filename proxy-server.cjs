const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');
const YahooFinanceLib = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceLib({ suppressNotices: ['yahooSurvey'] });
require('dotenv').config();
const { fyersModel } = require('fyers-api-v3');

const app = express();
const PORT = process.env.PORT || 3001;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://first-nivesh.vercel.app',
];

const extraAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.endsWith('.vercel.app')) return true;
    if (hostname.endsWith('.onrender.com')) return true;
    if (hostname === 'paperprofit.in' || hostname.endsWith('.paperprofit.in')) return true;
  } catch (e) {
    return false;
  }
  return DEFAULT_ALLOWED_ORIGINS.includes(origin) || extraAllowedOrigins.includes(origin);
};

// Restrict CORS to trusted local/dev and deployed app origins.
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

const fundamentalsCache = new Map();
const FUNDAMENTALS_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

const chartCache = new Map();
const CHART_CACHE_STALE_TTL_MS = 10 * 60 * 1000;
const CHART_CACHE_INTRADAY_TTL_MS = 60 * 1000;
const CHART_CACHE_LONG_TTL_MS = 6 * 60 * 60 * 1000;

const optionsCache = new Map();
const OPTIONS_CACHE_TTL_MS = 30 * 1000;
const OPTIONS_CACHE_STALE_TTL_MS = 10 * 60 * 1000;

const brokerSessions = new Map();
const pendingBrokerLogins = new Map();
const BROKER_FLOW_TTL_MS = 10 * 60 * 1000;

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

const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');
const hashOpaqueToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createPendingBrokerFlow = (userId, broker) => {
  const flowToken = generateOpaqueToken();
  pendingBrokerLogins.set(`${userId}:${broker}`, {
    tokenHash: hashOpaqueToken(flowToken),
    expiresAt: Date.now() + BROKER_FLOW_TTL_MS,
  });
  return flowToken;
};

const consumePendingBrokerFlow = (userId, broker, flowToken) => {
  const key = `${userId}:${broker}`;
  const pending = pendingBrokerLogins.get(key);
  pendingBrokerLogins.delete(key);
  if (!pending) return false;
  if (pending.expiresAt < Date.now()) return false;
  if (!flowToken || typeof flowToken !== 'string') return false;
  return pending.tokenHash === hashOpaqueToken(flowToken);
};

const getBrokerSessionToken = (req) => {
  const token = req.headers['x-broker-session'];
  if (Array.isArray(token)) return token[0];
  return typeof token === 'string' ? token : '';
};

const createBrokerSession = ({ userId, broker, accessToken, ...rest }) => {
  const sessionToken = generateOpaqueToken();
  brokerSessions.set(userId, {
    broker,
    accessToken,
    sessionTokenHash: hashOpaqueToken(sessionToken),
    createdAt: new Date().toISOString(),
    ...rest,
  });
  return sessionToken;
};

const getUserBrokerSession = (userId, brokerName, sessionToken) => {
  const existing = brokerSessions.get(userId);
  if (!existing) return null;
  if (brokerName && existing.broker !== brokerName) return null;
  if (!sessionToken || existing.sessionTokenHash !== hashOpaqueToken(sessionToken)) return null;
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
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_KEY || 'demo',
  FINNHUB: process.env.FINNHUB_KEY || 'demo',
  EODHD: process.env.EODHD_API_TOKEN || process.env.VITE_EODHD_API_KEY || ''
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
  console.log(`Fetching ${symbol} from Yahoo Finance...`);
  
  const quote = await yahooFinance.quote(formattedSymbol);
  
  if (!quote) {
    throw new Error('Invalid or empty response from Yahoo Finance');
  }

  return {
    close: quote.regularMarketPrice || quote.regularMarketPreviousClose,
    open: quote.regularMarketOpen,
    high: quote.regularMarketDayHigh,
    low: quote.regularMarketDayLow,
    volume: quote.regularMarketVolume,
    previousClose: quote.regularMarketPreviousClose,
    high52: quote.fiftyTwoWeekHigh,
    low52: quote.fiftyTwoWeekLow,
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
  const closePrice = Math.round(basePrice * (1 + (Math.random() - 0.5) * variation) * 100) / 100;
  
  return {
    close: closePrice,
    open: Math.round(basePrice * (1 + (Math.random() - 0.5) * variation) * 100) / 100,
    high: Math.round(Math.max(basePrice, closePrice) * (1 + Math.random() * variation) * 100) / 100,
    low: Math.round(Math.min(basePrice, closePrice) * (1 - Math.random() * variation) * 100) / 100,
    volume: Math.floor(Math.random() * 1000000) + 10000,
    previousClose: Math.round(basePrice * 100) / 100,
    source: 'Mock Data',
    timestamp: new Date().toISOString()
  };
}

function getChartCacheTtlMs(interval) {
  if (typeof interval !== 'string') return CHART_CACHE_LONG_TTL_MS;
  if (interval.endsWith('m') || interval.endsWith('h')) return CHART_CACHE_INTRADAY_TTL_MS;
  return CHART_CACHE_LONG_TTL_MS;
}

function resolvePeriod1FromRange(range) {
  const now = Date.now();
  if (range === '1d') return new Date(now - 1 * 24 * 60 * 60 * 1000);
  if (range === '5d') return new Date(now - 5 * 24 * 60 * 60 * 1000);
  if (range === '1wk') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === '1mo') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  if (range === '3mo') return new Date(now - 90 * 24 * 60 * 60 * 1000);
  if (range === '6mo') return new Date(now - 180 * 24 * 60 * 60 * 1000);
  if (range === '1y') return new Date(now - 365 * 24 * 60 * 60 * 1000);
  if (range === '18mo') return new Date(now - 18 * 30 * 24 * 60 * 60 * 1000);
  if (range === '2y') return new Date(now - 2 * 365 * 24 * 60 * 60 * 1000);
  if (range === '3y') return new Date(now - 3 * 365 * 24 * 60 * 60 * 1000);
  return new Date(now - 365 * 24 * 60 * 60 * 1000);
}

function intervalToSeconds(interval) {
  if (typeof interval !== 'string') return 86400;
  if (interval.endsWith('m')) return parseInt(interval, 10) * 60;
  if (interval.endsWith('h')) return parseInt(interval, 10) * 60 * 60;
  if (interval === '1d') return 86400;
  if (interval === '1wk') return 7 * 86400;
  if (interval === '1mo') return 30 * 86400;
  return 86400;
}

function syntheticChartPoints(range, interval) {
  if (range === '1d' && interval === '5m') return 75;
  if (range === '1y' && interval === '1wk') return 52;
  if (range === '18mo' && interval === '1mo') return 18;
  if (range === '3y' && interval === '1d') return 756;
  if (range === '3y' && interval === '1mo') return 36;
  if (range === '1y' && interval === '1d') return 252;
  return 120;
}

function createSeededRng(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSyntheticChart(symbol, range, interval) {
  const points = syntheticChartPoints(range, interval);
  const step = intervalToSeconds(interval);
  const endTs = Math.floor(Date.now() / 1000);
  const startTs = endTs - (points - 1) * step;
  const rng = createSeededRng(`${symbol}|${range}|${interval}|${Math.floor(Date.now() / (5 * 60 * 1000))}`);

  const mock = generateMockData(symbol);
  const base = typeof mock.close === 'number' && mock.close > 0 ? mock.close : 100;
  const drift = (rng() - 0.5) * 0.8;

  const timestamp = [];
  const open = [];
  const high = [];
  const low = [];
  const close = [];
  const volume = [];

  let price = base;
  for (let i = 0; i < points; i++) {
    const ts = startTs + i * step;
    const noise = (rng() - 0.5) * 0.6;
    const stepMovePct = drift / points + noise / Math.max(20, points);
    const o = price;
    const c = Math.max(1, price * (1 + stepMovePct / 100));
    const hi = Math.max(o, c) * (1 + rng() * 0.002);
    const lo = Math.min(o, c) * (1 - rng() * 0.002);

    timestamp.push(ts);
    open.push(Number(o.toFixed(2)));
    high.push(Number(hi.toFixed(2)));
    low.push(Number(lo.toFixed(2)));
    close.push(Number(c.toFixed(2)));
    volume.push(Math.floor(50000 + rng() * 950000));

    price = c;
  }

  return {
    chart: {
      result: [
        {
          timestamp,
          indicators: {
            quote: [
              {
                open,
                high,
                low,
                close,
                volume,
              },
            ],
          },
        },
      ],
      error: null,
    },
  };
}

// Main endpoint with fallback system
app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const isHistorical = req.query.historical === 'true' || req.query.range || req.query.interval;
  const range = req.query.range || '6mo';
  const interval = req.query.interval || '1d';
  
  if (isHistorical) {
    const formatted = formatSymbolForAPI(symbol, API_SOURCES.YAHOO);
    const cacheKey = `${formatted}|${range}|${interval}`;
    const now = Date.now();
    const cached = chartCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.setHeader('X-Cache', 'hit');
      return res.json(cached.data);
    }

    try {
      const period1 = resolvePeriod1FromRange(range);
      const chartData = await yahooFinance.chart(formatted, { period1, interval });

      const timestamps = chartData.quotes.map(q => Math.floor(new Date(q.date).getTime() / 1000));
      const opens = chartData.quotes.map(q => q.open);
      const highs = chartData.quotes.map(q => q.high);
      const lows = chartData.quotes.map(q => q.low);
      const closes = chartData.quotes.map(q => q.close);
      const volumes = chartData.quotes.map(q => q.volume);

      const payload = {
        chart: {
          result: [
            {
              timestamp: timestamps,
              indicators: {
                quote: [
                  {
                    open: opens,
                    high: highs,
                    low: lows,
                    close: closes,
                    volume: volumes,
                  },
                ],
              },
            },
          ],
          error: null,
        },
      };

      const ttl = getChartCacheTtlMs(interval);
      chartCache.set(cacheKey, {
        data: payload,
        expiresAt: now + ttl,
        staleExpiresAt: now + ttl + CHART_CACHE_STALE_TTL_MS,
      });

      res.setHeader('X-Cache', 'miss');
      return res.json(payload);
    } catch (err) {
      const stale = chartCache.get(cacheKey);
      if (stale && stale.staleExpiresAt > now) {
        res.setHeader('X-Cache', 'stale');
        return res.json(stale.data);
      }

      const payload = generateSyntheticChart(formatted, range, interval);
      const ttl = getChartCacheTtlMs(interval);
      chartCache.set(cacheKey, {
        data: payload,
        expiresAt: now + ttl,
        staleExpiresAt: now + ttl + CHART_CACHE_STALE_TTL_MS,
      });

      res.setHeader('X-Cache', 'synthetic');
      return res.json(payload);
    }
  }

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

// Fetch fundamentals from Yahoo Finance using yahoo-finance2
async function fetchYahooFundamentals(symbol) {
  const formattedSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
  
  try {
    const result = await yahooFinance.quoteSummary(formattedSymbol, {
      modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail', 'price']
    });

    if (!result) {
      console.warn(`[Fundamentals] No data from yahoo-finance2 for ${symbol}`);
      return null;
    }

    const priceData = result.price || {};
    const financialData = result.financialData || {};
    const keyStats = result.defaultKeyStatistics || {};
    const summary = result.summaryDetail || {};

    // Calculate ROE if missing: EPS / Book Value
    let roe = financialData.returnOnEquity;
    if (roe === undefined && keyStats.trailingEps && keyStats.bookValue) {
      roe = keyStats.trailingEps / keyStats.bookValue;
    }

    // Calculate PE
    const peRatio = summary.trailingPE || (financialData.currentPrice / (keyStats.trailingEps || 1)) || 0;
    
    // Calculate PEG if missing
    const growth = financialData.earningsGrowth || 0;
    let pegRatio = keyStats.pegRatio;
    if (pegRatio === undefined && growth > 0 && peRatio > 0) {
      pegRatio = peRatio / (growth * 100);
    }

    return {
      symbol: symbol.replace(/\.NS$/, ''),
      price: priceData.regularMarketPrice || 0,
      change: (priceData.regularMarketChangePercent || 0) * 100,
      high52: summary.fiftyTwoWeekHigh || 0,
      low52: summary.fiftyTwoWeekLow || 0,
      peRatio: peRatio,
      pegRatio: pegRatio || 0,
      roe: (roe || 0) * 100,
      debtToEquity: financialData.debtToEquity || 0,
      growth: growth * 100
    };
  } catch (e) {
    try {
      const q = await yahooFinance.quote(formattedSymbol);
      if (q && (typeof q.regularMarketPrice === 'number' || typeof q.regularMarketPreviousClose === 'number')) {
        return {
          symbol: symbol.replace(/\.NS$/, '').replace(/\.BO$/, ''),
          price: q.regularMarketPrice || q.regularMarketPreviousClose || 0,
          change: (q.regularMarketChangePercent || 0) * 100,
          high52: q.fiftyTwoWeekHigh || 0,
          low52: q.fiftyTwoWeekLow || 0,
          peRatio: q.trailingPE || q.forwardPE || 0,
          pegRatio: q.pegRatio || 0,
          roe: 0,
          debtToEquity: 0,
          growth: 0
        };
      }
    } catch (_) {}

    console.error(`Error fetching fundamentals for ${symbol}:`, e.message);
    return null;
  }
}

// Batch Fundamentals Endpoint for Guru Scan
app.post('/api/fundamentals/batch', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) return res.status(400).json({ error: 'Symbols array required' });
    
    console.log(`📊 [Fundamentals] Fetching for ${symbols.length} symbols...`);
    const results = {};
    const now = Date.now();
    const symbolsToFetch = [];

    // Check cache
    for (const sym of symbols) {
      const cached = fundamentalsCache.get(sym);
      if (cached && (now - cached.timestamp) < FUNDAMENTALS_CACHE_TTL) {
        results[sym] = cached.data;
      } else {
        symbolsToFetch.push(sym);
      }
    }

    if (symbolsToFetch.length > 0) {
      console.log(`Fetching missing fundamentals for ${symbolsToFetch.length} symbols from Yahoo...`);
      // Process in smaller batches to avoid rate limits (Render/Vercel frequently hit Yahoo throttling)
      const batchSize = 3;
      for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
        const batch = symbolsToFetch.slice(i, i + batchSize);
        const promises = batch.map(async (sym) => {
           const data = await fetchYahooFundamentals(sym);
           if (data) {
             results[sym] = data;
             fundamentalsCache.set(sym, { data, timestamp: now });
           }
        });
        await Promise.all(promises);
        if (i + batchSize < symbolsToFetch.length) {
          await new Promise(r => setTimeout(r, 600)); // Rate limit delay
        }
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Fundamentals Batch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const { NseIndia } = require('stock-nse-india');
const nseIndia = new NseIndia();

const buildNseCookieHeader = (setCookieHeaders) => {
  if (!Array.isArray(setCookieHeaders) || setCookieHeaders.length === 0) return '';
  return setCookieHeaders
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ');
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
};

const fetchNseOptionChainDirect = async (symbol, isIndex) => {
  const base = 'https://www.nseindia.com';
  const apiPath = isIndex ? '/api/option-chain-indices' : '/api/option-chain-equities';
  const apiUrl = `${base}${apiPath}?symbol=${encodeURIComponent(symbol)}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Referer': `${base}/option-chain`,
  };

  const homeRes = await fetchWithTimeout(base, { headers }, 8000);
  if (!homeRes.ok) throw new Error(`NSE homepage failed: ${homeRes.status}`);
  const cookieHeader = buildNseCookieHeader(homeRes.headers.raw()['set-cookie']);
  if (!cookieHeader) throw new Error('NSE cookie missing');

  const apiRes = await fetchWithTimeout(apiUrl, { headers: { ...headers, Cookie: cookieHeader } }, 8000);
  const bodyText = await apiRes.text();
  if (!apiRes.ok) throw new Error(`NSE option chain failed: ${apiRes.status}`);

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch (e) {
    throw new Error('NSE option chain invalid JSON');
  }

  if (!data || !data.records) throw new Error('NSE option chain missing records');
  return data;
};

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
    console.log('Falling back to Yahoo Finance for NSE high/low data...');
    
    try {
      const FALLBACK_SYMBOLS = [
        'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
        'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
        'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC', 'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LTIM',
        'LT', 'M&M', 'MARUTI', 'NTPC', 'NESTLEIND', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN',
        'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO',
        'PNB', 'AUBANK', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK'
      ];
      const querySymbols = FALLBACK_SYMBOLS.map(s => `${s}.NS`);
      const quotes = await yahooFinance.quote(querySymbols);
      
      const result = {};
      const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
      quoteArray.forEach((q) => {
        const sym = q.symbol.replace('.NS', '');
        result[sym] = {
          symbol: sym,
          high52: q.fiftyTwoWeekHigh,
          low52: q.fiftyTwoWeekLow,
          price: q.regularMarketPrice,
          pChange: q.regularMarketChangePercent
        };
      });
      
      cachedNseHighLow = result;
      lastNseHighLowFetch = Date.now();
      return res.json(result);
    } catch (yahooErr) {
      console.error('Error fetching fallback Yahoo data:', yahooErr.message);
      if (cachedNseHighLow) return res.json(cachedNseHighLow); // Return stale cache if error
      return res.status(500).json({ error: 'Failed to fetch NSE high/low data from all sources' });
    }
  }
});

// Fetch Options Chain Data from NSE
app.get('/api/options/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const now = Date.now();
    const cacheKey = symbol;
    const cached = optionsCache.get(cacheKey);
    if (cached && (now - cached.fetchedAt) < OPTIONS_CACHE_TTL_MS) {
      res.setHeader('x-cache', 'hit');
      return res.json(cached.data);
    }

    console.log(`fetching options data for ${symbol}...`);
    
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol);

    let data;
    try {
      data = isIndex
        ? await nseIndia.getIndexOptionChain(symbol)
        : await nseIndia.getEquityOptionChain(symbol);
    } catch (libErr) {
      try {
        data = await fetchNseOptionChainDirect(symbol, isIndex);
      } catch (directErr) {
        console.error(`Options chain fetch failed for ${symbol}: lib=${libErr?.message} direct=${directErr?.message}`);
        throw libErr;
      }
    }

    if (!data || !data.records) {
      throw new Error("Invalid response from NSE API");
    }

    optionsCache.set(cacheKey, { data, fetchedAt: now });
    res.setHeader('x-cache', 'miss');
    return res.json(data);
  } catch (err) {
    console.error(`Error fetching Options data for ${symbol}:`, err.message);
    const cached = optionsCache.get(symbol);
    if (cached && (Date.now() - cached.fetchedAt) < OPTIONS_CACHE_STALE_TTL_MS) {
      res.setHeader('x-cache', 'stale');
      return res.json(cached.data);
    }
    return res.status(503).json({ error: `Options data unavailable for ${symbol}` });
  }
});

app.get('/api/broker/status', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const sessionToken = getBrokerSessionToken(req);
  const session = getUserBrokerSession(userId, undefined, sessionToken);
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
  const flowToken = createPendingBrokerFlow(userId, 'zerodha');
  return res.json({ loginUrl, flowToken });
});

app.post('/api/broker/zerodha/exchange', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { requestToken, flowToken } = req.body || {};
  if (!requestToken || typeof requestToken !== 'string') return res.status(400).json({ error: 'Missing requestToken' });
  if (!consumePendingBrokerFlow(userId, 'zerodha', flowToken)) {
    return res.status(401).json({ error: 'Invalid or expired broker login session' });
  }

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

  const sessionToken = createBrokerSession({
    userId,
    broker: 'zerodha',
    accessToken: data.data.access_token,
    user: data.data.user_id,
  });

  return res.json({ connected: true, broker: 'zerodha', sessionToken });
});

app.post('/api/broker/fyers/login-url', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { clientId, redirectUri } = getFyersConfig();
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'FYERS_APP_ID or FYERS_REDIRECT_URI not configured' });
  const fyers = createFyers();
  const loginUrl = fyers.generateAuthCode();
  const flowToken = createPendingBrokerFlow(userId, 'fyers');
  return res.json({ loginUrl, flowToken });
});

app.post('/api/broker/fyers/exchange', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { authCode, flowToken } = req.body || {};
  if (!authCode || typeof authCode !== 'string') return res.status(400).json({ error: 'Missing authCode' });
  if (!consumePendingBrokerFlow(userId, 'fyers', flowToken)) {
    return res.status(401).json({ error: 'Invalid or expired broker login session' });
  }

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
    const sessionToken = createBrokerSession({
      userId,
      broker: 'fyers',
      accessToken: response.access_token,
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
    
    return res.json({ connected: true, broker: 'fyers', holdings, sessionToken });
  } catch (e) {
    console.error('Fyers exchange route exception:', e);
    return res.status(400).json({ error: 'Failed to exchange token' });
  }
});

app.post('/api/broker/disconnect', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const sessionToken = getBrokerSessionToken(req);
  const session = getUserBrokerSession(userId, undefined, sessionToken);
  if (!session) return res.status(401).json({ error: 'Broker session not authorized' });
  brokerSessions.delete(userId);
  return res.json({ connected: false });
});

app.get('/api/broker/zerodha/ltp', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const sessionToken = getBrokerSessionToken(req);
  const { instrument } = req.query || {};
  if (!instrument || typeof instrument !== 'string') return res.status(400).json({ error: 'Missing instrument' });
  const { apiKey } = getZerodhaConfig();
  if (!apiKey) return res.status(500).json({ error: 'ZERODHA_API_KEY not configured' });
  const session = getUserBrokerSession(userId, 'zerodha', sessionToken);
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
  const sessionToken = getBrokerSessionToken(req);
  const { symbols } = req.query || {};
  if (!symbols || typeof symbols !== 'string') return res.status(400).json({ error: 'Missing symbols' });
  const session = getUserBrokerSession(userId, 'fyers', sessionToken);
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
  const sessionToken = getBrokerSessionToken(req);
  const session = getUserBrokerSession(userId, 'fyers', sessionToken);
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

// FII/DII Mock Route
app.get('/api/fii-dii', (req, res) => {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const mockData = [
    { category: 'FII/FPI', netValue: '-8692.00', date },
    { category: 'DII', netValue: '7979.00', date }
  ];
  res.json(mockData);
});

// Proxy route for News (Google News RSS)
app.get('/api/market-news', async (req, res) => {
  try {
    // Added 'when:2d' to force Google News to only return the latest news from the past 48 hours
    const url = 'https://news.google.com/rss/search?q=indian+stock+market+OR+nifty+OR+sensex+when:2d&hl=en-IN&gl=IN&ceid=IN:en';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`Google News RSS failed: ${response.status}`);
    }

    const xml = await response.text();
    
    // Basic regex parsing for RSS XML
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    let idCounter = 1;

    // List of trusted top-tier Indian financial news sources
    const TRUSTED_SOURCES = [
      'moneycontrol',
      'ndtv',
      'mint',
      'livemint',
      'economic times',
      'the economic times',
      'cnbc',
      'cnbctv18',
      'business standard',
      'reuters',
      'bloomberg',
      'financial express',
      'the hindu businessline'
    ];

    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
      const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/);
      
      if (titleMatch && linkMatch) {
        const source = sourceMatch ? sourceMatch[1] : 'News';
        const sourceLower = source.toLowerCase();

        // STRICT FILTER: Only allow trusted sources, reject Equitymaster and others
        const isTrusted = TRUSTED_SOURCES.some(trusted => sourceLower.includes(trusted));
        if (!isTrusted) continue; // Skip this news item entirely if not from a top 5 site

        // Google News titles usually have the source at the end like "Title - Source"
        let title = titleMatch[1].replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
        if (title.endsWith(` - ${source}`)) {
           title = title.substring(0, title.length - source.length - 3);
        }

        // Determine category and sentiment (basic keyword matching)
        const titleLower = title.toLowerCase();
        let category = 'market';
        if (titleLower.includes('rbi') || titleLower.includes('gdp') || titleLower.includes('inflation')) category = 'economy';
        else if (titleLower.includes('reliance') || titleLower.includes('tata') || titleLower.includes('hdfc')) category = 'stocks';
        
        let sentiment = 'neutral';
        if (titleLower.includes('jump') || titleLower.includes('surge') || titleLower.includes('high') || titleLower.includes('rally') || titleLower.includes('gain')) sentiment = 'positive';
        if (titleLower.includes('fall') || titleLower.includes('drop') || titleLower.includes('crash') || titleLower.includes('low') || titleLower.includes('loss')) sentiment = 'negative';

        items.push({
          id: idCounter.toString(),
          title: title,
          description: title, // RSS description is usually HTML, so we fallback to title
          url: linkMatch[1],
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          source: source,
          category: category,
          sentiment: sentiment
        });
        idCounter++;
      }
    }

    res.json(items);
  } catch (error) {
    console.error('Error fetching market news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
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
