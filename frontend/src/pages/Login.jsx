import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Home, KeyRound, MapPin, Package, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function loginErrorMessage(error) {
  if (error.response?.status === 429) return '尝试次数过多，请稍后再试。'
  if (error.response?.status === 401) return '用户名或密码不正确，请重新输入。'
  if (!error.response) return '暂时无法连接服务器，请检查网络后重试。'
  return error.response?.data?.message || '登录失败，请稍后重试。'
}

export default function Login() {
  const { isAuthenticated, initializing, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const errorRef = useRef(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  if (!initializing && isAuthenticated) return <Navigate to="/" replace />

  if (initializing) {
    return (
      <div className="session-loading" role="status" aria-live="polite">
        <div className="session-loading-mark" aria-hidden="true" />
        <span>正在恢复家庭空间…</span>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('请输入用户名和密码。')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await login({ username: username.trim(), password })
      const destination = location.state?.from?.pathname || '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(loginErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-index" aria-labelledby="login-brand-title">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden="true"><Home size={22} /></span>
          <div>
            <p className="login-eyebrow">家庭物品簿</p>
            <h1 id="login-brand-title">每件物品，都有它的位置</h1>
          </div>
        </div>
        <p className="login-intro">和家人一起记录、查找与整理日常物品，让家里的每个柜格都清楚可见。</p>

        <div className="cabinet-index" aria-label="家庭收纳位置示意">
          <div className="cabinet-cell cabinet-cell-wide">
            <MapPin size={20} aria-hidden="true" />
            <span>客厅 · 电视柜</span>
            <strong>12 件</strong>
          </div>
          <div className="cabinet-cell">
            <Package size={20} aria-hidden="true" />
            <span>厨房</span>
            <strong>28 件</strong>
          </div>
          <div className="cabinet-cell cabinet-cell-accent">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>家庭共享</span>
            <strong>仅家人可见</strong>
          </div>
          <div className="cabinet-cell cabinet-cell-wide cabinet-cell-quiet">
            <KeyRound size={20} aria-hidden="true" />
            <span>安全访问</span>
            <strong>会话受保护</strong>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-form-title">
        <div className="login-form-wrap">
          <p className="login-eyebrow">欢迎回来</p>
          <h2 id="login-form-title">登录家庭空间</h2>
          <p className="login-helper">使用家庭管理员为你创建的账号。</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label className="input-label" htmlFor="login-username">用户名</label>
              <input
                id="login-username"
                className="input"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">密码</label>
              <div className="password-field">
                <input
                  id="login-password"
                  className="input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="form-error" role="alert" tabIndex="-1" ref={errorRef}>{error}</p>
            )}

            <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
              {submitting ? <span className="button-spinner" aria-hidden="true" /> : <KeyRound size={18} />}
              {submitting ? '正在登录…' : '登录'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
