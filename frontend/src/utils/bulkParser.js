export const BULK_HEADERS = ['物品名称', '数量', '单价', '分类', '位置', '购买日期', '有效期', '备注']

const FIELDS = ['name', 'quantity', 'price', 'categoryName', 'locationName', 'purchaseDate', 'expiryDate', 'description']
const HEADER_ALIASES = new Map([
  ['物品名称', 'name'], ['名称', 'name'], ['name', 'name'],
  ['数量', 'quantity'], ['quantity', 'quantity'], ['qty', 'quantity'],
  ['单价', 'price'], ['价格', 'price'], ['price', 'price'],
  ['分类', 'categoryName'], ['category', 'categoryName'], ['categoryname', 'categoryName'],
  ['位置', 'locationName'], ['存放位置', 'locationName'], ['location', 'locationName'], ['locationname', 'locationName'],
  ['购买日期', 'purchaseDate'], ['购入日期', 'purchaseDate'], ['purchasedate', 'purchaseDate'],
  ['有效期', 'expiryDate'], ['到期日期', 'expiryDate'], ['expirydate', 'expiryDate'],
  ['备注', 'description'], ['描述', 'description'], ['description', 'description'], ['note', 'description'],
])

function normalizeHeader(value) {
  return String(value ?? '').replace(/^\ufeff/, '').trim().toLowerCase().replace(/[ _-]/g, '')
}

function detectDelimiter(text) {
  let commas = 0
  let tabs = 0
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && (character === '\n' || character === '\r')) {
      break
    } else if (!quoted && character === ',') commas += 1
    else if (!quoted && character === '\t') tabs += 1
  }
  return tabs > commas ? '\t' : ','
}

function parseDelimited(text, delimiter) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === delimiter) {
      row.push(cell.trim())
      cell = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  row.push(cell.trim())
  if (quoted) throw new Error('CSV contains an unclosed quoted value')
  rows.push(row)
  return rows.filter((candidate) => candidate.some((value) => value !== ''))
}

function createRow(values, columns) {
  const result = Object.fromEntries(FIELDS.map((field) => [field, '']))
  values.forEach((value, index) => {
    const field = columns[index]
    if (field) result[field] = value
  })
  return result
}

export function parseBulkText(source) {
  const text = String(source ?? '').replace(/^\ufeff/, '').trim()
  if (!text) return []

  const rows = parseDelimited(text, detectDelimiter(text))
  const recognizedHeaders = rows[0].map((value) => HEADER_ALIASES.get(normalizeHeader(value)))
  const recognizedCount = recognizedHeaders.filter(Boolean).length
  const nonEmptyHeaderCells = rows[0].filter((value) => String(value).trim() !== '').length
  let columns = FIELDS
  let dataRows = rows

  if (recognizedCount >= 2 && recognizedCount === nonEmptyHeaderCells) {
    if (!recognizedHeaders.includes('name')) throw new Error('表头必须包含“物品名称”列')
    const presentHeaders = recognizedHeaders.filter(Boolean)
    if (new Set(presentHeaders).size !== presentHeaders.length) {
      throw new Error('CSV header contains duplicate columns')
    }
    columns = recognizedHeaders
    dataRows = rows.slice(1)
  }

  if (dataRows.length > 100) throw new Error('一次最多录入 100 行物品')
  return dataRows.map((values) => createRow(values, columns))
}

function quoteCsv(value) {
  const content = String(value ?? '')
  return /[",\r\n]/.test(content) ? `"${content.replaceAll('"', '""')}"` : content
}

export function buildBulkTemplate() {
  const example = ['示例：雨伞', '1', '0', '出行用品', '玄关', '2026-07-21', '', '长柄伞']
  return `\ufeff${BULK_HEADERS.map(quoteCsv).join(',')}\r\n${example.map(quoteCsv).join(',')}\r\n`
}
