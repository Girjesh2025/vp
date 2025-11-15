import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Settings, User, TrendingUp, Globe, Plus } from 'lucide-react';
import { searchStocksOptimized } from '../stockDatabase';
import type { Stock } from '../types';

// Check if Indian stock market is open
const isMarketOpen = (): boolean => {
  const now = new Date();
  
  // Convert to IST properly by adding 5.5 hours to UTC
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utcTime + (5.5 * 3600000)); // IST is UTC+5:30
  
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

interface ProfessionalHeaderProps {
  currentPortfolio?: any;
  portfolioStats?: {
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
  };
  isLoading?: boolean;
  lastUpdated?: Date | null;
  onStockSelect?: (stock: Stock) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  currentUser?: {
    name: string;
    email: string;
  };
}

const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  currentPortfolio,
  portfolioStats,
  isLoading,
  lastUpdated,
  onStockSelect,
  onNotificationClick,
  onSettingsClick,
  onProfileClick,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search input changes
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      try {
        const results = await searchStocksOptimized(query.trim(), 10);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Handle stock selection
  const handleStockSelect = (stock: Stock) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (onStockSelect) {
      onStockSelect(stock);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portfolio Pro</h1>
                <p className="text-xs text-gray-500">Investment Management</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Search stocks to add to portfolio..."
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="font-semibold text-gray-900">{stock.symbol}</div>
                            <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {stock.sector} • {stock.industry}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                  <div className="text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No stocks found for "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching with stock symbol or company name</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Market Status */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full ${isMarketOpen() 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isMarketOpen() 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${isMarketOpen() 
                ? 'text-green-700' 
                : 'text-red-700'
              }`}>
                {isMarketOpen() ? 'Market Open • LIVE' : 'Market Closed'}
              </span>
              <Globe className={`w-4 h-4 ${isMarketOpen() 
                ? 'text-green-600' 
                : 'text-red-600'
              }`} />
            </div>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={onProfileClick}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 text-right">{currentUser?.name || 'Demo User'}</p>
                    <p className="text-xs text-gray-500 text-right">{currentUser?.email || 'demo@example.com'}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;