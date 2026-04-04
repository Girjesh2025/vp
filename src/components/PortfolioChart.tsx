import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { isMarketOpen } from '../utils/priceApi';
import type { Stock } from '../types';

interface Props {
  stocks: Stock[];
  priceData: Record<string, { price: number; change: number; previousClose?: number }>;
}

const PortfolioChart: React.FC<Props> = ({ stocks, priceData }) => {
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Handle empty portfolio case
  if (stocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="text-slate-500 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No stocks in portfolio</p>
          <p className="text-slate-500 text-xs mt-1">Add stocks to see allocation</p>
        </div>
      </div>
    );
  }

  // Calculate portfolio allocation using market-aware pricing
  const marketOpen = isMarketOpen();
  const totalValue = stocks.reduce((sum, stock) => {
    // Use current price only when market is open, otherwise use average price
    const currentPrice = marketOpen ? (priceData[stock.symbol]?.price || stock.avgPrice) : stock.avgPrice;
    return sum + (stock.quantity * currentPrice);
  }, 0);
  
  const allocations = stocks.map(stock => {
    // Use current price only when market is open, otherwise use average price
    const currentPrice = marketOpen ? (priceData[stock.symbol]?.price || stock.avgPrice) : stock.avgPrice;
    const value = stock.quantity * currentPrice;
    return {
      symbol: stock.symbol,
      name: stock.name,
      value,
      percentage: (value / totalValue) * 100
    };
  }).sort((a, b) => b.value - a.value);

  // Colors for the pie chart segments
  const colors = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6b7280'
  ];

  // Calculate pie chart segments
  let cumulativePercentage = 0;
  const segments = allocations.map((allocation, index) => {
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + allocation.percentage) / 100) * 360;
    cumulativePercentage += allocation.percentage;

    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const largeArcFlag = allocation.percentage > 50 ? 1 : 0;
    const x1 = 50 + 40 * Math.cos(startAngleRad);
    const y1 = 50 + 40 * Math.sin(startAngleRad);
    const x2 = 50 + 40 * Math.cos(endAngleRad);
    const y2 = 50 + 40 * Math.sin(endAngleRad);

    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    return {
      ...allocation,
      pathData,
      color: colors[index % colors.length]
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
        {/* Pie Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            {segments.map((segment, index) => (
              <path
                key={segment.symbol}
                d={segment.pathData}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
          
          {/* Center circle with total value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-slate-400 font-medium">Total</div>
              <div className="text-lg font-bold text-white">
                ₹{(totalValue / 100000).toFixed(1)}L
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full">
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-300">Holdings</h4>
            <div className="flex items-center space-x-2">
              {allocations.length > 6 && (
                <button
                  onClick={() => setShowAllStocks(!showAllStocks)}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors"
                >
                  <span>{showAllStocks ? 'Show Less' : `Show All (${allocations.length})`}</span>
                  {showAllStocks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          </div>

          {/* Search bar when showing all stocks */}
          {showAllStocks && allocations.length > 10 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
          )}

          {/* Stock list */}
          <div className={`space-y-3 ${showAllStocks && allocations.length > 8 ? 'max-h-80 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {(() => {
              // Filter allocations based on search term
              const filteredAllocations = showAllStocks 
                ? allocations.filter(allocation => 
                    allocation.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    allocation.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : allocations.slice(0, 6);

              return (
                <>
                  {filteredAllocations.map((allocation, index) => (
                    <div key={allocation.symbol} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-200 truncate">
                            {allocation.symbol}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {allocation.name.length > 25 
                              ? allocation.name.substring(0, 25) + '...' 
                              : allocation.name
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-4">
                        <div className="text-sm font-semibold text-slate-200">
                          {allocation.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">
                          ₹{(allocation.value / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {!showAllStocks && allocations.length > 6 && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-slate-600" />
                        <div className="text-sm text-slate-400">
                          Others ({allocations.length - 6})
                        </div>
                      </div>
                      <div className="text-sm text-slate-400 font-medium">
                        {allocations.slice(6).reduce((sum, a) => sum + a.percentage, 0).toFixed(1)}%
                      </div>
                    </div>
                  )}

                  {showAllStocks && searchTerm && filteredAllocations.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No stocks found matching "{searchTerm}"
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;