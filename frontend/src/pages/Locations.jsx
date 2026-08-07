import { useState, useCallback } from 'react'
import { locationApi } from '../api'
import { Plus, MapPin, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { buildLocationTreeOptions } from '../utils/tree'
import AuthImage from '../components/AuthImage'
import { Button, Card, FormField, PageHeader, Skeleton } from '../components/ui'
import { useSWR, invalidateSWRCache } from '../utils/swrCache'

const initialForm = { name: '', description: '', parentId: '', imageUrl: '' }

function TreeNode({ node, allLocations, onEdit, onDelete }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="tree-node">
      <div className="location-node">
        {hasChildren ? (
          <button className="location-node__toggle" type="button" aria-expanded={open} aria-label={`${open ? '收起' : '展开'}位置 ${node.name}`} onClick={() => setOpen((value) => !value)}>
            {open ? <ChevronDown size={16} aria-hidden="true"/> : <ChevronRight size={16} aria-hidden="true"/>}
          </button>
        ) : <span className="location-node__spacer" aria-hidden="true" />}
        <div className="location-node__icon">
          {node.imageUrl
            ? <AuthImage src={node.imageUrl} alt={`${node.name} 位置图片`} fallback={<MapPin size={15}/>} className="location-node__photo"/>
            : <MapPin size={15} aria-hidden="true"/>
          }
        </div>
        <div className="location-node__identity">
          <div className="location-node__header">
            <strong>{node.name}</strong>
            <span className="count-badge">{node.itemCount} 件</span>
          </div>
          {node.description && <span>{node.description}</span>}
        </div>
        <div className="location-node__actions">
          <Button variant="ghost" size="icon" onClick={() => onEdit(node)} aria-label={`编辑位置 ${node.name}`}><Pencil size={16}/></Button>
          <Button variant="danger" size="icon" onClick={() => onDelete(node)} aria-label={`删除位置 ${node.name}`}><Trash2 size={16}/></Button>
        </div>
      </div>
      {hasChildren && open && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} allLocations={allLocations} onEdit={onEdit} onDelete={onDelete}/>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Locations() {
  const fetcher = useCallback(async () => {
    const [tr, ar] = await Promise.all([locationApi.getTree(), locationApi.getAll()])
    return { tree: tr.data || [], all: buildLocationTreeOptions(ar.data || []) }
  }, [])

  const { data: locData, loading, revalidate } = useSWR('locations', fetcher)
  const tree = locData?.tree || []
  const allLocations = locData?.all || []

  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(initialForm)
  const [saving, setSaving]         = useState(false)

  const openCreate = () => { setEditing(null); setForm(initialForm); setShowModal(true) }
  const openEdit = (loc) => {
    setEditing(loc)
    setForm({ name: loc.name, description: loc.description||'', parentId: loc.parentId||'', imageUrl: loc.imageUrl||'' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('请输入位置名称'); return }
    setSaving(true)
    try {
      const payload = { ...form, parentId: form.parentId ? Number(form.parentId) : null }
      if (editing) { await locationApi.update(editing.id, payload); toast.success('位置更新成功') }
      else { await locationApi.create(payload); toast.success('位置创建成功') }
      invalidateSWRCache('locations')
      setShowModal(false)
      revalidate()
    } finally { setSaving(false) }
  }

  const handleDelete = async (loc) => {
    if (!window.confirm(`确认删除「${loc.name}」？子位置将变为顶级位置。`)) return
    await locationApi.delete(loc.id)
    toast.success('删除成功')
    invalidateSWRCache('locations')
    revalidate()
  }

  return (
    <div className="page-content locations-page">
      <PageHeader
        icon={<MapPin size={22}/>}
        eyebrow="家庭档案 · 空间索引"
        title="收纳位置"
        subtitle={`共 ${allLocations.length} 个位置`}
        actions={<Button type="button" icon={<Plus size={16}/>} onClick={openCreate}>添加位置</Button>}
      />

      {loading ? (
        <div className="location-skeletons" role="status" aria-label="正在加载收纳位置">
          {[1,2,3].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : tree.length === 0 ? (
        <div className="card">
          <EmptyState icon={MapPin} title="暂无收纳位置" desc="添加您家中的收纳位置，如客厅、卧室、厨房等"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加位置</button>}/>
        </div>
      ) : (
        <Card className="location-tree">
          {tree.map(node => (
            <TreeNode key={node.id} node={node} allLocations={allLocations} onEdit={openEdit} onDelete={handleDelete}/>
          ))}
        </Card>
      )}

      {showModal && (
        <Modal title={editing ? '编辑位置' : '添加位置'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <FormField id="location-name" label="位置名称" required>
            <input className="input" placeholder="如：客厅、卧室抽屉..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </FormField>
          <FormField id="location-parent" label="上级位置（可选）">
            <select className="input" value={form.parentId}
              onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
              <option value="">无（顶级位置）</option>
              {allLocations.filter(l => !editing || l.id !== editing.id).map(l =>
                <option key={l.id} value={l.id}>{l.treeName}</option>
              )}
            </select>
          </FormField>
          <FormField id="location-description" label="描述">
            <textarea className="input" placeholder="位置描述（可选）" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </FormField>
          <FormField id="location-image" label="图片">
            <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))}/>
          </FormField>
        </Modal>
      )}
    </div>
  )
}
