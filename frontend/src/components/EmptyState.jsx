import { Package } from 'lucide-react'

export default function EmptyState({ icon: Icon = Package, title = '暂无数据', desc = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--empty-title)', marginBottom: '4px' }}>{title}</div>
        {desc && <div style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>{desc}</div>}
      </div>
      {action && action}
    </div>
  )
}
