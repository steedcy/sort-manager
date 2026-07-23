export const ACTION_LABELS = {
  ITEM_CREATED: '录入物品',
  ITEM_UPDATED: '修改物品',
  ITEM_MOVED: '移动物品',
  ITEM_DELETED: '移入回收站',
  ITEM_RESTORED: '恢复物品',
  ITEM_PERMANENTLY_DELETED: '永久删除',
  ITEM_BATCH_CREATED: '批量录入',
  MEMBER_CREATED: '添加成员',
  MEMBER_ENABLED: '启用成员',
  MEMBER_DISABLED: '停用成员',
  MEMBER_SESSIONS_REVOKED: '撤销会话',
}

export const actionLabel = (action) => ACTION_LABELS[action] || action || '未知操作'

export const actionTone = (action = '') => (
  action.includes('DELETE') || action.includes('DISABLE') || action.includes('REVOKE') ? 'danger'
    : action.includes('RESTORE') || action.includes('ENABLE') ? 'success'
      : 'primary'
)

export function formatOperationTime(value) {
  if (!value) return '时间未记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '时间未记录'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

export function backupPresentation(backup) {
  if (!backup) return { tone: 'muted', title: '尚无备份记录', detail: '请在服务器配置定时备份' }
  const state = String(backup.status || '').toUpperCase()
  if (state === 'HEALTHY') {
    const size = Number.isFinite(backup.backupSizeBytes) ? ` · ${formatBytes(backup.backupSizeBytes)}` : ''
    return { tone: 'success', title: '最近备份正常', detail: `${formatOperationTime(backup.lastSuccessAt)}${size}` }
  }
  if (state === 'STALE') return { tone: 'warning', title: '备份已过期', detail: '请检查服务器备份任务' }
  if (state === 'UNVERIFIED') return { tone: 'warning', title: '备份尚未验证', detail: '请运行恢复验证流程' }
  if (state === 'NOT_CONFIGURED') return { tone: 'muted', title: '备份未配置', detail: '请在服务器配置备份状态文件' }
  return { tone: 'danger', title: '备份需要检查', detail: state === 'MISSING' ? '备份状态文件缺失' : '备份状态文件损坏' }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
