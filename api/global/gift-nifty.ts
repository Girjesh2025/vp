import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = 'https://dhan.co/indices/gift-nifty-share-price/';

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

    const result = {
      price: Number(price.toFixed(2)),
      change: Number(safeChange.toFixed(2)),
      changePercent: Number(safeChangePercent.toFixed(2)),
      previousClose: typeof open === 'number' ? open : undefined,
      source: 'Dhan',
      symbol: 'GIFTNIFTY',
      fetchedAt: updatedMatch ? `${updatedMatch[1]} ${updatedMatch[2]}` : new Date().toISOString(),
      link: 'https://dhan.co/indices/gift-nifty-share-price/',
    };

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch GIFT NIFTY from Dhan',
      details: error.message,
      source: 'Dhan',
    });
  }
}
