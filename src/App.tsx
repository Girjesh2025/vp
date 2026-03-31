import { Routes, Route } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import LandingPage from './LandingPage'
import StockPortfolioApp from './StockPortfolioApp'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
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
