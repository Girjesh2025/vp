import React, { useState } from 'react';
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

  const handleCreatePortfolio = () => {
    if (newPortfolioName.trim()) {
      onCreatePortfolio(newPortfolioName.trim());
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
    <div className="relative">
      {/* Current Portfolio Display */}
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {currentPortfolio?.name || 'Select Portfolio'}
              </h3>
              <p className="text-sm text-gray-500">
                {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          
          {portfolioStats && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(portfolioStats.totalValue)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-3 h-3 ${portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${portfolioStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(portfolioStats.totalGainLoss)} ({formatPercentage(portfolioStats.totalGainLossPercent)})
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
          
          {!portfolioStats && (
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
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
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Portfolio name"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                      currentPortfolio?.id === portfolio.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      onPortfolioChange(portfolio);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-md ${
                        currentPortfolio?.id === portfolio.id 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100'
                      }`}>
                        <Briefcase className={`w-4 h-4 ${
                          currentPortfolio?.id === portfolio.id 
                            ? 'text-blue-600' 
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{portfolio.name}</p>
                        <p className="text-xs text-gray-500">
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
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-150"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {portfolios.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePortfolio(portfolio);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
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
            <div className="border-t border-gray-100 mt-2 pt-2">
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full flex items-center space-x-3 p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                >
                  <div className="p-1.5 bg-gray-100 rounded-md">
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