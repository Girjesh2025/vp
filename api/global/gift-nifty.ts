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

  // 1. Try Dhan
  try {
    const url = 'https://dhan.co/indices/gift-nifty-share-price/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const priceMatch = html.match(/text-\[28px\][^>]*>([\d,]+\.\d+)<\/p>/);
      const changeBlockMatch = html.match(/text-lg font-CircularBook[^>]*text-\[#(?:E15858|16A34A)\]">([+-]?[\d,]+\.\d+).*?\(([+-]?[\d.]+)\s*%\)/);
      const updatedMatch = html.match(/Last Updated on.*?(\d{1,2}\s+\w+\s+\d{4}).*?at\s+(\d{1,2}:\d{2})/);
      const openMatch = html.match(/Open at<\/p><p[^>]*>([\d,]+\.\d+)<\/p>/);

      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : NaN;
      const change = changeBlockMatch ? parseFloat(changeBlockMatch[1].replace(/,/g, '')) : NaN;
      const changePercent = changeBlockMatch ? parseFloat(changeBlockMatch[2].replace(/,/g, '')) : NaN;
      const open = openMatch ? parseFloat(openMatch[1].replace(/,/g, '')) : undefined;

      if (Number.isFinite(price) && price > 0) {
        const safeChange = Number.isFinite(change) ? change : 0;
        const safeChangePercent = Number.isFinite(changePercent) ? changePercent : 0;

        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
        return res.json({
          price: Number(price.toFixed(2)),
          change: Number(safeChange.toFixed(2)),
          changePercent: Number(safeChangePercent.toFixed(2)),
          previousClose: typeof open === 'number' ? open : undefined,
          source: 'Dhan',
          symbol: 'GIFTNIFTY',
          fetchedAt: updatedMatch ? `${updatedMatch[1]} ${updatedMatch[2]}` : new Date().toISOString(),
          link: 'https://dhan.co/indices/gift-nifty-share-price/',
        });
      }
    }
  } catch (_) {}

  // 2. Fallback to Investing.com server-side
  try {
    const investingUrl = 'https://in.investing.com/indices/gift-nifty-50-c1-futures';
    const response = await fetch(investingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (response.ok) {
      const html = await response.text();
      let priceMatch = html.match(/data-test="instrument-price-last"[^>]*>([\d,.]+)<\/div>/);
      let changeMatch = html.match(/data-test="instrument-price-change"[^>]*>([+-]?[\d,.]+)<\/div>/);
      let changePctMatch = html.match(/data-test="instrument-price-change-percent"[^>]*>\(([+-]?[\d,.]+)%\)<\/div>/);
      if (!priceMatch) priceMatch = html.match(/class="text-5xl[^>]*>([\d,.]+)<\/div>/);

      const scrapedPrice = priceMatch?.[1] ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      const scrapedChange = changeMatch?.[1] ? parseFloat(changeMatch[1].replace(/,/g, '').replace('+', '')) : 0;
      const scrapedChangePercent = changePctMatch?.[1] ? parseFloat(changePctMatch[1].replace(/,/g, '').replace('+', '')) : 0;

      if (!isNaN(scrapedPrice) && scrapedPrice > 0) {
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
        return res.json({
          price: scrapedPrice,
          change: scrapedChange,
          changePercent: scrapedChangePercent,
          source: 'Investing.com',
          symbol: 'GIFTNIFTY',
          link: investingUrl,
        });
      }
    }
  } catch (_) {}

  return res.status(502).json({ error: 'Failed to fetch GIFT Nifty data' });
}
