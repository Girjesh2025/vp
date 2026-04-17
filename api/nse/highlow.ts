import { NseIndia } from 'stock-nse-india';

const nseIndia = new NseIndia();

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
    console.error("Error fetching NSE high/low:", error.message);
    return res.status(500).json({ error: "Failed to fetch NSE market data" });
  }
}
