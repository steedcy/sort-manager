import { LoaderCircle } from 'lucide-react'

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={['button', `button--${variant}`, `button--${size}`, className].filter(Boolean).join(' ')}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="button__spinner" aria-hidden="true" /> : icon}
      {children != null && <span>{children}</span>}
    </button>
  )
}
