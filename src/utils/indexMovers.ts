import { NIFTY50_WEIGHTS } from '../data/nifty50Weights';

export interface IndexContribution {
  symbol: string;
  pts: number; // index points this stock added (+) or removed (−) today
  change: number; // stock % change
  weight: number; // current weight in the index, %
}

/**
 * Index points contributed by each stock: units_i × (price − prevClose) scaled so that
 * Σ units_i × prevClose_i equals the index's previous close. units_i = baseWeight_i / basePrice_i.
 */
export function niftyContributions(
  quotes: Record<string, { price: number; previousClose: number } | undefined>,
  indexPrevClose: number
): { rows: IndexContribution[]; total: number; covered: number } {
  const have = NIFTY50_WEIGHTS.filter(w => {
    const q = quotes[w.symbol];
    return q && q.price > 0 && q.previousClose > 0;
  });
  if (have.length === 0 || !(indexPrevClose > 0)) return { rows: [], total: 0, covered: 0 };

  // Use every constituent's previous close for the scale (missing quotes fall back to base price)
  const prevValue = NIFTY50_WEIGHTS.reduce((sum, w) => {
    const q = quotes[w.symbol];
    const prev = q && q.previousClose > 0 ? q.previousClose : w.basePrice;
    return sum + (w.weight / w.basePrice) * prev;
  }, 0);
  const scale = indexPrevClose / prevValue;

  const rows = have.map(w => {
    const q = quotes[w.symbol]!;
    const units = w.weight / w.basePrice;
    return {
      symbol: w.symbol,
      pts: units * (q.price - q.previousClose) * scale,
      change: (q.price / q.previousClose - 1) * 100,
      weight: ((units * q.previousClose) / prevValue) * 100,
    };
  });
  return { rows, total: rows.reduce((s, r) => s + r.pts, 0), covered: have.length };
}
