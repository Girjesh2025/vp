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

// Mock news data for demonstration (in production, use real news API)
const mockNewsData: NewsItem[] = [
  {
    id: '1',
    title: 'Indian Stock Market Hits New High Amid Strong Q3 Results',
    description: 'Sensex crosses 75,000 mark as IT and banking sectors show robust growth',
    url: '#',
    publishedAt: new Date().toISOString(),
    source: 'Economic Times',
    category: 'market',
    sentiment: 'positive'
  },
  {
    id: '2',
    title: 'RBI Maintains Repo Rate at 6.5% in Latest Policy Review',
    description: 'Central bank keeps interest rates unchanged, focuses on inflation control',
    url: '#',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: 'Business Standard',
    category: 'economy',
    sentiment: 'neutral'
  },
  {
    id: '3',
    title: 'Tech Stocks Rally as AI Adoption Accelerates in India',
    description: 'Major IT companies report strong demand for AI and cloud services',
    url: '#',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: 'Mint',
    category: 'stocks',
    sentiment: 'positive'
  },
  {
    id: '4',
    title: 'Oil Prices Impact: Energy Sector Faces Volatility',
    description: 'Rising crude oil prices affect energy and transportation stocks',
    url: '#',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: 'CNBC TV18',
    category: 'market',
    sentiment: 'negative'
  },
  {
    id: '5',
    title: 'Foreign Institutional Investors Show Renewed Interest in Indian Markets',
    description: 'FII inflows increase by 15% this quarter, boosting market sentiment',
    url: '#',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: 'Moneycontrol',
    category: 'market',
    sentiment: 'positive'
  }
];

export const fetchMarketNews = async (category?: string): Promise<NewsItem[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, replace with real API call:
    // const response = await fetch(`https://newsapi.org/v2/everything?q=indian+stock+market&apiKey=${API_KEY}`);
    // const data = await response.json();
    
    let filteredNews = mockNewsData;
    
    if (category) {
      filteredNews = mockNewsData.filter(news => news.category === category);
    }
    
    // Sort by published date (newest first)
    return filteredNews.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
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