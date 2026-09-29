import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://drpzizargycsebvrkscf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycHppemFyZ3ljc2VidnJrc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTU2OTEsImV4cCI6MjA3NTA5MTY5MX0.CODBGqklfZ570P--DlWnQNtbDE8_PgQoWsYoGexmDys';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'DELETE') {
    try {
      const { symbol, rawSymbol, stockId, portfolioId } = req.body || {};
      const sym = (symbol || rawSymbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];

      if (!stockId && !sym) {
        return res.status(400).json({ error: 'stockId or symbol is required' });
      }

      let query = supabase.from('stocks').select('id');
      if (stockId) {
        query = query.eq('id', stockId);
      } else if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId).or(`symbol.eq.${sym},symbol.eq.${rawSymbol || sym}`);
      } else {
        query = query.or(`symbol.eq.${sym},symbol.eq.${rawSymbol || sym}`);
      }

      const { data: matchingStocks, error: findError } = await query;
      if (findError) {
        return res.status(500).json({ error: findError.message });
      }

      if (!matchingStocks || matchingStocks.length === 0) {
        return res.status(200).json({ success: true, message: 'Stock not in DB, removed locally' });
      }

      const ids = matchingStocks.map(s => s.id);
      await supabase.from('transactions').delete().in('stock_id', ids);
      await supabase.from('stocks').delete().in('id', ids);

      return res.status(200).json({ success: true, message: `Deleted ${ids.length} rows` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
