import { ChevronRight, LogOut, ShieldCheck, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfileMenuItems } from '../utils/profileNavigation'
import LogoutConfirmDialog from '../components/LogoutConfirmDialog'

const menuDetails = {
  members: {
    icon: Users,
    label: '家庭成员',
    description: '管理可访问此家庭空间的账号',
  },
  operations: {
    icon: ShieldCheck,
    label: '家庭运营',
    description: '查看数据保护、操作记录和回收站',
  },
  logout: {
    icon: LogOut,
    label: '退出',
    description: '退出当前账号并返回登录页',
    tone: 'danger',
  },
}

const roleLabel = (role) => role === 'OWNER' ? '管理员' : '家庭成员'
const statusLabel = (enabled) => enabled === false ? '已停用' : '已启用'

function initials(name) {
  return (name || '我').trim().slice(0, 1).toUpperCase()
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const menuItems = getProfileMenuItems(user)

  const handleMenuClick = async (item) => {
    if (item.key === 'logout') {
      setLogoutOpen(true)
      return
    }
    navigate(item.path)
  }

  return (
    <div className="page-content profile-page">
      <section className="profile-account-card" aria-labelledby="profile-account-name">
        <div className="profile-account-card__identity">
          <span className="profile-avatar" aria-hidden="true">{initials(user.displayName)}</span>
          <div>
            <h2 id="profile-account-name">{user.displayName}</h2>
            <span className="profile-account-card__username">@{user.username}</span>
          </div>
        </div>
        <dl className="profile-account-details">
          <div>
            <dt>角色</dt>
            <dd>{roleLabel(user.role)}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd><span className={`profile-status ${user.enabled === false ? 'is-disabled' : ''}`}>{statusLabel(user.enabled)}</span></dd>
          </div>
          <div>
            <dt>家庭</dt>
            <dd>{user.householdName || '默认家庭'}</dd>
          </div>
        </dl>
      </section>

      <nav className="profile-menu" aria-label="我的功能菜单">
        {menuItems.map((item) => {
          const detail = menuDetails[item.key]
          const Icon = detail.icon
          return (
            <button className={`profile-menu-item ${detail.tone === 'danger' ? 'profile-menu-item--danger' : ''}`} type="button" key={item.key} onClick={() => handleMenuClick(item)}>
              <span className="profile-menu-item__icon" aria-hidden="true"><Icon size={20} /></span>
              <span className="profile-menu-item__copy"><strong>{detail.label}</strong><small>{detail.description}</small></span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          )
        })}
      </nav>
      <LogoutConfirmDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  )
}
