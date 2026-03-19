import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './LandingPage'
import StockPortfolioApp from './StockPortfolioApp'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  const [showPortfolio, setShowPortfolio] = useState(false)

  return (
    <AuthProvider>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage onGetStarted={() => setShowPortfolio(true)} />} 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <StockPortfolioApp />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <StockPortfolioApp />
            </ProtectedRoute>
          } 
        />
        {/* Fallback for old state-based routing */}
        {showPortfolio && (
          <Route path="*" element={<Navigate to="/app" replace />} />
        )}
      </Routes>
    </AuthProvider>
  )
}

export default App
