export default async function handler(req, res) {
  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&interval=1d&range=1d`;
    
    // Fetch directly from Yahoo — bypassing browser CORS
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Yahoo Finance API returned an error' });
    }

    const data = await response.json();

    // Allow CORS from any origin so the frontend can hit it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Yahoo API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
