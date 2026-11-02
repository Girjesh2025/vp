import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Edit2, Trash2, Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import type { Portfolio } from '../lib/supabase';

interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  onPortfolioChange: (portfolio: Portfolio) => void;
  onCreatePortfolio: (name: string) => void;
  onEditPortfolio: (portfolio: Portfolio, newName: string) => void;
  onDeletePortfolio: (portfolio: Portfolio) => void;
  portfolioStats?: {
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
  };
}

const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  portfolios,
  currentPortfolio,
  onPortfolioChange,
  onCreatePortfolio,
  onEditPortfolio,
  onDeletePortfolio,
  portfolioStats
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [editPortfolioName, setEditPortfolioName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when user clicks outside of it (e.g. sidebar buttons)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCreatePortfolio = async () => {
    if (newPortfolioName.trim()) {
      await onCreatePortfolio(newPortfolioName.trim());
      setNewPortfolioName('');
      setIsCreating(false);
      setIsDropdownOpen(false);
    }
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    if (editPortfolioName.trim()) {
      onEditPortfolio(portfolio, editPortfolioName.trim());
      setEditPortfolioName('');
      setIsEditing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Portfolio Display */}
      <div 
        className="bg-white/5 backdrop-blur-md rounded-xl shadow-sm border border-slate-800 p-4 cursor-pointer hover:bg-white/10 transition-all duration-200"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">
                {currentPortfolio?.name || 'Select Portfolio'}
              </h3>
              <p className="text-sm text-slate-400">
                {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          
          {portfolioStats && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(portfolioStats.totalValue)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-3 h-3 ${portfolioStats.totalGainLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${portfolioStats.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(portfolioStats.totalGainLoss)} ({formatPercentage(portfolioStats.totalGainLossPercent)})
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
          
          {!portfolioStats && (
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#172030] rounded-xl shadow-xl border border-slate-800 z-50 max-h-96 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            {/* Portfolio List */}
            {portfolios.map((portfolio) => (
              <div key={portfolio.id} className="group">
                {isEditing === portfolio.id ? (
                  <div className="flex items-center space-x-2 p-3 rounded-lg">
                    <input
                      type="text"
                      value={editPortfolioName}
                      onChange={(e) => setEditPortfolioName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditPortfolio(portfolio)}
                      onBlur={() => handleEditPortfolio(portfolio)}
                      className="flex-1 px-3 py-1 bg-slate-800/50 text-slate-200 border border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Portfolio name"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                      currentPortfolio?.id === portfolio.id 
                        ? 'bg-blue-500/10 border border-blue-500/20' 
                        : 'hover:bg-slate-800/50'
                    }`}
                    onClick={() => {
                      onPortfolioChange(portfolio);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-md ${
                        currentPortfolio?.id === portfolio.id 
                          ? 'bg-blue-500/20' 
                          : 'bg-slate-800'
                      }`}>
                        <Briefcase className={`w-4 h-4 ${
                          currentPortfolio?.id === portfolio.id 
                            ? 'text-blue-400' 
                            : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{portfolio.name}</p>
                        <p className="text-xs text-slate-500">
                          Created {new Date(portfolio.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(portfolio.id);
                          setEditPortfolioName(portfolio.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors duration-150"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {portfolios.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePortfolio(portfolio);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-150"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Create New Portfolio */}
            <div className="border-t border-slate-800/50 mt-2 pt-2">
              {isCreating ? (
                <div className="flex items-center space-x-2 p-3">
                  <input
                    type="text"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreatePortfolio()}
                    onBlur={() => {
                      if (!newPortfolioName.trim()) {
                        setIsCreating(false);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-800/50 text-slate-200 border border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500"
                    placeholder="Enter portfolio name"
                    autoFocus
                  />
                  <button
                    onClick={handleCreatePortfolio}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-150"
                  >
                    Create
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center space-x-3 p-3 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors duration-150"
                >
                  <div className="p-1.5 bg-slate-800 rounded-md">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Create New Portfolio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSelector;