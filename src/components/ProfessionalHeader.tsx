import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Settings, User, Globe, Plus, LogOut } from 'lucide-react';
import { searchStocksOptimized } from '../stockDatabase';
import { isMarketOpen } from '../utils/priceApi';
import { useAuth } from '../contexts/AuthContext';
import { trackStockSearch } from '../utils/activityTracker';
import type { Stock } from '../types';


interface ProfessionalHeaderProps {
  currentPortfolio?: any;
  portfolioStats?: {
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
  };
  isLoading?: boolean;
  brokerStatus?: { connected: boolean; broker?: string } | null;
  lastUpdated?: Date | null;
  onStockSelect?: (stock: any) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
}

const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  currentPortfolio,
  portfolioStats,
  isLoading,
  brokerStatus,
  lastUpdated,
  onStockSelect,
  onNotificationClick,
  onSettingsClick,
  onProfileClick
}) => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [marketOpen, setMarketOpen] = useState<boolean>(isMarketOpen());
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search input changes
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      try {
        const results = await searchStocksOptimized(query.trim(), 10);
        setSearchResults(results as any[]);
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
  const handleStockSelect = (stock: any) => {
    if (stock && stock.symbol) {
      trackStockSearch(
        stock.symbol, 
        user ? { id: user.id, email: user.email || '', name: user.user_metadata?.full_name } : undefined
      );
    }
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

  useEffect(() => {
    const update = () => setMarketOpen(isMarketOpen());
    update();
    const id = window.setInterval(update, 60 * 1000);
    return () => window.clearInterval(id);
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
            <style>{`
              @keyframes flowHorizontal {
                0% { background-position-x: 0%; }
                100% { background-position-x: 200%; }
              }
              .custom-animated-border {
                background: linear-gradient(90deg, #10b981, #3b82f6, #a855f7, #10b981, #3b82f6);
                background-size: 200% 100%;
                animation: flowHorizontal 3s linear infinite;
              }
            `}</style>
            <div className="relative group p-[2px] rounded-xl custom-animated-border">
              
              <div className="relative z-10 bg-[#0f1520] rounded-lg h-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-emerald-500/70 group-hover:text-emerald-500 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-[#0f1520] placeholder-slate-500 text-white focus:outline-none focus:ring-0 text-sm transition-all"
                  placeholder="Search stocks to add to portfolio..."
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#172030] border border-slate-700 rounded-lg shadow-xl shadow-black/40 max-h-96 overflow-y-auto custom-scrollbar">
                  {searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock)}
                      className="px-4 py-3 hover:bg-[#1e293b] cursor-pointer border-b border-slate-800/60 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="font-semibold text-slate-200">{stock.symbol}</div>
                            <div className="text-sm text-slate-400 truncate">{stock.name}</div>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {stock.sector} • {stock.industry}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#172030] border border-slate-700 rounded-lg shadow-xl p-4">
                  <div className="text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No stocks found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-600 mt-1">Try searching with stock symbol or company name</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Broker Status Indicator */}
            {brokerStatus?.connected && (
              <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                  {brokerStatus.broker === 'fyers' ? 'Fyers' : 'Zerodha'} Connected
                </span>
              </div>
            )}

            {/* Market Status */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border ${marketOpen 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${marketOpen 
                ? 'bg-emerald-500 animate-pulse' 
                : 'bg-red-500'
              }`}></div>
              <span className={`text-xs font-bold tracking-wider uppercase ${marketOpen 
                ? 'text-emerald-400' 
                : 'text-red-400'
              }`}>
                {marketOpen ? 'MARKET OPEN' : 'MARKET CLOSE'}
              </span>
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
                    <p className="text-sm font-medium text-slate-200 text-right">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 text-right truncate max-w-[120px]">
                      {user?.email}
                    </p>
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
