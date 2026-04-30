const https = require('https');
https.get('https://symbol-search.tradingview.com/symbol_search/v3/?text=NIFTY&hl=1&exchange=NSE&lang=en&search_type=undefined&domain=production&sort_by_country=IN', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(json.symbols.slice(0, 5).map(s => s.symbol));
  });
});
