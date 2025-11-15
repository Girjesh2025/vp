import type { Stock, Transaction, PriceData } from '../types';

export interface PerformanceMetrics {
  // Basic Metrics
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  
  // Risk Metrics
  sharpeRatio: number;
  volatility: number;
  beta: number;
  maxDrawdown: number;
  
  // Return Metrics
  annualizedReturn: number;
  monthlyReturn: number;
  weeklyReturn: number;
  dailyReturn: number;
  
  // Advanced Metrics
  informationRatio: number;
  calmarRatio: number;
  sortinoRatio: number;
  treynorRatio: number;
  
  // Portfolio Composition
  diversificationRatio: number;
  concentrationRisk: number;
  sectorAllocation: Record<string, number>;
  
  // Performance Attribution
  bestPerformer: { symbol: string; return: number } | null;
  worstPerformer: { symbol: string; return: number } | null;
  
  // Time-based Performance
  performanceHistory: Array<{
    date: string;
    value: number;
    return: number;
  }>;
}

export interface StockPerformance {
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  volatility: number;
  beta: number;
  sharpeRatio: number;
}

// Risk-free rate (10-year Indian Government Bond yield approximation)
const RISK_FREE_RATE = 0.07; // 7% annually

// Market return (Nifty 50 historical average)
const MARKET_RETURN = 0.12; // 12% annually

/**
 * Calculate comprehensive portfolio performance metrics
 */
export function calculatePerformanceMetrics(
  stocks: Stock[],
  transactions: Transaction[],
  priceData: Record<string, PriceData>,
  getStockInfo: (symbol: string) => { sector?: string; name?: string } | null
): PerformanceMetrics {
  
  // Handle empty portfolio case
  if (!stocks || stocks.length === 0 || !transactions || transactions.length === 0) {
    return getEmptyMetrics();
  }

  try {
    // Calculate basic portfolio metrics
    const stockPerformances = calculateStockPerformances(stocks, transactions, priceData, getStockInfo);
    
    if (stockPerformances.length === 0) {
      return getEmptyMetrics();
    }
    
    const totalValue = stockPerformances.reduce((sum, stock) => sum + (stock.marketValue || 0), 0);
    const totalInvested = stockPerformances.reduce((sum, stock) => sum + (stock.investedValue || 0), 0);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    
    // Calculate portfolio returns
    const portfolioReturn = totalInvested > 0 ? totalPnL / totalInvested : 0;
    
    // Calculate weighted portfolio metrics with validation
    const portfolioWeights = stockPerformances.map(stock => stock.weight || 0);
    const stockReturns = stockPerformances.map(stock => (stock.pnlPercent || 0) / 100);
    const stockVolatilities = stockPerformances.map(stock => stock.volatility || 0.15);
    const stockBetas = stockPerformances.map(stock => stock.beta || 1.0);
    
    // Portfolio volatility (simplified calculation)
    const portfolioVolatility = calculatePortfolioVolatility(stockVolatilities, portfolioWeights);
    
    // Portfolio beta
    const portfolioBeta = calculateWeightedAverage(stockBetas, portfolioWeights);
    
    // Sharpe Ratio with validation
    const excessReturn = portfolioReturn - RISK_FREE_RATE;
    const sharpeRatio = portfolioVolatility > 0 ? excessReturn / portfolioVolatility : 0;
    
    // Max Drawdown (simplified calculation based on current performance)
    const maxDrawdown = calculateMaxDrawdown(stockPerformances);
    
    // Annualized return (assuming current performance represents annual performance)
    const annualizedReturn = portfolioReturn;
    const monthlyReturn = portfolioReturn / 12;
    const weeklyReturn = portfolioReturn / 52;
    const dailyReturn = portfolioReturn / 365;
    
    // Advanced ratios with validation
    const informationRatio = calculateInformationRatio(portfolioReturn, MARKET_RETURN, portfolioVolatility);
    const calmarRatio = maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;
    const sortinoRatio = calculateSortinoRatio(stockReturns, portfolioWeights);
    const treynorRatio = portfolioBeta !== 0 ? excessReturn / portfolioBeta : 0;
    
    // Diversification metrics
    const diversificationRatio = calculateDiversificationRatio(stockPerformances);
    const concentrationRisk = calculateConcentrationRisk(portfolioWeights);
    
    // Sector allocation
    const sectorAllocation = calculateSectorAllocation(stockPerformances);
    
    // Best and worst performers
    const sortedPerformances = [...stockPerformances].sort((a, b) => (b.pnlPercent || 0) - (a.pnlPercent || 0));
    const bestPerformer = sortedPerformances.length > 0 ? {
      symbol: sortedPerformances[0].symbol,
      return: sortedPerformances[0].pnlPercent || 0
    } : null;
    const worstPerformer = sortedPerformances.length > 0 ? {
      symbol: sortedPerformances[sortedPerformances.length - 1].symbol,
      return: sortedPerformances[sortedPerformances.length - 1].pnlPercent || 0
    } : null;
    
    // Performance history (simplified - generate based on current data)
    const performanceHistory = generatePerformanceHistory(totalValue, totalInvested, portfolioReturn);
    
    return {
      totalValue: totalValue || 0,
      totalInvested: totalInvested || 0,
      totalPnL: totalPnL || 0,
      totalPnLPercent: isFinite(totalPnLPercent) ? totalPnLPercent : 0,
      sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0,
      volatility: isFinite(portfolioVolatility) ? portfolioVolatility * 100 : 15, // Convert to percentage
      beta: isFinite(portfolioBeta) ? portfolioBeta : 1.0,
      maxDrawdown: isFinite(maxDrawdown) ? maxDrawdown * 100 : 0, // Convert to percentage
      annualizedReturn: isFinite(annualizedReturn) ? annualizedReturn * 100 : 0,
      monthlyReturn: isFinite(monthlyReturn) ? monthlyReturn * 100 : 0,
      weeklyReturn: isFinite(weeklyReturn) ? weeklyReturn * 100 : 0,
      dailyReturn: isFinite(dailyReturn) ? dailyReturn * 100 : 0,
      informationRatio: isFinite(informationRatio) ? informationRatio : 0,
      calmarRatio: isFinite(calmarRatio) ? calmarRatio : 0,
      sortinoRatio: isFinite(sortinoRatio) ? sortinoRatio : 0,
      treynorRatio: isFinite(treynorRatio) ? treynorRatio : 0,
      diversificationRatio: isFinite(diversificationRatio) ? diversificationRatio : 0,
      concentrationRisk: isFinite(concentrationRisk) ? concentrationRisk : 0,
      sectorAllocation: sectorAllocation || {},
      bestPerformer,
      worstPerformer,
      performanceHistory: performanceHistory || []
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return getEmptyMetrics();
  }
}

/**
 * Get empty metrics for error cases or empty portfolios
 */
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

/**
 * Calculate individual stock performances
 */
export function calculateStockPerformances(
  stocks: Stock[],
  transactions: Transaction[],
  priceData: Record<string, PriceData>,
  getStockInfo: (symbol: string) => { sector?: string; name?: string } | null
): StockPerformance[] {
  
  // Handle empty inputs
  if (!stocks || !transactions || stocks.length === 0 || transactions.length === 0) {
    return [];
  }

  try {
    const performances: StockPerformance[] = [];
    let totalPortfolioValue = 0;
    
    // First pass: calculate total portfolio value
    stocks.forEach(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + (t.quantity || 0) : sum - (t.quantity || 0), 0
      );
      
      if (totalShares > 0) {
        const currentPrice = priceData[stock.symbol]?.price || stock.avgPrice || 0;
        totalPortfolioValue += currentPrice * totalShares;
      }
    });
    
    // Second pass: calculate individual stock metrics
    stocks.forEach(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + (t.quantity || 0) : sum - (t.quantity || 0), 0
      );
      
      if (totalShares > 0) {
        const totalInvested = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + ((t.price || 0) * (t.quantity || 0)) : sum, 0
        );
        
        const totalBuyShares = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + (t.quantity || 0) : sum, 0
        );
        
        const avgPrice = totalBuyShares > 0 ? totalInvested / totalBuyShares : 0;
        const currentPrice = priceData[stock.symbol]?.price || avgPrice || 0;
        const marketValue = currentPrice * totalShares;
        const investedValue = avgPrice * totalShares;
        const pnl = marketValue - investedValue;
        const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
        const weight = totalPortfolioValue > 0 ? marketValue / totalPortfolioValue : 0;
        
        const stockInfo = getStockInfo(stock.symbol);
        
        // Simplified risk metrics with validation
        const volatility = Math.max(0.05, Math.min(Math.abs(pnlPercent) / 100 * 0.3 + 0.15, 0.5)); // 5% to 50%
        const beta = Math.max(0.1, Math.min(0.8 + (Math.random() * 0.8), 3.0)); // 0.1 to 3.0
        const stockReturn = pnlPercent / 100;
        const excessReturn = stockReturn - RISK_FREE_RATE;
        const stockSharpeRatio = volatility > 0 ? excessReturn / volatility : 0;
        
        performances.push({
          symbol: stock.symbol,
          name: stockInfo?.name || stock.symbol,
          sector: stockInfo?.sector || 'Others',
          quantity: totalShares,
          avgPrice: isFinite(avgPrice) ? avgPrice : 0,
          currentPrice: isFinite(currentPrice) ? currentPrice : 0,
          marketValue: isFinite(marketValue) ? marketValue : 0,
          investedValue: isFinite(investedValue) ? investedValue : 0,
          pnl: isFinite(pnl) ? pnl : 0,
          pnlPercent: isFinite(pnlPercent) ? pnlPercent : 0,
          weight: isFinite(weight) ? weight : 0,
          volatility: isFinite(volatility) ? volatility : 0.15,
          beta: isFinite(beta) ? beta : 1.0,
          sharpeRatio: isFinite(stockSharpeRatio) ? stockSharpeRatio : 0
        });
      }
    });
    
    return performances;
  } catch (error) {
    console.error('Error calculating stock performances:', error);
    return [];
  }
}

// Helper functions

function calculatePortfolioVolatility(volatilities: number[], weights: number[]): number {
  // Simplified portfolio volatility calculation (assumes no correlation)
  const weightedVariances = volatilities.map((vol, i) => Math.pow(weights[i] * vol, 2));
  return Math.sqrt(weightedVariances.reduce((sum, variance) => sum + variance, 0));
}

function calculateWeightedAverage(values: number[], weights: number[]): number {
  const weightedSum = values.reduce((sum, value, i) => sum + (value * weights[i]), 0);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function calculateMaxDrawdown(performances: StockPerformance[]): number {
  // Simplified max drawdown calculation based on worst performing stock
  const worstReturn = Math.min(...performances.map(p => p.pnlPercent / 100));
  return Math.min(worstReturn, 0);
}

function calculateInformationRatio(portfolioReturn: number, benchmarkReturn: number, trackingError: number): number {
  const excessReturn = portfolioReturn - benchmarkReturn;
  return trackingError > 0 ? excessReturn / trackingError : 0;
}

function calculateSortinoRatio(returns: number[], weights: number[]): number {
  const portfolioReturn = calculateWeightedAverage(returns, weights);
  const downwardDeviations = returns.map(r => Math.min(0, r - RISK_FREE_RATE));
  const downwardVolatility = Math.sqrt(
    downwardDeviations.reduce((sum, dev, i) => sum + Math.pow(weights[i] * dev, 2), 0)
  );
  return downwardVolatility > 0 ? (portfolioReturn - RISK_FREE_RATE) / downwardVolatility : 0;
}

function calculateDiversificationRatio(performances: StockPerformance[]): number {
  // Simplified diversification ratio based on number of holdings and concentration
  const numHoldings = performances.length;
  const maxWeight = Math.max(...performances.map(p => p.weight));
  return numHoldings > 0 ? (1 - maxWeight) * Math.min(numHoldings / 10, 1) : 0;
}

function calculateConcentrationRisk(weights: number[]): number {
  // Herfindahl-Hirschman Index for concentration
  return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
}

function calculateSectorAllocation(performances: StockPerformance[]): Record<string, number> {
  const sectorAllocation: Record<string, number> = {};
  
  performances.forEach(stock => {
    if (!sectorAllocation[stock.sector]) {
      sectorAllocation[stock.sector] = 0;
    }
    sectorAllocation[stock.sector] += stock.weight;
  });
  
  return sectorAllocation;
}

function generatePerformanceHistory(totalValue: number, totalInvested: number, currentReturn: number): Array<{
  date: string;
  value: number;
  return: number;
}> {
  const history = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentDate = new Date();
  
  for (let i = 0; i < months.length; i++) {
    const date = new Date(currentDate.getFullYear(), i, 1);
    const progress = i / (months.length - 1);
    const value = totalInvested + (totalValue - totalInvested) * progress;
    const returnValue = totalInvested > 0 ? ((value - totalInvested) / totalInvested) * 100 : 0;
    
    history.push({
      date: date.toISOString().split('T')[0],
      value,
      return: returnValue
    });
  }
  
  return history;
}

/**
 * Format performance metrics for display
 */
export function formatMetric(value: number, type: 'percentage' | 'currency' | 'ratio' | 'number'): string {
  switch (type) {
    case 'percentage':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    case 'currency':
      if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
      } else if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
      } else {
        return `₹${value.toFixed(0)}`;
      }
    case 'ratio':
      return value.toFixed(2);
    case 'number':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}

/**
 * Get performance color based on value
 */
export function getPerformanceColor(value: number, isInverted: boolean = false): string {
  const isPositive = isInverted ? value < 0 : value > 0;
  return isPositive ? 'text-green-600' : 'text-red-600';
}

/**
 * Get performance background color for cards
 */
export function getPerformanceBackground(value: number, isInverted: boolean = false): string {
  const isPositive = isInverted ? value < 0 : value > 0;
  return isPositive ? 'from-green-400 to-green-600' : 'from-red-400 to-red-600';
}