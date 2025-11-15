#!/usr/bin/env node

const fetch = require('node-fetch');

// Simulate the toEODHDSymbol function
const toEODHDSymbol = (symbol) => {
  // Handle symbols that already have exchange suffix
  if (symbol.includes('.')) {
    return symbol;
  }
  
  // Default to NSE for Indian stocks/ETFs
  return `${symbol}.NSE`;
};

// Simulate the fetchEODHDPrice function
async function fetchEODHDPrice(symbol) {
  try {
    console.log(`Fetching real-time price for ${symbol} via local proxy...`);
    
    const response = await fetch(`http://localhost:3001/api/stock/${symbol}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`Local proxy failed with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && typeof data.close === 'number' && data.close > 0) {
      console.log(`Successfully fetched price for ${symbol}: ${data.close} via local proxy`);
      return data.close;
    } else {
      console.log(`Invalid data structure from local proxy for ${symbol}:`, data);
      return null;
    }
    
  } catch (error) {
    console.log(`Local proxy failed for ${symbol}:`, error.message);
    return null;
  }
}

// Simulate the fetchStockPrice function
async function fetchStockPrice(symbol) {
  try {
    const eodhSymbol = toEODHDSymbol(symbol);
    console.log(`Converting ${symbol} to ${eodhSymbol}`);
    
    const price = await fetchEODHDPrice(eodhSymbol);
    
    if (price === null) {
      console.warn(`Failed to fetch real price for ${symbol}, would use mock data`);
      return null;
    }
    
    // Return simplified price data structure
    return {
      price: Number(price.toFixed(2)),
      change: 0,
      previousClose: price,
    };
  } catch (error) {
    console.warn(`Failed to fetch real price for ${symbol}:`, error.message);
    return null;
  }
}

// Test the exact frontend flow
async function testFrontendFlow() {
  console.log('🔍 Testing Exact Frontend Price Fetching Flow');
  console.log('=' .repeat(60));

  const etfSymbols = ['NIFTYBETF', 'BANKETFADD', 'NAM-INDIA'];
  
  for (const symbol of etfSymbols) {
    console.log(`\n📊 Testing ${symbol}:`);
    console.log('-'.repeat(40));
    
    const priceData = await fetchStockPrice(symbol);
    
    if (priceData) {
      console.log(`✅ Final Price Data:`, JSON.stringify(priceData, null, 2));
    } else {
      console.log(`❌ Failed to get price data for ${symbol}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Frontend Flow Test Complete');
}

// Run the test
testFrontendFlow().catch(console.error);