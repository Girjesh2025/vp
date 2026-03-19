import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Brain, Target, Shield, Clock, BarChart3, 
  AlertTriangle, RefreshCw, Activity, Zap, Eye, Star, Award, BarChart2,
  DollarSign, PieChart, LineChart, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  Info, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { aiTradingService, AIAnalysis, SwingTradingSignal } from '../utils/aiTradingService';

interface AITradingSuggestionsProps {
  portfolioSymbols?: string[];
}

const AITradingSuggestions: React.FC<AITradingSuggestionsProps> = ({ portfolioSymbols = [] }) => {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'aiScore' | 'confidence' | 'expectedReturn'>('aiScore');
  const [filterBy, setFilterBy] = useState<'all' | 'buy' | 'sell' | 'hold'>('all');

  const stocksToAnalyze = portfolioSymbols && portfolioSymbols.length > 0 ? portfolioSymbols : [];

  const analyzeStocks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (stocksToAnalyze.length === 0) {
        setAnalyses([]);
      } else {
        const results = await aiTradingService.analyzePortfolio(stocksToAnalyze);
        setAnalyses(results);
      }
    } catch (err) {
      setError('Failed to analyze stocks. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeStocks();
  }, [portfolioSymbols]);

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'WEAK_BUY':
        return <ArrowUp className="w-5 h-5 text-green-400" />;
      case 'STRONG_SELL':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'WEAK_SELL':
        return <ArrowDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'BUY':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'WEAK_BUY':
        return 'bg-green-25 border-green-100 text-green-600';
      case 'STRONG_SELL':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'SELL':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'WEAK_SELL':
        return 'bg-red-25 border-red-100 text-red-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-blue-600 bg-blue-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'VERY_LOW':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'VERY_HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'VERY_BULLISH':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'BULLISH':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'VERY_BEARISH':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'BEARISH':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <BarChart2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendStrengthColor = (strength: string) => {
    switch (strength) {
      case 'VERY_STRONG':
        return 'text-purple-700 bg-purple-100';
      case 'STRONG':
        return 'text-purple-600 bg-purple-50';
      case 'MODERATE':
        return 'text-blue-600 bg-blue-50';
      case 'WEAK':
        return 'text-gray-600 bg-gray-50';
      case 'VERY_WEAK':
        return 'text-gray-500 bg-gray-25';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(1)}Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(1)}L`;
    return `₹${num.toFixed(0)}`;
  };

  // Filter and sort analyses
  const filteredAnalyses = analyses.filter(analysis => {
    if (filterBy === 'all') return true;
    if (filterBy === 'buy') return analysis.signals.recommendation.includes('BUY');
    if (filterBy === 'sell') return analysis.signals.recommendation.includes('SELL');
    if (filterBy === 'hold') return analysis.signals.recommendation === 'HOLD';
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'aiScore':
        return b.aiScore - a.aiScore;
      case 'confidence':
        return b.signals.confidence - a.signals.confidence;
      case 'expectedReturn':
        return Math.abs(b.signals.expectedReturn) - Math.abs(a.signals.expectedReturn);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">AI Trading Suggestions</h2>
              <p className="text-purple-100 text-lg">Advanced AI-powered swing trading recommendations</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-purple-100">Analyzed Stocks</div>
              <div className="text-2xl font-bold">{analyses.length}</div>
            </div>
            <button
              onClick={analyzeStocks}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">{loading ? 'Analyzing...' : 'Refresh Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="aiScore">AI Score</option>
              <option value="confidence">Confidence</option>
              <option value="expectedReturn">Expected Return</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Signals</option>
              <option value="buy">Buy Signals</option>
              <option value="sell">Sell Signals</option>
              <option value="hold">Hold Signals</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>Real-time AI Analysis</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Analysis Failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-500 text-xs mt-2">The AI Trading feature requires real historical market data from Yahoo Finance. Please check your internet connection and try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Analysis Results */}
      {!loading && filteredAnalyses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.symbol}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => setSelectedStock(selectedStock === analysis.symbol ? null : analysis.symbol)}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900">{analysis.symbol}</h3>
                      {analysis.marketData.sector && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {analysis.marketData.sector}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysis.aiScore)}`}>
                      AI: {analysis.aiScore}
                    </div>
                    {selectedStock === analysis.symbol ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{formatPrice(analysis.currentPrice)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getSentimentIcon(analysis.marketSentiment)}
                      <span className="text-sm text-gray-600">{analysis.marketSentiment.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getRecommendationColor(analysis.signals.recommendation)}`}>
                      {getRecommendationIcon(analysis.signals.recommendation)}
                      <span className="font-semibold text-sm">
                        {analysis.signals.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {analysis.signals.confidence}% confidence
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Expected Return</div>
                    <div className={`text-lg font-bold ${analysis.signals.expectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(analysis.signals.expectedReturn)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Risk Level</div>
                    <div className={`text-sm font-medium px-2 py-1 rounded border ${getRiskColor(analysis.signals.riskLevel)}`}>
                      {analysis.signals.riskLevel.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedStock === analysis.symbol && (
                <div className="p-6 space-y-6 bg-gray-50">
                  {/* Technical Analysis */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                      Technical Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm text-gray-600">RSI</div>
                        <div className="text-lg font-bold">{analysis.signals.technicalIndicators.rsi.toFixed(1)}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${analysis.signals.technicalIndicators.rsi < 30 ? 'bg-green-500' : analysis.signals.technicalIndicators.rsi > 70 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${analysis.signals.technicalIndicators.rsi}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm text-gray-600">ADX (Trend)</div>
                        <div className="text-lg font-bold">{analysis.signals.technicalIndicators.adx.toFixed(1)}</div>
                        <div className={`text-xs px-2 py-1 rounded mt-1 ${getTrendStrengthColor(analysis.trendStrength)}`}>
                          {analysis.trendStrength.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Stochastic %K</div>
                        <div className="text-lg font-bold">{analysis.signals.technicalIndicators.stochastic.k.toFixed(1)}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Williams %R</div>
                        <div className="text-lg font-bold">{analysis.signals.technicalIndicators.williams.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Targets */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-green-600" />
                      Price Targets
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-800">Target Price</span>
                        <span className="text-lg font-bold text-green-600">{formatPrice(analysis.signals.targetPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium text-red-800">Stop Loss</span>
                        <span className="text-lg font-bold text-red-600">{formatPrice(analysis.signals.stopLoss)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">Risk/Reward Ratio</span>
                        <span className="text-lg font-bold text-blue-600">{analysis.signals.riskRewardRatio.toFixed(2)}:1</span>
                      </div>
                    </div>
                  </div>

                  {/* Market Data */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                      Market Data
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm text-gray-600">52W High</div>
                        <div className="text-lg font-bold">{formatPrice(analysis.marketData.week52High)}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-sm text-gray-600">52W Low</div>
                        <div className="text-lg font-bold">{formatPrice(analysis.marketData.week52Low)}</div>
                      </div>
                      {analysis.marketData.pe && (
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-sm text-gray-600">P/E Ratio</div>
                          <div className="text-lg font-bold">{analysis.marketData.pe.toFixed(1)}</div>
                        </div>
                      )}
                      {analysis.marketData.marketCap && (
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Market Cap</div>
                          <div className="text-lg font-bold">{formatLargeNumber(analysis.marketData.marketCap)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-purple-600" />
                      AI Analysis Reasoning
                    </h4>
                    <div className="bg-white p-4 rounded-lg">
                      <div className="space-y-2">
                        {analysis.signals.reasoning.map((reason, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Time Horizon & Additional Info */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Time Horizon:</span>
                      <span className="font-medium">{analysis.signals.timeHorizon}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Momentum:</span>
                      <span className="font-medium">{analysis.momentum.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredAnalyses.length === 0 && analyses.length > 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks match your filter</h3>
          <p className="text-gray-600">Try adjusting your filter criteria to see more results.</p>
        </div>
      )}

      {!loading && analyses.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks to analyze</h3>
          <p className="text-gray-600">Add stocks to your portfolio to see AI trading suggestions.</p>
        </div>
      )}

      {/* Footer Info */}
      {!loading && analyses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">AI Trading Suggestions Disclaimer</p>
              <p>
                These AI-generated suggestions are for educational purposes only and should not be considered as financial advice. 
                Always conduct your own research and consult with a qualified financial advisor before making investment decisions. 
                Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITradingSuggestions;