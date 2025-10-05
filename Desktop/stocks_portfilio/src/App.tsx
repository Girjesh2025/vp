import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import StockPortfolioApp from './StockPortfolioApp'
import './App.css'

function App() {
  const [showPortfolio, setShowPortfolio] = useState(false)

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          showPortfolio ? (
            <StockPortfolioApp />
          ) : (
            <LandingPage onGetStarted={() => setShowPortfolio(true)} />
          )
        } 
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
