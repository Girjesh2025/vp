import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://drpzizargycsebvrkscf.supabase.co'
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycHppemFyZ3ljc2VidnJrc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTU2OTEsImV4cCI6MjA3NTA5MTY5MX0.CODBGqklfZ570P--DlWnQNtbDE8_PgQoWsYoGexmDys'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl = (rawUrl.startsWith('http') && !rawUrl.includes('your_supabase')) ? rawUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (rawKey && !rawKey.includes('your_supabase')) ? rawKey : DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Portfolio interface
export interface Portfolio {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

// Stock interface
export interface Stock {
  id: string
  portfolio_id: string
  symbol: string
  name: string
  exchange: string
  quantity: number
  average_price: number
  created_at: string
  updated_at: string
}

// Transaction interface
export interface Transaction {
  id: string
  stock_id: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  date: string
  created_at: string
}