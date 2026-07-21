import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPin, Package, Tag, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const primaryItems = [
  { path: '/', icon: LayoutDashboard, label: '总览' },
  { path: '/items', icon: Package, label: '物品' },
  { path: '/locations', icon: MapPin, label: '位置' },
  { path: '/categories', icon: Tag, label: '分类' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const navItems = user.role === 'OWNER'
    ? [...primaryItems, { path: '/members', icon: Users, label: '成员' }]
    : primaryItems

  return (
    <nav className="bottom-nav" aria-label="移动端主要导航">
      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink key={path} to={path} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end={path === '/'}>
          <Icon className="nav-icon" aria-hidden="true" />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
