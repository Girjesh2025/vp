require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkStocks() {
  const { data: portfolios } = await supabase.from('portfolios').select('*');
  const { data: stocks } = await supabase.from('stocks').select('*');
  console.log("Portfolios:", portfolios);
  console.log("Stocks:", stocks);
}

checkStocks();
