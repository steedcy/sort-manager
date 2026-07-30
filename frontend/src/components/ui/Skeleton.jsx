export default function Skeleton({ variant = 'line', className }) {
  return <span className={['ui-skeleton', `ui-skeleton--${variant}`, className].filter(Boolean).join(' ')} aria-hidden="true" />
}
