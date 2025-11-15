#!/usr/bin/env node

const fetch = require('node-fetch');

// Simulate the toEODHDSymbol function
const toEODHDSymbol = (symbol) => {
  if (symbol.includes('.')) {
    return symbol;
  }
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
    const price = await fetchEODHDPrice(eodhSymbol);
    
    if (price === null) {
      console.warn(`Failed to fetch real price for ${symbol}, would use mock data`);
      return null;
    }
    
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

// Simulate the updatePrices function from StockPortfolioApp.tsx
async function updatePrices(stocks) {
  console.log(`🔄 Starting price fetch for ${stocks.length} stocks:`, stocks.map(s => s.symbol));
  
  try {
    const pricePromises = stocks.map(async (stock) => {
      try {
        console.log(`📊 Fetching price for ${stock.symbol}...`);
        const priceData = await fetchStockPrice(stock.symbol);
        console.log(`✅ Price fetched for ${stock.symbol}:`, priceData);
        return { symbol: stock.symbol, priceData };
      } catch (error) {
        console.error(`❌ Failed to fetch price for ${stock.symbol}:`, error);
        return { symbol: stock.symbol, priceData: null };
      }
    });

    const results = await Promise.all(pricePromises);
    
    const newPrices = {};
    
    results.forEach(({ symbol, priceData }) => {
      if (priceData) {
        newPrices[symbol] = priceData;
      } else {
        console.log(`⚠️ No price data for ${symbol}`);
      }
    });

    console.log(`📈 Price update complete. Got prices for:`, Object.keys(newPrices));
    
    // Check if we got prices for all stocks
    const missingPrices = stocks.filter(stock => !newPrices[stock.symbol]);
    if (missingPrices.length > 0) {
      console.warn(`⚠️ Missing prices for:`, missingPrices.map(s => s.symbol));
    }
    
    return newPrices;
    
  } catch (error) {
    console.error('❌ Price fetch error:', error);
    return {};
  }
}

// Test with the actual ETF portfolio
async function testStateManagement() {
  console.log('🔍 Testing State Management Flow');
  console.log('=' .repeat(60));

  const stocks = [
    { symbol: 'NIFTYBETF', name: 'NIPPON INDIA ETF NIFTY BEES' },
    { symbol: 'BANKETFADD', name: 'BANKETFADD' },
    { symbol: 'NAM-INDIA', name: 'Nippon Life India Asset Management Limited' }
  ];
  
  const stockPrices = await updatePrices(stocks);
  
  console.log('\n📊 Final Stock Prices State:');
  console.log(JSON.stringify(stockPrices, null, 2));
  
  // Simulate the table rendering logic
  console.log('\n🖥️ Simulating Table Display:');
  stocks.forEach(stock => {
    const currentPrice = stockPrices[stock.symbol]?.price || 0;
    console.log(`${stock.symbol}: ₹${currentPrice.toFixed(2)}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 State Management Test Complete');
}

// Run the test
testStateManagement().catch(console.error);