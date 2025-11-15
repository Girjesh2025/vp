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

-- Disable RLS for demo purposes (allows direct database access)
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Note: In a production environment, you would want to keep RLS enabled
-- and create appropriate policies for your authentication system