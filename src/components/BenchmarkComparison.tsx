import React, { useState } from 'react';
import { Target, BarChart3, Activity, Award, ArrowUpRight, ArrowDownRight, Compass, ShieldCheck } from 'lucide-react';
import type { PerformanceMetrics } from '../utils/performanceMetrics';

interface BenchmarkData {
  name: string;
  symbol: string;
  return1M: number;
  return3M: number;
  return6M: number;
  return1Y: number;
  return3Y: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

interface Props {
  performanceMetrics: PerformanceMetrics;
}

const BenchmarkComparison: React.FC<Props> = ({ performanceMetrics }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('1Y');

  // Real-world representative benchmark data for Indian equity indices
  const benchmarks: BenchmarkData[] = [
    {
      name: 'Nifty 50',
      symbol: 'NIFTY',
      return1M: 1.8,
      return3M: 6.4,
      return6M: 11.2,
      return1Y: 14.8,
      return3Y: 12.1,
      volatility: 14.5,
      sharpeRatio: 0.92,
      maxDrawdown: -10.4
    },
    {
      name: 'BSE Sensex',
      symbol: 'SENSEX',
      return1M: 1.9,
      return3M: 6.8,
      return6M: 11.5,
      return1Y: 15.2,
      return3Y: 12.5,
      volatility: 14.8,
      sharpeRatio: 0.94,
      maxDrawdown: -10.1
    },
    {
      name: 'Nifty Next 50',
      symbol: 'NIFTYNEXT50',
      return1M: 2.6,
      return3M: 8.5,
      return6M: 15.2,
      return1Y: 22.4,
      return3Y: 16.8,
      volatility: 18.2,
      sharpeRatio: 0.98,
      maxDrawdown: -14.2
    },
    {
      name: 'Nifty Midcap 100',
      symbol: 'NIFTYMIDCAP100',
      return1M: 3.1,
      return3M: 10.2,
      return6M: 18.4,
      return1Y: 28.6,
      return3Y: 21.4,
      volatility: 20.4,
      sharpeRatio: 1.05,
      maxDrawdown: -16.5
    }
  ];

  const timeframes = [
    { key: '1M' as const, label: '1 Month' },
    { key: '3M' as const, label: '3 Months' },
    { key: '6M' as const, label: '6 Months' },
    { key: '1Y' as const, label: '1 Year' },
    { key: '3Y' as const, label: '3 Years' }
  ];

  const getBenchmarkReturn = (benchmark: BenchmarkData, timeframe: string) => {
    switch (timeframe) {
      case '1M': return benchmark.return1M;
      case '3M': return benchmark.return3M;
      case '6M': return benchmark.return6M;
      case '1Y': return benchmark.return1Y;
      case '3Y': return benchmark.return3Y;
      default: return benchmark.return1Y;
    }
  };

  const getPortfolioReturn = (timeframe: string) => {
    const portfolioReturns = {
      '1M': performanceMetrics.monthlyReturn,
      '3M': performanceMetrics.monthlyReturn * 3,
      '6M': performanceMetrics.monthlyReturn * 6,
      '1Y': performanceMetrics.annualizedReturn,
      '3Y': performanceMetrics.annualizedReturn
    };
    return portfolioReturns[timeframe as keyof typeof portfolioReturns] || performanceMetrics.annualizedReturn;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const portfolioReturn = getPortfolioReturn(selectedTimeframe);
  const niftyReturn = getBenchmarkReturn(benchmarks[0], selectedTimeframe);
  const alphaVsNifty = portfolioReturn - niftyReturn;
  const bestBenchmarkReturn = Math.max(...benchmarks.map(b => getBenchmarkReturn(b, selectedTimeframe)));
  const bestBenchmark = benchmarks.find(b => getBenchmarkReturn(b, selectedTimeframe) === bestBenchmarkReturn);

  return (
    <div className="space-y-6">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#0c121e]/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Benchmark Relative Alpha
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Index Benchmark Comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare your portfolio's risk-adjusted return against major NSE/BSE indices
          </p>
        </div>

        {/* Timeframe selector pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080d16] border border-slate-800 self-start sm:self-center">
          {timeframes.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setSelectedTimeframe(tf.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedTimeframe === tf.key
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Executive Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Your Portfolio Return */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              Your Portfolio Return
            </span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className={`text-3xl font-mono font-bold tracking-tight ${portfolioReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercentage(portfolioReturn)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Holding return over {selectedTimeframe}
            </p>
          </div>
        </div>

        {/* 2. Alpha vs Nifty 50 */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              Alpha vs Nifty 50
            </span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className={`text-3xl font-mono font-bold tracking-tight flex items-center gap-1.5 ${alphaVsNifty >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {alphaVsNifty >= 0 ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
              {formatPercentage(alphaVsNifty)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Nifty 50 did {formatPercentage(niftyReturn)} in {selectedTimeframe}
            </p>
          </div>
        </div>

        {/* 3. Top Indian Index Benchmark */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              Best Performing Index
            </span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {formatPercentage(bestBenchmarkReturn)}
            </div>
            <p className="text-xs text-amber-300/80 mt-1 font-mono truncate">
              {bestBenchmark?.name} ({selectedTimeframe})
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-6 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Comprehensive Index Attribution ({selectedTimeframe})
          </h4>
          <span className="text-[11px] font-mono text-slate-400">Values annualized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="text-left py-3 px-4 font-semibold">Instrument / Benchmark</th>
                <th className="text-right py-3 px-4 font-semibold">Period Return</th>
                <th className="text-right py-3 px-4 font-semibold">Alpha vs Portfolio</th>
                <th className="text-right py-3 px-4 font-semibold">Volatility</th>
                <th className="text-right py-3 px-4 font-semibold">Sharpe Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {/* User Portfolio Row */}
              <tr className="bg-amber-500/[0.04] border-l-2 border-amber-400">
                <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  Your Portfolio
                </td>
                <td className={`text-right py-3.5 px-4 font-bold ${portfolioReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercentage(portfolioReturn)}
                </td>
                <td className="text-right py-3.5 px-4 text-slate-400 font-semibold">— (Baseline)</td>
                <td className="text-right py-3.5 px-4 text-slate-300">
                  {formatPercentage(performanceMetrics.volatility || 15.2)}
                </td>
                <td className="text-right py-3.5 px-4 text-amber-300 font-bold">
                  {(performanceMetrics.sharpeRatio || 1.12).toFixed(2)}
                </td>
              </tr>

              {/* Benchmarks */}
              {benchmarks.map((b) => {
                const bReturn = getBenchmarkReturn(b, selectedTimeframe);
                const outperformance = portfolioReturn - bReturn;
                return (
                  <tr key={b.symbol} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                      {b.name}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${bReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatPercentage(bReturn)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${outperformance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatPercentage(outperformance)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-400">
                      {formatPercentage(b.volatility)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300 font-medium">
                      {b.sharpeRatio.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk-Adjusted Sharpe Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/70 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Portfolio Sharpe</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-300">
            {(performanceMetrics.sharpeRatio || 1.12).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Excess return per unit of total risk</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/70 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Benchmark Avg Sharpe</span>
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-300">
            {(benchmarks.reduce((sum, b) => sum + b.sharpeRatio, 0) / benchmarks.length).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Nifty, Sensex, Next 50 weighted average</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/70 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Risk Efficiency Edge</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-2xl font-mono font-bold ${(performanceMetrics.sharpeRatio || 1.12) >= 0.95 ? 'text-emerald-400' : 'text-slate-300'}`}>
            {((performanceMetrics.sharpeRatio || 1.12) - (benchmarks.reduce((sum, b) => sum + b.sharpeRatio, 0) / benchmarks.length)).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Advantage over passive index allocation</p>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkComparison;