export type TransactionType = 'buy' | 'sell';

export interface Stock {
  symbol: string;
  name: string;
  displaySymbol: string;
  quantity: number;
  avgPrice: number;
}

export interface Transaction {
  id: number;
  symbol: string;
  displaySymbol: string;
  name: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
  total: number;
}

export interface PriceData {
  price: number;
  change: number;
  previousClose: number;
}