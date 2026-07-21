import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AppShell() {
  const location = useLocation()
  const mainRef = useRef(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <Sidebar />
      <div className="mobile-account-bar">
        <span><strong>{user.displayName}</strong> · {user.householdName || '默认家庭'}</span>
        <button type="button" onClick={logout} aria-label="退出登录"><LogOut size={18} />退出</button>
      </div>
      <main id="main-content" className="main-content" ref={mainRef} tabIndex="-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
