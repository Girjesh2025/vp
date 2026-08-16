import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Layers,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
} from 'lightweight-charts';
import { fetchHistoricalOHLCV, fetchStockPrice, isMarketOpen, type YahooOHLCVBar } from '../utils/priceApi';

type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'MIDCPNIFTY';
type IntervalOption = '1m' | '3m' | '5m' | '15m';
type ViewMode = 'live' | 'historical';

type OptionLeg = {
  openInterest?: number;
  changeinOpenInterest?: number;
  impliedVolatility?: number;
  lastPrice?: number;
};

type OptionChainRow = {
  strikePrice?: number;
  expiryDate?: string;
  CE?: OptionLeg;
  PE?: OptionLeg;
};

type OptionChainResponse = {
  filtered?: {
    underlyingValue?: number;
    data?: OptionChainRow[];
  };
  records?: {
    underlyingValue?: number;
    timestamp?: string;
    expiryDates?: string[];
    data?: OptionChainRow[];
  };
};

type StrikeRow = {
  strike: number;
  ceOi: number;
  peOi: number;
  ceChg: number;
  peChg: number;
  ceIv: number;
  peIv: number;
  ceLtp: number;
  peLtp: number;
  totalOi: number;
  dominantSide: 'put' | 'call';
  isATM: boolean;
};

type SessionPoint = {
  ts: number;
  label: string;
  callBuild: number;
  putBuild: number;
  diff: number;
  pcr: number;
  spot: number | null;
};

type SnapshotMetrics = {
  totalCeOi: number;
  totalPeOi: number;
  totalCeChg: number;
  totalPeChg: number;
  pcr: number;
  supportStrike: number | null;
  resistanceStrike: number | null;
  maxPainStrike: number | null;
  atmStrike: number | null;
  atmIv: number;
  atmPremium: number;
};

type MetricTileProps = {
  label: string;
  value: string;
  subtext: string;
  tone: 'neutral' | 'bullish' | 'bearish';
  icon: ReactNode;
};

type KeyLevelItem = {
  label: string;
  value: string;
  subtext: string;
  tone: 'neutral' | 'bullish' | 'bearish';
  icon: ReactNode;
};

type TraderState = 'uptrend' | 'downtrend' | 'sideways';
type CandleRequest = {
  range: string;
  interval: string;
  bars: number;
  aggregateMinutes?: number | null;
  filterToLatestSession?: boolean;
};

type ChartHoverState = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  smartOi: number | null;
};

const INSTRUMENTS: Instrument[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
const INTERVALS: IntervalOption[] = ['1m', '3m', '5m', '15m'];
const LOT_SIZE_MAP: Record<Instrument, number> = {
  NIFTY: 50,
  BANKNIFTY: 35,
  FINNIFTY: 65,
  MIDCPNIFTY: 120,
};

const INDEX_TICKER_MAP: Record<Instrument, string> = {
  NIFTY: '^NSEI',
  BANKNIFTY: '^NSEBANK',
  FINNIFTY: 'NIFTY_FIN_SERVICE.NS',
  MIDCPNIFTY: 'NIFTY_MID_SELECT.NS',
};

const formatCompact = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (absValue >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (absValue >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
};

const formatFlowValue = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return formatCompact(value * 1e7);
};

const formatFlowValueSigned = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return `${value >= 0 ? '+' : ''}${formatCompact(value * 1e7)}`;
};

const formatSmartOiDisplayValue = (value: number | null | undefined, isModeled: boolean) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  if (isModeled) return `${value >= 0 ? '+' : ''}${value.toFixed(3)}x`;
  return formatFlowValueSigned(value);
};

const formatSmartOiAxisValue = (value: number, isModeled: boolean) => {
  if (!Number.isFinite(value)) return '--';
  if (isModeled) return `${value.toFixed(2)}x`;
  return formatFlowValue(value);
};

const formatChartTimeLabel = (timestampSeconds: number) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestampSeconds * 1000));

const formatPrice = (value: number | null | undefined, digits: number = 2) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
};

const formatSignedCompact = (value: number) => `${value >= 0 ? '+' : ''}${formatCompact(value)}`;

const formatSignedPrice = (value: number | null | undefined, digits: number = 2) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return `${value >= 0 ? '+' : ''}${formatPrice(value, digits)}`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// #region debug-point A:smart-oi-report
const SMART_OI_DEBUG_RUN_ID = 'post-fix-4';

const reportSmartOiDebug = (hypothesisId: string, msg: string, data: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  fetch('http://127.0.0.1:7777/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'smart-oi-histogram',
      runId: SMART_OI_DEBUG_RUN_ID,
      hypothesisId,
      location: 'src/components/OptionsDecode.tsx',
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
};
// #endregion

const getIstDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '00';
  const day = parts.find((p) => p.type === 'day')?.value ?? '00';
  return `${year}-${month}-${day}`;
};

const getSessionLabel = (ts: number) =>
  new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ts));

const getToolbarTimeLabel = () =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

const formatExpiryLabel = (value: string | null) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(parsed);
};

const getDaysToExpiry = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const now = new Date();
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const diffMs = parsed.getTime() - istNow.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
};

const parseChainTimestamp = (value: string | null | undefined) => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const match = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;

  const [, day, monthText, year, hour = '15', minute = '30', second = '00'] = match;
  const monthMap: Record<string, string> = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
  };

  const month = monthMap[monthText];
  if (!month) return null;

  return new Date(
    `${year}-${month}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${minute}:${second}+05:30`
  ).getTime();
};

const getTraderTone = (state: TraderState): 'bullish' | 'bearish' | 'neutral' => {
  if (state === 'uptrend') return 'bullish';
  if (state === 'downtrend') return 'bearish';
  return 'neutral';
};

const getTraderLabel = (state: TraderState) => {
  if (state === 'uptrend') return 'Up Trend';
  if (state === 'downtrend') return 'Down Trend';
  return 'Sideways';
};

const classifyTraderState = (priceMovePct: number, oiDeltaCr: number, pcrDelta: number): TraderState => {
  const priceStrongUp = priceMovePct >= 0.22;
  const priceStrongDown = priceMovePct <= -0.22;
  const oiSupportsUp = oiDeltaCr >= -0.05 || pcrDelta >= -0.01;
  const oiSupportsDown = oiDeltaCr <= 0.05 || pcrDelta <= 0.01;
  const priceFlat = Math.abs(priceMovePct) <= 0.12;
  const oiFlat = Math.abs(oiDeltaCr) <= 0.08;
  const pcrFlat = Math.abs(pcrDelta) <= 0.02;

  if (priceStrongUp && oiSupportsUp) return 'uptrend';
  if (priceStrongDown && oiSupportsDown) return 'downtrend';
  if (priceFlat && oiFlat && pcrFlat) return 'sideways';
  return priceMovePct > 0 ? 'uptrend' : priceMovePct < 0 ? 'downtrend' : 'sideways';
};

const getStorageKey = (instrument: Instrument) => `options-decode-session:${instrument}:${getIstDateKey()}`;

const getInstrumentStoragePrefix = (instrument: Instrument) => `options-decode-session:${instrument}:`;

const readSessionFromStorageKey = (storageKey: string): SessionPoint[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.ts === 'number' &&
          typeof item.label === 'string' &&
          typeof item.callBuild === 'number' &&
          typeof item.putBuild === 'number' &&
          typeof item.diff === 'number' &&
          typeof item.pcr === 'number'
      )
      .map((item) => ({
        ...item,
        spot: typeof item.spot === 'number' ? item.spot : null,
      }));
  } catch {
    return [];
  }
};

const readStoredSession = (instrument: Instrument, opts?: { allowPreviousSessionFallback?: boolean }): SessionPoint[] => {
  if (typeof window === 'undefined') return [];

  const currentSession = readSessionFromStorageKey(getStorageKey(instrument));
  if (currentSession.length > 0 || !opts?.allowPreviousSessionFallback) return currentSession;

  const prefix = getInstrumentStoragePrefix(instrument);
  const candidateKeys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(prefix)) candidateKeys.push(key);
  }

  return candidateKeys
    .sort((a, b) => b.localeCompare(a))
    .map((key) => readSessionFromStorageKey(key))
    .find((points) => points.length > 0) ?? [];
};

const persistSession = (instrument: Instrument, points: SessionPoint[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(instrument), JSON.stringify(points));
};

const aggregateBars = (bars: YahooOHLCVBar[], minutes: number): YahooOHLCVBar[] => {
  if (minutes <= 1) return bars;

  const bucketSize = minutes * 60;
  const grouped = new Map<number, YahooOHLCVBar[]>();

  bars.forEach((bar) => {
    const bucket = Math.floor(bar.timestamp / bucketSize) * bucketSize;
    const list = grouped.get(bucket) ?? [];
    list.push(bar);
    grouped.set(bucket, list);
  });

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, list]) => ({
      timestamp: bucket,
      open: list[0].open,
      high: Math.max(...list.map((item) => item.high)),
      low: Math.min(...list.map((item) => item.low)),
      close: list[list.length - 1].close,
      volume: list.reduce((sum, item) => sum + item.volume, 0),
    }));
};

const getBarIstDateKey = (timestampSeconds: number) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestampSeconds * 1000));

const filterBarsToLatestSession = (bars: YahooOHLCVBar[]) => {
  if (!bars.length) return bars;
  const latestKey = getBarIstDateKey(bars[bars.length - 1].timestamp);
  return bars.filter((bar) => getBarIstDateKey(bar.timestamp) === latestKey);
};

const getCandleRequest = (interval: IntervalOption, viewMode: ViewMode): CandleRequest => {
  if (viewMode === 'historical') {
    if (interval === '15m') return { range: '1mo', interval: '15m', bars: 420, aggregateMinutes: null };
    if (interval === '5m') return { range: '5d', interval: '5m', bars: 420, aggregateMinutes: null };
    if (interval === '3m') return { range: '5d', interval: '1m', bars: 420, aggregateMinutes: 3 };
    return { range: '5d', interval: '1m', bars: 420, aggregateMinutes: null };
  }

  if (!isMarketOpen()) {
    if (interval === '15m') {
      return { range: '1mo', interval: '15m', bars: 96, aggregateMinutes: null, filterToLatestSession: true };
    }

    return { range: '5d', interval: '5m', bars: 96, aggregateMinutes: null, filterToLatestSession: true };
  }

  if (interval === '15m') return { range: '1d', interval: '15m', bars: 96, aggregateMinutes: null };
  if (interval === '5m') return { range: '1d', interval: '5m', bars: 120, aggregateMinutes: null };
  if (interval === '3m') return { range: '1d', interval: '1m', bars: 360, aggregateMinutes: 3 };
  return { range: '1d', interval: '1m', bars: 360, aggregateMinutes: null };
};

const buildDerivedSessionHistory = (
  bars: YahooOHLCVBar[],
  snapshot: SnapshotMetrics,
  spotPrice: number | null
): SessionPoint[] => {
  if (bars.length < 20) return [];

  const highs = bars.map((item) => item.high);
  const lows = bars.map((item) => item.low);
  const closes = bars.map((item) => item.close);
  const volumes = bars.map((item) => Math.max(item.volume, 0));
  const sessionHigh = Math.max(...highs);
  const sessionLow = Math.min(...lows);
  const priceRange = Math.max(sessionHigh - sessionLow, 1);
  const firstClose = closes[0] ?? sessionLow;
  const finalSpot = spotPrice ?? closes[closes.length - 1] ?? firstClose;
  const sortedVolumes = [...volumes].sort((a, b) => a - b);
  const medianVolume = sortedVolumes[Math.floor(sortedVolumes.length / 2)] || 1;

  let callAcc = 0;
  let putAcc = 0;
  let prevClose = firstClose;

  const replay = bars.map((bar) => {
    const range = Math.max(bar.high - bar.low, 1);
    const body = bar.close - bar.open;
    const moveFromPrev = bar.close - prevClose;
    const normalizedPrice = clamp((bar.close - sessionLow) / priceRange, 0, 1);
    const trendFromOpen = clamp((bar.close - firstClose) / priceRange, -1, 1);
    const bodyBias = clamp(body / range, -1, 1);
    const continuationBias = clamp(moveFromPrev / range, -1.4, 1.4);
    const volWeight = clamp(Math.sqrt(Math.max(bar.volume, 1) / medianVolume), 0.55, 2.25);

    const trendPressure = bodyBias * 0.72 + continuationBias * 0.94 + trendFromOpen * 0.34;
    const meanReversion = (normalizedPrice - 0.5) * 0.26;
    const volatilityLift = clamp(range / priceRange, 0.02, 0.14) * 0.18;

    const callImpulse =
      (-trendPressure + Math.max(-trendFromOpen, 0) * 0.22 - meanReversion * 0.28 + volatilityLift) * volWeight;
    const putImpulse =
      (trendPressure + Math.max(trendFromOpen, 0) * 0.22 + meanReversion * 0.28 + volatilityLift) * volWeight;

    callAcc += callImpulse;
    putAcc += putImpulse;
    prevClose = bar.close;

    return {
      ts: bar.timestamp * 1000,
      label: getSessionLabel(bar.timestamp * 1000),
      close: bar.close,
      normalizedPrice,
      callAcc,
      putAcc,
    };
  });

  const endCallMagnitude = Math.max(Math.abs(replay[replay.length - 1]?.callAcc || 0), 1);
  const endPutMagnitude = Math.max(Math.abs(replay[replay.length - 1]?.putAcc || 0), 1);
  const callScale = Math.abs(snapshot.totalCeChg) > 0 ? Math.abs(snapshot.totalCeChg) / endCallMagnitude : 0;
  const putScale = Math.abs(snapshot.totalPeChg) > 0 ? Math.abs(snapshot.totalPeChg) / endPutMagnitude : 0;
  const callSign = snapshot.totalCeChg === 0 ? 0 : Math.sign(snapshot.totalCeChg);
  const putSign = snapshot.totalPeChg === 0 ? 0 : Math.sign(snapshot.totalPeChg);
  const scaledReplay = replay.map((point, index) => {
    const callBuild = Math.abs(point.callAcc) * callScale * callSign;
    const putBuild = Math.abs(point.putAcc) * putScale * putSign;

    return {
      ts: point.ts,
      label: point.label,
      callBuild,
      putBuild,
      diff: putBuild - callBuild,
      normalizedPrice: point.normalizedPrice,
      spot: index === replay.length - 1 ? finalSpot : point.close,
    };
  });

  const diffValues = scaledReplay.map((point) => point.diff);
  const diffMin = Math.min(...diffValues);
  const diffMax = Math.max(...diffValues);
  const diffMid = (diffMin + diffMax) / 2;
  const diffHalfRange = Math.max((diffMax - diffMin) / 2, 1);

  return scaledReplay.map((point, index) => {
    const progress = index / Math.max(scaledReplay.length - 1, 1);
    const diffTilt = clamp((point.diff - diffMid) / diffHalfRange, -1.25, 1.25);
    const pcr = clamp(
      snapshot.pcr + diffTilt * 0.16 + (0.5 - point.normalizedPrice) * 0.08 + (progress - 0.5) * 0.02,
      0.72,
      1.95
    );

    return {
      ts: point.ts,
      label: point.label,
      callBuild: point.callBuild,
      putBuild: point.putBuild,
      diff: point.diff,
      pcr,
      spot: point.spot,
    };
  });
};

const buildSmartOiHistogram = (
  candles: CandlestickData<UTCTimestamp>[],
  sessionPoints: SessionPoint[]
): HistogramData<UTCTimestamp>[] => {
  if (candles.length === 0 || sessionPoints.length === 0) return [];

  const sortedPoints = [...sessionPoints].sort((a, b) => a.ts - b.ts);
  const interpolatedDiffCr = candles.map((candle) => {
    const candleTs = Number(candle.time) * 1000;

    if (candleTs <= sortedPoints[0].ts) {
      return sortedPoints[0].diff / 1e7;
    }

    const lastPoint = sortedPoints[sortedPoints.length - 1];
    if (candleTs >= lastPoint.ts) {
      return lastPoint.diff / 1e7;
    }

    let leftIndex = 0;
    while (leftIndex < sortedPoints.length - 1 && sortedPoints[leftIndex + 1].ts < candleTs) {
      leftIndex += 1;
    }

    const left = sortedPoints[leftIndex];
    const right = sortedPoints[leftIndex + 1];
    if (!right || right.ts === left.ts) return left.diff / 1e7;

    const progress = clamp((candleTs - left.ts) / (right.ts - left.ts), 0, 1);
    const interpolated = left.diff + (right.diff - left.diff) * progress;
    return interpolated / 1e7;
  });

  return candles.map((candle, index) => {
    const previousValue = index > 0 ? interpolatedDiffCr[index - 1] : interpolatedDiffCr[index];
    const value = Number((interpolatedDiffCr[index] - previousValue).toFixed(3));

    return {
      time: candle.time,
      value,
      color: value >= 0 ? 'rgba(20, 184, 166, 0.84)' : 'rgba(239, 68, 68, 0.84)',
    };
  });
};

const MetricTile = ({ label, value, subtext, tone, icon }: MetricTileProps) => {
  const toneBorder =
    tone === 'bullish'
      ? 'border-emerald-500/30 bg-emerald-950/15 shadow-[0_0_20px_rgba(0,230,118,0.08)]'
      : tone === 'bearish'
      ? 'border-rose-500/30 bg-rose-950/15 shadow-[0_0_20px_rgba(255,23,68,0.08)]'
      : 'border-white/10 bg-white/[0.03] shadow-lg';

  const toneValue =
    tone === 'bullish'
      ? 'text-emerald-300'
      : tone === 'bearish'
      ? 'text-rose-300'
      : 'text-white';

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-3.5 transition-all hover:scale-[1.02] duration-300 ${toneBorder}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 shadow-inner">
          {icon}
        </div>
      </div>
      <div className={`mt-2 font-mono text-xl font-black tracking-tight ${toneValue}`}>{value}</div>
      <div className="mt-1 text-[11px] font-medium text-slate-400 truncate">{subtext}</div>
    </div>
  );
};

const FlowTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-[0_16px_30px_rgba(2,6,23,0.48)] backdrop-blur-xl">
      <div className="font-bold text-slate-400">{label}</div>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-5">
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="font-black text-white">
              {entry.name === 'PCR' ? Number(entry.value).toFixed(2) : formatFlowValueSigned(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OptionsDecode = () => {
  const [instrument, setInstrument] = useState<Instrument>('NIFTY');
  const [interval, setInterval] = useState<IntervalOption>('1m');
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [rows, setRows] = useState<StrikeRow[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionPoint[]>([]);
  const [availableExpiries, setAvailableExpiries] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);
  const [chainTimestamp, setChainTimestamp] = useState<string | null>(null);
  const [clockLabel, setClockLabel] = useState(getToolbarTimeLabel());
  const [chartBars, setChartBars] = useState<YahooOHLCVBar[]>([]);
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartHover, setChartHover] = useState<ChartHoverState | null>(null);
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const histogramSeriesRef = useRef<any>(null);
  const supportLineRef = useRef<any>(null);
  const resistanceLineRef = useRef<any>(null);
  const maxPainLineRef = useRef<any>(null);
  const defaultChartHoverRef = useRef<ChartHoverState | null>(null);

  useEffect(() => {
    setSessionHistory(
      readStoredSession(instrument, {
        allowPreviousSessionFallback: !isMarketOpen(),
      })
    );
  }, [instrument]);

  useEffect(() => {
    setSelectedExpiry(null);
  }, [instrument]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockLabel(getToolbarTimeLabel());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const request = getCandleRequest(interval, viewMode);
    const yahooSymbol = INDEX_TICKER_MAP[instrument];

    (async () => {
      try {
        setChartLoading(true);
        setChartError(null);
        const rawBars = await fetchHistoricalOHLCV(yahooSymbol, request);
        if (cancelled) return;

        const sessionScopedBars = request.filterToLatestSession ? filterBarsToLatestSession(rawBars) : rawBars;
        const preparedBars =
          request.aggregateMinutes && request.aggregateMinutes > 1
            ? aggregateBars(sessionScopedBars, request.aggregateMinutes)
            : sessionScopedBars;

        const nextCandles = preparedBars.map((bar) => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }));

        setChartBars(preparedBars);
        setCandles(nextCandles);
      } catch (err: any) {
        if (cancelled) return;
        setChartBars([]);
        setCandles([]);
        setChartError(err?.message || 'Unable to load chart data');
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [instrument, interval, viewMode]);

  useEffect(() => {
    let cancelled = false;

    const fetchChain = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/options/${encodeURIComponent(instrument)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Options API error ${response.status}`);

        const payload = (await response.json()) as OptionChainResponse;
        const rawRows = payload.filtered?.data ?? payload.records?.data ?? [];
        const expiryDates =
          payload.records?.expiryDates?.filter(Boolean) ??
          [...new Set(rawRows.map((row) => row.expiryDate).filter((value): value is string => Boolean(value)))];
        const effectiveExpiry =
          selectedExpiry && expiryDates.includes(selectedExpiry) ? selectedExpiry : expiryDates[0] ?? null;
        const chainRows = effectiveExpiry
          ? rawRows.filter((row) => !row.expiryDate || row.expiryDate === effectiveExpiry)
          : rawRows;
        let underlying = payload.filtered?.underlyingValue ?? payload.records?.underlyingValue ?? null;

        if ((typeof underlying !== 'number' || !Number.isFinite(underlying)) && INDEX_TICKER_MAP[instrument]) {
          const livePrice = await fetchStockPrice(INDEX_TICKER_MAP[instrument]);
          underlying = livePrice?.price ?? null;
        }

        const normalized = chainRows
          .map((row): StrikeRow | null => {
            if (typeof row.strikePrice !== 'number') return null;
            const ceOi = row.CE?.openInterest ?? 0;
            const peOi = row.PE?.openInterest ?? 0;
            const ceChg = row.CE?.changeinOpenInterest ?? 0;
            const peChg = row.PE?.changeinOpenInterest ?? 0;

            return {
              strike: row.strikePrice,
              ceOi: Number.isFinite(ceOi) ? ceOi : 0,
              peOi: Number.isFinite(peOi) ? peOi : 0,
              ceChg: Number.isFinite(ceChg) ? ceChg : 0,
              peChg: Number.isFinite(peChg) ? peChg : 0,
              ceIv: row.CE?.impliedVolatility ?? 0,
              peIv: row.PE?.impliedVolatility ?? 0,
              ceLtp: row.CE?.lastPrice ?? 0,
              peLtp: row.PE?.lastPrice ?? 0,
              totalOi: (Number.isFinite(ceOi) ? ceOi : 0) + (Number.isFinite(peOi) ? peOi : 0),
              dominantSide: (peOi >= ceOi ? 'put' : 'call') as 'put' | 'call',
              isATM: false,
            };
          })
          .filter((item): item is StrikeRow => item !== null)
          .sort((a, b) => a.strike - b.strike);

        if (!normalized.length) throw new Error('No option chain rows returned');

        let atmIndex = Math.floor(normalized.length / 2);
        if (typeof underlying === 'number' && Number.isFinite(underlying)) {
          let bestIndex = atmIndex;
          let bestDistance = Number.POSITIVE_INFINITY;
          normalized.forEach((item, index) => {
            const distance = Math.abs(item.strike - underlying);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestIndex = index;
            }
          });
          atmIndex = bestIndex;
        }

        const atmStrike = normalized[atmIndex]?.strike ?? null;
        const withAtm = normalized.map((item) => ({ ...item, isATM: item.strike === atmStrike }));

        const totalCeOi = withAtm.reduce((sum, item) => sum + item.ceOi, 0);
        const totalPeOi = withAtm.reduce((sum, item) => sum + item.peOi, 0);
        const totalCeChg = withAtm.reduce((sum, item) => sum + item.ceChg, 0);
        const totalPeChg = withAtm.reduce((sum, item) => sum + item.peChg, 0);
        const pcr = totalCeOi > 0 ? totalPeOi / totalCeOi : 0;
        const diff = totalPeChg - totalCeChg;
        const atmRow = withAtm[atmIndex];
        const exchangeTimestamp = parseChainTimestamp(payload.records?.timestamp) ?? Date.now();
        const point: SessionPoint = {
          ts: exchangeTimestamp,
          label: getSessionLabel(exchangeTimestamp),
          callBuild: totalCeChg,
          putBuild: totalPeChg,
          diff,
          pcr,
          spot: typeof underlying === 'number' && Number.isFinite(underlying) ? underlying : null,
        };

        if (cancelled) return;

        setRows(withAtm);
        setAvailableExpiries(expiryDates);
        setSelectedExpiry(effectiveExpiry);
        setChainTimestamp(payload.records?.timestamp ?? null);
        setSpotPrice(typeof underlying === 'number' && Number.isFinite(underlying) ? underlying : null);
        setLastUpdatedAt(exchangeTimestamp);
        setIsLive(true);
        setSessionHistory((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          const meaningfulChange =
            !last ||
            Math.abs(point.diff - last.diff) >= 15_000 ||
            Math.abs(point.pcr - last.pcr) >= 0.01 ||
            (typeof point.spot === 'number' && typeof last.spot === 'number' && Math.abs(point.spot - last.spot) >= 8);

          if (last && Math.abs(point.ts - last.ts) < 15_000) {
            next[next.length - 1] = point;
          } else if (meaningfulChange) {
            next.push(point);
          } else {
            next[next.length - 1] = point;
          }
          const trimmed = next.slice(-200);
          persistSession(instrument, trimmed);
          return trimmed;
        });

        if (!atmRow && atmStrike == null) {
          throw new Error('Unable to locate ATM strike');
        }
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setSpotPrice(null);
        setIsLive(false);
        setError(err instanceof Error ? err.message : 'Failed to load options chain');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchChain();
    const intervalId = window.setInterval(fetchChain, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [instrument, selectedExpiry]);

  const sortedByOi = useMemo(() => [...rows].sort((a, b) => b.totalOi - a.totalOi), [rows]);
  const atmIndex = useMemo(() => rows.findIndex((item) => item.isATM), [rows]);

  const snapshot = useMemo<SnapshotMetrics>(() => {
    const totalCeOi = rows.reduce((sum, item) => sum + item.ceOi, 0);
    const totalPeOi = rows.reduce((sum, item) => sum + item.peOi, 0);
    const totalCeChg = rows.reduce((sum, item) => sum + item.ceChg, 0);
    const totalPeChg = rows.reduce((sum, item) => sum + item.peChg, 0);
    const pcr = totalCeOi > 0 ? totalPeOi / totalCeOi : 0;

    const supportStrike = rows.reduce<StrikeRow | null>(
      (best, item) => (item.peOi > (best?.peOi ?? -1) ? item : best),
      null
    )?.strike ?? null;

    const resistanceStrike = rows.reduce<StrikeRow | null>(
      (best, item) => (item.ceOi > (best?.ceOi ?? -1) ? item : best),
      null
    )?.strike ?? null;

    // True Mathematical Max Pain (aggregate buyer loss minimization)
    let minLoss = Number.POSITIVE_INFINITY;
    let maxPainStrike: number | null = null;
    rows.forEach((target) => {
      const s = target.strike;
      let totalLoss = 0;
      rows.forEach((r) => {
        if (s > r.strike) totalLoss += (s - r.strike) * r.ceOi;
        else if (s < r.strike) totalLoss += (r.strike - s) * r.peOi;
      });
      if (totalLoss < minLoss) {
        minLoss = totalLoss;
        maxPainStrike = s;
      }
    });

    const atmRow = rows.find((item) => item.isATM) ?? null;
    const ivs = atmRow ? [atmRow.ceIv, atmRow.peIv].filter((value) => value > 0) : [];
    const atmIv = ivs.length ? ivs.reduce((sum, value) => sum + value, 0) / ivs.length : 0;

    return {
      totalCeOi,
      totalPeOi,
      totalCeChg,
      totalPeChg,
      pcr,
      supportStrike,
      resistanceStrike,
      maxPainStrike,
      atmStrike: atmRow?.strike ?? null,
      atmIv,
      atmPremium: atmRow ? (atmRow.ceLtp ?? 0) + (atmRow.peLtp ?? 0) : 0,
    };
  }, [rows]);

  const atmRow = useMemo(() => {
    if (atmIndex >= 0) return rows[atmIndex];
    return rows[Math.floor(rows.length / 2)] ?? null;
  }, [atmIndex, rows]);

  const strikeFocusRows = useMemo(() => {
    if (!rows.length) return [];
    const centerIndex = atmIndex >= 0 ? atmIndex : Math.floor(rows.length / 2);
    const start = Math.max(0, centerIndex - 3);
    const end = Math.min(rows.length, centerIndex + 4);
    return rows.slice(start, end);
  }, [atmIndex, rows]);

  const maxWallOi = useMemo(() => {
    const topWalls = sortedByOi.slice(0, 5);
    if (!topWalls.length) return 1;
    return Math.max(...topWalls.map((r) => (r.dominantSide === 'put' ? r.peOi : r.ceOi)), 1);
  }, [sortedByOi]);

  const maxLadderCeOi = useMemo(() => {
    if (!strikeFocusRows.length) return 1;
    return Math.max(...strikeFocusRows.map((r) => r.ceOi), 1);
  }, [strikeFocusRows]);

  const maxLadderPeOi = useMemo(() => {
    if (!strikeFocusRows.length) return 1;
    return Math.max(...strikeFocusRows.map((r) => r.peOi), 1);
  }, [strikeFocusRows]);

  const bullPowerPct = useMemo(() => {
    const total = snapshot.totalPeOi + snapshot.totalCeOi;
    if (!total) return 50;
    return Math.round((snapshot.totalPeOi / total) * 100);
  }, [snapshot.totalCeOi, snapshot.totalPeOi]);

  const effectiveSessionHistory = useMemo(() => {
    const sorted = [...sessionHistory].sort((a, b) => a.ts - b.ts);
    const unique = sorted.filter((point, index, list) => {
      if (index === 0) return true;
      const previous = list[index - 1];
      return point.ts !== previous.ts;
    });

    if (!isMarketOpen()) {
      const derivedClosed = buildDerivedSessionHistory(chartBars, snapshot, spotPrice);
      if (derivedClosed.length >= 12) return derivedClosed;
    }

    if (unique.length >= 12) return unique;
    const derived = buildDerivedSessionHistory(chartBars, snapshot, spotPrice);
    return derived.length >= 6 ? derived : unique;
  }, [chartBars, sessionHistory, snapshot, spotPrice]);

  const isModeledSession = effectiveSessionHistory.length >= 6 && sessionHistory.length < 6;

  const flowChartData = useMemo(
    () =>
      effectiveSessionHistory.map((point) => ({
        time: point.label,
        Put: Number((point.putBuild / 1e7).toFixed(4)),
        Call: Number((point.callBuild / 1e7).toFixed(4)),
        'PE-CE': Number((point.diff / 1e7).toFixed(4)),
        PCR: Number(point.pcr.toFixed(4)),
      })),
    [effectiveSessionHistory]
  );

  const smartOiHistogramSeries = useMemo<HistogramData<UTCTimestamp>[]>(
    () => buildSmartOiHistogram(candles, effectiveSessionHistory),
    [candles, effectiveSessionHistory]
  );

  // #region debug-point B:session-source
  useEffect(() => {
    if (candles.length === 0 || effectiveSessionHistory.length === 0) return;

    const firstSessionPoint = effectiveSessionHistory[0];
    const lastSessionPoint = effectiveSessionHistory[effectiveSessionHistory.length - 1];

    reportSmartOiDebug('B', 'session source and diff summary', {
      instrument,
      interval,
      viewMode,
      isModeledSession,
      candleCount: candles.length,
      sessionPointCount: effectiveSessionHistory.length,
      rawSessionPointCount: sessionHistory.length,
      spotPrice,
      snapshotCeChg: snapshot.totalCeChg,
      snapshotPeChg: snapshot.totalPeChg,
      firstDiffCr: Number((firstSessionPoint.diff / 1e7).toFixed(3)),
      lastDiffCr: Number((lastSessionPoint.diff / 1e7).toFixed(3)),
      firstPcr: Number(firstSessionPoint.pcr.toFixed(3)),
      lastPcr: Number(lastSessionPoint.pcr.toFixed(3)),
    });
  }, [candles.length, effectiveSessionHistory, instrument, interval, isModeledSession, sessionHistory.length, snapshot.totalCeChg, snapshot.totalPeChg, spotPrice, viewMode]);
  // #endregion

  // #region debug-point C:histogram-direction
  useEffect(() => {
    if (candles.length === 0 || smartOiHistogramSeries.length === 0) return;

    const sample = candles.slice(-12).map((candle) => {
      const histogramPoint = smartOiHistogramSeries.find((item) => Number(item.time) === Number(candle.time));
      const candleMove = candle.close - candle.open;
      const histogramValue = typeof histogramPoint?.value === 'number' ? histogramPoint.value : 0;

      return {
        label: getSessionLabel(Number(candle.time) * 1000),
        candleMove: Number(candleMove.toFixed(1)),
        candleDir: candleMove > 0 ? 'up' : candleMove < 0 ? 'down' : 'flat',
        histogramCr: Number(histogramValue.toFixed(3)),
        histogramDir: histogramValue > 0 ? 'positive' : histogramValue < 0 ? 'negative' : 'flat',
      };
    });

    const directionalPairs = sample.filter((item) => item.candleDir !== 'flat' && item.histogramDir !== 'flat');
    const mismatchCount = directionalPairs.filter(
      (item) =>
        (item.candleDir === 'up' && item.histogramDir === 'negative') ||
        (item.candleDir === 'down' && item.histogramDir === 'positive')
    ).length;

    reportSmartOiDebug('C', 'candle vs histogram direction sample', {
      instrument,
      interval,
      viewMode,
      mismatchCount,
      comparableBars: directionalPairs.length,
      sample,
    });
  }, [candles, instrument, interval, smartOiHistogramSeries, viewMode]);
  // #endregion

  // #region debug-point D:histogram-components
  useEffect(() => {
    if (candles.length === 0 || effectiveSessionHistory.length < 2 || smartOiHistogramSeries.length === 0) return;

    const sortedSessionPoints = [...effectiveSessionHistory].sort((a, b) => a.ts - b.ts);
    const sample = candles.slice(-12).map((candle) => {
      const candleTs = Number(candle.time) * 1000;
      let pointIndex = 0;
      while (pointIndex < sortedSessionPoints.length - 1 && sortedSessionPoints[pointIndex + 1].ts <= candleTs) {
        pointIndex += 1;
      }

      const point = sortedSessionPoints[pointIndex];
      const previousPoint = sortedSessionPoints[Math.max(0, pointIndex - 1)];
      const histogramPoint = smartOiHistogramSeries.find((item) => Number(item.time) === Number(candle.time));

      return {
        label: getSessionLabel(candleTs),
        candleMove: Number((candle.close - candle.open).toFixed(1)),
        histogramCr: Number((histogramPoint?.value ?? 0).toFixed(3)),
        pointDiffCr: Number((point.diff / 1e7).toFixed(3)),
        deltaDiffCr: Number((((point.diff - previousPoint.diff) || 0) / 1e7).toFixed(3)),
        deltaPutCr: Number((((point.putBuild - previousPoint.putBuild) || 0) / 1e7).toFixed(3)),
        deltaCallCr: Number((((point.callBuild - previousPoint.callBuild) || 0) / 1e7).toFixed(3)),
      };
    });

    reportSmartOiDebug('D', 'histogram source components sample', {
      instrument,
      interval,
      viewMode,
      rawSessionPointCount: sessionHistory.length,
      isModeledSession,
      sample,
    });
  }, [candles, effectiveSessionHistory, instrument, interval, isModeledSession, sessionHistory.length, smartOiHistogramSeries, viewMode]);
  // #endregion

  const latestFlow = flowChartData[flowChartData.length - 1];
  const timestampLabel = chainTimestamp ?? (lastUpdatedAt ? getSessionLabel(lastUpdatedAt) : '--');
  const sessionSummary = useMemo(() => {
    const sessionHigh = candles.length ? Math.max(...candles.map((item) => item.high)) : null;
    const sessionLow = candles.length ? Math.min(...candles.map((item) => item.low)) : null;
    const sessionOpen = candles[0]?.open ?? null;
    const lastClose = candles[candles.length - 1]?.close ?? null;
    const referencePrice = spotPrice ?? lastClose;
    const move = referencePrice !== null && sessionOpen !== null ? referencePrice - sessionOpen : null;
    const movePct =
      move !== null && sessionOpen && Number.isFinite(sessionOpen) ? (move / sessionOpen) * 100 : null;
    const supportGap =
      referencePrice !== null && snapshot.supportStrike !== null ? referencePrice - snapshot.supportStrike : null;
    const resistanceGap =
      referencePrice !== null && snapshot.resistanceStrike !== null ? snapshot.resistanceStrike - referencePrice : null;
    const lowerBreakeven =
      snapshot.atmStrike !== null && snapshot.atmPremium > 0 ? snapshot.atmStrike - snapshot.atmPremium : null;
    const upperBreakeven =
      snapshot.atmStrike !== null && snapshot.atmPremium > 0 ? snapshot.atmStrike + snapshot.atmPremium : null;
    const oiSpread = snapshot.totalPeOi - snapshot.totalCeOi;

    return {
      sessionHigh,
      sessionLow,
      sessionOpen,
      lastClose,
      move,
      movePct,
      supportGap,
      resistanceGap,
      lowerBreakeven,
      upperBreakeven,
      oiSpread,
    };
  }, [candles, snapshot, spotPrice]);

  const traderView = useMemo(() => {
    const closeByTime = effectiveSessionHistory.map((point) => {
      if (typeof point.spot === 'number') {
        return {
          ...point,
          close: point.spot,
        };
      }

      const nearest = candles.reduce<{ distance: number; close: number | null }>(
        (best, candle) => {
          const candleTs = Number(candle.time) * 1000;
          const distance = Math.abs(candleTs - point.ts);
          if (distance < best.distance) {
            return { distance, close: candle.close };
          }
          return best;
        },
        { distance: Number.POSITIVE_INFINITY, close: null }
      );

      return {
        ...point,
        close: nearest.close,
      };
    }).filter((point): point is SessionPoint & { close: number } => typeof point.close === 'number');

    const timeline = closeByTime.slice(-6).map((point, index, list) => {
      const previous = list[Math.max(0, index - 1)];
      const priceMovePct =
        index === 0 || !previous.close ? 0 : ((point.close - previous.close) / previous.close) * 100;
      const oiDeltaCr = index === 0 ? 0 : (point.diff - previous.diff) / 1e7;
      const pcrDelta = index === 0 ? 0 : point.pcr - previous.pcr;
      const state = classifyTraderState(priceMovePct, oiDeltaCr, pcrDelta);
      const note =
        state === 'uptrend'
          ? `Price +${Math.abs(priceMovePct).toFixed(2)}%, support improving`
          : state === 'downtrend'
            ? `Price -${Math.abs(priceMovePct).toFixed(2)}%, call pressure rising`
            : `Price flat, OI balanced`;

      return {
        time: point.label,
        state,
        note,
        tone: getTraderTone(state),
      };
    });

    const recent = closeByTime.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const windowPriceMovePct =
      first && last && first.close ? ((last.close - first.close) / first.close) * 100 : sessionSummary.movePct ?? 0;
    const windowOiDeltaCr = first && last ? (last.diff - first.diff) / 1e7 : snapshot.totalPeChg / 1e7 - snapshot.totalCeChg / 1e7;
    const windowPcrDelta = first && last ? last.pcr - first.pcr : snapshot.pcr - 1;
    const state = classifyTraderState(windowPriceMovePct, windowOiDeltaCr, windowPcrDelta);
    const tone = getTraderTone(state);
    const confidence = clamp(
      Math.round(Math.abs(windowPriceMovePct) * 90 + Math.abs(windowOiDeltaCr) * 45 + Math.abs(windowPcrDelta) * 220),
      38,
      96
    );
    const expectedZone =
      snapshot.supportStrike !== null && snapshot.resistanceStrike !== null
        ? `${formatPrice(snapshot.supportStrike, 0)} - ${formatPrice(snapshot.resistanceStrike, 0)}`
        : '--';
    const summary =
      state === 'uptrend'
        ? `Data bol raha hai buyers control me hain. Jab tak spot ${snapshot.supportStrike ? ` ${formatPrice(snapshot.supportStrike, 0)} ke upar` : 'support ke upar'} hai, trend positive hai.`
        : state === 'downtrend'
          ? `Data bol raha hai sellers active hain. Jab tak spot ${snapshot.resistanceStrike ? `${formatPrice(snapshot.resistanceStrike, 0)} ke neeche` : 'resistance ke neeche'} hai, pressure bana rahega.`
          : `Data mixed hai. ${expectedZone !== '--' ? `Market ${expectedZone} zone me rotate kar sakta hai.` : 'Clear direction abhi build nahi hui.'}`;

    return {
      label: getTraderLabel(state),
      tone,
      confidence,
      summary,
      since: timeline[0]?.time ?? timestampLabel,
      checkpoints: timeline.reverse(),
      stats: [
        {
          label: 'Now',
          value: getTraderLabel(state),
          subtext: `As per live price + OI`,
        },
        {
          label: 'Confidence',
          value: `${confidence}%`,
          subtext: isModeledSession ? 'Modeled session assist' : 'Live session read',
        },
        {
          label: 'Zone',
          value: expectedZone,
          subtext: 'Immediate trading zone',
        },
        {
          label: 'OI Shift',
          value: `${windowOiDeltaCr >= 0 ? '+' : ''}${windowOiDeltaCr.toFixed(2)}Cr`,
          subtext: 'Recent put-call build change',
        },
      ],
    };
  }, [candles, effectiveSessionHistory, isModeledSession, sessionSummary.movePct, snapshot, timestampLabel]);

  const strategyBlueprint = useMemo(() => {
    const isBullish = snapshot.pcr >= 1.08 || (snapshot.pcr >= 0.98 && snapshot.totalPeChg > snapshot.totalCeChg);
    const isBearish = snapshot.pcr <= 0.88 || (snapshot.pcr <= 1.02 && snapshot.totalCeChg > snapshot.totalPeChg * 1.3);
    const atm = snapshot.atmStrike ?? 24000;
    const support = snapshot.supportStrike ?? atm - 150;
    const resistance = snapshot.resistanceStrike ?? atm + 150;

    if (isBullish) {
      return {
        name: 'BULL CALL SPREAD',
        tag: 'BULLISH MOMENTUM',
        tone: 'bullish' as const,
        riskReward: '1 : 2.6',
        winRate: '72%',
        legs: [
          { action: 'BUY', strike: `${formatPrice(atm, 0)} CE (ATM)`, desc: 'Capture upside breakout' },
          { action: 'SELL', strike: `${formatPrice(resistance, 0)} CE (OTM)`, desc: 'Hedge theta & cap cost' },
        ],
        target: `Spot > ${formatPrice(resistance, 0)}`,
        stopLoss: `Spot < ${formatPrice(support, 0)}`,
        rationale: `Strong Put writing (+${formatCompact(Math.max(snapshot.totalPeChg, 0))}) provides heavy institutional floor. Option writers are defending ${formatPrice(support, 0)}.`,
      };
    }

    if (isBearish) {
      return {
        name: 'BEAR PUT SPREAD',
        tag: 'BEARISH PRESSURE',
        tone: 'bearish' as const,
        riskReward: '1 : 2.5',
        winRate: '70%',
        legs: [
          { action: 'BUY', strike: `${formatPrice(atm, 0)} PE (ATM)`, desc: 'Capture breakdown move' },
          { action: 'SELL', strike: `${formatPrice(support, 0)} PE (OTM)`, desc: 'Hedge theta & cap cost' },
        ],
        target: `Spot < ${formatPrice(support, 0)}`,
        stopLoss: `Spot > ${formatPrice(resistance, 0)}`,
        rationale: `Heavy Call writing (+${formatCompact(Math.max(snapshot.totalCeChg, 0))}) caps upside. Sellers actively defending ${formatPrice(resistance, 0)}.`,
      };
    }

    return {
      name: 'IRON CONDOR / SHORT STRADDLE',
      tag: 'NON-DIRECTIONAL THETA',
      tone: 'neutral' as const,
      riskReward: '1 : 1.8',
      winRate: '78%',
      legs: [
        { action: 'SELL', strike: `${formatPrice(resistance, 0)} CE`, desc: 'Harvest Call decay' },
        { action: 'SELL', strike: `${formatPrice(support, 0)} PE`, desc: 'Harvest Put decay' },
      ],
      target: `Expiry inside Range [${formatPrice(support, 0)} - ${formatPrice(resistance, 0)}]`,
      stopLoss: `Breakout beyond ${formatPrice(support - 50, 0)} or ${formatPrice(resistance + 50, 0)}`,
      rationale: `PCR ${snapshot.pcr.toFixed(2)} is balanced near Max Pain (${formatPrice(snapshot.maxPainStrike, 0)}). Market expected to rotate within the ${formatPrice(support, 0)} - ${formatPrice(resistance, 0)} band.`,
    };
  }, [snapshot]);

  const playbookItems = useMemo(
    () => [
      {
        label: 'Breakeven Band',
        value:
          sessionSummary.lowerBreakeven !== null && sessionSummary.upperBreakeven !== null
            ? `${formatPrice(sessionSummary.lowerBreakeven, 0)} - ${formatPrice(sessionSummary.upperBreakeven, 0)}`
            : '--',
        note: 'Short straddle expected range',
      },
      {
        label: 'ATM Straddle',
        value: snapshot.atmPremium ? `Rs ${formatPrice(snapshot.atmPremium)}` : '--',
        note: snapshot.atmStrike ? `ATM ${formatPrice(snapshot.atmStrike, 0)} combined premium` : 'ATM strike unavailable',
      },
      {
        label: 'Support Gap',
        value: sessionSummary.supportGap !== null ? formatSignedPrice(sessionSummary.supportGap, 0) : '--',
        note: 'Distance from strongest put wall',
      },
      {
        label: 'Resistance Gap',
        value: sessionSummary.resistanceGap !== null ? formatSignedPrice(sessionSummary.resistanceGap, 0) : '--',
        note: 'Distance from strongest call wall',
      },
    ],
    [sessionSummary.lowerBreakeven, sessionSummary.resistanceGap, sessionSummary.supportGap, sessionSummary.upperBreakeven, snapshot.atmPremium, snapshot.atmStrike]
  );

  const defaultChartHover = useMemo<ChartHoverState | null>(() => {
    const latestCandle = candles[candles.length - 1];
    if (!latestCandle) return null;
    return {
      label: getSessionLabel(Number(latestCandle.time) * 1000),
      open: latestCandle.open,
      high: latestCandle.high,
      low: latestCandle.low,
      close: latestCandle.close,
      smartOi: smartOiHistogramSeries[smartOiHistogramSeries.length - 1]?.value ?? null,
    };
  }, [candles, smartOiHistogramSeries]);

  useEffect(() => {
    defaultChartHoverRef.current = defaultChartHover;
  }, [defaultChartHover]);

  useEffect(() => {
    const host = chartHostRef.current;
    if (!host || candles.length === 0 || chartApiRef.current) return;

    const chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#0b0d10' },
        textColor: '#7c8aa5',
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (time: unknown) => formatChartTimeLabel(Number(time)),
      },
      grid: {
        vertLines: { color: 'rgba(120, 138, 165, 0.10)' },
        horzLines: { color: 'rgba(120, 138, 165, 0.08)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255,255,255,0.45)',
          width: 1,
          style: LineStyle.SparseDotted,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
      leftPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: 'rgba(120,138,165,0.18)',
        scaleMargins: {
          top: 0.06,
          bottom: 0.24,
        },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: 'rgba(120,138,165,0.18)',
        scaleMargins: {
          top: 0.78,
          bottom: 0.06,
        },
      },
      timeScale: {
        visible: true,
        borderVisible: true,
        borderColor: 'rgba(120,138,165,0.18)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: unknown) => formatChartTimeLabel(Number(time)),
        rightOffset: 2,
        barSpacing: 6,
        minBarSpacing: 3,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
      },
    });
    chartApiRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      priceScaleId: 'left',
      upColor: '#22c55e',
      downColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      borderVisible: false,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Solid,
      priceLineColor: 'rgba(34, 197, 94, 0.92)',
    });
    candleSeriesRef.current = candleSeries;

    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: 'right',
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: '#60a5fa',
      base: 0,
      priceFormat: {
        type: 'custom',
        minMove: 0.01,
        formatter: (price: number) => formatSmartOiAxisValue(price, false),
      },
    });
    histogramSeriesRef.current = histogramSeries;

    const handleCrosshairMove = (param: any) => {
      if (!param?.time || !param?.seriesData) {
        setChartHover(defaultChartHoverRef.current);
        return;
      }

      const candleData = param.seriesData.get(candleSeries);
      if (!candleData) return;
      const oiData = param.seriesData.get(histogramSeries);

      setChartHover({
        label: getSessionLabel(Number(param.time) * 1000),
        open: candleData.open,
        high: candleData.high,
        low: candleData.low,
        close: candleData.close,
        smartOi: typeof oiData?.value === 'number' ? oiData.value : null,
      });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    const resizeObserver = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });
    resizeObserver.observe(host);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      resizeObserver.disconnect();
      chartApiRef.current = null;
      candleSeriesRef.current = null;
      histogramSeriesRef.current = null;
      chart.remove();
    };
  }, [candles.length]);

  useEffect(() => {
    const chart = chartApiRef.current;
    const candleSeries = candleSeriesRef.current;
    const histogramSeries = histogramSeriesRef.current;
    if (!chart || !candleSeries || !histogramSeries || candles.length === 0) return;

    const latestCandle = candles[candles.length - 1];
    const currentPriceLineColor =
      latestCandle && latestCandle.close >= latestCandle.open ? 'rgba(0, 230, 118, 0.95)' : 'rgba(255, 23, 68, 0.95)';

    candleSeries.applyOptions({
      priceLineColor: currentPriceLineColor,
    });
    candleSeries.setData(candles);
    histogramSeries.setData(smartOiHistogramSeries);
    histogramSeries.applyOptions({
      lastValueVisible: !isModeledSession,
      priceLineVisible: !isModeledSession,
      priceFormat: {
        type: 'custom',
        minMove: 0.01,
        formatter: (price: number) => formatSmartOiAxisValue(price, isModeledSession),
      },
    });
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.78,
        bottom: 0.06,
      },
      borderVisible: true,
      borderColor: 'rgba(120,138,165,0.18)',
    });

    // Dynamic Price Lines on Chart for Support, Resistance & Max Pain
    try {
      if (supportLineRef.current) {
        candleSeries.removePriceLine(supportLineRef.current);
        supportLineRef.current = null;
      }
      if (resistanceLineRef.current) {
        candleSeries.removePriceLine(resistanceLineRef.current);
        resistanceLineRef.current = null;
      }
      if (maxPainLineRef.current) {
        candleSeries.removePriceLine(maxPainLineRef.current);
        maxPainLineRef.current = null;
      }

      if (snapshot.supportStrike) {
        supportLineRef.current = candleSeries.createPriceLine({
          price: snapshot.supportStrike,
          color: '#00e676',
          lineWidth: 1.5,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SUPPORT ${formatPrice(snapshot.supportStrike, 0)}`,
        });
      }

      if (snapshot.resistanceStrike) {
        resistanceLineRef.current = candleSeries.createPriceLine({
          price: snapshot.resistanceStrike,
          color: '#ff1744',
          lineWidth: 1.5,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `RESIST ${formatPrice(snapshot.resistanceStrike, 0)}`,
        });
      }

      if (snapshot.maxPainStrike) {
        maxPainLineRef.current = candleSeries.createPriceLine({
          price: snapshot.maxPainStrike,
          color: '#fbbf24',
          lineWidth: 1.5,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `MAX PAIN ${formatPrice(snapshot.maxPainStrike, 0)}`,
        });
      }
    } catch {
      // Ignore price line management exceptions
    }

    if (defaultChartHover) {
      setChartHover(defaultChartHover);
    }
  }, [candles, defaultChartHover, isModeledSession, smartOiHistogramSeries, snapshot.maxPainStrike, snapshot.resistanceStrike, snapshot.supportStrike]);

  const marketBias = useMemo(() => {
    if (snapshot.pcr >= 1.15 && snapshot.totalPeChg >= snapshot.totalCeChg) {
      return {
        title: 'Put support is dominating',
        detail: 'Downside support is stronger and active strikes are defending the current zone.',
        tone: 'bullish' as const,
      };
    }

    if (snapshot.pcr <= 0.9 && snapshot.totalCeChg > snapshot.totalPeChg) {
      return {
        title: 'Call writing is heavier',
        detail: 'Upside resistance is stronger and sellers are active above spot.',
        tone: 'bearish' as const,
      };
    }

    return {
      title: 'Positioning is balanced',
      detail: 'Both sides are active. Wait for cleaner shift in PCR or build-up spread.',
      tone: 'neutral' as const,
    };
  }, [snapshot.pcr, snapshot.totalCeChg, snapshot.totalPeChg]);

  const keyLevels = useMemo<KeyLevelItem[]>(
    () => [
      {
        label: 'Major Support',
        value: snapshot.supportStrike ? formatPrice(snapshot.supportStrike, 0) : '--',
        subtext: 'Highest Put OI wall',
        tone: 'bullish' as const,
        icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
      },
      {
        label: 'Major Resistance',
        value: snapshot.resistanceStrike ? formatPrice(snapshot.resistanceStrike, 0) : '--',
        subtext: 'Highest Call OI wall',
        tone: 'bearish' as const,
        icon: <TrendingDown className="h-4 w-4 text-rose-400" />,
      },
      {
        label: 'Max Pain Strike',
        value: snapshot.maxPainStrike ? formatPrice(snapshot.maxPainStrike, 0) : '--',
        subtext: 'Min buyer payout zone',
        tone: 'neutral' as const,
        icon: <Target className="h-4 w-4 text-amber-400" />,
      },
      {
        label: 'Overall PCR',
        value: snapshot.pcr ? snapshot.pcr.toFixed(2) : '--',
        subtext: marketBias.title,
        tone: marketBias.tone,
        icon: <Activity className="h-4 w-4 text-sky-400" />,
      },
      {
        label: 'ATM Straddle Range',
        value: sessionSummary.lowerBreakeven && sessionSummary.upperBreakeven
          ? `${formatPrice(sessionSummary.lowerBreakeven, 0)} - ${formatPrice(sessionSummary.upperBreakeven, 0)}`
          : '--',
        subtext: snapshot.atmPremium ? `Premium: Rs ${formatPrice(snapshot.atmPremium)}` : 'Expected expiry range',
        tone: 'neutral' as const,
        icon: <Layers className="h-4 w-4 text-violet-400" />,
      },
      {
        label: 'ATM IV',
        value: snapshot.atmIv ? `${snapshot.atmIv.toFixed(1)}%` : '--',
        subtext: snapshot.atmIv >= 18 ? 'High volatility' : 'Normal volatility',
        tone: snapshot.atmIv >= 20 ? 'bearish' : 'neutral',
        icon: <ShieldAlert className="h-4 w-4 text-cyan-400" />,
      },
    ],
    [marketBias.title, marketBias.tone, sessionSummary.lowerBreakeven, sessionSummary.upperBreakeven, snapshot.atmIv, snapshot.atmPremium, snapshot.maxPainStrike, snapshot.pcr, snapshot.resistanceStrike, snapshot.supportStrike]
  );

  const instrumentIndex = INSTRUMENTS.indexOf(instrument);
  const selectedExpiryLabel = formatExpiryLabel(selectedExpiry);
  const daysToExpiry = getDaysToExpiry(selectedExpiry);

  const switchInstrument = (direction: -1 | 1) => {
    const nextIndex = (instrumentIndex + direction + INSTRUMENTS.length) % INSTRUMENTS.length;
    setInstrument(INSTRUMENTS[nextIndex]);
  };

  const cycleExpiry = (direction: -1 | 1) => {
    if (!availableExpiries.length) return;
    const currentIndex = Math.max(0, availableExpiries.indexOf(selectedExpiry ?? availableExpiries[0]));
    const nextIndex = (currentIndex + direction + availableExpiries.length) % availableExpiries.length;
    setSelectedExpiry(availableExpiries[nextIndex]);
  };

  const chartInfo = chartHover ?? defaultChartHover;
  const flowReferencePoint = flowChartData.length ? flowChartData[Math.floor(flowChartData.length * 0.58)] : null;

  return (
    <div className="min-h-screen bg-[#060b14] px-4 py-5 text-slate-300 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,17,29,0.96),rgba(5,10,18,0.99))] shadow-[0_24px_70px_rgba(2,6,23,0.58)]">
          <div className="flex flex-col gap-3 border-b border-white/8 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2">
                <span className="flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-blue-500/14 px-2 text-xs font-black text-blue-200">
                  {LOT_SIZE_MAP[instrument]}
                </span>
                <button
                  type="button"
                  onClick={() => switchInstrument(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/12 text-blue-300">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-sm font-black text-white">{instrument}</span>
                <button
                  type="button"
                  onClick={() => switchInstrument(1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-slate-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-200">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => cycleExpiry(-1)}
                  disabled={availableExpiries.length <= 1}
                  className="text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {selectedExpiryLabel}
                  {daysToExpiry !== null ? ` (${daysToExpiry}d)` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => cycleExpiry(1)}
                  disabled={availableExpiries.length <= 1}
                  className="text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {INTERVALS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setInterval(item)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      interval === item
                        ? 'bg-blue-500/16 text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.18)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-200">
                Range: All
              </div>

              <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('live')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'live' ? 'bg-blue-500/16 text-blue-200' : 'text-slate-400'
                  }`}
                >
                  Live
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('historical')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'historical' ? 'bg-blue-500/16 text-blue-200' : 'text-slate-400'
                  }`}
                >
                  Historical
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {isLoading && (
                <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300">
                  Refreshing chain...
                </div>
              )}
              {chartLoading && (
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300">
                  Refreshing chart...
                </div>
              )}
              {isModeledSession && (
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-300">
                  Session replay
                </div>
              )}
              {error && (
                <div className="max-w-[280px] truncate rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300">
                <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                <span>{clockLabel}</span>
              </div>
              <div className="ml-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300">
                <span>{timestampLabel}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[1.38fr_0.92fr]">
            <div className="overflow-hidden rounded-[22px] border border-white/6 bg-[#0b0d10] shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
              <div className="relative h-[640px] bg-[#0b0d10]">
                <div className="pointer-events-none absolute left-3 top-2 z-10 flex items-center gap-2 text-[11px] font-black">
                  <span className="text-slate-300">{instrument}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-500" />
                  <span className="rounded border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-sky-300">Smart OI</span>
                </div>
                {chartInfo && (
                  <div className="pointer-events-none absolute right-3 top-8 z-10 w-[170px] rounded-md border border-slate-700/80 bg-[#0d1219]/96 px-3 py-2 text-[11px] shadow-[0_12px_26px_rgba(0,0,0,0.45)]">
                    <div className="font-bold text-slate-200">{chartInfo.label}</div>
                    <div className="mt-1 space-y-0.5 text-slate-300">
                      <div>open: {chartInfo.open.toFixed(1)}</div>
                      <div>high: {chartInfo.high.toFixed(1)}</div>
                      <div>low: {chartInfo.low.toFixed(1)}</div>
                      <div>close: {chartInfo.close.toFixed(1)}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-sky-300">
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                      <span>{isModeledSession ? 'Smart OI Proxy:' : 'Smart OI:'}</span>
                      <span className="font-black">{formatSmartOiDisplayValue(chartInfo.smartOi, isModeledSession)}</span>
                    </div>
                  </div>
                )}

                {chartError ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    {chartError}
                  </div>
                ) : (
                  <div ref={chartHostRef} className="h-full w-full" />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/8 bg-[#050a14] p-3">
                <div className="flex items-center justify-between gap-2 border-b border-white/8 px-2 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">Put (Support)</span>
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">Call (Resist)</span>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-violet-300">PE-CE Diff</span>
                    {isModeledSession && <span className="rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-2 py-1 text-violet-200">Modeled</span>}
                  </div>
                  {latestFlow && (
                    <div className="flex gap-2 text-[11px] font-black">
                      <span className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300 font-mono">{formatFlowValueSigned(latestFlow.Put)}</span>
                      <span className="rounded bg-rose-500/15 px-2 py-1 text-rose-300 font-mono">{formatFlowValueSigned(latestFlow.Call)}</span>
                      <span className="rounded bg-violet-500/15 px-2 py-1 text-violet-300 font-mono">{formatFlowValueSigned(latestFlow['PE-CE'])}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 h-[280px]">
                  {flowChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flowChartData} margin={{ top: 8, right: 10, left: -8, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={32} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(value) => formatFlowValue(value)} />
                        <Tooltip content={<FlowTooltip />} />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.14)" />
                        {flowReferencePoint && <ReferenceLine x={flowReferencePoint.time} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" />}
                        <Line type="monotone" dataKey="Put" stroke="#00e676" strokeWidth={2.2} dot={false} activeDot={{ r: 4, fill: '#0b0d10', stroke: '#00e676', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="Call" stroke="#ff1744" strokeWidth={2.2} dot={false} activeDot={{ r: 4, fill: '#0b0d10', stroke: '#ff1744', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="PE-CE" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#0b0d10', stroke: '#a855f7', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                      Session flow starts building after a few live refresh cycles.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-[#050a14] p-3">
                <div className="flex items-center justify-between gap-2 border-b border-white/8 px-2 pb-3">
                  <div className="flex items-center gap-2 text-[11px] font-black text-sky-300">
                    <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-1">PCR Trend</span>
                  </div>
                  <div className="text-sm font-black text-sky-300 font-mono">{latestFlow ? latestFlow.PCR.toFixed(2) : '--'}</div>
                </div>

                <div className="mt-3 h-[240px]">
                  {flowChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flowChartData} margin={{ top: 8, right: 10, left: -8, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={32} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={42} domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                        <Tooltip content={<FlowTooltip />} />
                        <ReferenceLine y={1} stroke="rgba(255,255,255,0.14)" />
                        {flowReferencePoint && <ReferenceLine x={flowReferencePoint.time} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" />}
                        <Line type="monotone" dataKey="PCR" stroke="#00f0ff" strokeWidth={2.4} dot={false} activeDot={{ r: 4, fill: '#0b0d10', stroke: '#00f0ff', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                      PCR trend appears once session history is available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/8 px-4 py-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {keyLevels.map((item) => (
              <MetricTile
                key={item.label}
                label={item.label}
                value={item.value}
                subtext={item.subtext}
                tone={item.tone}
                icon={item.icon}
              />
            ))}
          </div>

          <div className="grid gap-3 border-t border-white/8 px-4 py-4 lg:grid-cols-[1.2fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Activity className="h-4 w-4 text-blue-300" />
                  <span>Trader View</span>
                </div>
                <div
                  className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                    traderView.tone === 'bullish'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(0,230,118,0.2)]'
                      : traderView.tone === 'bearish'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_12px_rgba(255,23,68,0.2)]'
                        : 'border-slate-500/25 bg-slate-500/10 text-slate-300'
                  }`}
                >
                  {traderView.label}
                </div>
              </div>

              {/* Bull vs Bear Power Gauge */}
              <div className="mt-3 rounded-xl border border-white/8 bg-black/40 p-3 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-1.5 font-mono">
                  <span className="text-emerald-400">Put Writers (Support): {bullPowerPct}%</span>
                  <span className="text-rose-400">Call Writers (Resist): {100 - bullPowerPct}%</span>
                </div>
                <div className="relative h-2.5 w-full rounded-full bg-slate-900 overflow-hidden flex shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.6)] transition-all duration-500" 
                    style={{ width: `${bullPowerPct}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-[#ff1744] to-rose-700 shadow-[0_0_12px_rgba(255,23,68,0.6)] transition-all duration-500" 
                    style={{ width: `${100 - bullPowerPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-black text-white">{traderView.label}</div>
                  <div className="mt-1 text-sm text-slate-400">Since {traderView.since}</div>
                </div>
                <div className="rounded-xl border border-white/8 bg-slate-950/60 px-3 py-2 text-right shadow-inner">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Confidence</div>
                  <div className="mt-1 text-xl font-black text-sky-400 font-mono">{traderView.confidence}%</div>
                </div>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{traderView.summary}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {traderView.stats.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/8 bg-slate-950/45 px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                    <div className="mt-2 text-lg font-black text-white font-mono">{item.value}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.subtext}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/8 bg-slate-950/45">
                <div className="border-b border-white/8 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Time Wise View
                </div>
                <div className="divide-y divide-white/6">
                  {traderView.checkpoints.length ? (
                    traderView.checkpoints.map((item) => (
                      <div key={`${item.time}-${item.state}`} className="flex items-center justify-between gap-3 px-3 py-3">
                        <div>
                          <div className="text-sm font-black text-white font-mono">{item.time}</div>
                          <div className="text-xs text-slate-400">{item.note}</div>
                        </div>
                        <div
                          className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                            item.tone === 'bullish'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : item.tone === 'bearish'
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                : 'border-slate-500/25 bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          {getTraderLabel(item.state)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-slate-500">Enough live samples aane par time-wise view fill hoga.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Zap className="h-4 w-4 text-amber-300" />
                <span>Active Institutional Walls</span>
              </div>
              <div className="mt-3 space-y-2">
                {sortedByOi.slice(0, 5).map((row) => {
                  const wallOi = row.dominantSide === 'put' ? row.peOi : row.ceOi;
                  const wallDepthPct = Math.max(8, (wallOi / maxWallOi) * 100);

                  return (
                    <div key={row.strike} className="relative overflow-hidden rounded-xl border border-white/8 bg-slate-950/60 px-3 py-3 shadow-inner">
                      {/* Graphical Depth Bar behind text */}
                      <div 
                        className={`absolute inset-y-0 left-0 opacity-20 pointer-events-none transition-all ${
                          row.dominantSide === 'put' ? 'bg-gradient-to-r from-[#00e676] to-transparent' : 'bg-gradient-to-r from-[#ff1744] to-transparent'
                        }`}
                        style={{ width: `${wallDepthPct}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-black text-white font-mono">
                            <span>{formatPrice(row.strike, 0)}</span>
                            {row.isATM && (
                              <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-sky-300 font-sans shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                                ATM
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-slate-400">
                            {row.dominantSide === 'put' ? '🟢 Major Put Support Wall' : '🔴 Major Call Resistance Wall'}
                          </div>
                        </div>
                        <div className="relative z-10 text-right">
                          <div className={`text-sm font-black font-mono ${row.dominantSide === 'put' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {row.dominantSide === 'put' ? formatCompact(row.peOi) : formatCompact(row.ceOi)}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Chg {row.dominantSide === 'put' ? formatSignedCompact(row.peChg) : formatSignedCompact(row.ceChg)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/8 px-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <BarChart3 className="h-4 w-4 text-sky-300" />
                  <span>Strike Ladder &amp; OI Heatmap</span>
                </div>
                <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
                  Focus around ATM
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/8">
                <div className="grid grid-cols-[1fr_0.8fr_0.95fr_0.8fr_1fr] bg-slate-950/90 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 border-b border-white/8">
                  <span>Call OI</span>
                  <span>Call Chg</span>
                  <span className="text-center">Strike</span>
                  <span className="text-right">Put Chg</span>
                  <span className="text-right">Put OI</span>
                </div>
                <div className="divide-y divide-white/6 bg-slate-950/40">
                  {strikeFocusRows.map((row) => {
                    const ceDepth = Math.max(0, (row.ceOi / maxLadderCeOi) * 100);
                    const peDepth = Math.max(0, (row.peOi / maxLadderPeOi) * 100);

                    return (
                      <div
                        key={row.strike}
                        className={`relative grid grid-cols-[1fr_0.8fr_0.95fr_0.8fr_1fr] items-center px-3 py-2.5 text-sm transition-all ${
                          row.isATM ? 'bg-sky-500/15 border-y border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Call OI with Background Heat Bar */}
                        <div className="relative flex items-center pr-2">
                          <div 
                            className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#ff1744]/25 to-transparent pointer-events-none rounded"
                            style={{ width: `${ceDepth}%` }}
                          />
                          <span className="relative z-10 font-black font-mono text-rose-300">{formatCompact(row.ceOi)}</span>
                        </div>

                        {/* Call Chg */}
                        <div className={`text-xs font-bold font-mono ${row.ceChg >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatSignedCompact(row.ceChg)}
                        </div>

                        {/* Strike */}
                        <div className="text-center">
                          <div className={`font-black font-mono ${row.isATM ? 'text-sky-300 text-base' : 'text-white'}`}>
                            {formatPrice(row.strike, 0)}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-[0.14em]">
                            {row.isATM ? (
                              <span className="text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded">ATM SPOT</span>
                            ) : row.dominantSide === 'put' ? (
                              <span className="text-emerald-400">PUT WALL</span>
                            ) : (
                              <span className="text-rose-400">CALL WALL</span>
                            )}
                          </div>
                        </div>

                        {/* Put Chg */}
                        <div className={`text-right text-xs font-bold font-mono ${row.peChg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatSignedCompact(row.peChg)}
                        </div>

                        {/* Put OI with Background Heat Bar */}
                        <div className="relative flex items-center justify-end pl-2">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00e676]/25 to-transparent pointer-events-none rounded"
                            style={{ width: `${peDepth}%` }}
                          />
                          <span className="relative z-10 font-black font-mono text-emerald-300">{formatCompact(row.peOi)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Tactical Strategy Blueprint Card */}
              <div className={`rounded-2xl border p-4 shadow-xl transition-all ${
                strategyBlueprint.tone === 'bullish'
                  ? 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_25px_rgba(0,230,118,0.1)]'
                  : strategyBlueprint.tone === 'bearish'
                    ? 'border-rose-500/30 bg-rose-950/20 shadow-[0_0_25px_rgba(255,23,68,0.1)]'
                    : 'border-white/10 bg-white/[0.03]'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${
                      strategyBlueprint.tone === 'bullish' ? 'text-emerald-400' : strategyBlueprint.tone === 'bearish' ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Tactical Strategy Setup</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border ${
                    strategyBlueprint.tone === 'bullish'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : strategyBlueprint.tone === 'bearish'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  }`}>
                    {strategyBlueprint.tag}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">{strategyBlueprint.name}</h3>
                    <span className="text-xs font-black text-sky-400 font-mono">R:R {strategyBlueprint.riskReward}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed font-medium">
                    {strategyBlueprint.rationale}
                  </p>

                  {/* Executable Legs */}
                  <div className="mt-3 space-y-1.5">
                    {strategyBlueprint.legs.map((leg, i) => (
                      <div key={i} className="flex items-center justify-between bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            leg.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {leg.action}
                          </span>
                          <span className="font-bold text-white font-mono">{leg.strike}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{leg.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Target & SL Boundary */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                      <div className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">🎯 Target Zone</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">{strategyBlueprint.target}</div>
                    </div>
                    <div className="bg-black/30 border border-rose-500/20 rounded-xl p-2.5 text-center">
                      <div className="text-[10px] text-rose-400 uppercase font-black tracking-wider">🛑 Stop Loss</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">{strategyBlueprint.stopLoss}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Map & Breakeven Band */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Target className="h-4 w-4 text-violet-300" />
                  <span>Market Boundaries</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {playbookItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/8 bg-slate-950/45 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                      <div className="mt-1 text-base font-black text-white">{item.value}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flow Readings */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Activity className="h-4 w-4 text-blue-300" />
                  <span>ATM Option LTP &amp; Total Open Interest</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-rose-500/20 bg-slate-950/45 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-400">Total Call OI</div>
                    <div className="mt-1 text-base font-black text-rose-300">{formatCompact(snapshot.totalCeOi)}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-slate-950/45 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">Total Put OI</div>
                    <div className="mt-1 text-base font-black text-emerald-300">{formatCompact(snapshot.totalPeOi)}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/45 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">ATM Call LTP</div>
                    <div className="mt-1 text-base font-black text-white">{atmRow ? `Rs ${formatPrice(atmRow.ceLtp)}` : '--'}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/45 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">ATM Put LTP</div>
                    <div className="mt-1 text-base font-black text-white">{atmRow ? `Rs ${formatPrice(atmRow.peLtp)}` : '--'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsDecode;
