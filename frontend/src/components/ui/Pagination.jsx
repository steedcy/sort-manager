export default function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <nav className="pagination" aria-label="分页">
      <span className="pagination__summary">共 {totalElements ?? 0} 条，第 {page + 1} / {Math.max(totalPages, 1)} 页</span>
      <div className="pagination__controls">
        <label>
          <span className="sr-only">每页数量</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange?.(Number(event.target.value))}>
            {[12, 24, 48].map((size) => <option key={size} value={size}>每页 {size} 条</option>)}
          </select>
        </label>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 0}>上一页</button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages}>下一页</button>
      </div>
    </nav>
  )
}
