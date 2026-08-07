import { NavLink } from 'react-router-dom'
import { Activity, ArchiveRestore, Box, LayoutDashboard, LogOut, MapPin, Package, Tag, UserRound, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const primaryItems = [
  { label: '仪表盘', path: '/', icon: LayoutDashboard },
  { label: '物品管理', path: '/items', icon: Package },
  { label: '批量录入', path: '/items/bulk', icon: ArchiveRestore },
  { label: '收纳位置', path: '/locations', icon: MapPin },
  { label: '分类管理', path: '/categories', icon: Tag },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navItems = user.role === 'OWNER'
    ? [...primaryItems,
        { label: '家庭成员', path: '/members', icon: Users },
        { label: '家庭运营', path: '/operations', icon: Activity }]
    : primaryItems

  return (
    <aside className="app-sidebar sidebar" aria-label="主要导航">
      <div className="sidebar-logo">
        <div className="sidebar-brand-row">
          <span className="logo-icon" aria-hidden="true"><Box size={20} /></span>
          <div>
            <div className="sidebar-brand-name">收纳管家</div>
            <div className="sidebar-brand-caption">家庭物品簿</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">家庭空间</div>
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon className="nav-icon" size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-account">
        <div className="account-summary">
          <span className="account-avatar" aria-hidden="true"><UserRound size={20} /></span>
          <div>
            <strong>{user.displayName}</strong>
            <span>{user.householdName || '默认家庭'} · {user.role === 'OWNER' ? '管理员' : '成员'}</span>
          </div>
        </div>
        <div className="sidebar-account-actions">
          <button className="sidebar-logout" type="button" onClick={logout}>
            <LogOut size={17} aria-hidden="true" />退出登录
          </button>
        </div>
        <span className="sidebar-version">v1.8.0</span>
      </div>
    </aside>
  )
}
