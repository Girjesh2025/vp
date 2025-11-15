import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, Activity, Award } from 'lucide-react';
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

  // Mock benchmark data - in a real app, this would come from an API
  const benchmarks: BenchmarkData[] = [
    {
      name: 'Nifty 50',
      symbol: 'NIFTY',
      return1M: 2.5,
      return3M: 8.2,
      return6M: 12.8,
      return1Y: 15.4,
      return3Y: 12.1,
      volatility: 18.5,
      sharpeRatio: 0.83,
      maxDrawdown: -12.3
    },
    {
      name: 'Sensex',
      symbol: 'SENSEX',
      return1M: 2.8,
      return3M: 8.7,
      return6M: 13.2,
      return1Y: 16.1,
      return3Y: 12.8,
      volatility: 19.2,
      sharpeRatio: 0.84,
      maxDrawdown: -11.8
    },
    {
      name: 'Nifty Next 50',
      symbol: 'NIFTYNEXT50',
      return1M: 3.2,
      return3M: 9.5,
      return6M: 14.8,
      return1Y: 18.3,
      return3Y: 14.2,
      volatility: 22.1,
      sharpeRatio: 0.83,
      maxDrawdown: -15.2
    },
    {
      name: 'Nifty Midcap 100',
      symbol: 'NIFTYMIDCAP100',
      return1M: 4.1,
      return3M: 11.2,
      return6M: 18.5,
      return1Y: 22.7,
      return3Y: 16.8,
      volatility: 25.8,
      sharpeRatio: 0.88,
      maxDrawdown: -18.9
    }
  ];

  const timeframes = [
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '6M' as const, label: '6M' },
    { key: '1Y' as const, label: '1Y' },
    { key: '3Y' as const, label: '3Y' }
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
    // Mock portfolio returns for different timeframes
    // In a real app, this would be calculated from actual performance data
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

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPerformanceBackground = (value: number) => {
    return value >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const portfolioReturn = getPortfolioReturn(selectedTimeframe);

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Benchmark Comparison</h3>
        <div className="flex space-x-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.key}
              onClick={() => setSelectedTimeframe(timeframe.key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Portfolio Performance */}
        <div className={`rounded-2xl p-6 border-2 ${getPerformanceBackground(portfolioReturn)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-6 h-6 text-blue-600" />
              <h4 className="font-bold text-gray-800">Your Portfolio</h4>
            </div>
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div className={`text-3xl font-bold ${getPerformanceColor(portfolioReturn)}`}>
            {formatPercentage(portfolioReturn)}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {selectedTimeframe} Performance
          </div>
        </div>

        {/* Best Benchmark */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-green-100" />
              <h4 className="font-bold text-white">Best Benchmark</h4>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {formatPercentage(Math.max(...benchmarks.map(b => getBenchmarkReturn(b, selectedTimeframe))))}
          </div>
          <div className="text-sm text-green-100 mt-2">
            {benchmarks.find(b => getBenchmarkReturn(b, selectedTimeframe) === Math.max(...benchmarks.map(b => getBenchmarkReturn(b, selectedTimeframe))))?.name}
          </div>
        </div>

        {/* Outperformance */}
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-purple-100" />
              <h4 className="font-bold text-white">vs Nifty 50</h4>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {formatPercentage(portfolioReturn - getBenchmarkReturn(benchmarks[0], selectedTimeframe))}
          </div>
          <div className="text-sm text-purple-100 mt-2">
            Outperformance
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-6">Detailed Comparison ({selectedTimeframe})</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Index</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Return</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">vs Portfolio</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Volatility</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {/* Portfolio Row */}
              <tr className="border-b border-gray-100 bg-blue-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">Your Portfolio</span>
                  </div>
                </td>
                <td className={`text-right py-3 px-4 font-semibold ${getPerformanceColor(portfolioReturn)}`}>
                  {formatPercentage(portfolioReturn)}
                </td>
                <td className="text-right py-3 px-4 font-semibold text-gray-600">-</td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {formatPercentage(performanceMetrics.volatility)}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {performanceMetrics.sharpeRatio.toFixed(2)}
                </td>
              </tr>
              
              {/* Benchmark Rows */}
              {benchmarks.map((benchmark, index) => {
                const benchmarkReturn = getBenchmarkReturn(benchmark, selectedTimeframe);
                const outperformance = portfolioReturn - benchmarkReturn;
                
                return (
                  <tr key={benchmark.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-800">{benchmark.name}</span>
                      </div>
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${getPerformanceColor(benchmarkReturn)}`}>
                      {formatPercentage(benchmarkReturn)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${getPerformanceColor(outperformance)}`}>
                      {formatPercentage(outperformance)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {formatPercentage(benchmark.volatility)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {benchmark.sharpeRatio.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk-Adjusted Performance */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-6">Risk-Adjusted Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {performanceMetrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-sm text-blue-700 mt-1">Your Sharpe Ratio</div>
            <div className="text-xs text-gray-600 mt-2">
              Risk-adjusted return measure
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {(benchmarks.reduce((sum, b) => sum + b.sharpeRatio, 0) / benchmarks.length).toFixed(2)}
            </div>
            <div className="text-sm text-gray-700 mt-1">Avg Benchmark</div>
            <div className="text-xs text-gray-600 mt-2">
              Average of all benchmarks
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className={`text-2xl font-bold ${getPerformanceColor(
              performanceMetrics.sharpeRatio - (benchmarks.reduce((sum, b) => sum + b.sharpeRatio, 0) / benchmarks.length)
            )}`}>
              {(performanceMetrics.sharpeRatio - (benchmarks.reduce((sum, b) => sum + b.sharpeRatio, 0) / benchmarks.length)).toFixed(2)}
            </div>
            <div className="text-sm text-green-700 mt-1">Difference</div>
            <div className="text-xs text-gray-600 mt-2">
              Your advantage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkComparison;