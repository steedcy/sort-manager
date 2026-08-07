import React from 'react'

export default function PageHeader({ icon, title, subtitle, actions }) {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, { size: icon.props.size || 24, 'aria-hidden': true })
    : icon

  return (
    <header className="page-heading-row page-header">
      <div>
        <div className="page-title-line">
          {renderedIcon}
          <h1 className="page-title">{title}</h1>
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </header>
  )
}
