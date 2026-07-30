import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarOff, Clock, DollarSign, MapPin, Package, ShieldCheck, Tag, TrendingUp } from 'lucide-react'
import { dashboardApi } from '../api'
import AuthImage from '../components/AuthImage'
import { useAuth } from '../context/AuthContext'
import { Card, PageHeader, Skeleton, StatusBadge } from '../components/ui'

const summaryCards = [
  { key: 'totalAssetValue', label: '资产总计（元）', icon: DollarSign, route: null, tone: 'asset' },
  { key: 'totalItems', label: '物品总数', icon: Package, route: '/items', tone: 'items' },
  { key: 'totalLocations', label: '收纳位置', icon: MapPin, route: '/locations', tone: 'locations' },
  { key: 'totalCategories', label: '物品分类', icon: Tag, route: '/categories', tone: 'categories' },
]

function SummaryCard({ item, value, onOpen }) {
  const Element = item.route ? 'button' : 'div'
  return (
    <Card as={Element} className={`summary-card summary-card--${item.tone}`} type={item.route ? 'button' : undefined} onClick={item.route ? onOpen : undefined}>
      <span className="summary-card__icon" aria-hidden="true"><item.icon size={21} /></span>
      <span className="summary-card__copy">
        <strong>{value ?? '—'}</strong>
        <small>{item.label}</small>
      </span>
    </Card>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    dashboardApi.getStats()
      .then((response) => setData(response.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-content dashboard-page" role="status" aria-label="正在加载收纳总览">
        <div className="inventory-summary">
          {[1, 2, 3, 4].map((key) => <Skeleton key={key} variant="card" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-content dashboard-page">
      <PageHeader
        icon={<Package size={22} />}
        eyebrow="家庭档案 · 总览"
        title="收纳总览"
        subtitle="掌握所有物品、位置与家庭数据的当前状态"
      />

      <section className="inventory-summary" aria-label="收纳统计">
        {summaryCards.map((item) => {
          const rawValue = data?.[item.key]
          const value = item.key === 'totalAssetValue' ? Number(rawValue || 0).toFixed(2) : rawValue
          return <SummaryCard key={item.key} item={item} value={value} onOpen={() => navigate(item.route)} />
        })}
      </section>

      {user.role === 'OWNER' && (
        <button className="dashboard-operations-entry" type="button" onClick={() => navigate('/operations')}>
          <span className="dashboard-operations-icon" aria-hidden="true"><ShieldCheck size={21} /></span>
          <span><strong>家庭数据保护</strong><small>查看备份状态、操作记录和回收站</small></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      )}

      <div className="dashboard-grid">
        {data?.expiringItems?.length > 0 && (
          <Card className="dashboard-panel expiry-panel">
            <div className="dashboard-panel__heading">
              <span><CalendarOff size={18} aria-hidden="true" /><strong>临期 / 过期预警</strong></span>
              <StatusBadge tone="danger">{data.expiringItems.length} 件</StatusBadge>
            </div>
            <div className="expiry-list">
              {data.expiringItems.map((item) => {
                const expired = item.status === '过期'
                return (
                  <button key={item.id} className={`expiry-item ${expired ? 'expiry-item--expired' : ''}`} type="button" onClick={() => navigate('/items')}>
                    <span><strong>{item.name}</strong><small>到期时间：{item.expiryDate}</small></span>
                    <StatusBadge tone={expired ? 'danger' : 'warning'}>{item.status}</StatusBadge>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        <Card className="dashboard-panel recent-items">
          <div className="dashboard-panel__heading"><span><Clock size={18} aria-hidden="true" /><strong>最近添加</strong></span></div>
          {data?.recentItems?.length ? (
            <div className="recent-items__list">
              {data.recentItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  className="recent-item"
                  type="button"
                  onClick={() => navigate('/items')}
                  style={{ '--category-color': item.categoryColor || 'var(--color-primary)' }}
                >
                  <span className="recent-item__image">
                    {item.imageUrl
                      ? <AuthImage src={item.imageUrl} alt={`${item.name} 图片`} className="recent-item__photo" fallback={<Package size={17} />} />
                      : <Package size={17} aria-hidden="true" />}
                  </span>
                  <span className="recent-item__copy"><strong>{item.name}</strong><small>{item.locationPath || '未设置位置'}</small></span>
                  {item.categoryName && <span className="category-chip">{item.categoryName}</span>}
                </button>
              ))}
            </div>
          ) : <p className="panel-empty">暂无物品</p>}
        </Card>

        <Card className="dashboard-panel category-distribution">
          <div className="dashboard-panel__heading"><span><TrendingUp size={18} aria-hidden="true" /><strong>分类统计</strong></span></div>
          {data?.categoryStats?.length ? (
            <div className="category-distribution__list">
              {[...data.categoryStats].sort((a, b) => b.count - a.count).slice(0, 6).map((category) => {
                const max = Math.max(...data.categoryStats.map((candidate) => candidate.count))
                const percent = max > 0 ? (category.count / max) * 100 : 0
                return (
                  <div
                    className="category-meter"
                    key={category.id}
                    style={{
                      '--category-color': category.color || 'var(--color-primary)',
                      '--category-percent': `${percent}%`,
                    }}
                  >
                    <span><span>{category.name}</span><strong>{category.count}</strong></span>
                    <div className="category-meter__track"><span /></div>
                  </div>
                )
              })}
            </div>
          ) : <p className="panel-empty">暂无分类数据</p>}
        </Card>
      </div>
    </div>
  )
}
