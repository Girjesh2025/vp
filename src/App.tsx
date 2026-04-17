import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './LandingPage'
import StockPortfolioApp from './StockPortfolioApp'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import SectorRotation from './components/tools/SectorRotation'
import GlobalMarket from './components/tools/GlobalMarket'
import SectoralFlow from './components/tools/SectoralFlow'
import ReturnsCalculator from './components/tools/ReturnsCalculator'
import PositionCalculator from './components/PositionCalculator'
import './App.css'

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  // Global handler for Fyers/Broker OAuth redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authCode = params.get('auth_code') || params.get('code') || params.get('request_token');
    
    // If we receive an auth_code but we're NOT on /app, redirect to /app so it can process it
    if (authCode && !location.pathname.startsWith('/app')) {
      // Ensure broker mode is active
      if (!localStorage.getItem('pp_auth_mode')) {
        const userId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? `broker-${crypto.randomUUID()}`
          : `broker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('pp_auth_mode', 'broker');
        localStorage.setItem('pp_local_user_id', userId);
        localStorage.setItem('pp_user_id', userId);
        localStorage.setItem('pp_data_source', 'broker');
      }
      navigate(`/app${location.search}`, { replace: true });
    }
  }, [location, navigate]);

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage onGetStarted={() => navigate('/login')} />}
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
