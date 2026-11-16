import React from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import {
  ArrowLeft, Wifi, ArrowUp, ArrowDown, Zap, ChevronDown, Repeat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList,
  AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { fetchHistoricalOHLCV } from '../../utils/priceApi';
import {
  type DailySeries, type RrgQuadrant, PERIOD_DAYS, alignTo, annualVol, monthlyReturns,
  relativeRotation, seasonality, trailingReturn, yearRow,
} from '../../utils/sectorStats';

// All numbers come from real daily index closes (Yahoo, 10 years). A sector whose data
// cannot be fetched is left out; nothing is estimated.
const BENCH = { symbol: '^NSEI', name: 'Nifty 50' };
const SECTORS = [
  { symbol: '^CNXPSUBANK', name: 'PSU Bank', color: '#22c55e', cyclical: true },
  { symbol: '^CNXMETAL',   name: 'Metals',   color: '#10b981', cyclical: true },
  { symbol: '^CNXAUTO',    name: 'Auto',     color: '#3b82f6', cyclical: true },
  { symbol: '^NSEBANK',    name: 'Bank',     color: '#6366f1', cyclical: true },
  { symbol: '^CNXPHARMA',  name: 'Pharma',   color: '#f59e0b', cyclical: false },
  { symbol: '^CNXIT',      name: 'IT',       color: '#f97316', cyclical: false },
  { symbol: '^CNXFMCG',    name: 'FMCG',     color: '#ef4444', cyclical: false },
  { symbol: '^CNXENERGY',  name: 'Energy',   color: '#f43f5e', cyclical: true },
  { symbol: '^CNXINFRA',   name: 'Infra',    color: '#8b5cf6', cyclical: true },
  { symbol: '^CNXREALTY',  name: 'Realty',   color: '#ec4899', cyclical: true },
];

const FULL_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Status = relative-rotation quadrant vs Nifty 50 (3-month relative strength and its 1-month change)
type SectorStatus = RrgQuadrant;
const QUADRANT_STYLE: Record<RrgQuadrant, string> = {
  Leading: 'text-emerald-400', Improving: 'text-sky-400', Weakening: 'text-amber-400', Lagging: 'text-rose-400',
};
const QUADRANT_HELP: Record<RrgQuadrant, string> = {
  Leading: 'Beating Nifty and gaining',
  Weakening: 'Beating Nifty but losing steam',
  Lagging: 'Behind Nifty and falling further',
  Improving: 'Behind Nifty but catching up',
};

const subValueClass = (color: 'green' | 'red' | 'neutral') => ({
  green:   'text-emerald-400',
  red:     'text-red-400',
  neutral: 'text-slate-400',
}[color]);

type MetricKey = 'capitalFlow' | 'volatilityIndex' | 'momentumScore';
const METRIC_LABELS: Record<MetricKey, string> = {
  capitalFlow:     '12M Return %',
  volatilityIndex: 'Volatility (ann.)',
  momentumScore:   'RS vs Nifty (6M)',
};

interface LoadedSector {
  name: string; color: string; cyclical: boolean;
  s: DailySeries; monthly: Map<string, number>;
}

const pctStr = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

const SectorRotation: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState<LoadedSector[]>([]);
  const [bench, setBench] = React.useState<DailySeries | null>(null);
  const [asOf, setAsOf] = React.useState<string>('');
  const [missing, setMissing] = React.useState<string[]>([]);

  const [selectedMetric, setSelectedMetric]       = React.useState<MetricKey>('capitalFlow');
  const [metricMenuOpen, setMetricMenuOpen]       = React.useState(false);
  const metricRef = React.useRef<HTMLDivElement>(null);

  const [selectedPeriod, setSelectedPeriod]       = React.useState<number>(12);
  const [periodMenuOpen, setPeriodMenuOpen]       = React.useState(false);
  const periodRef = React.useRef<HTMLDivElement>(null);

  const CUR_YEAR = new Date().getFullYear();
  const AVAILABLE_YEARS = [CUR_YEAR - 2, CUR_YEAR - 1, CUR_YEAR];
  const [selectedYear, setSelectedYear]   = React.useState(CUR_YEAR);
  const [yearMenuOpen, setYearMenuOpen]   = React.useState(false);
  const yearRef    = React.useRef<HTMLDivElement>(null);

  type ChartType = 'bar' | 'radar' | 'area';
  const [chartType, setChartType]                 = React.useState<ChartType>('bar');
  const [chartTypeMenuOpen, setChartTypeMenuOpen] = React.useState(false);
  const chartTypeRef = React.useRef<HTMLDivElement>(null);

  // Close any open dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (metricRef.current && !metricRef.current.contains(t)) setMetricMenuOpen(false);
      if (yearRef.current && !yearRef.current.contains(t)) setYearMenuOpen(false);
      if (chartTypeRef.current && !chartTypeRef.current.contains(t)) setChartTypeMenuOpen(false);
      if (periodRef.current && !periodRef.current.contains(t)) setPeriodMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const all = [BENCH, ...SECTORS];
        const settled = await Promise.allSettled(all.map(x => fetchHistoricalOHLCV(x.symbol, { range: '10y', interval: '1d' })));
        if (!isMounted) return;
        const toSeries = (i: number): DailySeries | null => {
          const r = settled[i];
          if (r.status !== 'fulfilled' || r.value.length < 300) return null;
          const bars = [...r.value].sort((a, b) => a.timestamp - b.timestamp);
          return { ts: bars.map(b => b.timestamp), close: bars.map(b => b.close) };
        };
        const b = toSeries(0);
        const out: LoadedSector[] = [];
        const miss: string[] = [];
        SECTORS.forEach((sec, k) => {
          const raw = toSeries(k + 1);
          if (!raw) { miss.push(sec.name); return; }
          const s = b ? alignTo(raw, b) : raw;
          out.push({ name: sec.name, color: sec.color, cyclical: sec.cyclical, s, monthly: monthlyReturns(s) });
        });
        setBench(b);
        setLoaded(out);
        setMissing(miss);
        if (b) setAsOf(new Date(b.ts[b.ts.length - 1] * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }));
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // ── Bar chart metrics ───────────────────────────────────────────────────────
  const metricRow = (fn: (x: LoadedSector) => number | null) =>
    loaded.map(x => ({ name: x.name, color: x.color, v: fn(x) }))
      .filter((r): r is { name: string; color: string; v: number } => r.v !== null)
      .map(r => ({ name: r.name, color: r.color, value: Number(r.v.toFixed(1)) }));
  const performanceTrendsData = React.useMemo(() => metricRow(x => trailingReturn(x.s, 252)), [loaded]);
  const volatilityData = React.useMemo(() => metricRow(x => annualVol(x.s, 252)), [loaded]);
  const momentumData = React.useMemo(() => {
    const b6 = bench ? trailingReturn(bench, 126) : null;
    return metricRow(x => { const r = trailingReturn(x.s, 126); return r === null || b6 === null ? null : r - b6; });
  }, [loaded, bench]);

  // ── Relative rotation per sector ───────────────────────────────────────────
  const rrg = React.useMemo(() => {
    if (!bench) return [];
    return loaded.map(x => ({ name: x.name, color: x.color, cyclical: x.cyclical, r: relativeRotation(x.s, bench) }))
      .filter((x): x is typeof x & { r: NonNullable<typeof x.r> } => x.r !== null)
      .sort((a, b) => b.r.rs - a.r.rs);
  }, [loaded, bench]);

  // ── Rankings for the selected period ───────────────────────────────────────
  const sectorRankings = React.useMemo(() => {
    const days = PERIOD_DAYS[selectedPeriod];
    const bRet = bench ? trailingReturn(bench, days) : null;
    const quad = new Map(rrg.map(x => [x.name, x.r.quadrant]));
    return loaded
      .map(x => ({ x, ret: trailingReturn(x.s, days) }))
      .filter((r): r is { x: LoadedSector; ret: number } => r.ret !== null)
      .sort((a, b) => b.ret - a.ret)
      .map(({ x, ret }, i) => {
        const rs = bRet === null ? 0 : ret - bRet;
        return {
          rank: i + 1,
          name: x.name,
          color: x.color,
          change: pctStr(ret),
          rawChange: ret,
          rs,
          // 0-100 bar: 50 = same as Nifty, ±10% relative = full / empty
          momentum: Math.min(100, Math.max(0, 50 + rs * 5)),
          status: (quad.get(x.name) ?? 'Lagging') as SectorStatus,
        };
      });
  }, [loaded, bench, rrg, selectedPeriod]);

  // ── Heatmap ────────────────────────────────────────────────────────────────
  const heatmapData = React.useMemo(
    () => loaded.map(x => ({ sector: x.name, data: yearRow(x.monthly, selectedYear) })),
    [loaded, selectedYear]
  );

  // ── Seasonality of the current calendar month ─────────────────────────────
  const curMonth = new Date().getMonth() + 1;
  const seasonal = React.useMemo(() => loaded
    .map(x => ({ name: x.name, color: x.color, st: seasonality(x.monthly, curMonth, CUR_YEAR) }))
    .filter((x): x is typeof x & { st: NonNullable<typeof x.st> } => x.st !== null)
    .sort((a, b) => b.st.avg - a.st.avg), [loaded, curMonth, CUR_YEAR]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpiData = React.useMemo(() => {
    if (!loaded.length) return [];
    const top12 = [...performanceTrendsData].sort((a, b) => b.value - a.value)[0];
    const beating = rrg.filter(x => x.r.rs >= 0).length;
    const lagging = rrg.length - beating;
    const vols = volatilityData.map(v => v.value);
    const avgVol = vols.length ? vols.reduce((a, v) => a + v, 0) / vols.length : null;
    const volLabel = avgVol === null ? '' : avgVol < 15 ? 'Low' : avgVol < 22 ? 'Normal' : 'Elevated';
    const avgRs = (cyc: boolean) => {
      const xs = rrg.filter(x => x.cyclical === cyc).map(x => x.r.rs);
      return xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : null;
    };
    const cyc = avgRs(true), def = avgRs(false);
    const spread = cyc !== null && def !== null ? cyc - def : null;
    const rot = spread === null ? 'n/a' : spread > 2 ? 'Risk-On' : spread < -2 ? 'Risk-Off' : 'Neutral';
    return [
      { label: 'TOP PERFORMER (12M)', value: top12?.name ?? '-', subValue: top12 ? pctStr(top12.value) : '', subColor: (top12 && top12.value >= 0 ? 'green' : 'red') as 'green' | 'red', icon: <Wifi className="w-4 h-4 text-emerald-500" /> },
      { label: 'BEATING NIFTY (3M)', value: String(beating), subValue: `of ${rrg.length} sectors`, subColor: (beating >= rrg.length / 2 ? 'green' : 'neutral') as 'green' | 'neutral', icon: <ArrowUp className="w-4 h-4 text-emerald-500" /> },
      { label: 'LAGGING NIFTY (3M)', value: String(lagging), subValue: lagging === 0 ? 'None lagging' : `${lagging} behind Nifty`, subColor: (lagging === 0 ? 'green' : 'red') as 'green' | 'red', icon: <ArrowDown className="w-4 h-4 text-red-400" /> },
      { label: 'AVG VOLATILITY (ANN.)', value: avgVol === null ? '-' : `${avgVol.toFixed(1)}%`, subValue: volLabel, subColor: (avgVol !== null && avgVol < 22 ? 'green' : 'red') as 'green' | 'red', icon: <Zap className="w-4 h-4 text-emerald-500" /> },
      { label: 'ROTATION SIGNAL', value: rot, subValue: spread === null ? '' : `Cyclicals vs defensives ${pctStr(spread)} (3M)`, subColor: (rot === 'Risk-On' ? 'green' : rot === 'Risk-Off' ? 'red' : 'neutral') as 'green' | 'red' | 'neutral', icon: <Repeat className="w-4 h-4 text-slate-400" /> },
    ];
  }, [loaded, performanceTrendsData, volatilityData, rrg]);

  // ── Heatmap cell helpers ──────────────────────────────────────────────────
  const getHeatmapColor = (val: number | null): string => {
    if (val === null)  return 'bg-[#111827] text-slate-700 border-transparent';
    if (val >= 2)      return 'bg-[#193828] text-emerald-300 border-emerald-900/30';
    if (val > -2)      return 'bg-[#1a2538] text-slate-400  border-slate-700/30';
    return                    'bg-[#3b1822] text-red-400    border-red-900/30';
  };
  const fmtCell = (val: number | null): string => {
    if (val === null) return '—';
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar
        activeTab="tools"
        onTabChange={(tabId) => navigate('/app', { state: { activeTab: tabId } })}
        portfolioCount={0}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#080c14]">
          <div className="w-full max-w-[1700px] mx-auto space-y-4">

            {/* Back nav */}
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-2 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* ── 1. KPI Row (Clean Solid Fintech) ─────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 h-[95px] animate-pulse" />
                  ))
                : kpiData.map((kpi, i) => (
                    <div
                      key={i}
                      className="bg-[#0c1017] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between h-[95px] hover:border-slate-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                          {kpi.label}
                        </span>
                        {kpi.icon}
                      </div>
                      <div>
                        <div className="text-xl font-black text-white leading-tight">{kpi.value}</div>
                        <div className={`text-xs mt-0.5 font-bold ${subValueClass(kpi.subColor)}`}>
                          {kpi.subValue}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* ── 2. Bar Chart + Rankings ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Bar Chart – 2/3 width */}
              <div className="lg:col-span-2 bg-[#0c1017] border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                      Sector Performance Trends
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 ml-2.5">
                      12-month return, volatility and 6-month strength vs Nifty 50 · daily closes{asOf ? ` to ${asOf}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Metric selector dropdown */}
                    <div className="relative" ref={metricRef}>
                      <button
                        onClick={() => setMetricMenuOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] border border-slate-700 rounded-lg text-xs cursor-pointer hover:bg-slate-800 transition select-none"
                      >
                        <span className="text-emerald-400 font-bold">{METRIC_LABELS[selectedMetric]}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${metricMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {metricMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-[#101520] border border-slate-700 rounded-lg shadow-xl min-w-[160px] overflow-hidden">
                          {(Object.keys(METRIC_LABELS) as MetricKey[]).map(key => (
                            <button
                              key={key}
                              onClick={() => { setSelectedMetric(key); setMetricMenuOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 ${
                                selectedMetric === key
                                  ? 'bg-emerald-900/40 text-emerald-400 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {selectedMetric === key && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                              {selectedMetric !== key && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                              {METRIC_LABELS[key]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chart Type Selector Dropdown */}
                    <div className="relative" ref={chartTypeRef}>
                      <button
                        type="button"
                        onClick={() => setChartTypeMenuOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] border border-slate-700 rounded-lg text-xs font-bold text-slate-200 cursor-pointer hover:bg-slate-800 transition select-none"
                      >
                        <span>{chartType === 'bar' ? 'Bar Chart' : chartType === 'radar' ? 'Radar Chart' : 'Area Chart'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${chartTypeMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {chartTypeMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-[#101520] border border-slate-700 rounded-lg shadow-xl min-w-[130px] overflow-hidden py-1">
                          {[
                            { id: 'bar', label: 'Bar Chart' },
                            { id: 'area', label: 'Area Chart' },
                            { id: 'radar', label: 'Radar Chart' }
                          ].map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => { setChartType(item.id as ChartType); setChartTypeMenuOpen(false); }}
                              className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between ${
                                chartType === item.id ? 'bg-blue-600/30 text-sky-300' : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {item.label}
                              {chartType === item.id && <span className="text-sky-300">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metric legend pill */}
                <div className="flex gap-4 mb-3 ml-0.5">
                  {selectedMetric === 'capitalFlow' && (
                    <>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#00e676]" /> Up over 12 months</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#ff1744]" /> Down over 12 months</span>
                    </>
                  )}
                  {selectedMetric === 'volatilityIndex' && (
                    <span className="text-[10px] text-slate-400 font-medium">Annualised standard deviation of daily returns, last 12 months — higher = more volatile</span>
                  )}
                  {selectedMetric === 'momentumScore' && (
                    <>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#00e676]" /> Beat Nifty (6M return − Nifty 6M return)</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#ff1744]" /> Lagged Nifty</span>
                    </>
                  )}
                </div>

                <div className="h-[270px] w-full relative">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-emerald-500 text-xs font-medium">Loading chart…</span>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const chartData =
                      selectedMetric === 'capitalFlow'    ? performanceTrendsData :
                      selectedMetric === 'volatilityIndex'? volatilityData :
                      momentumData;

                    const isAllPositive = selectedMetric === 'volatilityIndex';

                    // Y-axis config per metric
                    // Fit the axis to the real values so no bar is clipped
                    const vals = chartData.map((d: any) => d.value as number);
                    const hiV = Math.max(0, ...vals), loV = Math.min(0, ...vals);
                    const step = Math.max(5, Math.ceil((hiV - loV) / 6 / 5) * 5);
                    const yDomain: [number,number] = [Math.floor(loV / step) * step, Math.ceil(hiV / step) * step || step];
                    const yTicks: number[] = [];
                    for (let t = yDomain[0]; t <= yDomain[1]; t += step) yTicks.push(t);

                    const tooltipSuffix =
                      selectedMetric === 'capitalFlow'     ? '%' :
                      '%';

                    const tooltipLabel =
                      selectedMetric === 'capitalFlow'     ? '12M Return' :
                      selectedMetric === 'volatilityIndex' ? 'Volatility' :
                      'vs Nifty (6M)';

                    if (chartType === 'radar') {
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 700 }} />
                            <PolarRadiusAxis stroke="#475569" domain={yDomain} tick={{ fill: '#64748b', fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0c1017',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#f8fafc',
                              }}
                              formatter={(val: any) => [`${val}${tooltipSuffix}`, tooltipLabel]}
                            />
                            <Radar name={tooltipLabel} dataKey="value" stroke="#00e676" fill="#00e676" fillOpacity={0.4} />
                          </RadarChart>
                        </ResponsiveContainer>
                      );
                    }

                    if (chartType === 'area') {
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 24, right: 10, left: -20, bottom: 20 }}>
                            <defs>
                              <linearGradient id="areaFlowGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00e676" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#00e676" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                            <XAxis
                              dataKey="name"
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                              tickLine={false}
                              tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 800 }}
                              dy={6}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                              domain={yDomain}
                              ticks={yTicks}
                            />
                            <Tooltip
                              cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                              contentStyle={{
                                backgroundColor: '#0c1017',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#f8fafc',
                              }}
                              formatter={(value: any) => [
                                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{`${!isAllPositive && value > 0 ? '+' : ''}${value}${tooltipSuffix}`}</span>,
                                <span style={{ color: '#94a3b8' }}>{tooltipLabel}</span>,
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#00e676"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#areaFlowGrad)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      );
                    }

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 24, right: 10, left: -20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="neonGreenRot" x1="0" y1="1" x2="0" y2="0">
                              <stop offset="0%" stopColor="#004d40" stopOpacity={1} />
                              <stop offset="50%" stopColor="#00c853" stopOpacity={1} />
                              <stop offset="100%" stopColor="#00e676" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="neonRedRot" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff1744" stopOpacity={1} />
                              <stop offset="50%" stopColor="#d50000" stopOpacity={1} />
                              <stop offset="100%" stopColor="#3e0007" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                          <XAxis
                            dataKey="name"
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                            tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 800 }}
                            dy={6}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            domain={yDomain}
                            ticks={yTicks}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{
                              backgroundColor: '#0c1017',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#f8fafc',
                            }}
                            itemStyle={{
                              color: '#94a3b8',
                            }}
                            labelStyle={{
                              color: '#f8fafc',
                              fontWeight: 'bold',
                              marginBottom: '4px'
                            }}
                            formatter={(value: any) => [
                              <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{`${!isAllPositive && value > 0 ? '+' : ''}${value}${tooltipSuffix}`}</span>,
                              <span style={{ color: '#94a3b8' }}>{tooltipLabel}</span>,
                            ]}
                          />
                          <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={28}>
                            <LabelList
                              dataKey="value"
                              position="top"
                              formatter={(val: number) => `${!isAllPositive && val > 0 ? '+' : ''}${val}${tooltipSuffix}`}
                              fill="#f1f5f9"
                              fontSize={10}
                              fontWeight={800}
                              offset={6}
                            />
                            {chartData.map((entry: any, index: number) => {
                              let fill = 'url(#neonGreenRot)';
                              if (selectedMetric === 'volatilityIndex') {
                                fill = entry.color;
                              } else {
                                fill = entry.value >= 0 ? 'url(#neonGreenRot)' : 'url(#neonRedRot)';
                              }
                              return <Cell key={`cell-${index}`} fill={fill} style={{ cursor: 'pointer' }} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>

              {/* Sector Rankings – 1/3 width */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                      Sector Rankings
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 ml-2.5">Return over the period · bar = vs Nifty · status = rotation (3M)</p>
                  </div>
                  <div className="relative" ref={periodRef}>
                    <div 
                      onClick={() => setPeriodMenuOpen(o => !o)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer transition select-none ${
                        periodMenuOpen || selectedPeriod !== 12
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-[#101520] border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {selectedPeriod === 1 ? '1 Month' : `${selectedPeriod} Months`} <ChevronDown className={`w-3 h-3 transition-transform ${periodMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {periodMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-[#101520] border border-slate-700 rounded-lg shadow-xl min-w-[120px] overflow-hidden py-1">
                        {[1, 3, 6, 12].map(p => (
                          <button
                            key={p}
                            onClick={() => { setSelectedPeriod(p); setPeriodMenuOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                              selectedPeriod === p
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {selectedPeriod === p && <span className="text-white">&#10003;</span>}
                            {selectedPeriod !== p && <span className="w-3" />}
                            {p === 1 ? '1 Month' : `${p} Months`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-9 bg-[#1e293b] rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Table header */}
                    <div className="flex text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                      <div className="w-8 text-center">#</div>
                      <div className="flex-1">Sector</div>
                      <div className="w-16 text-right">Change</div>
                      <div className="w-20 text-center">vs Nifty</div>
                      <div className="w-20 text-right">Status</div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                      {sectorRankings.map((row) => (
                        <div
                          key={row.rank}
                          className="flex items-center text-xs py-2.5 px-2 hover:bg-slate-800/40 rounded-lg transition-colors group"
                        >
                          {/* Rank badge */}
                          <div className="w-8 flex justify-center">
                            <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-[11px] ${
                              row.rank === 1 ? 'bg-[#facc15] text-[#0f172a]' :
                              row.rank === 2 ? 'bg-[#8b5cf6] text-white' :
                              row.rank === 3 ? 'bg-[#f97316] text-white' :
                              'text-slate-400 bg-slate-800/50'
                            }`}>
                              {row.rank}
                            </div>
                          </div>

                          {/* Sector name */}
                          <div className="flex-1 font-black text-slate-200 group-hover:text-white flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: row.color }} />
                            {row.name}
                          </div>

                          {/* Change */}
                          <div className="w-16 flex justify-end">
                            <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              row.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {row.change}
                            </div>
                          </div>

                          {/* Momentum bar */}
                          <div className="w-20 px-3 flex items-center" title={`${row.rs >= 0 ? '+' : ''}${row.rs.toFixed(1)}% vs Nifty`}>
                            <div className="flex w-full gap-1">
                               <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: row.momentum > 20 ? row.color : '#1e293b' }} />
                               <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: row.momentum > 50 ? row.color : '#1e293b' }} />
                               <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: row.momentum > 80 ? row.color : '#1e293b' }} />
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="w-20 flex justify-end">
                            <span title={QUADRANT_HELP[row.status as SectorStatus]} className={`text-[11px] font-black uppercase tracking-wide ${QUADRANT_STYLE[row.status as SectorStatus]}`}>
                              {row.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. Monthly Heatmap ──────────────────────────────────────────── */}
            <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 overflow-hidden">

              {/* Card header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                    Monthly Performance Heatmap
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 ml-2.5">
                    Monthly % change (month-end closes) · current month is month-to-date
                  </p>
                </div>

                {/* Year selector */}
                <div className="relative" ref={yearRef}>
                  <button
                    onClick={() => setYearMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-800 transition select-none"
                  >
                    <span className="text-emerald-400 font-bold">{selectedYear}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${yearMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {yearMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#101520] border border-slate-700 rounded-lg shadow-xl min-w-[100px] overflow-hidden">
                      {AVAILABLE_YEARS.map(yr => (
                        <button
                          key={yr}
                          onClick={() => { setSelectedYear(yr); setYearMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors ${
                            selectedYear === yr
                              ? 'bg-emerald-900/40 text-emerald-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {selectedYear === yr ? <span className="text-emerald-400">&#10003;</span> : <span className="w-3" />}
                          {yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                <div className="min-w-[780px]">
                  {/* Month column headers */}
                  <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <div className="w-[88px]" />
                    {FULL_MONTHS.map(m => (
                      <div key={m} className="flex-1 text-center">{m}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="rounded-xl overflow-hidden border border-slate-800 relative">
                    {isLoading && (
                      <div className="absolute inset-0 bg-[#0c1017]/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-emerald-400 font-bold text-sm">Loading heatmap…</span>
                        </div>
                      </div>
                    )}
                    {heatmapData.map((row, ri) => (
                      <div
                        key={row.sector}
                        className={`flex items-stretch group ${ri % 2 === 0 ? 'bg-[#0e1420]' : 'bg-[#090d14]'}`}
                      >
                        <div className="w-[88px] text-[11px] font-bold text-slate-300 flex items-center pl-3 py-2 group-hover:text-white transition-colors shrink-0">
                          {row.sector}
                        </div>
                        {(row.data as (number | null)[]).map((val, idx) => (
                          <div key={idx} className="flex-1 p-[2px]">
                            <div className={`w-full h-full min-h-[32px] flex items-center justify-center text-[10px] font-mono font-bold rounded border transition-all ${
                              getHeatmapColor(val)
                            } ${selectedYear === CUR_YEAR && idx === new Date().getMonth() ? 'ring-1 ring-white/30' : ''}`}>
                              {fmtCell(val)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#193828] border border-emerald-900/40" />
                  Up 2% or more
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#1a2538] border border-slate-700/30" />
                  Between −2% and +2%
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#3b1822] border border-red-900/30" />
                  Down 2% or more
                </div>
              </div>
            </div>

            {/* ── 4. Seasonality + Relative Rotation ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">

              {/* Seasonality: this calendar month in past years */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                  {FULL_MONTHS[curMonth - 1]} Seasonality
                </h2>
                <p className="text-[10px] text-slate-400 ml-2.5 mb-4">
                  Average {FULL_MONTHS[curMonth - 1]} return in past years · history is not a forecast
                </p>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-[#1e293b] rounded-lg animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">
                      <div className="flex-1">Sector</div>
                      <div className="w-20 text-right">Avg</div>
                      <div className="w-24 text-right">Up years</div>
                    </div>
                    {seasonal.map(x => (
                      <div key={x.name} className="flex items-center text-xs px-3 py-2 rounded-lg border border-slate-800 bg-[#101520]">
                        <div className="flex-1 flex items-center gap-2 font-bold text-slate-200">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: x.color }} />{x.name}
                        </div>
                        <div className={`w-20 text-right font-mono font-bold ${x.st.avg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pctStr(x.st.avg)}</div>
                        <div className="w-24 text-right font-mono text-slate-400">{x.st.upYears} of {x.st.years}</div>
                      </div>
                    ))}
                    {!seasonal.length && <p className="text-xs text-slate-500 px-3">No history available</p>}
                  </div>
                )}
              </div>

              {/* Relative Rotation vs Nifty 50 */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                  Relative Rotation vs Nifty 50
                </h2>
                <p className="text-[10px] text-slate-400 ml-2.5 mb-4">
                  RS = sector 3M return − Nifty 3M return · Trend = change in RS over the last month
                </p>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-[#1e293b] rounded-lg animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">
                      <div className="flex-1">Sector</div>
                      <div className="w-16 text-right">RS</div>
                      <div className="w-16 text-right">Trend</div>
                      <div className="w-24 text-right">Quadrant</div>
                    </div>
                    {rrg.map(x => (
                      <div key={x.name} title={QUADRANT_HELP[x.r.quadrant]} className="flex items-center text-xs px-3 py-2 rounded-lg border border-slate-800 bg-[#101520]">
                        <div className="flex-1 flex items-center gap-2 font-bold text-slate-200">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: x.color }} />{x.name}
                          <span className="text-[9px] font-normal text-slate-500">{x.cyclical ? 'cyclical' : 'defensive'}</span>
                        </div>
                        <div className={`w-16 text-right font-mono font-bold ${x.r.rs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pctStr(x.r.rs)}</div>
                        <div className={`w-16 text-right font-mono ${x.r.rsMomentum >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>{x.r.rsMomentum >= 0 ? '▲' : '▼'} {Math.abs(x.r.rsMomentum).toFixed(1)}</div>
                        <div className={`w-24 text-right font-black uppercase text-[11px] ${QUADRANT_STYLE[x.r.quadrant]}`}>{x.r.quadrant}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {missing.length > 0 && (
              <div className="text-center text-[11px] text-amber-300/80">
                No data right now for: {missing.join(', ')} — left out instead of estimated.
              </div>
            )}

            {/* Footer disclaimer */}
            <div className="text-center text-[10px] text-slate-600 py-4 italic">
              Analysis is for informational purposes only. Not financial advice.
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SectorRotation;
