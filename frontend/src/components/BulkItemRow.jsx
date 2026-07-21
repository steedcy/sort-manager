import { CheckCircle2, CircleDashed, Trash2, TriangleAlert } from 'lucide-react'

const FIELD_ERRORS = {
  categoryId: 'categoryName',
  locationId: 'locationName',
}

const fields = [
  { key: 'name', label: '物品名称', type: 'text', required: true, placeholder: '例如：雨伞' },
  { key: 'quantity', label: '数量', type: 'number', required: true, min: '1', inputMode: 'numeric' },
  { key: 'price', label: '单价（元）', type: 'number', min: '0', step: '0.01', inputMode: 'decimal' },
  { key: 'purchaseDate', label: '购买日期', type: 'date' },
  { key: 'expiryDate', label: '有效期', type: 'date' },
  { key: 'description', label: '备注', type: 'text', placeholder: '选填' },
]

const statusMeta = {
  pending: { label: '待预检', icon: CircleDashed },
  valid: { label: '可以录入', icon: CheckCircle2 },
  error: { label: '需要修正', icon: TriangleAlert },
}

function Field({ rowId, field, value, error, onChange, disabled }) {
  const { key, label, required, ...inputProps } = field
  const inputId = `bulk-${rowId}-${key}`
  const errorId = `${inputId}-error`
  return (
    <div className={`bulk-field bulk-field-${field.key}`}>
      <label className="input-label" htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input
        id={inputId}
        className={`input bulk-input ${error ? 'is-invalid' : ''}`}
        value={value}
        required={required}
        onChange={(event) => onChange(key, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        {...inputProps}
      />
      {error && <span id={errorId} className="bulk-field-error" role="alert">{error}</span>}
    </div>
  )
}

export default function BulkItemRow({ index, row, categories, locations, status, errors = {}, onChange, onRemove, disabled = false }) {
  const meta = statusMeta[status] || statusMeta.pending
  const StatusIcon = meta.icon
  const messages = {
    name: '请输入物品名称（不超过 200 字）', quantity: '数量必须是大于等于 1 的整数', price: '单价不能为负数',
    purchaseDate: '购买日期需使用 yyyy-MM-dd 格式', expiryDate: '有效期需使用 yyyy-MM-dd 格式',
    categoryId: '请选择当前家庭中已有的分类', locationId: '请选择当前家庭中已有的位置',
  }
  const normalizedErrors = Object.fromEntries(Object.entries(errors).map(([key, value]) => [
    FIELD_ERRORS[key] || key,
    messages[key] || value,
  ]))

  return (
    <article className={`bulk-tray-row is-${status}`} aria-label={`第 ${index + 1} 行物品`}>
      <div className="bulk-row-marker" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
      <div className="bulk-row-fields">
        <Field rowId={row.draftId} field={fields[0]} value={row.name} error={normalizedErrors.name} onChange={onChange} disabled={disabled} />
        <Field rowId={row.draftId} field={fields[1]} value={row.quantity} error={normalizedErrors.quantity} onChange={onChange} disabled={disabled} />
        <Field rowId={row.draftId} field={fields[2]} value={row.price} error={normalizedErrors.price} onChange={onChange} disabled={disabled} />
        <div className="bulk-field bulk-field-categoryName">
          <label className="input-label" htmlFor={`bulk-${row.draftId}-category`}>分类</label>
          <select id={`bulk-${row.draftId}-category`} className={`input bulk-input ${normalizedErrors.categoryName ? 'is-invalid' : ''}`}
            value={row.categoryName} onChange={(event) => onChange('categoryName', event.target.value)} disabled={disabled}
            aria-invalid={Boolean(normalizedErrors.categoryName)} aria-describedby={normalizedErrors.categoryName ? `bulk-${row.draftId}-category-error` : undefined}>
            <option value="">未分类</option>
            {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
            {row.categoryName && !categories.some((category) => category.name === row.categoryName)
              && <option value={row.categoryName}>{row.categoryName}（未匹配）</option>}
          </select>
          {normalizedErrors.categoryName && <span id={`bulk-${row.draftId}-category-error`} className="bulk-field-error" role="alert">{normalizedErrors.categoryName}</span>}
        </div>
        <div className="bulk-field bulk-field-locationName">
          <label className="input-label" htmlFor={`bulk-${row.draftId}-location`}>存放位置</label>
          <select id={`bulk-${row.draftId}-location`} className={`input bulk-input ${normalizedErrors.locationName ? 'is-invalid' : ''}`}
            value={row.locationId || ''} onChange={(event) => onChange('locationId', event.target.value)} disabled={disabled}
            aria-invalid={Boolean(normalizedErrors.locationName)} aria-describedby={normalizedErrors.locationName ? `bulk-${row.draftId}-location-error` : undefined}>
            <option value="">{row.locationName && !row.locationId ? `${row.locationName}（未匹配）` : '暂不指定'}</option>
            {locations.map((location) => <option key={location.id} value={String(location.id)}>{location.treeName}</option>)}
          </select>
          {normalizedErrors.locationName && <span id={`bulk-${row.draftId}-location-error`} className="bulk-field-error" role="alert">{normalizedErrors.locationName}</span>}
        </div>
        {fields.slice(3).map((field) => (
          <Field key={field.key} rowId={row.draftId} field={field} value={row[field.key]} error={normalizedErrors[field.key]} onChange={onChange} disabled={disabled} />
        ))}
      </div>
      <div className="bulk-row-state">
        <span className={`bulk-status is-${status}`}><StatusIcon size={16} aria-hidden="true" />{meta.label}</span>
        <button type="button" className="bulk-remove-button" onClick={onRemove} disabled={disabled} aria-label={`删除第 ${index + 1} 行`}>
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
