import { useEffect, useMemo, useRef, useState } from 'react'
import { ArchiveRestore, ClipboardPaste, Download, FileUp, Plus, ScanSearch, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { categoryApi, itemApi, locationApi } from '../api'
import BulkItemRow from '../components/BulkItemRow'
import { buildLocationTreeOptions } from '../utils/tree'
import { buildBulkTemplate, parseBulkText } from '../utils/bulkParser'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'

const DRAFT_KEY = 'sort-manager:bulk-items-draft:v1'
const MAX_FILE_BYTES = 1024 * 1024

function localIsoDate() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function createDraftRow(row = {}) {
  return {
    draftId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name: '', quantity: '1', price: '0', categoryName: '', locationName: '', locationId: '',
    purchaseDate: localIsoDate(), expiryDate: '', description: '',
    ...row,
  }
}

function loadDraft(draftKey) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(draftKey))
    if (Array.isArray(saved) && saved.length > 0 && saved.length <= 100) return saved.map(createDraftRow)
  } catch {
    sessionStorage.removeItem(draftKey)
  }
  return [createDraftRow()]
}

function serializeDraft(row) {
  const draft = { ...row }
  delete draft.draftId
  return draft
}

function downloadTemplate() {
  const blob = new Blob([buildBulkTemplate()], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '收纳管家-批量录入模板.csv'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function BulkItems() {
  const { user } = useAuth()
  const draftKey = `${DRAFT_KEY}:${user.id}:${user.householdId}`
  const [rows, setRows] = useState(() => loadDraft(draftKey))
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [rowResults, setRowResults] = useState([])
  const [pasteText, setPasteText] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [processing, setProcessing] = useState('')
  const [summary, setSummary] = useState(null)
  const pasteRef = useRef(null)

  useEffect(() => {
    let active = true
    Promise.all([categoryApi.getAll(), locationApi.getAll()])
      .then(([categoryResponse, locationResponse]) => {
        if (!active) return
        setCategories(categoryResponse.data || [])
        setLocations(buildLocationTreeOptions(locationResponse.data || []))
      })
      .catch(() => toast.error('分类和位置加载失败，请刷新页面重试'))
      .finally(() => { if (active) setLoadingOptions(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(rows.map(serializeDraft)))
      } catch {
        toast.error('草稿存储空间不足，请尽快预检并录入')
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [draftKey, rows])

  const counts = useMemo(() => ({
    valid: rowResults.filter((result) => result?.valid).length,
    invalid: rowResults.filter((result) => result && !result.valid).length,
  }), [rowResults])

  const resetValidation = () => {
    setRowResults([])
    setSummary(null)
  }

  const replaceWithParsedText = (text) => {
    try {
      const parsed = parseBulkText(text)
      if (!parsed.length) throw new Error('没有识别到可录入的数据行')
      setRows(parsed.map((row) => {
        const exactPath = locations.filter((location) => location.canonicalPath === row.locationName)
        const exactName = locations.filter((location) => location.name === row.locationName)
        const matches = exactPath.length ? exactPath : exactName
        const location = matches.length === 1 ? matches[0] : null
        return createDraftRow({
          ...row,
          locationId: location ? String(location.id) : '',
          locationName: location ? location.canonicalPath : row.locationName,
        })
      }))
      resetValidation()
      setPasteText('')
      toast.success(`已放入入库托盘，共 ${parsed.length} 行`)
    } catch (error) {
      toast.error(error.message)
      pasteRef.current?.focus()
    }
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) return toast.error('请选择 CSV 文件')
    if (file.size > MAX_FILE_BYTES) return toast.error('CSV 文件不能超过 1 MB')
    replaceWithParsedText(await file.text())
  }

  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) => {
      if (rowIndex !== index) return row
      if (field === 'locationId') {
        const location = locations.find((candidate) => String(candidate.id) === value)
        return { ...row, locationId: value, locationName: location?.canonicalPath || '' }
      }
      return { ...row, [field]: value }
    }))
    setRowResults((current) => current.map((result, rowIndex) => rowIndex === index ? undefined : result))
    setSummary(null)
  }

  const removeRow = (index) => {
    setRows((current) => current.length === 1 ? [createDraftRow()] : current.filter((_, rowIndex) => rowIndex !== index))
    resetValidation()
  }

  const addRow = () => {
    if (rows.length >= 100) return toast.error('一次最多录入 100 行物品')
    setRows((current) => [...current, createDraftRow()])
    resetValidation()
  }

  const buildPayload = () => rows.map((row) => {
    const category = categories.find((candidate) => candidate.name === row.categoryName)
    const quantity = String(row.quantity).trim()
    const price = String(row.price).trim()
    return {
      name: row.name.trim(),
      quantity: /^\d+$/.test(quantity) && BigInt(quantity) <= BigInt(Number.MAX_SAFE_INTEGER) ? quantity : '0',
      price: price === '' ? null : /^\d+(\.\d+)?$/.test(price) ? price : '-1',
      categoryId: row.categoryName ? (category?.id ?? -1) : null,
      locationId: row.locationName ? (row.locationId ? Number(row.locationId) : -1) : null,
      purchaseDate: row.purchaseDate || null,
      expiryDate: row.expiryDate || null,
      description: row.description.trim() || null,
    }
  })

  const processBatch = async (validateOnly) => {
    setProcessing(validateOnly ? 'validate' : 'commit')
    try {
      const response = await itemApi.batch({ validateOnly, items: buildPayload() })
      const result = response.data
      setRowResults(result.rows || [])
      setSummary(result)
      if (validateOnly) {
        if (result.validCount === result.totalCount) toast.success('预检通过，可以正式录入')
        else {
          toast.error(`有 ${result.totalCount - result.validCount} 行需要修正`)
          requestAnimationFrame(() => document.querySelector('.bulk-input.is-invalid')?.focus())
        }
      } else if (result.createdCount > 0) {
        toast.success(`已正式录入 ${result.createdCount} 件物品`)
        sessionStorage.removeItem(draftKey)
        setRows([createDraftRow()])
        setRowResults([])
        setSummary(null)
      } else {
        toast.error('未录入任何物品，请先修正错误')
      }
    } catch {
      // The shared API interceptor displays the actionable request error.
    } finally {
      setProcessing('')
    }
  }

  const allValidated = rows.length > 0 && rowResults.length === rows.length && rowResults.every((result) => result?.valid)

  return (
    <div className="page-content bulk-page">
      <header className="bulk-heading">
        <div>
          <div className="page-title-line"><ArchiveRestore size={24} aria-hidden="true" /><h1 className="page-title">批量录入</h1></div>
          <p className="page-subtitle">把 Excel、WPS 或 CSV 清单放进入库托盘，预检通过后整批录入。</p>
        </div>
        <BackButton fallbackTo="/items" label="返回物品" />
      </header>

      <section className="bulk-import-card bulk-import-panel card" aria-labelledby="bulk-import-title">
        <div className="bulk-import-copy">
          <span className="bulk-step">准备清单</span>
          <h2 id="bulk-import-title">从表格快速开始</h2>
          <p>列顺序为物品名称、数量、单价、分类、位置、购买日期、有效期、备注。日期请使用 yyyy-MM-dd。</p>
        </div>
        <div className="bulk-import-actions">
          <button className="btn btn-ghost" type="button" onClick={downloadTemplate} disabled={Boolean(processing)}><Download size={17} />下载模板</button>
          <label className={`btn btn-secondary bulk-file-button ${processing ? 'is-disabled' : ''}`}><FileUp size={17} />导入 CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={Boolean(processing) || loadingOptions} /></label>
        </div>
        <div className="bulk-paste-zone">
          <label className="input-label" htmlFor="bulk-paste">粘贴 Excel / WPS 表格</label>
          <textarea ref={pasteRef} id="bulk-paste" className="input" value={pasteText} onChange={(event) => setPasteText(event.target.value)} disabled={Boolean(processing)}
            placeholder={'物品名称\t数量\t单价\t分类\t位置\t购买日期\t有效期\t备注\n雨伞\t1\t0\t出行用品\t玄关\t2026-07-21'} />
          <button className="btn btn-secondary" type="button" disabled={Boolean(processing) || loadingOptions || !pasteText.trim()} onClick={() => replaceWithParsedText(pasteText)}>
            <ClipboardPaste size={17} />放进入库托盘
          </button>
        </div>
      </section>

      <section className="bulk-tray" aria-labelledby="bulk-tray-title">
        <div className="bulk-tray-heading">
          <div>
            <span className="bulk-step">入库托盘</span>
            <h2 id="bulk-tray-title">待录入物品 <span>{rows.length}/100</span></h2>
          </div>
          <div className="bulk-validation-summary" aria-live="polite">
            {rowResults.length ? <><span className="is-valid">{counts.valid} 行可录入</span><span className="is-invalid">{counts.invalid} 行需修正</span></> : <span>尚未预检</span>}
          </div>
        </div>

        <div className="bulk-tray-list" aria-busy={Boolean(processing)}>
          {rows.map((row, index) => (
            <BulkItemRow key={row.draftId} index={index} row={row} categories={categories} locations={locations}
              status={!rowResults[index] ? 'pending' : rowResults[index].valid ? 'valid' : 'error'} errors={rowResults[index]?.fieldErrors}
              onChange={(field, value) => updateRow(index, field, value)} onRemove={() => removeRow(index)} disabled={Boolean(processing)} />
          ))}
        </div>
        <button className="btn btn-ghost bulk-add-row" type="button" onClick={addRow} disabled={Boolean(processing) || rows.length >= 100}>
          <Plus size={17} />添加一行
        </button>
      </section>

      <div className="bulk-action-dock" aria-label="批量录入操作">
        <div className="bulk-action-note">
          <strong>{summary ? `${summary.validCount}/${summary.totalCount} 行通过预检` : '先预检，再正式录入'}</strong>
          <span>正式录入为原子操作，不会只保存其中一部分。</span>
        </div>
        <button className="btn btn-secondary" type="button" disabled={Boolean(processing) || loadingOptions} onClick={() => processBatch(true)}>
          <ScanSearch size={17} />{processing === 'validate' ? '正在预检…' : '预检全部'}
        </button>
        <button className="btn btn-primary" type="button" disabled={Boolean(processing) || !allValidated} onClick={() => processBatch(false)}>
          <Send size={17} />{processing === 'commit' ? '正在录入…' : '确认正式录入'}
        </button>
      </div>
    </div>
  )
}
