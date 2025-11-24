// CSV Export utility for Thai characters
export function exportToCSVWithThaiSupport(data: string[][], filename: string) {
  try {
    // Convert data to CSV format
    const csvContent = data.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = cell.toString().replace(/"/g, '""')
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`
        }
        return escaped
      }).join(',')
    ).join('\n')
    
    // Add BOM for UTF-8 to ensure proper Thai character encoding
    const BOM = '\uFEFF'
    const finalContent = BOM + csvContent
    
    // Create and download file
    const blob = new Blob([finalContent], { 
      type: 'text/csv;charset=utf-8;' 
    })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return false
  }
}
