import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, Building2, TrendingUp } from 'lucide-react';
import type { Stock } from '../types';
import { searchStocksDynamic, getStockBySymbolAPI, type StockInfo } from '../utils/stockApi';
import { 
  searchStocks, 
  getStockBySymbol, 
  searchStocksFast, 
  searchStocksBySector, 
  getPopularStocks 
} from '../stockDatabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stock: Stock) => void;
}

const AddStockModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('');

  // Initialize with popular stocks
  useEffect(() => {
    if (isOpen && symbol.length === 0) {
      const popularStocks = getPopularStocks(12);
      setSearchResults(popularStocks);
    }
  }, [isOpen, symbol]);

  // Enhanced debounced search with multiple strategies
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        const popularStocks = getPopularStocks(12);
        setSearchResults(popularStocks);
        return;
      }

      setIsSearching(true);
      
      try {
        // Use fast search for quick autocomplete (first 3 characters)
        if (searchQuery.length <= 3) {
          const fastResults = searchStocksFast(searchQuery, 10);
          setSearchResults(fastResults);
          setIsSearching(false);
          return;
        }

        // For longer queries, try dynamic search first
        const dynamicResults = await searchStocksDynamic(searchQuery, 8);
        
        if (dynamicResults.length > 0) {
          setSearchResults(dynamicResults);
        } else {
          // Fallback to enhanced static search
          const staticResults = searchStocks(searchQuery, 10);
          setSearchResults(staticResults);
        }
      } catch (error) {
        console.warn('Dynamic search failed, using enhanced static search:', error);
        const results = searchStocks(searchQuery, 10);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Search by sector
  const handleSectorSearch = useCallback((sector: string) => {
    setSelectedSector(sector);
    const sectorResults = searchStocksBySector(sector, 15);
    setSearchResults(sectorResults);
    setShowSuggestions(true);
  }, []);

  // Search stocks when symbol changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(symbol);
    }, 200); // Reduced debounce for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [symbol, debouncedSearch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    if (!symbol.trim() || !companyName.trim()) {
      setError('Please select a valid stock from the suggestions');
      setIsValidating(false);
      return;
    }

    try {
      // First check if the entered stock matches any of the current search results
      const matchingResult = searchResults.find(
        stock => stock.symbol.toUpperCase() === symbol.trim().toUpperCase()
      );

      let stockInfo: StockInfo | null = null;

      if (matchingResult) {
        // Use the matching result from search
        stockInfo = matchingResult;
      } else {
        // Try dynamic search for the exact symbol
        const dynamicResults = await searchStocksDynamic(symbol.trim());
        const exactMatch = dynamicResults.find(
          stock => stock.symbol.toUpperCase() === symbol.trim().toUpperCase()
        );
        
        if (exactMatch) {
          stockInfo = exactMatch;
        } else {
          // Fallback to API and static database
          stockInfo = await getStockBySymbolAPI(symbol.trim().toUpperCase());
          if (!stockInfo) {
            stockInfo = getStockBySymbol(symbol.trim().toUpperCase()) || null;
          }
        }
      }
      
      if (!stockInfo) {
        setError('Invalid stock symbol. Please select from the suggestions.');
        setIsValidating(false);
        return;
      }

      const newStock: Stock = {
        symbol: stockInfo.symbol,
        name: stockInfo.name,
        displaySymbol: stockInfo.symbol,
        quantity: 0,
        avgPrice: 0
      };

      onAdd(newStock);
      setSymbol('');
      setCompanyName('');
      setShowSuggestions(false);
      setError('');
      setIsValidating(false);
      setSelectedSector('');
      onClose();
    } catch (error) {
      console.error('Error validating stock:', error);
      setError('Error validating stock. Please try again.');
      setIsValidating(false);
    }
  };

  const selectStock = (stock: StockInfo) => {
    setSymbol(stock.symbol);
    setCompanyName(stock.name);
    setShowSuggestions(false);
    setError('');
    setSelectedSector('');
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value);
    setCompanyName('');
    setError('');
    setShowSuggestions(true);
    setSelectedSector('');
  };

  const handleSymbolFocus = () => {
    setShowSuggestions(true);
  };

  const handleSymbolBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Popular sectors for quick filtering
  const popularSectors = [
    'Banking', 'Information Technology', 'Pharmaceuticals', 
    'Automobile', 'Oil & Gas', 'FMCG', 'Metals & Mining'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Stock</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Sector Filter Pills */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quick Filter by Sector
            </label>
            <div className="flex flex-wrap gap-2">
              {popularSectors.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSectorSearch(sector)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedSector === sector
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {sector}
                </button>
              ))}
              {selectedSector && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSector('');
                    const popularStocks = getPopularStocks(12);
                    setSearchResults(popularStocks);
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Symbol
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by symbol or company name..."
                  value={symbol}
                  onChange={handleSymbolChange}
                  onFocus={handleSymbolFocus}
                  onBlur={handleSymbolBlur}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                )}
                
                {/* Enhanced Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {/* Header */}
                    <div className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-50 border-b flex items-center gap-2">
                      {selectedSector ? (
                        <>
                          <Building2 size={16} />
                          {selectedSector} Stocks ({searchResults.length})
                        </>
                      ) : symbol.length === 0 ? (
                        <>
                          <TrendingUp size={16} />
                          Popular Stocks ({searchResults.length})
                        </>
                      ) : (
                        <>
                          <Search size={16} />
                          Search Results ({searchResults.length})
                        </>
                      )}
                    </div>
                    
                    {/* Results */}
                    {searchResults.map((stock: StockInfo) => (
                      <button
                        key={`${stock.symbol}-${stock.exchange}`}
                        type="button"
                        onClick={() => selectStock(stock)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 truncate">{stock.symbol}</div>
                            <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              stock.exchange === 'NSE' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {stock.exchange}
                            </span>
                            {stock.sector && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full truncate max-w-20">
                                {stock.sector}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g., Reliance Industries Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                readOnly
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isValidating || !symbol.trim() || !companyName.trim()}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;