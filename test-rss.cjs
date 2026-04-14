const fetch = require('node-fetch');

async function test() {
  const url = 'https://news.google.com/rss/search?q=indian+stock+market+OR+nifty+OR+sensex+when:2d&hl=en-IN&gl=IN&ceid=IN:en';
  const response = await fetch(url);
  const xml = await response.text();
  
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
    const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
    
    if (titleMatch) {
      items.push({
        title: titleMatch[1],
        date: pubDateMatch ? pubDateMatch[1] : 'Unknown'
      });
    }
  }
  console.log(items);
}

test();
