require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('stocks').select('*').eq('symbol', 'TCS');
  console.log("EXACT MATCH 'TCS':", data);
  
  const { data: data2 } = await supabase.from('stocks').select('*').ilike('symbol', '%TCS%');
  console.log("ILIKE MATCH '%TCS%':", data2);
}

check();
