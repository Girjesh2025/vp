import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessionalSidebar from '../ProfessionalSidebar';
import ProfessionalHeader from '../ProfessionalHeader';
import {
  TrendingUp,
  RotateCcw,
  IndianRupee,
  PieChart,
  Calendar,
  ArrowLeft,
  Percent,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartData {
  year: number;
  investment: number;
  returns: number;
  total: number;
}

const ReturnsCalculator: React.FC = () => {
  const navigate = useNavigate();
  
  const [initialInvestment, setInitialInvestment] = useState('100000');
  const [monthlyContribution, setMonthlyContribution] = useState('10000');
  const [expectedReturn, setExpectedReturn] = useState('12');
  const [years, setYears] = useState('10');
  const [compoundFrequency, setCompoundFrequency] = useState<'yearly' | 'monthly'>('yearly');

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [maturityValue, setMarketValue] = useState(0);

  useEffect(() => {
    calculateReturns();
  }, [initialInvestment, monthlyContribution, expectedReturn, years, compoundFrequency]);

  const calculateReturns = () => {
    const P = parseFloat(initialInvestment) || 0;
    const PMT = parseFloat(monthlyContribution) || 0;
    const r = (parseFloat(expectedReturn) || 0) / 100;
    const t = parseFloat(years) || 0;
    const n = compoundFrequency === 'yearly' ? 1 : 12;

    if (t <= 0) return;

    const data: ChartData[] = [];
    let currentTotal = P;
    let currentInvestment = P;

    data.push({
      year: 0,
      investment: currentInvestment,
      returns: 0,
      total: currentTotal,
    });

    for (let i = 1; i <= t; i++) {
      // For each year
      if (compoundFrequency === 'yearly') {
        // Add 12 months of contributions at once for simple yearly compound (or assume beginning/end of year)
        // Let's do a more accurate monthly step for yearly compounding too (interest applied end of year, contributions added monthly)
        let yearInvestment = currentInvestment + (PMT * 12);
        // Standard formula for compound interest with contributions
        // Total = P(1+r/n)^(nt) + PMT * [ (1+r/n)^(nt) - 1 ] / (r/n) 
        // We'll just step through it.
      }
      
      let yearTotal = currentTotal;
      let yearInvest = currentInvestment;

      if (compoundFrequency === 'monthly') {
        for (let m = 0; m < 12; m++) {
          yearInvest += PMT;
          yearTotal += PMT;
          yearTotal = yearTotal * (1 + r / 12);
        }
      } else {
        // Yearly compound
        yearInvest += (PMT * 12);
        yearTotal += (PMT * 12);
        yearTotal = yearTotal * (1 + r);
      }

      currentTotal = yearTotal;
      currentInvestment = yearInvest;

      data.push({
        year: i,
        investment: Math.round(currentInvestment),
        returns: Math.round(currentTotal - currentInvestment),
        total: Math.round(currentTotal),
      });
    }

    setChartData(data);
    if (data.length > 0) {
      const finalData = data[data.length - 1];
      setTotalInvestment(finalData.investment);
      setTotalReturns(finalData.returns);
      setMarketValue(finalData.total);
    }
  };

  const reset = () => {
    setInitialInvestment('100000');
    setMonthlyContribution('10000');
    setExpectedReturn('12');
    setYears('10');
    setCompoundFrequency('yearly');
  };

  const fmtRs = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden text-white">
      <ProfessionalSidebar activeTab="tools" onTabChange={(tabId) => navigate('/app', { state: { activeTab: tabId } })} portfolioCount={0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 mb-6 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Returns Calculator</h1>
                  <p className="text-sm text-slate-400">Analyze trade returns over time and visualize growth</p>
                </div>
              </div>
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Panel: Inputs */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  
                  {/* Initial Investment */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Initial Investment</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={initialInvestment}
                        onChange={(e) => setInitialInvestment(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Monthly Contribution */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Monthly SIP / Addition</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Expected Return */}
                  <div className="mb-5">
                    <div className="flex justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Expected Return</label>
                      <span className="text-xs text-emerald-400 font-semibold">{expectedReturn}% p.a.</span>
                    </div>
                    <input
                      type="range" min="1" max="30" step="0.5"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #10b981 ${(parseFloat(expectedReturn) / 30) * 100}%, #1e293b ${(parseFloat(expectedReturn) / 30) * 100}%)` }}
                    />
                  </div>

                  {/* Time Period */}
                  <div className="mb-5">
                    <div className="flex justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Time Period</label>
                      <span className="text-xs text-emerald-400 font-semibold">{years} Years</span>
                    </div>
                    <input
                      type="range" min="1" max="40" step="1"
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #10b981 ${(parseFloat(years) / 40) * 100}%, #1e293b ${(parseFloat(years) / 40) * 100}%)` }}
                    />
                  </div>

                  {/* Compounding Frequency */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Compounding Frequency</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-700">
                      <button onClick={() => setCompoundFrequency('yearly')} className={`flex-1 py-2 text-sm font-semibold transition-all ${compoundFrequency === 'yearly' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        Yearly
                      </button>
                      <button onClick={() => setCompoundFrequency('monthly')} className={`flex-1 py-2 text-sm font-semibold transition-all ${compoundFrequency === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        Monthly
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Panel: Results & Chart */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <IndianRupee className="w-5 h-5 text-blue-400 mb-2 relative z-10" />
                    <p className="text-xs text-slate-400 mb-1 relative z-10">Total Investment</p>
                    <p className="text-xl font-bold text-white relative z-10">{fmtRs(totalInvestment)}</p>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                    <TrendingUp className="w-5 h-5 text-emerald-400 mb-2 relative z-10" />
                    <p className="text-xs text-slate-400 mb-1 relative z-10">Est. Returns</p>
                    <p className="text-xl font-bold text-emerald-400 relative z-10">{fmtRs(totalReturns)}</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/5" />
                    <PieChart className="w-5 h-5 text-emerald-400 mb-2 relative z-10" />
                    <p className="text-xs text-emerald-200/70 mb-1 relative z-10">Total Value</p>
                    <p className="text-2xl font-black text-white relative z-10">{fmtRs(maturityValue)}</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-[400px] flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                      Growth Trajectory
                    </h3>
                  </div>
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }} 
                          tickFormatter={(val) => `${val}Y`}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Area 
                          type="monotone" 
                          dataKey="investment" 
                          name="Invested Amount" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorInvest)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          name="Total Value" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorReturn)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Wealth Insights */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">Wealth Insights</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      By investing <span className="text-white font-medium">{fmtRs(parseFloat(monthlyContribution) || 0)}</span> monthly 
                      with an initial <span className="text-white font-medium">{fmtRs(parseFloat(initialInvestment) || 0)}</span> at 
                      <span className="text-emerald-400 font-medium"> {expectedReturn}%</span>, your money will grow by 
                      <span className="text-emerald-400 font-medium"> {(((maturityValue - totalInvestment) / (totalInvestment || 1)) * 100).toFixed(0)}%</span> in {years} years.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-xs text-slate-600 mt-6 text-center">
              Disclaimer: The calculations are based on assumed rates of return and are for educational purposes only.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReturnsCalculator;
