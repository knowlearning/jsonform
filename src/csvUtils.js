export function jsonToCsv(rows) {
  if (!rows.length) return ''

  const headers = Array.from(
    new Set(rows.flatMap(row => Object.keys(row)))
  )

  const escape = value => {
    if (value == null) return ''
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ]

  return lines.join('\n')
}

export default function downloadCsv(filename, rows) {
  const contents = jsonToCsv(rows)
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
