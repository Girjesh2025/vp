-- Drop all existing RLS policies

-- Drop portfolio policies
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios;

-- Drop stock policies
DROP POLICY IF EXISTS "Users can view stocks in their portfolios" ON stocks;
DROP POLICY IF EXISTS "Users can insert stocks in their portfolios" ON stocks;
DROP POLICY IF EXISTS "Users can update stocks in their portfolios" ON stocks;
DROP POLICY IF EXISTS "Users can delete stocks in their portfolios" ON stocks;

-- Drop transaction policies
DROP POLICY IF EXISTS "Users can view transactions for their stocks" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their stocks" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their stocks" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions for their stocks" ON transactions;