// src/Frontend/App.jsx - Updated with AddAction route
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LoginPage from "./components/LoginPage"
import Dashboard from "./pages/Dashboard"
import HREmployees from "./pages/HREmployees"
import HRSalaries from "./pages/HRSalaries"
import RealEstateLeads from "./pages/RealEstateLeads"
import RealEstateActions from "./pages/RealEstateActions"
import AddEmployee from "./pages/AddEmployee"
import AddSalary from "./pages/AddSalary"
import AddLead from "./pages/AddLead"
import AddAction from "./pages/AddAction"

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/api/auth/me', {
            headers: {
              'Authorization': `Basic ${token}`,
            },
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('auth_token')
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('auth_token')
        }
      }
      
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Router>
      <Routes>
        {/* Dashboard Route */}
        <Route 
          path="/" 
          element={<Dashboard user={user} onLogout={handleLogout} />} 
        />
        
        {/* HR Module Routes */}
        <Route 
          path="/hr/employees" 
          element={<HREmployees user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/hr/employees/add" 
          element={<AddEmployee user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/hr/salaries" 
          element={<HRSalaries user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/hr/salaries/add" 
          element={<AddSalary user={user} onLogout={handleLogout} />} 
        />
        
        {/* Real Estate Module Routes */}
        <Route 
          path="/real-estate/leads" 
          element={<RealEstateLeads user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/real-estate/leads/add" 
          element={<AddLead user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/real-estate/actions" 
          element={<RealEstateActions user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/real-estate/actions/add" 
          element={<AddAction user={user} onLogout={handleLogout} />} 
        />
      </Routes>
    </Router>
  )
}

export default App