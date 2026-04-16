import { default as YahooFinance } from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Both GET and POST support for flexibility
    let symbols: string[] = [];
    if (req.method === 'POST') {
      symbols = req.body?.symbols || [];
    } else if (req.method === 'GET') {
      const q = req.query.symbols;
      if (typeof q === 'string') symbols = q.split(',');
    }

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array required' });
    }

    console.log(`📊 [Fundamentals] Fetching for ${symbols.length} symbols...`);
    const results: Record<string, any> = {};
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(async (sym: string) => {
        const formattedSymbol = sym.endsWith('.NS') || sym.endsWith('.BO') ? sym : `${sym}.NS`;
        try {
          const result: any = await yahooFinance.quoteSummary(formattedSymbol, {
            modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail', 'price']
          });

          if (result) {
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

            results[sym] = {
              symbol: sym.replace(/\.NS$/, ''),
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
          }
        } catch (e: any) {
          console.warn(`[Fundamentals] Error for ${sym}:`, e.message);
          results[sym] = { error: e.message, stack: e.stack };
        }
      });
      
      await Promise.all(promises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // Cache the response at edge for 1 hour to reduce Yahoo API calls
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(results);
  } catch (error: any) {
    console.error('Fundamentals Batch Error:', error);
    res.status(500).json({ error: error.message });
  }
}
