import React, { useEffect, useMemo, useState } from 'react';
import { Target, BarChart3, Activity, Award, ArrowUpRight, ArrowDownRight, Compass, RefreshCw } from 'lucide-react';
import type { Transaction } from '../types';
import { fetchHistoricalOHLCV } from '../utils/priceApi';

// Real index history from Yahoo daily bars. Nothing on this tab is hardcoded:
// if an index cannot be fetched it is left out instead of showing a made-up number.

interface Props {
  /** Market value of the current holdings */
  currentValue: number;
  /** Money invested in the current holdings */
  totalInvested: number;
  /** Transactions of the current holdings only */
  transactions: Transaction[];
}

interface IndexDef { name: string; symbol: string }
const INDICES: IndexDef[] = [
  { name: 'Nifty 50', symbol: '^NSEI' },
  { name: 'BSE Sensex', symbol: '^BSESN' },
  { name: 'Nifty Next 50', symbol: '^NSMIDCP' },
  { name: 'Nifty Midcap 150', symbol: 'NIFTYMIDCAP150.NS' },
];

type Timeframe = '1M' | '3M' | '6M' | '1Y' | '3Y';
const TF_BARS: Record<Timeframe, number> = { '1M': 21, '3M': 63, '6M': 126, '1Y': 252, '3Y': 756 };
const TIMEFRAMES: Array<{ key: Timeframe; label: string }> = [
  { key: '1M', label: '1 Month' }, { key: '3M', label: '3 Months' }, { key: '6M', label: '6 Months' },
  { key: '1Y', label: '1 Year' }, { key: '3Y', label: '3 Years' },
];
const RISK_FREE = 6.5; // % per year (approx. Indian T-bill)

interface Series { ts: number[]; close: number[] }
interface IndexStats { ret: number; vol: number; maxDD: number; sharpe: number | null }

const statsFor = (s: Series, bars: number): IndexStats | null => {
  if (s.close.length <= bars) return null;
  const w = s.close.slice(-(bars + 1));
  const ret = (w[w.length - 1] / w[0] - 1) * 100;
  const daily: number[] = [];
  for (let i = 1; i < w.length; i++) daily.push(w[i] / w[i - 1] - 1);
  const mean = daily.reduce((a, v) => a + v, 0) / daily.length;
  const sd = Math.sqrt(daily.reduce((a, v) => a + (v - mean) ** 2, 0) / Math.max(1, daily.length - 1));
  const vol = sd * Math.sqrt(252) * 100;
  let peak = w[0], maxDD = 0;
  for (const c of w) { peak = Math.max(peak, c); maxDD = Math.min(maxDD, (c / peak - 1) * 100); }
  // Sharpe only for 1 year or longer; annualising a 1-month return is noise
  const annRet = bars >= 252 ? (Math.pow(w[w.length - 1] / w[0], 252 / bars) - 1) * 100 : null;
  const sharpe = annRet !== null && vol > 0 ? (annRet - RISK_FREE) / vol : null;
  return { ret, vol, maxDD, sharpe };
};

/** Index close on the given date, or the last close before it */
const closeOnOrBefore = (s: Series, tsSec: number): number | null => {
  let lo = 0, hi = s.ts.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (s.ts[mid] <= tsSec) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans >= 0 ? s.close[ans] : null;
};

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const inr = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const BenchmarkComparison: React.FC<Props> = ({ currentValue, totalInvested, transactions }) => {
  const [tf, setTf] = useState<Timeframe>('1Y');
  const [series, setSeries] = useState<Record<string, Series>>({});
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled(INDICES.map(i => fetchHistoricalOHLCV(i.symbol, { range: '10y', interval: '1d' }))).then(results => {
      if (!alive) return;
      const out: Record<string, Series> = {};
      results.forEach((r, k) => {
        if (r.status !== 'fulfilled' || r.value.length < 250) return;
        const bars = [...r.value].sort((a, b) => a.timestamp - b.timestamp);
        out[INDICES[k].symbol] = { ts: bars.map(b => b.timestamp), close: bars.map(b => b.close) };
      });
      setSeries(out);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [reloadKey]);

  const nifty = series['^NSEI'];

  // "Same cash flows into Nifty 50": every buy buys Nifty with the same money on the same day,
  // every sell sells Nifty worth the same money. Compared with the current holdings' value.
  const mirror = useMemo(() => {
    if (!nifty || !transactions.length) return null;
    const last = nifty.close[nifty.close.length - 1];
    let units = 0, used = 0, skipped = 0, beforeHistory = 0;
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const t of sorted) {
      const ts = Math.floor(new Date(t.date).getTime() / 1000);
      const amt = t.price * t.quantity;
      if (!isFinite(ts) || !(amt > 0)) { skipped++; continue; }
      let p = closeOnOrBefore(nifty, ts);
      if (p === null) { p = nifty.close[0]; beforeHistory++; }
      units += (t.type === 'buy' ? 1 : -1) * amt / p;
      used++;
    }
    if (!used) return null;
    const value = units * last;
    return { value, diff: currentValue - value, skipped, beforeHistory };
  }, [nifty, transactions, currentValue]);

  const yourReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  const niftyMirrorReturn = mirror && totalInvested > 0 ? ((mirror.value - totalInvested) / totalInvested) * 100 : null;

  const rows = INDICES
    .filter(i => series[i.symbol])
    .map(i => ({ ...i, s: statsFor(series[i.symbol], TF_BARS[tf]) }))
    .filter((r): r is IndexDef & { s: IndexStats } => r.s !== null);
  const best = rows.reduce<(typeof rows)[number] | null>((b, r) => (!b || r.s.ret > b.s.ret ? r : b), null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#0c121e]/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Benchmark Relative Alpha</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Index Benchmark Comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">Your holdings vs the same money put into Nifty 50 on the same days</p>
        </div>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 hover:bg-white/[0.04]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Your Holdings Return</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-3xl font-mono font-bold tracking-tight ${yourReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pct(yourReturn)}</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{inr(currentValue)} now on {inr(totalInvested)} invested</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Alpha vs Nifty 50</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          {mirror && niftyMirrorReturn !== null ? (
            <>
              <div className={`text-3xl font-mono font-bold tracking-tight flex items-center gap-1.5 ${mirror.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mirror.diff >= 0 ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                {pct(yourReturn - niftyMirrorReturn)}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Same money in Nifty 50: {inr(mirror.value)} ({pct(niftyMirrorReturn)}) · you are {mirror.diff >= 0 ? 'ahead' : 'behind'} by {inr(Math.abs(mirror.diff))}
              </p>
              {(mirror.skipped > 0 || mirror.beforeHistory > 0) && (
                <p className="text-[11px] text-amber-300/80 mt-1">
                  {mirror.skipped > 0 && `${mirror.skipped} transaction(s) without a valid date left out. `}
                  {mirror.beforeHistory > 0 && `${mirror.beforeHistory} older than index history used the oldest close.`}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">{loading ? 'Loading Nifty history…' : 'Needs dated transactions and Nifty data.'}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Best Index ({tf})</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          {best ? (
            <>
              <div className="text-3xl font-mono font-bold text-white tracking-tight">{pct(best.s.ret)}</div>
              <p className="text-xs text-amber-300/80 mt-1 font-mono truncate">{best.name}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">{loading ? 'Loading…' : 'No index data'}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" /> Index Performance ({tf})
          </h4>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080d16] border border-slate-800 self-start overflow-x-auto max-w-full">
            {TIMEFRAMES.map(t => (
              <button
                key={t.key}
                onClick={() => setTf(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                  tf === t.key ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="text-left py-3 px-4 font-semibold">Index</th>
                <th className="text-right py-3 px-4 font-semibold">Return</th>
                <th className="text-right py-3 px-4 font-semibold">Volatility (ann.)</th>
                <th className="text-right py-3 px-4 font-semibold">Max Drawdown</th>
                <th className="text-right py-3 px-4 font-semibold">Sharpe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {rows.map(r => (
                <tr key={r.symbol} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">{r.name}</td>
                  <td className={`text-right py-3 px-4 font-semibold ${r.s.ret >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pct(r.s.ret)}</td>
                  <td className="text-right py-3 px-4 text-slate-400">{r.s.vol.toFixed(1)}%</td>
                  <td className="text-right py-3 px-4 text-rose-300/80">{r.s.maxDD.toFixed(1)}%</td>
                  <td className="text-right py-3 px-4 text-slate-300">{r.s.sharpe === null ? '—' : r.s.sharpe.toFixed(2)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500 font-sans">{loading ? 'Loading index history…' : 'Index data unavailable right now'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Daily closes from Yahoo Finance. Sharpe uses {RISK_FREE}% risk-free rate and is shown for 1 year and longer only.
        </p>
      </div>
    </div>
  );
};

export default BenchmarkComparison;
