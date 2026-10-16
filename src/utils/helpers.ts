import * as XLSX from 'xlsx';

/**
 * Strips Vietnamese diacritics for accent-insensitive search (e.g. "minh anh" matches "Nguyễn Minh Anh")
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const cleanText = removeVietnameseTones(text);
  const cleanQuery = removeVietnameseTones(query);
  return cleanText.includes(cleanQuery);
}

/**
 * Haversine formula to compute distance in meters between two GPS coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'NV';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0][0] || '';
  // Pick last alphabetic word (in case name ends with a number like "Bùi Quang An 36")
  const alphaParts = parts.filter((p) => !/^\d+$/.test(p));
  const last = alphaParts.length > 1 ? alphaParts[alphaParts.length - 1][0] : parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * Export array of objects to CSV with UTF-8 BOM for Vietnamese Excel compatibility
 */
export function exportToCSV(filename: string, rows: Record<string, string | number>[]): void {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ];
  const csvString = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export array of objects to native Excel (.xlsx) file
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, string | number>[]
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Parse uploaded Excel (.xlsx, .xls, .csv) file into JSON rows
 */
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
}
