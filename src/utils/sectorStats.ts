// Sector Rotation statistics from real daily index closes (Yahoo).
// Every number on the Sector Rotation page is computed here so it can be checked offline.

export interface DailySeries { ts: number[]; close: number[] }

export const IST_OFFSET = 19800;
export const istYmd = (ts: number) => new Date((ts + IST_OFFSET) * 1000).toISOString().slice(0, 10);

/** Trading-day lengths used for "months" */
export const PERIOD_DAYS: Record<number, number> = { 1: 21, 3: 63, 6: 126, 12: 252 };

/** Compound return over the last `days` trading days, % */
export const trailingReturn = (s: DailySeries, days: number, endOffset = 0): number | null => {
  const end = s.close.length - 1 - endOffset;
  const start = end - days;
  if (start < 0) return null;
  return (s.close[end] / s.close[start] - 1) * 100;
};

/** Annualised volatility of daily returns over the last `days`, % */
export const annualVol = (s: DailySeries, days = 252): number | null => {
  const n = s.close.length;
  if (n <= days) return null;
  const r: number[] = [];
  for (let i = n - days; i < n; i++) r.push(s.close[i] / s.close[i - 1] - 1);
  const m = r.reduce((a, v) => a + v, 0) / r.length;
  const sd = Math.sqrt(r.reduce((a, v) => a + (v - m) ** 2, 0) / (r.length - 1));
  return sd * Math.sqrt(252) * 100;
};

/** Month-end closes keyed "YYYY-MM" (IST). The current month's value is month-to-date. */
export const monthEndCloses = (s: DailySeries): Array<{ key: string; close: number }> => {
  const m = new Map<string, number>();
  for (let i = 0; i < s.ts.length; i++) m.set(istYmd(s.ts[i]).slice(0, 7), s.close[i]);
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, close]) => ({ key, close }));
};

/** Monthly % returns keyed "YYYY-MM" (needs the previous month-end close) */
export const monthlyReturns = (s: DailySeries): Map<string, number> => {
  const me = monthEndCloses(s);
  const out = new Map<string, number>();
  for (let i = 1; i < me.length; i++) out.set(me[i].key, (me[i].close / me[i - 1].close - 1) * 100);
  return out;
};

/** 12 calendar-month cells for a year (null where no data / future) */
export const yearRow = (monthly: Map<string, number>, year: number): (number | null)[] =>
  Array.from({ length: 12 }, (_, i) => monthly.get(`${year}-${String(i + 1).padStart(2, '0')}`) ?? null);

/** Seasonality of one calendar month (1-12) over completed past years */
export const seasonality = (monthly: Map<string, number>, month: number, currentYear: number) => {
  const vals: number[] = [];
  for (const [k, v] of monthly) {
    const [y, m] = k.split('-').map(Number);
    if (m === month && y < currentYear) vals.push(v);
  }
  if (!vals.length) return null;
  return {
    years: vals.length,
    avg: vals.reduce((a, v) => a + v, 0) / vals.length,
    upYears: vals.filter(v => v > 0).length,
  };
};

export type RrgQuadrant = 'Leading' | 'Weakening' | 'Lagging' | 'Improving';

/**
 * Relative-rotation position vs a benchmark:
 * rs = sector 3M return − benchmark 3M return; rsMomentum = rs now − rs one month ago.
 */
export const relativeRotation = (s: DailySeries, bench: DailySeries) => {
  const rsNow = diff(trailingReturn(s, 63), trailingReturn(bench, 63));
  const rsPrev = diff(trailingReturn(s, 63, 21), trailingReturn(bench, 63, 21));
  if (rsNow === null || rsPrev === null) return null;
  const rsMomentum = rsNow - rsPrev;
  const quadrant: RrgQuadrant =
    rsNow >= 0 ? (rsMomentum >= 0 ? 'Leading' : 'Weakening') : (rsMomentum >= 0 ? 'Improving' : 'Lagging');
  return { rs: rsNow, rsMomentum, quadrant };
};

const diff = (a: number | null, b: number | null) => (a === null || b === null ? null : a - b);

/** Align a series to the benchmark's last date so both "now"s are the same day */
export const alignTo = (s: DailySeries, bench: DailySeries): DailySeries => {
  const lastDay = istYmd(bench.ts[bench.ts.length - 1]);
  let n = s.ts.length;
  while (n > 0 && istYmd(s.ts[n - 1]) > lastDay) n--;
  return { ts: s.ts.slice(0, n), close: s.close.slice(0, n) };
};
