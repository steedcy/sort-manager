import { useEffect, useState, useCallback } from 'react'
import { itemApi, categoryApi, locationApi } from '../api'
import {
  Plus,
  Search,
  Package,
  MapPin,
  Pencil,
  Trash2,
  X,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { buildLocationTreeOptions } from '../utils/tree'

const today = new Date().toISOString().split('T')[0]

const initialForm = {
  name: '',
  description: '',
  quantity: 1,
  price: 0,
  purchaseDate: today,
  expiryDate: '',
  categoryId: '',
  locationId: '',
  imageUrl: '',
}

const initialPage = {
  content: [],
  page: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  empty: true,
}

export default function Items() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(12)
  const [sort, setSort] = useState('createdAt')
  const [direction, setDirection] = useState('desc')
  const [pageData, setPageData] = useState(initialPage)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false)
  const [batchLocationId, setBatchLocationId] = useState('')

  const buildParams = useCallback(() => {
    const params = { page, size, sort, direction }
    if (keyword) params.keyword = keyword
    if (filterCategory) params.categoryId = filterCategory
    if (filterLocation) params.locationId = filterLocation
    if (filterStatus) params.status = filterStatus
    return params
  }, [keyword, filterCategory, filterLocation, filterStatus, page, size, sort, direction])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ir, cr, lr] = await Promise.all([
        itemApi.getAll(buildParams()),
        categoryApi.getAll(),
        locationApi.getAll(),
      ])
      const nextPage = ir.data || initialPage
      if ((nextPage.content || []).length === 0 && nextPage.totalElements > 0 && page > 0) {
        setPage(Math.max(0, nextPage.totalPages - 1))
        return
      }
      setPageData(nextPage)
      setItems(nextPage.content || [])
      setCategories(cr.data || [])
      setLocations(buildLocationTreeOptions(lr.data || []))
      setSelectedItems(new Set())
    } finally {
      setLoading(false)
    }
  }, [buildParams, page])

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      try {
        const [ir, cr, lr] = await Promise.all([
          itemApi.getAll(buildParams()),
          categoryApi.getAll(),
          locationApi.getAll(),
        ])
        if (!cancelled) {
          const nextPage = ir.data || initialPage
          if ((nextPage.content || []).length === 0 && nextPage.totalElements > 0 && page > 0) {
            setPage(Math.max(0, nextPage.totalPages - 1))
            return
          }
          setPageData(nextPage)
          setItems(nextPage.content || [])
          setCategories(cr.data || [])
          setLocations(buildLocationTreeOptions(lr.data || []))
          setSelectedItems(new Set())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInitial()
    return () => { cancelled = true }
  }, [buildParams, page])

  const updateFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(0)
  }

  const clearFilters = () => {
    setKeyword('')
    setFilterCategory('')
    setFilterLocation('')
    setFilterStatus('')
    setSort('createdAt')
    setDirection('desc')
    setPage(0)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      price: item.price || 0,
      purchaseDate: item.purchaseDate || today,
      expiryDate: item.expiryDate || '',
      categoryId: item.categoryId || '',
      locationId: item.locationId || '',
      imageUrl: item.imageUrl || '',
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
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 1,
        price: Number(form.price) || 0,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        locationId: form.locationId ? Number(form.locationId) : null,
      }
      if (editing) {
        await itemApi.update(editing.id, payload)
        toast.success('物品更新成功')
      } else {
        await itemApi.create(payload)
        toast.success('物品添加成功')
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`确认删除「${item.name}」？`)) return
    await itemApi.delete(item.id)
    toast.success('删除成功')
    load()
  }

  const toggleSelect = (id) => {
    setSelectedItems(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBatchDelete = async () => {
    if (!window.confirm(`确认删除选中的 ${selectedItems.size} 件物品？`)) return
    setLoading(true)
    try {
      await Promise.all(Array.from(selectedItems).map(id => itemApi.delete(id)))
      toast.success('批量删除成功')
      setSelectedItems(new Set())
      load()
    } catch {
      toast.error('部分删除失败')
      setLoading(false)
    }
  }

  const handleBatchMove = async () => {
    if (!batchLocationId) { toast.error('请选择目标位置'); return }
    setSaving(true)
    try {
      const locId = Number(batchLocationId)
      const itemsToUpdate = items.filter(i => selectedItems.has(i.id))
      await Promise.all(itemsToUpdate.map(item => itemApi.update(item.id, { ...item, locationId: locId })))
      toast.success('批量移动成功')
      setShowBatchMoveModal(false)
      setSelectedItems(new Set())
      load()
    } catch {
      toast.error('部分移动失败')
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">📦 物品管理</h1>
          <p className="page-subtitle">共 {pageData.totalElements} 件物品，当前显示 {items.length} 件</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加物品</button>
      </div>

      <div className="items-toolbar">
        <div className="search-bar">
          <Search className="search-icon" size={16}/>
          <input className="input" placeholder="搜索物品名称或描述..." aria-label="搜索物品名称或描述" value={keyword}
            onChange={updateFilter(setKeyword)} style={{ paddingLeft: '38px' }}/>
        </div>
        <select className="input items-toolbar-control"
          value={filterCategory} onChange={updateFilter(setFilterCategory)} aria-label="按分类筛选">
          <option value="">全部分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input items-toolbar-control"
          value={filterLocation} onChange={updateFilter(setFilterLocation)} aria-label="按位置筛选">
          <option value="">全部位置</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.treeName}</option>)}
        </select>
        <select className="input items-toolbar-control"
          value={filterStatus} onChange={updateFilter(setFilterStatus)} aria-label="按状态筛选">
          <option value="">全部状态</option>
          <option value="normal">正常</option>
          <option value="expiring">30天内到期</option>
          <option value="expired">已过期</option>
        </select>
        <select className="input items-toolbar-control"
          value={sort} onChange={updateFilter(setSort)} aria-label="排序字段">
          <option value="createdAt">创建时间</option>
          <option value="updatedAt">更新时间</option>
          <option value="name">名称</option>
          <option value="quantity">数量</option>
          <option value="price">单价</option>
          <option value="purchaseDate">购入日期</option>
          <option value="expiryDate">有效期</option>
        </select>
        <select className="input items-toolbar-control"
          value={direction} onChange={updateFilter(setDirection)} aria-label="排序方向">
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
        {(keyword || filterCategory || filterLocation || filterStatus || sort !== 'createdAt' || direction !== 'desc') && (
          <button className="btn btn-ghost" onClick={clearFilters}>
            <X size={14}/> 清除
          </button>
        )}
      </div>

      {loading ? (
        <div className="items-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }}/>)}
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
              <div key={item.id} data-testid="item-card" className="card item-card" style={{ position: 'relative', border: isSelected ? '2px solid var(--primary)' : undefined }}>
                <button
                  type="button"
                  aria-label={isSelected ? `取消选择 ${item.name}` : `选择 ${item.name}`}
                  className="item-select-button"
                  onClick={() => toggleSelect(item.id)}
                >
                  {isSelected ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="var(--text-muted)" />}
                </button>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="item-image"/>
                  : <div className="item-image-placeholder"><Package size={32}/></div>
                }
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {item.name}
                    </div>
                    {item.status === '过期' ? (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626' }}>已过期</span>
                    ) : item.status === '临期' ? (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#d97706' }}>临期</span>
                    ) : (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a' }}>正常</span>
                    )}
                  </div>

                  {item.locationPath && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
                      color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <MapPin size={11}/> {item.locationPath}
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginBottom: '6px' }}>
                    💰 单价: ￥{item.price?.toFixed(2) || '0.00'} | 总计: ￥{item.totalPrice?.toFixed(2) || '0.00'}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '6px' }}>
                    📅 购入: {item.purchaseDate} {item.expiryDate && `| 过期: ${item.expiryDate}`}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {item.categoryName
                      ? <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                          background: item.categoryColor ? `${item.categoryColor}22` : 'var(--bg-tag)',
                          color: item.categoryColor || '#6366f1' }}>{item.categoryName}</span>
                      : <span/>
                    }
                    <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>×{item.quantity}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-default)', paddingTop: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => openEdit(item)}
                    style={{ flex: 1, padding: '7px', fontSize: '12px' }}>
                    <Pencil size={13}/> 编辑
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item)} style={{ padding: '7px 10px' }} aria-label={`删除 ${item.name}`}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && pageData.totalPages > 0 && (
        <nav className="pagination-bar" aria-label="物品分页">
          <div className="pagination-summary">
            第 {pageData.page + 1} / {pageData.totalPages} 页，共 {pageData.totalElements} 件
          </div>
          <div className="pagination-controls">
            <select className="input pagination-size" value={size}
              onChange={e => { setSize(Number(e.target.value)); setPage(0) }} aria-label="每页数量">
              <option value={12}>每页 12</option>
              <option value={24}>每页 24</option>
              <option value={48}>每页 48</option>
            </select>
            <button className="btn btn-secondary" disabled={pageData.first}
              onClick={() => setPage(current => Math.max(0, current - 1))}>
              <ChevronLeft size={16}/> 上一页
            </button>
            <button className="btn btn-secondary" disabled={pageData.last}
              onClick={() => setPage(current => current + 1)}>
              下一页 <ChevronRight size={16}/>
            </button>
          </div>
        </nav>
      )}

      {showModal && (
        <Modal title={editing ? '编辑物品' : '添加物品'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <div className="input-group">
            <label className="input-label" htmlFor="item-name">物品名称 *</label>
            <input id="item-name" className="input" placeholder="如：充电宝、螺丝刀..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="item-category">分类</label>
              <select id="item-category" className="input" value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">未分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="item-quantity">数量 *</label>
              <input id="item-quantity" className="input" type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}/>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="item-price">单价 (元) *</label>
              <input id="item-price" className="input" type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}/>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="item-purchase-date">购入日期 *</label>
              <input id="item-purchase-date" className="input" type="date" value={form.purchaseDate}
                onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}/>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="item-expiry-date">有效期至</label>
              <input id="item-expiry-date" className="input" type="date" value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}/>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="item-location">存放位置 *</label>
            <select id="item-location" className="input" value={form.locationId}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}>
              <option value="">请选择存放位置</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.treeName}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="item-description">描述</label>
            <textarea id="item-description" className="input" placeholder="物品描述（可选）" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </div>
          <div className="input-group">
            <label className="input-label">图片</label>
            <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))}/>
          </div>
        </Modal>
      )}

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

      {selectedItems.size > 0 && (
        <div className="batch-action-bar">
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
