const fetch = require('node-fetch');

// Simulate the toEODHDSymbol function
function toEODHDSymbol(symbol) {
  if (symbol.includes('.')) return symbol;
  return `${symbol}.NSE`;
}

// Simulate fetchEODHDPrice function
async function fetchEODHDPrice(symbol) {
  try {
    const response = await fetch(`http://localhost:3001/api/stock/${symbol}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Raw data for ${symbol}:`, data);
    
    if (!data || typeof data.close !== 'number') {
      throw new Error('Invalid price data received');
    }

    return {
      price: data.close,
      change: data.change || 0,
      changePercent: data.change_p || 0,
      previousClose: data.previousClose || data.close
    };
  } catch (error) {
    console.error(`Error in fetchEODHDPrice for ${symbol}:`, error);
    throw error;
  }
}

// Simulate fetchStockPrice function
async function fetchStockPrice(symbol) {
  try {
    const eodhSymbol = toEODHDSymbol(symbol);
    console.log(`Converting ${symbol} to ${eodhSymbol}`);
    return await fetchEODHDPrice(eodhSymbol);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

async function testSpecificETFs() {
  const symbols = ['BANKETFADD', 'NAM-INDIA'];
  
  for (const symbol of symbols) {
    try {
      console.log(`\n=== Testing ${symbol} ===`);
      const result = await fetchStockPrice(symbol);
      console.log(`Final result for ${symbol}:`, result);
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error.message);
    }
  }
}

testSpecificETFs();