import { NseIndia } from 'stock-nse-india';
import { default as YahooFinance } from 'yahoo-finance2';

const nseIndia = new NseIndia();
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const FALLBACK_SYMBOLS = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
  'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
  'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC', 'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LTIM',
  'LT', 'M&M', 'MARUTI', 'NTPC', 'NESTLEIND', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN',
  'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO',
  'PNB', 'AUBANK', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK'
];

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
    const data = await nseIndia.getEquityStockIndices('NIFTY 500');
    
    if (!data || !data.data) {
      throw new Error("Invalid response from NSE API");
    }

    const result: Record<string, any> = {};
    data.data.forEach((item: any) => {
      const sym = item.symbol;
      result[sym] = {
        symbol: sym,
        high52: item.yearHigh,
        low52: item.yearLow,
        price: item.lastPrice,
        pChange: item.pChange
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching NSE high/low from NSE India, falling back to Yahoo:", error.message);
    
    try {
      const querySymbols = FALLBACK_SYMBOLS.map(s => `${s}.NS`);
      const quotes = await yahooFinance.quote(querySymbols);
      
      const result: Record<string, any> = {};
      const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
      quoteArray.forEach((q: any) => {
        const sym = q.symbol.replace('.NS', '');
        result[sym] = {
          symbol: sym,
          high52: q.fiftyTwoWeekHigh,
          low52: q.fiftyTwoWeekLow,
          price: q.regularMarketPrice,
          pChange: q.regularMarketChangePercent
        };
      });
      return res.status(200).json(result);
    } catch (yahooError: any) {
      console.error("Error fetching fallback Yahoo data:", yahooError.message);
      return res.status(500).json({ error: "Failed to fetch market data from all sources" });
    }
  }
}
