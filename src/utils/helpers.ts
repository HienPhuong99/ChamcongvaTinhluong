import type { NavTabId, RoleId } from '../types';

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
 * without corrupting legitimate prose containing '='
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (!input) return '';
  return String(input)
    .replace(/<\s*\/?\s*script[^>]*>/gi, '')
    .replace(/<\s*\/?\s*(iframe|object|embed|svg|math|style|link|meta)[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
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

const LOCAL_API_TOKEN_KEY = 'phuonghihi_local_api_token_v3';
const LOCAL_SESSION_TOKEN_KEY = 'phuonghihi_session_token_v3';

const FORBIDDEN_WEAK_WORDS = new Set([
  'admin',
  '@admin',
  'password',
  'phuonghihi',
  'quanly',
]);

function isSequentialOrRepeatedDigits(str: string): boolean {
  if (!/^\d+$/.test(str)) return false;
  if (/^(\d)\1+$/.test(str)) return true;
  let isAsc = true;
  let isDesc = true;
  for (let i = 1; i < str.length; i++) {
    const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
    if (diff !== 1) isAsc = false;
    if (diff !== -1) isDesc = false;
  }
  return isAsc || isDesc;
}

export function isWeakOrForbiddenPin(
  rawPin: string,
  username?: string
): string | null {
  const clean = (rawPin || '').trim();
  if (clean.length < 6) {
    return 'Mật khẩu / Mã PIN phải có tối thiểu 6 ký tự.';
  }
  const lower = clean.toLowerCase();
  if (FORBIDDEN_WEAK_WORDS.has(lower) || isSequentialOrRepeatedDigits(clean)) {
    return 'Không được đặt mã PIN mặc định, số lặp hoặc dãy số liên tiếp dễ đoán.';
  }
  if (username) {
    const cleanUser = username.trim().toLowerCase();
    const withoutAt = cleanUser.replace(/^@/, '');
    if (lower === cleanUser || lower === withoutAt) {
      return 'Không được dùng tên đăng nhập làm mã PIN.';
    }
  }
  return null;
}

export function getLocalSessionToken(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (window.localStorage.getItem(LOCAL_SESSION_TOKEN_KEY) || '').trim();
    }
  } catch {
    // ignore
  }
  return '';
}

export function setLocalSessionToken(token: string | null): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const clean = (token || '').trim();
      if (clean) {
        window.localStorage.setItem(LOCAL_SESSION_TOKEN_KEY, clean);
      } else {
        window.localStorage.removeItem(LOCAL_SESSION_TOKEN_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function getLocalApiSecretToken(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (window.localStorage.getItem(LOCAL_API_TOKEN_KEY) || '').trim();
    }
  } catch {
    // ignore
  }
  return '';
}

export function setLocalApiSecretToken(token: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const clean = (token || '').trim();
      if (clean) {
        window.localStorage.setItem(LOCAL_API_TOKEN_KEY, clean);
      } else {
        window.localStorage.removeItem(LOCAL_API_TOKEN_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function buildAuthHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const sessionToken = getLocalSessionToken();
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  const apiToken = getLocalApiSecretToken();
  if (apiToken) {
    headers['X-Phuonghihi-Token'] = apiToken;
  }
  return headers;
}

export function resolveBackendApiEndpoint(pathStr: string, customBaseUrl?: string): string {
  const custom = (customBaseUrl || '').trim().replace(/\/+$/, '');
  if (custom && custom !== '/api') {
    if (custom.endsWith('/api') && pathStr.startsWith('/api/')) {
      return `${custom}${pathStr.slice(4)}`;
    }
    return `${custom}${pathStr.startsWith('/') ? pathStr : `/${pathStr}`}`;
  }

  // On localhost / 127.0.0.1, talk directly to the local dev/Node server
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return pathStr;
  }

  const envUrl = (
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_PHUONGHIHI_BACKEND_URL || ''
  )
    .trim()
    .replace(/\/+$/, '');

  if (!envUrl || envUrl === '/api') return pathStr;
  if (envUrl.endsWith('/api') && pathStr.startsWith('/api/')) {
    return `${envUrl}${pathStr.slice(4)}`;
  }
  return `${envUrl}${pathStr.startsWith('/') ? pathStr : `/${pathStr}`}`;
}

export async function backendFetch(
  urlOrPath: string,
  init?: RequestInit
): Promise<Response> {
  if (urlOrPath.includes('script.google.com')) {
    const gasMatch = urlOrPath.match(
      /^(https:\/\/script\.google\.com\/macros\/s\/[^/]+\/(?:exec|dev))(\/.*)?$/i
    );
    const execUrl = gasMatch ? gasMatch[1] : urlOrPath;
    const gasRoute = gasMatch && gasMatch[2] ? gasMatch[2] : '/api/state';
    const method = (init?.method || 'GET').toUpperCase();
    let parsedPayload: Record<string, unknown> = {};
    if (typeof init?.body === 'string' && init.body.trim()) {
      try {
        parsedPayload = JSON.parse(init.body);
      } catch {
        parsedPayload = {};
      }
    }
    const gasRes = await fetch(execUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        __gasRoute: gasRoute,
        __gasMethod: method,
        __sessionToken: getLocalSessionToken(),
        __apiSecretToken: getLocalApiSecretToken(),
        payload: parsedPayload,
      }),
    });
    const data = await gasRes
      .json()
      .catch(() => ({ ok: false, error: 'Invalid JSON from Google Apps Script' }));
    const status =
      typeof data?.__httpStatus === 'number'
        ? data.__httpStatus
        : gasRes.ok
        ? 200
        : gasRes.status || 500;
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return fetch(urlOrPath, init);
}

/**
 * Request a server-signed Door QR or Personal QR token (Issues B5, N2)
 */
export async function requestQrFromServer(
  params:
    | { kind: 'door'; nowMs?: number; backendApiUrl?: string }
    | {
        kind: 'personal';
        empCode: string;
        empName?: string;
        name?: string;
        dept?: string;
        department?: string;
        nowMs?: number;
        backendApiUrl?: string;
      },
  customBaseUrl?: string
): Promise<string> {
  const baseUrl = customBaseUrl || params.backendApiUrl;
  const payload =
    params.kind === 'personal'
      ? {
          kind: 'personal',
          empCode: params.empCode,
          empName: params.empName || params.name || '',
          dept: params.dept || params.department || '',
          nowMs: params.nowMs,
        }
      : { kind: 'door', nowMs: params.nowMs };

  const url = resolveBackendApiEndpoint('/api/qr/generate', baseUrl);
  const res = await backendFetch(url, {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const data = await res.json();
    if (data && data.ok && typeof data.token === 'string') {
      return data.token;
    }
  }
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData?.error || 'Không thể lấy mã QR từ máy chủ');
}

export async function verifyQrWithServer(
  rawToken: string,
  customBaseUrl?: string
): Promise<{
  valid: boolean;
  kind?: 'door' | 'personal';
  empCode?: string;
  reason?: string;
  error?: string;
  serverVerified?: boolean;
}> {
  try {
    const url = resolveBackendApiEndpoint('/api/qr/verify', customBaseUrl);
    const res = await backendFetch(url, {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ token: rawToken }),
    });
    if (res.ok) {
      const data = await res.json();
      const errReason = data?.reason || data?.error;
      return {
        valid: Boolean(data?.valid),
        kind: data?.kind,
        empCode: data?.empCode,
        reason: errReason,
        error: errReason,
        serverVerified: true,
      };
    }
    if (res.status === 401 || res.status === 403) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.reason || data?.error || 'Phiên đăng nhập không hợp lệ khi xác thực QR.';
      return { valid: false, reason: msg, error: msg, serverVerified: true };
    }
  } catch {
    // Server offline
  }
  const msg = 'Chữ ký mã QR không khớp hoặc không thể kết nối máy chủ xác thực QR.';
  return {
    valid: false,
    reason: msg,
    error: msg,
    serverVerified: false,
  };
}

/**
 * Compress and resize an image File or DataURL so longest edge <= maxDim (480px) and JPEG quality = 0.6 (Issue E2)
 */
export async function compressImageToDataUrl(
  fileOrDataUrl: File | string,
  maxDim = 480,
  quality = 0.6
): Promise<string> {
  if (typeof document === 'undefined') {
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }

  // Fast background-safe path using createImageBitmap (does not stall in hidden tabs)
  if (typeof createImageBitmap === 'function') {
    try {
      const blob: Blob =
        typeof fileOrDataUrl === 'string'
          ? await (await fetch(fileOrDataUrl)).blob()
          : fileOrDataUrl;
      const bitmap = await createImageBitmap(blob);
      let width = bitmap.width || maxDim;
      let height = bitmap.height || maxDim;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.max(1, Math.round((height * maxDim) / width));
          width = maxDim;
        } else {
          width = Math.max(1, Math.round((width * maxDim) / height));
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();
        return canvas.toDataURL('image/jpeg', quality);
      }
      bitmap.close?.();
    } catch {
      // fall through to HTMLImageElement fallback
    }
  }

  const dataUrl: string =
    typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Không đọc được dữ liệu ảnh'));
          reader.onerror = () => reject(new Error('Lỗi đọc file ảnh'));
          reader.readAsDataURL(fileOrDataUrl);
        });

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width || maxDim;
      let height = img.naturalHeight || img.height || maxDim;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.max(1, Math.round((height * maxDim) / width));
          width = maxDim;
        } else {
          width = Math.max(1, Math.round((width * maxDim) / height));
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Định dạng file ảnh không hợp lệ'));
    img.src = dataUrl;
  });
}

/**
 * Date & Time Helpers (Local timezone safe)
 */
export function getTodayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthPeriod(todayIso = getTodayIsoDate()): string {
  return (todayIso || getTodayIsoDate()).slice(0, 7);
}

export function getPreviousMonthPeriod(todayIso = getTodayIsoDate()): string {
  const iso = normalizeToIsoDate(todayIso) || getTodayIsoDate();
  const [yStr, mStr] = iso.split('-');
  const y = parseInt(yStr || '2026', 10);
  const m = parseInt(mStr || '10', 10);
  const dt = new Date(y, m - 2, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

export function formatIsoToVN(isoDate: string): string {
  if (!isoDate) return '';
  const trimmed = isoDate.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return trimmed;
}

export function normalizeToIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (!d || !m || !y || y.length !== 4) return '';
    const dayNum = Number(d);
    const monthNum = Number(m);
    const yearNum = Number(y);
    if (
      !Number.isInteger(dayNum) ||
      !Number.isInteger(monthNum) ||
      !Number.isInteger(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      dayNum < 1 ||
      dayNum > 31
    ) {
      return '';
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

export function parseIsoDateLocal(isoDate: string): Date {
  const normalized = normalizeToIsoDate(isoDate) || getTodayIsoDate();
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const dt = parseIsoDateLocal(isoDate);
  dt.setDate(dt.getDate() + days);
  return getTodayIsoDate(dt);
}

export function getMondayOfIsoDate(isoDate: string): string {
  const dt = parseIsoDateLocal(isoDate);
  const dow = dt.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  dt.setDate(dt.getDate() + diffToMon);
  return getTodayIsoDate(dt);
}

export interface WeekDayColumnInfo {
  date: string;
  dayName: string;
  dayNum: string;
  monthNum: string;
  muted?: boolean;
}

export function getWeekDaysFromMonday(
  mondayIso: string,
  activeMonthStr?: string
): WeekDayColumnInfo[] {
  const mon = getMondayOfIsoDate(mondayIso);
  const shortDayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysToIsoDate(mon, i);
    const dt = parseIsoDateLocal(iso);
    const [, mStr, dStr] = iso.split('-');
    return {
      date: iso,
      dayName: shortDayNames[dt.getDay()],
      dayNum: dStr || '01',
      monthNum: mStr || '01',
      muted: activeMonthStr ? mStr !== activeMonthStr : false,
    };
  });
}

export function getDynamicPeriods(
  extraDateOrPeriod?: string
): { key: string; label: string }[] {
  const currentPeriod = getTodayIsoDate().slice(0, 7);
  const [cy, cm] = currentPeriod.split('-').map(Number);
  const set = new Set<string>([
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
    currentPeriod,
  ]);
  for (let offset = -2; offset <= 2; offset++) {
    const dt = new Date(cy, (cm || 1) - 1 + offset, 1);
    const p = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    set.add(p);
  }
  if (extraDateOrPeriod) {
    const candidate = extraDateOrPeriod.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(candidate)) {
      set.add(candidate);
    }
  }
  return Array.from(set)
    .sort()
    .reverse()
    .map((key) => {
      const [yStr, mStr] = key.split('-');
      return {
        key,
        label: `Tháng ${parseInt(mStr || '10', 10)}/${yStr || '2026'}`,
      };
    });
}

export function formatVietnameseDayHeader(isoDate: string): string {
  const dt = parseIsoDateLocal(isoDate);
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${dayNames[dt.getDay()]}, ${formatIsoToVN(isoDate)}`;
}

export function getGreetingByHour(hour = new Date().getHours()): string {
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function calculateInclusiveDays(startStr: string, endStr: string): number {
  const startIso = normalizeToIsoDate(startStr);
  const endIso = normalizeToIsoDate(endStr || startStr);
  if (!startIso || !endIso) return 0;
  if (endIso < startIso) return -1;
  const startDt = parseIsoDateLocal(startIso);
  const endDt = parseIsoDateLocal(endIso);
  const diffDays = Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function isDateExpired(expiresAtStr?: string, todayIso = getTodayIsoDate()): boolean {
  if (!expiresAtStr) return false;
  const expIso = normalizeToIsoDate(expiresAtStr);
  if (!expIso) return false;
  return expIso < todayIso;
}

export function normalizePeriodKey(periodStr: string): string {
  if (!periodStr) return getTodayIsoDate().slice(0, 7);
  const trimmed = periodStr.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  const slashParts = trimmed.split('/');
  if (slashParts.length === 2) {
    const [m, y] = slashParts;
    if (y.length === 4) return `${y}-${m.padStart(2, '0')}`;
  }
  return trimmed;
}

export function derivePeriodFromDate(dateStr: string, fallback = getTodayIsoDate().slice(0, 7)): string {
  const iso = normalizeToIsoDate(dateStr);
  if (iso && iso.length >= 7) {
    return iso.slice(0, 7);
  }
  return normalizePeriodKey(fallback);
}

/**
 * Progressive 7-bracket Personal Income Tax (Biểu thuế TNCN luỹ tiến từng phần 7 bậc Việt Nam)
 */
export function calculateProgressivePIT(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 5_000_000) {
    return Math.round(taxableIncome * 0.05);
  }
  if (taxableIncome <= 10_000_000) {
    return Math.round(taxableIncome * 0.1 - 250_000);
  }
  if (taxableIncome <= 18_000_000) {
    return Math.round(taxableIncome * 0.15 - 750_000);
  }
  if (taxableIncome <= 32_000_000) {
    return Math.round(taxableIncome * 0.2 - 1_650_000);
  }
  if (taxableIncome <= 52_000_000) {
    return Math.round(taxableIncome * 0.25 - 3_250_000);
  }
  if (taxableIncome <= 80_000_000) {
    return Math.round(taxableIncome * 0.3 - 5_850_000);
  }
  return Math.round(taxableIncome * 0.35 - 9_850_000);
}

export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr.trim())) return null;
  const [hh, mm] = timeStr.trim().split(':').map(Number);
  if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function calculateCheckInLateAndOt(
  checkInOrOpts?:
    | string
    | {
        checkIn?: string;
        checkOut?: string;
        shiftStart?: string;
        shiftEnd?: string;
        graceMinutes?: number;
      },
  checkOutArg?: string,
  shiftStartArg = '08:00',
  shiftEndArg = '17:30'
): { lateMinutes: number; otHours: number; status: 'Đúng giờ' | 'Đi muộn' } {
  const isObj = typeof checkInOrOpts === 'object' && checkInOrOpts !== null;
  const checkIn = isObj ? checkInOrOpts.checkIn : checkInOrOpts;
  const checkOut = isObj ? checkInOrOpts.checkOut : checkOutArg;
  const shiftStart = (isObj ? checkInOrOpts.shiftStart : shiftStartArg) || '08:00';
  const shiftEnd = (isObj ? checkInOrOpts.shiftEnd : shiftEndArg) || '17:30';
  const graceMinutes = isObj ? Number(checkInOrOpts.graceMinutes) || 0 : 0;

  const inMins = parseTimeToMinutes(checkIn);
  const startMins = parseTimeToMinutes(shiftStart) ?? 480;
  const outMins = parseTimeToMinutes(checkOut);
  const endMins = parseTimeToMinutes(shiftEnd) ?? 1050;
  const isOvernightShift = endMins < startMins;

  let lateMinutes = 0;
  if (inMins !== null) {
    // Handle overnight shift check-in after midnight (e.g. 00:30 for a 22:00-06:00 shift)
    const adjustedIn =
      isOvernightShift && inMins < endMins + 180 ? inMins + 1440 : inMins;
    if (adjustedIn > startMins + graceMinutes) {
      lateMinutes = adjustedIn - startMins;
    }
  }

  let otHours = 0;
  if (outMins !== null) {
    // Handle overnight shift where endMins < startMins
    const adjustedOut = outMins < startMins && isOvernightShift ? outMins + 1440 : outMins;
    const adjustedEnd = isOvernightShift ? endMins + 1440 : endMins;
    if (adjustedOut > adjustedEnd + 15) {
      otHours = Math.round(((adjustedOut - adjustedEnd) / 60) * 2) / 2;
    }
  }

  return {
    lateMinutes,
    otHours,
    status: lateMinutes > 0 ? 'Đi muộn' : 'Đúng giờ',
  };
}

/**
 * RBAC Permission Helpers
 */
const ROLE_ALLOWED_TABS: Record<RoleId, NavTabId[]> = {
  super_admin: [
    'dashboard',
    'news',
    'employees',
    'shifts',
    'attendance',
    'requests',
    'timesheet',
    'payroll',
    'reports',
    'my_profile',
    'settings',
    'permissions',
    'audit_log',
    'mobile_app',
  ],
  hr: [
    'dashboard',
    'news',
    'employees',
    'shifts',
    'attendance',
    'requests',
    'timesheet',
    'reports',
    'my_profile',
    'mobile_app',
  ],
  accountant: [
    'dashboard',
    'news',
    'timesheet',
    'payroll',
    'reports',
    'requests',
    'my_profile',
    'mobile_app',
  ],
  manager: [
    'dashboard',
    'news',
    'employees',
    'shifts',
    'attendance',
    'requests',
    'timesheet',
    'reports',
    'my_profile',
    'mobile_app',
  ],
  employee: [
    'dashboard',
    'news',
    'shifts',
    'attendance',
    'requests',
    'timesheet',
    'payroll',
    'my_profile',
    'mobile_app',
  ],
  door_kiosk: ['attendance', 'mobile_app'],
};

export function canAccessTab(roleId: RoleId, tabId: NavTabId): boolean {
  const allowed = ROLE_ALLOWED_TABS[roleId] || ROLE_ALLOWED_TABS.employee;
  return allowed.includes(tabId);
}

export function canApproveRequests(roleId: RoleId): boolean {
  return roleId === 'super_admin' || roleId === 'hr' || roleId === 'manager' || roleId === 'accountant';
}

export function canManageHR(roleId: RoleId): boolean {
  return roleId === 'super_admin' || roleId === 'hr';
}

export function canManageSchedules(roleId: RoleId): boolean {
  return roleId === 'super_admin' || roleId === 'hr' || roleId === 'manager';
}

export function canManagePayroll(roleId: RoleId): boolean {
  return roleId === 'super_admin' || roleId === 'accountant';
}

export function canManageSettings(roleId: RoleId): boolean {
  return roleId === 'super_admin';
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

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportPayslipToPDF(
  row: {
    employeeId: string;
    period: string;
    baseSalary: number;
    standardDays: number;
    actualDays: number;
    paidLeaveDays: number;
    proRatedSalary: number;
    allowance: number;
    otHours: number;
    otAmount: number;
    bonus: number;
    lateCount: number;
    lateMinutes: number;
    latePenaltyAmount: number;
    insuranceAmount: number;
    taxAmount: number;
    otherDeduction: number;
    netSalary: number;
  },
  emp?: {
    name?: string;
    code?: string;
    department?: string;
    position?: string;
    bankName?: string;
    bankAccount?: string;
  }
): void {
  if (typeof window === 'undefined') return;
  const printWin = window.open('', '_blank', 'width=760,height=860');
  if (!printWin) {
    window.print();
    return;
  }
  const empName = escapeHtml(emp?.name || row.employeeId);
  const empCode = escapeHtml(emp?.code || row.employeeId);
  const empDept = escapeHtml(emp?.department || 'Cửa hàng phuonghihi');
  const empPos = escapeHtml(emp?.position || 'Nhân viên');
  const periodSafe = escapeHtml(row.period);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Phiếu lương ${empCode} - Kỳ ${periodSafe}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; color: #0f172a; max-width: 680px; margin: 0 auto; }
    .header { background: #1d4ed8; color: #fff; padding: 20px 24px; border-radius: 14px; margin-bottom: 20px; }
    .header h1 { margin: 4px 0 0; font-size: 20px; }
    .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }
    .meta { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 8px 4px; border-bottom: 1px dashed #e2e8f0; }
    td:last-child { text-align: right; font-weight: 600; }
    .pos { color: #047857; }
    .neg { color: #e11d48; }
    .total { margin-top: 16px; padding: 16px; background: #eff6ff; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 16px; color: #1d4ed8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="sub">PHIẾU LƯƠNG CÁ NHÂN — CỬA HÀNG PHUONGHIHI (123 LÊ LỢI, Q.1)</div>
    <h1>Kỳ lương ${periodSafe}</h1>
  </div>
  <div class="meta">
    <div>
      <strong>${empName}</strong><br/>
      Mã NV: ${empCode} · ${empDept} (${empPos})
    </div>
    <div style="text-align:right">
      Công tính lương<br/>
      <strong>${row.actualDays + row.paidLeaveDays} / ${row.standardDays} ngày</strong>
    </div>
  </div>
  <table>
    <tr><td>Lương cơ bản hợp đồng</td><td>${row.baseSalary > 0 ? formatVND(row.baseSalary) : 'Chưa khai lương'}</td></tr>
    <tr><td>Lương theo ngày công thực tế</td><td>${formatVND(row.proRatedSalary)}</td></tr>
    <tr><td>Phụ cấp cố định</td><td class="pos">+${formatVND(row.allowance)}</td></tr>
    <tr><td>Lương làm thêm giờ (${row.otHours} giờ OT)</td><td class="pos">+${formatVND(row.otAmount)}</td></tr>
    <tr><td>Thưởng &amp; Hoa hồng bán lẻ iPhone</td><td class="pos">+${formatVND(row.bonus)}</td></tr>
    <tr><td>Khấu trừ đi muộn (${row.lateCount} lần · ${row.lateMinutes} phút)</td><td class="neg">-${formatVND(row.latePenaltyAmount)}</td></tr>
    <tr><td>Khấu trừ khác &amp; Tạm ứng lương (EWA)</td><td class="neg">-${formatVND(row.otherDeduction)}</td></tr>
    <tr><td>Bảo hiểm bắt buộc (BHXH/BHYT/BHTN)</td><td class="neg">-${formatVND(row.insuranceAmount)}</td></tr>
    <tr><td>Thuế TNCN lũy tiến 7 bậc</td><td class="neg">-${formatVND(row.taxAmount)}</td></tr>
  </table>
  <div class="total">
    <span>THỰC LĨNH CHUYỂN KHOẢN</span>
    <span>${formatVND(row.netSalary)}</span>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

