/**
 * A generic function to export data to a CSV file.
 * @param headers - An array of strings for the CSV header row.
 * @param dataRows - An array of arrays, where each inner array represents a row.
 * @param filename - The desired name for the downloaded file (e.g., 'report.csv').
 */
export const exportToCSV = (headers: string[], dataRows: (string | number | null | undefined)[][], filename: string) => {
  try {
    // Add BOM for Excel to recognize UTF-8 characters correctly
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    // Add headers
    csvContent += headers.join(",") + "\r\n";

    // Add data rows
    dataRows.forEach(rowArray => {
      const row = rowArray.map(cell => {
        const cellString = String(cell === null || cell === undefined ? '' : cell);
        // Escape quotes by doubling them and wrap the cell in quotes if it contains commas, quotes, or newlines
        if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
          return `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
      }).join(",");
      csvContent += row + "\r\n";
    });

    // Create and trigger download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Failed to export to CSV:", error);
    // You can add a toast notification here if you have a global toast function
    alert("ไม่สามารถส่งออกข้อมูลเป็น CSV ได้");
  }
};

/**
 * Export array of objects to CSV file
 * @param data - Array of objects to export
 * @param filename - The desired name for the downloaded file (e.g., 'report.csv').
 */
export const exportObjectsToCSV = (data: Record<string, any>[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Convert objects to arrays
    const dataRows = data.map(obj => 
      headers.map(header => obj[header] || '')
    );

    // Use the existing exportToCSV function
    exportToCSV(headers, dataRows, filename);

  } catch (error) {
    console.error("Failed to export objects to CSV:", error);
    alert("ไม่สามารถส่งออกข้อมูลเป็น CSV ได้");
  }
};