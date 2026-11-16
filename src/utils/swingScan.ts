/**
 * Swing (delivery / CNC) setup detection on real daily bars.
 *
 * Evaluates real daily price bars on close:
 *  - BO50: Breakout above prior 50-day high with volume ≥ 1.5× 20-day average, above 200-DMA
 *  - BO20: Breakout above prior 20-day high with volume ≥ 1.5× 20-day average, above 200-DMA
 *  - PB50: Trend pullback — 50-EMA > 200-SMA, low tested 50-EMA (within 1.2%), closed green above 50-EMA
 *  - PB20: High-momentum dip — 20-EMA > 50-EMA > 200-SMA, low touched 20-EMA (within 1%), closed green above 20-EMA
 * Levels: Stop Loss based on key structural support/ATR, Target 1 = 1:2 R:R, Target 2 = 1:3 R:R.
 */

export interface DailyBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SwingSetup = 'BO50' | 'BO20' | 'PB50' | 'PB20' | 'NONE';

export const SWING_SETUP_LABEL: Record<SwingSetup, string> = {
  BO50: '50-Day Breakout',
  BO20: '20-Day Breakout',
  PB50: '50-EMA Pullback',
  PB20: '20-EMA Momentum Dip',
  NONE: 'Consolidation',
};

export const MAX_HOLD_DAYS = 15;

export interface SwingIndicators {
  sma200: number[];
  ema50: number[];
  ema20: number[];
  atr14: number[];
  vol20: number[]; // average volume of the 20 bars prior to i
}

export function computeIndicators(bars: DailyBar[]): SwingIndicators {
  const n = bars.length;
  const sma200: number[] = new Array(n).fill(NaN);
  const ema50: number[] = new Array(n).fill(NaN);
  const ema20: number[] = new Array(n).fill(NaN);
  const atr14: number[] = new Array(n).fill(NaN);
  const vol20: number[] = new Array(n).fill(NaN);
  let sum200 = 0;
  let sumV = 0;
  let ema50Val = 0;
  let ema20Val = 0;
  let atr = 0;

  for (let i = 0; i < n; i++) {
    const b = bars[i];
    sum200 += b.close;
    if (i >= 200) sum200 -= bars[i - 200].close;
    if (i >= 199) sma200[i] = sum200 / 200;

    ema50Val = i === 0 ? b.close : ema50Val + ((b.close - ema50Val) * 2) / 51;
    ema50[i] = ema50Val;

    ema20Val = i === 0 ? b.close : ema20Val + ((b.close - ema20Val) * 2) / 21;
    ema20[i] = ema20Val;

    const prevClose = i > 0 ? bars[i - 1].close : b.close;
    const tr = Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
    atr = i < 14 ? (atr * i + tr) / (i + 1) : (atr * 13 + tr) / 14;
    atr14[i] = atr;

    if (i >= 20) vol20[i] = sumV / 20;
    sumV += b.volume;
    if (i >= 20) sumV -= bars[i - 20].volume;
  }
  return { sma200, ema50, ema20, atr14, vol20 };
}

export const priorHigh = (bars: DailyBar[], i: number, days: number): number => {
  let m = -Infinity;
  for (let k = Math.max(0, i - days); k < i; k++) {
    if (bars[k].high > m) m = bars[k].high;
  }
  return m;
};

export const priorLow = (bars: DailyBar[], i: number, days: number): number => {
  let m = Infinity;
  for (let k = Math.max(0, i - days); k < i; k++) {
    if (bars[k].low < m) m = bars[k].low;
  }
  return m;
};

/** Setup detection on bar i close: BO50 > BO20 > PB50 > PB20 > NONE */
export function detectSetup(bars: DailyBar[], ind: SwingIndicators, i: number): SwingSetup {
  if (i < 200) return 'NONE';
  const b = bars[i];
  const above200 = b.close > ind.sma200[i];
  const volOk = ind.vol20[i] > 0 && b.volume >= 1.4 * ind.vol20[i];

  // 1. Breakouts with volume above 200-DMA
  if (above200 && volOk && b.close > priorHigh(bars, i, 50)) return 'BO50';
  if (above200 && volOk && b.close > priorHigh(bars, i, 20)) return 'BO20';

  // 2. 50-EMA Pullback
  const e50 = ind.ema50[i];
  if (above200 && e50 > ind.sma200[i] && b.low <= e50 * 1.015 && b.close > e50 && b.close >= b.open) {
    return 'PB50';
  }

  // 3. 20-EMA Momentum Dip
  const e20 = ind.ema20[i];
  if (above200 && e20 > e50 && b.low <= e20 * 1.01 && b.close > e20 && b.close >= b.open) {
    return 'PB20';
  }

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
  ema20: number;
  ema50: number;
  sma200: number;
  return1m: number;
  return3m: number;
  barDate: string; // IST YYYY-MM-DD
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
  const high20 = priorHigh(bars, i, 20);
  const high50 = priorHigh(bars, i, 50);
  const volRatio = ind.vol20[i] > 0 ? b.volume / ind.vol20[i] : 1;
  const ema20 = ind.ema20[i];
  const ema50 = ind.ema50[i];
  const sma200 = ind.sma200[i];

  // Dynamic, structural Stop Loss and Target Calculation
  let stopLoss: number;
  if (setup === 'BO50' || setup === 'BO20') {
    // Breakout SL: just below breakout candle or 1.6x ATR
    stopLoss = Math.max(entry - 1.6 * atr, b.low * 0.992);
  } else if (setup === 'PB50') {
    // 50-EMA SL: just below the 50-EMA or day low
    stopLoss = Math.min(b.low * 0.992, ema50 * 0.988);
  } else if (setup === 'PB20') {
    // 20-EMA SL: just below the 20-EMA or day low
    stopLoss = Math.min(b.low * 0.992, ema20 * 0.99);
  } else {
    stopLoss = entry - 1.8 * atr;
  }

  // Ensure risk is between 1.5% and 5.5% of stock price for healthy swing trading
  const minRisk = entry * 0.015;
  const maxRisk = entry * 0.055;
  let risk = entry - stopLoss;
  if (risk < minRisk) {
    risk = minRisk;
    stopLoss = entry - risk;
  } else if (risk > maxRisk) {
    risk = maxRisk;
    stopLoss = entry - risk;
  }

  const target1 = entry + 2.0 * risk; // 1:2 R:R
  const target2 = entry + 3.0 * risk; // 1:3 R:R

  let reason: string;
  if (setup === 'BO50') {
    reason = `50-Day High Breakout above ${inr(high50)} on ${volRatio.toFixed(1)}× volume. Strong momentum above 200-DMA.`;
  } else if (setup === 'BO20') {
    reason = `20-Day Breakout above ${inr(high20)} with ${volRatio.toFixed(1)}× volume expansion. Short-term momentum continuation.`;
  } else if (setup === 'PB50') {
    reason = `50-EMA Support Bounce: Low (${inr(b.low)}) tested 50-EMA (${inr(ema50)}) and printed green reversal candle.`;
  } else if (setup === 'PB20') {
    reason = `20-EMA Fast Momentum Dip: Strong uptrend stock held 20-EMA (${inr(ema20)}) and bounced into close.`;
  } else if (b.close < sma200) {
    reason = `Trading below 200-DMA (${inr(sma200)}) — Downtrend environment, long swing setups filtered out.`;
  } else {
    reason = `Above 200-DMA (${inr(sma200)}); ${pct(b.close, high20).toFixed(1)}% from 20D high, ${pct(b.close, ema50).toFixed(1)}% from 50-EMA. Waiting for breakout.`;
  }

  return {
    setup,
    price: b.close,
    change: pct(b.close, bars[i - 1].close),
    volRatio,
    atr,
    entry,
    stopLoss,
    target1,
    target2,
    high20,
    high50,
    ema20,
    ema50,
    sma200,
    return1m: pct(b.close, bars[Math.max(0, i - 21)].close),
    return3m: pct(b.close, bars[Math.max(0, i - 63)].close),
    barDate: istDate(b.timestamp),
    reason,
  };
}
