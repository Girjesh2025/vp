import { useState, useEffect } from 'react'
import { supabase, Portfolio } from '../lib/supabase'
import { Stock, Transaction } from '../types'
import { useAuth } from '../contexts/AuthContext'

const DEMO_STOCKS: Stock[] = [];
const DEMO_TRANSACTIONS: Transaction[] = [];

export function usePortfolio() {
  const { user } = useAuth()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user's portfolio
  const initializePortfolio = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Check if Supabase credentials are properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://your-project-ref.supabase.co' || 
          supabaseKey === 'your-anon-key-here') {
        throw new Error('Supabase credentials not configured')
      }

      try {
        // Try to connect to Supabase
        let { data: portfolios, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', user.id)

        if (!portfolios || portfolios.length === 0) {
          const { data: fallbackPortfolios } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', 'demo-user-123')
          if (fallbackPortfolios && fallbackPortfolios.length > 0) {
            portfolios = fallbackPortfolios
          }
        }

        if (error && (!portfolios || portfolios.length === 0)) throw error

        if (portfolios && portfolios.length > 0) {
          setPortfolios(portfolios)
          setCurrentPortfolio(portfolios[0])
          await loadPortfolioData(portfolios[0].id)
        } else {
          // Create new portfolio
          const { data: newPortfolio, error: createError } = await supabase
            .from('portfolios')
            .insert([{
              user_id: user.id,
              name: 'My Portfolio'
            }])
            .select()
            .single()

          if (createError) throw createError

          setPortfolios([newPortfolio])
          setCurrentPortfolio(newPortfolio)
          setStocks([])
          setTransactions([])
        }
      } catch (supabaseError) {
        console.warn('Supabase connection failed, using offline mode:', supabaseError)
        
        // Fallback to offline/demo mode
        const demoPortfolio: Portfolio = {
          id: 'demo-portfolio-1',
          user_id: user.id,
          name: 'Demo Portfolio (Offline Mode)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setPortfolios([demoPortfolio])
        setCurrentPortfolio(demoPortfolio)
        setStocks(DEMO_STOCKS)
        setTransactions(DEMO_TRANSACTIONS)
        setError(null) // Clear any previous errors
      }
    } catch (err) {
      console.warn('Supabase not configured, using offline mode:', err)
      
      // Fallback to offline/demo mode
      const demoPortfolio: Portfolio = {
        id: 'demo-portfolio-1',
        user_id: user.id,
        name: 'Demo Portfolio (Offline Mode)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setPortfolios([demoPortfolio])
      setCurrentPortfolio(demoPortfolio)
      setStocks(DEMO_STOCKS)
      setTransactions(DEMO_TRANSACTIONS)
      setError(null) // Clear any previous errors
    } finally {
      setLoading(false)
    }
  }

  // Load portfolio data (stocks and transactions)
  const loadPortfolioData = async (portfolioId: string) => {
    try {
      // Load stocks
      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('*')
        .eq('portfolio_id', portfolioId)

      if (stocksError) throw stocksError

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          stocks!inner(symbol, name)
        `)
        .in('stock_id', stocksData?.map((s: { id: string }) => s.id) || [])
        .order('date', { ascending: false })

      if (transactionsError) throw transactionsError

      // Convert to local format and deduplicate by symbol so UI never shows duplicate rows
      const seenSymbols = new Set<string>();
      const deduplicatedStocksData = (stocksData || []).filter((stock: any) => {
        const clean = stock.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
        if (seenSymbols.has(clean)) return false;
        seenSymbols.add(clean);
        return true;
      });

      const localStocks: Stock[] = deduplicatedStocksData.map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        displaySymbol: `${stock.symbol}-${stock.exchange}`,
        quantity: Number(stock.quantity),
        avgPrice: Number(stock.average_price)
      }));

      const localTransactions: Transaction[] = transactionsData?.map((transaction: { stocks: { symbol: string; name: string }; type: string; quantity: string | number; price: string | number; date: string }, index: number) => ({
        id: Date.now() + index, // Unique ID to avoid key collisions
        symbol: transaction.stocks.symbol,
        displaySymbol: `${transaction.stocks.symbol}-${transaction.stocks.name}`,
        name: transaction.stocks.name,
        type: transaction.type as 'buy' | 'sell',
        quantity: Number(transaction.quantity),
        price: Number(transaction.price),
        date: transaction.date,
        total: Number(transaction.quantity) * Number(transaction.price)
      })) || []

      setStocks(localStocks)
      setTransactions(localTransactions)
    } catch (err) {
      console.error('Error loading portfolio data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data')
    }
  }

  // Add stock to portfolio
  const addStock = async (stockData: { symbol: string; name: string; exchange: string; quantity: number; avgPrice: number }) => {
    if (!currentPortfolio) return

    try {
      const cleanInput = stockData.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];

      // Check if we're in offline mode (demo portfolio)
      if (currentPortfolio.id === 'demo-portfolio-1') {
        const existing = stocks.find(s => s.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0] === cleanInput);
        if (existing) {
          const totalQty = existing.quantity + stockData.quantity;
          const totalVal = (existing.quantity * existing.avgPrice) + (stockData.quantity * stockData.avgPrice);
          const newAvg = totalQty > 0 ? totalVal / totalQty : stockData.avgPrice;
          setStocks(prev => prev.map(s => s.symbol === existing.symbol ? { ...s, quantity: totalQty, avgPrice: newAvg } : s));
          return existing;
        }

        const newStock: Stock = {
          symbol: stockData.symbol,
          name: stockData.name,
          displaySymbol: `${stockData.symbol}-${stockData.exchange}`,
          quantity: stockData.quantity,
          avgPrice: stockData.avgPrice
        }
        
        setStocks(prev => [...prev, newStock])
        return newStock;
      }

      // Check if stock already exists in database for this portfolio
      const { data: existingStock } = await supabase
        .from('stocks')
        .select('*')
        .eq('portfolio_id', currentPortfolio.id)
        .or(`symbol.eq.${cleanInput},symbol.eq.${stockData.symbol}`)
        .maybeSingle();

      if (existingStock) {
        // Stock already exists in this portfolio, update quantity & avg price
        const totalQty = Number(existingStock.quantity) + Number(stockData.quantity);
        const totalVal = (Number(existingStock.quantity) * Number(existingStock.average_price)) + (Number(stockData.quantity) * Number(stockData.avgPrice));
        const newAvg = totalQty > 0 ? totalVal / totalQty : Number(stockData.avgPrice);

        const { data: updatedStock, error: updateErr } = await supabase
          .from('stocks')
          .update({
            quantity: totalQty,
            average_price: newAvg
          })
          .eq('id', existingStock.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        const localStock: Stock = {
          id: updatedStock.id,
          symbol: updatedStock.symbol,
          name: updatedStock.name,
          displaySymbol: `${updatedStock.symbol}-${updatedStock.exchange}`,
          quantity: Number(updatedStock.quantity),
          avgPrice: Number(updatedStock.average_price)
        };

        setStocks(prev => prev.map(s => {
          const sClean = s.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
          return (s.symbol === localStock.symbol || sClean === cleanInput) ? localStock : s;
        }));
        return localStock;
      }

      // Normal Supabase mode - insert new stock
      const { data: newStock, error } = await supabase
        .from('stocks')
        .insert([{
          portfolio_id: currentPortfolio.id,
          symbol: stockData.symbol,
          name: stockData.name,
          exchange: stockData.exchange,
          quantity: stockData.quantity,
          average_price: stockData.avgPrice
        }])
        .select()
        .single()

      if (error) throw error

      const localStock: Stock = {
        id: newStock.id,
        symbol: newStock.symbol,
        name: newStock.name,
        displaySymbol: `${newStock.symbol}-${newStock.exchange}`,
        quantity: Number(newStock.quantity),
        avgPrice: Number(newStock.average_price)
      }

      setStocks(prev => [...prev, localStock])
      return localStock
    } catch (err) {
      console.error('Error adding stock:', err)
      throw err
    }
  }

  // Add transaction
  const addTransaction = async (transactionData: { stockSymbol: string; type: 'buy' | 'sell'; quantity: number; price: number; date: string }) => {
    try {
      // Check if we're in offline mode (demo portfolio)
      if (currentPortfolio?.id === 'demo-portfolio-1') {
        // Find the stock locally
        const stock = stocks.find(s => s.symbol === transactionData.stockSymbol)
        if (!stock) throw new Error('Stock not found')

        const localTransaction: Transaction = {
          id: transactions.length + 1,
          symbol: transactionData.stockSymbol,
          displaySymbol: stock.displaySymbol,
          name: stock.name,
          type: transactionData.type,
          quantity: transactionData.quantity,
          price: transactionData.price,
          date: transactionData.date,
          total: transactionData.quantity * transactionData.price
        }

        setTransactions(prev => [localTransaction, ...prev])

        // Update stock quantity locally
        setStocks(prev => prev.map(s => {
          if (s.symbol === transactionData.stockSymbol) {
            const newQuantity = transactionData.type === 'buy' 
              ? s.quantity + transactionData.quantity
              : s.quantity - transactionData.quantity
            
            // Calculate new average price for buy transactions
            const newAvgPrice = transactionData.type === 'buy'
              ? ((s.avgPrice * s.quantity) + (transactionData.price * transactionData.quantity)) / newQuantity
              : s.avgPrice

            return { ...s, quantity: newQuantity, avgPrice: newAvgPrice }
          }
          return s
        }))

        return localTransaction
      }

      // Normal Supabase mode
      // Find the stock in database (handles clean symbols and duplicate rows gracefully)
      const cleanSym = transactionData.stockSymbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
      const { data: stockRows, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('portfolio_id', currentPortfolio?.id)
        .or(`symbol.eq.${cleanSym},symbol.eq.${transactionData.stockSymbol}`);

      if (stockError || !stockRows || stockRows.length === 0) throw new Error('Stock not found');
      const stockData = stockRows[0];

      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert([{
          stock_id: stockData.id,
          type: transactionData.type,
          quantity: transactionData.quantity,
          price: transactionData.price,
          date: transactionData.date
        }])
        .select(`
          *,
          stocks!inner(symbol, name)
        `)
        .single()

      if (error) throw error

      const localTransaction: Transaction = {
        id: transactions.length + 1,
        symbol: newTransaction.stocks.symbol,
        displaySymbol: `${newTransaction.stocks.symbol}-${newTransaction.stocks.name}`,
        name: newTransaction.stocks.name,
        type: newTransaction.type,
        quantity: Number(newTransaction.quantity),
        price: Number(newTransaction.price),
        date: newTransaction.date,
        total: Number(newTransaction.quantity) * Number(newTransaction.price)
      }

      setTransactions(prev => [localTransaction, ...prev])

      // Update stock quantity and average price
      await updateStockAfterTransaction(stockData.id, transactionData.type, transactionData.quantity, transactionData.price, transactionData.stockSymbol)
      
      return localTransaction
    } catch (err) {
      console.error('Error adding transaction:', err)
      throw err
    }
  }

  // Update stock after transaction
  const updateStockAfterTransaction = async (stockId: string, type: 'buy' | 'sell', quantity: number, price: number, symbol: string) => {
    const stock = stocks.find(s => s.symbol === symbol)
    if (!stock) return

    let newQuantity = stock.quantity
    let newAveragePrice = stock.avgPrice

    if (type === 'buy') {
      const totalValue = (stock.quantity * stock.avgPrice) + (quantity * price)
      newQuantity = stock.quantity + quantity
      newAveragePrice = newQuantity > 0 ? totalValue / newQuantity : 0
    } else {
      newQuantity = Math.max(0, stock.quantity - quantity)
    }

    try {
      const { error } = await supabase
        .from('stocks')
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice
        })
        .eq('id', stockId)

      if (error) throw error

      setStocks(prev => prev.map(s => 
        s.symbol === symbol 
          ? { ...s, quantity: newQuantity, avgPrice: newAveragePrice }
          : s
      ))
    } catch (err) {
      console.error('Error updating stock:', err)
      throw err
    }
  }

  // Remove stock
  const removeStock = async (stockOrSymbol: string | Stock) => {
    try {
      const symbol = typeof stockOrSymbol === 'string' ? stockOrSymbol : stockOrSymbol.symbol;
      const stockId = typeof stockOrSymbol === 'object' ? stockOrSymbol.id : undefined;
      const cleanSymbol = symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];

      // Optimistically update local state immediately
      setStocks(prev => prev.filter(s => {
        if (stockId && (s as any).id === stockId) return false;
        const sClean = s.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
        return s.symbol.toUpperCase() !== symbol.toUpperCase() && sClean !== cleanSymbol;
      }));
      setTransactions(prev => prev.filter(t => {
        const tClean = t.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
        return t.symbol.toUpperCase() !== symbol.toUpperCase() && tClean !== cleanSymbol;
      }));

      // Handle offline/demo mode
      if (currentPortfolio?.id?.startsWith('demo-portfolio')) {
        return;
      }

      // 1. Try deleting via proxy backend endpoint with full service rights
      try {
        const apiRes = await fetch('/api/portfolio/stock', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: cleanSymbol,
            rawSymbol: symbol,
            stockId: stockId,
            portfolioId: currentPortfolio?.id
          })
        });
        if (apiRes.ok) {
          console.log('Stock deleted successfully via backend API');
          return;
        }
      } catch (apiErr) {
        console.warn('Backend delete API failed, falling back to direct Supabase:', apiErr);
      }

      // 2. Direct Supabase Fallback: Find all matching stocks in this portfolio (or globally)
      const portfolioId = currentPortfolio?.id;
      let query = supabase.from('stocks').select('id, symbol');
      if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId);
      }

      const { data: allStocks, error: stockError } = await query;
      if (stockError) {
        console.warn('Could not query stocks in Supabase:', stockError);
      }

      if (allStocks && allStocks.length > 0) {
        const matchingIds = allStocks
          .filter(s => {
            if (stockId && s.id === stockId) return true;
            const sClean = s.symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '').split('-')[0];
            return s.symbol.toUpperCase() === symbol.toUpperCase() || sClean === cleanSymbol;
          })
          .map(s => s.id);

        if (matchingIds.length > 0) {
          await supabase.from('transactions').delete().in('stock_id', matchingIds);
          const { error: delErr } = await supabase.from('stocks').delete().in('id', matchingIds);
          if (delErr) {
            console.error('Error deleting stock row in Supabase:', delErr);
          } else {
            console.log(`Successfully deleted ${matchingIds.length} stock row(s) from Supabase`);
          }
        }
      }
    } catch (err) {
      console.error('Error removing stock:', err);
    }
  }

  // Initialize on mount or when auth user changes
  useEffect(() => {
    initializePortfolio()
  }, [user?.id])

  // Create new portfolio
  const createPortfolio = async (name: string) => {
    try {
      // Check if we're in offline mode (demo portfolio)
      if (currentPortfolio?.id === 'demo-portfolio-1') {
        // Create portfolio locally for demo mode
        const newPortfolio: Portfolio = {
          id: `demo-portfolio-${Date.now()}`, // Generate unique ID
          user_id: user?.id || 'demo-user-123',
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setPortfolios(prev => [...prev, newPortfolio])
        setCurrentPortfolio(newPortfolio)
        setStocks([])
        setTransactions([])
        return newPortfolio
      }

      // Normal Supabase mode
      if (!user) throw new Error('Must be logged in to create a portfolio');
      
      const { data: newPortfolio, error } = await supabase
        .from('portfolios')
        .insert([{
          user_id: user.id,
          name: name
        }])
        .select()
        .single()

      if (error) throw error

      setPortfolios(prev => [...prev, newPortfolio])
      setCurrentPortfolio(newPortfolio)
      setStocks([])
      setTransactions([])
      return newPortfolio
    } catch (err) {
      console.error('Error creating portfolio:', err)
      throw err
    }
  }

  // Edit portfolio
  const editPortfolio = async (portfolioId: string, newName: string) => {
    try {
      // Handle offline/demo mode
      if (portfolioId.startsWith('demo-portfolio')) {
        const updatedPortfolio = portfolios.find(p => p.id === portfolioId)
        if (!updatedPortfolio) throw new Error('Portfolio not found')
        const renamed = { ...updatedPortfolio, name: newName }
        setPortfolios(prev => prev.map(p => p.id === portfolioId ? renamed : p))
        if (currentPortfolio?.id === portfolioId) setCurrentPortfolio(renamed)
        return renamed
      }

      const { data: updatedPortfolio, error } = await supabase
        .from('portfolios')
        .update({ name: newName })
        .eq('id', portfolioId)
        .select()
        .single()

      if (error) throw error

      setPortfolios(prev => prev.map(p => p.id === portfolioId ? updatedPortfolio : p))
      
      if (currentPortfolio?.id === portfolioId) {
        setCurrentPortfolio(updatedPortfolio)
      }
      
      return updatedPortfolio
    } catch (err) {
      console.error('Error editing portfolio:', err)
      throw err
    }
  }

  // Delete portfolio
  const deletePortfolio = async (portfolioId: string) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId)

      if (error) throw error

      setPortfolios(prev => prev.filter(p => p.id !== portfolioId))
      
      // If deleted portfolio was current, switch to first available
      if (currentPortfolio?.id === portfolioId) {
        const remainingPortfolios = portfolios.filter(p => p.id !== portfolioId)
        if (remainingPortfolios.length > 0) {
          setCurrentPortfolio(remainingPortfolios[0])
          await loadPortfolioData(remainingPortfolios[0].id)
        } else {
          setCurrentPortfolio(null)
          setStocks([])
          setTransactions([])
        }
      }
    } catch (err) {
      console.error('Error deleting portfolio:', err)
      throw err
    }
  }

  // Switch portfolio
  const switchPortfolio = async (portfolio: Portfolio) => {
    try {
      setCurrentPortfolio(portfolio)
      await loadPortfolioData(portfolio.id)
    } catch (err) {
      console.error('Error switching portfolio:', err)
      throw err
    }
  }

  return {
    portfolios,
    currentPortfolio,
    stocks,
    transactions,
    loading,
    error,
    addStock,
    addTransaction,
    removeStock,
    createPortfolio,
    editPortfolio,
    deletePortfolio,
    switchPortfolio,
    refreshData: () => currentPortfolio && loadPortfolioData(currentPortfolio.id)
  }
}