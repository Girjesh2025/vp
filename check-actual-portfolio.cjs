const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase configuration
const supabaseUrl = 'https://drpzizargycsebvrkscf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycHppemFyZ3ljc2VidnJrc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTU2OTEsImV4cCI6MjA3NTA5MTY5MX0.CODBGqklfZ570P--DlWnQNtbDE8_PgQoWsYoGexmDys';

// Demo user ID used in the app
const DEMO_USER_ID = 'demo-user-123';

async function checkActualPortfolio() {
  console.log('🔍 Checking Actual Portfolio Data from Supabase...\n');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user's portfolios
    console.log('📂 Fetching portfolios...');
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', DEMO_USER_ID);
    
    if (portfolioError) {
      console.log('❌ Error fetching portfolios:', portfolioError.message);
      return;
    }
    
    if (!portfolios || portfolios.length === 0) {
      console.log('📭 No portfolios found for user:', DEMO_USER_ID);
      return;
    }
    
    console.log(`✅ Found ${portfolios.length} portfolio(s)`);
    
    for (const portfolio of portfolios) {
      console.log(`\n📊 Portfolio: ${portfolio.name} (ID: ${portfolio.id})`);
      
      // Get stocks in this portfolio
      const { data: stocks, error: stocksError } = await supabase
        .from('stocks')
        .select('*')
        .eq('portfolio_id', portfolio.id);
      
      if (stocksError) {
        console.log('❌ Error fetching stocks:', stocksError.message);
        continue;
      }
      
      if (!stocks || stocks.length === 0) {
        console.log('📭 No stocks found in this portfolio');
        continue;
      }
      
      console.log(`\n📈 Found ${stocks.length} stocks in portfolio:`);
      console.log('Symbol'.padEnd(15) + 'Name'.padEnd(30) + 'Quantity'.padEnd(12) + 'Avg Price');
      console.log('-'.repeat(70));
      
      const stockSymbols = [];
      
      for (const stock of stocks) {
        console.log(
          stock.symbol.padEnd(15) + 
          stock.name.substring(0, 28).padEnd(30) + 
          stock.quantity.toString().padEnd(12) + 
          `₹${stock.average_price}`
        );
        stockSymbols.push(stock.symbol);
      }
      
      // Test price fetching for these actual stocks
      console.log('\n🔄 Testing price fetching for actual portfolio stocks...\n');
      
      let successCount = 0;
      let failureCount = 0;
      const results = [];
      
      for (const symbol of stockSymbols) {
        // Convert symbol to API format (add .NSE if not present)
        const apiSymbol = symbol.includes('.') ? symbol : `${symbol}.NSE`;
        
        try {
          const response = await fetch(`http://localhost:3001/api/stock/${apiSymbol}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.error) {
            console.log(`❌ ${apiSymbol}: ${data.error}`);
            failureCount++;
            results.push({ symbol: apiSymbol, success: false, error: data.error });
          } else {
            console.log(`✅ ${apiSymbol}: ₹${data.close} (${data.change_p}%)`);
            successCount++;
            results.push({ symbol: apiSymbol, success: true, price: data.close, change: data.change_p });
          }
        } catch (error) {
          console.log(`❌ ${apiSymbol}: ${error.message}`);
          failureCount++;
          results.push({ symbol: apiSymbol, success: false, error: error.message });
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('\n📊 ACTUAL PORTFOLIO PRICE FETCH SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Successful: ${successCount}/${stockSymbols.length}`);
      console.log(`❌ Failed: ${failureCount}/${stockSymbols.length}`);
      console.log(`📈 Success Rate: ${((successCount/stockSymbols.length) * 100).toFixed(1)}%`);
      
      if (failureCount > 0) {
        console.log('\n❌ FAILED STOCKS:');
        results.filter(r => !r.success).forEach(r => {
          console.log(`   ${r.symbol}: ${r.error}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkActualPortfolio().catch(console.error);
