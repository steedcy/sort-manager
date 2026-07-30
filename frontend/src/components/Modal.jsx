import { useEffect, useEffectEvent, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'

export default function Modal({ title, onClose, onSubmit, loading, children, wide }) {
  const closeRef = useRef(null)
  const closeFromKeyboard = useEffectEvent(() => {
    if (!loading) onClose()
  })

  useEffect(() => {
    const previousFocus = document.activeElement
    closeRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeFromKeyboard()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [])

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button ref={closeRef} className="modal-close" type="button" onClick={onClose} disabled={loading} aria-label={`关闭${title}`}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={loading}>取消</button>
          <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="button-spinner" size={16} aria-hidden="true" />}
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
