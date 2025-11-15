-- Drop existing RLS policies first
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios;

DROP POLICY IF EXISTS "Users can view stocks in their portfolios" ON stocks;
DROP POLICY IF EXISTS "Users can insert stocks in their portfolios" ON stocks;
DROP POLICY IF EXISTS "Users can update stocks in their portfolios" ON stocks;
DROP POLICY IF EXISTS "Users can delete stocks in their portfolios" ON stocks;

DROP POLICY IF EXISTS "Users can view transactions for their stocks" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their stocks" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their stocks" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions for their stocks" ON transactions;

-- Create new RLS policies for Clerk JWT authentication

-- Portfolio policies using Clerk JWT
CREATE POLICY "Users can view their own portfolios" ON portfolios
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own portfolios" ON portfolios
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own portfolios" ON portfolios
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Stock policies using Clerk JWT
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

-- Transaction policies using Clerk JWT
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