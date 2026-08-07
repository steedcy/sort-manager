import { useState, useCallback } from 'react'
import { categoryApi } from '../api'
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Button, Card, FormField, PageHeader, Skeleton } from '../components/ui'
import { useSWR, invalidateSWRCache } from '../utils/swrCache'

const DEFAULT_CATEGORY_COLOR = '#00a6f4'
const COLORS = ['#00a6f4', '#9a641c', '#3f6f8f', '#725a83', '#9b4d4d', '#6f7835', '#3f7770', '#8a5c3d', '#16a34a', '#46534b']
const initialForm = { name: '', icon: 'Package', color: DEFAULT_CATEGORY_COLOR }

export default function Categories() {
  const fetcher = useCallback(() => categoryApi.getAll(), [])
  const { data: rawCategories, loading, revalidate } = useSWR('categories', fetcher)
  const categories = rawCategories || []

  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(initialForm)
  const [saving, setSaving]         = useState(false)

  const openCreate = () => { setEditing(null); setForm(initialForm); setShowModal(true) }
  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, icon: cat.icon||'Package', color: cat.color||'#00a6f4' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('请输入分类名称'); return }
    setSaving(true)
    try {
      if (editing) { await categoryApi.update(editing.id, form); toast.success('分类更新成功') }
      else { await categoryApi.create(form); toast.success('分类创建成功') }
      invalidateSWRCache('categories')
      setShowModal(false)
      revalidate()
    } finally { setSaving(false) }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`确认删除「${cat.name}」？该分类下的物品将变为未分类。`)) return
    await categoryApi.delete(cat.id)
    toast.success('删除成功')
    invalidateSWRCache('categories')
    revalidate()
  }

  return (
    <div className="page-content categories-page">
      <PageHeader
        icon={<Tag size={22} />}
        eyebrow="家庭档案 · 分类索引"
        title="分类管理"
        subtitle={`共 ${categories.length} 个分类`}
        actions={<Button type="button" icon={<Plus size={16} />} onClick={openCreate}>添加分类</Button>}
      />

      {loading ? (
        <div className="category-grid" role="status" aria-label="正在加载分类">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState icon={Tag} title="暂无分类" desc="添加物品分类方便整理"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加分类</button>}/>
        </Card>
      ) : (
        <div className="category-grid">
          {categories.map(cat => (
            <Card key={cat.id} className="category-card" style={{ '--category-color': cat.color || DEFAULT_CATEGORY_COLOR }}>
              <div className="category-card__identity">
                <div className="category-card__icon"><Tag size={20} aria-hidden="true"/></div>
                <div>
                  <strong>{cat.name}</strong>
                  <span>{cat.itemCount} 件物品</span>
                </div>
              </div>
              <div className="category-color">
                <span aria-hidden="true" />
                <code>{cat.color || DEFAULT_CATEGORY_COLOR}</code>
              </div>
              <div className="category-card__actions">
                <Button variant="secondary" size="sm" icon={<Pencil size={14}/>} onClick={() => openEdit(cat)}>编辑</Button>
                <Button variant="danger" size="icon" onClick={() => handleDelete(cat)} aria-label={`删除分类 ${cat.name}`}><Trash2 size={16}/></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '编辑分类' : '添加分类'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <FormField id="category-name" label="分类名称" required>
            <input className="input" placeholder="如：电子产品、衣物..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </FormField>
          <FormField id="category-color" label="颜色">
            <div className="category-palette" id="category-color" role="group" aria-label="选择分类颜色">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={form.color === c ? 'is-selected' : ''}
                  aria-label={`选择颜色 ${c}`}
                  aria-pressed={form.color === c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ '--category-color': c }}
                />
              ))}
            </div>
          </FormField>
          <FormField id="category-preview" label="预览效果">
            <div className="category-preview" id="category-preview" style={{ '--category-color': form.color || DEFAULT_CATEGORY_COLOR }}>
              <span className="category-preview__icon"><Tag size={18} aria-hidden="true"/></span>
              <strong>{form.name || '分类名称'}</strong>
              <span className="category-chip">预览</span>
            </div>
          </FormField>
        </Modal>
      )}
    </div>
  )
}
