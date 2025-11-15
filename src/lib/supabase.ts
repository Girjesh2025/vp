import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

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