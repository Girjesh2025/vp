import { useState, useEffect } from 'react'
import { supabase, Portfolio, Stock as DBStock, Transaction as DBTransaction } from '../lib/supabase'
import { Stock, Transaction } from '../types'

// Simple user ID for demo purposes - in a real app, this would come from authentication
const DEMO_USER_ID = 'demo-user-123'

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user's portfolio
  const initializePortfolio = async () => {
    try {
      setLoading(true)
      
      // Check if user has a portfolio
      const { data: existingPortfolios, error: fetchError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', DEMO_USER_ID)

      if (fetchError) throw fetchError

      if (existingPortfolios && existingPortfolios.length > 0) {
        setPortfolios(existingPortfolios)
        setCurrentPortfolio(existingPortfolios[0])
        await loadPortfolioData(existingPortfolios[0].id)
      } else {
        // Create default portfolio
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert([{
            user_id: DEMO_USER_ID,
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
    } catch (err) {
      console.error('Error initializing portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize portfolio')
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
        .in('stock_id', stocksData?.map(s => s.id) || [])
        .order('date', { ascending: false })

      if (transactionsError) throw transactionsError

      // Convert to local format
      const localStocks: Stock[] = stocksData?.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        displaySymbol: `${stock.symbol}-${stock.exchange}`,
        quantity: Number(stock.quantity),
        avgPrice: Number(stock.average_price)
      })) || []

      const localTransactions: Transaction[] = transactionsData?.map((transaction, index) => ({
        id: index + 1, // Use index as ID for local compatibility
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
        symbol: newStock.symbol,
        name: newStock.name,
        displaySymbol: `${newStock.symbol}-${newStock.exchange}`,
        quantity: Number(newStock.quantity),
        avgPrice: Number(newStock.average_price)
      }

      setStocks(prev => [...prev, localStock])
      return { ...localStock, id: newStock.id } // Return with DB ID for further operations
    } catch (err) {
      console.error('Error adding stock:', err)
      throw err
    }
  }

  // Add transaction
  const addTransaction = async (transactionData: { stockSymbol: string; type: 'buy' | 'sell'; quantity: number; price: number; date: string }) => {
    try {
      // Find the stock in database
      const { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('portfolio_id', currentPortfolio?.id)
        .eq('symbol', transactionData.stockSymbol)
        .single()

      if (stockError || !stockData) throw new Error('Stock not found')

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
  const removeStock = async (symbol: string) => {
    try {
      // Find the stock in database
      const { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('id')
        .eq('portfolio_id', currentPortfolio?.id)
        .eq('symbol', symbol)
        .single()

      if (stockError || !stockData) throw new Error('Stock not found')

      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('id', stockData.id)

      if (error) throw error

      setStocks(prev => prev.filter(s => s.symbol !== symbol))
      setTransactions(prev => prev.filter(t => t.symbol !== symbol))
    } catch (err) {
      console.error('Error removing stock:', err)
      throw err
    }
  }

  // Initialize on mount
  useEffect(() => {
    initializePortfolio()
  }, [])

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
    refreshData: () => currentPortfolio && loadPortfolioData(currentPortfolio.id)
  }
}