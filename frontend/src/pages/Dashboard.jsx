import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'
import { Package, MapPin, Tag, TrendingUp, Clock, DollarSign, CalendarOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ icon: Icon, label, value, color, bgColor, onClick }) => (
  <div className="card stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <div className="stat-icon" style={{ background: bgColor }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  </div>
)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    dashboardApi.getStats()
      .then(res => { setData(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-content">
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '110px', flex: '1', minWidth: '200px' }} />)}
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">📦 收纳总览</h1>
        <p className="page-subtitle">掌握所有物品的存放状态</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard icon={DollarSign}   label="资产总计 (¥)" value={data?.totalAssetValue ? data.totalAssetValue.toFixed(2) : '0.00'}
          color="#10b981" bgColor="rgba(16,185,129,0.15)" />
        <StatCard icon={Package}      label="物品总数"   value={data?.totalItems}
          color="#6366f1" bgColor="rgba(99,102,241,0.15)"  onClick={() => navigate('/items')} />
        <StatCard icon={MapPin}       label="收纳位置"   value={data?.totalLocations}
          color="#06b6d4" bgColor="rgba(6,182,212,0.15)"   onClick={() => navigate('/locations')} />
        <StatCard icon={Tag}          label="物品分类"   value={data?.totalCategories}
          color="#8b5cf6" bgColor="rgba(139,92,246,0.15)"  onClick={() => navigate('/categories')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Expiring Items (New Panel) */}
        {data?.expiringItems?.length > 0 && (
          <div className="card" style={{ padding: '20px', gridColumn: '1 / -1', background: 'var(--bg-card)', border: '1px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CalendarOff size={16} color="#ef4444" />
              <span style={{ fontWeight: '600', color: '#ef4444', fontSize: '15px' }}>临期/过期预警 ({data.expiringItems.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {data.expiringItems.map(item => (
                <div key={item.id}
                  onClick={() => navigate('/items')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                    background: item.status === '过期' ? '#fef2f2' : '#fff7ed',
                    border: `1px solid ${item.status === '过期' ? '#fca5a5' : '#fed7aa'}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: item.status === '过期' ? '#b91c1c' : '#c2410c',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: item.status === '过期' ? '#dc2626' : '#ea580c', marginTop: '2px' }}>
                      过期时间: {item.expiryDate}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap', fontWeight: 'bold',
                    background: item.status === '过期' ? '#fee2e2' : '#ffedd5',
                    color: item.status === '过期' ? '#dc2626' : '#ea580c',
                  }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Items */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={16} color="#6366f1" />
            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>最近添加</span>
          </div>
          {data?.recentItems?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.recentItems.slice(0, 6).map(item => (
                <div key={item.id}
                  onClick={() => navigate('/items')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                    background: item.categoryColor ? `${item.categoryColor}22` : 'var(--bg-tag)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      : <Package size={16} color={item.categoryColor || '#6366f1'} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.locationPath || '未设置位置'}
                    </div>
                  </div>
                  {item.categoryName && (
                    <span style={{
                      fontSize: '11px', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap',
                      background: item.categoryColor ? `${item.categoryColor}22` : 'var(--bg-tag)',
                      color: item.categoryColor || '#6366f1',
                    }}>{item.categoryName}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '14px' }}>
              暂无物品
            </div>
          )}
        </div>

        {/* Category Stats */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="#8b5cf6" />
            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>分类统计</span>
          </div>
          {data?.categoryStats?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.categoryStats
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map(cat => {
                  const max = Math.max(...data.categoryStats.map(c => c.count))
                  const pct = max > 0 ? (cat.count / max) * 100 : 0
                  return (
                    <div key={cat.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cat.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: cat.color || '#6366f1' }}>{cat.count}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-hover)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${cat.color || '#6366f1'}, ${cat.color || '#8b5cf6'})`,
                          borderRadius: '3px', transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '14px' }}>
              暂无分类数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
