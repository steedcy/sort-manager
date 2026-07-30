export default function Toolbar({ children, className }) {
  return <div className={['toolbar', className].filter(Boolean).join(' ')}>{children}</div>
}
