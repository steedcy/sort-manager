import { useEffect, useState } from 'react'
import { categoryApi } from '../api'
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6','#f97316','#6b7280']
const initialForm = { name: '', icon: 'Package', color: '#6366f1' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(initialForm)
  const [saving, setSaving]         = useState(false)

  const load = async () => {
    setLoading(true)
    try { const res = await categoryApi.getAll(); setCategories(res.data || []) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(initialForm); setShowModal(true) }
  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, icon: cat.icon||'Package', color: cat.color||'#6366f1' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('请输入分类名称'); return }
    setSaving(true)
    try {
      if (editing) { await categoryApi.update(editing.id, form); toast.success('分类更新成功') }
      else { await categoryApi.create(form); toast.success('分类创建成功') }
      setShowModal(false); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`确认删除「${cat.name}」？该分类下的物品将变为未分类。`)) return
    await categoryApi.delete(cat.id); toast.success('删除成功'); load()
  }

  return (
    <div className="page-content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 className="page-title">🏷️ 分类管理</h1>
          <p className="page-subtitle">共 {categories.length} 个分类</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加分类</button>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:'110px', borderRadius:'16px' }}/>)}
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState icon={Tag} title="暂无分类" desc="添加物品分类方便整理"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加分类</button>}/>
        </div>
      ) : (
        <div className="stats-grid">
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', flexShrink:0,
                  background: cat.color ? `${cat.color}22` : 'var(--bg-tag)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Tag size={20} color={cat.color || '#6366f1'}/>
                </div>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:'600', color:'var(--text-primary)' }}>{cat.name}</div>
                  <div style={{ fontSize:'13px', color:'var(--text-muted)' }}>{cat.itemCount} 件物品</div>
                </div>
              </div>
              {/* color swatch */}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'14px' }}>
                <div style={{ width:'16px', height:'16px', borderRadius:'50%', background: cat.color || '#6366f1' }}/>
                <span style={{ fontSize:'12px', color:'var(--text-subtle)' }}>{cat.color || '#6366f1'}</span>
              </div>
              <div style={{ display:'flex', gap:'6px', borderTop:'1px solid var(--border-default)', paddingTop:'12px' }}>
                <button className="btn btn-secondary" onClick={() => openEdit(cat)}
                  style={{ flex:1, fontSize:'12px', padding:'7px' }}>
                  <Pencil size={12}/> 编辑
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(cat)} style={{ padding:'7px 10px' }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '编辑分类' : '添加分类'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <div className="input-group">
            <label className="input-label">分类名称 *</label>
            <input className="input" placeholder="如：电子产品、衣物..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div className="input-group">
            <label className="input-label">颜色</label>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', padding:'4px 0' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer',
                    border: form.color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                    boxShadow: form.color === c ? `0 0 0 2px ${c}55` : 'none',
                    transition:'all 0.15s',
                  }}/>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">预览效果</label>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px',
              background:'var(--bg-hover)', borderRadius:'10px', border:'1px solid var(--border-default)' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px',
                background: `${form.color || '#6366f1'}22`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Tag size={18} color={form.color||'#6366f1'}/>
              </div>
              <span style={{ color:'var(--text-primary)', fontWeight:'500' }}>{form.name || '分类名称'}</span>
              <span style={{ fontSize:'12px', padding:'3px 8px', borderRadius:'20px', marginLeft:'auto',
                background: `${form.color || '#6366f1'}22`,
                color: form.color || '#6366f1' }}>预览</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
