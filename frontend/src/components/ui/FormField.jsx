import { cloneElement, isValidElement } from 'react'

export default function FormField({ id, label, required = false, hint, error, children }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children

  return (
    <div className={['form-field', error && 'form-field--error'].filter(Boolean).join(' ')}>
      <label className="form-field__label" htmlFor={id}>
        {label}{required && <span className="form-field__required" aria-hidden="true"> *</span>}
      </label>
      {control}
      {hint && <span className="form-field__hint" id={hintId}>{hint}</span>}
      {error && <span className="form-field__error" id={errorId} role="alert">{error}</span>}
    </div>
  )
}
