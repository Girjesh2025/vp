import React, { useState } from 'react';
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

import { fetchSectorRawMonthly } from '../../utils/priceApi';

const SECTORS = [
  { symbol: '^CNXPSUBANK', name: 'PSU Bank', color: '#22c55e' },  // 740 pts ✅
  { symbol: '^CNXMETAL',   name: 'Metals',   color: '#10b981' },  // 740 pts ✅
  { symbol: '^CNXAUTO',    name: 'Auto',     color: '#3b82f6' },  // 740 pts ✅
  { symbol: '^NSEBANK',    name: 'Bank',     color: '#6366f1' },  // 740 pts ✅
  { symbol: '^CNXPHARMA',  name: 'Pharma',   color: '#f59e0b' },  // 740 pts ✅
  { symbol: '^CNXIT',      name: 'IT',       color: '#f97316' },  // 740 pts ✅
  { symbol: '^CNXFMCG',   name: 'FMCG',     color: '#ef4444' },  // 740 pts ✅
  { symbol: '^CNXENERGY',  name: 'Energy',   color: '#f43f5e' },  // 740 pts ✅
  { symbol: '^NIFTYINFRA', name: 'Infra',    color: '#8b5cf6' },  // tested ✅
  { symbol: '^CNXMEDIA',   name: 'Media',    color: '#ec4899' },  // 740 pts ✅
];

const FULL_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const currentMonthIdx = new Date().getMonth();
const trailingMonths: string[] = [];
for (let i = 11; i >= 0; i--) {
  let m = currentMonthIdx - i;
  if (m < 0) m += 12;
  trailingMonths.push(FULL_MONTHS[m]);
}

// ─── Status helper: 3-tier classification ───────────────────────────────────
type SectorStatus = 'Prime' | 'Active' | 'Weak';

const getStatus = (momentum: number): SectorStatus => {
  if (momentum > 10)  return 'Prime';
  if (momentum > -10) return 'Active';
  return 'Weak';
};

const statusStyle: Record<SectorStatus, string> = {
  Prime:  'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40',
  Active: 'bg-orange-900/50  text-orange-400  border border-orange-700/40',
  Weak:   'bg-red-900/50     text-red-400     border border-red-700/40',
};

// ─── KPI subValue colour helper ─────────────────────────────────────────────
const subValueClass = (color: 'green' | 'red' | 'neutral') => ({
  green:   'text-emerald-400',
  red:     'text-red-400',
  neutral: 'text-slate-400',
}[color]);

// ─── helpers for raw→calendar heatmap ───────────────────────────────────────────────
const getTrailingChanges = (ts: number[], cl: number[], n = 12): number[] => {
  const ch: number[] = [];
  for (let i = 1; i < cl.length; i++)
    if (cl[i] > 0 && cl[i - 1] > 0)
      ch.push(Number(((cl[i] - cl[i - 1]) / cl[i - 1] * 100).toFixed(2)));
  while (ch.length < n) ch.unshift(0);
  return ch.slice(-n);
};

const computeYearHeatmap = (rawArr: any[], year: number): any[] =>
  rawArr.map(s => {
    const months: (number | null)[] = new Array(12).fill(null);
    const { timestamps, closes } = s;
    for (let i = 1; i < timestamps.length; i++) {
      if (!closes[i] || !closes[i - 1] || closes[i - 1] === 0) continue;
      const d = new Date(timestamps[i] * 1000);
      if (d.getFullYear() === year)
        months[d.getMonth()] = Number(((closes[i] - closes[i - 1]) / closes[i - 1] * 100).toFixed(1));
    }
    return { sector: s.name, data: months };
  });

// ─── Component ───────────────────────────────────────────────────────────────
type MetricKey = 'capitalFlow' | 'volatilityIndex' | 'momentumScore';

const METRIC_LABELS: Record<MetricKey, string> = {
  capitalFlow:    'Capital Flow %',
  volatilityIndex:'Volatility Index',
  momentumScore:  'Momentum Score',
};

const SectorRotation: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = React.useState(true);
  const [heatmapData, setHeatmapData]             = React.useState<any[]>([]);
  const [performanceTrendsData, setPerformanceTrendsData] = React.useState<any[]>([]);
  const [volatilityData, setVolatilityData]       = React.useState<any[]>([]);
  const [momentumData, setMomentumData]           = React.useState<any[]>([]);
  const [sectorRankings, setSectorRankings]       = React.useState<any[]>([]);
  const [radarData, setRadarData]                 = React.useState<any[]>([]);
  const [kpiData, setKpiData]                     = React.useState<any[]>([]);
  const [selectedMetric, setSelectedMetric]       = React.useState<MetricKey>('capitalFlow');
  const [metricMenuOpen, setMetricMenuOpen]       = React.useState(false);
  const metricRef = React.useRef<HTMLDivElement>(null);

  const [selectedPeriod, setSelectedPeriod]       = React.useState<number>(12);
  const [periodMenuOpen, setPeriodMenuOpen]       = React.useState(false);
  const periodRef = React.useRef<HTMLDivElement>(null);

  const CUR_YEAR = new Date().getFullYear();
  const AVAILABLE_YEARS = [CUR_YEAR - 1, CUR_YEAR];
  const [selectedYear, setSelectedYear]   = React.useState(CUR_YEAR - 1);
  const [yearMenuOpen, setYearMenuOpen]   = React.useState(false);
  const rawDataRef = React.useRef<any[]>([]);
  const yearRef    = React.useRef<HTMLDivElement>(null);

  // Close metric dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (metricRef.current && !metricRef.current.contains(e.target as Node))
        setMetricMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close year dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node))
        setYearMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  type ChartType = 'bar' | 'radar' | 'area';
  const [chartType, setChartType]                 = React.useState<ChartType>('bar');
  const [chartTypeMenuOpen, setChartTypeMenuOpen] = React.useState(false);
  const chartTypeRef = React.useRef<HTMLDivElement>(null);

  // Close chart type dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (chartTypeRef.current && !chartTypeRef.current.contains(e.target as Node))
        setChartTypeMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close period dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node))
        setPeriodMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Re-derive rankings when period changes
  React.useEffect(() => {
    if (rawDataRef.current.length > 0) {
      let sr = rawDataRef.current.map(s => {
        const periodData = s.data.slice(-selectedPeriod);
        const totalChange = periodData.reduce((a: number, b: number) => a + b, 0);
        const recentMomentum = s.data.slice(-3).reduce((a: number, b: number) => a + b, 0) * 3;
        const status: SectorStatus = getStatus(recentMomentum);

        return {
          name:      s.name,
          change:    totalChange >= 0 ? `+${totalChange.toFixed(1)}%` : `${totalChange.toFixed(1)}%`,
          rawChange: totalChange,
          momentum:  Math.min(100, Math.max(0, 50 + recentMomentum)),
          status,
          color:     s.color,
        };
      });
      sr.sort((a, b) => b.rawChange - a.rawChange);
      sr = sr.map((item, idx) => ({ ...item, rank: idx + 1 })).slice(0, 7);
      setSectorRankings(sr);
    }
  }, [selectedPeriod]);

  // Re-derive heatmap when year changes
  React.useEffect(() => {
    if (rawDataRef.current.length > 0)
      setHeatmapData(computeYearHeatmap(rawDataRef.current, selectedYear));
  }, [selectedYear]);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Fetch sequentially to avoid rate-limit
        const rawData: any[] = [];
        for (const s of SECTORS) {
          if (!isMounted) break;
          const { timestamps, closes } = await fetchSectorRawMonthly(s.symbol);
          rawData.push({ ...s, timestamps, closes,
            data: getTrailingChanges(timestamps, closes) });
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (!isMounted) return;
        rawDataRef.current = rawData;

        // ── Heatmap (calendar year) ─────────────────────────────────────────────
        const hd = computeYearHeatmap(rawData, CUR_YEAR - 1);

        // ── Capital Flow bar data ─────────────────────────────────────────────
        const pt = rawData.map(s => {
          const capitalFlow = s.data.reduce((a: number, b: number) => a + b, 0);
          return { name: s.name, value: Number(capitalFlow.toFixed(2)), color: s.color };
        });

        // ── Volatility Index: mean absolute deviation of monthly returns ───────
        const vd = rawData.map(s => {
          const absReturns = s.data.map((v: number) => Math.abs(v));
          const mad = absReturns.length > 0
            ? absReturns.reduce((a: number, b: number) => a + b, 0) / absReturns.length
            : 0;
          return { name: s.name, value: Number(mad.toFixed(2)), color: s.color };
        });

        // ── Momentum Score: weighted sum (recent months get higher weight) ─────
        const md = rawData.map(s => {
          const weights = [1, 1, 1, 1, 1, 1, 1.5, 1.5, 2, 2, 3, 3];
          let score = 0;
          s.data.slice(-12).forEach((v: number, i: number) => { score += v * weights[i]; });
          // Normalize to 0–100 range
          const normalized = Math.min(100, Math.max(0, 50 + score));
          return { name: s.name, value: Number(normalized.toFixed(1)), color: s.color };
        });

        // ── Sector Rankings ──────────────────────────────────────────────────
        let sr = rawData.map(s => {
          const totalChange = s.data.reduce((a: number, b: number) => a + b, 0);
          // Momentum = weighted recent-3m score
          const recentMomentum = s.data.slice(-3).reduce((a: number, b: number) => a + b, 0) * 3;
          const status: SectorStatus = getStatus(recentMomentum);

          return {
            name:      s.name,
            change:    totalChange >= 0 ? `+${totalChange.toFixed(1)}%` : `${totalChange.toFixed(1)}%`,
            rawChange: totalChange,
            momentum:  Math.min(100, Math.max(0, 50 + recentMomentum)),
            status,
            color:     s.color,
          };
        });
        sr.sort((a, b) => b.rawChange - a.rawChange);
        sr = sr.map((item, idx) => ({ ...item, rank: idx + 1 })).slice(0, 7);

        // ── Radar ────────────────────────────────────────────────────────────
        const rd = rawData.slice(0, 6).map(s => {
          const longTerm  = s.data.reduce((a: number, b: number) => a + b, 0);
          const shortTerm = s.data.slice(-6).reduce((a: number, b: number) => a + (-b), 0) * 1.5;
          return {
            subject:  s.name,
            A:        Math.max(50, 100 + longTerm),
            B:        Math.max(50, 100 + shortTerm),
            fullMark: 150,
          };
        });

        // ── KPIs ─────────────────────────────────────────────────────────────
        const topPerformer  = sr[0];
        const primeCount    = sr.filter(s => s.status === 'Prime').length;
        const activeCount   = sr.filter(s => s.status === 'Active').length;
        const weakCount     = sr.filter(s => s.status === 'Weak').length;
        const bullishCount  = primeCount + activeCount;       // Prime + Active = bullish
        const bearishCount  = weakCount;

        // Dynamic avg volatility: mean of absolute monthly returns across all sectors
        const allMonthlyReturns = rawData.flatMap(s => s.data.map((v: number) => Math.abs(v)));
        const avgVol = allMonthlyReturns.length > 0
          ? (allMonthlyReturns.reduce((a: number, b: number) => a + b, 0) / allMonthlyReturns.length).toFixed(1)
          : '9.0';
        const volNum = parseFloat(avgVol);
        const volLabel = volNum < 8 ? 'Low' : volNum < 15 ? 'Normal' : 'Elevated';

        // Rotation signal
        const rotSignal    = primeCount >= 3 ? 'Risk-On' : primeCount <= 1 ? 'Risk-Off' : 'Neutral';
        const rotSubLabel  = primeCount >= 3 ? 'Strong rotation'  : primeCount <= 1 ? 'Defensive posture' : 'Mixed rotation';
        const rotColor: 'green' | 'red' | 'neutral' = primeCount >= 3 ? 'green' : primeCount <= 1 ? 'red' : 'neutral';

        // Bullish sub-text
        const bullSubLabel = bullishCount >= 6 ? 'Strong market' : bullishCount >= 4 ? 'Moderate breadth' : 'Selective weakness';
        const bullColor: 'green' | 'red' | 'neutral' = bullishCount >= 6 ? 'green' : bullishCount >= 4 ? 'neutral' : 'red';

        // Bearish sub-text
        const bearSubLabel = bearishCount === 0 ? 'No weak sectors' : `${bearishCount} sector${bearishCount > 1 ? 's' : ''} lagging`;
        const bearColor: 'green' | 'red' | 'neutral' = bearishCount === 0 ? 'green' : 'red';

        const kpis = [
          {
            label:     'TOP PERFORMER',
            value:     topPerformer?.name || '-',
            subValue:  `${topPerformer?.change || ''} YTD`,
            subColor:  'green' as const,
            icon:      <Wifi className="w-4 h-4 text-emerald-500" />,
          },
          {
            label:     'BULLISH SECTORS',
            value:     String(bullishCount),
            subValue:  bullSubLabel,
            subColor:  bullColor,
            icon:      <ArrowUp className="w-4 h-4 text-emerald-500" />,
          },
          {
            label:     'BEARISH SECTORS',
            value:     String(bearishCount),
            subValue:  bearSubLabel,
            subColor:  bearColor,
            icon:      <ArrowDown className="w-4 h-4 text-red-400" />,
          },
          {
            label:     'AVG VOLATILITY',
            value:     `${avgVol}%`,
            subValue:  volLabel,
            subColor:  volNum < 15 ? 'green' as const : 'red' as const,
            icon:      <Zap className="w-4 h-4 text-emerald-500" />,
          },
          {
            label:     'ROTATION SIGNAL',
            value:     rotSignal,
            subValue:  rotSubLabel,
            subColor:  rotColor,
            icon:      <Repeat className="w-4 h-4 text-slate-400" />,
          },
        ];

        setHeatmapData(hd);
        setPerformanceTrendsData(pt);
        setVolatilityData(vd);
        setMomentumData(md);
        setSectorRankings(sr);
        setRadarData(rd);
        setKpiData(kpis);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // ── Heatmap cell helpers ──────────────────────────────────────────────────
  const getHeatmapColor = (val: number | null): string => {
    if (val === null)  return 'bg-[#111827] text-slate-700 border-transparent';
    if (val >= 5)      return 'bg-[#193828] text-emerald-300 border-emerald-900/30';
    if (val >= -2)     return 'bg-[#1a2538] text-slate-400  border-slate-700/30';
    return                    'bg-[#3b1822] text-red-400    border-red-900/30';
  };
  const fmtCell = (val: number | null): string => {
    if (val === null) return '—';
    const r = Math.round(val);
    return r >= 0 ? `+${r}` : `${r}`;
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
                      12-month capital flow, volatility &amp; momentum analysis
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
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#00e676]" /> Positive Flow</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#ff1744]" /> Negative Flow</span>
                    </>
                  )}
                  {selectedMetric === 'volatilityIndex' && (
                    <span className="text-[10px] text-slate-400 font-medium">Mean absolute deviation of monthly returns — higher = more volatile</span>
                  )}
                  {selectedMetric === 'momentumScore' && (
                    <>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#00e676]" /> Bullish (&gt;60)</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-amber-400" /> Neutral (40–60)</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><span className="w-2 h-2 rounded-full bg-[#ff1744]" /> Bearish (&lt;40)</span>
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

                    const isAllPositive = selectedMetric !== 'capitalFlow';

                    // Y-axis config per metric
                    const yDomain: [number,number] =
                      selectedMetric === 'capitalFlow'     ? [-35, 35] as [number,number] :
                      selectedMetric === 'volatilityIndex' ? [0, 20]  as [number,number] :
                      [0, 100] as [number,number];

                    const yTicks =
                      selectedMetric === 'capitalFlow'     ? [-30,-20,-10,0,10,20,30] :
                      selectedMetric === 'volatilityIndex' ? [0,5,10,15,20] :
                      [0,25,50,75,100];

                    const tooltipSuffix =
                      selectedMetric === 'capitalFlow'     ? '%' :
                      selectedMetric === 'volatilityIndex' ? '%' :
                      ' pts';

                    const tooltipLabel =
                      selectedMetric === 'capitalFlow'     ? 'Capital Flow' :
                      selectedMetric === 'volatilityIndex' ? 'Volatility' :
                      'Momentum';

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
                              if (selectedMetric === 'capitalFlow') {
                                fill = entry.value >= 0 ? 'url(#neonGreenRot)' : 'url(#neonRedRot)';
                              } else if (selectedMetric === 'volatilityIndex') {
                                fill = entry.color;
                              } else {
                                fill = entry.value >= 60 ? '#00e676' : entry.value >= 40 ? '#f59e0b' : '#ff1744';
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
                    <p className="text-[10px] text-slate-400 mt-1 ml-2.5">Performance ranking by period</p>
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
                    {Array.from({ length: 7 }).map((_, i) => (
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
                      <div className="w-20 text-center">Momentum</div>
                      <div className="w-14 text-right">Status</div>
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
                          <div className="w-20 px-3 flex items-center">
                            <div className="flex w-full gap-1">
                               <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: row.momentum > 20 ? row.color : '#1e293b' }} />
                               <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: row.momentum > 50 ? row.color : '#1e293b' }} />
                               <div className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: row.momentum > 80 ? row.color : '#1e293b' }} />
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="w-14 flex justify-end">
                            <span className={`text-[11px] font-black uppercase tracking-wide ${
                               row.status === 'Prime' ? 'text-emerald-400' :
                               row.status === 'Active' ? 'text-orange-400' :
                               'text-rose-400'
                            }`}>
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
                    Sector strength across 12 months · Most recent month highlighted
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
                  Strong (+5% to +15%)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#1a2538] border border-slate-700/30" />
                  Neutral (−2% to +5%)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#3b1822] border border-red-900/30" />
                  Weak (−15% to −2%)
                </div>
              </div>
            </div>

            {/* ── 4. Market Cycle + Radar ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">

              {/* Market Cycle + Seasonal */}
              <div className="space-y-4">
                <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5">
                  <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                    Market Cycle &amp; Sector Rotation
                  </h2>
                  <p className="text-[10px] text-slate-400 ml-2.5 mb-5">Current economic phase and favored sectors</p>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Early Cycle',   detail: 'Financials, Consumer Disc., Real Estate', active: true },
                      { label: 'Mid Cycle',     detail: 'Technology, Industrials, Materials',      active: false },
                      { label: 'Late Cycle',    detail: 'Energy, Healthcare, Utilities',           active: false  },
                      { label: 'Defensive',     detail: 'Utilities, Consumer Staples, Healthcare', active: false },
                    ].map(({ label, detail, active }) => (
                      <div
                        key={label}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center h-24 relative overflow-hidden transition-all ${
                          active
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-800 bg-[#101520] opacity-50'
                        }`}
                      >
                        <div className={`text-xs font-black mb-1 ${active ? 'text-white' : 'text-slate-400'}`}>{label}</div>
                        <div className={`text-[9px] leading-tight ${active ? 'text-emerald-200' : 'text-slate-500'}`}>{detail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seasonal Strength – derived from rankings */}
                <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5">
                  <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                    Seasonal Sector Strength
                  </h2>
                  <p className="text-[10px] text-slate-400 ml-2.5 mb-5">Active sectors this month based on historical patterns</p>

                  <div className="space-y-2">
                    {sectorRankings.slice(0, 4).map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#101520]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px] font-black text-white">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.status === 'Prime' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          }`}>
                            {s.status === 'Prime' ? 'PRIME' : 'ACTIVE'}
                          </span>
                          <span className={`text-xs font-mono font-bold w-14 text-right ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {s.change}
                          </span>
                        </div>
                      </div>
                    ))}

                    {sectorRankings.slice(4).map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-[#0c1017] opacity-80"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px] font-bold text-slate-400">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            OFF
                          </span>
                          <span className={`text-xs font-mono font-bold w-14 text-right ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {s.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-[#0c1017] border border-slate-800 rounded-2xl p-5 flex flex-col">
                <h2 className="text-sm font-black text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                  Sector Analysis Radar
                </h2>
                <p className="text-[10px] text-slate-400 ml-2.5 mb-2">Momentum vs Volatility comparison</p>

                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Momentum"   dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} dot={{ r: 4, fill: '#6366f1', stroke: '#6366f1' }} />
                      <Radar name="Volatility" dataKey="B" stroke="#ef4444" fill="none" dot={{ r: 4, fill: '#0f1520', stroke: '#ef4444', strokeWidth: 2 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-center gap-6 text-[10px] text-slate-400 pb-2">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#6366f1] rounded-full" /> Momentum</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-[#ef4444] bg-[#0f1520]" /> Volatility</div>
                </div>
              </div>
            </div>

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
