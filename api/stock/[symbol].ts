import { default as YahooFinance } from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export default async function handler(req: any, res: any) {
  const symbol = (req.query?.symbol || req.query?.params?.symbol || '').toString();
  const source = (req.query?.source || '').toString().toLowerCase();
  const range = (req.query?.range || '').toString();
  const interval = (req.query?.interval || '').toString();
  const isHistorical = req.query?.historical === 'true' || !!range || !!interval;


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
    
    if (isHistorical) {
      try {
        const queryOptions: any = { period1: '2020-01-01' }; // A safe long-term period
        
        const r = range || '6mo';
        const i = interval || '1d';

        if (r === '1d') queryOptions.period1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
        else if (r === '1wk') queryOptions.period1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        else if (r === '1mo') queryOptions.period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        else if (r === '3mo') queryOptions.period1 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        else if (r === '6mo') queryOptions.period1 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        else if (r === '1y') queryOptions.period1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        
        const chartData = await yahooFinance.chart(formatted, {
          period1: queryOptions.period1,
          interval: i as any
        });
        
        // Format it exactly as Yahoo's raw API so the frontend parsing doesn't break
        const timestamps = chartData.quotes.map(q => Math.floor(new Date(q.date).getTime() / 1000));
        const opens = chartData.quotes.map(q => q.open);
        const highs = chartData.quotes.map(q => q.high);
        const lows = chartData.quotes.map(q => q.low);
        const closes = chartData.quotes.map(q => q.close);
        const volumes = chartData.quotes.map(q => q.volume);
        
        return {
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
                      volume: volumes
                    }
                  ]
                }
              }
            ]
          }
        };
      } catch (err: any) {
        throw new Error(`yahoo chart invalid: ${err.message}`);
      }
    }

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

  const fetchIndexChartFromYahoo = async () => {
    if (!symbol.startsWith('^')) throw new Error('not index symbol');
    const formatted = formatSymbolForAPI(symbol, 'yahoo');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formatted)}?range=5d&interval=1d`;
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!r.ok) throw new Error(`yahoo chart ${r.status}`);
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error('yahoo chart invalid');
    return {
      close: meta.regularMarketPrice,
      open: meta.regularMarketDayOpen ?? meta.chartPreviousClose ?? meta.regularMarketPrice,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume ?? 0,
      previousClose: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice,
      high52: meta.fiftyTwoWeekHigh,
      low52: meta.fiftyTwoWeekLow,
      source: 'Yahoo Chart Direct'
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
    const closePrice = Math.round(base * (1 + (Math.random() - 0.5) * v) * 100) / 100;
    return {
      close: closePrice,
      open: Math.round(base * (1 + (Math.random() - 0.5) * v) * 100) / 100,
      high: Math.round(Math.max(base, closePrice) * (1 + Math.random() * v) * 100) / 100,
      low: Math.round(Math.min(base, closePrice) * (1 - Math.random() * v) * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 10000,
      previousClose: Math.round(base * 100) / 100,
      high52: Math.round(base * 1.5 * 100) / 100,
      low52: Math.round(base * 0.5 * 100) / 100,
      source: 'Mock Data'
    };
  };

  const chain: Array<() => Promise<any>> = [];
  if (source === 'yahoo') {
    chain.push(fetchFromYahoo);
    if (symbol.startsWith('^')) chain.push(fetchIndexChartFromYahoo);
  } else if (source === 'eodhd') {
    chain.push(fetchFromEodhd);
  } else if (source === 'alpha') {
    chain.push(fetchFromAlpha);
  } else if (source === 'finnhub') {
    chain.push(fetchFromFinnhub);
  } else {
    chain.push(fetchFromYahoo);
    if (symbol.startsWith('^')) chain.push(fetchIndexChartFromYahoo);
    if (alphaKey) chain.push(fetchFromAlpha);
    if (finnhubKey) chain.push(fetchFromFinnhub);
    if (eodhdKey) chain.push(fetchFromEodhd);
  }

  for (const fn of chain) {
    try {
      const data = await fn();
      // #region debug-point D:stock-api-success
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"index-fallback-data",runId:"post-fix",hypothesisId:"D",location:"api/stock/[symbol].ts:196",msg:"[DEBUG] stock api success response",data:{symbol,sourceRequested:source||"auto",responseSource:data?.source||null,close:data?.close||null,previousClose:data?.previousClose??null,isHistorical},ts:Date.now()})}).catch(()=>{});
      // #endregion
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
      res.json(data);
      return;
    } catch (e) {
    }
  }

  if (symbol.startsWith('^')) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: `Unable to fetch live index data for ${symbol}` });
    return;
  }

  // #region debug-point E:stock-api-mock
  fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"index-fallback-data",runId:"post-fix",hypothesisId:"E",location:"api/stock/[symbol].ts:205",msg:"[DEBUG] stock api returning mock fallback",data:{symbol,sourceRequested:source||"auto",isHistorical},ts:Date.now()})}).catch(()=>{});
  // #endregion
  res.setHeader('Cache-Control', 's-maxage=10');
  res.json(generateMock());
}
