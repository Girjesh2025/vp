import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = 'https://news.google.com/rss/search?q=indian+stock+market+OR+nifty+OR+sensex+when:2d&hl=en-IN&gl=IN&ceid=IN:en';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`Google News RSS failed: ${response.status}`);
    }

    const xml = await response.text();
    
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    let idCounter = 1;

    const TRUSTED_SOURCES = [
      'moneycontrol',
      'ndtv',
      'mint',
      'livemint',
      'economic times',
      'the economic times',
      'cnbc',
      'cnbctv18',
      'business standard',
      'reuters',
      'bloomberg',
      'financial express',
      'the hindu businessline'
    ];

    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
      const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/);
      
      if (titleMatch && linkMatch) {
        const source = sourceMatch ? sourceMatch[1] : 'News';
        const sourceLower = source.toLowerCase();

        const isTrusted = TRUSTED_SOURCES.some(trusted => sourceLower.includes(trusted));
        if (!isTrusted) continue;

        let title = titleMatch[1].replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
        if (title.endsWith(` - ${source}`)) {
           title = title.substring(0, title.length - source.length - 3);
        }

        const titleLower = title.toLowerCase();
        let category = 'market';
        if (titleLower.includes('rbi') || titleLower.includes('gdp') || titleLower.includes('inflation')) category = 'economy';
        else if (titleLower.includes('reliance') || titleLower.includes('tata') || titleLower.includes('hdfc')) category = 'stocks';
        
        let sentiment = 'neutral';
        if (titleLower.includes('jump') || titleLower.includes('surge') || titleLower.includes('high') || titleLower.includes('rally') || titleLower.includes('gain')) sentiment = 'positive';
        if (titleLower.includes('fall') || titleLower.includes('drop') || titleLower.includes('crash') || titleLower.includes('low') || titleLower.includes('loss')) sentiment = 'negative';

        items.push({
          id: idCounter.toString(),
          title: title,
          description: title,
          url: linkMatch[1],
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          source: source,
          category: category,
          sentiment: sentiment
        });
        idCounter++;
      }
    }

    res.json(items);
  } catch (error: any) {
    console.error('Error fetching market news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
