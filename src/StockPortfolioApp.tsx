import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Settings, User, Wallet, Activity, Trash2, Edit, Briefcase, ArrowUpRight, ArrowDownRight, Layers, ChevronRight, Compass, Sparkles } from 'lucide-react';
import StockLogo from './components/StockLogo';
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
import ToolsDashboard from './components/ToolsDashboard';
import MarketAnalysis from './components/MarketAnalysis';
import MarketAnalysisTools from './components/MarketAnalysisTools';
import MarketEye from './components/MarketEye';
import SwingPlayer from './components/SwingPlayer';
import IntradayPlayer from './components/IntradayPlayer';
import GuruScan from './components/GuruScan';
import OptionsPlayer from './components/OptionsPlayer';
import OptionsHint   from './components/OptionsHint';
import OptionsDecode from './components/OptionsDecode';
import { trackPageView, startPresenceHeartbeat } from './utils/activityTracker';

import StockRecommendations from './components/StockRecommendations';
import HelpAndSupport from './components/HelpAndSupport';
import TradingPsychology from './components/TradingPsychology';
import PortfolioPage from './components/PortfolioPage';
import { MarketTicker } from './components/MarketTicker';
import { fetchStockPrice } from './utils/priceApi';
import { useAuth } from './contexts/AuthContext';
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

const clearLegacyBrokerStorage = () => {
  try {
    localStorage.removeItem('pp_data_source');
    localStorage.removeItem('pp_broker');
    localStorage.removeItem('pp_broker_pending');
    localStorage.removeItem('pp_broker_session');
    localStorage.removeItem('pp_broker_flow');
    localStorage.removeItem('pp_broker_user_id');
  } catch (e) {}
};



const StockPortfolioApp: React.FC = () => {
  const { user } = useAuth();
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

  const brokerStatus: { connected: boolean; broker?: string } | null = null;
  const brokerHoldings: any[] = [];
  const brokerHoldingsLoading = false;

  const [isLoading, setIsLoading] = useState(false);
  const [priceUpdateTime, setPriceUpdateTime] = useState<Date | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [dailyApiLimit] = useState(100);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [portfolioUpdatesEnabled, setPortfolioUpdatesEnabled] = useState(true);
  const [marketNewsEnabled, setMarketNewsEnabled] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => { const saved = localStorage.getItem("priceAlerts"); return saved ? JSON.parse(saved) : []; });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, stock: Stock | null}>({isOpen: false, stock: null});

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

  // Track live user activity, active page, and presence
  useEffect(() => {
    const tabMap: Record<string, string> = {
      dashboard: 'Dashboard',
      portfolio: 'Portfolio',
      holdings: 'Holdings',
      transactions: 'Transactions',
      analytics: 'Analytics',
      tools: 'Trading Tools',
      'market-eye': 'Market Eye',
      'swing-player': 'Swing Player',
      'intraday-player': 'Intraday Breakout',
      'guru-scan': 'Guru Scanner',
      'options-player': 'Options Player',
      'options-hint': 'Options Hint',
      'options-watch': 'Options Watch',
      'options-decode': 'Options Decode',
      'trading-tools': 'Calculators',
      'stock-recommendations': 'Recommendations',
      'trading-psychology': 'Psychology',
      alerts: 'Price Alerts',
      settings: 'Settings',
      help: 'Help Center'
    };
    const pageName = tabMap[activeTab] || activeTab;
    const userData = user ? {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
    } : null;

    if (userData && userData.email) {
      trackPageView(pageName, userData);
    }

    const cleanup = startPresenceHeartbeat(
      () => user ? { id: user.id, email: user.email || '', name: user.user_metadata?.full_name || user.email?.split('@')[0] || '' } : null,
      () => tabMap[activeTab] || activeTab
    );
    return cleanup;
  }, [activeTab, user]);

  useEffect(() => {
    if (user?.id) localStorage.setItem('pp_user_id', user.id);
  }, [user?.id]);

  useEffect(() => {
    clearLegacyBrokerStorage();
  }, []);

  useEffect(() => {

    if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab);
      // Optional: Clear location state so refreshing doesn't force this tab if user navigated away
      window.history.replaceState({}, document.title);
    }
  }, [(location.state as any)?.activeTab]);

  // Use a ref to always have the latest stocks list inside price-fetch without triggering re-renders
  const stocksRef = React.useRef<StockWithPrice[]>([]);
  const stockPricesRef = React.useRef<Record<string, PriceData>>({});
  
  useEffect(() => { localStorage.setItem("priceAlerts", JSON.stringify(priceAlerts)); }, [priceAlerts]);

  const memoPortfolioSymbols = useMemo(() => [...new Set(portfolioStocks.map(stock => stock.symbol))], [portfolioStocks]);



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
      const stockObj = deleteConfirmation.stock;
      const cleanSymbol = symbolToDelete.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];

      // Optimistically update local state immediately so user sees instant deletion
      setStocks(prev => prev.filter(s => {
        if (stockObj?.id && (s as any).id === stockObj.id) return false;
        const sClean = s.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
        return s.symbol.toUpperCase() !== symbolToDelete.toUpperCase() && sClean !== cleanSymbol;
      }));

      setTransactions(prev => prev.filter(t => {
        const tClean = t.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
        return t.symbol.toUpperCase() !== symbolToDelete.toUpperCase() && tClean !== cleanSymbol;
      }));

      setStockPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[symbolToDelete];
        delete newPrices[cleanSymbol];
        return newPrices;
      });

      setDeleteConfirmation({isOpen: false, stock: null});

      // Call hook with either full stock object (with id) or symbol
      await removeStockFromPortfolio(stockObj || symbolToDelete);
      console.log('Stock deleted successfully');
    } catch (error: any) {
      console.error('Error deleting stock:', error);
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



  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  const formatPct = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${Number(val || 0).toFixed(2)}%`;
  };

  const renderDashboard = () => {
    const marketLive = isMarketOpen();

    // Calculate movers & holding data for quick pulse
    const holdingsPulse = enrichedStocks.map(stock => {
      const priceObj = stockPrices[stock.symbol];
      const currentPrice = priceObj?.price || stock.avgPrice || 0;
      const prevClose = priceObj?.previousClose || currentPrice;
      const dayChange = priceObj?.change !== undefined ? priceObj.change : (currentPrice - prevClose);
      const dayChangePercent = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
      const marketVal = currentPrice * stock.quantity;
      const investedVal = stock.avgPrice * stock.quantity;
      const pnl = marketVal - investedVal;
      const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

      return {
        ...stock,
        currentPrice,
        dayChange,
        dayChangePercent,
        marketVal,
        investedVal,
        pnl,
        pnlPct
      };
    });

    const gainersCount = holdingsPulse.filter(h => h.pnl >= 0).length;
    const losersCount = holdingsPulse.filter(h => h.pnl < 0).length;
    const totalCount = holdingsPulse.length;
    const gainersPct = totalCount > 0 ? (gainersCount / totalCount) * 100 : 50;

    // Top performers sorted by today's performance
    const topMovers = [...holdingsPulse]
      .sort((a, b) => Math.abs(b.dayChangePercent) - Math.abs(a.dayChangePercent))
      .slice(0, 4);

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ──────────────────────────────────────────────────────────────────────────
            1. EXECUTIVE SUBHEADER & QUICK ACTIONS
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Compass className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight font-sans">
                  Market & Portfolio Intelligence
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/[0.04] border border-white/10 text-slate-300">
                  {currentPortfolio?.name || 'Primary Portfolio'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${marketLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[11px] font-mono text-slate-400">
                  {marketLive ? 'NSE/BSE Live Market Session (09:15 - 15:30 IST)' : 'NSE/BSE Market Closed • Showing Last Traded Prices'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('portfolio')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0c121e] hover:bg-[#131b26] border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group"
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
              <span>View Holdings</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-sm hover:shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock</span>
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            2. INSTITUTIONAL BENTO KPI CARDS (Matching Portfolio Benchmark)
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Portfolio Value */}
          <div 
            onClick={() => setActiveTab('portfolio')}
            className="group relative rounded-xl border border-slate-700/80 hover:border-sky-400/60 bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:shadow-[0_12px_28px_rgba(56,189,248,0.15)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer"
          >
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
          <div 
            onClick={() => setActiveTab('portfolio')}
            className={`group relative rounded-xl border ${
              stats.totalPnL >= 0 ? 'border-slate-700/80 hover:border-emerald-400/60 hover:shadow-[0_12px_28px_rgba(16,185,129,0.15)]' : 'border-slate-700/80 hover:border-rose-400/60 hover:shadow-[0_12px_28px_rgba(244,63,94,0.15)]'
            } bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer`}
          >
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
          <div 
            onClick={() => setActiveTab('portfolio')}
            className={`group relative rounded-xl border ${
              stats.todaysPnL >= 0 ? 'border-slate-700/80 hover:border-emerald-400/60 hover:shadow-[0_12px_28px_rgba(16,185,129,0.15)]' : 'border-slate-700/80 hover:border-rose-400/60 hover:shadow-[0_12px_28px_rgba(244,63,94,0.15)]'
            } bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer`}
          >
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
          <div 
            onClick={() => setActiveTab('portfolio')}
            className="group relative rounded-xl border border-slate-700/80 hover:border-amber-400/60 bg-gradient-to-b from-[#111827] via-[#0c121e] to-[#090d16] p-4 shadow-md hover:shadow-[0_12px_28px_rgba(245,158,11,0.15)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            {/* Top Accent Hairline */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                Portfolio Breadth
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                {totalCount} Stocks
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
                  style={{ width: `${gainersPct}%` }}
                />
                <div
                  className="bg-rose-400 h-full transition-all duration-500"
                  style={{ width: `${100 - gainersPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>{Math.round(gainersPct)}% Profitable</span>
                <span>{100 - Math.round(gainersPct)}% Drawdown</span>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            3. TOP MOVERS & LIVE PULSE
            ────────────────────────────────────────────────────────────────────────── */}
        {topMovers.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-[#0b101b]/60 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Portfolio Top Movers & Quick Pulse
                </h3>
              </div>
              <button 
                onClick={() => setActiveTab('portfolio')}
                className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>All {totalCount} Holdings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topMovers.map((m) => (
                <div
                  key={m.symbol}
                  onClick={() => {
                    setSelectedStock(m);
                    setIsTransactionModalOpen(true);
                  }}
                  className="group rounded-lg border border-slate-700/70 hover:border-sky-400/50 bg-gradient-to-b from-[#131b26] to-[#0c121e] p-3 shadow-sm hover:shadow-[0_8px_20px_rgba(56,189,248,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StockLogo symbol={m.symbol} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                          {m.symbol}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {m.name || m.symbol}
                        </div>
                      </div>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-0.5 ${
                      m.dayChangePercent >= 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {m.dayChangePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{formatPct(m.dayChangePercent)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500">LTP</div>
                      <div className="text-xs font-mono font-semibold text-slate-200">
                        {formatINR(m.currentPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500">{m.quantity} Qty</div>
                      <div className={`text-xs font-mono font-bold ${m.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.pnl >= 0 ? '+' : ''}{formatINR(m.pnl)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────────
            4. CHARTS: ALLOCATION & PERFORMANCE
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioChart stocks={enrichedStocks} priceData={stockPrices} />
          <PerformanceChart stocks={enrichedStocks} priceData={stockPrices} />
        </div>
      </div>
    );
  };

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
        brokerStatus={brokerStatus}
        onStockSelect={(stock) => {
          addStock(stock);
        }}
        onNotificationClick={() => {}}
        onSettingsClick={() => {}}
        onProfileClick={() => {}}
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
            <PortfolioPage
              stocks={portfolioStocks}
              transactions={portfolioTransactions}
              stockPrices={stockPrices}
              stats={stats}
              isMarketOpen={isMarketOpen()}
              onAddStock={() => setIsAddModalOpen(true)}
              onCreatePortfolio={() => {
                const name = window.prompt('Enter new portfolio name');
                if (!name) return;
                createPortfolio(name)
                  .then((p) => switchPortfolio(p))
                  .catch(() => alert('Failed to create portfolio.'));
              }}
              onBuyStock={(stock) => {
                setSelectedStock(stock);
                setTransactionModalType('buy');
                setIsTransactionModalOpen(true);
              }}
              onSellStock={(stock) => {
                setSelectedStock(stock);
                setTransactionModalType('sell');
                setIsTransactionModalOpen(true);
              }}
              onDeleteStock={(stock) => handleDeleteClick(stock)}
              popularStocks={popularStocks}
              popularStockPrices={popularStockPrices}
              onAddPopularStock={async (stock) => {
                const stockForModal = {
                  symbol: stock.symbol,
                  name: stock.name,
                  displaySymbol: stock.displaySymbol,
                  quantity: 0,
                  avgPrice: 0,
                };
                await addStock(stockForModal);
              }}
            />
          )}

          {activeTab === 'holdings' && (
            <div className="space-y-6 max-w-[1400px] mx-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-200">Current Holdings</h2>
              </div>
              
              <div className="bg-[#172030] backdrop-blur rounded-2xl p-6 shadow-xl">
                {brokerStatus?.connected && brokerStatus.broker === 'fyers' ? (
                  // REAL BROKER HOLDINGS VIEW
                  brokerHoldingsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                      <h3 className="text-xl font-bold text-white mb-2">Fetching Real Holdings</h3>
                      <p className="text-slate-400">Syncing with your Fyers account...</p>
                    </div>
                  ) : brokerHoldings.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-300 mb-2">No Holdings Found</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        Your Fyers broker account does not currently have any active holdings.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1e293b]">
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Stock Symbol</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Holding Type</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Quantity</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Cost Price</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">LTP</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-400">Unrealized P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brokerHoldings.map((holding, idx) => {
                            // Extract just the stock name from "NSE:HDFCBANK-EQ"
                            const cleanSymbol = holding.symbol ? holding.symbol.replace(/^.*:/, '').replace(/-EQ$/, '') : 'UNKNOWN';
                            const pnlPercent = holding.costPrice > 0 ? ((holding.ltp - holding.costPrice) / holding.costPrice) * 100 : 0;
                            
                            return (
                              <tr key={idx} className="border-b border-slate-800/60 hover:bg-[#0f1520]">
                                <td className="py-4 px-4">
                                  <div className="font-semibold text-slate-200">{cleanSymbol}</div>
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
                                    Broker Sync
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-slate-400 font-medium">{holding.holdingType || 'CNC'}</td>
                                <td className="py-4 px-4 text-slate-300 font-bold">{holding.quantity}</td>
                                <td className="py-4 px-4 text-slate-300">₹{(holding.costPrice || 0).toFixed(2)}</td>
                                <td className="py-4 px-4 text-slate-300">₹{(holding.ltp || 0).toFixed(2)}</td>
                                <td className="py-4 px-4">
                                  <div className={`${(holding.pl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {(holding.pl || 0) >= 0 ? '+' : '-'}₹{Math.abs(holding.pl || 0).toFixed(2)}
                                    <div className="text-sm">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (!stocks || stocks.length === 0) ? (
                  // PAPER TRADING HOLDINGS VIEW (Empty)
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Holdings Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Your portfolio is currently empty. Add stocks to your portfolio to track your holdings and performance.
                    </p>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className="mt-6 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                    >
                      Go to Portfolio
                    </button>
                  </div>
                ) : (
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
                          <th className="text-left py-3 px-4 font-semibold text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((stock) => {
                          const stockTransactions = transactions.filter(t => t.symbol === stock.symbol);
                          const totalShares = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum - t.quantity, 0
                          );
                          
                          // Hide stocks with 0 shares in the holdings view
                          if (totalShares === 0) return null;
                          
                          // Calculate average buy price
                          const avgPrice = stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + (t.price * t.quantity) : sum, 0
                          ) / (stockTransactions.reduce((sum, t) => 
                            t.type === 'buy' ? sum + t.quantity : sum, 0
                          ) || 1);

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
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setTransactionModalType('buy');
                                      setIsTransactionModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded font-semibold text-xs transition-colors"
                                  >
                                    Buy
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setTransactionModalType('sell');
                                      setIsTransactionModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded font-semibold text-xs transition-colors"
                                  >
                                    Sell
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
          {activeTab === 'tools' && (
            <MarketAnalysisTools />
          )}
          {activeTab === 'market-eye' && (
            <MarketEye />
          )}
          {activeTab === 'swing-player' && (
            <SwingPlayer />
          )}
          {activeTab === 'intraday-player' && (
            <IntradayPlayer />
          )}
          {activeTab === 'guru-scan' && (
            <GuruScan />
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
              onClick={() => deleteConfirmation.stock && deleteStock(deleteConfirmation.stock.symbol)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
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
