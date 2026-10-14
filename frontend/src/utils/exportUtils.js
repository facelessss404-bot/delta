import api from '../services/api';

/**
 * Trigger browser file download from a Blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Download CSV from API endpoint with authorization token
 */
export const downloadApiExport = async (endpoint, defaultFilename = 'report.csv') => {
  const response = await api.get(endpoint, {
    responseType: 'blob'
  });
  
  // Try to read filename from content-disposition header if available
  let filename = defaultFilename;
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
  }
  
  downloadBlob(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }), filename);
};

/**
 * Client-side CSV export from array of headers and rows
 */
export const exportToCsv = (filename, headers, rows) => {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};
