const fetch = require('node-fetch');

// Test the exact symbols from the portfolio
const portfolioSymbols = [
  'NIFTYBETF',
  'BANKETFADD', 
  'NAM-INDIA'
];

async function debugSymbolConversion(symbol) {
  console.log(`\n🔍 Debugging symbol: ${symbol}`);
  
  // Simulate the toEODHDSymbol function logic
  const cleanSymbol = symbol.replace(/\.(NS|BO|NSE|BSE)$/, '');
  console.log(`   Clean symbol: ${cleanSymbol}`);
  
  const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'SQ', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BRK.A', 'BRK.B', 'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'DIS', 'CMCSA', 'VZ', 'T'];
  
  let eodhSymbol;
  if (usStocks.includes(cleanSymbol)) {
    eodhSymbol = `${cleanSymbol}.US`;
  } else {
    eodhSymbol = `${cleanSymbol}.NSE`;
  }
  
  console.log(`   EODHD symbol: ${eodhSymbol}`);
  
  // Test the API call
  try {
    console.log(`   Testing API call...`);
    const response = await fetch(`http://localhost:3001/api/stock/${eodhSymbol}`);
    
    if (!response.ok) {
      console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`   ✅ API Response:`, JSON.stringify(data, null, 2));
    
    // Check the price validation logic
    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`   ✅ Price validation: PASSED (${data.close})`);
    } else {
      console.log(`   ❌ Price validation: FAILED`);
      console.log(`   - data exists: ${!!data}`);
      console.log(`   - close is number: ${typeof data.close === 'number'}`);
      console.log(`   - close > 0: ${data.close > 0}`);
      console.log(`   - close value: ${data.close}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

async function runDebug() {
  console.log('🐛 ETF Price Fetching Debug');
  console.log('=' .repeat(50));
  
  for (const symbol of portfolioSymbols) {
    await debugSymbolConversion(symbol);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n📋 Summary:');
  console.log('- Check if symbols are being converted correctly');
  console.log('- Verify API responses contain valid price data');
  console.log('- Ensure price validation logic is working');
}

runDebug().catch(console.error);