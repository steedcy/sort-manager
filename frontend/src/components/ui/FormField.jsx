import { cloneElement, isValidElement } from 'react'

export default function FormField({ id, label, required = false, hint, error, children }) {
  const labelId = `${id}-label`
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [children?.props?.['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-labelledby': children.props['aria-labelledby'] || labelId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : children.props['aria-invalid'],
        'aria-required': required || children.props['aria-required'],
      })
    : children

  return (
    <div className={['form-field', error && 'form-field--error'].filter(Boolean).join(' ')}>
      <label className="form-field__label" id={labelId} htmlFor={id}>
        {label}{required && <span className="form-field__required" aria-hidden="true"> *</span>}
      </label>
      {control}
      {hint && <span className="form-field__hint" id={hintId}>{hint}</span>}
      {error && <span className="form-field__error" id={errorId} role="alert">{error}</span>}
    </div>
  )
}
