import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ fallbackTo, label = '返回' }) {
  const navigate = useNavigate()
  const goBack = () => window.history.length > 1 ? navigate(-1) : navigate(fallbackTo)
  return <button className="btn btn-ghost page-back" type="button" onClick={goBack}><ArrowLeft size={17} aria-hidden="true" />{label}</button>
}
