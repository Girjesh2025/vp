// Test script to verify stock price fetching functionality
// This simulates the exact process used by the React application

const fetch = require('node-fetch');

// Test stocks - mix of Indian and US stocks
const testStocks = [
  'RELIANCE.NSE',
  'TCS.NSE', 
  'INFY.NSE',
  'HDFC.NSE',
  'ICICIBANK.NSE',
  'AAPL.US',
  'GOOGL.US',
  'MSFT.US',
  'INVALID.NSE', // This should fail
  'NONEXISTENT.US' // This should also fail
];

async function testStockPrice(symbol) {
  try {
    console.log(`\n🔍 Testing ${symbol}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`http://localhost:3001/api/stock/${symbol}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`❌ ${symbol}: HTTP ${response.status} - ${response.statusText}`);
      const errorData = await response.json().catch(() => null);
      if (errorData) {
        console.log(`   Error: ${errorData.message || errorData.error}`);
      }
      return { symbol, success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`✅ ${symbol}: $${data.close} (Change: ${data.change || 0})`);
      return { 
        symbol, 
        success: true, 
        price: data.close, 
        change: data.change || 0,
        volume: data.volume || 0
      };
    } else {
      console.log(`⚠️ ${symbol}: Invalid data structure`);
      console.log(`   Data received:`, JSON.stringify(data, null, 2));
      return { symbol, success: false, error: 'Invalid data structure' };
    }
    
  } catch (error) {
    console.log(`❌ ${symbol}: ${error.message}`);
    return { symbol, success: false, error: error.message };
  }
}

async function runPriceFetchingTest() {
  console.log('🚀 Starting Stock Price Fetching Health Check');
  console.log('=' .repeat(50));
  
  // Test proxy server health first
  try {
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Proxy server is healthy:', healthData.status);
    } else {
      console.log('❌ Proxy server health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to proxy server:', error.message);
    console.log('   Make sure the proxy server is running on port 3001');
    return;
  }
  
  console.log('\n📊 Testing individual stock price fetching...');
  
  const results = [];
  
  // Test each stock sequentially to avoid rate limiting
  for (const symbol of testStocks) {
    const result = await testStockPrice(symbol);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📈 SUMMARY REPORT');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully fetched prices for:');
    successful.forEach(r => {
      console.log(`   ${r.symbol}: $${r.price} (${r.change >= 0 ? '+' : ''}${r.change})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to fetch prices for:');
    failed.forEach(r => {
      console.log(`   ${r.symbol}: ${r.error}`);
    });
  }
  
  // Health check conclusion
  console.log('\n🏥 HEALTH CHECK CONCLUSION');
  console.log('=' .repeat(50));
  
  if (successful.length >= testStocks.length * 0.8) {
    console.log('🟢 SYSTEM HEALTHY: Price fetching is working correctly');
    console.log('   Most stocks are returning valid price data');
  } else if (successful.length >= testStocks.length * 0.5) {
    console.log('🟡 SYSTEM PARTIALLY HEALTHY: Some issues detected');
    console.log('   Some stocks are failing to fetch prices');
  } else {
    console.log('🔴 SYSTEM UNHEALTHY: Major issues detected');
    console.log('   Most stocks are failing to fetch prices');
  }
  
  console.log('\n📋 RECOMMENDATIONS:');
  if (failed.length > 0) {
    console.log('• Check if failed symbols are valid stock symbols');
    console.log('• Verify EODHD API token is valid and has sufficient quota');
    console.log('• Check network connectivity to EODHD API');
  }
  if (successful.length > 0) {
    console.log('• Price fetching mechanism is working correctly');
    console.log('• API connection and proxy server are functional');
  }
}

// Run the test
runPriceFetchingTest().catch(console.error);