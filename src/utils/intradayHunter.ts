// Intraday Hunter metrics: real VWAP, time-of-day relative volume and
// relative-strength scoring computed from 5-minute OHLCV bars.
// Pure functions only, so they can be checked outside React.

export interface IntradayBar {
  timestamp: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IntradayMetrics {
  vwap: number | null;
  rvol: number | null;          // today's volume vs avg of prior days up to the same time
  vwapSince: string | null;     // HH:MM (IST) when price last crossed to its current side of VWAP
  moveStart: string | null;     // HH:MM (IST) of the swing low (bull) / high (bear) of the latest move
  sessionDate: string | null;   // YYYY-MM-DD (IST) of the latest session in the data
}

export type HunterTrend = 'STRONG BUY' | 'OUTPERFORM' | 'NEUTRAL' | 'WEAK' | 'BREAKDOWN';

const IST_OFFSET_SEC = 5.5 * 3600;
const MARKET_OPEN_MIN = 9 * 60 + 15;
const MARKET_CLOSE_MIN = 15 * 60 + 30;

const istDayKey = (ts: number) => Math.floor((ts + IST_OFFSET_SEC) / 86400);
const istMinuteOfDay = (ts: number) => Math.floor(((ts + IST_OFFSET_SEC) % 86400) / 60);

export const formatIstTime = (ts: number): string => {
  const m = istMinuteOfDay(ts);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const formatIstDate = (ts: number): string =>
  new Date((ts + IST_OFFSET_SEC) * 1000).toISOString().slice(0, 10);

/** Group bars by IST trading day, keeping only regular-session bars, oldest day first. */
export const splitSessions = (bars: IntradayBar[]): IntradayBar[][] => {
  const byDay = new Map<number, IntradayBar[]>();
  for (const b of bars) {
    const mod = istMinuteOfDay(b.timestamp);
    if (mod < MARKET_OPEN_MIN || mod >= MARKET_CLOSE_MIN) continue;
    const key = istDayKey(b.timestamp);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(b);
  }
  return [...byDay.keys()].sort((a, b) => a - b).map(k => byDay.get(k)!.sort((a, b) => a.timestamp - b.timestamp));
};

/** Volume-weighted average price using typical price; null when there is no volume. */
export const computeVwap = (session: IntradayBar[]): number | null => {
  let pv = 0;
  let vol = 0;
  for (const b of session) {
    if (!(b.volume > 0)) continue;
    pv += ((b.high + b.low + b.close) / 3) * b.volume;
    vol += b.volume;
  }
  return vol > 0 ? pv / vol : null;
};

/**
 * Relative volume at the same time of day: today's cumulative volume divided by the
 * average cumulative volume of prior sessions up to the same minute. This avoids the
 * open-auction volume spike that makes a linear "elapsed fraction" RVOL overstate early.
 */
export const computeTimeOfDayRvol = (today: IntradayBar[], prior: IntradayBar[][]): number | null => {
  if (!today.length) return null;
  const cutoff = istMinuteOfDay(today[today.length - 1].timestamp);
  const todayVol = today.reduce((s, b) => s + (b.volume || 0), 0);
  const priorVols = prior
    .map(day => day.filter(b => istMinuteOfDay(b.timestamp) <= cutoff).reduce((s, b) => s + (b.volume || 0), 0))
    .filter(v => v > 0);
  if (!priorVols.length || todayVol <= 0) return null;
  const avg = priorVols.reduce((s, v) => s + v, 0) / priorVols.length;
  return avg > 0 ? todayVol / avg : null;
};

/** Time when the close last moved to its current side of the running VWAP. */
const findVwapSince = (session: IntradayBar[]): string | null => {
  let pv = 0;
  let vol = 0;
  const sides: Array<{ ts: number; above: boolean }> = [];
  for (const b of session) {
    if (b.volume > 0) {
      pv += ((b.high + b.low + b.close) / 3) * b.volume;
      vol += b.volume;
    }
    if (vol > 0) sides.push({ ts: b.timestamp, above: b.close >= pv / vol });
  }
  if (!sides.length) return null;
  const current = sides[sides.length - 1].above;
  let i = sides.length - 1;
  while (i > 0 && sides[i - 1].above === current) i--;
  return formatIstTime(sides[i].ts);
};

/** Time of the swing low (bull) or swing high (bear) that started the latest move. */
const findMoveStart = (session: IntradayBar[], isBull: boolean): string | null => {
  if (!session.length) return null;
  let idx = 0;
  for (let i = 1; i < session.length; i++) {
    if (isBull ? session[i].low < session[idx].low : session[i].high > session[idx].high) idx = i;
  }
  return formatIstTime(session[idx].timestamp);
};

export const computeIntradayMetrics = (bars: IntradayBar[], isBull: boolean): IntradayMetrics => {
  const sessions = splitSessions(bars);
  const empty: IntradayMetrics = { vwap: null, rvol: null, vwapSince: null, moveStart: null, sessionDate: null };
  if (!sessions.length) return empty;
  const today = sessions[sessions.length - 1];
  return {
    vwap: computeVwap(today),
    rvol: computeTimeOfDayRvol(today, sessions.slice(0, -1)),
    vwapSince: findVwapSince(today),
    moveStart: findMoveStart(today, isBull),
    sessionDate: formatIstDate(today[0].timestamp),
  };
};

export interface HunterInputs {
  change: number;        // stock % change
  rsAlpha: number;       // stock % change minus benchmark % change
  dayRangePos: number;   // 0 = at day low, 1 = at day high
  price: number;
  vwap: number | null;   // real VWAP; null when unavailable
  rvol: number | null;
}

export interface HunterScore {
  rsScore: number;       // 5..99
  rsTrend: HunterTrend;
  hunterScore: number;   // ranking key, higher = stronger confirmed signal
  confirmed: boolean;    // price action agrees with the alpha direction
}

/**
 * Score a stock's relative strength. A signal is "confirmed" only when price action
 * agrees with alpha: bulls above VWAP and in the upper part of the day range,
 * bears below VWAP and in the lower part. Unconfirmed alpha (e.g. a stock up on the
 * day but fading below VWAP) is ranked down and labelled NEUTRAL instead of a buy.
 */
export const scoreHunter = ({ change, rsAlpha, dayRangePos, price, vwap, rvol }: HunterInputs): HunterScore => {
  const bull = rsAlpha >= 0;
  const vwapSide = vwap ? (price >= vwap ? 1 : -1) : 0; // 0 = unknown
  const vwapDistPct = vwap ? ((price - vwap) / vwap) * 100 : 0;

  const vwapAgrees = vwapSide === 0 ? null : (bull ? vwapSide > 0 : vwapSide < 0);
  const rangeAgrees = bull ? dayRangePos >= 0.6 : dayRangePos <= 0.4;
  const confirmed = rangeAgrees && vwapAgrees !== false;

  let raw = 50 + rsAlpha * 8 + (dayRangePos - 0.5) * 20;
  if (vwapSide !== 0) raw += Math.max(-6, Math.min(6, vwapDistPct * 4));
  if (rvol !== null && rvol >= 1.5) raw += bull ? 4 : -4;
  const rsScore = Math.min(99, Math.max(5, Math.round(raw)));

  const strongVolume = rvol === null || rvol >= 1.5;
  let rsTrend: HunterTrend = 'NEUTRAL';
  if (bull && change > 0) {
    if (confirmed && rsAlpha >= 1 && vwapAgrees === true && strongVolume && rsScore >= 70) rsTrend = 'STRONG BUY';
    else if (confirmed) rsTrend = 'OUTPERFORM';
  } else if (!bull && change < 0) {
    if (confirmed && rsAlpha <= -1 && vwapAgrees === true && strongVolume && rsScore <= 30) rsTrend = 'BREAKDOWN';
    else if (confirmed) rsTrend = 'WEAK';
  }

  const confirmFactor = confirmed ? 1 : 0.4;
  const volFactor = rvol === null ? 1 : Math.min(2, Math.max(0.6, Math.sqrt(rvol)));
  const hunterScore = Math.abs(rsAlpha) * confirmFactor * volFactor;

  return { rsScore, rsTrend, hunterScore, confirmed };
};

export type NseMarketStatus = 'OPEN' | 'OPENING' | 'CLOSED';

const toIst = (now: Date) => new Date(now.getTime() + (now.getTimezoneOffset() * 60 + IST_OFFSET_SEC) * 1000);

/** Today's date in IST as YYYY-MM-DD. */
export const istDateString = (now: Date = new Date()): string => {
  const ist = toIst(now);
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
};

/**
 * NSE cash-market status in IST.
 * 09:00-09:15 pre-open session -> OPENING, 09:15-15:30 -> OPEN, otherwise / weekends -> CLOSED.
 * Exchange holidays are detected by the caller from data: pass the IST date of the latest
 * traded session; if it is not today by 09:25 the market did not open (holiday).
 */
export const getNseMarketStatus = (now: Date = new Date(), latestSessionDate?: string | null): NseMarketStatus => {
  const ist = toIst(now);
  const day = ist.getDay();
  if (day === 0 || day === 6) return 'CLOSED';
  const mins = ist.getHours() * 60 + ist.getMinutes();
  if (mins >= 9 * 60 && mins < MARKET_OPEN_MIN) return 'OPENING';
  if (mins >= MARKET_OPEN_MIN && mins < MARKET_CLOSE_MIN) {
    if (latestSessionDate && mins >= 9 * 60 + 25 && latestSessionDate !== istDateString(now)) return 'CLOSED';
    return 'OPEN';
  }
  return 'CLOSED';
};
