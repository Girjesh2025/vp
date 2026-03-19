-- Supabase Row Level Security (RLS) Policies
-- Run these commands in your Supabase SQL Editor to secure your database for multiple users

-- 1. Enable RLS on all tables
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Portfolios Table Policies
-- Users can only view their own portfolios
CREATE POLICY "Users can view their own portfolios" 
ON portfolios FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own portfolios
CREATE POLICY "Users can insert their own portfolios" 
ON portfolios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own portfolios
CREATE POLICY "Users can update their own portfolios" 
ON portfolios FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own portfolios
CREATE POLICY "Users can delete their own portfolios" 
ON portfolios FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Stocks Table Policies
-- Users can only view stocks in their own portfolios
CREATE POLICY "Users can view stocks in their own portfolios" 
ON stocks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = stocks.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Users can only insert stocks in their own portfolios
CREATE POLICY "Users can insert stocks in their own portfolios" 
ON stocks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = stocks.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Users can only update stocks in their own portfolios
CREATE POLICY "Users can update stocks in their own portfolios" 
ON stocks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = stocks.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Users can only delete stocks in their own portfolios
CREATE POLICY "Users can delete stocks in their own portfolios" 
ON stocks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = stocks.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);


-- 4. Transactions Table Policies
-- Users can only view transactions for stocks in their own portfolios
CREATE POLICY "Users can view own transactions" 
ON transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM stocks 
    JOIN portfolios ON stocks.portfolio_id = portfolios.id
    WHERE stocks.id = transactions.stock_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Users can only insert transactions for stocks in their own portfolios
CREATE POLICY "Users can insert own transactions" 
ON transactions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stocks 
    JOIN portfolios ON stocks.portfolio_id = portfolios.id
    WHERE stocks.id = transactions.stock_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Users can only delete their own transactions
CREATE POLICY "Users can delete own transactions" 
ON transactions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM stocks 
    JOIN portfolios ON stocks.portfolio_id = portfolios.id
    WHERE stocks.id = transactions.stock_id 
    AND portfolios.user_id = auth.uid()
  )
);
