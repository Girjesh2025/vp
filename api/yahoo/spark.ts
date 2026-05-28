import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbols = (req.query?.symbols || '').toString();
  const range = (req.query?.range || '1mo').toString();
  const interval = (req.query?.interval || '1d').toString();

  if (!symbols) {
    res.status(400).json({ error: 'Missing symbols' });
    return;
  }

  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const text = await r.text();
    if (!r.ok) {
      res.status(r.status).json({ error: 'Yahoo spark failed', status: r.status, body: text.slice(0, 500) });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(text);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Spark fetch failed' });
  }
}
