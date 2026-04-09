import React, { useState } from 'react';
import { X, Plus, Briefcase, TrendingUp, Users, Building } from 'lucide-react';
import type { Portfolio } from '../lib/supabase';

interface PortfolioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  onSelectPortfolio: (portfolio: Portfolio) => void;
  onCreateNewPortfolio: (name: string) => void;
  stockName: string;
}

const PortfolioSelectorModal: React.FC<PortfolioSelectorModalProps> = ({
  isOpen,
  onClose,
  portfolios,
  onSelectPortfolio,
  onCreateNewPortfolio,
  stockName
}) => {
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateNewPortfolio(newPortfolioName.trim());
      setNewPortfolioName('');
      setShowCreateNew(false);
      onClose();
    } catch (error) {
      console.error('Error creating portfolio:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectPortfolio = (portfolio: Portfolio) => {
    onSelectPortfolio(portfolio);
    onClose();
  };

  const getPortfolioIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('growth') || lowerName.includes('aggressive')) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (lowerName.includes('retirement') || lowerName.includes('conservative')) {
      return <Building className="w-5 h-5 text-blue-600" />;
    } else if (lowerName.includes('family') || lowerName.includes('joint')) {
      return <Users className="w-5 h-5 text-purple-600" />;
    }
    return <Briefcase className="w-5 h-5 text-gray-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Add to Portfolio</h2>
              <p className="text-blue-100 text-sm mt-1">Choose where to add {stockName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!showCreateNew ? (
            <>
              {/* Existing Portfolios */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Select Portfolio
                </h3>
                
                {portfolios.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No portfolios found</p>
                    <button
                      onClick={() => setShowCreateNew(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Portfolio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {portfolios.map((portfolio) => (
                      <button
                        key={portfolio.id}
                        onClick={() => handleSelectPortfolio(portfolio)}
                        className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center space-x-3">
                          {getPortfolioIcon(portfolio.name)}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">
                              {portfolio.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Created {new Date(portfolio.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-5 h-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New Portfolio Button */}
              {portfolios.length > 0 && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center group"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      <span className="text-gray-600 group-hover:text-blue-700 font-medium">
                        Create New Portfolio
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Create New Portfolio Form */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setShowCreateNew(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ←
                </button>
                <h3 className="text-lg font-semibold text-gray-800">Create New Portfolio</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="e.g., Growth Portfolio, Retirement Fund"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateNew(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePortfolio}
                  disabled={!newPortfolioName.trim() || isCreating}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create & Add Stock'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioSelectorModal;