// Breakout Gems: detects real level breakouts from 5-minute bars.
// Levels (strongest first): prior 52-week high/low, previous day high/low (PDH/PDL),
// 15-minute opening range high/low (ORB). A breakout counts only when a *completed*
// 5m candle closed beyond the level and the current price is still beyond it.

import { splitSessions, formatIstTime, type IntradayBar } from './intradayHunter';

export type BreakoutKind = '52W HIGH' | '52W LOW' | 'PDH BREAK' | 'PDL BREAK' | 'ORB HIGH' | 'ORB LOW';

export interface BreakoutSignal {
  kind: BreakoutKind;
  isBull: boolean;
  level: number;
  time: string;        // HH:MM IST when the breakout candle closed (bar start + 5 min)
  beyondPct: number;   // how far the current price is beyond the level, %
  gap: boolean;        // the day opened beyond the level (gap, not an intraday break)
  priority: number;    // 3 = 52W, 2 = PDH/PDL, 1 = ORB
}

const BAR_SEC = 300;
const OR_BARS = 3; // 09:15-09:30

export const BREAKOUT_PRIORITY: Record<BreakoutKind, number> = {
  '52W HIGH': 3, '52W LOW': 3, 'PDH BREAK': 2, 'PDL BREAK': 2, 'ORB HIGH': 1, 'ORB LOW': 1,
};

/** Highest high / lowest low of daily bars before today's IST date (prior 52-week extremes). */
export const prior52WeekRange = (dailyBars: IntradayBar[], todayIst: string): { high: number; low: number } | null => {
  const prior = dailyBars.filter(b => new Date((b.timestamp + 19800) * 1000).toISOString().slice(0, 10) < todayIst);
  if (prior.length < 200) return null; // need ~a year of history to call it a 52-week level
  const last = prior.slice(-252);
  return { high: Math.max(...last.map(b => b.high)), low: Math.min(...last.map(b => b.low)) };
};

export const detectBreakout = (
  bars: IntradayBar[],
  price: number,
  opts: { prior52High?: number | null; prior52Low?: number | null; now?: Date } = {}
): BreakoutSignal | null => {
  const sessions = splitSessions(bars);
  if (sessions.length < 2 || !(price > 0)) return null;
  const today = sessions[sessions.length - 1];
  const prev = sessions[sessions.length - 2];
  const nowSec = Math.floor((opts.now ?? new Date()).getTime() / 1000);
  // Only completed candles can confirm a break (the live candle's close is just the last tick)
  const closed = today.filter(b => b.timestamp + BAR_SEC <= nowSec);
  if (!closed.length) return null;

  const pdh = Math.max(...prev.map(b => b.high));
  const pdl = Math.min(...prev.map(b => b.low));
  const orBars = today.slice(0, OR_BARS);
  const orReady = closed.length > OR_BARS;
  const orh = Math.max(...orBars.map(b => b.high));
  const orl = Math.min(...orBars.map(b => b.low));

  const candidates: Array<{ kind: BreakoutKind; level: number; isBull: boolean; from: number }> = [];
  if (opts.prior52High) candidates.push({ kind: '52W HIGH', level: opts.prior52High, isBull: true, from: 0 });
  if (opts.prior52Low) candidates.push({ kind: '52W LOW', level: opts.prior52Low, isBull: false, from: 0 });
  candidates.push({ kind: 'PDH BREAK', level: pdh, isBull: true, from: 0 });
  candidates.push({ kind: 'PDL BREAK', level: pdl, isBull: false, from: 0 });
  if (orReady) {
    candidates.push({ kind: 'ORB HIGH', level: orh, isBull: true, from: OR_BARS });
    candidates.push({ kind: 'ORB LOW', level: orl, isBull: false, from: OR_BARS });
  }

  const found: BreakoutSignal[] = [];
  for (const c of candidates) {
    const beyond = (v: number) => (c.isBull ? v > c.level : v < c.level);
    if (!beyond(price)) continue; // not holding the break now
    // Latest crossing: first closed candle of the current streak of closes beyond the level
    let idx = -1;
    for (let i = closed.length - 1; i >= c.from; i--) {
      if (beyond(closed[i].close)) idx = i;
      else break;
    }
    if (idx < 0) continue;
    const gap = idx === 0 && beyond(today[0].open);
    found.push({
      kind: c.kind,
      isBull: c.isBull,
      level: c.level,
      time: formatIstTime(closed[idx].timestamp + BAR_SEC),
      beyondPct: Number(((Math.abs(price - c.level) / c.level) * 100).toFixed(2)),
      gap,
      priority: BREAKOUT_PRIORITY[c.kind],
    });
  }
  if (!found.length) return null;
  // Strongest level wins; within the same level type prefer the most recent break
  found.sort((a, b) => b.priority - a.priority || b.time.localeCompare(a.time));
  return found[0];
};

export const describeBreakout = (b: BreakoutSignal): string => {
  const lvl = `₹${b.level >= 1000 ? Math.round(b.level).toLocaleString('en-IN') : b.level.toFixed(2)}`;
  const name = b.kind.startsWith('52W') ? (b.isBull ? '52W high' : '52W low')
    : b.kind.startsWith('PD') ? (b.isBull ? 'PDH' : 'PDL')
    : (b.isBull ? 'OR high' : 'OR low');
  return `${b.gap ? 'Gap ' : ''}${b.isBull ? 'above' : 'below'} ${name} ${lvl} · ${b.isBull ? '+' : '−'}${b.beyondPct.toFixed(2)}%`;
};
