require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fix() {
  // Delete all HDFCBANK and TCS stocks to fulfill the user's original request
  // Need to get IDs first to delete transactions
  const { data: stocks } = await supabase.from('stocks').select('id').in('symbol', ['TCS', 'HDFCBANK']);
  
  if (stocks && stocks.length > 0) {
    const stockIds = stocks.map(s => s.id);
    
    // Delete transactions
    await supabase.from('transactions').delete().in('stock_id', stockIds);
    console.log("Deleted transactions for", stockIds.length, "stocks.");
    
    // Delete stocks
    await supabase.from('stocks').delete().in('id', stockIds);
    console.log("Deleted stocks:", stockIds.length);
  } else {
    console.log("No stocks found to delete.");
  }
}

fix();
