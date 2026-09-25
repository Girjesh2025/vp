import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Plus, Briefcase, Search, 
  Trash2, ArrowUpRight, ArrowDownRight, BarChart3, 
  PieChart, Target, Compass, RefreshCw, Filter, 
  Layers, ArrowUpDown, ChevronRight, Check, ShieldAlert
} from 'lucide-react';
import type { Stock, Transaction, PriceData } from '../types';
import StockLogo from './StockLogo';
import BenchmarkComparison from './BenchmarkComparison';
import { calculatePerformanceMetrics } from '../utils/performanceMetrics';
import { getStockBySymbol } from '../stockDatabase';

interface PortfolioStats {
  totalCurrent: number;
  totalInvested: number;
  todaysPnL: number;
  todaysPnLPercent: number;
  totalPnL: number;
  totalPnLPercent: number;
  totalStocks: number;
}

interface PortfolioPageProps {
  stocks: Stock[];
  transactions: Transaction[];
  stockPrices: Record<string, PriceData>;
  stats: PortfolioStats;
  isMarketOpen: boolean;
  onAddStock: () => void;
  onCreatePortfolio: () => void;
  onBuyStock: (stock: Stock) => void;
  onSellStock: (stock: Stock) => void;
  onDeleteStock: (stock: Stock) => void;
  popularStocks: Array<{
    symbol: string;
    name: string;
    displaySymbol: string;
  }>;
  popularStockPrices: Record<string, PriceData>;
  onAddPopularStock: (stock: { symbol: string; name: string; displaySymbol: string }) => void;
}

type ViewTab = 'holdings' | 'benchmark' | 'allocation';
type FilterOption = 'all' | 'gainers' | 'losers';
type SortOption = 'value' | 'pnl' | 'name' | 'dayChange';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
};

const formatPct = (val: number): string => {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
};

const PortfolioPage: React.FC<PortfolioPageProps> = ({
  stocks,
  transactions,
  stockPrices,
  stats,
  isMarketOpen,
  onAddStock,
  onCreatePortfolio,
  onBuyStock,
  onSellStock,
  onDeleteStock,
  popularStocks,
  popularStockPrices,
  onAddPopularStock,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('holdings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('value');

  // Compute calculated holding statistics
  const holdingsData = useMemo(() => {
    return stocks.map((stock) => {
      const stockTransactions = transactions.filter((t) => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce(
        (sum, t) => (t.type === 'buy' ? sum + t.quantity : sum - t.quantity),
        0
      );

      const totalBuyValue = stockTransactions.reduce(
        (sum, t) => (t.type === 'buy' ? sum + t.price * t.quantity : sum),
        0
      );
      const totalBuyShares = stockTransactions.reduce(
        (sum, t) => (t.type === 'buy' ? sum + t.quantity : sum),
        0
      );
      const avgPrice = totalBuyShares > 0 ? totalBuyValue / totalBuyShares : stock.avgPrice || 0;

      const realizedPnl = stockTransactions.reduce(
        (sum, t) => (t.type === 'sell' ? sum + (t.price - avgPrice) * t.quantity : sum),
        0
      );

      const priceObj = stockPrices[stock.symbol];
      const currentPrice = priceObj?.price || 0;
      const dayChange = priceObj?.change || 0;
      const dayChangePercent = priceObj?.previousClose
        ? ((currentPrice - priceObj.previousClose) / priceObj.previousClose) * 100
        : 0;

      const marketValue = currentPrice * totalShares;
      const investedValue = avgPrice * totalShares;
      const pnl = marketValue - investedValue;
      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
      const weight = stats.totalCurrent > 0 ? (marketValue / stats.totalCurrent) * 100 : 0;

      const info = getStockBySymbol(stock.symbol);
      const sector = info?.sector || 'Diversified';

      return {
        stock,
        totalShares,
        avgPrice,
        currentPrice,
        marketValue,
        investedValue,
        pnl,
        pnlPercent,
        dayChange,
        dayChangePercent,
        realizedPnl,
        weight,
        sector,
      };
    });
  }, [stocks, transactions, stockPrices, stats.totalCurrent]);

  // Filtered & Sorted Holdings
  const filteredHoldings = useMemo(() => {
    return holdingsData
      .filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sector.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (filterOption === 'gainers') return item.pnl >= 0;
        if (filterOption === 'losers') return item.pnl < 0;
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'value') return b.marketValue - a.marketValue;
        if (sortOption === 'pnl') return b.pnlPercent - a.pnlPercent;
        if (sortOption === 'dayChange') return b.dayChangePercent - a.dayChangePercent;
        if (sortOption === 'name') return a.stock.symbol.localeCompare(b.stock.symbol);
        return 0;
      });
  }, [holdingsData, searchQuery, filterOption, sortOption]);

  // Calculate sector concentration breakdown
  const sectorBreakdown = useMemo(() => {
    const acc: Record<string, { totalValue: number; stocksCount: number }> = {};
    holdingsData.forEach((item) => {
      const s = item.sector || 'Others';
      if (!acc[s]) acc[s] = { totalValue: 0, stocksCount: 0 };
      acc[s].totalValue += item.marketValue;
      acc[s].stocksCount += 1;
    });

    const totalVal = Math.max(stats.totalCurrent, 1);
    return Object.entries(acc)
      .map(([sector, data]) => ({
        sector,
        value: data.totalValue,
        count: data.stocksCount,
        pct: (data.totalValue / totalVal) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdingsData, stats.totalCurrent]);

  // Compute performance metrics for Benchmark Comparison
  const perfMetrics = useMemo(() => {
    return calculatePerformanceMetrics(stocks, transactions, stockPrices, (sym) => {
      const info = getStockBySymbol(sym);
      return info ? { sector: info.sector, name: info.name } : null;
    });
  }, [stocks, transactions, stockPrices]);

  const gainersCount = holdingsData.filter((h) => h.pnl >= 0).length;
  const losersCount = holdingsData.filter((h) => h.pnl < 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. EXECUTIVE HEADER & ACTIONS
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight font-sans">
                Portfolio Overview
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/[0.04] border border-white/10 text-slate-300">
                {holdingsData.length} Positions
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-mono text-slate-400">
                {isMarketOpen ? 'NSE/BSE Live Market (09:15 - 15:30 IST)' : 'NSE/BSE Market Closed • Showing Last Close'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onCreatePortfolio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0c121e] hover:bg-[#131b26] border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>New Portfolio</span>
          </button>

          <button
            onClick={onAddStock}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-sm hover:shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. COMPACT INSTITUTIONAL KPI CARDS (Attractive, Defined Borders & Hover Lift)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Portfolio Value */}
        <div className="group relative rounded-xl border border-slate-700/80 hover:border-sky-400/60 bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:shadow-[0_12px_28px_rgba(56,189,248,0.15)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer">
          {/* Top Accent Hairline */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              Portfolio Value
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
              Live
            </span>
          </div>

          <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight my-2 group-hover:text-sky-100 transition-colors">
            {formatINR(stats.totalCurrent)}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Invested Base</span>
            <span className="text-slate-200 font-semibold">{formatINR(stats.totalInvested)}</span>
          </div>
        </div>

        {/* Card 2: Total Net P&L */}
        <div className={`group relative rounded-xl border ${
          stats.totalPnL >= 0 ? 'border-slate-700/80 hover:border-emerald-400/60 hover:shadow-[0_12px_28px_rgba(16,185,129,0.15)]' : 'border-slate-700/80 hover:border-rose-400/60 hover:shadow-[0_12px_28px_rgba(244,63,94,0.15)]'
        } bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer`}>
          {/* Top Accent Hairline */}
          <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${
            stats.totalPnL >= 0 ? 'via-emerald-400' : 'via-rose-400'
          } to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stats.totalPnL >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
              Total Returns
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                stats.totalPnL >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {formatPct(stats.totalPnLPercent)}
            </span>
          </div>

          <div
            className={`text-xl sm:text-2xl font-mono font-bold tracking-tight my-2 ${
              stats.totalPnL >= 0 ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-rose-400 group-hover:text-rose-300'
            } transition-colors`}
          >
            {stats.totalPnL >= 0 ? '+' : ''}
            {formatINR(stats.totalPnL)}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Net Return</span>
            <span className={stats.totalPnL >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {stats.totalPnL >= 0 ? '▲ In Profit' : '▼ Drawdown'}
            </span>
          </div>
        </div>

        {/* Card 3: Today's Movement */}
        <div className={`group relative rounded-xl border ${
          stats.todaysPnL >= 0 ? 'border-slate-700/80 hover:border-emerald-400/60 hover:shadow-[0_12px_28px_rgba(16,185,129,0.15)]' : 'border-slate-700/80 hover:border-rose-400/60 hover:shadow-[0_12px_28px_rgba(244,63,94,0.15)]'
        } bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer`}>
          {/* Top Accent Hairline */}
          <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${
            stats.todaysPnL >= 0 ? 'via-emerald-400' : 'via-rose-400'
          } to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stats.todaysPnL >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
              Today's P&L
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                stats.todaysPnL >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {formatPct(stats.todaysPnLPercent)}
            </span>
          </div>

          <div
            className={`text-xl sm:text-2xl font-mono font-bold tracking-tight my-2 ${
              stats.todaysPnL >= 0 ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-rose-400 group-hover:text-rose-300'
            } transition-colors`}
          >
            {stats.todaysPnL >= 0 ? '+' : ''}
            {formatINR(stats.todaysPnL)}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Day Session</span>
            <span className="text-slate-300 font-medium">vs Prev Close</span>
          </div>
        </div>

        {/* Card 4: Positions & Breadth */}
        <div className="group relative rounded-xl border border-slate-700/80 hover:border-amber-400/60 bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:shadow-[0_12px_28px_rgba(245,158,11,0.15)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer">
          {/* Top Accent Hairline */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              Market Breadth
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
              {holdingsData.length} Stocks
            </span>
          </div>

          <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight my-2 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{gainersCount}▲</span>
            <span className="text-slate-600 text-sm">/</span>
            <span className="text-rose-400 font-bold">{losersCount}▼</span>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${(gainersCount / Math.max(holdingsData.length, 1)) * 100}%` }}
              />
              <div className="bg-rose-500 h-full flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. NAVIGATION TABS (Holdings / Benchmark Comparison / Allocation)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0c121e] border border-slate-800">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'holdings'
                ? 'bg-amber-400/15 border border-amber-400/30 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Holdings Table ({stocks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-amber-400/15 border border-amber-400/30 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Benchmark Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'allocation'
                ? 'bg-amber-400/15 border border-amber-400/30 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Sector Diversification</span>
          </button>
        </div>

        {/* Tab-specific right actions */}
        {activeTab === 'holdings' && stocks.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              Showing {filteredHoldings.length} of {stocks.length} positions
            </span>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 1: HOLDINGS TABLE (Main Institutional View)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {stocks.length === 0 ? (
            /* EMPTY PORTFOLIO ONBOARDING STATE */
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-8 text-center shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Your Portfolio is Currently Empty
              </h3>
              <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
                Build your trading portfolio by adding institutional Indian equities or start by exploring market leaders below.
              </p>

              {/* Popular Starter Stocks */}
              {popularStocks.length > 0 && (
                <div className="max-w-4xl mx-auto text-left">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
                      Popular NSE Blue-Chip Equities
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Click + to add instantly</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#090d16]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-white/[0.02]">
                            <th className="text-left py-3 px-4 font-semibold">Instrument</th>
                            <th className="text-left py-3 px-4 font-semibold">Exchange</th>
                            <th className="text-right py-3 px-4 font-semibold">Market Price (LTP)</th>
                            <th className="text-right py-3 px-4 font-semibold">Day Change</th>
                            <th className="text-center py-3 px-4 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {popularStocks.slice(0, 6).map((stock) => {
                            const pData = popularStockPrices[stock.symbol];
                            const currentPrice = pData?.price || 0;
                            const change = pData?.change || 0;
                            const changePercent = pData?.previousClose
                              ? ((currentPrice - pData.previousClose) / pData.previousClose) * 100
                              : 0;

                            return (
                              <tr key={stock.symbol} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 font-sans">
                                  <div className="flex items-center gap-3">
                                    <StockLogo symbol={stock.symbol} className="w-7 h-7" />
                                    <div>
                                      <p className="font-bold text-white font-mono">{stock.symbol}</p>
                                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                        {stock.name}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-sans text-slate-400">
                                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] font-mono">
                                    NSE
                                  </span>
                                </td>
                                <td className="text-right py-3 px-4 text-slate-100 font-bold">
                                  {currentPrice > 0 ? formatINR(currentPrice) : 'Loading...'}
                                </td>
                                <td className="text-right py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                      change >= 0
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                  >
                                    {formatPct(changePercent)}
                                  </span>
                                </td>
                                <td className="text-center py-3 px-4">
                                  <button
                                    onClick={() => onAddPopularStock(stock)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-sans transition-all cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Position
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE HOLDINGS TABLE */
            <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 overflow-hidden shadow-xl">
              {/* Search & Filter Toolbar */}
              <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#080d16]/80">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] md:max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by symbol, company, or sector..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#0c121e] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-500" /> Filter:
                  </span>
                  {(['all', 'gainers', 'losers'] as FilterOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFilterOption(opt)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                        filterOption === opt
                          ? 'bg-amber-400/15 border border-amber-400/40 text-amber-200'
                          : 'bg-white/[0.02] border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {opt === 'all'
                        ? `All (${holdingsData.length})`
                        : opt === 'gainers'
                        ? `Gainers (${gainersCount})`
                        : `Losers (${losersCount})`}
                    </button>
                  ))}

                  {/* Sorter */}
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-800">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="bg-[#0c121e] border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400/50 cursor-pointer font-mono"
                    >
                      <option value="value">Sort by Value</option>
                      <option value="pnl">Sort by P&L %</option>
                      <option value="dayChange">Sort by Day Change</option>
                      <option value="name">Sort by Name</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white/[0.01]">
                      <th className="text-left py-3.5 px-4 font-semibold">Instrument</th>
                      <th className="text-right py-3.5 px-4 font-semibold">Qty</th>
                      <th className="text-right py-3.5 px-4 font-semibold">Avg Price</th>
                      <th className="text-right py-3.5 px-4 font-semibold">LTP (Current)</th>
                      <th className="text-right py-3.5 px-4 font-semibold">Current Value</th>
                      <th className="text-right py-3.5 px-4 font-semibold">Unrealized P&L</th>
                      <th className="text-right py-3.5 px-4 font-semibold">Realized P&L</th>
                      <th className="text-right py-3.5 px-4 font-semibold">Weight</th>
                      <th className="text-center py-3.5 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredHoldings.map((item) => (
                      <tr
                        key={item.stock.symbol}
                        className="hover:bg-white/[0.025] transition-colors group"
                      >
                        {/* 1. Instrument (Logo + Name + Sector) */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <StockLogo symbol={item.stock.symbol} className="w-8 h-8 text-xs" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white font-mono text-sm">
                                  {item.stock.symbol}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/10 text-[9px] font-mono text-slate-400">
                                  NSE
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="truncate max-w-[140px] sm:max-w-[180px]">
                                  {item.stock.name}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-amber-400/80 text-[10px]">{item.sector}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Quantity */}
                        <td className="text-right py-3.5 px-4 font-bold text-slate-200">
                          {item.totalShares}
                        </td>

                        {/* 3. Avg Buy Price */}
                        <td className="text-right py-3.5 px-4 text-slate-300">
                          {formatINR(item.avgPrice)}
                        </td>

                        {/* 4. LTP Current & Day Change */}
                        <td className="text-right py-3.5 px-4">
                          <div className="font-bold text-white">
                            {item.currentPrice > 0 ? formatINR(item.currentPrice) : 'Loading...'}
                          </div>
                          <div
                            className={`text-[10px] ${
                              item.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatPct(item.dayChangePercent)}
                          </div>
                        </td>

                        {/* 5. Current Market Value */}
                        <td className="text-right py-3.5 px-4 font-bold text-white text-sm">
                          {formatINR(item.marketValue)}
                        </td>

                        {/* 6. Unrealized P&L */}
                        <td className="text-right py-3.5 px-4">
                          <div
                            className={`font-bold ${
                              item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.pnl >= 0 ? '+' : ''}
                            {formatINR(item.pnl)}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                              item.pnl >= 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {formatPct(item.pnlPercent)}
                          </span>
                        </td>

                        {/* 7. Realized / Booked P&L */}
                        <td className="text-right py-3.5 px-4">
                          <span
                            className={`font-semibold ${
                              item.realizedPnl > 0
                                ? 'text-emerald-400'
                                : item.realizedPnl < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.realizedPnl !== 0
                              ? `${item.realizedPnl > 0 ? '+' : ''}${formatINR(item.realizedPnl)}`
                              : '₹0.00'}
                          </span>
                        </td>

                        {/* 8. Portfolio Weight Mini Bar */}
                        <td className="text-right py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-slate-300 font-semibold">{item.weight.toFixed(1)}%</span>
                            <div className="w-10 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div
                                className="bg-amber-400 h-full rounded-full"
                                style={{ width: `${Math.min(item.weight, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 9. Actions (Buy, Sell, Delete) */}
                        <td className="text-center py-3.5 px-4 font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onBuyStock(item.stock)}
                              className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                              title="Buy more shares"
                            >
                              Buy
                            </button>

                            <button
                              onClick={() => onSellStock(item.stock)}
                              disabled={item.totalShares === 0}
                              className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Sell position"
                            >
                              Sell
                            </button>

                            <button
                              onClick={() => onDeleteStock(item.stock)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Remove from portfolio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 2: INTEGRATED BENCHMARK COMPARISON (Nifty 50, Sensex, Alpha)
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'benchmark' && (
        <BenchmarkComparison performanceMetrics={perfMetrics} />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 3: SECTOR DIVERSIFICATION & ASSET ALLOCATION
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0c121e]/90 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                  Sector Concentration & Allocation Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ensure healthy diversification to protect against sector-specific macroeconomic drawdowns.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono">
                {sectorBreakdown.length} Sectors Active
              </span>
            </div>

            {/* Sector Progress Bars Grid */}
            <div className="space-y-4 max-w-4xl">
              {sectorBreakdown.map((sec) => (
                <div key={sec.sector} className="p-3.5 rounded-xl border border-slate-800/80 bg-[#080d16]">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-sans text-sm">{sec.sector}</span>
                      <span className="text-[10px] text-slate-500">
                        ({sec.count} {sec.count === 1 ? 'position' : 'positions'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 font-semibold">{formatINR(sec.value)}</span>
                      <span className="text-amber-300 font-bold w-12 text-right">
                        {sec.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Weight Bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sec.pct > 40
                          ? 'bg-rose-500'
                          : sec.pct > 25
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(sec.pct, 100)}%` }}
                    />
                  </div>

                  {sec.pct > 40 && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-300 font-sans">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        High sector concentration risk (&gt;40% in {sec.sector}). Consider trimming or reallocating.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
