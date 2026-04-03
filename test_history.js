const fetch = require('node-fetch');

async function test() {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/^CNXIT?range=1y&interval=1mo`;
  const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  
  const res = await fetch(proxiedUrl);
  const data = await res.json();
  const raw = JSON.parse(data.contents);
  
  console.log("Quotes length:", raw.chart.result[0].indicators.quote[0].close.length);
  console.log("Timestamps:", raw.chart.result[0].timestamp.map(t => new Date(t * 1000).toISOString()));
  console.log("Closes:", raw.chart.result[0].indicators.quote[0].close);
}
test();
