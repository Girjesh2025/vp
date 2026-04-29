import { default as YahooFinance } from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export default async function handler(req: any, res: any) {
  const symbol = (req.query?.symbol || req.query?.params?.symbol || '').toString();
  const source = (req.query?.source || '').toString().toLowerCase();
  if (!symbol) {
    res.status(400).json({ error: 'Missing symbol' });
    return;
  }

  const alphaKey = process.env.ALPHA_VANTAGE_KEY || '';
  const finnhubKey = process.env.FINNHUB_KEY || '';
  const eodhdKey = process.env.EODHD_API_TOKEN || '';

  const formatSymbolForAPI = (s: string, api: string) => {
    const clean = s.replace(/\.(NSE|BSE)$/i, '');
    if (api === 'yahoo') {
      if (/\.NSE$/i.test(s)) return `${clean}.NS`;
      if (/\.BSE$/i.test(s)) return `${clean}.BO`;
      return clean;
    }
    if (api === 'eodhd') return s;
    return clean;
  };

  const fetchFromYahoo = async () => {
    const formatted = formatSymbolForAPI(symbol, 'yahoo');
    const quote = await yahooFinance.quote(formatted);
    if (!quote) throw new Error('yahoo invalid');
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
  };

  const fetchFromAlpha = async () => {
    if (!alphaKey) throw new Error('alpha missing');
    const formatted = formatSymbolForAPI(symbol, 'alpha');
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formatted}&apikey=${alphaKey}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`alpha ${r.status}`);
    const data = await r.json();
    const q = data['Global Quote'];
    if (!q || !q['05. price']) throw new Error('alpha invalid');
    return {
      close: parseFloat(q['05. price']),
      open: parseFloat(q['02. open']),
      high: parseFloat(q['03. high']),
      low: parseFloat(q['04. low']),
      volume: parseInt(q['06. volume']),
      previousClose: parseFloat(q['08. previous close']) || parseFloat(q['05. price']),
      source: 'Alpha Vantage'
    };
  };

  const fetchFromFinnhub = async () => {
    if (!finnhubKey) throw new Error('finnhub missing');
    const formatted = formatSymbolForAPI(symbol, 'finnhub');
    const url = `https://finnhub.io/api/v1/quote?symbol=${formatted}&token=${finnhubKey}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`finnhub ${r.status}`);
    const d = await r.json();
    if (typeof d.c !== 'number') throw new Error('finnhub invalid');
    return {
      close: d.c,
      open: d.o,
      high: d.h,
      low: d.l,
      volume: d.v,
      previousClose: d.pc || d.c,
      source: 'Finnhub'
    };
  };

  const fetchFromEodhd = async () => {
    if (!eodhdKey) throw new Error('eodhd missing');
    const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${eodhdKey}&fmt=json`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`eodhd ${r.status}`);
    const d = await r.json();
    if (typeof d.close !== 'number') throw new Error('eodhd invalid');
    return {
      close: d.close,
      open: d.open,
      high: d.high,
      low: d.low,
      volume: d.volume,
      previousClose: d.previousClose || d.close,
      source: 'EODHD'
    };
  };

  const generateMock = () => {
    const base = Math.random() * 1000 + 100;
    const v = 0.05;
    return {
      close: Math.round(base * 100) / 100,
      open: Math.round(base * (1 + (Math.random() - 0.5) * v) * 100) / 100,
      high: Math.round(base * (1 + Math.random() * v) * 100) / 100,
      low: Math.round(base * (1 - Math.random() * v) * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 10000,
      previousClose: base,
      high52: Math.round(base * 1.5 * 100) / 100,
      low52: Math.round(base * 0.5 * 100) / 100,
      source: 'Mock Data'
    };
  };

  const chain: Array<() => Promise<any>> = [];
  if (source === 'yahoo') {
    chain.push(fetchFromYahoo);
  } else if (source === 'eodhd') {
    chain.push(fetchFromEodhd);
  } else if (source === 'alpha') {
    chain.push(fetchFromAlpha);
  } else if (source === 'finnhub') {
    chain.push(fetchFromFinnhub);
  } else {
    chain.push(fetchFromYahoo);
    if (alphaKey) chain.push(fetchFromAlpha);
    if (finnhubKey) chain.push(fetchFromFinnhub);
    if (eodhdKey) chain.push(fetchFromEodhd);
  }

  for (const fn of chain) {
    try {
      const data = await fn();
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
      res.json(data);
      return;
    } catch (e) {
    }
  }

  res.setHeader('Cache-Control', 's-maxage=10');
  res.json(generateMock());
}