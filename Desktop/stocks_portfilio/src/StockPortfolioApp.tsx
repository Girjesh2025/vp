import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Settings, User, Wallet, Activity, Trash2, Edit } from 'lucide-react';
import AddStockModal from './components/AddStockModal';
import TransactionModal from './components/TransactionModal';
import PortfolioChart from './components/PortfolioChart';
import PerformanceChart from './components/PerformanceChart';
import MarketNewsPanel from './components/MarketNewsPanel';
import { fetchStockPrice } from './utils/priceApi';
import { 
  getStockBySymbol,
  searchStocksOptimized, 
  searchStocksFuzzy,
  getSearchPerformanceStats
} from './stockDatabase';
import { runFullPerformanceTest } from './searchPerformanceTest';
import { usePortfolio } from './hooks/usePortfolio';
import { 
  initializeNotifications, 
  sendPortfolioUpdate, 
  checkPriceAlerts,
  getNotificationSettings,
  saveNotificationSettings,
  type PriceAlert,
  type NotificationSettings
} from './utils/notifications';
import type { Stock, Transaction, PriceData } from './types';

interface StockWithPrice extends Stock {
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
}

const StockPortfolioApp: React.FC = () => {
  const { 
    stocks: portfolioStocks, 
    transactions: portfolioTransactions, 
    loading: portfolioLoading, 
    error: portfolioError,
    addStock: addStockToPortfolio,
    addTransaction: addTransactionToPortfolio,
    removeStock: removeStockFromPortfolio
  } = usePortfolio();

  const [stocks, setStocks] = useState<StockWithPrice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, PriceData>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [priceUpdateTime, setPriceUpdateTime] = useState<Date | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [dailyApiLimit] = useState(100); // Assuming 100 calls per day for free tier
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [portfolioUpdatesEnabled, setPortfolioUpdatesEnabled] = useState(true);
  const [marketNewsEnabled, setMarketNewsEnabled] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings());

  const fetchPricesForStocks = async () => {
    // Check API usage before making calls
    if (apiCallCount >= dailyApiLimit) {
      setDataError(`Daily API limit reached (${dailyApiLimit} calls). Please try again tomorrow.`);
      return;
    }
    
    if (stocks.length === 0) {
      console.log('⚠️ No stocks in portfolio to fetch prices for');
      setDataError('No stocks in portfolio. Add some stocks to fetch real-time prices.');
      return;
    }
    
    console.log(`🔄 Starting price fetch for ${stocks.length} stocks:`, stocks.map(s => s.symbol));
    setIsLoading(true);
    setDataError(null);
    
    try {
      const pricePromises = stocks.map(async (stock) => {
        try {
          console.log(`📊 Fetching price for ${stock.symbol}...`);
          const priceData = await fetchStockPrice(stock.symbol);
          console.log(`✅ Price fetched for ${stock.symbol}:`, priceData);
          return { symbol: stock.symbol, priceData };
        } catch (error) {
          console.error(`❌ Failed to fetch price for ${stock.symbol}:`, error);
          return { symbol: stock.symbol, priceData: null };
        }
      });

      const results = await Promise.all(pricePromises);
      
      // Update API call count
      setApiCallCount(prev => prev + stocks.length);
      
      const newPrices: Record<string, PriceData> = {};
      
      results.forEach(({ symbol, priceData }) => {
        if (priceData) {
          newPrices[symbol] = priceData;
        } else {
          // If price fetch failed, keep the previous price if available
          if (stockPrices[symbol]) {
            newPrices[symbol] = stockPrices[symbol];
            console.log(`⚠️ Keeping previous price for ${symbol} due to fetch error`);
          }
        }
      });

      console.log(`📈 Price update complete. Got prices for:`, Object.keys(newPrices));
      setStockPrices(newPrices);
      setPriceUpdateTime(new Date());
      
      // Check if we got prices for all stocks
      const missingPrices = stocks.filter(stock => !newPrices[stock.symbol]);
      if (missingPrices.length > 0) {
        console.warn(`⚠️ Missing prices for:`, missingPrices.map(s => s.symbol));
        setDataError(`Unable to fetch prices for: ${missingPrices.map(s => s.symbol).join(', ')}`);
      }
    } catch (error) {
      setDataError('Failed to update stock prices. Please try again.');
      console.error('❌ Price fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync portfolio data with local state
  useEffect(() => {
    if (!portfolioLoading && portfolioStocks) {
      setStocks(portfolioStocks.map(stock => ({
        ...stock,
        currentPrice: stockPrices[stock.symbol]?.price,
        priceChange: stockPrices[stock.symbol]?.change,
        priceChangePercent: stockPrices[stock.symbol]?.change ? 
          (stockPrices[stock.symbol].change / stockPrices[stock.symbol].previousClose) * 100 : undefined
      })));
    }
  }, [portfolioStocks, portfolioLoading, stockPrices]);

  useEffect(() => {
    if (!portfolioLoading && portfolioTransactions) {
      setTransactions(portfolioTransactions);
    }
  }, [portfolioTransactions, portfolioLoading]);

  // Helper function to check if Indian stock market is open
  const isMarketOpen = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const day = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes
    
    // Market is closed on weekends (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) {
      return false;
    }
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = 9 * 60 + 15; // 9:15 AM in minutes
    const marketClose = 15 * 60 + 30; // 3:30 PM in minutes
    
    return currentTime >= marketOpen && currentTime <= marketClose;
  };

  useEffect(() => {
    // Initialize notifications on component mount
    initializeNotifications();
  }, []);

  useEffect(() => {
    fetchPricesForStocks();
    
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Set up new interval only if auto-refresh is enabled
    if (autoRefreshEnabled) {
      const smartRefresh = () => {
        // Only fetch prices if market is open or if it's been more than 30 minutes since last update
        if (isMarketOpen()) {
          fetchPricesForStocks();
        } else {
          console.log('Market is closed, skipping price update to conserve API calls');
        }
      };
      
      // Increased interval from 30 seconds to 5 minutes (300000ms) to conserve API calls
      const interval = setInterval(smartRefresh, 300000); // 5 minutes
      setRefreshInterval(interval);
      
      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    }
  }, [stocks, autoRefreshEnabled]);

  // Check price alerts when stock prices update
  useEffect(() => {
    if (priceAlertsEnabled && priceAlerts.length > 0) {
      const currentPrices: Record<string, number> = {};
      Object.entries(stockPrices).forEach(([symbol, priceData]) => {
        currentPrices[symbol] = priceData.price;
      });
      checkPriceAlerts(priceAlerts, currentPrices);
    }
  }, [stockPrices, priceAlertsEnabled, priceAlerts]);

  // Send portfolio update notifications
  useEffect(() => {
    if (portfolioUpdatesEnabled && stocks.length > 0) {
      const stats = calculatePortfolioStats();
      if (stats.totalPnL !== 0) {
        // Only send notification if there's a significant change (>1%)
        if (Math.abs(stats.totalPnLPercent) > 1) {
          sendPortfolioUpdate(stats.totalPnL, stats.totalPnLPercent);
        }
      }
    }
  }, [portfolioUpdatesEnabled, stocks, stockPrices]);

  // Save notification settings when they change
  useEffect(() => {
    const settings: NotificationSettings = {
      priceAlerts: priceAlertsEnabled,
      portfolioUpdates: portfolioUpdatesEnabled,
      marketNews: marketNewsEnabled,
      soundEnabled: notificationSettings.soundEnabled,
      updateFrequency: notificationSettings.updateFrequency
    };
    saveNotificationSettings(settings);
    setNotificationSettings(settings);
  }, [priceAlertsEnabled, portfolioUpdatesEnabled, marketNewsEnabled]);

  // Show loading state while portfolio is loading
  if (portfolioLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  // Show error state if portfolio failed to load
  if (portfolioError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Portfolio</h2>
          <p className="text-gray-600 mb-4">{portfolioError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const addStock = async (stock: Stock) => {
    // Check if stock already exists
    const existingStock = stocks.find(s => s.symbol === stock.symbol);
    if (existingStock) {
      alert(`Stock ${stock.symbol} already exists in your portfolio!`);
      return;
    }
    
    try {
      await addStockToPortfolio({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.displaySymbol.split('-')[1] || 'NSE', // Extract exchange from displaySymbol
        quantity: 0, // Initial quantity is 0, will be set via transaction
        avgPrice: 0  // Initial avgPrice is 0, will be calculated from transactions
      });
      
      setIsAddModalOpen(false);
      
      // Automatically open transaction modal to add initial purchase
      setSelectedStock(stock);
      setIsTransactionModalOpen(true);
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock. Please try again.');
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      await addTransactionToPortfolio({
        stockSymbol: transaction.symbol,
        type: transaction.type,
        quantity: transaction.quantity,
        price: transaction.price,
        date: transaction.date
      });
      setIsTransactionModalOpen(false);
      setSelectedStock(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const deleteStock = async (symbolToDelete: string) => {
    try {
      await removeStockFromPortfolio(symbolToDelete);
      setStockPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[symbolToDelete];
        return newPrices;
      });
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Failed to delete stock. Please try again.');
    }
  };

  // Check if Indian stock market is open
  const isIndianMarketOpen = (): boolean => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes
    
    // Market is closed on weekends
    if (day === 0 || day === 6) {
      return false;
    }
    
    // Market hours: 9:15 AM to 3:30 PM IST (555 minutes to 930 minutes)
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return currentTime >= marketOpen && currentTime <= marketClose;
  };

  const calculatePortfolioStats = () => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalStocks = 0;

    stocks.forEach(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
      );
      
      if (totalShares > 0) {
        totalStocks++;
        const avgPrice = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
        ) / stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + t.quantity : sum, 0
        );
        
        totalInvested += avgPrice * totalShares;
        
        // Use current price only if market is open, otherwise use average price (no profit/loss)
        let currentPrice = avgPrice; // Default to no change
        if (isIndianMarketOpen() && stockPrices[stock.symbol]?.price) {
          currentPrice = stockPrices[stock.symbol].price;
        }
        
        totalCurrent += currentPrice * totalShares;
      }
    });

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalPnL,
      totalPnLPercent,
      totalStocks
    };
  };

  // Calculate enriched stocks data with actual quantities and prices from transactions
  const getEnrichedStocksData = () => {
    return stocks.map(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
      );
      
      let avgPrice = 0;
      if (totalShares > 0) {
        const totalBuyValue = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
        );
        const totalBuyQuantity = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + t.quantity : sum, 0
        );
        avgPrice = totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;
      }

      return {
        ...stock,
        quantity: totalShares,
        avgPrice: avgPrice
      };
    }).filter(stock => stock.quantity > 0); // Only return stocks with positive quantities
  };

  const stats = calculatePortfolioStats();
  const enrichedStocks = getEnrichedStocksData();

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: BarChart3 },
    { id: 'portfolio', label: 'PORTFOLIO', icon: PieChart },
    { id: 'transactions', label: 'TRANSACTIONS', icon: Activity },
    { id: 'analytics', label: 'ANALYTICS', icon: TrendingUp },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-green-100 text-sm font-medium">Total Value</div>
            <div className="text-2xl font-bold mt-1">₹{stats.totalCurrent.toLocaleString()}</div>
          </div>
          <DollarSign className="absolute top-4 right-4 w-8 h-8 text-green-200" />
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-blue-100 text-sm font-medium">Invested</div>
            <div className="text-2xl font-bold mt-1">₹{stats.totalInvested.toLocaleString()}</div>
          </div>
          <Wallet className="absolute top-4 right-4 w-8 h-8 text-blue-200" />
        </div>

        <div className={`bg-gradient-to-br ${stats.totalPnL >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600'} rounded-2xl p-6 text-white relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="text-white/80 text-sm font-medium">P&L</div>
            <div className="text-2xl font-bold mt-1">₹{stats.totalPnL.toLocaleString()}</div>
            <div className="text-sm text-white/80">{stats.totalPnLPercent.toFixed(2)}%</div>
          </div>
          {stats.totalPnL >= 0 ? 
            <TrendingUp className="absolute top-4 right-4 w-8 h-8 text-white/60" /> :
            <TrendingDown className="absolute top-4 right-4 w-8 h-8 text-white/60" />
          }
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-purple-100 text-sm font-medium">Total Stocks</div>
            <div className="text-2xl font-bold mt-1">{stats.totalStocks}</div>
          </div>
          <PieChart className="absolute top-4 right-4 w-8 h-8 text-purple-200" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Portfolio Allocation</h3>
          <PortfolioChart stocks={enrichedStocks} priceData={stockPrices} />
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Trends</h3>
          <PerformanceChart stocks={enrichedStocks} priceData={stockPrices} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white flex flex-col">
        {/* Profile Section */}
        <div className="p-6 border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold">PORTFOLIO TRACKER</div>
              <div className="text-sm text-indigo-200">investor@portfolio.com</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-white/20 text-white'
                    : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Active Users */}
        <div className="p-4 border-t border-indigo-500/30">
          <div className="text-sm text-indigo-200 mb-3">ACTIVE USERS</div>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold">
                {i}
              </div>
            ))}
            <div className="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold">
              +70
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Portfolio Overview</h2>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Stock
                </button>
              </div>

              {/* Market Status Indicator */}
              <div className={`p-4 rounded-lg border ${isIndianMarketOpen() 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isIndianMarketOpen() 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${isIndianMarketOpen() 
                    ? 'text-green-700' 
                    : 'text-gray-600'
                  }`}>
                    {isIndianMarketOpen() 
                      ? 'Market Open - Live Prices' 
                      : 'Market Closed - Showing Last Close Prices'
                    }
                  </span>
                </div>
                {!isIndianMarketOpen() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Indian stock market is closed. P&L shows last trading day values.
                  </p>
                )}
              </div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="text-blue-100 text-sm font-medium">Total Portfolio Value</div>
                  <div className="text-3xl font-bold mt-1">₹{stats.totalCurrent.toLocaleString()}</div>
                  <div className="text-sm text-blue-100 mt-2">
                    {stats.totalPnL >= 0 ? '+' : ''}₹{stats.totalPnL.toLocaleString()} ({stats.totalPnLPercent.toFixed(2)}%)
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
                  <div className="text-green-100 text-sm font-medium">Total Invested</div>
                  <div className="text-3xl font-bold mt-1">₹{stats.totalInvested.toLocaleString()}</div>
                  <div className="text-sm text-green-100 mt-2">Across {stats.totalStocks} stocks</div>
                </div>

                <div className={`bg-gradient-to-br ${stats.totalPnL >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600'} rounded-2xl p-6 text-white`}>
                  <div className="text-white/80 text-sm font-medium">Today's P&L</div>
                  <div className="text-3xl font-bold mt-1">
                    {stats.totalPnL >= 0 ? '+' : ''}₹{stats.totalPnL.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/80 mt-2">{stats.totalPnLPercent.toFixed(2)}%</div>
                </div>
              </div>

              {/* Detailed Holdings Table */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">All Holdings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Stock</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Quantity</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Avg Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Current Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Market Value</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">P&L</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map((stock) => {
                        const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                        const totalShares = stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                        );
                        
                        // Show all stocks, including those with zero shares
                        const avgPrice = totalShares > 0 ? stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
                        ) / stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + t.quantity : sum, 0
                        ) : 0;

                        const currentPrice = stockPrices[stock.symbol]?.price || 0;
                        const marketValue = currentPrice * totalShares;
                        const investedValue = avgPrice * totalShares;
                        const pnl = marketValue - investedValue;
                        const pnlPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

                        return (
                          <tr key={stock.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-semibold text-gray-800">{stock.symbol}</div>
                                <div className="text-sm text-gray-500">{stock.name}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{totalShares}</td>
                            <td className="py-4 px-4 text-gray-700">₹{avgPrice.toFixed(2)}</td>
                            <td className="py-4 px-4 text-gray-700">₹{currentPrice.toFixed(2)}</td>
                            <td className="py-4 px-4 text-gray-700">₹{marketValue.toLocaleString()}</td>
                            <td className="py-4 px-4">
                              <div className={`${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{pnl.toFixed(2)}
                                <div className="text-sm">({pnlPercent.toFixed(2)}%)</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedStock(stock);
                                    setIsTransactionModalOpen(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title={totalShares === 0 ? "Add your first transaction" : "Add transaction"}
                                >
                                  {totalShares === 0 ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => deleteStock(stock.symbol)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
              </div>

              {/* Transaction Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="text-blue-100 text-sm font-medium">Total Transactions</div>
                  <div className="text-3xl font-bold mt-1">{transactions.length}</div>
                </div>

                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
                  <div className="text-green-100 text-sm font-medium">Buy Orders</div>
                  <div className="text-3xl font-bold mt-1">
                    {transactions.filter(t => t.type === 'buy').length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-6 text-white">
                  <div className="text-red-100 text-sm font-medium">Sell Orders</div>
                  <div className="text-3xl font-bold mt-1">
                    {transactions.filter(t => t.type === 'sell').length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="text-purple-100 text-sm font-medium">Total Volume</div>
                  <div className="text-3xl font-bold mt-1">
                    ₹{transactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">All Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Stock</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Quantity</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 text-gray-700">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-semibold text-gray-800">{transaction.symbol}</div>
                                <div className="text-sm text-gray-500">{transaction.name}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                transaction.type === 'buy' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{transaction.quantity}</td>
                            <td className="py-4 px-4 text-gray-700">₹{transaction.price.toFixed(2)}</td>
                            <td className="py-4 px-4 text-gray-700">₹{transaction.total.toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found. Add some stocks to get started!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Portfolio Analytics</h2>
              </div>

              {/* Advanced Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="text-indigo-100 text-sm font-medium">Portfolio Beta</div>
                  <div className="text-3xl font-bold mt-1">1.2</div>
                  <div className="text-sm text-indigo-100 mt-2">Market correlation</div>
                </div>

                <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl p-6 text-white">
                  <div className="text-teal-100 text-sm font-medium">Sharpe Ratio</div>
                  <div className="text-3xl font-bold mt-1">0.85</div>
                  <div className="text-sm text-teal-100 mt-2">Risk-adjusted return</div>
                </div>

                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white">
                  <div className="text-orange-100 text-sm font-medium">Volatility</div>
                  <div className="text-3xl font-bold mt-1">18.5%</div>
                  <div className="text-sm text-orange-100 mt-2">30-day volatility</div>
                </div>

                <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl p-6 text-white">
                  <div className="text-pink-100 text-sm font-medium">Max Drawdown</div>
                  <div className="text-3xl font-bold mt-1">-12.3%</div>
                  <div className="text-sm text-pink-100 mt-2">Peak to trough</div>
                </div>
              </div>



              {/* Sector Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Sector Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    // Calculate sector allocation dynamically
                    const sectorData: Record<string, { value: number, pnl: number, count: number }> = {};
                    let totalPortfolioValue = 0;

                    stocks.forEach(stock => {
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
                        
                        // Get sector from stock database
                         const stockInfo = getStockBySymbol(stock.symbol);
                         const sector = stockInfo?.sector || 'Others';
                        
                        if (!sectorData[sector]) {
                          sectorData[sector] = { value: 0, pnl: 0, count: 0 };
                        }
                        
                        sectorData[sector].value += marketValue;
                        sectorData[sector].pnl += pnl;
                        sectorData[sector].count += 1;
                        totalPortfolioValue += marketValue;
                      }
                    });

                    // Sort sectors by value and take top 3
                    const topSectors = Object.entries(sectorData)
                      .sort(([,a], [,b]) => b.value - a.value)
                      .slice(0, 3);

                    if (topSectors.length === 0) {
                      return (
                        <div className="col-span-3 text-center text-gray-500 py-8">
                          No stocks in portfolio. Add some stocks to see sector analysis.
                        </div>
                      );
                    }

                    const sectorColors = ['blue', 'green', 'purple', 'orange', 'red'];

                    return topSectors.map(([sector, data], index) => {
                      const percentage = totalPortfolioValue > 0 ? (data.value / totalPortfolioValue) * 100 : 0;
                      const pnlPercent = data.value > 0 ? (data.pnl / (data.value - data.pnl)) * 100 : 0;
                      const color = sectorColors[index] || 'gray';
                      
                      return (
                        <div key={sector} className="text-center">
                          <div className={`text-2xl font-bold text-${color}-600`}>{sector}</div>
                          <div className="text-gray-600">{percentage.toFixed(1)}% of portfolio</div>
                          <div className={`text-sm ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}% return
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{data.count} stock{data.count > 1 ? 's' : ''}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {(() => {
                      // Calculate performance for all stocks with holdings
                      const stockPerformances = stocks
                        .filter(stock => {
                          const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                          const totalShares = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                          );
                          return totalShares > 0;
                        })
                        .map((stock) => {
                          const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                          const totalShares = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                          );
                          const avgPrice = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
                          ) / stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum, 0
                          );
                          const currentPrice = stockPrices[stock.symbol]?.price || avgPrice;
                          const pnlPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
                          const marketValue = currentPrice * totalShares;
                          const investedValue = avgPrice * totalShares;
                          const pnlAmount = marketValue - investedValue;

                          return {
                            ...stock,
                            avgPrice,
                            currentPrice,
                            pnlPercent,
                            pnlAmount,
                            marketValue,
                            totalShares
                          };
                        })
                        .sort((a, b) => b.pnlPercent - a.pnlPercent) // Sort by performance descending
                        .slice(0, 3); // Take top 3

                      if (stockPerformances.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            No stocks in portfolio. Add some stocks to see top performers.
                          </div>
                        );
                      }

                      return stockPerformances.map((stock, index) => (
                        <div key={stock.symbol} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{stock.symbol}</div>
                              <div className="text-sm text-gray-500">{stock.name}</div>
                              <div className="text-xs text-gray-400">{stock.totalShares} shares</div>
                            </div>
                          </div>
                          <div className={`text-right ${stock.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="font-semibold">{stock.pnlPercent >= 0 ? '+' : ''}{stock.pnlPercent.toFixed(2)}%</div>
                            <div className="text-sm">₹{stock.currentPrice.toFixed(2)}</div>
                            <div className={`text-xs ${stock.pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.pnlAmount >= 0 ? '+' : ''}₹{stock.pnlAmount.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Risk Metrics</h3>
                  <div className="space-y-4">
                    {(() => {
                      // Calculate dynamic risk metrics based on actual portfolio
                      const portfolioStocks = stocks.filter(stock => {
                        const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                        const totalShares = stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                        );
                        return totalShares > 0;
                      });

                      if (portfolioStocks.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            No stocks in portfolio. Add some stocks to see risk metrics.
                          </div>
                        );
                      }

                      // Calculate portfolio metrics
                      let totalValue = 0;
                      let totalPnL = 0;
                      const sectorCounts: Record<string, number> = {};
                      const stockValues: number[] = [];

                      portfolioStocks.forEach(stock => {
                        const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                        const totalShares = stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                        );
                        const avgPrice = stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
                        ) / stockTransactions.reduce((sum, t) => 
                          t.type === 'buy' ? sum + t.quantity : sum, 0
                        );
                        const currentPrice = stockPrices[stock.symbol]?.price || avgPrice;
                        const marketValue = currentPrice * totalShares;
                        const investedValue = avgPrice * totalShares;
                        
                        totalValue += marketValue;
                        totalPnL += (marketValue - investedValue);
                        stockValues.push(marketValue);

                        // Count sectors for diversification
                        const stockInfo = getStockBySymbol(stock.symbol);
                        const sector = stockInfo?.sector || 'Others';
                        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
                      });

                      // Calculate Value at Risk (simple 5% of portfolio value)
                      const valueAtRisk = totalValue * 0.05;

                      // Calculate portfolio concentration (Herfindahl Index)
                      const concentrationIndex = stockValues.reduce((sum, value) => {
                        const weight = value / totalValue;
                        return sum + (weight * weight);
                      }, 0);
                      
                      let concentrationLevel = 'Low';
                      if (concentrationIndex > 0.5) concentrationLevel = 'High';
                      else if (concentrationIndex > 0.25) concentrationLevel = 'Medium';

                      // Calculate diversification score based on number of stocks and sectors
                      const numStocks = portfolioStocks.length;
                      const numSectors = Object.keys(sectorCounts).length;
                      let diversificationScore = Math.min(10, (numStocks * 0.5) + (numSectors * 1.5));
                      diversificationScore = Math.max(1, diversificationScore);

                      // Simple correlation estimate based on sector diversity
                      const marketCorrelation = Math.max(0.3, 1 - (numSectors * 0.1));

                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Value at Risk (5%)</span>
                            <span className="font-semibold text-red-600">₹{valueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Portfolio Concentration</span>
                            <span className={`font-semibold ${
                              concentrationLevel === 'High' ? 'text-red-600' : 
                              concentrationLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {concentrationLevel}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Market Correlation</span>
                            <span className="font-semibold text-blue-600">{marketCorrelation.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Diversification Score</span>
                            <span className={`font-semibold ${
                              diversificationScore >= 7 ? 'text-green-600' : 
                              diversificationScore >= 4 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {diversificationScore.toFixed(1)}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Portfolio Size</span>
                            <span className="font-semibold text-gray-800">{numStocks} stocks, {numSectors} sectors</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
              </div>

              {/* Profile Settings */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="john.doe@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue="+91 98765 43210"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Investment Experience
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>Beginner (0-2 years)</option>
                      <option>Intermediate (2-5 years)</option>
                      <option selected>Advanced (5+ years)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Portfolio Preferences */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Portfolio Preferences</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Default Currency
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option selected>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Risk Tolerance
                    </label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                        Conservative
                      </button>
                      <button className="flex-1 py-3 px-4 rounded-lg font-semibold bg-indigo-600 text-white transition-colors">
                        Moderate
                      </button>
                      <button className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                        Aggressive
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Investment Goal
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>Wealth Preservation</option>
                      <option selected>Long-term Growth</option>
                      <option>Income Generation</option>
                      <option>Retirement Planning</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* API & Data Settings */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">API & Data Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Auto-refresh Stock Prices
                      </label>
                      <p className="text-sm text-gray-500">
                        Automatically update stock prices every 5 minutes to conserve API usage
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRefreshEnabled}
                        onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">API Usage Conservation</p>
                        <p className="text-xs text-yellow-700">
                          Auto-refresh is set to 5 minutes to prevent API quota exhaustion
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={fetchPricesForStocks}
                      disabled={isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Updating...' : 'Refresh Now'}
                    </button>
                  </div>
                  
                  {/* API Usage Tracker */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-blue-800">Daily API Usage</h4>
                      <span className="text-sm font-bold text-blue-900">
                        {apiCallCount} / {dailyApiLimit}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          apiCallCount / dailyApiLimit > 0.8 
                            ? 'bg-red-500' 
                            : apiCallCount / dailyApiLimit > 0.6 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((apiCallCount / dailyApiLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      {apiCallCount >= dailyApiLimit * 0.8 
                        ? '⚠️ Approaching daily limit' 
                        : apiCallCount >= dailyApiLimit * 0.6 
                        ? '⚡ Moderate usage' 
                        : '✅ Usage within limits'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Price Alerts</div>
                      <div className="text-sm text-gray-600">Get notified when stock prices change significantly</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={priceAlertsEnabled}
                        onChange={(e) => setPriceAlertsEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Portfolio Updates</div>
                      <div className="text-sm text-gray-600">Daily portfolio performance summaries</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={portfolioUpdatesEnabled}
                        onChange={(e) => setPortfolioUpdatesEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Market News</div>
                      <div className="text-sm text-gray-600">Breaking news and market updates</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={marketNewsEnabled}
                        onChange={(e) => setMarketNewsEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Market News Panel */}
              <MarketNewsPanel 
                isEnabled={marketNewsEnabled}
                onToggle={setMarketNewsEnabled}
              />

              {/* Security */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Security</h3>
                <div className="space-y-4">
                  <button className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="font-semibold text-gray-800">Change Password</div>
                    <div className="text-sm text-gray-600">Update your account password</div>
                  </button>
                  
                  <button className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="font-semibold text-gray-800">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-600">Add an extra layer of security</div>
                  </button>
                  
                  <button className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="font-semibold text-gray-800">Login History</div>
                    <div className="text-sm text-gray-600">View recent account activity</div>
                  </button>
                </div>
              </div>

              {/* Performance Testing */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Search Performance</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-800 mb-2">Database Statistics</div>
                    <div className="text-sm text-blue-700">
                      Total stocks: {getSearchPerformanceStats().totalStocks} | 
                      Cache size: {getSearchPerformanceStats().cacheStats.size}/{getSearchPerformanceStats().cacheStats.maxSize}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      console.log('🚀 Running search performance test...');
                      runFullPerformanceTest();
                    }}
                    className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <div className="font-semibold">Run Performance Test</div>
                    <div className="text-sm opacity-90">Test optimized search functions (check console)</div>
                  </button>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Performance test results will be displayed in the browser console (F12 → Console)
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addStock}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setSelectedStock(null);
        }}
        onAdd={addTransaction}
        stock={selectedStock}
      />
    </div>
  );
};

export default StockPortfolioApp;