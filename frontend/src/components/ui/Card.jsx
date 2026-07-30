export default function Card({ as: Element = 'div', variant = 'default', className, children, ...props }) {
  return (
    <Element className={['ui-card', `ui-card--${variant}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Element>
  )
}
