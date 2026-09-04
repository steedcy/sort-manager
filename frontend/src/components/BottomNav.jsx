import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPin, Package, Tag, UserRound } from 'lucide-react'

const primaryItems = [
  { path: '/', icon: LayoutDashboard, label: '总览' },
  { path: '/items', icon: Package, label: '物品' },
  { path: '/locations', icon: MapPin, label: '位置' },
  { path: '/categories', icon: Tag, label: '分类' },
  { path: '/profile', icon: UserRound, label: '我的' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="移动端主要导航">
      {primaryItems.map(({ path, icon: Icon, label }) => (
        <NavLink key={path} to={path} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end={path === '/'}>
          <Icon className="nav-icon" aria-hidden="true" />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
