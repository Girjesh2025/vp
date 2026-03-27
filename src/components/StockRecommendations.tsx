import React, { useState, useEffect } from 'react';
import { StockRecommendation, StockRecommendationService } from '../utils/stockRecommendationService';
import { usePortfolio } from '../hooks/usePortfolio';
import PortfolioSelectorModal from './PortfolioSelectorModal';
import PremiumStockCard from './PremiumStockCard';
import { 
  TrendingUp, 
  Target, 
  Shield, 
  Star,
  Filter,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

const StockRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<StockRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState<'aiScore' | 'expectedReturn' | 'riskLevel'>('aiScore');
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);
  
  const { portfolios, addStock, createPortfolio, switchPortfolio } = usePortfolio();

  const recommendationService = new StockRecommendationService();

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recommendations, searchTerm, selectedSector, selectedRisk, sortBy]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const recs = await recommendationService.getTopRecommendations(20);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recommendations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(rec => 
        rec.stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sector filter
    if (selectedSector !== 'all') {
      filtered = filtered.filter(rec => rec.stock.sector === selectedSector);
    }

    // Apply risk filter
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(rec => rec.stock.riskLevel.toLowerCase() === selectedRisk);
    }

    // Sort recommendations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'aiScore':
          return b.aiScore - a.aiScore;
        case 'expectedReturn':
          return b.expectedReturn - a.expectedReturn;
        case 'riskLevel':
          const riskOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
          return riskOrder[a.stock.riskLevel as keyof typeof riskOrder] - riskOrder[b.stock.riskLevel as keyof typeof riskOrder];
        default:
          return 0;
      }
    });

    setFilteredRecommendations(filtered);
  };

  const handleAddToPortfolio = (recommendation: StockRecommendation) => {
    setSelectedStock(recommendation);
    setShowPortfolioModal(true);
  };

  const handleSelectPortfolio = async (portfolio: any) => {
    if (!selectedStock) return;
    
    try {
      // First switch to the selected portfolio
      await switchPortfolio(portfolio);
      
      // Then add the stock to that portfolio
      await addStock({
        symbol: selectedStock.stock.symbol,
        name: selectedStock.stock.name,
        exchange: selectedStock.stock.exchange,
        quantity: 1,
        avgPrice: selectedStock.currentPrice
      });
      
      console.log(`✅ Successfully added ${selectedStock.stock.symbol} to portfolio: ${portfolio.name}`);
      // You could add a success notification here
    } catch (error) {
      console.error('Error adding stock to portfolio:', error);
      // You could add an error notification here
    }
  };

  const handleCreateNewPortfolio = async (name: string) => {
    if (!selectedStock) return;
    
    try {
      // Create the new portfolio
      const newPortfolio = await createPortfolio(name);
      
      // Switch to the new portfolio
      await switchPortfolio(newPortfolio);
      
      // Add the stock to the new portfolio
      await addStock({
        symbol: selectedStock.stock.symbol,
        name: selectedStock.stock.name,
        exchange: selectedStock.stock.exchange,
        quantity: 1,
        avgPrice: selectedStock.currentPrice
      });
      
      console.log(`✅ Successfully created portfolio "${name}" and added ${selectedStock.stock.symbol}`);
      // You could add a success notification here
    } catch (error) {
      console.error('Error creating portfolio and adding stock:', error);
      // You could add an error notification here
    }
  };

  const sectors = ['ALL', ...Array.from(new Set(recommendations.map(rec => rec.stock.sector)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Market Data</h2>
            <p className="text-gray-600">Our AI is researching the best stock recommendations for you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                Premium Stock Recommendations
              </h1>
              <p className="text-gray-600 mt-2">
                Powered by advanced AI analysis of NSE & BSE top stocks
              </p>
            </div>
            <button
              onClick={loadRecommendations}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Market Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Strong Buy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendations.filter(r => r.recommendation === 'STRONG_BUY').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Buy Signals</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {recommendations.filter(r => r.recommendation === 'BUY').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Low Risk</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendations.filter(r => r.stock.riskLevel === 'LOW').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Avg. AI Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(recommendations.reduce((sum, r) => sum + r.aiScore, 0) / (recommendations.length || 1))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center">
                <Filter className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 mr-3">Filter & Sort:</span>
              </div>
              
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1 w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sector Filter */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-3 py-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sectors</option>
                {sectors.filter(s => s !== 'ALL').map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>

              {/* Risk Filter */}
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-3 py-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'aiScore' | 'expectedReturn' | 'riskLevel')}
                className="px-3 py-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="aiScore">Sort by AI Score</option>
                <option value="expectedReturn">Sort by Expected Return</option>
                <option value="riskLevel">Sort by Risk Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredRecommendations.map((recommendation) => {
            
            // Format time and date
            const dateStr = recommendation.lastUpdated.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short'
            });
            const timeStr = recommendation.lastUpdated.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <PremiumStockCard
                key={recommendation.stock.symbol}
                type={recommendation.stock.investmentHorizon === 'SHORT_TERM' ? 'Short Swing' : 'Long Swing'}
                category={recommendation.stock.sector === 'Information Technology' ? 'Tech' : 'Equity Cash'}
                symbol={recommendation.stock.symbol}
                exchange={recommendation.stock.exchange}
                name={recommendation.stock.name}
                provider="StockWiz AI"
                isVerified={true}
                isNew={recommendation.aiScore >= 80}
                entryDate={`${dateStr}\n${timeStr}`}
                estimatedGains={recommendation.expectedReturn}
                status={recommendation.recommendation === 'STRONG_BUY' || recommendation.recommendation === 'BUY' ? 'In Buying Range' : 'Hold'}
                stopLoss={recommendation.stopLoss}
                target={recommendation.targetPrice}
                onTrade={() => handleAddToPortfolio(recommendation)}
              />
            );
          })}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>

      {/* Portfolio Selector Modal */}
      <PortfolioSelectorModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        portfolios={portfolios}
        onSelectPortfolio={handleSelectPortfolio}
        onCreateNewPortfolio={handleCreateNewPortfolio}
        stockName={selectedStock?.stock.name || ''}
      />
    </div>
  );
};

export default StockRecommendations;