import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, MapPin, Tag, ChevronRight, Box, Sun, Moon } from 'lucide-react'
import { useThemeContext } from '../context/ThemeContext'

const navItems = [
  { label: '仪表盘',  path: '/',           icon: LayoutDashboard },
  { label: '物品管理', path: '/items',       icon: Package },
  { label: '收纳位置', path: '/locations',   icon: MapPin },
  { label: '分类管理', path: '/categories',  icon: Tag },
]

export default function Sidebar() {
  const location = useLocation()
  const { toggle, isDark } = useThemeContext()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon">
            <Box size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              收纳管家
            </div>
            <div style={{ fontSize: '11px', color: '#6366f1' }}>Storage Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">主菜单</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <Icon className="nav-icon" size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer: theme toggle + version */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid var(--logo-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--sidebar-footer)' }}>v1.2.0</span>

        {/* Theme Toggle */}
        <button
          className="btn-theme"
          onClick={toggle}
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
          style={{ flexShrink: 0 }}
        >
          {isDark
            ? <Sun size={15} />
            : <Moon size={15} />
          }
        </button>
      </div>
    </aside>
  )
}
