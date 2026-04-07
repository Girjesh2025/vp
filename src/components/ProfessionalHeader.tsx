import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Settings, User, Globe, Plus, LogOut } from 'lucide-react';
import { searchStocksOptimized } from '../stockDatabase';
import { isMarketOpen } from '../utils/priceApi';
import { useAuth } from '../contexts/AuthContext';
import type { Stock } from '../types';
import StockLogo from './StockLogo';


import type { StockInfo } from '../stockDatabase';

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
}

const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  currentPortfolio,
  portfolioStats,
  isLoading,
  lastUpdated,
  onStockSelect,
  onNotificationClick,
  onSettingsClick,
  onProfileClick
}) => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
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
  const handleStockSelect = (stockInfo: StockInfo) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (onStockSelect) {
      const newStock: Stock = {
        symbol: stockInfo.symbol,
        name: stockInfo.name,
        displaySymbol: `${stockInfo.symbol}-${stockInfo.exchange}`,
        quantity: 0,
        avgPrice: 0
      };
      onStockSelect(newStock);
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
    <header className="bg-[#131b26] border-b border-[#1e293b] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Removed */}
          <div className="flex items-center space-x-4">
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8" ref={searchRef}>
            <div className="relative">
              {/* Aurora Search Input */}
              <div className="relative w-full rounded-full overflow-hidden p-[3px] shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] transition-shadow duration-500 group">
                
                {/* The Rotating Conic Gradient Background */}
                <div className="absolute top-1/2 left-1/2 w-[200%] h-[1000%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_300deg,#60a5fa_360deg)] z-0 opacity-100" />
                <div className="absolute top-1/2 left-1/2 w-[200%] h-[1000%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_180deg,transparent_0_300deg,#a78bfa_360deg)] z-0 opacity-100" />
                
                {/* Extra blur layer for glowing effect */}
                <div className="absolute top-1/2 left-1/2 w-[200%] h-[1000%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_300deg,#3b82f6_360deg)] z-0 opacity-100 blur-sm" />
                <div className="absolute top-1/2 left-1/2 w-[200%] h-[1000%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_180deg,transparent_0_300deg,#8b5cf6_360deg)] z-0 opacity-100 blur-sm" />

                {/* Inner Solid Background that masks the middle, leaving only the border visible */}
                <div className="relative flex items-center bg-[#0f1520] rounded-full h-full w-full overflow-hidden z-10">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                    <Search className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="block w-full pl-11 pr-4 py-2.5 bg-transparent border-none rounded-full leading-5 placeholder-slate-500 text-white focus:outline-none focus:ring-0 text-sm transition-all relative z-20"
                    placeholder="Search for stocks and more..."
                  />
                </div>
              </div>
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-3 bg-[#172030] border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 max-h-96 overflow-y-auto custom-scrollbar">
                  {searchResults.map((stock) => (
                    <div
                      key={`${stock.symbol}-${stock.exchange}`}
                      onClick={() => handleStockSelect(stock)}
                      className="px-4 py-3 hover:bg-[#1e293b] cursor-pointer border-b border-slate-800/60 last:border-b-0 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <StockLogo symbol={stock.symbol} className="w-10 h-10 ring-2 ring-slate-800/50 group-hover:ring-slate-700 transition-all" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-200 text-sm">{stock.symbol}</span>
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${
                                stock.exchange === 'NSE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {stock.exchange}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">{stock.name}</div>
                            {stock.sector && (
                              <div className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
                                {stock.sector}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors ml-4 shrink-0">
                          <Plus className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="absolute z-50 w-full mt-3 bg-[#172030] border border-slate-700 rounded-2xl shadow-2xl p-6">
                  <div className="text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No stocks found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching with stock symbol or company name</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Market Status */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border ${isMarketOpen() 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isMarketOpen() 
                ? 'bg-emerald-500 animate-pulse' 
                : 'bg-red-500'
              }`}></div>
              <span className={`text-xs font-bold tracking-wider uppercase ${isMarketOpen() 
                ? 'text-emerald-400' 
                : 'text-red-400'
              }`}>
                {isMarketOpen() ? 'Market Open • LIVE' : 'Market Closed'}
              </span>
              <Globe className={`w-3.5 h-3.5 ${isMarketOpen() 
                ? 'text-emerald-500/70' 
                : 'text-red-500/70'
              }`} />
            </div>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors duration-200"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#131b26]"></span>
            </button>

            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors duration-200"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile & Sign Out */}
            <div className="relative group flex items-center bg-[#0f1520] rounded-lg p-1 pr-2 border border-[#1e293b]">
               <button
                onClick={onProfileClick}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#1e293b] transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-slate-200 text-right">{user?.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 text-right truncate max-w-[120px]">{user?.email}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              </button>
              
              <div className="h-6 w-px bg-slate-700/50 mx-1"></div>
              
              <button
                onClick={signOut}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors duration-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;