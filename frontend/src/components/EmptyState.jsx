import { Package } from 'lucide-react'

export default function EmptyState({ icon: Icon = Package, title = '暂无数据', desc = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} aria-hidden="true" />
      </div>
      <div className="empty-state__copy">
        <strong className="empty-state__title">{title}</strong>
        {desc && <p className="empty-state__description">{desc}</p>}
      </div>
      {action && action}
    </div>
  )
}
