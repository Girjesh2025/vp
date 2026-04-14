import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  Shield, 
  Activity,
  Calendar,
  Award,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import type { Stock, Transaction } from '../types';
import { 
  calculatePerformanceMetrics, 
  calculateStockPerformances,
  formatMetric,
  getPerformanceColor,
  getPerformanceBackground,
  type PerformanceMetrics,
  type StockPerformance
} from '../utils/performanceMetrics';
import AdvancedCharts from './AdvancedCharts';
import BenchmarkComparison from './BenchmarkComparison';

interface Props {
  stocks: Stock[];
  transactions: Transaction[];
  priceData: Record<string, { price: number; change: number; previousClose?: number }>;
  getStockInfo: (symbol: string) => { sector?: string; name?: string } | null;
}

const PerformanceDashboard: React.FC<Props> = ({ stocks, transactions, priceData, getStockInfo }) => {
  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'>('1M');
  const [activeView, setActiveView] = useState<'overview' | 'risk' | 'attribution' | 'comparison'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (Object.keys(priceData || {}).length > 0) {
      setLastUpdated(new Date());
    }
  }, [priceData]);

  // Memoized calculations with error handling
  const { metrics, stockPerformances, hasData } = useMemo(() => {
    try {
      setError(null);
      
      // Validate input data
      if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
        return {
          metrics: getEmptyMetrics(),
          stockPerformances: [],
          hasData: false
        };
      }

      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return {
          metrics: getEmptyMetrics(),
          stockPerformances: [],
          hasData: false
        };
      }

      // Calculate metrics with error handling
      const calculatedMetrics = calculatePerformanceMetrics(stocks, transactions, priceData || {}, getStockInfo);
      const calculatedStockPerformances = calculateStockPerformances(stocks, transactions, priceData || {}, getStockInfo);

      return {
        metrics: calculatedMetrics,
        stockPerformances: calculatedStockPerformances,
        hasData: calculatedStockPerformances.length > 0
      };
    } catch (err) {
      console.error('Error calculating performance metrics:', err);
      setError('Failed to calculate performance metrics. Please check your data.');
      return {
        metrics: getEmptyMetrics(),
        stockPerformances: [],
        hasData: false
      };
    }
  }, [stocks, transactions, priceData, getStockInfo]);

  // Helper function for empty metrics
  function getEmptyMetrics(): PerformanceMetrics {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      sharpeRatio: 0,
      volatility: 0,
      beta: 1.0,
      maxDrawdown: 0,
      annualizedReturn: 0,
      monthlyReturn: 0,
      weeklyReturn: 0,
      dailyReturn: 0,
      informationRatio: 0,
      calmarRatio: 0,
      sortinoRatio: 0,
      treynorRatio: 0,
      diversificationRatio: 0,
      concentrationRisk: 0,
      sectorAllocation: {},
      bestPerformer: null,
      worstPerformer: null,
      performanceHistory: []
    };
  }

  const timeframes = [
    { key: '1D' as const, label: '1D', return: metrics.dailyReturn || 0 },
    { key: '1W' as const, label: '1W', return: metrics.weeklyReturn || 0 },
    { key: '1M' as const, label: '1M', return: metrics.monthlyReturn || 0 },
    { key: '3M' as const, label: '3M', return: (metrics.monthlyReturn || 0) * 3 },
    { key: '6M' as const, label: '6M', return: (metrics.monthlyReturn || 0) * 6 },
    { key: '1Y' as const, label: '1Y', return: metrics.annualizedReturn || 0 }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading performance data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800/30 rounded-2xl p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Performance Data Error</h3>
            <p className="text-red-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <div className="bg-[#0f1520] border border-[#1e293b] rounded-2xl p-8">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Performance Data Available</h3>
          <p className="text-slate-400 mb-4">
            Add some stocks and transactions to see your portfolio performance metrics.
          </p>
          <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Getting Started:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Add stocks to your portfolio</li>
                  <li>Record buy/sell transactions</li>
                  <li>Performance metrics will appear here</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-gradient-to-br ${getPerformanceBackground(metrics.totalPnL)} rounded-2xl p-6 text-white relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="text-white/80 text-sm font-medium">Total P&L</div>
            <div className="text-3xl font-bold mt-1">{formatMetric(metrics.totalPnL, 'currency')}</div>
            <div className="text-sm text-white/80 mt-2">{formatMetric(metrics.totalPnLPercent, 'percentage')}</div>
          </div>
          <TrendingUp className="absolute top-4 right-4 w-8 h-8 text-white/30" />
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 text-white relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="relative z-10">
            <div className="text-blue-100 text-sm font-medium">Sharpe Ratio</div>
            <div className="text-3xl font-bold mt-1">{formatMetric(metrics.sharpeRatio, 'ratio')}</div>
            <div className="text-sm text-blue-100 mt-2">Risk-adjusted return</div>
          </div>
          <Target className="absolute top-4 right-4 w-8 h-8 text-blue-400/20 group-hover:text-blue-400/40 transition-colors" />
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6 text-white relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="relative z-10">
            <div className="text-purple-100 text-sm font-medium">Annualized Return</div>
            <div className="text-3xl font-bold mt-1">{formatMetric(metrics.annualizedReturn, 'percentage')}</div>
            <div className="text-sm text-purple-100 mt-2">Projected yearly</div>
          </div>
          <Calendar className="absolute top-4 right-4 w-8 h-8 text-purple-400/20 group-hover:text-purple-400/40 transition-colors" />
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-6 text-white relative overflow-hidden group hover:border-orange-500/50 transition-colors">
          <div className="relative z-10">
            <div className="text-orange-100 text-sm font-medium">Max Drawdown</div>
            <div className="text-3xl font-bold mt-1">{formatMetric(metrics.maxDrawdown, 'percentage')}</div>
            <div className="text-sm text-orange-100 mt-2">Peak-to-trough drop</div>
          </div>
          <Activity className="absolute top-4 right-4 w-8 h-8 text-orange-400/20 group-hover:text-orange-400/40 transition-colors" />
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-[#172030] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-200">Portfolio Performance</h3>
          <div className="flex space-x-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.key}
                onClick={() => setActiveTimeframe(timeframe.key)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeTimeframe === timeframe.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-slate-400 hover:bg-gray-200'
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>

        {/* Performance visualization */}
        <div className="relative h-64">
          <svg width="100%" height="100%" viewBox="0 0 800 200" className="overflow-visible">
            {/* Grid lines */}
            <defs>
              <pattern id="performanceGrid" width="80" height="40" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#performanceGrid)" />
            
            {/* Performance line */}
            <defs>
              <linearGradient id="performanceLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={metrics.totalPnL >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.8"/>
                <stop offset="100%" stopColor={metrics.totalPnL >= 0 ? "#059669" : "#dc2626"} stopOpacity="1"/>
              </linearGradient>
            </defs>
            
            {metrics.performanceHistory.map((point, index) => {
              const x = 50 + (index * 700) / (metrics.performanceHistory.length - 1);
              const y = 150 - (point.return + 50); // Normalize for display
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={Math.max(20, Math.min(180, y))}
                  r="4"
                  fill="url(#performanceLineGradient)"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${point.date}: ${formatMetric(point.return, 'percentage')}`}</title>
                </circle>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Advanced Charts */}
      <AdvancedCharts 
        stocks={stocks}
        transactions={transactions}
        stockPrices={priceData}
        chartType="performance"
      />

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Top & Bottom Performers</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Performer */}
            {metrics.bestPerformer && (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-emerald-500/20">
                <div className="flex items-center space-x-2 text-emerald-400 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Top Winner</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">{metrics.bestPerformer.symbol}</div>
                    <div className="text-sm text-slate-400">Total Return</div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    +{formatMetric(metrics.bestPerformer.pnlPercent, 'percentage')}
                  </div>
                </div>
              </div>
            )}

            {/* Worst Performer */}
            {metrics.worstPerformer && (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-red-500/20">
                <div className="flex items-center space-x-2 text-red-400 mb-4">
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-semibold">Biggest Loser</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">{metrics.worstPerformer.symbol}</div>
                    <div className="text-sm text-slate-400">Total Return</div>
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {formatMetric(metrics.worstPerformer.pnlPercent, 'percentage')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Sector Allocation</h3>
          <div className="space-y-4">
            {Object.entries(metrics.sectorAllocation)
              .sort(([, a], [, b]) => b - a)
              .map(([sector, allocation]) => (
                <div key={sector} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-indigo-500/20 rounded-full border border-indigo-500/50"></div>
                    <span className="font-medium text-slate-300">{sector}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${allocation}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-slate-200 min-w-[3rem] text-right">
                      {formatMetric(allocation, 'percentage')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskTab = () => (
    <div className="space-y-6">
      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-6 text-white">
          <div className="text-red-100 text-sm font-medium">Portfolio Beta</div>
          <div className="text-3xl font-bold mt-1">{formatMetric(metrics.beta, 'ratio')}</div>
          <div className="text-sm text-red-100 mt-2">Market sensitivity</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-white">
          <div className="text-yellow-100 text-sm font-medium">Sortino Ratio</div>
          <div className="text-3xl font-bold mt-1">{formatMetric(metrics.sortinoRatio, 'ratio')}</div>
          <div className="text-sm text-yellow-100 mt-2">Downside risk-adjusted</div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
          <div className="text-green-100 text-sm font-medium">Diversification</div>
          <div className="text-3xl font-bold mt-1">{formatMetric(metrics.diversificationRatio * 100, 'percentage')}</div>
          <div className="text-sm text-green-100 mt-2">Portfolio spread</div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
          <div className="text-purple-100 text-sm font-medium">Concentration Risk</div>
          <div className="text-3xl font-bold mt-1">{formatMetric(metrics.concentrationRisk * 100, 'percentage')}</div>
          <div className="text-sm text-purple-100 mt-2">HHI Index</div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-6">Risk Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-300 mb-4">Risk Metrics Explanation</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200">Sharpe Ratio: {formatMetric(metrics.sharpeRatio, 'ratio')}</div>
                  <div className="text-sm text-slate-400">Measures risk-adjusted returns. Higher is better.</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200">Beta: {formatMetric(metrics.beta, 'ratio')}</div>
                  <div className="text-sm text-slate-400">Portfolio sensitivity to market movements.</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200">Max Drawdown: {formatMetric(metrics.maxDrawdown, 'percentage')}</div>
                  <div className="text-sm text-slate-400">Largest peak-to-trough decline.</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-4">Risk Assessment</h4>
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-300">Overall Risk Level</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    metrics.volatility < 15 ? 'bg-green-100 text-green-800' :
                    metrics.volatility < 25 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {metrics.volatility < 15 ? 'Low' : metrics.volatility < 25 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  Based on portfolio volatility of {formatMetric(metrics.volatility, 'percentage')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-colors">
          <h3 className="text-xl font-bold text-white mb-6">Returns Profile</h3>
          <div className="space-y-4">
            {timeframes.map((tf) => (
              <div key={tf.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-slate-300">{tf.label} Return</span>
                <span className={`font-bold ${getPerformanceColor(tf.return)}`}>
                  {formatMetric(tf.return, 'percentage')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-colors">
          <h3 className="text-xl font-bold text-white mb-6">Risk vs Reward</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
              <div className="text-sm text-slate-400 mb-1">Information Ratio</div>
              <div className="text-2xl font-bold text-white">{formatMetric(metrics.informationRatio, 'ratio')}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
              <div className="text-sm text-slate-400 mb-1">Sortino Ratio</div>
              <div className="text-2xl font-bold text-white">{formatMetric(metrics.sortinoRatio, 'ratio')}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
              <div className="text-sm text-slate-400 mb-1">Treynor Ratio</div>
              <div className="text-2xl font-bold text-white">{formatMetric(metrics.treynorRatio, 'ratio')}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
              <div className="text-sm text-slate-400 mb-1">Calmar Ratio</div>
              <div className="text-2xl font-bold text-white">{formatMetric(metrics.calmarRatio, 'ratio')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttributionTab = () => (
    <div className="space-y-6">
      <div className="bg-[#172030] rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-200 mb-6">Performance Attribution</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Sector</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">Weight</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">Return</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">Contribution</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">Risk</th>
              </tr>
            </thead>
            <tbody>
              {stockPerformances.map((stock) => (
                <tr key={stock.symbol} className="border-b border-slate-800/60 hover:bg-[#0f1520]">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{stock.symbol}</div>
                    <div className="text-sm text-slate-500">{stock.name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{stock.sector}</td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatMetric(stock.weight * 100, 'percentage')}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${getPerformanceColor(stock.pnlPercent)}`}>
                    {formatMetric(stock.pnlPercent, 'percentage')}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${getPerformanceColor(stock.pnl)}`}>
                    {formatMetric(stock.pnl, 'currency')}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {formatMetric(stock.volatility * 100, 'percentage')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderComparisonTab = () => (
    <BenchmarkComparison performanceMetrics={metrics} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-slate-400">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Last Updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#131b26] p-1.5 rounded-xl border border-slate-800 shadow-sm">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'risk', label: 'Risk', icon: Shield },
            { key: 'attribution', label: 'Attribution', icon: PieChart },
            { key: 'comparison', label: 'Benchmark', icon: Target }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeView === tab.key
                  ? 'bg-indigo-600/20 text-indigo-400 shadow-sm border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeView === 'overview' && renderOverviewTab()}
      {activeView === 'risk' && renderRiskTab()}
      {activeView === 'attribution' && renderAttributionTab()}
      {activeView === 'comparison' && renderComparisonTab()}
    </div>
  );
};

export default PerformanceDashboard;