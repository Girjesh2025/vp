import React, { useState } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { 
  ArrowLeft, Wifi, ArrowUp, ArrowDown, Zap, ChevronDown, Repeat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-4">

            {/* Back nav */}
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* ── 1. KPI Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-[#172030] border border-slate-800/60 rounded-xl p-4 h-[100px] animate-pulse" />
                  ))
                : kpiData.map((kpi, i) => (
                    <div
                      key={i}
                      className="bg-[#172030] border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between h-[100px] hover:border-slate-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-tight">
                          {kpi.label}
                        </span>
                        {kpi.icon}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white leading-tight">{kpi.value}</div>
                        <div className={`text-xs mt-1 font-medium ${subValueClass(kpi.subColor)}`}>
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
              <div className="lg:col-span-2 bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                      Sector Performance Trends
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 ml-2.5">
                      12-month capital flow, volatility &amp; momentum analysis
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Metric selector dropdown */}
                    <div className="relative" ref={metricRef}>
                      <button
                        onClick={() => setMetricMenuOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs cursor-pointer hover:bg-slate-700 transition select-none"
                      >
                        <span className="text-emerald-400 font-medium">{METRIC_LABELS[selectedMetric]}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${metricMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {metricMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl min-w-[160px] overflow-hidden">
                          {(Object.keys(METRIC_LABELS) as MetricKey[]).map(key => (
                            <button
                              key={key}
                              onClick={() => { setSelectedMetric(key); setMetricMenuOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 ${
                                selectedMetric === key
                                  ? 'bg-emerald-900/40 text-emerald-400 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-700/60'
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
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs cursor-pointer hover:bg-slate-700 transition">
                      Bar Chart <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Metric legend pill */}
                <div className="flex gap-4 mb-3 ml-0.5">
                  {selectedMetric === 'capitalFlow' && (
                    <>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Positive Flow</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-red-500" /> Negative Flow</span>
                    </>
                  )}
                  {selectedMetric === 'volatilityIndex' && (
                    <span className="text-[10px] text-slate-400">Mean absolute deviation of monthly returns — higher = more volatile</span>
                  )}
                  {selectedMetric === 'momentumScore' && (
                    <>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Bullish (&gt;60)</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Neutral (40–60)</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-red-500" /> Bearish (&lt;40)</span>
                    </>
                  )}
                </div>

                <div className="h-[250px] w-full relative">
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
                      selectedMetric === 'capitalFlow'     ? [-30, 30] as [number,number] :
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

                    const getCellColor = (entry: any) => {
                      if (selectedMetric === 'capitalFlow')
                        return entry.value >= 0 ? '#22c55e' : '#ef4444';
                      if (selectedMetric === 'volatilityIndex')
                        return entry.color;  // unique sector color
                      // Momentum: green > 60, amber 40–60, red < 40
                      if (entry.value >= 60) return '#22c55e';
                      if (entry.value >= 40) return '#f59e0b';
                      return '#ef4444';
                    };

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            domain={yDomain}
                            ticks={yTicks}
                          />
                          <Tooltip
                            cursor={{ fill: '#1e293b', opacity: 0.4 }}
                            contentStyle={{
                              backgroundColor: '#1e293b',
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
                              <span style={{ color: '#f8fafc', fontWeight: '500' }}>{`${!isAllPositive && value > 0 ? '+' : ''}${value}${tooltipSuffix}`}</span>,
                              <span style={{ color: '#94a3b8' }}>{tooltipLabel}</span>,
                            ]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={getCellColor(entry)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>

              {/* Sector Rankings – 1/3 width */}
              <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                      Sector Rankings
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 ml-2.5">Performance ranking by period</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs cursor-pointer hover:bg-slate-700 transition">
                    12 Months <ChevronDown className="w-3 h-3" />
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
                    <div className="flex text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                      <div className="w-8">#</div>
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
                          className="flex items-center text-xs py-2 px-2 hover:bg-[#1e293b] rounded-lg transition-colors group"
                        >
                          {/* Rank badge */}
                          <div className="w-8 flex justify-center">
                            <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                              row.rank === 1 ? 'bg-amber-500 text-white' :
                              row.rank === 2 ? 'bg-slate-300 text-slate-800' :
                              row.rank === 3 ? 'bg-amber-700 text-white' :
                              'text-slate-500 bg-transparent'
                            }`}>
                              {row.rank}
                            </div>
                          </div>

                          {/* Sector name */}
                          <div className="flex-1 font-semibold text-slate-300 group-hover:text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                            {row.name}
                          </div>

                          {/* Change */}
                          <div className={`w-16 text-right font-medium text-xs ${
                            row.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {row.change}
                          </div>

                          {/* Momentum bar */}
                          <div className="w-20 px-2">
                            <div className="h-1 w-full bg-[#1e293b] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${row.momentum}%`, backgroundColor: row.color }}
                              />
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="w-14 flex justify-end">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${statusStyle[row.status as SectorStatus]}`}>
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
            <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5 overflow-hidden">

              {/* Card header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                    Monthly Performance Heatmap
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 ml-2.5">
                    Sector strength across 12 months · Most recent month highlighted
                  </p>
                </div>

                {/* Year selector */}
                <div className="relative" ref={yearRef}>
                  <button
                    onClick={() => setYearMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs hover:bg-slate-700 transition select-none"
                  >
                    <span className="text-emerald-400 font-semibold">{selectedYear}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${yearMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {yearMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl min-w-[100px] overflow-hidden">
                      {AVAILABLE_YEARS.map(yr => (
                        <button
                          key={yr}
                          onClick={() => { setSelectedYear(yr); setYearMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors ${
                            selectedYear === yr
                              ? 'bg-emerald-900/40 text-emerald-400 font-semibold'
                              : 'text-slate-300 hover:bg-slate-700/60'
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
                  <div className="flex text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    <div className="w-[88px]" />
                    {FULL_MONTHS.map(m => (
                      <div key={m} className="flex-1 text-center">{m}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="rounded-lg overflow-hidden border border-slate-800/60 relative">
                    {isLoading && (
                      <div className="absolute inset-0 bg-[#0f1520]/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-emerald-400 font-medium text-sm">Loading heatmap…</span>
                        </div>
                      </div>
                    )}
                    {heatmapData.map((row, ri) => (
                      <div
                        key={row.sector}
                        className={`flex items-stretch group ${ri % 2 === 0 ? 'bg-[#121824]' : 'bg-[#0f1520]'}`}
                      >
                        <div className="w-[88px] text-[11px] font-semibold text-slate-400 flex items-center pl-3 py-2 group-hover:text-white transition-colors shrink-0">
                          {row.sector}
                        </div>
                        {(row.data as (number | null)[]).map((val, idx) => (
                          <div key={idx} className="flex-1 p-[2px]">
                            <div className={`w-full h-full min-h-[32px] flex items-center justify-center text-[10px] font-semibold rounded border transition-all ${
                              getHeatmapColor(val)
                            } ${selectedYear === CUR_YEAR && idx === new Date().getMonth() ? 'ring-1 ring-white/20' : ''}`}>
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
              <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-slate-400">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Market Cycle + Seasonal */}
              <div className="space-y-4">
                <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                    Market Cycle &amp; Sector Rotation
                  </h2>
                  <p className="text-[10px] text-slate-500 ml-2.5 mb-5">Current economic phase and favored sectors</p>

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
                            ? 'border-emerald-500 bg-[#121824] shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                            : 'border-slate-800 bg-[#121824] opacity-50'
                        }`}
                      >
                        <div className={`text-xs font-bold mb-1 ${active ? 'text-white' : 'text-slate-300'}`}>{label}</div>
                        <div className={`text-[9px] leading-tight ${active ? 'text-emerald-100/70' : 'text-slate-500'}`}>{detail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seasonal Strength – derived from rankings */}
                <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                    Seasonal Sector Strength
                  </h2>
                  <p className="text-[10px] text-slate-500 ml-2.5 mb-5">Active sectors this month based on historical patterns</p>

                  <div className="space-y-2">
                    {sectorRankings.slice(0, 4).map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-[#16202e]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px] font-bold text-white">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.status === 'Prime' ? 'bg-emerald-900/50 text-emerald-400' :
                            s.status === 'Active' ? 'bg-emerald-900/50 text-emerald-400' :
                            'bg-orange-900/50 text-orange-400'
                          }`}>
                            {s.status === 'Prime' ? 'PRIME' : 'ACTIVE'}
                          </span>
                          <span className={`text-xs font-bold w-12 text-right ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                            {s.change}
                          </span>
                        </div>
                      </div>
                    ))}

                    {sectorRankings.slice(4).map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#1e293b] bg-[#16202e] opacity-80"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px] font-bold text-slate-400">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            OFF
                          </span>
                          <span className={`text-xs font-bold w-12 text-right ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                            {s.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5 flex flex-col">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                  Sector Analysis Radar
                </h2>
                <p className="text-[10px] text-slate-500 ml-2.5 mb-2">Momentum vs Volatility comparison</p>

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
