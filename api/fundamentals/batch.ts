import type { VercelRequest, VercelResponse } from '@vercel/node';
import { default as YahooFinance } from 'yahoo-finance2';

type StockFundamentals = {
  symbol: string;
  price: number;
  change: number;
  high52: number;
  low52: number;
  peRatio: number;
  pegRatio: number;
  roe: number;
  debtToEquity: number;
  growth: number;
};

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

type CacheEntry = { ts: number; data: StockFundamentals };
const CACHE_TTL_MS = 10 * 60 * 1000;

const getCache = (): Map<string, CacheEntry> => {
  const g = globalThis as any;
  if (!g.__pp_fundamentals_cache) g.__pp_fundamentals_cache = new Map<string, CacheEntry>();
  return g.__pp_fundamentals_cache as Map<string, CacheEntry>;
};

const normalizeBaseSymbol = (s: string): string => s.replace(/\.(NS|BO)$/i, '');

const toFundamentals = async (inputSymbol: string): Promise<StockFundamentals | null> => {
  const cache = getCache();
  const cached = cache.get(inputSymbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const quote: any = await yahooFinance.quote(inputSymbol);
  if (!quote) return null;

  const price = Number(quote.regularMarketPrice ?? quote.regularMarketPreviousClose ?? 0);
  const previousClose = Number(quote.regularMarketPreviousClose ?? price ?? 0);
  const change = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;

  const high52 = Number(quote.fiftyTwoWeekHigh ?? 0);
  const low52 = Number(quote.fiftyTwoWeekLow ?? 0);

  let peRatio = Number(quote.trailingPE ?? 0);
  let pegRatio = Number(quote.pegRatio ?? 0);
  let roe = 0;
  let debtToEquity = 0;
  let growth = 0;

  try {
    const summary: any = await yahooFinance.quoteSummary(inputSymbol, {
      modules: ['defaultKeyStatistics', 'financialData'],
    });

    const trailingPeRaw = summary?.defaultKeyStatistics?.trailingPE?.raw ?? summary?.defaultKeyStatistics?.trailingPE;
    if (!peRatio && typeof trailingPeRaw === 'number') peRatio = trailingPeRaw;

    const pegRaw = summary?.defaultKeyStatistics?.pegRatio?.raw ?? summary?.defaultKeyStatistics?.pegRatio;
    if (!pegRatio && typeof pegRaw === 'number') pegRatio = pegRaw;

    const roeRaw = summary?.financialData?.returnOnEquity?.raw ?? summary?.financialData?.returnOnEquity;
    if (typeof roeRaw === 'number') roe = roeRaw * 100;

    const d2eRaw = summary?.financialData?.debtToEquity?.raw ?? summary?.financialData?.debtToEquity;
    if (typeof d2eRaw === 'number') debtToEquity = d2eRaw;

    const earningsGrowthRaw = summary?.financialData?.earningsGrowth?.raw ?? summary?.financialData?.earningsGrowth;
    const revenueGrowthRaw = summary?.financialData?.revenueGrowth?.raw ?? summary?.financialData?.revenueGrowth;
    const g = typeof earningsGrowthRaw === 'number' ? earningsGrowthRaw : typeof revenueGrowthRaw === 'number' ? revenueGrowthRaw : 0;
    growth = g * 100;
  } catch (e) {}

  const out: StockFundamentals = {
    symbol: normalizeBaseSymbol(inputSymbol),
    price: Number.isFinite(price) ? price : 0,
    change: Number.isFinite(change) ? change : 0,
    high52: Number.isFinite(high52) ? high52 : 0,
    low52: Number.isFinite(low52) ? low52 : 0,
    peRatio: Number.isFinite(peRatio) ? peRatio : 0,
    pegRatio: Number.isFinite(pegRatio) ? pegRatio : 0,
    roe: Number.isFinite(roe) ? roe : 0,
    debtToEquity: Number.isFinite(debtToEquity) ? debtToEquity : 0,
    growth: Number.isFinite(growth) ? growth : 0,
  };

  cache.set(inputSymbol, { ts: Date.now(), data: out });
  return out;
};

const mapLimit = async <T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> => {
  const out: R[] = [];
  let idx = 0;
  const worker = async () => {
    while (idx < items.length) {
      const current = items[idx++];
      out.push(await fn(current));
    }
  };
  const workers = Array.from({ length: Math.max(1, limit) }, () => worker());
  await Promise.all(workers);
  return out;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const symbols = (req.body?.symbols || []) as string[];
  if (!Array.isArray(symbols) || symbols.length === 0) {
    res.status(400).json({ error: 'Missing symbols' });
    return;
  }

  if (symbols.length > 120) {
    res.status(400).json({ error: 'Too many symbols' });
    return;
  }

  try {
    const results = await mapLimit(symbols, 6, async (sym) => {
      try {
        const d = await toFundamentals(sym);
        return { sym, d };
      } catch (e) {
        return { sym, d: null as any };
      }
    });

    const payload: Record<string, StockFundamentals> = {};
    for (const r of results) {
      if (r.d && r.d.price > 0) payload[r.sym] = r.d;
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.status(200).json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch fundamentals' });
  }
}
