export default function PageHeader({ icon, eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {eyebrow && <span className="archive-label">{eyebrow}</span>}
        <div className="page-header__title-row">
          {icon && <span className="page-header__icon" aria-hidden="true">{icon}</span>}
          <h1>{title}</h1>
        </div>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
