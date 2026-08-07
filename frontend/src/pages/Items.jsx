import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
  ArchiveRestore,
  Download,
  Printer,
} from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { buildLocationTreeOptions } from '../utils/tree'
import AuthImage from '../components/AuthImage'
import { Card, PageHeader, Pagination, Skeleton, StatusBadge, Toolbar } from '../components/ui'
import { exportItemsToExcel, printItemsReport } from '../utils/exporter'
import VirtualGrid from '../components/VirtualGrid'
import { useSWR, invalidateSWRCache } from '../utils/swrCache'

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

  const fetcher = useCallback(async () => {
    const [ir, cr, lr] = await Promise.all([
      itemApi.getAll(buildParams()),
      categoryApi.getAll(),
      locationApi.getAll(),
    ])
    return {
      pageData: ir.data || initialPage,
      categories: cr.data || [],
      locations: buildLocationTreeOptions(lr.data || []),
    }
  }, [buildParams])

  const swrKey = ['items', buildParams()]
  const { data: swrData, loading, revalidate } = useSWR(swrKey, fetcher)

  const pageData = swrData?.pageData || initialPage
  const items = pageData.content || []
  const categories = swrData?.categories || []
  const locations = swrData?.locations || []

  const load = useCallback(() => {
    invalidateSWRCache('items')
    return revalidate()
  }, [revalidate])

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
      invalidateSWRCache('items')
      invalidateSWRCache('dashboard')
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`确认将「${item.name}」移入回收站？之后可由家庭管理员恢复。`)) return
    await itemApi.delete(item.id)
    toast.success('已移入回收站')
    invalidateSWRCache('items')
    invalidateSWRCache('dashboard')
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
    if (!window.confirm(`确认将选中的 ${selectedItems.size} 件物品移入回收站？`)) return
    setLoading(true)
    try {
      await Promise.all(Array.from(selectedItems).map(id => itemApi.delete(id)))
      toast.success('选中物品已移入回收站')
      setSelectedItems(new Set())
      load()
    } catch {
      toast.error('部分物品未能移入回收站')
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
    <div className="page-content items-page">
      <PageHeader
        icon={<Package size={22}/>}
        eyebrow="家庭档案 · 物品目录"
        title="物品管理"
        subtitle={`共 ${pageData.totalElements} 件物品，当前显示 ${items.length} 件`}
        actions={<>
          <button className="btn btn-secondary" type="button" onClick={() => exportItemsToExcel(items)}><Download size={16}/> 导出 Excel</button>
          <button className="btn btn-secondary" type="button" onClick={() => printItemsReport(items)}><Printer size={16}/> 打印/PDF</button>
          <Link className="btn btn-secondary" to="/items/bulk"><ArchiveRestore size={16}/> 批量录入</Link>
          <button className="btn btn-primary" type="button" onClick={openCreate}><Plus size={16}/> 添加物品</button>
        </>}
      />

      <Toolbar className="items-toolbar item-toolbar">
        <div className="search-bar">
          <Search className="search-icon" size={16}/>
          <input className="input" placeholder="搜索物品名称或描述..." aria-label="搜索物品名称或描述" value={keyword}
            onChange={updateFilter(setKeyword)}/>
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
      </Toolbar>

      {loading ? (
        <div className="items-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="暂无物品" desc="点击右上角按钮添加物品"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加物品</button>}/>
        </div>
      ) : (
        <VirtualGrid
          items={items}
          className="items-grid"
          renderItem={item => {
            const isSelected = selectedItems.has(item.id)
            return (
              <Card key={item.id} data-testid="item-card" className={`item-card ${isSelected ? 'item-card--selected' : ''}`}>
                <button
                  type="button"
                  aria-label={isSelected ? `取消选择 ${item.name}` : `选择 ${item.name}`}
                  className="item-select-button"
                  onClick={() => toggleSelect(item.id)}
                >
                  {isSelected ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="var(--text-muted)" />}
                </button>
                {item.imageUrl
                  ? <AuthImage src={item.imageUrl} alt={`${item.name} 图片`} className="item-image"
                      fallback={<div className="item-image-placeholder"><Package size={32}/></div>} />
                  : <div className="item-image-placeholder"><Package size={32}/></div>}
                <div className="item-card__body">
                  <div className="item-card__heading">
                    <strong>{item.name}</strong>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {item.status === '过期' ? (
                        <StatusBadge tone="danger">已过期</StatusBadge>
                      ) : item.status === '临期' ? (
                        <StatusBadge tone="warning">临期</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">正常</StatusBadge>
                      )}
                      {(item.isLowStock || item.quantity <= 2) && (
                        <StatusBadge tone="warning">低库存</StatusBadge>
                      )}
                    </div>
                  </div>

                  {item.locationPath && (
                    <div className="item-card__location">
                      <MapPin size={11}/> {item.locationPath}
                    </div>
                  )}

                  <div className="item-card__meta">
                    单价：￥{item.price?.toFixed(2) || '0.00'} · 总计：￥{item.totalPrice?.toFixed(2) || '0.00'}
                  </div>

                  <div className="item-card__meta">
                    购入：{item.purchaseDate} {item.expiryDate && `· 到期：${item.expiryDate}`}
                  </div>

                  <div className="item-card__footer">
                    {item.categoryName
                      ? <span className="category-chip" style={{ '--category-color': item.categoryColor || 'var(--color-primary)' }}>{item.categoryName}</span>
                      : <span/>
                    }
                    <span className="item-card__quantity">×{item.quantity}</span>
                  </div>
                </div>
                <div className="item-card__actions">
                  <button className="btn btn-secondary" onClick={() => openEdit(item)}>
                    <Pencil size={13}/> 编辑
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item)} aria-label={`将 ${item.name} 移入回收站`} title="移入回收站">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </Card>
            )
          }}
        />
      )}

      {!loading && pageData.totalPages > 0 && (
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={pageData.totalElements}
          pageSize={size} onPageChange={setPage} onPageSizeChange={(nextSize) => { setSize(nextSize); setPage(0) }}/>
      )}

      {showModal && (
        <Modal title={editing ? '编辑物品' : '添加物品'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <div className="input-group">
            <label className="input-label" htmlFor="item-name">物品名称 *</label>
            <input id="item-name" className="input" placeholder="如：充电宝、螺丝刀..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div className="form-grid">
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
        <div className="batch-action-bar batch-action-dock">
          <div className="batch-action-dock__summary">
            <strong>已选择 {selectedItems.size} 项</strong>
            <button className="btn btn-ghost" onClick={() => setSelectedItems(new Set())}>取消</button>
          </div>
          <div className="batch-action-dock__actions">
            <button className="btn btn-primary" onClick={() => { setBatchLocationId(''); setShowBatchMoveModal(true) }}>
              <MapPin size={16}/> 批量移动
            </button>
            <button className="btn btn-danger" onClick={handleBatchDelete}>
              <Trash2 size={16}/> 移入回收站
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
