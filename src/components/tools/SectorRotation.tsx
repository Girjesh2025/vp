import React, { useState } from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { 
  ArrowLeft, Wifi, ArrowUp, ArrowDown, Zap, Search, ChevronDown, Repeat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// --- MOCK DATA FOR VISUAL MATCH ---

const kpiData = [
  { label: 'TOP PERFORMER', value: 'PSU Bank', subValue: '+26.8% YTD', icon: <Wifi className="w-4 h-4 text-emerald-500" /> },
  { label: 'BULLISH SECTORS', value: '8', subValue: 'Mixed signals', icon: <ArrowUp className="w-4 h-4 text-slate-500" /> },
  { label: 'BEARISH SECTORS', value: '14', subValue: 'Risk-off', icon: <ArrowDown className="w-4 h-4 text-red-500" /> },
  { label: 'AVG VOLATILITY', value: '9.4%', subValue: 'Normal', icon: <Zap className="w-4 h-4 text-emerald-500" /> },
  { label: 'ROTATION SIGNAL', value: 'Risk-Off', subValue: 'Defensives leading', icon: <Repeat className="w-4 h-4 text-slate-500" /> },
];

const performanceTrendsData = [
  { name: 'IT', value: -20 },
  { name: 'Bank', value: -2 },
  { name: 'Pharma', value: 12 },
  { name: 'Auto', value: 18 },
  { name: 'FMCG', value: -16 },
  { name: 'Metal', value: 28 },
  { name: 'Realty', value: -24 },
  { name: 'Energy', value: 4 },
  { name: 'Infra', value: 8 },
  { name: 'PSU', value: 32 },
  { name: 'Media', value: -15 },
  { name: 'PvtBank', value: -4 },
  { name: 'Health', value: 4 },
  { name: 'Defence', value: 12 },
];

const sectorRankings = [
  { rank: 1, name: 'PSU Bank', change: '+26.8%', momentum: 90, status: 'Prime', color: '#22c55e' },
  { rank: 2, name: 'Metals', change: '+21.5%', momentum: 80, status: 'Prime', color: '#22c55e' },
  { rank: 3, name: 'Auto', change: '+18.2%', momentum: 60, status: 'Weak', color: '#f59e0b' },
  { rank: 4, name: 'Defence', change: '+13.6%', momentum: 55, status: 'Weak', color: '#f59e0b' },
  { rank: 5, name: 'Pharma', change: '+9.4%', momentum: 45, status: 'Weak', color: '#f59e0b' },
  { rank: 6, name: 'Energy', change: '+4.4%', momentum: 30, status: 'Weak', color: '#ef4444' },
  { rank: 7, name: 'Healthcare', change: '+4.0%', momentum: 25, status: 'Weak', color: '#ef4444' },
];

// 12 months data for 10 sectors
const heatmapData = [
  { sector: 'IT', data: [-15, -20, -10, -5, -2, -8, -12, -4, -1, 2, 4, 8] },
  { sector: 'Bank', data: [-8, -2, -18, -12, -4, 2, 6, 12, 18, 14, 8, 4] },
  { sector: 'Pharma', data: [-5, 4, -8, -2, 5, 8, 12, 15, 12, 8, 4, -2] },
  { sector: 'Auto', data: [-12, 8, -15, -5, 4, 12, 18, 22, 18, 12, 8, 4] },
  { sector: 'FMCG', data: [-8, -4, -12, -8, -2, 4, 8, 12, 8, 4, -2, -5] },
  { sector: 'Metal', data: [-2, 12, -18, -8, 4, 15, 22, 28, 24, 18, 12, 8] },
  { sector: 'Realty', data: [-15, -24, -12, -5, 2, 8, 14, 18, 12, 8, 4, -2] },
  { sector: 'Energy', data: [-4, 8, -15, -8, -2, 4, 10, 15, 12, 8, 4, 2] },
  { sector: 'Infra', data: [-8, -2, -12, -5, 2, 8, 14, 18, 15, 10, 5, 2] },
  { sector: 'PSU', data: [4, 15, -10, -2, 8, 18, 25, 32, 28, 22, 15, 8] },
  { sector: 'Media', data: [-12, -15, -8, -4, -2, 2, 5, 8, 4, 2, -2, -5] },
];

const radarData = [
  { subject: 'Bank', A: 120, B: 110, fullMark: 150 },
  { subject: 'Pharma', A: 98, B: 130, fullMark: 150 },
  { subject: 'Auto', A: 86, B: 130, fullMark: 150 },
  { subject: 'FMCG', A: 99, B: 100, fullMark: 150 },
  { subject: 'Metal', A: 85, B: 90, fullMark: 150 },
  { subject: 'IT', A: 65, B: 85, fullMark: 150 },
];

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const SectorRotation: React.FC = () => {
  const navigate = useNavigate();

  // Helper for heatmap colors
  const getHeatmapColor = (val: number) => {
    if (val >= 15) return 'bg-[#1e4635] text-emerald-400';
    if (val >= 5) return 'bg-[#18392b] text-emerald-500';
    if (val >= 0) return 'bg-[#162923] text-emerald-600';
    if (val >= -5) return 'bg-[#291b22] text-red-500';
    if (val >= -15) return 'bg-[#3b1c24] text-red-400';
    return 'bg-[#5c2130] text-red-300';
  };

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={() => {}} portfolioCount={0} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-4">
            
            {/* Nav Back */}
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* --- 1. Top KPI Row --- */}
            <div className="grid grid-cols-5 gap-4">
              {kpiData.map((kpi, i) => (
                <div key={i} className="bg-[#172030] border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between h-[100px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{kpi.label}</span>
                    {kpi.icon}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white leading-tight">{kpi.value}</div>
                    <div className={`text-xs mt-1 ${kpi.subValue.includes('+') ? 'text-emerald-400' : kpi.subValue.includes('Risk-off') ? 'text-red-400' : 'text-slate-400'}`}>
                      {kpi.subValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- 2. Middle Row: Bar Chart & Rankings --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Bar Chart (Takes 2/3 width) */}
              <div className="lg:col-span-2 bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                      Sector Performance Trends
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 ml-2.5">12-month capital flow, volatility & momentum analysis</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs cursor-pointer hover:bg-slate-700 transition">
                      Capital Flow % <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs cursor-pointer hover:bg-slate-700 transition">
                      Bar Chart <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceTrendsData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[-30, 30]} ticks={[-30, -20, -10, 0, 10, 20, 30]} />
                      <Tooltip 
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                        {performanceTrendsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sector Rankings (Takes 1/3 width) */}
              <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                <div className="flex justify-between items-start mb-6">
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

                <div className="w-full">
                  {/* Table Header */}
                  <div className="flex text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                    <div className="w-8">#</div>
                    <div className="flex-1">SECTOR</div>
                    <div className="w-16 text-right">CHANGE</div>
                    <div className="w-20 text-center">MOMENTUM</div>
                    <div className="w-12 text-right">STATUS</div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="space-y-1">
                    {sectorRankings.map((row) => (
                      <div key={row.rank} className="flex items-center text-xs py-2 px-2 hover:bg-[#1e293b] rounded-lg transition-colors group">
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
                        <div className="flex-1 font-semibold text-slate-300 group-hover:text-white flex items-center gap-2">
                          <div className={`w-1 h-1 rounded-full`} style={{ background: row.color }} />
                          {row.name}
                        </div>
                        <div className={`w-16 text-right font-medium ${row.change.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.change}
                        </div>
                        <div className="w-20 px-2">
                          <div className="h-1 w-full bg-[#1e293b] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${row.momentum}%`, backgroundColor: row.color }} />
                          </div>
                        </div>
                        <div className={`w-12 text-right text-[10px] font-semibold ${row.status === 'Prime' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- 3. Heatmap Grid --- */}
            <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5 overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                    Monthly Performance Heatmap
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 ml-2.5">Sector strength across 12 months — Most recent month highlighted</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-md text-xs cursor-pointer hover:bg-slate-700 transition">
                  2026 <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                <div className="min-w-[800px]">
                  {/* Heatmap Header */}
                  <div className="flex text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 pr-2">
                    <div className="w-24 pl-2"></div>
                    {months.map(m => (
                      <div key={m} className="flex-1 text-center">{m}</div>
                    ))}
                  </div>

                  {/* Heatmap Rows */}
                  <div className="space-y-1 border border-slate-800 rounded-lg p-1 bg-[#121824]">
                    {heatmapData.map((row) => (
                      <div key={row.sector} className="flex items-stretch h-8 group">
                        <div className="w-24 text-[11px] font-medium text-slate-400 flex items-center pl-3 group-hover:text-white transition-colors">
                          {row.sector}
                        </div>
                        {row.data.map((val, idx) => {
                          const isMarch = idx === 2; // Highlighting March as per screenshot
                          return (
                            <div key={idx} className="flex-1 p-[1px]">
                              <div className={`w-full h-full flex items-center justify-center text-[10px] font-medium rounded-sm border ${
                                isMarch ? 'border-white/20' : 'border-transparent'
                              } ${getHeatmapColor(val)}`}>
                                {val}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-4 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-sm" /> Strong (+5% to +25%)</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-700 rounded-sm" /> Neutral (-5% to +5%)</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-sm" /> Weak (-25% to -5%)</div>
              </div>
            </div>

            {/* --- 4. Market Cycle & Radar Bottom Row --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Market Cycle */}
              <div className="space-y-4">
                <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                    Market Cycle & Sector Rotation
                  </h2>
                  <p className="text-[10px] text-slate-500 ml-2.5 mb-5">Current economic phase and favored sectors</p>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl border border-slate-800 bg-[#121824] flex flex-col items-center justify-center text-center h-24 opacity-50">
                      <div className="text-xs font-bold text-slate-300 mb-1">Early Cycle</div>
                      <div className="text-[9px] text-slate-500 leading-tight">Financials, Consumer Discretionary, Real Estate</div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-800 bg-[#121824] flex flex-col items-center justify-center text-center h-24 opacity-50">
                      <div className="text-xs font-bold text-slate-300 mb-1">Mid Cycle</div>
                      <div className="text-[9px] text-slate-500 leading-tight">Technology, Industrials, Materials</div>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-500/50 bg-[#121824] flex flex-col items-center justify-center text-center h-24 relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                      <div className="text-xs font-bold text-white mb-1">Late-Cycle</div>
                      <div className="text-[9px] text-emerald-100/70 leading-tight">Energy, Healthcare, Utilities</div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-800 bg-[#121824] flex flex-col items-center justify-center text-center h-24 opacity-50">
                      <div className="text-xs font-bold text-slate-300 mb-1">Defensive</div>
                      <div className="text-[9px] text-slate-500 leading-tight">Utilities, Consumer Staples, Healthcare</div>
                    </div>
                  </div>
                </div>

                {/* Seasonal Strength */}
                <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2 mb-1">
                    Seasonal Sector Strength
                  </h2>
                  <p className="text-[10px] text-slate-500 ml-2.5 mb-5">Active sectors this month based on historical patterns</p>

                  <div className="space-y-2">
                    {['Metals', 'Infra', 'Banking', 'PSU Bank'].map((s, i) => (
                      <div key={s} className="flex items-center justify-between p-3 rounded-lg border border-emerald-900/50 bg-[#121824]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
                          <span className="text-xs font-bold text-slate-200">{s}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-emerald-500 tracking-wider">PRIME</span>
                          <span className="text-xs font-bold text-emerald-400">+{12.3 - i}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-[#121824] opacity-50">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-sm bg-slate-600" />
                          <span className="text-xs font-bold text-slate-400">Pharma</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-600 tracking-wider">OFF</span>
                          <span className="text-xs font-bold text-red-400">-3.1%</span>
                        </div>
                    </div>
                     <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-[#121824] opacity-30">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-sm bg-slate-700" />
                          <span className="text-xs font-bold text-slate-500">FMCG</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-700 tracking-wider">OFF</span>
                          <span className="text-xs font-bold text-red-500">-7.2%</span>
                        </div>
                    </div>
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
                      <Radar name="Momentum" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Volatility" dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex justify-center gap-6 text-[10px] text-slate-400 pb-2">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-sm" /> Momentum</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-sm" /> Volatility</div>
                </div>
              </div>
            </div>

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
