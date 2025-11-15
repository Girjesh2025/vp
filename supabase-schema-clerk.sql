-- Create tables for the stock portfolio application

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  quantity DECIMAL(15,6) NOT NULL,
  average_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity DECIMAL(15,6) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolios using Clerk JWT
CREATE POLICY "Users can view their own portfolios" ON portfolios
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own portfolios" ON portfolios
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own portfolios" ON portfolios
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create policies for stocks using Clerk JWT
CREATE POLICY "Users can view stocks in their portfolios" ON stocks
  FOR SELECT USING (
    portfolio_id IN (
      SELECT id FROM portfolios 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert stocks in their portfolios" ON stocks
  FOR INSERT WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update stocks in their portfolios" ON stocks
  FOR UPDATE USING (
    portfolio_id IN (
      SELECT id FROM portfolios 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete stocks in their portfolios" ON stocks
  FOR DELETE USING (
    portfolio_id IN (
      SELECT id FROM portfolios 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create policies for transactions using Clerk JWT
CREATE POLICY "Users can view transactions for their stocks" ON transactions
  FOR SELECT USING (
    stock_id IN (
      SELECT s.id FROM stocks s
      JOIN portfolios p ON s.portfolio_id = p.id
      WHERE p.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert transactions for their stocks" ON transactions
  FOR INSERT WITH CHECK (
    stock_id IN (
      SELECT s.id FROM stocks s
      JOIN portfolios p ON s.portfolio_id = p.id
      WHERE p.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update transactions for their stocks" ON transactions
  FOR UPDATE USING (
    stock_id IN (
      SELECT s.id FROM stocks s
      JOIN portfolios p ON s.portfolio_id = p.id
      WHERE p.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete transactions for their stocks" ON transactions
  FOR DELETE USING (
    stock_id IN (
      SELECT s.id FROM stocks s
      JOIN portfolios p ON s.portfolio_id = p.id
      WHERE p.user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_portfolio_id ON stocks(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_stock_id ON transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();