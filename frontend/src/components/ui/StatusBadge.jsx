export default function StatusBadge({ tone = 'neutral', icon, children }) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
