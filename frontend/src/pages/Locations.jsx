import { useEffect, useState } from 'react'
import { locationApi } from '../api'
import { Plus, MapPin, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { buildLocationTreeOptions } from '../utils/tree'
import AuthImage from '../components/AuthImage'

const initialForm = { name: '', description: '', parentId: '', imageUrl: '' }

function TreeNode({ node, allLocations, onEdit, onDelete }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="tree-node">
      <div className="tree-node-header" onClick={() => hasChildren && setOpen(o => !o)}>
        <div style={{ width:'20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {hasChildren
            ? (open ? <ChevronDown size={14} color="#6366f1"/> : <ChevronRight size={14} color="#6366f1"/>)
            : <div style={{ width:'14px' }}/>
          }
        </div>
        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--bg-tag)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {node.imageUrl
            ? <AuthImage src={node.imageUrl} alt={`${node.name} 位置图片`} fallback={<MapPin size={14} color="#6366f1"/>}
                style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px' }}/>
            : <MapPin size={14} color="#6366f1"/>
          }
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'14px', fontWeight:'600', color:'var(--text-primary)' }}>{node.name}</div>
          {node.description && (
            <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{node.description}</div>
          )}
        </div>
        <span style={{ fontSize:'12px', color:'var(--text-muted)', background:'var(--bg-tag)',
          padding:'2px 8px', borderRadius:'20px', marginRight:'8px' }}>
          {node.itemCount} 件
        </span>
        <button className="btn btn-secondary" onClick={e => { e.stopPropagation(); onEdit(node) }}
          aria-label={`编辑位置 ${node.name}`} style={{ padding:'5px 8px', fontSize:'12px', marginRight:'4px' }}><Pencil size={12}/></button>
        <button className="btn btn-danger" onClick={e => { e.stopPropagation(); onDelete(node) }}
          aria-label={`删除位置 ${node.name}`} style={{ padding:'5px 8px' }}><Trash2 size={12}/></button>
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
  const [tree, setTree]             = useState([])
  const [allLocations, setAll]      = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(initialForm)
  const [saving, setSaving]         = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [tr, ar] = await Promise.all([locationApi.getTree(), locationApi.getAll()])
      setTree(tr.data || [])
      setAll(buildLocationTreeOptions(ar.data || []))
    } finally { setLoading(false) }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      try {
        const [tr, ar] = await Promise.all([locationApi.getTree(), locationApi.getAll()])
        if (!cancelled) {
          setTree(tr.data || [])
          setAll(buildLocationTreeOptions(ar.data || []))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInitial()
    return () => { cancelled = true }
  }, [])

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
      setShowModal(false); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (loc) => {
    if (!window.confirm(`确认删除「${loc.name}」？子位置将变为顶级位置。`)) return
    await locationApi.delete(loc.id); toast.success('删除成功'); load()
  }

  return (
    <div className="page-content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <div className="page-title-line"><MapPin size={24} aria-hidden="true" /><h1 className="page-title">收纳位置</h1></div>
          <p className="page-subtitle">共 {allLocations.length} 个位置</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加位置</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:'60px', borderRadius:'12px' }}/>)}
        </div>
      ) : tree.length === 0 ? (
        <div className="card">
          <EmptyState icon={MapPin} title="暂无收纳位置" desc="添加您家中的收纳位置，如客厅、卧室、厨房等"
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> 添加位置</button>}/>
        </div>
      ) : (
        <div className="card" style={{ padding:'16px' }}>
          {tree.map(node => (
            <TreeNode key={node.id} node={node} allLocations={allLocations} onEdit={openEdit} onDelete={handleDelete}/>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '编辑位置' : '添加位置'}
          onClose={() => setShowModal(false)} onSubmit={handleSave} loading={saving}>
          <div className="input-group">
            <label className="input-label">位置名称 *</label>
            <input className="input" placeholder="如：客厅、卧室抽屉..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div className="input-group">
            <label className="input-label">上级位置（可选）</label>
            <select className="input" value={form.parentId}
              onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
              <option value="">无（顶级位置）</option>
              {allLocations.filter(l => !editing || l.id !== editing.id).map(l =>
                <option key={l.id} value={l.id}>{l.treeName}</option>
              )}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">描述</label>
            <textarea className="input" placeholder="位置描述（可选）" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </div>
          <div className="input-group">
            <label className="input-label">图片</label>
            <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))}/>
          </div>
        </Modal>
      )}
    </div>
  )
}
