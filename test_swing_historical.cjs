const fetch = require('node-fetch');

async function test() {
  const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];
  
  for (const sym of symbols) {
    const url = `http://localhost:3001/api/historical/${sym}?range=6mo&interval=1d`;
    const res = await fetch(url);
    const data = await res.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    console.log(`${sym}: ${closes.length} bars`);
  }
}
test();
