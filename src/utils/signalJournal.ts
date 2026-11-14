// Hunter Signal Journal: records each Intraday Hunter signal once per symbol per day
// while the market is open, then grades it against real 5-minute bars with fixed,
// pre-declared rules. Lets the user see whether a signal type actually makes money
// instead of trusting the label.

import type { IntradayBar } from './intradayHunter';
import { formatIstTime } from './intradayHunter';

export const JOURNAL_RULES = {
  targetPct: 1.0,     // book profit at +1.0% in the signal direction
  stopPct: 0.5,       // stop loss at -0.5%
  exitTime: '15:15',  // otherwise exit at the 15:10-15:15 bar close
  costPct: 0.1,       // round-trip brokerage + taxes + slippage estimate
  lastEntry: '14:30', // no new signals after this time (too little time to work)
  firstEntry: '09:20',// skip the opening 5 minutes (quotes are still settling)
} as const;

export type SignalSide = 'LONG' | 'SHORT';
export type ExitReason = 'TARGET' | 'STOP' | 'CLOSE' | 'NO DATA';

export interface JournalSignal {
  id: string;            // `${date}|${symbol}`
  date: string;          // IST YYYY-MM-DD
  symbol: string;
  side: SignalSide;
  trend: string;         // label shown when the signal was taken
  entryTs: number;       // unix seconds
  entryTime: string;     // HH:MM IST
  entryPrice: number;
  alpha: number;
  rvol: number | null;
  outcome?: {
    exitPrice: number;
    exitTime: string;
    reason: ExitReason;
    netPct: number;      // after costs, in the signal direction
  };
}

export interface SignalCandidate {
  symbol: string;
  price: number;
  rsAlpha: number;
  rsTrend: string;
  confirmed: boolean;
  rvol?: number | null;
}

const STORAGE_KEY = 'marketEye.hunterJournal.v1';
const MAX_ENTRIES = 1000;

const isValidSignal = (s: any): s is JournalSignal =>
  s && typeof s.id === 'string' && typeof s.symbol === 'string' && typeof s.entryPrice === 'number' &&
  s.entryPrice > 0 && typeof s.entryTs === 'number' && (s.side === 'LONG' || s.side === 'SHORT');

export const loadJournal = (): JournalSignal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidSignal) : [];
  } catch {
    return [];
  }
};

export const saveJournal = (entries: JournalSignal[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // storage full or blocked: journal simply isn't persisted
  }
};

const hhmmToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Add today's actionable Hunter signals (confirmed STRONG BUY / OUTPERFORM long,
 * BREAKDOWN / WEAK short), first occurrence per symbol per day only.
 */
export const recordSignals = (
  journal: JournalSignal[],
  rows: SignalCandidate[],
  today: string,
  now: Date = new Date()
): JournalSignal[] => {
  const nowTs = Math.floor(now.getTime() / 1000);
  const nowTime = formatIstTime(nowTs);
  const nowMin = hhmmToMin(nowTime);
  if (nowMin < hhmmToMin(JOURNAL_RULES.firstEntry) || nowMin > hhmmToMin(JOURNAL_RULES.lastEntry)) return journal;

  const seen = new Set(journal.map(s => s.id));
  const added: JournalSignal[] = [];
  for (const r of rows) {
    if (!r.confirmed || !(r.price > 0)) continue;
    const side: SignalSide | null =
      r.rsTrend === 'STRONG BUY' || r.rsTrend === 'OUTPERFORM' ? 'LONG' :
      r.rsTrend === 'BREAKDOWN' || r.rsTrend === 'WEAK' ? 'SHORT' : null;
    if (!side) continue;
    const id = `${today}|${r.symbol}`;
    if (seen.has(id)) continue;
    seen.add(id);
    added.push({
      id, date: today, symbol: r.symbol, side, trend: r.rsTrend,
      entryTs: nowTs, entryTime: nowTime, entryPrice: r.price,
      alpha: r.rsAlpha, rvol: r.rvol ?? null,
    });
  }
  return added.length ? [...journal, ...added] : journal;
};

/**
 * Grade one signal on 5m bars: bars that start at/after entry on the signal date.
 * If a bar touches both stop and target, the stop is assumed first (conservative).
 * Returns undefined while the outcome is not yet known (trade still running).
 */
export const evaluateSignal = (sig: JournalSignal, bars: IntradayBar[], now: Date = new Date()): JournalSignal['outcome'] => {
  const { targetPct, stopPct, exitTime, costPct } = JOURNAL_RULES;
  const long = sig.side === 'LONG';
  const target = sig.entryPrice * (1 + (long ? targetPct : -targetPct) / 100);
  const stop = sig.entryPrice * (1 - (long ? stopPct : -stopPct) / 100);
  const exitMin = hhmmToMin(exitTime);

  const dayBars = bars
    .filter(b => b.timestamp >= sig.entryTs && formatIstDate(b.timestamp) === sig.date)
    .sort((a, b) => a.timestamp - b.timestamp);

  const net = (exit: number) => {
    const gross = ((exit - sig.entryPrice) / sig.entryPrice) * 100 * (long ? 1 : -1);
    return Number((gross - costPct).toFixed(2));
  };

  let lastBeforeExit: IntradayBar | null = null;
  for (const b of dayBars) {
    const barMin = hhmmToMin(formatIstTime(b.timestamp));
    if (barMin >= exitMin) break;
    const hitStop = long ? b.low <= stop : b.high >= stop;
    const hitTarget = long ? b.high >= target : b.low <= target;
    if (hitStop) return { exitPrice: Number(stop.toFixed(2)), exitTime: formatIstTime(b.timestamp), reason: 'STOP', netPct: net(stop) };
    if (hitTarget) return { exitPrice: Number(target.toFixed(2)), exitTime: formatIstTime(b.timestamp), reason: 'TARGET', netPct: net(target) };
    lastBeforeExit = b;
  }

  // Not stopped or targeted: only final once the exit time has passed for that day
  const nowTs = Math.floor(now.getTime() / 1000);
  const dayOver = formatIstDate(nowTs) > sig.date || hhmmToMin(formatIstTime(nowTs)) >= exitMin + 5;
  if (!dayOver) return undefined;
  if (!lastBeforeExit) return { exitPrice: sig.entryPrice, exitTime: '--', reason: 'NO DATA', netPct: 0 };
  return { exitPrice: lastBeforeExit.close, exitTime: exitTime, reason: 'CLOSE', netPct: net(lastBeforeExit.close) };
};

const formatIstDate = (ts: number): string =>
  new Date((ts + 5.5 * 3600) * 1000).toISOString().slice(0, 10);

export interface ScoreLine {
  label: string;
  trades: number;
  winRate: number;   // %
  avgNet: number;    // % per trade after costs
  totalNet: number;  // sum of % per trade
}

/** Stats per signal label plus an "All signals" line; NO DATA outcomes are excluded. */
export const summarize = (journal: JournalSignal[]): ScoreLine[] => {
  const graded = journal.filter(s => s.outcome && s.outcome.reason !== 'NO DATA');
  const line = (label: string, list: JournalSignal[]): ScoreLine => {
    const nets = list.map(s => s.outcome!.netPct);
    const total = nets.reduce((a, v) => a + v, 0);
    return {
      label,
      trades: list.length,
      winRate: list.length ? (nets.filter(v => v > 0).length / list.length) * 100 : 0,
      avgNet: list.length ? total / list.length : 0,
      totalNet: total,
    };
  };
  const labels = ['STRONG BUY', 'OUTPERFORM', 'WEAK', 'BREAKDOWN'];
  return [line('All signals', graded), ...labels.map(l => line(l, graded.filter(s => s.trend === l)))];
};
