import { Routes, Route } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
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
