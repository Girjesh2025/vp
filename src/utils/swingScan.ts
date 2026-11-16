/**
 * Swing (delivery / CNC) setup detection on real daily bars.
 *
 * Setups are evaluated on a bar's close (during market hours the last bar is still forming):
 *  - BO20: close above the prior 20-day high, volume ≥ 1.5× its 20-day average, close above the 200-day SMA
 *  - BO50: same, against the prior 50-day high
 *  - PB50: uptrend (close and 50-EMA above the 200-day SMA), the day's low touched the 50-EMA (within 1%),
 *          and the bar closed green above the 50-EMA
 * Levels: stop = entry − 2×ATR(14), target 1 = 2R, target 2 = 3R.
 *
 * Backtest 2016-11 → 2026-11 on the 40-stock list (entry next open, 0.25% round-trip cost, max 20 days,
 * see SWING_BACKTEST). In 2021-26 no setup clearly beat random entries (BO20 slightly,
 * on only 256 trades), so these are a watch list, not buy signals.
 */

export interface DailyBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SwingSetup = 'BO50' | 'BO20' | 'PB50' | 'NONE';

export const SWING_SETUP_LABEL: Record<SwingSetup, string> = {
  BO50: '50-Day Breakout',
  BO20: '20-Day Breakout',
  PB50: '50-EMA Pullback',
  NONE: 'No Setup',
};

export const SL_ATR = 2;
export const T1_R = 2;
export const T2_R = 3;
export const MAX_HOLD_DAYS = 20;

/** Measured with detectSetup (avg net % per trade, win %) — entry next open, 2ATR stop, 3R target, max 20 days,
 *  0.25% cost, 5-day cooldown. Random = any stock every 5th day with the same exits (today's list → survivorship bias). */
export const SWING_BACKTEST = {
  period: '2021-11 → 2026-11',
  rows: [
    { setup: 'BO50' as SwingSetup, trades: 680, avg: -0.35, win: 40 },
    { setup: 'BO20' as SwingSetup, trades: 256, avg: 0.56, win: 43 },
    { setup: 'PB50' as SwingSetup, trades: 1480, avg: 0.39, win: 43 },
  ],
  random: { trades: 9655, avg: 0.36, win: 43 },
};

export interface SwingIndicators {
  sma200: number[];
  ema50: number[];
  atr14: number[];
  vol20: number[]; // average volume of the 20 bars BEFORE i
}

export function computeIndicators(bars: DailyBar[]): SwingIndicators {
  const n = bars.length;
  const sma200: number[] = new Array(n).fill(NaN);
  const ema50: number[] = new Array(n).fill(NaN);
  const atr14: number[] = new Array(n).fill(NaN);
  const vol20: number[] = new Array(n).fill(NaN);
  let sum200 = 0;
  let sumV = 0;
  let ema = 0;
  let atr = 0;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    sum200 += b.close;
    if (i >= 200) sum200 -= bars[i - 200].close;
    if (i >= 199) sma200[i] = sum200 / 200;

    ema = i === 0 ? b.close : ema + ((b.close - ema) * 2) / 51;
    ema50[i] = ema;

    const prevClose = i > 0 ? bars[i - 1].close : b.close;
    const tr = Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
    atr = i < 14 ? (atr * i + tr) / (i + 1) : (atr * 13 + tr) / 14;
    atr14[i] = atr;

    if (i >= 20) vol20[i] = sumV / 20;
    sumV += b.volume;
    if (i >= 20) sumV -= bars[i - 20].volume;
  }
  return { sma200, ema50, atr14, vol20 };
}

const priorHigh = (bars: DailyBar[], i: number, days: number) => {
  let m = -Infinity;
  for (let k = Math.max(0, i - days); k < i; k++) m = Math.max(m, bars[k].high);
  return m;
};

/** Which setup (if any) bar i closes into. Strongest first: BO50 > BO20 > PB50. */
export function detectSetup(bars: DailyBar[], ind: SwingIndicators, i: number): SwingSetup {
  if (i < 200) return 'NONE';
  const b = bars[i];
  const above200 = b.close > ind.sma200[i];
  const volOk = ind.vol20[i] > 0 && b.volume > 1.5 * ind.vol20[i];
  if (above200 && volOk && b.close > priorHigh(bars, i, 50)) return 'BO50';
  if (above200 && volOk && b.close > priorHigh(bars, i, 20)) return 'BO20';
  const e = ind.ema50[i];
  if (above200 && e > ind.sma200[i] && b.low <= e * 1.01 && b.close > e && b.close > b.open) return 'PB50';
  return 'NONE';
}

export interface SwingAnalysis {
  setup: SwingSetup;
  price: number;
  change: number; // % vs previous close
  volRatio: number; // today volume / 20-day average
  atr: number;
  entry: number;
  stopLoss: number;
  target1: number;
  target2: number;
  high20: number;
  high50: number;
  ema50: number;
  sma200: number;
  return1m: number;
  return3m: number;
  barDate: string; // IST YYYY-MM-DD of the bar evaluated
  reason: string;
}

const pct = (a: number, b: number) => (b > 0 ? (a / b - 1) * 100 : 0);
const istDate = (ts: number) => new Date((ts + 19800) * 1000).toISOString().slice(0, 10);
const inr = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`;

export function analyzeSwing(bars: DailyBar[]): SwingAnalysis | null {
  const i = bars.length - 1;
  if (i < 200) return null;
  const ind = computeIndicators(bars);
  const b = bars[i];
  const setup = detectSetup(bars, ind, i);
  const atr = ind.atr14[i];
  const entry = b.close;
  const risk = SL_ATR * atr;
  const high20 = priorHigh(bars, i, 20);
  const high50 = priorHigh(bars, i, 50);
  const volRatio = ind.vol20[i] > 0 ? b.volume / ind.vol20[i] : 0;
  const ema50 = ind.ema50[i];
  const sma200 = ind.sma200[i];

  let reason: string;
  if (setup === 'BO50' || setup === 'BO20') {
    const lvl = setup === 'BO50' ? high50 : high20;
    reason = `Closed ${inr(b.close)} above the ${setup === 'BO50' ? 50 : 20}-day high ${inr(lvl)} on ${volRatio.toFixed(1)}× avg volume; above 200-DMA`;
  } else if (setup === 'PB50') {
    reason = `Uptrend pullback: low ${inr(b.low)} touched 50-EMA ${inr(ema50)}, closed green above it; above 200-DMA`;
  } else if (b.close < sma200) {
    reason = `Below 200-DMA ${inr(sma200)} (${pct(b.close, sma200).toFixed(1)}%) — downtrend, no long setup`;
  } else {
    reason = `Above 200-DMA; ${pct(b.close, high20).toFixed(1)}% from 20-day high ${inr(high20)}, ${pct(b.close, ema50).toFixed(1)}% from 50-EMA`;
  }

  return {
    setup,
    price: b.close,
    change: pct(b.close, bars[i - 1].close),
    volRatio,
    atr,
    entry,
    stopLoss: entry - risk,
    target1: entry + T1_R * risk,
    target2: entry + T2_R * risk,
    high20,
    high50,
    ema50,
    sma200,
    return1m: pct(b.close, bars[i - 21].close),
    return3m: pct(b.close, bars[i - 63].close),
    barDate: istDate(b.timestamp),
    reason,
  };
}
