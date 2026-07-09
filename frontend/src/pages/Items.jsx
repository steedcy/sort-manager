import { useEffect, useState, useCallback } from 'react'
import { itemApi, categoryApi, locationApi } from '../api'
import { Plus, Search, Package, MapPin, Pencil, Trash2, X, CheckSquare, Square } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { buildLocationTreeOptions } from '../utils/tree'

const initialForm = { 
  name: '', description: '', quantity: 1, 
  price: 0, purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '',
  categoryId: '', locationId: '', imageUrl: '' 
}

export default function Items() {
  const [items, setItems]         = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(initialForm)
  const [saving, setSaving]         = useState(false)
  const [keyword, setKeyword]           = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false)
  const [batchLocationId, setBatchLocationId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (keyword) params.keyword = keyword
      if (filterCategory) params.categoryId = filterCategory
      if (filterLocation) params.locationId = filterLocation
      const [ir, cr, lr] = await Promise.all([
        itemApi.getAll(params), categoryApi.getAll(), locationApi.getAll(),
      ])
      setItems(ir.data || [])
      setCategories(cr.data || [])
      setLocations(buildLocationTreeOptions(lr.data || []))
    } finally { setLoading(false) }
  }, [keyword, filterCategory, filterLocation])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(initialForm); setShowModal(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ 
      name: item.name, description: item.description || '', quantity: item.quantity,
      price: item.price || 0, purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate: item.expiryDate || '',
      categoryId: item.categoryId || '', locationId: item.locationId || '', imageUrl: item.imageUrl || '' 
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('请输入物品名称'); return }
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0) { toast.error('请输入有效的单价'); return }
    if (!form.purchaseDate) { toast.error('请输入购入日期'); return }
    if (!form.locationId) { toast.error('请选择存放位置'); return }
    setSaving(true)
    try {
      const payload = { ...form, quantity: Number(form.quantity) || 1, price: Number(form.price) || 0,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        locationId: form.locationId ? Number(form.locationId) : null }
      if (editing) { await itemApi.update(editing.id, payload); toast.success('物品更新成功') }
      else { await itemApi.create(payload); toast.success('物品添加成功') }
      setShowModal(false); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`确认删除「${item.name}」？`)) return
    await itemApi.delete(item.id); toast.success('删除成功'); load()
  }

  const toggleSelect = (id) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedItems(newSet)
  }

  const handleBatchDelete = async () => {
    if (!window.confirm(`确认删除选中的 ${selectedItems.size} 件物品？`)) return
    setLoading(true)
    try {
      await Promise.all(Array.from(selectedItems).map(id => itemApi.delete(id)))
      toast.success('批量删除成功')
      setSelectedItems(new Set())
      load()
    } catch { toast.error('部分删除失败'); setLoading(false) }
  }

  const handleBatchMove = async () => {
    if (!batchLocationId) { toast.error('请选择目标位置'); return }
    setSaving(true)
    try {
      // Find the location name for the toast
      const locId = Number(batchLocationId)
      // Fetch the items to update
      const itemsToUpdate = items.filter(i => selectedItems.has(i.id))
      await Promise.all(itemsToUpdate.map(item => {
        return itemApi.update(item.id, { ...item, locationId: locId })
      }))
      toast.success('批量移动成功')
      setShowBatchMoveModal(false)
      setSelectedItems(new Set())
      load()
    } catch { toast.error('部分移动失败'); setSaving(false) }
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 className="page-title">📦 物品管理</h1>
          <p className="page-subtitle">共 {items.length} 件物品</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加物品</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        <div className="search-bar">
          <Search className="search-icon" size={16}/>
          <input className="input" placeholder="搜索物品名称..." value={keyword}
            onChange={e => setKeyword(e.target.value)} style={{ paddingLeft:'38px' }}/>
        </div>
        <select className="input" style={{ width:'auto', minWidth:'130px' }}
          value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">全部分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" style={{ width:'auto', minWidth:'140px' }}
          value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
          <option value="">全部位置</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.treeName}</option>)}
        </select>
        {(keyword||filterCategory||filterLocation) && (
          <button className="btn btn-ghost"
            onClick={() => { setKeyword(''); setFilterCategory(''); setFilterLocation('') }}>
            <X size={14}/> 清除
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="items-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:'220px', borderRadius:'16px' }}/>)}
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="暂无物品" desc="点击右上角按钮添加物品"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加物品</button>}/>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => {
            const isSelected = selectedItems.has(item.id)
            return (
            <div key={item.id} className="card item-card" style={{ position: 'relative', border: isSelected ? '2px solid var(--primary)' : undefined }}>
              <div 
                onClick={() => toggleSelect(item.id)}
                style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.8)', borderRadius: '4px', display: 'flex' }}>
                {isSelected ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="var(--text-muted)" />}
              </div>
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} className="item-image"/>
                : <div className="item-image-placeholder"><Package size={32}/></div>
              }
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'var(--text-primary)', 
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>
                    {item.name}
                  </div>
                  {item.status === '过期' ? (
                    <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'#fee2e2', color:'#dc2626' }}>已过期</span>
                  ) : (
                    <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'#dcfce7', color:'#16a34a' }}>正常</span>
                  )}
                </div>

                {item.locationPath && (
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px',
                    color:'var(--text-muted)', marginBottom:'6px' }}>
                    <MapPin size={11}/> {item.locationPath}
                  </div>
                )}
                
                <div style={{ fontSize:'12px', color:'var(--text-subtle)', marginBottom:'6px' }}>
                  💰 单价: ￥{item.price?.toFixed(2) || '0.00'} | 总计: ￥{item.totalPrice?.toFixed(2) || '0.00'}
                </div>

                <div style={{ fontSize:'11px', color:'var(--text-subtle)', marginBottom:'6px' }}>
                  📅 购入: {item.purchaseDate} {item.expiryDate && `| 过期: ${item.expiryDate}`}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  {item.categoryName
                    ? <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'20px',
                        background: item.categoryColor ? `${item.categoryColor}22` : 'var(--bg-tag)',
                        color: item.categoryColor || '#6366f1' }}>{item.categoryName}</span>
                    : <span/>
                  }
                  <span style={{ fontSize:'12px', color:'var(--text-subtle)' }}>×{item.quantity}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:'6px', borderTop:'1px solid var(--border-default)', paddingTop:'10px' }}>
                <button className="btn btn-secondary" onClick={() => openEdit(item)}
                  style={{ flex:1, padding:'7px', fontSize:'12px' }}>
                  <Pencil size={13}/> 编辑
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(item)} style={{ padding:'7px 10px' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? '编辑物品' : '添加物品'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <div className="input-group">
            <label className="input-label">物品名称 *</label>
            <input className="input" placeholder="如：充电宝、螺丝刀..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div className="input-group">
              <label className="input-label">分类</label>
              <select className="input" value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">未分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">数量 *</label>
              <input className="input" type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}/>
            </div>
            <div className="input-group">
              <label className="input-label">单价 (元) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}/>
            </div>
            <div className="input-group">
              <label className="input-label">购入日期 *</label>
              <input className="input" type="date" value={form.purchaseDate}
                onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}/>
            </div>
            <div className="input-group">
              <label className="input-label">有效期至</label>
              <input className="input" type="date" value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}/>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">存放位置 *</label>
            <select className="input" value={form.locationId}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}>
              <option value="">请选择存放位置</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.treeName}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">描述</label>
            <textarea className="input" placeholder="物品描述（可选）" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </div>
          <div className="input-group">
            <label className="input-label">图片</label>
            <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))}/>
          </div>
        </Modal>
      )}

      {/* Batch Move Modal */}
      {showBatchMoveModal && (
        <Modal title={`批量移动 ${selectedItems.size} 件物品`}
          onClose={() => setShowBatchMoveModal(false)} onSubmit={handleBatchMove} loading={saving}>
          <div className="input-group">
            <label className="input-label">目标存放位置 *</label>
            <select className="input" value={batchLocationId}
              onChange={e => setBatchLocationId(e.target.value)}>
              <option value="">请选择存放位置</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.treeName}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Batch Action Bar */}
      {selectedItems.size > 0 && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', padding: '12px 24px', borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '24px',
          zIndex: 1000, border: '1px solid var(--border-default)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>已选择 {selectedItems.size} 项</span>
            <button className="btn btn-ghost" onClick={() => setSelectedItems(new Set())} style={{ padding: '4px 8px', fontSize: '13px' }}>取消</button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => { setBatchLocationId(''); setShowBatchMoveModal(true) }}>
              <MapPin size={16}/> 批量移动
            </button>
            <button className="btn btn-danger" onClick={handleBatchDelete}>
              <Trash2 size={16}/> 批量删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
