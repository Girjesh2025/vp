import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Missing search query parameter' });
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    
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
      .filter((q: any) => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE' || q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
      .map((q: any) => {
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
    const uniqueResults = results.filter((stock: any, index: number, self: any[]) => 
      index === self.findIndex(s => s.symbol === stock.symbol)
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(uniqueResults);
  } catch (error) {
    console.error('Yahoo Search API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch search data' });
  }
}
