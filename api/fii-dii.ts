import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NseIndia } from 'stock-nse-india';

interface FiiDiiRecord {
  category: string;
  date: string;
  buyValue?: string;
  sellValue?: string;
  netValue: string;
}

let cachedFiiDii: FiiDiiRecord[] | null = null;
let lastFiiDiiFetch = 0;
const FII_DII_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const nseIndia = new NseIndia();

const fetchFromNseDirect = async (): Promise<FiiDiiRecord[] | null> => {
  const base = 'https://www.nseindia.com';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/reports/fii-dii',
  };

  try {
    const homeRes = await fetch(base, { headers }).catch(() => null);
    const cookies = homeRes ? homeRes.headers.get('set-cookie')?.split(';')[0] : '';

    const reqHeaders: Record<string, string> = { ...headers };
    if (cookies) reqHeaders['Cookie'] = cookies;

    const res = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', {
      headers: reqHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length >= 2) {
        return data;
      }
    }
  } catch (e) {
    console.warn('[FII/DII API] Direct NSE fetch failed:', e);
  }

  // Fallback via stock-nse-india
  try {
    const data = await nseIndia.getDataByEndpoint('/api/fiidiiTradeReact');
    if (Array.isArray(data) && data.length >= 2) {
      return data;
    }
  } catch (e) {
    console.warn('[FII/DII API] stock-nse-india fallback failed:', e);
  }

  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const now = Date.now();
  if (cachedFiiDii && (now - lastFiiDiiFetch) < FII_DII_CACHE_TTL) {
    return res.json(cachedFiiDii);
  }

  const realData = await fetchFromNseDirect();
  if (realData && realData.length > 0) {
    cachedFiiDii = realData;
    lastFiiDiiFetch = now;
    return res.json(realData);
  }

  if (cachedFiiDii) {
    return res.json(cachedFiiDii);
  }

  const fallbackDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return res.json([
    { category: 'FII/FPI', netValue: '0.00', date: fallbackDate },
    { category: 'DII', netValue: '0.00', date: fallbackDate }
  ]);
}
