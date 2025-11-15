#!/usr/bin/env node

const fetch = require('node-fetch');

// Test the frontend price fetching logic
async function testFrontendPriceFetching() {
  console.log('🔍 Testing Frontend Price Fetching Logic');
  console.log('=' .repeat(50));

  const etfSymbols = ['NIFTYBETF', 'BANKETFADD', 'NAM-INDIA'];
  
  for (const symbol of etfSymbols) {
    console.log(`\n📊 Testing ${symbol}:`);
    
    try {
      // Test the fetchStockPrice function endpoint (what the frontend calls)
      const response = await fetch(`http://localhost:3001/api/stock/${symbol}`);
      
      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Raw API Response:`, JSON.stringify(data, null, 2));
      
      // Simulate the frontend price validation logic
      if (data && typeof data.close === 'number' && data.close > 0) {
        const priceData = {
          price: data.close,
          change: data.change || 0,
          changePercent: data.change_p ? parseFloat(data.change_p.replace('%', '')) : 0,
          previousClose: data.previous_close || data.close,
          volume: data.volume || 0,
          timestamp: new Date().toISOString()
        };
        console.log(`✅ Processed Price Data:`, JSON.stringify(priceData, null, 2));
      } else {
        console.log(`❌ Invalid price data - close: ${data?.close}, type: ${typeof data?.close}`);
      }
      
    } catch (error) {
      console.log(`❌ Fetch Error:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Frontend Price Fetching Test Complete');
}

// Run the test
testFrontendPriceFetching().catch(console.error);