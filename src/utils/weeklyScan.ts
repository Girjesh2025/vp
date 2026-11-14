// Weekly Breakout / Breakdown scanner.
// Weekly candles are built from daily bars (Mon-Fri, IST) instead of Yahoo's 1wk
// interval, so the running week is known exactly (days traded, partial volume).
//
// Rules:
//  - Base = previous 8 completed weeks. Level = their highest high / lowest low.
//  - BREAKOUT: weekly close (live price for a running week) above base high + buffer,
//    and price above the 200-day average. BREAKDOWN mirrors it below the 200-DMA.
//  - WATCH: within 2% of the level but not through it yet (shown separately, never as a break).
//  - Buffer = max(0.15% of level, 0.25 x weekly ATR) so a 1-paisa poke doesn't count.
//  - Volume = this week's volume vs the 10-week average, pro-rated by days traded.

import type { IntradayBar } from './intradayHunter';

export interface WeeklyBar {
  weekStart: string; // IST Monday YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  days: number;
}

export type WeeklyStatus = 'BREAKOUT' | 'BREAKDOWN' | 'WATCH UP' | 'WATCH DOWN';

export interface WeeklyAnalysis {
  status: WeeklyStatus;
  level: number;            // 8-week high (up) or low (down)
  breakPct: number;         // % beyond the level (positive) or distance still to go (negative)
  weekClosed: boolean;      // false = current week still trading, close may change
  fresh: boolean;           // first week through the level (previous week was not)
  volumeRatio: number | null;
  weeklyRsi: number | null;
  dma200: number;
  daysInWeek: number;
}

const BASE_WEEKS = 8;
const WATCH_PCT = 2;
const VOL_WEEKS = 10;

const istDate = (ts: number) => new Date((ts + 19800) * 1000);
const istDateStr = (ts: number) => istDate(ts).toISOString().slice(0, 10);

const mondayOf = (ymd: string): string => {
  const d = new Date(`${ymd}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
};

export const buildWeeklyBars = (daily: IntradayBar[]): WeeklyBar[] => {
  const weeks: WeeklyBar[] = [];
  for (const b of [...daily].sort((x, y) => x.timestamp - y.timestamp)) {
    const wk = mondayOf(istDateStr(b.timestamp));
    const cur = weeks[weeks.length - 1];
    if (cur && cur.weekStart === wk) {
      cur.high = Math.max(cur.high, b.high);
      cur.low = Math.min(cur.low, b.low);
      cur.close = b.close;
      cur.volume += b.volume || 0;
      cur.days += 1;
    } else {
      weeks.push({ weekStart: wk, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0, days: 1 });
    }
  }
  return weeks;
};

/** True once the IST week of `now` is over (Friday after 15:30, or the weekend). */
export const isWeekOver = (weekStart: string, now: Date = new Date()): boolean => {
  const nowTs = Math.floor(now.getTime() / 1000);
  const today = istDateStr(nowTs);
  if (mondayOf(today) !== weekStart) return today > weekStart;
  const ist = istDate(nowTs);
  const dow = ist.getUTCDay(); // 0 Sun .. 6 Sat
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return dow === 6 || dow === 0 || (dow === 5 && mins >= 15 * 60 + 30);
};

const rsi = (closes: number[], period = 14): number | null => {
  if (closes.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let ag = gain / period, al = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
};

const baseLevels = (weeks: WeeklyBar[], endIdx: number) => {
  const base = weeks.slice(Math.max(0, endIdx - BASE_WEEKS), endIdx);
  if (base.length < BASE_WEEKS) return null;
  let atr = 0;
  for (let k = 0; k < base.length; k++) {
    const prevClose = weeks[endIdx - base.length + k - 1]?.close ?? base[k].open;
    atr += Math.max(base[k].high - base[k].low, Math.abs(base[k].high - prevClose), Math.abs(base[k].low - prevClose));
  }
  atr /= base.length;
  const high = Math.max(...base.map(b => b.high));
  const low = Math.min(...base.map(b => b.low));
  return { high, low, upBuf: Math.max(high * 0.0015, atr * 0.25), downBuf: Math.max(low * 0.0015, atr * 0.25) };
};

/**
 * Analyse one stock. `livePrice` replaces the latest daily close when that bar is today
 * (Yahoo's intraday daily bar can lag the live quote).
 */
export const analyzeWeekly = (daily: IntradayBar[], livePrice?: number, now: Date = new Date()): WeeklyAnalysis | null => {
  if (daily.length < 220) return null;
  const sorted = [...daily].sort((a, b) => a.timestamp - b.timestamp);
  const todayStr = istDateStr(Math.floor(now.getTime() / 1000));
  if (livePrice && livePrice > 0 && istDateStr(sorted[sorted.length - 1].timestamp) === todayStr) {
    const last = { ...sorted[sorted.length - 1] };
    last.close = livePrice;
    last.high = Math.max(last.high, livePrice);
    last.low = Math.min(last.low, livePrice);
    sorted[sorted.length - 1] = last;
  }

  const closes = sorted.map(b => b.close);
  const dma200 = closes.slice(-200).reduce((a, v) => a + v, 0) / 200;
  const weeks = buildWeeklyBars(sorted);
  const ci = weeks.length - 1;
  const cur = weeks[ci];
  const lv = baseLevels(weeks, ci);
  if (!lv) return null;

  const price = cur.close;
  const weekClosed = isWeekOver(cur.weekStart, now);

  const prevVols = weeks.slice(Math.max(0, ci - VOL_WEEKS), ci).map(w => w.volume).filter(v => v > 0);
  const avgVol = prevVols.length ? prevVols.reduce((a, v) => a + v, 0) / prevVols.length : 0;
  const expected = avgVol * Math.min(1, cur.days / 5);
  const volumeRatio = expected > 0 ? Number((cur.volume / expected).toFixed(2)) : null;

  const weeklyRsi = rsi(weeks.map(w => w.close));

  // Was the previous week already through its own level? (then this is not a fresh break)
  const prevLv = baseLevels(weeks, ci - 1);
  const prevWeek = weeks[ci - 1];

  const common = { weekClosed, volumeRatio, weeklyRsi: weeklyRsi === null ? null : Number(weeklyRsi.toFixed(1)), dma200, daysInWeek: cur.days };

  if (price > dma200) {
    if (price > lv.high + lv.upBuf) {
      const fresh = !prevLv || prevWeek.close <= prevLv.high + prevLv.upBuf;
      return { status: 'BREAKOUT', level: lv.high, breakPct: Number((((price - lv.high) / lv.high) * 100).toFixed(2)), fresh, ...common };
    }
    const gap = ((lv.high - price) / lv.high) * 100;
    if (gap >= 0 && gap <= WATCH_PCT) {
      return { status: 'WATCH UP', level: lv.high, breakPct: Number((-gap).toFixed(2)), fresh: false, ...common };
    }
  } else if (price < dma200) {
    if (price < lv.low - lv.downBuf) {
      const fresh = !prevLv || prevWeek.close >= prevLv.low - prevLv.downBuf;
      return { status: 'BREAKDOWN', level: lv.low, breakPct: Number((((lv.low - price) / lv.low) * 100).toFixed(2)), fresh, ...common };
    }
    const gap = ((price - lv.low) / lv.low) * 100;
    if (gap >= 0 && gap <= WATCH_PCT) {
      return { status: 'WATCH DOWN', level: lv.low, breakPct: Number((-gap).toFixed(2)), fresh: false, ...common };
    }
  }
  return null;
};

/** Weekly % change of an index/stock from daily bars: latest close vs last close of the previous week. */
export const weeklyChangePct = (daily: IntradayBar[]): number | null => {
  const weeks = buildWeeklyBars(daily);
  if (weeks.length < 2) return null;
  const prev = weeks[weeks.length - 2].close;
  return prev > 0 ? ((weeks[weeks.length - 1].close - prev) / prev) * 100 : null;
};
