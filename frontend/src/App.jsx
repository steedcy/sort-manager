import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthProvider from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Locations from './pages/Locations'
import Categories from './pages/Categories'
import Login from './pages/Login'
import Members from './pages/Members'
import BulkItems from './pages/BulkItems'
import Operations from './pages/Operations'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="items" element={<Items />} />
                <Route path="items/bulk" element={<BulkItems />} />
                <Route path="locations" element={<Locations />} />
                <Route path="categories" element={<Categories />} />
                <Route path="profile" element={<Profile />} />
                <Route element={<ProtectedRoute role="OWNER" />}>
                  <Route path="members" element={<Members />} />
                  <Route path="operations" element={<Operations />} />
                </Route>
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
          <Toaster position="top-right" toastOptions={{ className: 'app-toast', duration: 4000 }} />
        </AuthProvider>
      </BrowserRouter>
  )
}
