import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, MapPin, Tag } from 'lucide-react'

export default function BottomNav() {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: '仪表盘' },
    { path: '/items', icon: Package, label: '物品' },
    { path: '/locations', icon: MapPin, label: '位置' },
    { path: '/categories', icon: Tag, label: '分类' }
  ]

  return (
    <div className="bottom-nav">
      {navItems.map(item => (
        <NavLink key={item.path} to={item.path} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end={item.path === '/'}>
          <item.icon className="nav-icon" />
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </div>
  )
}
