import { useState } from 'react'
import { LogOut } from 'lucide-react'
import Modal from './Modal'
import { useAuth } from '../context/AuthContext'

export default function LogoutConfirmDialog({ open, onClose }) {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  if (!open) return null
  const confirm = async () => {
    setLoading(true)
    try { await logout() } finally { setLoading(false) }
  }
  return <Modal title="确认退出登录" onClose={onClose} onSubmit={confirm} loading={loading} submitLabel="确认退出" submitTone="danger"><p className="logout-confirm-copy"><LogOut size={20} aria-hidden="true" />将退出当前账号并返回登录页。</p></Modal>
}
