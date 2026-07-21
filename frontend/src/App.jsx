import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTheme } from './hooks/useTheme'
import { ThemeContext } from './context/ThemeContext'
import AuthProvider from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Locations from './pages/Locations'
import Categories from './pages/Categories'
import Login from './pages/Login'
import Members from './pages/Members'

export default function App() {
  const themeState = useTheme()

  return (
    <ThemeContext.Provider value={themeState}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="items" element={<Items />} />
                <Route path="locations" element={<Locations />} />
                <Route path="categories" element={<Categories />} />
                <Route element={<ProtectedRoute role="OWNER" />}>
                  <Route path="members" element={<Members />} />
                </Route>
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'app-toast',
              duration: 4000,
              success: { iconTheme: { primary: '#16a34a', secondary: themeState.isDark ? '#1e1e35' : '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: themeState.isDark ? '#1e1e35' : '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeContext.Provider>
  )
}
