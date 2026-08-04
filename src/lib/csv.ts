export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    alert('No data to export.')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Format CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : String(row[header])
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
          cell = `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    )
  ].join('\n')

  // Create Blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
