// Market News API Integration
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category: 'market' | 'stocks' | 'economy' | 'crypto';
  sentiment: 'positive' | 'negative' | 'neutral';
}

export const fetchMarketNews = async (category?: string): Promise<NewsItem[]> => {
  try {
    const API_BASE = '';
    const response = await fetch(`${API_BASE}/api/market-news`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }
    
    const data: NewsItem[] = await response.json();
    
    let filteredNews = data;
    
    if (category) {
      filteredNews = data.filter(news => news.category === category);
    }
    
    // Sort by published date (newest first)
    return filteredNews.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
  } catch (error) {
    console.error('Error fetching market news:', error);
    return []; // never show made-up headlines; callers render an empty state
  }
};

export const getLatestNews = async (limit: number = 5): Promise<NewsItem[]> => {
  const allNews = await fetchMarketNews();
  return allNews.slice(0, limit);
};

export const getNewsByCategory = async (category: NewsItem['category']): Promise<NewsItem[]> => {
  return await fetchMarketNews(category);
};

// Format news for notifications
export const formatNewsForNotification = (news: NewsItem): string => {
  return `📰 ${news.title}\n${news.description}`;
};

// Check if news is recent (within last 2 hours)
export const isRecentNews = (publishedAt: string): boolean => {
  const newsTime = new Date(publishedAt).getTime();
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  return newsTime > twoHoursAgo;
};