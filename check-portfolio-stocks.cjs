const fetch = require('node-fetch');

// Function to test proxy server health
async function testProxyHealth() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Proxy server health:', data);
    return true;
  } catch (error) {
    console.log('❌ Proxy server health check failed:', error.message);
    return false;
  }
}

// Function to test price fetching for a stock
async function testStockPrice(symbol) {
  try {
    const response = await fetch(`http://localhost:3001/api/stock/${symbol}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      return { symbol, success: false, error: data.error };
    }
    
    return {
      symbol,
      success: true,
      price: data.close,
      change: data.change,
      changePercent: data.change_p
    };
  } catch (error) {
    return { symbol, success: false, error: error.message };
  }
}

// Common portfolio stocks to test
const portfolioStocks = [
  'RELIANCE.NSE',
  'TCS.NSE', 
  'HDFCBANK.NSE',
  'INFY.NSE',
  'ICICIBANK.NSE',
  'ITC.NSE',
  'SBIN.NSE',
  'BHARTIARTL.NSE',
  'KOTAKBANK.NSE',
  'LT.NSE',
  'ASIANPAINT.NSE',
  'MARUTI.NSE',
  'AXISBANK.NSE',
  'TITAN.NSE',
  'AAPL.US',
  'GOOGL.US',
  'MSFT.US',
  'TSLA.US',
  'AMZN.US'
];

async function runPortfolioHealthCheck() {
  console.log('🔍 Starting Portfolio Stock Price Health Check...\n');
  
  // Check proxy server health first
  const proxyHealthy = await testProxyHealth();
  if (!proxyHealthy) {
    console.log('❌ Cannot proceed - proxy server is not healthy');
    return;
  }
  
  console.log('\n📊 Testing price fetching for portfolio stocks...\n');
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const stock of portfolioStocks) {
    console.log(`Testing ${stock}...`);
    const result = await testStockPrice(stock);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${stock}: ₹${result.price} (${result.changePercent}%)`);
      successCount++;
    } else {
      console.log(`❌ ${stock}: ${result.error}`);
      failureCount++;
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📈 PORTFOLIO HEALTH CHECK SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount}/${portfolioStocks.length}`);
  console.log(`❌ Failed: ${failureCount}/${portfolioStocks.length}`);
  console.log(`📊 Success Rate: ${((successCount/portfolioStocks.length) * 100).toFixed(1)}%`);
  
  if (failureCount > 0) {
    console.log('\n❌ FAILED STOCKS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.symbol}: ${r.error}`);
    });
  }
  
  console.log('\n✅ SUCCESSFUL STOCKS:');
  results.filter(r => r.success).forEach(r => {
    console.log(`   ${r.symbol}: ₹${r.price} (${r.changePercent}%)`);
  });
}

runPortfolioHealthCheck().catch(console.error);
