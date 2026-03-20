export default async function handler(req, res) {
  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  try {
    const symbolArray = symbols.split(',');
    const chunkSize = 5;
    const fetchPromises = [];

    // Split symbols into chunks of 5
    for (let i = 0; i < symbolArray.length; i += chunkSize) {
      const chunk = symbolArray.slice(i, i + chunkSize).join(',');
      const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(chunk)}&interval=1d&range=1d`;
      
      const fetchPromise = fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        }
      }).then(r => {
        if (!r.ok) throw new Error(`Yahoo API returned ${r.status}`);
        return r.json();
      });

      fetchPromises.push(fetchPromise);
    }

    // Await all chunks from Yahoo in parallel
    const chunkResults = await Promise.all(fetchPromises);

    // Merge all objects into a single result
    const mergedData = {};
    for (const chunkData of chunkResults) {
      Object.assign(mergedData, chunkData);
    }

    // Allow CORS from any origin so the frontend can hit it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(mergedData);
  } catch (error) {
    console.error('Yahoo API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}

