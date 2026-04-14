import React from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Activity } from 'lucide-react';
import type { Stock, Transaction, PriceData } from '../types';
import { getStockBySymbol } from '../stockDatabase';

interface AdvancedChartsProps {
  stocks: Stock[];
  transactions: Transaction[];
  stockPrices: Record<string, PriceData>;
  chartType: 'performance' | 'allocation' | 'risk' | 'comparison';
}

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  stocks,
  transactions,
  stockPrices,
  chartType
}) => {
  // Calculate portfolio data
  const portfolioData = React.useMemo(() => {
    const stocksWithHoldings = stocks.filter(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
      );
      return totalShares > 0;
    });

    let totalValue = 0;
    let totalInvested = 0;
    const sectorData: Record<string, { value: number, invested: number, count: number }> = {};
    const stockPerformances: Array<{
      symbol: string;
      name: string;
      value: number;
      invested: number;
      pnl: number;
      pnlPercent: number;
      shares: number;
    }> = [];

    stocksWithHoldings.forEach(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
      );
      
      if (totalShares > 0) {
        const avgPrice = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
        ) / stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + t.quantity : sum, 0
        );
        
        const currentPrice = stockPrices[stock.symbol]?.price || avgPrice;
        const marketValue = currentPrice * totalShares;
        const investedValue = avgPrice * totalShares;
        const pnl = marketValue - investedValue;
        const pnlPercent = (pnl / investedValue) * 100;

        totalValue += marketValue;
        totalInvested += investedValue;

        // Sector allocation
        const stockInfo = getStockBySymbol(stock.symbol);
        const sector = stockInfo?.sector || 'Others';
        
        if (!sectorData[sector]) {
          sectorData[sector] = { value: 0, invested: 0, count: 0 };
        }
        
        sectorData[sector].value += marketValue;
        sectorData[sector].invested += investedValue;
        sectorData[sector].count += 1;

        stockPerformances.push({
          symbol: stock.symbol,
          name: stock.name,
          value: marketValue,
          invested: investedValue,
          pnl,
          pnlPercent,
          shares: totalShares
        });
      }
    });

    return {
      totalValue,
      totalInvested,
      totalPnL: totalValue - totalInvested,
      totalPnLPercent: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
      sectorData,
      stockPerformances: stockPerformances.sort((a, b) => b.pnlPercent - a.pnlPercent)
    };
  }, [stocks, transactions, stockPrices]);

  const renderPerformanceChart = () => {
    const { stockPerformances } = portfolioData;
    const maxValue = Math.max(...stockPerformances.map(s => Math.abs(s.pnlPercent)));
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Stock Performance</h3>
          <Activity className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="space-y-3">
          {stockPerformances.slice(0, 8).map((stock, index) => (
            <div key={stock.symbol} className="flex items-center space-x-3">
              <div className="w-16 text-sm font-medium text-gray-600 truncate">
                {stock.symbol}
              </div>
              
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stock.pnlPercent >= 0 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{
                      width: `${Math.abs(stock.pnlPercent) / maxValue * 100}%`,
                      marginLeft: stock.pnlPercent < 0 ? `${100 - (Math.abs(stock.pnlPercent) / maxValue * 100)}%` : '0'
                    }}
                  />
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-700">
                    {stock.pnlPercent >= 0 ? '+' : ''}{stock.pnlPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="w-20 text-right">
                <div className={`text-sm font-semibold ${
                  stock.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stock.pnl >= 0 ? '+' : ''}₹{Math.abs(stock.pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500">
                  {stock.shares} shares
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAllocationChart = () => {
    const { sectorData, totalValue } = portfolioData;
    const sectors = Object.entries(sectorData)
      .map(([sector, data]) => ({
        label: sector,
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        color: getSectorColor(sector),
        count: data.count
      }))
      .sort((a, b) => b.value - a.value);

    const maxRadius = 80;
    let currentAngle = 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Sector Allocation</h3>
          <PieChart className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {sectors.map((sector, index) => {
                const angle = (sector.percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                
                const x1 = 100 + maxRadius * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + maxRadius * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + maxRadius * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + maxRadius * Math.sin((endAngle * Math.PI) / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                const pathData = [
                  `M 100 100`,
                  `L ${x1} ${y1}`,
                  `A ${maxRadius} ${maxRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                currentAngle += angle;
                
                return (
                  <path
                    key={sector.label}
                    d={pathData}
                    fill={sector.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                  ₹{(totalValue / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-500">Total Value</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {sectors.map((sector) => (
            <div key={sector.label} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: sector.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {sector.label}
                </div>
                <div className="text-xs text-gray-500">
                  {sector.percentage.toFixed(1)}% • {sector.count} stock{sector.count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRiskChart = () => {
    const { stockPerformances, totalValue } = portfolioData;
    
    // Calculate risk metrics
    const returns = stockPerformances.map(s => s.pnlPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Value at Risk (5% of portfolio)
    const valueAtRisk = totalValue * 0.05;
    
    // Portfolio concentration
    const stockValues = stockPerformances.map(s => s.value);
    const concentrationIndex = stockValues.reduce((sum, value) => {
      const weight = value / totalValue;
      return sum + (weight * weight);
    }, 0);
    
    const riskMetrics = [
      {
        label: 'Volatility',
        value: volatility.toFixed(1) + '%',
        level: volatility > 25 ? 'High' : volatility > 15 ? 'Medium' : 'Low',
        color: volatility > 25 ? 'red' : volatility > 15 ? 'yellow' : 'green'
      },
      {
        label: 'Value at Risk',
        value: '₹' + valueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
        level: 'Monitor',
        color: 'blue'
      },
      {
        label: 'Concentration',
        value: (concentrationIndex * 100).toFixed(1) + '%',
        level: concentrationIndex > 0.5 ? 'High' : concentrationIndex > 0.25 ? 'Medium' : 'Low',
        color: concentrationIndex > 0.5 ? 'red' : concentrationIndex > 0.25 ? 'yellow' : 'green'
      },
      {
        label: 'Diversification',
        value: stockPerformances.length + ' stocks',
        level: stockPerformances.length > 10 ? 'Good' : stockPerformances.length > 5 ? 'Fair' : 'Poor',
        color: stockPerformances.length > 10 ? 'green' : stockPerformances.length > 5 ? 'yellow' : 'red'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Risk Analysis</h3>
          <BarChart3 className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {riskMetrics.map((metric, index) => (
            <div key={metric.label} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  metric.color === 'green' ? 'bg-green-100 text-green-800' :
                  metric.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  metric.color === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {metric.level}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-800">{metric.value}</div>
            </div>
          ))}
        </div>
        
        {/* Risk Distribution Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Return Distribution</h4>
          <div className="space-y-2">
            {[-20, -10, 0, 10, 20, 30].map((threshold) => {
              const count = returns.filter(r => 
                threshold === 30 ? r >= threshold : r >= threshold && r < threshold + 10
              ).length;
              const percentage = (count / returns.length) * 100;
              
              return (
                <div key={threshold} className="flex items-center space-x-3">
                  <div className="w-16 text-xs text-gray-600">
                    {threshold === 30 ? '30%+' : `${threshold}% to ${threshold + 10}%`}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        threshold < 0 ? 'bg-red-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 text-xs text-gray-600 text-right">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonChart = () => {
    const { totalPnLPercent, stockPerformances } = portfolioData;
    
    // Mock benchmark data (in real app, this would come from API)
    const benchmarks = [
      { name: 'NIFTY 50', return: 12.5, color: '#3B82F6' },
      { name: 'SENSEX', return: 11.8, color: '#10B981' },
      { name: 'NIFTY 500', return: 13.2, color: '#8B5CF6' },
      { name: 'Your Portfolio', return: totalPnLPercent, color: '#F59E0B' }
    ];

    const maxReturn = Math.max(...benchmarks.map(b => Math.abs(b.return)));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Benchmark Comparison</h3>
          <TrendingUp className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="space-y-4">
          {benchmarks.map((benchmark, index) => (
            <div key={benchmark.name} className="flex items-center space-x-4">
              <div className="w-24 text-sm font-medium text-gray-700">
                {benchmark.name}
              </div>
              
              <div className="flex-1 relative">
                <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 flex items-center justify-end pr-3"
                    style={{
                      width: `${(Math.abs(benchmark.return) / maxReturn) * 100}%`,
                      backgroundColor: benchmark.color,
                      opacity: 0.8
                    }}
                  >
                    <span className="text-white text-sm font-semibold">
                      {benchmark.return >= 0 ? '+' : ''}{benchmark.return.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="w-16 text-right">
                {benchmark.name === 'Your Portfolio' && (
                  <div className={`text-sm font-semibold ${
                    benchmark.return >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {benchmark.return > benchmarks[0].return ? '📈' : 
                     benchmark.return > benchmarks[1].return ? '📊' : '📉'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-blue-800">Performance Summary</h4>
              <p className="text-xs text-blue-600 mt-1">
                Your portfolio is {totalPnLPercent > 12.5 ? 'outperforming' : 'underperforming'} the NIFTY 50 by{' '}
                <span className="font-semibold">
                  {Math.abs(totalPnLPercent - 12.5).toFixed(1)}%
                </span>
              </p>
            </div>
            <div className={`text-2xl ${
              totalPnLPercent > 12.5 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalPnLPercent > 12.5 ? '🎯' : '⚠️'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getSectorColor = (sector: string): string => {
    const colors: Record<string, string> = {
      'Technology': '#3B82F6',
      'Healthcare': '#10B981',
      'Finance': '#8B5CF6',
      'Consumer': '#F59E0B',
      'Energy': '#EF4444',
      'Industrial': '#6B7280',
      'Materials': '#84CC16',
      'Utilities': '#06B6D4',
      'Real Estate': '#EC4899',
      'Others': '#9CA3AF'
    };
    return colors[sector] || colors['Others'];
  };

  return (
    <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
      {chartType === 'performance' && renderPerformanceChart()}
      {chartType === 'allocation' && renderAllocationChart()}
      {chartType === 'risk' && renderRiskChart()}
      {chartType === 'comparison' && renderComparisonChart()}
    </div>
  );
};

export default AdvancedCharts;