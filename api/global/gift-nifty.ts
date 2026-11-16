import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Read the GIFT Nifty quote from Dhan's page data (the Next.js JSON embedded in the page),
 * which is stable across visual redesigns: "sym":"GIFTNIFTY",...,"Ltp":25245,"ch":-21,"p_ch":-0.0831,...,"cl":25266
 */
export function parseDhanGiftNifty(html: string) {
  const i = html.indexOf('"sym":"GIFTNIFTY"');
  if (i < 0) return null;
  const block = html.slice(i, i + 1500);
  const num = (key: string) => {
    const m = block.match(new RegExp(`"${key}":(-?\\d+(?:\\.\\d+)?)`));
    return m ? Number(m[1]) : NaN;
  };
  const price = num('Ltp');
  if (!(price > 0)) return null;
  const change = num('ch');
  const changePercent = num('p_ch');
  const previousClose = num('cl');
  // "as on 16 Nov 2026 at 14:19" (IST) — Dhan's quote time, not our fetch time
  const asOf = html.match(/as on (\d{1,2} \w{3} \d{4}) at (\d{1,2}:\d{2})/);
  return {
    price: Number(price.toFixed(2)),
    change: Number.isFinite(change) ? Number(change.toFixed(2)) : 0,
    changePercent: Number.isFinite(changePercent) ? Number(changePercent.toFixed(2)) : 0,
    previousClose: previousClose > 0 ? previousClose : undefined,
    fetchedAt: asOf ? `${asOf[1]} ${asOf[2]} IST` : new Date().toISOString(),
  };
}

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
      const q = parseDhanGiftNifty(html);
      if (q) {
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
        return res.json({ ...q, source: 'Dhan', symbol: 'GIFTNIFTY', link: url });
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
