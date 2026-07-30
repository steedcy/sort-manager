import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArchiveRestore, ChevronLeft, ChevronRight, DatabaseBackup, RefreshCw, ShieldCheck, Trash2, UserRoundCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { operationsApi } from '../api'
import EmptyState from '../components/EmptyState'
import { ACTION_LABELS, actionLabel, actionTone, backupPresentation, formatOperationTime } from '../utils/operations'

const emptyPage = { content: [], page: 0, totalPages: 0, totalElements: 0, first: true, last: true }

export default function Operations() {
  const [summary, setSummary] = useState(null)
  const [activityPage, setActivityPage] = useState(emptyPage)
  const [recyclePage, setRecyclePage] = useState(emptyPage)
  const [activityNumber, setActivityNumber] = useState(0)
  const [recycleNumber, setRecycleNumber] = useState(0)
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pending, setPending] = useState(null)
  const requestSequence = useRef(0)

  const load = useCallback(async () => {
    const requestId = requestSequence.current + 1
    requestSequence.current = requestId
    setLoading(true)
    setLoadError('')
    try {
      const [summaryResponse, activityResponse, recycleResponse] = await Promise.all([
        operationsApi.getSummary(),
        operationsApi.getActivity({ page: activityNumber, size: 12, ...(action ? { action } : {}) }),
        operationsApi.getRecycleBin({ page: recycleNumber, size: 8 }),
      ])
      if (requestId !== requestSequence.current) return
      setSummary(summaryResponse.data || {})
      setActivityPage(activityResponse.data || emptyPage)
      setRecyclePage(recycleResponse.data || emptyPage)
    } catch {
      if (requestId === requestSequence.current) setLoadError('家庭运营数据加载失败，请检查服务后重试。')
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [action, activityNumber, recycleNumber])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const confirmAction = async () => {
    if (!pending) return
    setPending((current) => ({ ...current, busy: true }))
    try {
      if (pending.kind === 'restore') {
        await operationsApi.restoreItem(pending.item.id)
        toast.success(`已恢复「${pending.item.name}」`)
      } else {
        await operationsApi.permanentlyDeleteItem(pending.item.id)
        toast.success(`已永久删除「${pending.item.name}」`)
      }
      setPending(null)
      if (recyclePage.content?.length === 1 && recycleNumber > 0) {
        setRecycleNumber((value) => Math.max(0, value - 1))
      } else {
        await load()
      }
    } catch {
      toast.error(pending.kind === 'restore' ? '恢复失败，请稍后重试。' : '永久删除失败，请稍后重试。')
      setPending((current) => current ? { ...current, busy: false } : null)
    }
  }

  const backup = useMemo(() => loading && !summary
    ? { title: '读取中…', detail: '正在读取服务器备份状态', tone: 'primary' }
    : backupPresentation(summary?.latestBackup), [loading, summary])
  const activities = activityPage.content || []
  const recycled = recyclePage.content || []

  return (
    <div className="page-content operations-page">
      <header className="page-heading-row operations-heading">
        <div>
          <div className="page-title-line"><Activity size={24} aria-hidden="true" /><h1 className="page-title">家庭运营</h1></div>
          <p className="page-subtitle">查看家庭维护记录，管理误删物品与数据保护状态</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={load} disabled={loading}>
          <RefreshCw size={17} aria-hidden="true" />{loading ? '刷新中…' : '刷新状态'}
        </button>
      </header>

      {loadError ? (
        <div className="card operations-error" role="alert"><span>{loadError}</span><button className="btn btn-secondary" onClick={load} type="button">重新加载</button></div>
      ) : (
        <>
          <section className="operations-summary operations-status-grid" aria-label="家庭运营摘要">
            <StatusCell icon={DatabaseBackup} label="备份状态" value={backup.title} detail={backup.detail} tone={backup.tone} />
            <StatusCell icon={ArchiveRestore} label="回收站" value={`${summary?.recycleBinItems ?? '—'} 件`} detail="可恢复的误删物品" />
            <StatusCell icon={UserRoundCheck} label="家庭访问" value={`${summary?.activeMembers ?? '—'} 人`} detail={`${summary?.activeSessions ?? '—'} 个活动会话`} />
            <StatusCell icon={ShieldCheck} label="近 7 天" value={`${summary?.activityLast7Days ?? '—'} 次`} detail="已记录的关键操作" />
          </section>

          <div className="operations-layout">
            <section className="card operation-panel activity-panel" aria-labelledby="activity-title">
              <div className="operation-panel-heading">
                <div><span className="panel-kicker">运行纸带</span><h2 id="activity-title">家庭操作记录</h2></div>
                <label className="operation-filter">
                  <span>筛选动作</span>
                  <select className="input" value={action} disabled={loading} onChange={(event) => { setAction(event.target.value); setActivityNumber(0) }}>
                    <option value="">全部动作</option>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
              </div>
              {loading ? <TapeSkeleton /> : activities.length ? (
                <ol className="activity-timeline activity-tape">
                  {activities.map((event, index) => <ActivityEntry event={event} key={event.id ?? `${event.createdAt}-${index}`} />)}
                </ol>
              ) : <EmptyState icon={Activity} title="还没有操作记录" desc={action ? '当前筛选条件下没有记录。' : '今后的重要变更会显示在这里。'} />}
              <Pager page={activityPage} loading={loading} onPrevious={() => setActivityNumber((value) => Math.max(0, value - 1))} onNext={() => setActivityNumber((value) => value + 1)} label="操作记录" />
            </section>

            <section className="card operation-panel recycle-panel" aria-labelledby="recycle-title">
              <div className="operation-panel-heading"><div><span className="panel-kicker">误删保护</span><h2 id="recycle-title">回收站</h2></div><span className="count-chip">{recyclePage.totalElements ?? 0} 件</span></div>
              {loading ? <TapeSkeleton short /> : recycled.length ? (
                <div className="recycle-list">
                  {recycled.map((item) => (
                    <article className="recycle-item" key={item.id}>
                      <div><strong>{item.name}</strong><span>{item.locationPath || item.locationName || '原位置未记录'} · {formatOperationTime(item.deletedAt)}</span></div>
                      <div className="recycle-actions">
                        <button className="btn btn-primary" type="button" onClick={() => setPending({ kind: 'restore', item, busy: false })}><ArchiveRestore size={16} />恢复</button>
                        <button className="btn btn-danger" type="button" onClick={() => setPending({ kind: 'delete', item, busy: false })}><Trash2 size={16} />永久删除</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <EmptyState icon={ArchiveRestore} title="回收站是空的" desc="从物品管理移除的物品会先保留在这里。" />}
              <Pager page={recyclePage} loading={loading} onPrevious={() => setRecycleNumber((value) => Math.max(0, value - 1))} onNext={() => setRecycleNumber((value) => value + 1)} label="回收站" />
            </section>
          </div>
        </>
      )}

      {pending && <ConfirmDialog pending={pending} onCancel={() => !pending.busy && setPending(null)} onConfirm={confirmAction} />}
    </div>
  )
}

function StatusCell({ icon: Icon, label, value, detail, tone = 'primary' }) {
  return <article className={`operations-status status-${tone}`}><Icon size={19} aria-hidden="true" /><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>
}

function ActivityEntry({ event }) {
  const actor = event.actorDisplayName || event.actorName || '系统'
  const target = event.entityName || event.targetName || event.summary || '未命名对象'
  return (
    <li className="activity-entry">
      <time dateTime={event.createdAt}>{formatOperationTime(event.createdAt)}</time>
      <span className={`tape-marker tone-${actionTone(event.action)}`} aria-hidden="true" />
      <div className="activity-copy"><span><strong>{actor}</strong> · {actionLabel(event.action)}</span><b>{target}</b>{event.summary && event.summary !== target && <small>{event.summary}</small>}</div>
    </li>
  )
}

function Pager({ page, onPrevious, onNext, label, loading }) {
  if (!page || page.totalPages <= 1) return null
  return <nav className="operation-pager" aria-label={`${label}分页`}><span>{page.page + 1} / {page.totalPages} 页</span><div><button className="btn btn-secondary" disabled={loading || page.first} onClick={onPrevious} type="button"><ChevronLeft size={16} />上一页</button><button className="btn btn-secondary" disabled={loading || page.last} onClick={onNext} type="button">下一页<ChevronRight size={16} /></button></div></nav>
}

function TapeSkeleton({ short = false }) {
  return <div className="tape-skeleton" role="status" aria-label="正在加载"><div className="skeleton" />{!short && <><div className="skeleton" /><div className="skeleton" /></>}</div>
}

function ConfirmDialog({ pending, onCancel, onConfirm }) {
  const permanent = pending.kind === 'delete'
  const confirmRef = useRef(null)
  const cancelRef = useRef(null)
  useEffect(() => {
    const previouslyFocused = document.activeElement
    confirmRef.current?.focus()
    const closeOnEscape = (event) => { if (event.key === 'Escape') onCancel() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      previouslyFocused?.focus?.()
    }
  }, [onCancel])
  const trapFocus = (event) => {
    if (event.key !== 'Tab') return
    if (event.shiftKey && document.activeElement === cancelRef.current) {
      event.preventDefault(); confirmRef.current?.focus()
    } else if (!event.shiftKey && document.activeElement === confirmRef.current) {
      event.preventDefault(); cancelRef.current?.focus()
    }
  }
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section className="operation-confirm" role="alertdialog" aria-modal="true" aria-labelledby="operation-confirm-title" aria-describedby="operation-confirm-description" onKeyDown={trapFocus}>
        <span className={`confirm-icon ${permanent ? 'is-danger' : ''}`} aria-hidden="true">{permanent ? <Trash2 size={22} /> : <ArchiveRestore size={22} />}</span>
        <h2 id="operation-confirm-title">{permanent ? '永久删除这件物品？' : '恢复这件物品？'}</h2>
        <p id="operation-confirm-description">{permanent ? `「${pending.item.name}」的记录将无法再恢复。` : `「${pending.item.name}」将重新出现在物品管理中。`}</p>
        <div className="confirm-actions"><button ref={cancelRef} className="btn btn-ghost" disabled={pending.busy} onClick={onCancel} type="button">取消</button><button ref={confirmRef} className={`btn ${permanent ? 'btn-danger' : 'btn-primary'}`} disabled={pending.busy} onClick={onConfirm} type="button">{pending.busy ? '处理中…' : permanent ? '确认永久删除' : '确认恢复'}</button></div>
      </section>
    </div>
  )
}
