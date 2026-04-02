export default async function handler(req: any, res: any) {
  const symbol = (req.query?.symbol || req.query?.params?.symbol || '').toString();
  const range = (req.query?.range || '18mo').toString();
  const interval = (req.query?.interval || '1mo').toString();

  if (!symbol) {
    res.status(400).json({ error: 'Missing symbol' });
    return;
  }

  const formatSymbolForAPI = (s: string) => {
    // Sector indices like ^CNXIT should be passed exactly as is
    if (s.startsWith('^')) return s;
    const clean = s.replace(/\.(NSE|BSE)$/i, '');
    if (/\.NSE$/i.test(s)) return `${clean}.NS`;
    if (/\.BSE$/i.test(s)) return `${clean}.BO`;
    return clean;
  };

  const formattedSymbol = formatSymbolForAPI(symbol);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=${range}&interval=${interval}`;
    
    // Serverless fetch securely ignoring CORS
    const fetchResponse = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      } 
    });

    if (!fetchResponse.ok) {
      throw new Error(`Yahoo API returned HTTP ${fetchResponse.status}`);
    }

    const data = await fetchResponse.json();
    
    // Aggressive caching since historical monthly data doesn't change by the minute
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error(`Historical API Error for ${symbol}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}
