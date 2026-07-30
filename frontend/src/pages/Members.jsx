import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, LogOut, Plus, ShieldCheck, UserRound, UserRoundCheck, UserRoundX, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { memberApi } from '../api'
import { useAuth } from '../context/AuthContext'
import EmptyState from '../components/EmptyState'

const initialForm = { username: '', displayName: '', password: '', role: 'MEMBER' }
const roleLabel = (role) => role === 'OWNER' ? '管理员' : '家庭成员'

export default function Members() {
  const { user } = useAuth()
  const formHeadingRef = useRef(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [revokingId, setRevokingId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [loadError, setLoadError] = useState('')

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await memberApi.getAll()
      setMembers(response.data || [])
    } catch {
      setLoadError('家庭成员加载失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    memberApi.getAll()
      .then((response) => {
        if (active) setMembers(response.data || [])
      })
      .catch(() => {
        if (active) setLoadError('家庭成员加载失败，请稍后重试。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const openForm = () => {
    setForm(initialForm)
    setFormError('')
    setShowPassword(false)
    setShowForm(true)
    requestAnimationFrame(() => formHeadingRef.current?.focus())
  }

  const closeForm = () => {
    setShowForm(false)
    setFormError('')
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!form.username.trim() || !form.displayName.trim()) {
      setFormError('请填写用户名和显示名称。')
      return
    }
    if (form.password.length < 10) {
      setFormError('初始密码至少需要 10 个字符。')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await memberApi.create({ ...form, username: form.username.trim(), displayName: form.displayName.trim() })
      toast.success('家庭成员已添加')
      closeForm()
      await load()
    } catch (error) {
      setFormError(error.response?.data?.message || '成员添加失败，请检查填写内容。')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (member) => {
    const memberId = member.id ?? member.userId
    const nextEnabled = !member.enabled
    if (!nextEnabled && !window.confirm(`确认停用「${member.displayName}」？该成员的现有会话将失效。`)) return

    setUpdatingId(memberId)
    try {
      await memberApi.updateStatus(memberId, nextEnabled)
      toast.success(nextEnabled ? '成员账号已启用' : '成员账号已停用')
      await load()
    } catch {
      toast.error('成员状态更新失败，请稍后重试。')
    } finally {
      setUpdatingId(null)
    }
  }

  const revokeSessions = async (member) => {
    const memberId = member.id ?? member.userId
    if (!window.confirm(`确认撤销「${member.displayName}」的全部会话？该成员需要重新登录。`)) return
    setRevokingId(memberId)
    try {
      await memberApi.revokeSessions(memberId)
      toast.success('该成员的全部会话已撤销')
    } catch {
      toast.error('会话撤销失败，请稍后重试。')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="page-content members-page">
      <header className="page-heading-row">
        <div>
          <div className="page-title-line">
            <ShieldCheck size={24} aria-hidden="true" />
            <h1 className="page-title">家庭成员</h1>
          </div>
          <p className="page-subtitle">管理可以访问「{user.householdName || '默认家庭'}」的账号</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" type="button" onClick={openForm} aria-label="添加成员">
            <Plus size={18} />添加家庭成员
          </button>
        )}
      </header>

      {showForm && (
        <section className="card member-form-card member-create-card" aria-labelledby="member-form-title">
          <div className="member-form-heading">
            <div>
              <h2 id="member-form-title" tabIndex="-1" ref={formHeadingRef}>添加家庭成员</h2>
              <p>创建后把用户名和初始密码安全地告诉家人。</p>
            </div>
            <button className="btn btn-ghost icon-button" type="button" onClick={closeForm} aria-label="取消添加成员">
              <X size={18} />
            </button>
          </div>

          <form className="member-form" onSubmit={handleCreate} noValidate>
            <div className="input-group">
              <label className="input-label" htmlFor="member-username">用户名 *</label>
              <input id="member-username" className="input" autoComplete="off" autoCapitalize="none" spellCheck="false"
                value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="member-display-name">显示名称 *</label>
              <input id="member-display-name" className="input" autoComplete="off"
                value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="member-role">家庭角色 *</label>
              <select id="member-role" className="input" value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="MEMBER">家庭成员</option>
                <option value="OWNER">管理员</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="member-password">初始密码 *</label>
              <div className="password-field">
                <input id="member-password" className="input" type={showPassword ? 'text' : 'password'} minLength="10"
                  autoComplete="new-password" aria-describedby="member-password-help" value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? '隐藏初始密码' : '显示初始密码'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span id="member-password-help" className="input-help">至少 10 个字符，建议混合字母、数字和符号。</span>
            </div>
            {formError && <p className="form-error member-form-error" role="alert">{formError}</p>}
            <div className="member-form-actions">
              <button className="btn btn-ghost" type="button" onClick={closeForm}>取消</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="button-spinner" aria-hidden="true" /> : <Plus size={18} />}
                {saving ? '正在添加…' : '添加成员'}
              </button>
            </div>
          </form>
        </section>
      )}

      {loadError && !loading ? (
        <div className="card form-error" role="alert">
          {loadError} <button className="btn btn-secondary" type="button" onClick={load}>重新加载</button>
        </div>
      ) : loading ? (
        <div className="member-loading" role="status" aria-label="正在加载家庭成员">
          {[1, 2, 3].map((item) => <div className="skeleton" key={item} />)}
        </div>
      ) : members.length === 0 ? (
        <div className="card">
          <EmptyState icon={UserRound} title="还没有家庭成员" desc="添加家人的独立账号，避免多人共享密码。"
            action={<button className="btn btn-primary" type="button" onClick={openForm}><Plus size={18} />添加家庭成员</button>} />
        </div>
      ) : (
        <section className="card member-list members-list" aria-labelledby="member-list-title">
          <h2 id="member-list-title" className="sr-only">家庭成员列表</h2>
          <div className="members-table-wrap">
            <table className="members-table">
              <thead><tr><th scope="col">成员</th><th scope="col">角色</th><th scope="col">状态</th><th scope="col">操作</th></tr></thead>
              <tbody>
                {members.map((member) => {
                  const memberId = member.id
                  const isCurrent = (member.userId ?? member.id) === user.id
                  return (
                    <tr key={memberId}>
                      <td><MemberIdentity member={member} isCurrent={isCurrent} /></td>
                      <td><span className={`role-badge role-${member.role?.toLowerCase()}`}>{roleLabel(member.role)}</span></td>
                      <td><StatusLabel enabled={member.enabled} /></td>
                      <td><div className="member-row-actions"><SessionButton member={member} isCurrent={isCurrent} busy={revokingId === memberId} onClick={() => revokeSessions(member)} /><StatusButton member={member} isCurrent={isCurrent} busy={updatingId === memberId} onClick={() => updateStatus(member)} /></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="member-cards">
            {members.map((member) => {
              const memberId = member.id
              const isCurrent = (member.userId ?? member.id) === user.id
              return (
                <article className="member-card" key={memberId}>
                  <MemberIdentity member={member} isCurrent={isCurrent} />
                  <div className="member-card-meta">
                    <span className={`role-badge role-${member.role?.toLowerCase()}`}>{roleLabel(member.role)}</span>
                    <StatusLabel enabled={member.enabled} />
                  </div>
                  <div className="member-row-actions"><SessionButton member={member} isCurrent={isCurrent} busy={revokingId === memberId} onClick={() => revokeSessions(member)} /><StatusButton member={member} isCurrent={isCurrent} busy={updatingId === memberId} onClick={() => updateStatus(member)} /></div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function MemberIdentity({ member, isCurrent }) {
  return (
    <div className="member-identity">
      <span className="member-avatar" aria-hidden="true"><UserRound size={19} /></span>
      <div><strong>{member.displayName}</strong><span>@{member.username}{isCurrent ? ' · 当前账号' : ''}</span></div>
    </div>
  )
}

function StatusLabel({ enabled }) {
  return (
    <span className={`status-label ${enabled ? 'is-enabled' : 'is-disabled'}`}>
      {enabled ? <UserRoundCheck size={15} /> : <UserRoundX size={15} />}
      {enabled ? '已启用' : '已停用'}
    </span>
  )
}

function StatusButton({ member, isCurrent, busy, onClick }) {
  return (
    <button className={`btn ${member.enabled ? 'btn-danger' : 'btn-secondary'} member-status-button`} type="button"
      disabled={isCurrent || busy} onClick={onClick}
      title={isCurrent ? '不能停用当前账号' : undefined}>
      {busy ? <span className="button-spinner" aria-hidden="true" /> : null}
      {busy ? '处理中…' : member.enabled ? '停用账号' : '启用账号'}
    </button>
  )
}

function SessionButton({ member, isCurrent, busy, onClick }) {
  return (
    <button className="btn btn-danger member-session-button" type="button" disabled={isCurrent || busy || !member.enabled} onClick={onClick}
      title={isCurrent ? '不能在这里撤销当前账号会话' : !member.enabled ? '账号已停用' : undefined}>
      {busy ? <span className="button-spinner" aria-hidden="true" /> : <LogOut size={16} />}
      {busy ? '撤销中…' : '撤销会话'}
    </button>
  )
}
