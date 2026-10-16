/**
 * Bounded LRU-style memoization cache for Vietnamese accent stripping
 */
const TONE_CACHE = new Map<string, string>();
const MAX_CACHE_SIZE = 2500;

/**
 * Strips Vietnamese diacritics for accent-insensitive search (e.g. "minh anh" matches "Nguyễn Minh Anh")
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  const cached = TONE_CACHE.get(str);
  if (cached !== undefined) return cached;

  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

  if (TONE_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = TONE_CACHE.keys().next().value;
    if (firstKey !== undefined) TONE_CACHE.delete(firstKey);
  }
  TONE_CACHE.set(str, normalized);
  return normalized;
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const cleanText = removeVietnameseTones(text);
  const cleanQuery = removeVietnameseTones(query);
  return cleanText.includes(cleanQuery);
}

/**
 * Sanitizes free-text user input to defend against XSS / script payloads (CWE-79)
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (!input) return '';
  return String(input)
    .replace(/<\s*\/?\s*script[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Neutralizes CSV / Excel formula injection payloads (CWE-1236)
 * Prefixes strings starting with =, +, -, @, \t, \r with an apostrophe
 */
export function sanitizeSpreadsheetValue(val: string | number | unknown): string | number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const str = String(val ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Cryptographic-style keyed FNV-1a 64-bit hex signature for 45-second Kiosk QR tokens (CWE-294)
 */
const KIOSK_QR_SECRET = 'PHUONGHIHI_123_LE_LOI_Q1_SECRET_2026';

function computeKeyedSignature(payload: string): string {
  const input = `${KIOSK_QR_SECRET}::${payload}::${KIOSK_QR_SECRET}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `${hex1}${hex2}`;
}

export function generateDoorQrToken(nowMs = Date.now()): string {
  const slot = Math.floor(nowMs / 45000);
  const sig = computeKeyedSignature(`SLOT-${slot}`).slice(0, 10);
  return `PH-123LELOI-${slot}-${sig}`;
}

export function verifyDoorQrToken(token: string, nowMs = Date.now()): { valid: boolean; reason?: string } {
  const clean = (token || '').trim().toUpperCase();
  const parts = clean.split('-');
  if (parts.length !== 4 || parts[0] !== 'PH' || parts[1] !== '123LELOI') {
    return { valid: false, reason: 'Định dạng mã QR không hợp lệ' };
  }
  const slot = Number(parts[2]);
  const providedSig = parts[3];
  if (!Number.isInteger(slot) || !providedSig) {
    return { valid: false, reason: 'Mã QR thiếu chữ ký bảo mật' };
  }
  const expectedSig = computeKeyedSignature(`SLOT-${slot}`).slice(0, 10);
  if (providedSig !== expectedSig) {
    return { valid: false, reason: 'Chữ ký mã QR không khớp (nghi vấn giả mạo)' };
  }
  const currentSlot = Math.floor(nowMs / 45000);
  if (Math.abs(currentSlot - slot) > 1) {
    return { valid: false, reason: 'Mã QR đã hết hạn sau 45 giây (chống chụp ảnh màn hình)' };
  }
  return { valid: true };
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
  const cleaned = (name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PH';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
}

/**
 * Export array of objects to CSV with UTF-8 BOM & Formula Injection protection
 */
export function exportToCSV(filename: string, rows: Record<string, string | number>[]): void {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map((h) => `"${String(sanitizeSpreadsheetValue(h)).replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const safeVal = sanitizeSpreadsheetValue(row[h]);
          const val = String(safeVal ?? '').replace(/"/g, '""');
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
 * Export array of objects to native Excel (.xlsx) file with lazy-loaded SheetJS & Formula Injection protection
 */
export async function exportToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, string | number>[]
): Promise<void> {
  if (!rows || rows.length === 0) return;
  const safeRows = rows.map((row) => {
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = sanitizeSpreadsheetValue(v);
    }
    return out;
  });
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(safeRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Safely parse uploaded Excel (.xlsx, .xls, .csv) file into sanitized JSON rows
 */
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dung lượng file vượt quá giới hạn an toàn 5MB.');
  }
  const allowedExt = /\.(xlsx|xls|csv)$/i;
  if (!allowedExt.test(file.name)) {
    throw new Error('Định dạng file không hợp lệ. Chỉ chấp nhận .xlsx, .xls hoặc .csv.');
  }
  const buffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: false, cellHTML: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  const worksheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  return rawRows.slice(0, 1000).map((row) => {
    const cleanRow: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const safeKey = sanitizeTextInput(key, 100);
      cleanRow[safeKey] = typeof val === 'string' ? sanitizeTextInput(val, 300) : val;
    }
    return cleanRow;
  });
}
