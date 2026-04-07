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

const determineSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const lower = text.toLowerCase();
  const positiveWords = ['surge', 'jump', 'gain', 'high', 'record', 'up', 'bull', 'rally', 'profit', 'soar', 'buy', 'growth', 'positive', 'boost'];
  const negativeWords = ['fall', 'drop', 'crash', 'down', 'bear', 'loss', 'plunge', 'sell', 'weak', 'slip', 'slump', 'negative', 'threat', 'warning'];
  
  let score = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) score++; });
  negativeWords.forEach(w => { if (lower.includes(w)) score--; });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

export const fetchMarketNews = async (category?: string): Promise<NewsItem[]> => {
  try {
    const rssFeeds = [
      { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'Economic Times' },
      { url: 'https://www.livemint.com/rss/markets', source: 'Live Mint' },
      { url: 'https://www.moneycontrol.com/rss/business.xml', source: 'Moneycontrol' },
      { url: 'https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml', source: 'CNBC TV18' }
    ];

    const fetchPromises = rssFeeds.map(async (feed) => {
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
        const data = await res.json();
        
        if (data.status === 'ok' && data.items) {
          return data.items.map((item: any, index: number): NewsItem => ({
            id: `${feed.source}-${index}-${Date.now()}`,
            title: item.title,
            description: item.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' || '', // strip HTML
            url: item.link,
            publishedAt: item.pubDate,
            source: feed.source,
            category: 'market',
            sentiment: determineSentiment(item.title)
          }));
        }
        return [];
      } catch (e) {
        console.warn(`Failed to fetch RSS for ${feed.source}`);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    let allNews = results.flat();

    // Sort by date descending (newest first)
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Fallback to mock data if the API calls completely failed (e.g. rate limits)
    if (allNews.length === 0) {
      allNews = mockNewsData;
    }

    if (category && category !== 'all') {
      allNews = allNews.filter(news => news.category === category);
    }
    
    return allNews;
    
  } catch (error) {
    console.error('Error fetching market news:', error);
    return mockNewsData;
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