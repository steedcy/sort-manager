import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppShell() {
  const location = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="app-shell app-layout">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <Sidebar />
      <main id="main-content" className="main-content" ref={mainRef} tabIndex="-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
