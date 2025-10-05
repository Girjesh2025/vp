import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import StockPortfolioApp from './StockPortfolioApp'
import './App.css'

function App() {
  const [showPortfolio, setShowPortfolio] = useState(true) // Changed to true to show portfolio by default

  return (
    <Routes>
      <Route 
        path="/" 
        element={<StockPortfolioApp />} // Direct portfolio app on home page
      />
      <Route 
        path="/landing" 
        element={<LandingPage onGetStarted={() => setShowPortfolio(true)} />} 
      />
      <Route 
        path="/app" 
        element={<StockPortfolioApp />} 
      />
      <Route 
        path="/dashboard" 
        element={<StockPortfolioApp />} 
      />
    </Routes>
  )
}

export default App
