import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './LandingPage'
import StockPortfolioApp from './StockPortfolioApp'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SectorRotation from './components/tools/SectorRotation'
import GlobalMarket from './components/tools/GlobalMarket'
import SectoralFlow from './components/tools/SectoralFlow'
import ReturnsCalculator from './components/tools/ReturnsCalculator'
import PositionCalculator from './components/PositionCalculator'
import AdminRoute from './components/admin/AdminRoute'
import './App.css'

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Auto redirect to /reset-password for password recovery or /app for signup confirmation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash.includes('type=recovery')) {
        navigate('/reset-password', { replace: true })
      } else if (hash.includes('access_token=') || hash.includes('type=signup')) {
        navigate('/app', { replace: true })
      }
    }
  }, [navigate, user, location.pathname])

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage onGetStarted={() => navigate('/login')} />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/admin/*" element={<AdminRoute />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <StockPortfolioApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <StockPortfolioApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/options-watch"
        element={
          <ProtectedRoute>
            <StockPortfolioApp defaultTab="options-watch" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/options-watch"
        element={
          <ProtectedRoute>
            <StockPortfolioApp defaultTab="options-watch" />
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
      <Route
        path="/app/tools/sector-rotation"
        element={<ProtectedRoute><SectorRotation /></ProtectedRoute>}
      />
      <Route
        path="/app/tools/global-market"
        element={<ProtectedRoute><GlobalMarket /></ProtectedRoute>}
      />
      <Route
        path="/app/tools/sectoral-flow"
        element={<ProtectedRoute><SectoralFlow /></ProtectedRoute>}
      />
      <Route
        path="/app/tools/position-calculator"
        element={<ProtectedRoute><PositionCalculator /></ProtectedRoute>}
      />
      <Route
        path="/app/tools/returns-calculator"
        element={<ProtectedRoute><ReturnsCalculator /></ProtectedRoute>}
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
