import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Plus, TrendingUp } from 'lucide-react';
import type { Stock } from '../types';
import { searchStocksOptimized, getPopularStocks, type StockInfo } from '../stockDatabase';
import StockLogo from './StockLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stock: Stock) => void;
}

const AddStockModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with popular stocks
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults(getPopularStocks(10));
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(getPopularStocks(10));
      return;
    }

    try {
      const results = searchStocksOptimized(query.trim(), 15);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, []);

  const handleSelect = (stockInfo: StockInfo) => {
    const newStock: Stock = {
      symbol: stockInfo.symbol,
      name: stockInfo.name,
      displaySymbol: `${stockInfo.symbol}-${stockInfo.exchange}`,
      quantity: 0,
      avgPrice: 0
    };
    onAdd(newStock);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#131b26] border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200">
        
        {/* Search Header */}
        <div className="relative border-b border-slate-800/80 bg-[#172030] shrink-0">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-blue-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-14 pr-12 py-5 bg-transparent border-none text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-0 transition-colors"
            placeholder="Search for stocks by symbol or company name..."
            autoComplete="off"
          />
          <button 
            onClick={onClose}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
          >
            <div className="bg-slate-800 p-1.5 rounded-md border border-slate-700">
              <X className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {!searchQuery && (
            <div className="px-4 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Popular Stocks
            </div>
          )}

          {searchResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                <Search className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-1">No stocks found</h3>
              <p className="text-slate-500 text-sm">Try searching with a different symbol or company name.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((stock) => (
                <button
                  key={`${stock.symbol}-${stock.exchange}`}
                  onClick={() => handleSelect(stock)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#1e293b] group transition-all text-left border border-transparent hover:border-slate-700/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <StockLogo symbol={stock.symbol} className="w-10 h-10 ring-1 ring-slate-700 group-hover:ring-slate-600 transition-all shadow-md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-[15px] tracking-wide">{stock.symbol}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          stock.exchange === 'NSE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {stock.exchange}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 truncate mt-0.5">{stock.name}</div>
                      {stock.sector && (
                        <div className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                          {stock.sector}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#0f1520] border border-slate-700 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-400 transition-all ml-4 shrink-0 shadow-sm">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;