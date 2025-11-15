#!/usr/bin/env node

const fetch = require('node-fetch');

// Test the exact same API call that the frontend makes
async function testFrontendAPICall() {
  console.log('🔍 Testing Frontend API Connection');
  console.log('=' .repeat(50));

  const testSymbols = ['RELIANCE.NSE', 'TCS.NSE', 'INFY.NSE'];
  
  for (const symbol of testSymbols) {
    console.log(`\n📊 Testing ${symbol}:`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`http://localhost:3001/api/stock/${symbol}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Raw Response:`, JSON.stringify(data, null, 2));
      
      // Check if data structure matches what frontend expects
      if (data && typeof data.close === 'number' && data.close > 0) {
        console.log(`✅ Valid price data: ${data.close}`);
        console.log(`✅ Source: ${data.source}`);
      } else {
        console.log(`❌ Invalid data structure - close: ${data?.close}, type: ${typeof data?.close}`);
      }
      
    } catch (error) {
      console.log(`❌ Fetch Error:`, error.message);
      if (error.name === 'AbortError') {
        console.log('   Request timed out after 10 seconds');
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Frontend API Test Complete');
}

// Run the test
testFrontendAPICall().catch(console.error);