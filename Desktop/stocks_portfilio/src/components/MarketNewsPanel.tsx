import React, { useState, useEffect } from 'react';
import { NewsItem, fetchMarketNews, getLatestNews, isRecentNews } from '../utils/newsApi';

interface MarketNewsPanelProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const MarketNewsPanel: React.FC<MarketNewsPanelProps> = ({ isEnabled, onToggle }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isEnabled) {
      loadNews();
      // Auto-refresh news every 30 minutes
      const interval = setInterval(loadNews, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, selectedCategory]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const newsData = selectedCategory === 'all' 
        ? await getLatestNews(10)
        : await fetchMarketNews(selectedCategory);
      setNews(newsData);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '📰';
    }
  };

  const formatTimeAgo = (publishedAt: string) => {
    const now = new Date().getTime();
    const published = new Date(publishedAt).getTime();
    const diffInMinutes = Math.floor((now - published) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Market News</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isEnabled}
          >
            <option value="all">All News</option>
            <option value="market">Market</option>
            <option value="stocks">Stocks</option>
            <option value="economy">Economy</option>
            <option value="crypto">Crypto</option>
          </select>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Enable News</span>
          </label>
        </div>
      </div>

      {!isEnabled ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📰</div>
          <p>Market news is disabled</p>
          <p className="text-sm">Enable to see latest market updates</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading news...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No news available</p>
          <button
            onClick={loadNews}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh News
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {news.length} news items • Last updated: {new Date().toLocaleTimeString()}
            </p>
            <button
              onClick={loadNews}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {news.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                  isRecentNews(item.publishedAt) ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getSentimentIcon(item.sentiment)}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 uppercase">
                        {item.category}
                      </span>
                      {isRecentNews(item.publishedAt) && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <h4 className={`font-medium text-gray-900 mb-1 ${getSentimentColor(item.sentiment)}`}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.source}</span>
                      <span>{formatTimeAgo(item.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketNewsPanel;