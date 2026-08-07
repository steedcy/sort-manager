export function exportItemsToExcel(items, filename = '家庭物品资产清单.csv') {
  if (!items || !items.length) {
    alert('暂无可导出的物品数据')
    return
  }

  const headers = ['物品名称', '分类', '位置', '数量', '单价(元)', '总价(元)', '购入日期', '有效期至', '状态', '描述']
  const rows = items.map(item => [
    `"${(item.name || '').replace(/"/g, '""')}"`,
    `"${(item.categoryName || '未分类').replace(/"/g, '""')}"`,
    `"${(item.locationPath || item.locationName || '未指定').replace(/"/g, '""')}"`,
    item.quantity || 1,
    (item.price || 0).toFixed(2),
    (item.totalPrice || (item.price || 0) * (item.quantity || 1)).toFixed(2),
    `"${item.purchaseDate || ''}"`,
    `"${item.expiryDate || '永久'}"`,
    `"${item.status || '正常'}"`,
    `"${(item.description || '').replace(/"/g, '""')}"`
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printItemsReport(items, title = '家庭物品资产明细表') {
  if (!items || !items.length) {
    alert('暂无可打印的数据')
    return
  }

  const printWindow = window.open('', '_blank')
  const totalAmount = items.reduce((acc, cur) => acc + (cur.totalPrice || (cur.price || 0) * (cur.quantity || 1)), 0)

  const rowsHtml = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${item.name || ''}</strong></td>
      <td>${item.categoryName || '未分类'}</td>
      <td>${item.locationPath || item.locationName || '未指定'}</td>
      <td style="text-align:center;">×${item.quantity || 1}</td>
      <td style="text-align:right;">￥${(item.price || 0).toFixed(2)}</td>
      <td style="text-align:right;">￥${(item.totalPrice || (item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      <td>${item.status || '正常'}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
          h1 { margin: 0 0 8px; font-size: 22px; color: #0f172a; text-align: center; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; color: #334155; font-weight: 600; }
          .summary { text-align: right; font-size: 14px; font-weight: 700; margin-top: 16px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">导出时间：${new Date().toLocaleString()} · 共 ${items.length} 件物品</div>
        <table>
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>物品名称</th>
              <th>分类</th>
              <th>存放位置</th>
              <th style="text-align:center;">数量</th>
              <th style="text-align:right;">单价</th>
              <th style="text-align:right;">总价</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="summary">包含估算总价值：￥${totalAmount.toFixed(2)} 元</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
