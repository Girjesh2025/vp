import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Settings, User, Wallet, Activity, Trash2, Edit, Briefcase } from 'lucide-react';
import AddStockModal from './components/AddStockModal';
import TransactionModal from './components/TransactionModal';
import PortfolioChart from './components/PortfolioChart';
import PerformanceChart from './components/PerformanceChart';
import MarketNewsPanel from './components/MarketNewsPanel';
import PortfolioSelector from './components/PortfolioSelector';
import ProfessionalHeader from './components/ProfessionalHeader';
import ProfessionalSidebar from './components/ProfessionalSidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AlertsPage from './components/AlertsPage';
import AITradingSuggestions from './components/AITradingSuggestions';
import ToolsDashboard from './components/ToolsDashboard';
import MarketAnalysis from './components/MarketAnalysis';
import MarketAnalysisTools from './components/MarketAnalysisTools';
import MarketEye from './components/MarketEye';
import SwingPlayer from './components/SwingPlayer';
import OptionsPlayer from './components/OptionsPlayer';
import OptionsHint   from './components/OptionsHint';
import OptionsWatch  from './components/OptionsWatch';
import OptionsDecode from './components/OptionsDecode';
import StockRecommendations from './components/StockRecommendations';
import HelpAndSupport from './components/HelpAndSupport';
import TradingPsychology from './components/TradingPsychology';
import { MarketTicker } from './components/MarketTicker';
import { fetchStockPrice } from './utils/priceApi';
import { 
  getStockBySymbol,
  searchStocksOptimized, 
  searchStocksFuzzy,
  getSearchPerformanceStats,
  getPopularStocks
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
    portfolios,
    currentPortfolio,
    stocks: portfolioStocks, 
    transactions: portfolioTransactions, 
    loading: portfolioLoading, 
    error: portfolioError,
    addStock: addStockToPortfolio,
    addTransaction: addTransactionToPortfolio,
    removeStock: removeStockFromPortfolio,
    createPortfolio,
    editPortfolio,
    deletePortfolio,
    switchPortfolio
  } = usePortfolio();

  const [stocks, setStocks] = useState<StockWithPrice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, PriceData>>({});
  const [popularStocks, setPopularStocks] = useState<Stock[]>([]);
  const [popularStockPrices, setPopularStockPrices] = useState<Record<string, PriceData>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'buy' | 'sell'>('buy');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return (location.state as any)?.activeTab || localStorage.getItem('lastActiveTab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('lastActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {

    if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab);
      // Optional: Clear location state so refreshing doesn't force this tab if user navigated away
      window.history.replaceState({}, document.title);
    }
  }, [(location.state as any)?.activeTab]);

  const [isLoading, setIsLoading] = useState(false);
  const [priceUpdateTime, setPriceUpdateTime] = useState<Date | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [dailyApiLimit] = useState(100); // Assuming 100 calls per day for free tier

  // Use a ref to always have the latest stocks list inside price-fetch without triggering re-renders
  const stocksRef = React.useRef<StockWithPrice[]>([]);
  const stockPricesRef = React.useRef<Record<string, PriceData>>({});
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [portfolioUpdatesEnabled, setPortfolioUpdatesEnabled] = useState(true);
  const [marketNewsEnabled, setMarketNewsEnabled] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => { const saved = localStorage.getItem("priceAlerts"); return saved ? JSON.parse(saved) : []; });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => { localStorage.setItem("priceAlerts", JSON.stringify(priceAlerts)); }, [priceAlerts]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, stock: Stock | null}>({isOpen: false, stock: null});

  const memoPortfolioSymbols = useMemo(() => [...new Set(portfolioStocks.map(stock => stock.symbol))], [portfolioStocks]);

  // Fetch symbols from ALL portfolios for AI Trading (not just current one)
  const [allPortfolioSymbols, setAllPortfolioSymbols] = useState<string[]>([]);
  const allPortfoliosRef = useRef<string>('[]');
  useEffect(() => {
    if (!portfolios || portfolios.length === 0) { setAllPortfolioSymbols(memoPortfolioSymbols); return; }
    const portfolioIds = portfolios.map(p => p.id).filter(id => !id.startsWith('demo-portfolio'));
    if (portfolioIds.length === 0) { setAllPortfolioSymbols(memoPortfolioSymbols); return; }
    const key = JSON.stringify([...portfolioIds].sort());
    if (key === allPortfoliosRef.current) return;
    allPortfoliosRef.current = key;
    import('./lib/supabase').then(({ supabase }) => {
      supabase
        .from('stocks')
        .select('symbol')
        .in('portfolio_id', portfolioIds)
        .then(({ data }: { data: Array<{ symbol: string }> | null }) => {
          if (data && data.length > 0) {
            const symbols: string[] = [...new Set(data.map(s => s.symbol))];
            setAllPortfolioSymbols(symbols);
          } else {
            setAllPortfolioSymbols(memoPortfolioSymbols);
          }
        });
    });
  }, [portfolios, memoPortfolioSymbols]);



  // Keep refs in sync with state so price fetch closure always reads the latest data
  React.useEffect(() => { stocksRef.current = stocks; }, [stocks]);
  React.useEffect(() => { stockPricesRef.current = stockPrices; }, [stockPrices]);

  // Use a ref-based updater so the function never needs `stocks` or `stockPrices` as deps
  const updatePrices = React.useCallback(async (symbolsToFetch?: string[]) => {
    const currentPrices = stockPricesRef.current;
    
    // Fall back to mapping over stocksRef if no explicit symbols provided (e.g., from interval)
    const symbols = symbolsToFetch || stocksRef.current.map(s => s.symbol);

    if (symbols.length === 0) return;
    
    console.log(`🔄 Starting price fetch for ${symbols.length} stocks:`, symbols);
    setIsLoading(true);
    setDataError(null);
    
    try {
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const priceData = await fetchStockPrice(symbol);
          return { symbol: symbol, priceData };
        } catch (error) {
          console.error(`❌ Failed to fetch price for ${symbol}:`, error);
          return { symbol: symbol, priceData: null };
        }
      });

      const results = await Promise.all(pricePromises);
      
      setApiCallCount(prev => prev + symbols.length);
      
      const newPrices: Record<string, PriceData> = {};
      
      results.forEach(({ symbol, priceData }) => {
        if (priceData) {
          newPrices[symbol] = priceData;
        } else {
          // If price fetch failed, keep the last known price — no random fallback
          if (currentPrices[symbol]) {
            newPrices[symbol] = currentPrices[symbol];
            console.log(`⚠️ Keeping last known price for ${symbol}`);
          }
        }
      });

      setStockPrices(prev => ({ ...prev, ...newPrices }));
      setPriceUpdateTime(new Date());
      
      const missingPrices = symbols.filter(symbol => !newPrices[symbol]);
      if (missingPrices.length > 0) {
        setDataError(`Unable to fetch prices for: ${missingPrices.join(', ')}`);
      }
    } catch (error) {
      setDataError('Failed to update stock prices. Please try again.');
      console.error('❌ Price fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // ← empty deps: reads latest data from refs, never triggers re-render cycle

  const updatePopularStockPrices = async () => {
    if (popularStocks.length === 0) return;
    
    console.log(`🔄 Starting popular stock price fetch for ${popularStocks.length} stocks`);
    setIsLoading(true);
    
    try {
      const pricePromises = popularStocks.slice(0, 10).map(async (stock) => {
        try {
          const priceData = await fetchStockPrice(stock.symbol);
          return { symbol: stock.symbol, priceData };
        } catch (error) {
          console.error(`❌ Failed to fetch popular stock price for ${stock.symbol}:`, error);
          return { symbol: stock.symbol, priceData: null };
        }
      });

      const results = await Promise.all(pricePromises);
      
      const newPrices: Record<string, PriceData> = {};
      
      results.forEach(({ symbol, priceData }) => {
        if (priceData) {
          newPrices[symbol] = priceData;
        }
      });

      setPopularStockPrices(newPrices);
      console.log(`✅ Popular stock prices updated for ${Object.keys(newPrices).length} stocks`);
    } catch (error) {
      console.error('❌ Popular stock price fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializePopularStocks = () => {
    const popular = getPopularStocks().slice(0, 10).map(stockInfo => ({
      symbol: stockInfo.symbol,
      name: stockInfo.name,
      displaySymbol: `${stockInfo.symbol}-${stockInfo.exchange}`,
      quantity: 0,
      avgPrice: 0
    }));
    setPopularStocks(popular);
    console.log(`📈 Initialized ${popular.length} popular stocks`);
  };

  // Sync portfolio data with local state
  useEffect(() => {
    if (!portfolioLoading && portfolioStocks) {
      setStocks(portfolioStocks.map(stock => ({
        ...stock,
        currentPrice: stockPrices[stock.symbol]?.price,
        priceChange: stockPrices[stock.symbol]?.change,
        priceChangePercent: stockPrices[stock.symbol]?.change && stockPrices[stock.symbol]?.previousClose ? 
          (stockPrices[stock.symbol].change / stockPrices[stock.symbol].previousClose!) * 100 : undefined
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

  // Fetch prices when portfolio symbols change (stock added/removed) OR auto-refresh toggle changes.
  useEffect(() => {
    // Only run when there are actually stocks to fetch
    if (memoPortfolioSymbols.length === 0) return;

    // Pass symbols directly to avoid race condition with stocksRef population
    updatePrices(memoPortfolioSymbols);
    
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    if (autoRefreshEnabled) {
      const smartRefresh = () => {
        if (isMarketOpen()) {
           updatePrices(); // Inside interval, stocksRef is populated, so no arg needed
        } else {
          console.log('Market is closed, skipping price update to conserve API calls');
        }
      };
      
      const interval = setInterval(smartRefresh, 300000); // 5 minutes
      setRefreshInterval(interval);
      
      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    }
  }, [memoPortfolioSymbols, autoRefreshEnabled, updatePrices]); // ← `stocks` removed to prevent infinite loop

  // Check price alerts when stock prices update
  useEffect(() => {
    if (priceAlertsEnabled && priceAlerts.length > 0) {
      const currentPrices: Record<string, number> = {};
      Object.entries(stockPrices).forEach(([symbol, priceData]) => {
        currentPrices[symbol] = priceData.price;
      });
      let changed=false;const updated=priceAlerts.map(a=>{if(!a.isActive)return a;const cp=stockPrices[a.symbol]?.price;if(!cp)return a;const sa=(a.condition==="above"&&cp>=a.targetPrice)||(a.condition==="below"&&cp<=a.targetPrice);if(sa){changed=true;checkPriceAlerts([a],{[a.symbol]:cp});const sh=localStorage.getItem("alertHistory");const h=sh?JSON.parse(sh):[];h.unshift({...a,triggeredAt:new Date().toISOString(),currentPrice:cp});localStorage.setItem("alertHistory",JSON.stringify(h.slice(0,50)));return{...a,isActive:false};}return a;});if(changed)setPriceAlerts(updated);
    }
  }, [stockPrices, priceAlertsEnabled]);

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

  

  // Update popular stock prices when they are initialized
  useEffect(() => {
    if (popularStocks.length > 0) {
      updatePopularStockPrices();
    }
  }, [popularStocks]);

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
      <div className="min-h-screen bg-[#0f1520] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  // Show error state if portfolio failed to load
  if (portfolioError) {
    return (
      <div className="min-h-screen bg-[#0f1520] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Portfolio</h2>
          <p className="text-slate-400 mb-4">{portfolioError}</p>
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
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      alert(`Failed to add transaction. Error: ${error.message || 'Please try again.'}`);
    }
  };

  const deleteStock = async (symbolToDelete: string) => {
    try {
      console.log('Attempting to delete stock:', symbolToDelete);
      await removeStockFromPortfolio(symbolToDelete);
      console.log('Stock deleted successfully from backend');
      
      setStockPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[symbolToDelete];
        return newPrices;
      });
      setDeleteConfirmation({isOpen: false, stock: null});
    } catch (error: any) {
      console.error('Error deleting stock:', error);
      alert(`Failed to delete stock. Error: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeleteClick = (stock: Stock) => {
    setDeleteConfirmation({isOpen: true, stock});
  };

  const calculatePortfolioStats = () => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalStocks = 0;
    let todaysPnL = 0;
    let yesterdayValue = 0;

    stocks.forEach(stock => {
      const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
      const totalShares = stockTransactions.reduce((sum, t) => 
        t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
      );
      
      if (totalShares > 0) {
        totalStocks++;
        // Calculate total invested (buy side only)
        const avgPrice = stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
        ) / stockTransactions.reduce((sum, t) => 
          t.type === 'buy' ? sum + t.quantity : sum, 0
        );
        
        totalInvested += avgPrice * totalShares;
        
        let currentPrice = avgPrice; 
        let dayChange = 0; // The absolute change in ₹ for today
        
        if (stockPrices[stock.symbol]) {
          currentPrice = stockPrices[stock.symbol].price;
          // If we have previousClose, absolute change is (current - prevClose)
          if (stockPrices[stock.symbol].previousClose !== undefined) {
             dayChange = currentPrice - stockPrices[stock.symbol].previousClose!;
          } else {
             // Fallback to calculating absolute change from percentage if previousClose is not provided
             dayChange = (currentPrice * (stockPrices[stock.symbol].change || 0)) / 100;
          }
        }
        
        totalCurrent += currentPrice * totalShares;
        
        // Today's P&L comes strictly from the daily absolute change * number of shares
        todaysPnL += dayChange * totalShares;
        
        // We track yesterdayValue purely to calculate the global Today's P&L % 
        yesterdayValue += (currentPrice - dayChange) * totalShares;
      }
    });

    // Calculate total Today's P&L %
    const todaysPnLPercent = yesterdayValue > 0 ? (todaysPnL / yesterdayValue) * 100 : 0;

    // Calculate total P&L (current value vs invested amount)
    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalPnL,
      totalPnLPercent,
      totalStocks,
      todaysPnL,
      todaysPnLPercent,
      yesterdayValue
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
            <div className="text-2xl font-bold mt-1">{stats.totalPnL >= 0 ? '+' : '-'}₹{Math.abs(stats.totalPnL).toLocaleString()}</div>
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
        <div className="bg-[#172030] rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-200 mb-4">Portfolio Allocation</h3>
          <PortfolioChart stocks={enrichedStocks} priceData={stockPrices} />
        </div>
        
        <div className="bg-[#172030] rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-200 mb-4">Performance Trends</h3>
          <PerformanceChart stocks={enrichedStocks} priceData={stockPrices} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#0f1520] flex">
      {/* Error handling for portfolio loading */}
      {portfolioError && (
        <div className="fixed inset-0 bg-[#0f1520] flex items-center justify-center z-50">
          <div className="bg-[#172030] p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-slate-200 mb-4">Connection Error</h2>
              <p className="text-slate-400 mb-6">
                Unable to connect to the database. This might be due to:
              </p>
              <ul className="text-left text-slate-400 mb-6 space-y-2">
                <li>• Network connectivity issues</li>
                <li>• Database configuration problems</li>
                <li>• Missing environment variables</li>
              </ul>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for portfolio */}
      {portfolioLoading && (
        <div className="fixed inset-0 bg-[#0f1520] flex items-center justify-center z-50">
          <div className="bg-[#172030] p-8 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-slate-200">Loading Portfolio...</h2>
              <p className="text-slate-400 mt-2">Setting up your investment dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Professional Sidebar */}
      <ProfessionalSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        portfolioCount={portfolios.length}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Professional Header */}
        <ProfessionalHeader
          currentPortfolio={currentPortfolio}
          portfolioStats={{
            totalValue: stats.totalCurrent,
            totalGainLoss: stats.totalPnL,
            totalGainLossPercent: stats.totalPnLPercent
          }}
          isLoading={isLoading}
          lastUpdated={priceUpdateTime}
          onStockSelect={(stock) => {
            addStock(stock);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 bg-[#0f1520] min-h-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            {/* Global Market Ticker */}
            <MarketTicker />

            {/* Portfolio Selector - ONLY SHOW ON DASHBOARD, PORTFOLIO, AND ANALYTICS TABS */}
            {(activeTab === 'dashboard' || activeTab === 'portfolio' || activeTab === 'analytics') && (
              <div className="mb-8">
                <PortfolioSelector
                  portfolios={portfolios}
                  currentPortfolio={currentPortfolio}
                  onPortfolioChange={switchPortfolio}
                  onCreatePortfolio={createPortfolio}
                  onEditPortfolio={(portfolio, newName) => editPortfolio(portfolio.id, newName)}
                  onDeletePortfolio={(portfolio) => deletePortfolio(portfolio.id)}
                  portfolioStats={{
                    totalValue: stats.totalCurrent,
                    totalGainLoss: stats.totalPnL,
                    totalGainLossPercent: stats.totalPnLPercent
                  }}
                />
              </div>
            )}
          
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-200">Portfolio Overview</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const name = window.prompt('Enter new portfolio name');
                      if (!name) return;
                      createPortfolio(name)
                        .then((p) => switchPortfolio(p))
                        .catch(() => alert('Failed to create portfolio.'));
                    }}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Briefcase className="w-4 h-4" />
                    New Portfolio
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-900/200 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Stock
                  </button>
                </div>
              </div>

              {/* Market Status Indicator */}
              <div className={`p-4 rounded-lg border ${isMarketOpen() 
                ? 'bg-emerald-900/200 border-emerald-800/30' 
                : 'bg-[#0f1520] border-[#1e293b]'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isMarketOpen() 
                    ? 'bg-emerald-900/200 animate-pulse' 
                    : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${isMarketOpen() 
                    ? 'text-emerald-400' 
                    : 'text-slate-400'
                  }`}>
                    {isMarketOpen() 
                      ? 'Market Open - Live Prices' 
                      : 'Market Closed - Showing Last Close Prices'
                    }
                  </span>
                </div>
                {!isMarketOpen() && (
                  <p className="text-xs text-slate-500 mt-1">
                    Indian stock market is closed. P&L shows last trading day values.
                  </p>
                )}
              </div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="text-blue-100 text-sm font-medium">Total Portfolio Value</div>
                  <div className="text-3xl font-bold mt-1">₹{stats.totalCurrent.toLocaleString()}</div>
                  <div className="text-sm text-blue-100 mt-2">Current market value</div>
                </div>

                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
                  <div className="text-green-100 text-sm font-medium">Total Invested</div>
                  <div className="text-3xl font-bold mt-1">₹{stats.totalInvested.toLocaleString()}</div>
                  <div className="text-sm text-green-100 mt-2">Across {stats.totalStocks} stocks</div>
                </div>

                <div className={`bg-gradient-to-br ${stats.todaysPnL >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600'} rounded-2xl p-6 text-white`}>
                  <div className="text-white/80 text-sm font-medium">Today's P&L</div>
                  <div className="text-3xl font-bold mt-1">
                    {stats.todaysPnL >= 0 ? '+' : '-'}₹{Math.abs(stats.todaysPnL).toLocaleString()}
                  </div>
                  <div className="text-sm text-white/80 mt-2">{stats.todaysPnLPercent.toFixed(2)}%</div>
                </div>

                <div className={`bg-gradient-to-br ${stats.totalPnL >= 0 ? 'from-purple-400 to-purple-600' : 'from-orange-400 to-orange-600'} rounded-2xl p-6 text-white`}>
                  <div className="text-white/80 text-sm font-medium">Total P&L</div>
                  <div className="text-3xl font-bold mt-1">
                    {stats.totalPnL >= 0 ? '+' : '-'}₹{Math.abs(stats.totalPnL).toLocaleString()}
                  </div>
                  <div className="text-sm text-white/80 mt-2">{stats.totalPnLPercent.toFixed(2)}%</div>
                </div>
              </div>

              {/* Detailed Holdings Table */}
        <div className="bg-[#172030] backdrop-blur rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">All Holdings</h3>
                
                {(!portfolioStocks || portfolioStocks.length === 0) && popularStocks.length > 0 ? (
                  // Show popular stocks when portfolio is empty
                  <div>
                    <div className="mb-4 p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
                      <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-semibold">Popular Indian Stocks</span>
                      </div>
                      <p className="text-indigo-400 text-sm">
                        Your portfolio is empty. Here are some popular Indian stocks to get you started. Click the + button to add them to your portfolio.
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1e293b]">
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Stock</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Exchange</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Current Price</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Change</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {popularStocks.map((stock) => {
                            const priceData = popularStockPrices[stock.symbol];
                            const currentPrice = priceData?.price || 0;
                            const change = priceData?.change || 0;
                            const changePercent = priceData?.previousClose ? 
                              ((currentPrice - priceData.previousClose) / priceData.previousClose) * 100 : 0;

                            return (
                              <tr key={stock.symbol} className="border-b border-slate-800/60 hover:bg-[#0f1520]">
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-semibold text-slate-200">{stock.symbol}</div>
                                    <div className="text-sm text-slate-500">{stock.name}</div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-slate-300">{(stock.displaySymbol.split('-')[1] || 'NSE')}</td>
                                <td className="py-4 px-4 text-slate-300">
                                  {currentPrice > 0 ? `₹${currentPrice.toFixed(2)}` : 'Loading...'}
                                </td>
                                <td className="py-4 px-4">
                                  {priceData ? (
                                    <div className={`${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {change >= 0 ? '+' : '-'}₹{Math.abs(change).toFixed(2)}
                                      <div className="text-sm">({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600">Loading...</span>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={async () => {
                                      const stockForModal = {
                                        symbol: stock.symbol,
                                        name: stock.name,
                                        displaySymbol: stock.displaySymbol,
                                        quantity: 0,
                                        avgPrice: 0
                                      };
                                      await addStock(stockForModal);
                                    }}
                                    className="p-2 text-emerald-400 hover:bg-emerald-900/40 rounded-lg transition-colors"
                                    title="Add to portfolio"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                   // Show regular portfolio holdings
                   <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1e293b]">
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Stock</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Quantity</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Avg Price</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Current Price</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Market Value</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Unrealized P&L</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Booked P&L</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((stock) => {
                          const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                          const totalShares = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                          );
                          
                          // Calculate average buy price
                          const avgPrice = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
                          ) / (stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum, 0
                          ) || 1);

                          // Calculate realized P&L from sell transactions
                          const realizedPnl = stockTransactions.reduce((sum, t) => 
                            t.type === 'sell' ? sum + ((t.price - avgPrice) * t.quantity) : sum, 0
                          );

                          const currentPrice = stockPrices[stock.symbol]?.price || 0;
                          const marketValue = currentPrice * totalShares;
                          const investedValue = avgPrice * totalShares;
                          const pnl = marketValue - investedValue;
                          const pnlPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

                          return (
                            <tr key={stock.symbol} className="border-b border-slate-800/60 hover:bg-[#0f1520]">
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-semibold text-slate-200">{stock.symbol}</div>
                                  <div className="text-sm text-slate-500">{stock.name}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-300">{totalShares}</td>
                              <td className="py-4 px-4 text-slate-300">₹{avgPrice.toFixed(2)}</td>
                              <td className="py-4 px-4 text-slate-300">₹{currentPrice.toFixed(2)}</td>
                              <td className="py-4 px-4 text-slate-300">₹{marketValue.toLocaleString()}</td>
                              <td className="py-4 px-4">
                                <div className={`${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toFixed(2)}
                                  <div className="text-sm">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`${realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} font-semibold`}>
                                  {realizedPnl >= 0 ? '+' : '-'}₹{Math.abs(realizedPnl).toFixed(2)}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setTransactionModalType('buy');
                                      setIsTransactionModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded font-semibold text-xs transition-colors"
                                    title="Buy more shares"
                                  >
                                    Buy
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setTransactionModalType('sell');
                                      setIsTransactionModalOpen(true);
                                    }}
                                    disabled={totalShares === 0}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={totalShares === 0 ? "No shares to sell" : "Sell shares & book profit"}
                                  >
                                    Sell
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(stock)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/40 rounded transition-colors group"
                                    title="Delete stock from portfolio"
                                  >
                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-200">Transaction History</h2>
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
        <div className="bg-[#172030] backdrop-blur rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-slate-200 mb-6">All Transactions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1e293b]">
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Stock</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Type</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Quantity</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Price</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((transaction) => (
                              <tr key={transaction.id} className="border-b border-slate-800/60 hover:bg-[#0f1520]">
                                <td className="py-4 px-4 text-slate-300">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-semibold text-slate-200">{transaction.symbol}</div>
                                    <div className="text-sm text-slate-500">{transaction.name}</div>
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
                                <td className="py-4 px-4 text-slate-300">{transaction.quantity}</td>
                                <td className="py-4 px-4 text-slate-300">₹{transaction.price.toFixed(2)}</td>
                                <td className="py-4 px-4 text-slate-300">₹{transaction.total.toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {transactions.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No transactions found. Add some stocks to get started!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'analytics' && (
                <AnalyticsDashboard 
                  stocks={portfolioStocks}
                  transactions={portfolioTransactions}
                  priceData={stockPrices}
                  getStockInfo={(symbol) => getStockBySymbol(symbol) || null}
                />
              )}
          {activeTab === 'ai-trading' && (
            <AITradingSuggestions 
              portfolioSymbols={allPortfolioSymbols.length > 0 ? allPortfolioSymbols : memoPortfolioSymbols}
            />
          )}
          {activeTab === 'tools' && (
            <MarketAnalysisTools />
          )}
          {activeTab === 'market-eye' && (
            <MarketEye />
          )}
          {activeTab === 'swing-player' && (
            <SwingPlayer />
          )}
          {activeTab === 'options-player' && (
            <OptionsPlayer />
          )}
          {activeTab === 'options-hint' && (
            <OptionsHint />
          )}
          {activeTab === 'options-watch' && (
            <OptionsWatch />
          )}
          {activeTab === 'options-decode' && (
            <OptionsDecode />
          )}
          {activeTab === 'trading-tools' && (
            <ToolsDashboard />
          )}
              {activeTab === 'stock-recommendations' && <StockRecommendations />}
          {activeTab === 'trading-psychology' && (
            <TradingPsychology />
          )}
              {activeTab === 'alerts' && (
                <AlertsPage 
                  stocks={portfolioStocks}
                  priceData={stockPrices}
                  priceAlerts={priceAlerts}
                  setPriceAlerts={setPriceAlerts}
                  getStockInfo={getStockBySymbol}
                  notificationSettings={{
                    priceAlertsEnabled,
                    portfolioUpdatesEnabled,
                    marketNewsEnabled
                  }}
                  onNotificationSettingsChange={(settings) => {
                    setPriceAlertsEnabled(settings.priceAlertsEnabled);
                    setPortfolioUpdatesEnabled(settings.portfolioUpdatesEnabled);
                    setMarketNewsEnabled(settings.marketNewsEnabled);
                  }}
                />
              )}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
                  </div>

                  {/* Profile Settings */}
                  <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">Profile Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Trader Pro"
                          className="w-full px-4 py-3 bg-[#172030] border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue="trader@paperprofit.app"
                          className="w-full px-4 py-3 bg-[#172030] border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Preferences */}
                  <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">Trading Preferences</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">
                          Default Currency
                        </label>
                        <select className="w-full px-4 py-3 bg-[#172030] border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none appearance-none">
                          <option selected>INR (₹) - Indian Rupee</option>
                          <option>USD ($) - US Dollar</option>
                          <option>EUR (€) - Euro</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-3">
                          Risk Tolerance Profile
                        </label>
                        <div className="flex gap-3">
                          <button className="flex-1 py-3 px-4 rounded-xl font-semibold bg-[#172030] border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                            Conservative
                          </button>
                          <button className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-colors">
                            Moderate
                          </button>
                          <button className="flex-1 py-3 px-4 rounded-xl font-semibold bg-[#172030] border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                            Aggressive
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API & Data Settings */}
                  <div className="bg-[#131b26] border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">Data & API Settings</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Auto-refresh Market Data
                          </label>
                          <p className="text-sm text-slate-500">
                            Automatically update stock prices in the background to keep portfolio live
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoRefreshEnabled}
                            onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 gap-4">
                        <div className="flex items-start sm:items-center">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 mt-1.5 sm:mt-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                          <div>
                            <p className="text-sm font-bold text-amber-400">API Quota Protection Active</p>
                            <p className="text-xs text-amber-500/70 mt-0.5">
                              Auto-refresh is throttled to 5-minute intervals to prevent Yahoo Finance rate limits.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => updatePrices()}
                          disabled={isLoading}
                          className="px-5 py-2.5 bg-[#172030] border border-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                          {isLoading ? 'Fetching...' : 'Force Refresh'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'help' && (
                <HelpAndSupport />
              )}
          </div>
        </main>
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
      initialType={transactionModalType}
      currentQuantity={
        selectedStock 
          ? transactions
              .filter(t => t.symbol === selectedStock.symbol)
              .reduce((sum, t) => t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0)
          : 0
      }
    />

    {/* Delete Confirmation Dialog */}
    {deleteConfirmation.isOpen && deleteConfirmation.stock && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#172030] rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Delete Stock</h3>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-slate-300 mb-6">
            Are you sure you want to delete <strong>{deleteConfirmation.stock.symbol}</strong> ({deleteConfirmation.stock.name}) from your portfolio? 
            This will remove all associated transactions and data.
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteConfirmation({isOpen: false, stock: null})}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteStock(deleteConfirmation.stock!.symbol)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Delete Stock
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default StockPortfolioApp;