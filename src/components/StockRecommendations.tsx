import React, { useState, useEffect } from 'react';
import { StockRecommendation, StockRecommendationService } from '../utils/stockRecommendationService';
import { usePortfolio } from '../hooks/usePortfolio';
import PortfolioSelectorModal from './PortfolioSelectorModal';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Clock, 
  Star,
  Plus,
  Filter,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
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

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY': return 'text-green-600 bg-green-50';
      case 'BUY': return 'text-green-500 bg-green-50';
      case 'HOLD': return 'text-yellow-600 bg-yellow-50';
      case 'SELL': return 'text-red-500 bg-red-50';
      case 'STRONG_SELL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const sectors = ['ALL', ...Array.from(new Set(recommendations.map(rec => rec.stock.sector)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                AI Stock Recommendations
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
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Strong Buy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendations.filter(r => r.recommendation === 'STRONG_BUY').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Buy Signals</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {recommendations.filter(r => r.recommendation === 'BUY').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Low Risk</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendations.filter(r => r.stock.riskLevel === 'LOW').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Avg. AI Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(recommendations.reduce((sum, r) => sum + r.aiScore, 0) / recommendations.length)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center">
                <Filter className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700 mr-3">Filter & Sort:</span>
              </div>
              
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sector Filter */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sectors</option>
                <option value="Technology">Technology</option>
                <option value="Banking">Banking</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Energy">Energy</option>
                <option value="Consumer Goods">Consumer Goods</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Automotive">Automotive</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
              </select>

              {/* Risk Filter */}
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="aiScore">Sort by AI Score</option>
                <option value="expectedReturn">Sort by Expected Return</option>
                <option value="riskLevel">Sort by Risk Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => (
            <div
              key={recommendation.stock.symbol}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {recommendation.stock.symbol}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {recommendation.stock.name}
                    </p>
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {recommendation.stock.sector}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-lg font-bold text-gray-900">
                        {recommendation.aiScore}
                      </span>
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getRecommendationColor(recommendation.recommendation)}`}>
                      {recommendation.recommendation.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Current Price</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₹{recommendation.currentPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Target: ₹{recommendation.targetPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expected Return</p>
                    <p className={`text-lg font-bold ${recommendation.expectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {recommendation.expectedReturn >= 0 ? '+' : ''}{recommendation.expectedReturn}%
                    </p>
                  </div>
                </div>

                {/* Risk & Time Horizon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-gray-400 mr-1" />
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(recommendation.stock.riskLevel)}`}>
                      {recommendation.stock.riskLevel} RISK
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {recommendation.timeHorizon}
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              <div className="p-6">
                <button
                  onClick={() => setExpandedCard(expandedCard === recommendation.stock.symbol ? null : recommendation.stock.symbol)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {expandedCard === recommendation.stock.symbol ? 'Hide Details' : 'View Analysis'}
                    </span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {expandedCard === recommendation.stock.symbol && (
                  <div className="space-y-4 mb-4">
                    {/* Reasons */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        Key Reasons
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {recommendation.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                        Key Risks
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {recommendation.risks.map((risk, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technical Analysis */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Analysis</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Trend:</span>
                          <span className={`ml-1 font-medium ${
                            recommendation.technicalAnalysis.trend === 'BULLISH' ? 'text-green-600' :
                            recommendation.technicalAnalysis.trend === 'BEARISH' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {recommendation.technicalAnalysis.trend}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Momentum:</span>
                          <span className="ml-1 font-medium text-gray-700">
                            {recommendation.technicalAnalysis.momentum}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Portfolio Button */}
                <button
                  onClick={() => handleAddToPortfolio(recommendation)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Portfolio
                </button>
              </div>
            </div>
          ))}
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