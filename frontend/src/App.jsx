import { createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTheme } from './hooks/useTheme'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Locations from './pages/Locations'
import Categories from './pages/Categories'

export const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, isDark: true })
export const useThemeContext = () => useContext(ThemeContext)

export default function App() {
  const themeState = useTheme()

  return (
    <ThemeContext.Provider value={themeState}>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items" element={<Items />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: themeState.isDark ? '#1e1e35' : '#ffffff',
              color: themeState.isDark ? '#e2e8f0' : '#1e293b',
              border: themeState.isDark
                ? '1px solid rgba(99,102,241,0.2)'
                : '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: themeState.isDark
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(99,102,241,0.12)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: themeState.isDark ? '#1e1e35' : '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: themeState.isDark ? '#1e1e35' : '#fff' } },
          }}
        />
      </BrowserRouter>
    </ThemeContext.Provider>
  )
}
