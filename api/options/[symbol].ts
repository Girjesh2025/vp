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

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  const uppercaseSymbol = symbol.toUpperCase();

  try {
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(uppercaseSymbol);
    
    const data = isIndex 
      ? await nseIndia.getIndexOptionChain(uppercaseSymbol)
      : await nseIndia.getEquityOptionChain(uppercaseSymbol);

    const rawData = data as any;
    if (!rawData || !rawData.records) {
      throw new Error("Invalid response from NSE API");
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error(`Error fetching Options data for ${uppercaseSymbol}:`, err.message);
    return res.status(500).json({ error: `Failed to fetch Options data for ${uppercaseSymbol}` });
  }
}
