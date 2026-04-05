import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  Activity,
  Calendar,
  Award,
  AlertTriangle,
  Info,
  DollarSign,
  Percent,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { Stock, Transaction } from '../types';

interface Props {
  stocks: Stock[];
  transactions: Transaction[];
  priceData: Record<string, { price: number; change: number; previousClose?: number }>;
  getStockInfo: (symbol: string) => { sector?: string; name?: string } | null;
}

interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  todaysPnL: number;
  totalStocks: number;
  diversificationScore: number;
  riskScore: number;
  performanceGrade: string;
}

interface StockAnalysis {
  symbol: string;
  name: string;
  sector: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  dayChange: number;
  dayChangePercent: number;
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  stocks: number;
  pnl: number;
  pnlPercent: number;
}

const AnalyticsDashboard: React.FC<Props> = ({ stocks, transactions, priceData, getStockInfo }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'allocation' | 'risk'>('overview');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'>('1M');

  // Debug logging
  console.log('AnalyticsDashboard - Props:', { 
    stocksCount: stocks?.length || 0, 
    transactionsCount: transactions?.length || 0, 
    priceDataKeys: Object.keys(priceData || {}),
    stocks: stocks,
    transactions: transactions
  });

  // Calculate comprehensive portfolio metrics
  const portfolioMetrics = useMemo((): PortfolioMetrics => {
    if (!stocks.length || !transactions.length) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        todaysPnL: 0,
        totalStocks: 0,
        diversificationScore: 0,
        riskScore: 0,
        performanceGrade: 'N/A'
      };
    }

    let totalValue = 0;
    let totalInvested = 0;
    let todaysPnL = 0;

    stocks.forEach(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        sum + (t.type === 'buy' ? t.quantity : -t.quantity), 0
      );
      
      if (totalShares > 0) {
        const avgPrice = stockTransactions
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + (t.price * t.quantity), 0) / 
          stockTransactions
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + t.quantity, 0);

        const currentPrice = priceData[stock.symbol]?.price ?? avgPrice;
        const stockValue = totalShares * currentPrice;
        const stockInvested = totalShares * avgPrice;
        
        totalValue += stockValue;
        totalInvested += stockInvested;
        
        const dayChange = priceData[stock.symbol] && priceData[stock.symbol].previousClose !== undefined
          ? currentPrice - priceData[stock.symbol].previousClose!
          : (currentPrice * (priceData[stock.symbol]?.change || 0)) / 100;
          
        todaysPnL += totalShares * dayChange;
      }
    });

    const totalPnL = totalValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    
    // Calculate diversification score (0-100)
    const sectorCount = new Set(stocks.map(s => getStockInfo(s.symbol)?.sector || 'Unknown')).size;
    const diversificationScore = Math.min(100, (sectorCount / 10) * 100);
    
    // Calculate risk score based on volatility and concentration
    const riskScore = Math.max(0, Math.min(100, 50 + (Math.abs(totalPnLPercent) / 2)));
    
    // Performance grade
    let performanceGrade = 'C';
    if (totalPnLPercent > 20) performanceGrade = 'A+';
    else if (totalPnLPercent > 15) performanceGrade = 'A';
    else if (totalPnLPercent > 10) performanceGrade = 'B+';
    else if (totalPnLPercent > 5) performanceGrade = 'B';
    else if (totalPnLPercent > 0) performanceGrade = 'C+';
    else if (totalPnLPercent > -5) performanceGrade = 'C';
    else if (totalPnLPercent > -10) performanceGrade = 'D';
    else performanceGrade = 'F';

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      todaysPnL,
      totalStocks: stocks.length,
      diversificationScore,
      riskScore,
      performanceGrade
    };
  }, [stocks, transactions, priceData, getStockInfo]);

  // Calculate stock analysis
  const stockAnalysis = useMemo((): StockAnalysis[] => {
    return stocks.map(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        sum + (t.type === 'buy' ? t.quantity : -t.quantity), 0
      );
      
      const avgPrice = stockTransactions
        .filter(t => t.type === 'buy')
        .reduce((sum, t) => sum + (t.price * t.quantity), 0) / 
        stockTransactions
        .filter(t => t.type === 'buy')
        .reduce((sum, t) => sum + t.quantity, 0) || 0;

      const currentPrice = priceData[stock.symbol]?.price || avgPrice;
      const value = totalShares * currentPrice;
      const invested = totalShares * avgPrice;
      const pnl = value - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
      const weight = portfolioMetrics.totalValue > 0 ? (value / portfolioMetrics.totalValue) * 100 : 0;
      
      const dayChange = priceData[stock.symbol] && priceData[stock.symbol].previousClose !== undefined
        ? currentPrice - priceData[stock.symbol].previousClose!
        : (currentPrice * (priceData[stock.symbol]?.change || 0)) / 100;
      const dayChangePercent = priceData[stock.symbol]?.change || 0;

      const stockInfo = getStockInfo(stock.symbol);

      return {
        symbol: stock.symbol,
        name: stockInfo?.name || stock.symbol,
        sector: stockInfo?.sector || 'Unknown',
        shares: totalShares,
        avgPrice,
        currentPrice,
        value,
        invested,
        pnl,
        pnlPercent,
        weight,
        dayChange,
        dayChangePercent
      };
    }).filter(s => s.shares > 0);
  }, [stocks, transactions, priceData, getStockInfo, portfolioMetrics.totalValue]);

  // Calculate sector allocation
  const sectorAllocation = useMemo((): SectorAllocation[] => {
    const sectorMap = new Map<string, SectorAllocation>();

    stockAnalysis.forEach(stock => {
      const existing = sectorMap.get(stock.sector) || {
        sector: stock.sector,
        value: 0,
        percentage: 0,
        stocks: 0,
        pnl: 0,
        pnlPercent: 0
      };

      existing.value += stock.value;
      existing.stocks += 1;
      existing.pnl += stock.pnl;
      
      sectorMap.set(stock.sector, existing);
    });

    return Array.from(sectorMap.values()).map(sector => ({
      ...sector,
      percentage: portfolioMetrics.totalValue > 0 ? (sector.value / portfolioMetrics.totalValue) * 100 : 0,
      pnlPercent: sector.value > 0 ? (sector.pnl / (sector.value - sector.pnl)) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [stockAnalysis, portfolioMetrics.totalValue]);

  const formatCurrency = (amount: number) => `${amount >= 0 ? '' : '-'}₹${Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getPerformanceBackground = (value: number) => {
    if (value > 0) return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
    if (value < 0) return 'from-red-500/20 to-red-600/20 border-red-500/30';
    return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
  };

  // No data state
  if (!stocks.length || !transactions.length) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
        </div>
        
        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-8">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-200 mb-2">No Portfolio Data Available</h3>
            <p className="text-slate-400 mb-4">
              Add stocks and transactions to see comprehensive portfolio analytics.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">Getting Started:</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Add stocks to your portfolio</li>
                    <li>Record buy/sell transactions</li>
                    <li>View detailed analytics and insights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-gradient-to-br ${getPerformanceBackground(portfolioMetrics.totalPnL)} rounded-2xl p-6 border relative overflow-hidden group hover:border-opacity-50 transition-colors`}>
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium">Total P&L</div>
            <div className="text-2xl font-bold mt-1 text-white">{formatCurrency(portfolioMetrics.totalPnL)}</div>
            <div className={`text-sm mt-2 font-medium ${getPerformanceColor(portfolioMetrics.totalPnLPercent)}`}>{formatPercent(portfolioMetrics.totalPnLPercent)}</div>
          </div>
          {portfolioMetrics.totalPnL >= 0 ? 
            <TrendingUp className="absolute top-4 right-4 w-8 h-8 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors" /> :
            <TrendingDown className="absolute top-4 right-4 w-8 h-8 text-red-500/20 group-hover:text-red-500/40 transition-colors" />
          }
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium">Portfolio Value</div>
            <div className="text-2xl font-bold mt-1 text-white">{formatCurrency(portfolioMetrics.totalValue)}</div>
            <div className="text-sm text-blue-400 mt-2 font-medium">Current worth</div>
          </div>
          <DollarSign className="absolute top-4 right-4 w-8 h-8 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium">Diversification</div>
            <div className="text-2xl font-bold mt-1 text-white">{portfolioMetrics.diversificationScore.toFixed(0)}/100</div>
            <div className="text-sm text-purple-400 mt-2 font-medium">Risk spread</div>
          </div>
          <PieChart className="absolute top-4 right-4 w-8 h-8 text-purple-500/20 group-hover:text-purple-500/40 transition-colors" />
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/40 transition-colors">
          <div className="relative z-10">
            <div className="text-slate-400 text-sm font-medium">Performance Grade</div>
            <div className="text-2xl font-bold mt-1 text-white">{portfolioMetrics.performanceGrade}</div>
            <div className="text-sm text-orange-400 mt-2 font-medium">Overall rating</div>
          </div>
          <Award className="absolute top-4 right-4 w-8 h-8 text-orange-500/20 group-hover:text-orange-500/40 transition-colors" />
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Portfolio Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Invested</span>
              <span className="font-semibold text-white">{formatCurrency(portfolioMetrics.totalInvested)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Value</span>
              <span className="font-semibold text-white">{formatCurrency(portfolioMetrics.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Today's P&L</span>
              <span className={`font-semibold ${getPerformanceColor(portfolioMetrics.todaysPnL)}`}>
                {formatCurrency(portfolioMetrics.todaysPnL)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Stocks</span>
              <span className="font-semibold text-white">{portfolioMetrics.totalStocks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Risk Score</span>
              <span className={`font-semibold ${portfolioMetrics.riskScore > 70 ? 'text-red-400' : portfolioMetrics.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {portfolioMetrics.riskScore.toFixed(0)}/100
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Holdings</h3>
          <div className="space-y-3">
            {stockAnalysis
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((stock, index) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-[#172030] rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                      index === 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      index === 1 ? 'bg-slate-400/10 text-slate-300 border-slate-400/20' :
                      index === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{stock.symbol}</div>
                      <div className="text-sm text-slate-500">{stock.weight.toFixed(1)}% of portfolio</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{formatCurrency(stock.value)}</div>
                    <div className={`text-sm ${getPerformanceColor(stock.pnl)}`}>
                      {formatPercent(stock.pnlPercent)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Stock Performance</h3>
          <div className="flex space-x-2">
            {['1D', '1W', '1M', '3M', '6M', '1Y'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 font-semibold text-slate-400">Stock</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">Day Change</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">Holdings</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">P&L</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">Weight</th>
              </tr>
            </thead>
            <tbody>
              {stockAnalysis.map((stock) => (
                <tr key={stock.symbol} className="border-b border-slate-800/50 hover:bg-[#172030] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{stock.symbol}</div>
                    <div className="text-sm text-slate-500">{stock.name}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-semibold text-white">₹{stock.currentPrice.toFixed(2)}</div>
                    <div className="text-sm text-slate-500">Avg: ₹{stock.avgPrice.toFixed(2)}</div>
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${getPerformanceColor(stock.dayChange)}`}>
                    <div className="flex items-center justify-end space-x-1">
                      {stock.dayChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{formatPercent(stock.dayChangePercent)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-semibold text-white">{formatCurrency(stock.value)}</div>
                    <div className="text-sm text-slate-500">{stock.shares} shares</div>
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${getPerformanceColor(stock.pnl)}`}>
                    <div>{formatCurrency(stock.pnl)}</div>
                    <div className="text-sm">{formatPercent(stock.pnlPercent)}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-400">
                    {stock.weight.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAllocationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Sector Allocation</h3>
          <div className="space-y-4">
            {sectorAllocation.map((sector, index) => (
              <div key={sector.sector} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                    ></div>
                    <span className="font-medium text-slate-300">{sector.sector}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{sector.percentage.toFixed(1)}%</div>
                    <div className="text-sm text-slate-500">{sector.stocks} stocks</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${sector.percentage}%`,
                      backgroundColor: `hsl(${index * 45}, 70%, 60%)`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{formatCurrency(sector.value)}</span>
                  <span className={getPerformanceColor(sector.pnl)}>
                    {formatPercent(sector.pnlPercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Portfolio Composition</h3>
          <div className="relative">
            {/* Simple pie chart representation */}
            <div className="w-48 h-48 mx-auto mb-6">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                {sectorAllocation.map((sector, index) => {
                  const startAngle = sectorAllocation.slice(0, index).reduce((sum, s) => sum + (s.percentage * 3.6), 0);
                  const endAngle = startAngle + (sector.percentage * 3.6);
                  const largeArcFlag = sector.percentage > 50 ? 1 : 0;
                  
                  const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  return (
                    <path
                      key={sector.sector}
                      d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={`hsl(${index * 45}, 70%, 60%)`}
                      stroke="#131b26"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>
            
            <div className="space-y-2">
              {sectorAllocation.slice(0, 6).map((sector, index) => (
                <div key={sector.sector} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                    ></div>
                    <span className="text-slate-400">{sector.sector}</span>
                  </div>
                  <span className="font-medium text-slate-200">{sector.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              portfolioMetrics.riskScore > 70 ? 'bg-red-500/10' : 
              portfolioMetrics.riskScore > 40 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                portfolioMetrics.riskScore > 70 ? 'text-red-400' : 
                portfolioMetrics.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Risk Level</h3>
              <p className="text-sm text-slate-500">Overall portfolio risk</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {portfolioMetrics.riskScore.toFixed(0)}/100
          </div>
          <div className={`text-sm font-medium ${
            portfolioMetrics.riskScore > 70 ? 'text-red-400' : 
            portfolioMetrics.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {portfolioMetrics.riskScore > 70 ? 'High Risk' : 
             portfolioMetrics.riskScore > 40 ? 'Moderate Risk' : 'Low Risk'}
          </div>
        </div>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <PieChart className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Diversification</h3>
              <p className="text-sm text-slate-500">Portfolio spread</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {portfolioMetrics.diversificationScore.toFixed(0)}/100
          </div>
          <div className={`text-sm font-medium ${
            portfolioMetrics.diversificationScore > 70 ? 'text-emerald-400' : 
            portfolioMetrics.diversificationScore > 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {portfolioMetrics.diversificationScore > 70 ? 'Well Diversified' : 
             portfolioMetrics.diversificationScore > 40 ? 'Moderately Diversified' : 'Concentrated'}
          </div>
        </div>

        <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Performance</h3>
              <p className="text-sm text-slate-500">Overall grade</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {portfolioMetrics.performanceGrade}
          </div>
          <div className={`text-sm font-medium ${getPerformanceColor(portfolioMetrics.totalPnL)}`}>
            {formatPercent(portfolioMetrics.totalPnLPercent)} return
          </div>
        </div>
      </div>

      <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Risk Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-300 mb-3">Concentration Risk</h4>
            <div className="space-y-3">
              {stockAnalysis
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5)
                .map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <span className="text-slate-400">{stock.symbol}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${stock.weight > 20 ? 'bg-red-500' : stock.weight > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, stock.weight * 5)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-300 w-12 text-right">
                        {stock.weight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-300 mb-3">Sector Risk</h4>
            <div className="space-y-3">
              {sectorAllocation.slice(0, 5).map((sector) => (
                <div key={sector.sector} className="flex items-center justify-between">
                  <span className="text-slate-400">{sector.sector}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-slate-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${sector.percentage > 30 ? 'bg-red-500' : sector.percentage > 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, sector.percentage * 3.33)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 w-12 text-right">
                      {sector.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
        <div className="flex flex-wrap space-x-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'performance', label: 'Performance', icon: TrendingUp },
            { key: 'allocation', label: 'Allocation', icon: PieChart },
            { key: 'risk', label: 'Risk', icon: AlertTriangle }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'allocation' && renderAllocationTab()}
      {activeTab === 'risk' && renderRiskTab()}
    </div>
  );
};

export default AnalyticsDashboard;