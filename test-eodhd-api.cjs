const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const EODHD_API_KEY = process.env.VITE_EODHD_API_KEY;

console.log('🔍 Testing EODHD API Connection...');
console.log('API Key:', EODHD_API_KEY ? `Set (${EODHD_API_KEY.length} chars)` : 'Missing');

if (!EODHD_API_KEY) {
  console.log('❌ EODHD API key not found in .env.local');
  process.exit(1);
}

// Test stocks to check
const testStocks = [
  { symbol: 'AAPL.US', name: 'Apple Inc (US)' },
  { symbol: 'RELIANCE.NSE', name: 'Reliance Industries (NSE)' },
  { symbol: 'TCS.NSE', name: 'Tata Consultancy Services (NSE)' },
  { symbol: 'INFY.NSE', name: 'Infosys (NSE)' },
  { symbol: 'HDFCBANK.NSE', name: 'HDFC Bank (NSE)' }
];

async function testEODHDAPI(symbol, name) {
  try {
    console.log(`\n📊 Testing ${name} (${symbol})...`);
    
    const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${EODHD_API_KEY}&fmt=json`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Stock Portfolio App/1.0',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error response: ${errorText}`);
      return { symbol, success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`✅ Success: $${data.close}`);
      console.log(`   Change: ${data.change || 0}`);
      console.log(`   Volume: ${data.volume || 'N/A'}`);
      console.log(`   Timestamp: ${data.timestamp || 'N/A'}`);
      return { 
        symbol, 
        success: true, 
        price: data.close,
        change: data.change || 0,
        volume: data.volume || 0,
        timestamp: data.timestamp
      };
    } else {
      console.log(`⚠️ Invalid data structure received`);
      console.log(`   Data:`, JSON.stringify(data, null, 2));
      return { symbol, success: false, error: 'Invalid data structure' };
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`❌ Timeout (10s exceeded)`);
      return { symbol, success: false, error: 'Timeout' };
    } else {
      console.log(`❌ Error: ${error.message}`);
      return { symbol, success: false, error: error.message };
    }
  }
}

async function runEODHDTest() {
  console.log('\n🚀 Starting EODHD API Test...');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const stock of testStocks) {
    const result = await testEODHDAPI(stock.symbol, stock.name);
    results.push(result);
    
    // Small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📋 TEST SUMMARY');
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
  console.log('\n🏥 API HEALTH CHECK');
  console.log('=' .repeat(50));
  
  if (successful.length === results.length) {
    console.log('🟢 EODHD API: FULLY OPERATIONAL');
    console.log('   All test stocks returned valid data');
  } else if (successful.length >= results.length * 0.8) {
    console.log('🟡 EODHD API: MOSTLY OPERATIONAL');
    console.log('   Most stocks are working, some issues detected');
  } else if (successful.length > 0) {
    console.log('🟠 EODHD API: PARTIALLY OPERATIONAL');
    console.log('   Some stocks working, significant issues detected');
  } else {
    console.log('🔴 EODHD API: NOT OPERATIONAL');
    console.log('   No stocks returning valid data');
  }
  
  console.log('\n📊 RECOMMENDATIONS:');
  if (failed.length > 0) {
    console.log('• Check if failed symbols are valid EODHD symbols');
    console.log('• Verify API key has sufficient quota and permissions');
    console.log('• Check network connectivity to eodhd.com');
  }
  if (successful.length > 0) {
    console.log('• EODHD API connection is working');
    console.log('• API key is valid and has quota remaining');
  }
  
  // Test API quota/limits
  console.log('\n🔍 Testing API Quota...');
  try {
    const quotaUrl = `https://eodhd.com/api/user?api_token=${EODHD_API_KEY}`;
    const quotaResponse = await fetch(quotaUrl);
    
    if (quotaResponse.ok) {
      const quotaData = await quotaResponse.json();
      console.log('📈 API Quota Information:');
      console.log(`   Plan: ${quotaData.plan || 'Unknown'}`);
      console.log(`   Requests Today: ${quotaData.requests_today || 'Unknown'}`);
      console.log(`   Daily Limit: ${quotaData.daily_limit || 'Unknown'}`);
    } else {
      console.log('⚠️ Could not fetch quota information');
    }
  } catch (error) {
    console.log('⚠️ Error fetching quota:', error.message);
  }
}

// Run the test
runEODHDTest().catch(console.error);