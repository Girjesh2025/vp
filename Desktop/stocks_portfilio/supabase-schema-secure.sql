-- Enable RLS on all tables for security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow demo access to portfolios" ON portfolios;
DROP POLICY IF EXISTS "Allow demo access to stocks" ON stocks;
DROP POLICY IF EXISTS "Allow demo access to transactions" ON transactions;

-- Create policies that allow access for demo user
-- Using a consistent demo user ID: 'demo-user-123'

-- Portfolios policies
CREATE POLICY "Allow demo access to portfolios" ON portfolios
    FOR ALL USING (user_id = 'demo-user-123');

-- Stocks policies  
CREATE POLICY "Allow demo access to stocks" ON stocks
    FOR ALL USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE user_id = 'demo-user-123'
        )
    );

-- Transactions policies
CREATE POLICY "Allow demo access to transactions" ON transactions
    FOR ALL USING (
        stock_id IN (
            SELECT s.id FROM stocks s
            JOIN portfolios p ON s.portfolio_id = p.id
            WHERE p.user_id = 'demo-user-123'
        )
    );

-- Insert a demo portfolio if it doesn't exist
INSERT INTO portfolios (user_id, name, created_at, updated_at)
SELECT 'demo-user-123', 'Demo Portfolio', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM portfolios WHERE user_id = 'demo-user-123'
);