function shouldLoadOperations(user) {
  return Boolean(user && user.role === 'OWNER')
}

function formatBackupState(backup) {
  if (!backup || backup.status === 'MISSING') {
    return { label: '尚无可验证备份', tone: 'warning', detail: '请在服务器执行加密备份任务。' }
  }
  if (backup.status === 'HEALTHY') {
    return {
      label: '备份已验证',
      tone: 'healthy',
      detail: backup.lastSuccessAt ? `完成于 ${String(backup.lastSuccessAt).replace('T', ' ').slice(0, 16)}` : '最近一次备份可验证',
    }
  }
  return { label: '备份需要检查', tone: 'danger', detail: backup.message || '状态文件损坏、过期或备份任务失败。' }
}

function formatProtectionSummary(summary) {
  if (!summary) return null
  return {
    recycleBinItems: Number(summary.recycleBinItems || 0),
    activeSessions: Number(summary.activeSessions || 0),
    activityLast7Days: Number(summary.activityLast7Days || 0),
    backup: formatBackupState(summary.latestBackup),
  }
}

module.exports = { formatBackupState, formatProtectionSummary, shouldLoadOperations }
