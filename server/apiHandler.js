import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveWritableDir() {
  try {
    fs.accessSync(__dirname, fs.constants.W_OK);
    return __dirname;
  } catch {
    return os.tmpdir();
  }
}

const DATA_DIR = resolveWritableDir();
const DB_FILE = path.join(DATA_DIR, 'db.json');
const QR_SECRET_FILE = path.join(DATA_DIR, '.qr_hmac_secret');
const SESSION_SECRET_FILE = path.join(DATA_DIR, '.session_hmac_secret');
const AUTH_CREDENTIALS_FILE = path.join(DATA_DIR, '.auth_credentials.json');

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB limit
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 240;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const ipBuckets = new Map();
const revokedSessionTokens = new Set();

const FORBIDDEN_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'pin',
  'pinHash',
  'password',
  'apiSecretToken',
  'token',
  'enableGpsDemoMode',
  'demoGpsSimulationEnabled',
]);

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'https://hienphuong99.github.io',
  'https://sites.google.com',
]);

const ALLOWED_STATE_KEYS = new Set([
  'employees',
  'shiftAssignments',
  'attendanceRecords',
  'requests',
  'leaveBalances',
  'timesheets',
  'payrollPeriods',
  'bonusDeductions',
  'announcements',
  'accounts',
  'auditLogs',
  'settings',
  'exportedAt',
  'mode',
]);

const ALLOWED_ATTENDANCE_RECORD_KEYS = new Set([
  'id',
  'employeeId',
  'date',
  'shiftCode',
  'unscheduled',
  'checkIn',
  'checkOut',
  'status',
  'lateMinutes',
  'otHours',
  'method',
  'distanceMeters',
  'gpsAccuracy',
  'accuracy',
  'lat',
  'lng',
  'photoUrl',
  'note',
  'qrToken',
]);

const ALLOWED_ATTENDANCE_METHODS = new Set([
  'GPS',
  'QR tại cửa',
  'Từ xa',
  'Máy vân tay',
  'Chấm công hộ',
]);

// Built-in server account directory (merged with db.state.accounts)
const DEFAULT_SERVER_ACCOUNTS = [
  {
    id: 'ACC-001',
    employeeId: 'NV0000',
    name: 'Quản lý cửa hàng (phuonghihi)',
    username: '@admin',
    email: 'admin@phuonghihi.vn',
    roleId: 'super_admin',
    dataScope: 'Toàn hệ thống',
    active: true,
  },
  {
    id: 'ACC-002',
    employeeId: 'NV0001',
    name: 'Nguyễn Minh Anh',
    username: '@minhanh.hr',
    email: 'nv0001@phuonghihi.vn',
    roleId: 'hr',
    dataScope: 'Toàn hệ thống',
    department: 'Nhân sự',
    active: true,
  },
  {
    id: 'ACC-003',
    employeeId: 'NV0004',
    name: 'Phạm Ngọc Lan',
    username: '@ngoclan.kt',
    email: 'nv0004@phuonghihi.vn',
    roleId: 'accountant',
    dataScope: 'Toàn hệ thống',
    department: 'Kế toán',
    active: true,
  },
  {
    id: 'ACC-004',
    employeeId: 'NV0003',
    name: 'Lê Quang Huy',
    username: '@quanghuy.sales',
    email: 'nv0003@phuonghihi.vn',
    roleId: 'manager',
    dataScope: 'Chỉ phòng ban mình',
    department: 'Kinh doanh',
    active: true,
  },
  {
    id: 'ACC-005',
    employeeId: 'NV0009',
    name: 'Bùi Minh Quân',
    username: '@minhquan',
    email: 'nv0009@phuonghihi.vn',
    roleId: 'employee',
    dataScope: 'Của bản thân',
    department: 'Kinh doanh',
    active: true,
  },
  {
    id: 'ACC-006',
    employeeId: 'NV0000',
    name: 'iPad Kiosk Quầy Thu Ngân (123 Lê Lợi)',
    username: '@kiosk.quay',
    email: 'kiosk@phuonghihi.vn',
    roleId: 'door_kiosk',
    dataScope: 'Chỉ mở mã QR tại cửa',
    active: true,
  },
];

// One-way PBKDF2-SHA256 (100,000 iterations) credential hashes for server-side authentication (Issue B1)
const DEFAULT_CREDENTIAL_HASHES = {
  'ACC-001': {
    salt: 'd5c94e35947dbfb87b118edf9c2d81c6',
    hash: '2b206f08b04ed5b2c586e681f2ec634cd0e348b415ad94efac0a32f29c0499c6',
  },
  'ACC-002': {
    salt: '7e6a13de008ce11e9ce9961b8923a93f',
    hash: 'fdf0049a0f9b6aaef26a5360c089947a2ec66c663ea5a122abf1e166e7e9ea58',
  },
  'ACC-003': {
    salt: '74f67d4d21e763ca1e72b5bcf5ede4be',
    hash: '6fbc090af76eb4f4d72e4461e683c793cfb37ad69f70626900d7123489aa8387',
  },
  'ACC-004': {
    salt: '8cdd80d0c1da8fa7c386dd9cb746df15',
    hash: '986ee16e560e6bda57d7cec48cfaef46f17d411178b88e091b5cb9cdd7db383b',
  },
  'ACC-005': {
    salt: '4e82eec8dce9b46ab0d46e92051c0449',
    hash: 'f6f700d27241978ad489e91ca25328201c582f61747863946d5f0581293187e6',
  },
  'ACC-006': {
    salt: 'f085532967649129b06bbebc04eb0dab',
    hash: '95532e5f884a9f0f3e27a3a7aacb21b22d852d800df65097cf7b15cb88b87f7d',
  },
};

function getOrCreateSecretFile(envVarName, filePath, fallbackSeed) {
  if (process.env[envVarName] && String(process.env[envVarName]).trim().length >= 16) {
    return String(process.env[envVarName]).trim();
  }
  try {
    if (fs.existsSync(filePath)) {
      const saved = fs.readFileSync(filePath, 'utf8').trim();
      if (saved.length >= 32) return saved;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(filePath, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.createHash('sha256').update(fallbackSeed).digest('hex');
  }
}

const SERVER_QR_SECRET = getOrCreateSecretFile(
  'PHUONGHIHI_QR_SECRET',
  QR_SECRET_FILE,
  'PHUONGHIHI_SERVER_QR_HMAC_KEY_V3'
);

const SERVER_SESSION_SECRET = getOrCreateSecretFile(
  'PHUONGHIHI_SESSION_SECRET',
  SESSION_SECRET_FILE,
  'PHUONGHIHI_SERVER_SESSION_HMAC_KEY_V3'
);

function readAuthCredentials() {
  const merged = { ...DEFAULT_CREDENTIAL_HASHES };
  try {
    if (fs.existsSync(AUTH_CREDENTIALS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_CREDENTIALS_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'object' && typeof v.salt === 'string' && typeof v.hash === 'string') {
            merged[k] = { salt: v.salt, hash: v.hash };
          }
        }
      }
    }
  } catch {
    // ignore read error
  }
  return merged;
}

function writeAuthCredential(accountId, rawPin) {
  const all = readAuthCredentials();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(rawPin).trim(), salt, 100000, 32, 'sha256').toString('hex');
  all[accountId] = { salt, hash };
  try {
    fs.writeFileSync(AUTH_CREDENTIALS_FILE, JSON.stringify(all, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  } catch {
    // ignore write error on read-only fs
  }
}

export function verifyServerAccountPin(accountId, rawPin) {
  const cleanPin = String(rawPin || '').trim();
  if (!cleanPin || cleanPin.length < 6) return false;
  const creds = readAuthCredentials();
  const target = creds[accountId];
  if (!target || !target.salt || !target.hash) return false;
  try {
    const computed = crypto.pbkdf2Sync(cleanPin, target.salt, 100000, 32, 'sha256');
    const expected = Buffer.from(target.hash, 'hex');
    if (computed.length !== expected.length) return false;
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

export function getEffectiveServerAccounts(dbState = null) {
  const state = dbState || readDb().state || {};
  const map = new Map();
  for (const acc of DEFAULT_SERVER_ACCOUNTS) {
    map.set(acc.id, { ...acc });
  }
  if (Array.isArray(state.accounts)) {
    for (const acc of state.accounts) {
      if (acc && typeof acc === 'object' && acc.id) {
        const existing = map.get(acc.id);
        const copy = { ...(existing || {}), ...acc };
        delete copy.pin;
        delete copy.pinHash;
        map.set(acc.id, copy);
      }
    }
  }
  return Array.from(map.values());
}

export function signSessionToken(account) {
  const now = Date.now();
  const payload = {
    sub: account.id,
    empId: account.employeeId || 'NV0000',
    empCode: account.employeeId || 'NV0000',
    role: account.roleId,
    scope: account.dataScope,
    dept: account.department || '',
    iat: now,
    exp: now + SESSION_TTL_MS,
    jti: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(rawToken, dbState = null) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const trimmed = rawToken.trim();
  if (!trimmed || revokedSessionTokens.has(trimmed)) return null;
  const parts = trimmed.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  try {
    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object' || !payload.sub) return null;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;

    // Verify account still exists and is active on server
    const accounts = getEffectiveServerAccounts(dbState);
    const liveAccount = accounts.find((acc) => acc.id === payload.sub);
    if (!liveAccount || !liveAccount.active) return null;

    return {
      sub: liveAccount.id,
      empId: liveAccount.employeeId || payload.empId,
      empCode: liveAccount.employeeId || payload.empCode,
      role: liveAccount.roleId,
      scope: liveAccount.dataScope,
      dept: liveAccount.department || '',
      account: liveAccount,
    };
  } catch {
    return null;
  }
}

function extractBearerOrSessionToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const xSession = req.headers['x-phuonghihi-session'];
  if (typeof xSession === 'string' && xSession.trim()) {
    return xSession.trim();
  }
  return '';
}

function verifySessionFromRequest(req, dbState = null) {
  const token = extractBearerOrSessionToken(req);
  if (!token) return null;
  return verifySessionToken(token, dbState);
}

function hasValidApiSecret(req) {
  const configuredEnvSecret = (process.env.PHUONGHIHI_API_SECRET || '').trim();
  if (!configuredEnvSecret) {
    return false; // Never open without env secret (Issue N1)
  }
  const headerToken = (req.headers['x-phuonghihi-token'] || '').trim();
  if (!headerToken) return false;
  try {
    const a = Buffer.from(headerToken, 'utf8');
    const b = Buffer.from(configuredEnvSecret, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signServerQrPayload(payloadStr) {
  return crypto
    .createHmac('sha256', SERVER_QR_SECRET)
    .update(String(payloadStr))
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
}

export function generateServerQrToken(params = {}) {
  const nowMs = Number(params.nowMs) || Date.now();
  if (params.kind === 'personal' && params.empCode) {
    const empCode = String(params.empCode).trim();
    const slot = Math.floor(nowMs / 60000);
    const sig = signServerQrPayload(`EMP-${empCode}-${slot}`);
    return JSON.stringify({
      type: 'PHUONGHIHI_EMP_QR',
      empCode,
      empName: String(params.empName || ''),
      dept: String(params.dept || ''),
      slot,
      sig,
    });
  }
  const slot = Math.floor(nowMs / 45000);
  const sig = signServerQrPayload(`SLOT-${slot}`);
  return `PH-123LELOI-${slot}-${sig}`;
}

export function verifyServerQrToken(rawToken, nowMs = Date.now()) {
  const trimmed = String(rawToken || '').trim();
  if (!trimmed) {
    return { valid: false, reason: 'Mã QR trống' };
  }
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.token === 'string' && !parsed.type) {
        return verifyServerQrToken(parsed.token, nowMs);
      }
      if (!parsed || parsed.type !== 'PHUONGHIHI_EMP_QR' || !parsed.empCode || !parsed.sig) {
        return { valid: false, reason: 'Mã QR cá nhân không đúng định dạng phuonghihi' };
      }
      const slot = Number(parsed.slot);
      const expectedSig = signServerQrPayload(`EMP-${parsed.empCode}-${slot}`);
      if (String(parsed.sig).toUpperCase() !== expectedSig) {
        return { valid: false, reason: 'Chữ ký mã QR cá nhân không khớp (bị từ chối bởi Server)' };
      }
      const currentSlot = Math.floor(nowMs / 60000);
      if (Math.abs(currentSlot - slot) > 5) {
        return { valid: false, reason: 'Mã QR cá nhân đã quá hạn 5 phút' };
      }
      return { valid: true, kind: 'personal', empCode: String(parsed.empCode) };
    } catch {
      return { valid: false, reason: 'Dữ liệu JSON của mã QR không hợp lệ' };
    }
  }

  const clean = trimmed.toUpperCase();
  const parts = clean.split('-');
  if (parts.length !== 4 || parts[0] !== 'PH' || parts[1] !== '123LELOI') {
    return { valid: false, reason: 'Định dạng mã QR tại cửa không hợp lệ' };
  }
  const slot = Number(parts[2]);
  const providedSig = parts[3];
  if (!Number.isInteger(slot) || !providedSig) {
    return { valid: false, reason: 'Mã QR thiếu chữ ký bảo mật' };
  }
  const expectedSig = signServerQrPayload(`SLOT-${slot}`);
  if (providedSig !== expectedSig) {
    return { valid: false, reason: 'Chữ ký mã QR không khớp (bị từ chối bởi Server)' };
  }
  const currentSlot = Math.floor(nowMs / 45000);
  if (Math.abs(currentSlot - slot) > 1) {
    return { valid: false, reason: 'Mã QR tại cửa đã hết hạn sau 45 giây' };
  }
  return { valid: true, kind: 'door' };
}

function calculateDistanceMetersServer(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipBuckets.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
    ipBuckets.set(ip, { start: now, count: 1 });
    return true;
  }
  record.count += 1;
  return record.count <= MAX_REQUESTS_PER_WINDOW;
}

export function stripSecretsAndSanitize(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value
      .replace(/<\s*\/?\s*script\b[^>]*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .slice(0, 150000);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 2500).map((item) => stripSecretsAndSanitize(item, depth + 1));
  }
  if (typeof value === 'object') {
    const clean = Object.create(null);
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k)) continue;
      if (depth === 0 && !ALLOWED_STATE_KEYS.has(k)) continue;
      clean[k] = stripSecretsAndSanitize(v, depth + 1);
    }
    return clean;
  }
  return value;
}

function mergeByKey(existingArr, incomingArr, keyFn) {
  if (!Array.isArray(existingArr) && !Array.isArray(incomingArr)) return [];
  if (!Array.isArray(existingArr)) return incomingArr;
  if (!Array.isArray(incomingArr)) return existingArr;
  const map = new Map();
  for (const item of existingArr) {
    if (item && typeof item === 'object') {
      map.set(keyFn(item), item);
    }
  }
  for (const item of incomingArr) {
    if (item && typeof item === 'object') {
      const k = keyFn(item);
      const prev = map.get(k);
      if (prev) {
        map.set(k, { ...prev, ...item });
      } else {
        map.set(k, item);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Filter state returned by GET /api/state strictly to the caller's role & dataScope (Issue N2)
 */
export function filterStateBySessionScope(rawState = {}, session = null) {
  const cleanState = stripSecretsAndSanitize(rawState || {});
  if (!session) {
    return cleanState; // Admin API token caller
  }

  const role = session.role;
  const scope = session.scope;
  const empId = session.empId;
  const dept = session.dept;

  // super_admin, hr, accountant have full system scope
  if (
    scope === 'Toàn hệ thống' &&
    (role === 'super_admin' || role === 'hr' || role === 'accountant')
  ) {
    return cleanState;
  }

  // door_kiosk: never return salary, bank account, CCCD, timesheets, payroll or requests
  if (role === 'door_kiosk' || scope === 'Chỉ mở mã QR tại cửa') {
    return {
      settings: cleanState.settings
        ? {
            companyName: cleanState.settings.companyName,
            officeAddress: cleanState.settings.officeAddress,
            qrEnabled: cleanState.settings.qrEnabled,
          }
        : {},
      accounts: getEffectiveServerAccounts(cleanState),
    };
  }

  // manager: only employees and records in their department
  if (role === 'manager' || scope === 'Chỉ phòng ban mình') {
    const allEmployees = Array.isArray(cleanState.employees) ? cleanState.employees : [];
    const allowedEmployees = allEmployees.filter(
      (e) => e && (e.department === dept || e.id === empId)
    );
    const allowedEmpIds = new Set(allowedEmployees.map((e) => e.id));
    allowedEmpIds.add(empId);

    return {
      employees: allowedEmployees,
      shiftAssignments: Array.isArray(cleanState.shiftAssignments)
        ? cleanState.shiftAssignments.filter((a) => a && allowedEmpIds.has(a.employeeId))
        : [],
      attendanceRecords: Array.isArray(cleanState.attendanceRecords)
        ? cleanState.attendanceRecords.filter((r) => r && allowedEmpIds.has(r.employeeId))
        : [],
      requests: Array.isArray(cleanState.requests)
        ? cleanState.requests.filter((r) => r && allowedEmpIds.has(r.employeeId))
        : [],
      leaveBalances: Array.isArray(cleanState.leaveBalances)
        ? cleanState.leaveBalances.filter((l) => l && allowedEmpIds.has(l.employeeId))
        : [],
      timesheets: Array.isArray(cleanState.timesheets)
        ? cleanState.timesheets.filter((t) => t && allowedEmpIds.has(t.employeeId))
        : [],
      bonusDeductions: Array.isArray(cleanState.bonusDeductions)
        ? cleanState.bonusDeductions.filter((b) => b && allowedEmpIds.has(b.employeeId))
        : [],
      announcements: Array.isArray(cleanState.announcements) ? cleanState.announcements : [],
      settings: cleanState.settings,
      accounts: getEffectiveServerAccounts(cleanState),
    };
  }

  // employee (self scope): strictly only their own employee record, attendance, shifts, requests, timesheet
  return {
    employees: Array.isArray(cleanState.employees)
      ? cleanState.employees.filter((e) => e && e.id === empId)
      : [],
    shiftAssignments: Array.isArray(cleanState.shiftAssignments)
      ? cleanState.shiftAssignments.filter((a) => a && a.employeeId === empId)
      : [],
    attendanceRecords: Array.isArray(cleanState.attendanceRecords)
      ? cleanState.attendanceRecords.filter((r) => r && r.employeeId === empId)
      : [],
    requests: Array.isArray(cleanState.requests)
      ? cleanState.requests.filter((r) => r && r.employeeId === empId)
      : [],
    leaveBalances: Array.isArray(cleanState.leaveBalances)
      ? cleanState.leaveBalances.filter((l) => l && l.employeeId === empId)
      : [],
    timesheets: Array.isArray(cleanState.timesheets)
      ? cleanState.timesheets.filter((t) => t && t.employeeId === empId)
      : [],
    bonusDeductions: Array.isArray(cleanState.bonusDeductions)
      ? cleanState.bonusDeductions.filter((b) => b && b.employeeId === empId)
      : [],
    announcements: Array.isArray(cleanState.announcements) ? cleanState.announcements : [],
    settings: cleanState.settings,
    accounts: getEffectiveServerAccounts(cleanState),
  };
}

/**
 * Validate and sanitize a single attendance record (Issues N1, N3)
 */
export function validateSingleAttendanceRecord(rawRecord, topLevelLat, topLevelLng, topLevelAccuracy, activeSettings = {}) {
  if (!rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) {
    return { ok: false, error: 'Bản ghi chấm công không hợp lệ.' };
  }

  for (const key of Object.keys(rawRecord)) {
    if (!ALLOWED_ATTENDANCE_RECORD_KEYS.has(key)) {
      return { ok: false, error: `Trường không hợp lệ trong bản ghi chấm công: ${key}` };
    }
  }

  const employeeId = String(rawRecord.employeeId || '').trim();
  const date = String(rawRecord.date || '').trim();
  const method = String(rawRecord.method || 'GPS').trim();

  if (!/^NV\d{4}$/.test(employeeId)) {
    return { ok: false, error: 'Mã nhân viên (employeeId) không hợp lệ.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: 'Ngày chấm công (date) phải có định dạng YYYY-MM-DD.' };
  }
  if (!ALLOWED_ATTENDANCE_METHODS.has(method)) {
    return { ok: false, error: 'Phương thức chấm công (method) không hợp lệ.' };
  }

  const officeLat = Number(activeSettings.officeLat) || 10.7728;
  const officeLng = Number(activeSettings.officeLng) || 106.6988;
  const allowedRadius = Number(activeSettings.allowedRadiusMeters) || 150;

  let computedDistance = 0;
  let finalLat = undefined;
  let finalLng = undefined;
  let finalAccuracy = undefined;

  // Issue N3: GPS attendance MUST include valid numeric lat, lng, and accuracy; never trust client distanceMeters
  if (method === 'GPS') {
    const rawLat = typeof rawRecord.lat === 'number' ? rawRecord.lat : topLevelLat;
    const rawLng = typeof rawRecord.lng === 'number' ? rawRecord.lng : topLevelLng;
    const rawAcc =
      typeof rawRecord.gpsAccuracy === 'number'
        ? rawRecord.gpsAccuracy
        : typeof rawRecord.accuracy === 'number'
        ? rawRecord.accuracy
        : topLevelAccuracy;

    if (
      typeof rawLat !== 'number' ||
      !Number.isFinite(rawLat) ||
      rawLat < -90 ||
      rawLat > 90 ||
      typeof rawLng !== 'number' ||
      !Number.isFinite(rawLng) ||
      rawLng < -180 ||
      rawLng > 180 ||
      typeof rawAcc !== 'number' ||
      !Number.isFinite(rawAcc) ||
      rawAcc <= 0 ||
      rawAcc > 5000
    ) {
      return {
        ok: false,
        error: 'Chấm công GPS bắt buộc phải có đầy đủ tọa độ lat, lng và độ chính xác accuracy hợp lệ.',
      };
    }

    computedDistance = calculateDistanceMetersServer(officeLat, officeLng, rawLat, rawLng);
    if (computedDistance > allowedRadius) {
      return {
        ok: false,
        error: `Khoảng cách GPS thực tế (${computedDistance}m) vượt quá bán kính cho phép (${allowedRadius}m).`,
      };
    }

    finalLat = rawLat;
    finalLng = rawLng;
    finalAccuracy = Math.round(rawAcc);
  } else if (method === 'QR tại cửa') {
    computedDistance = 5;
  } else {
    computedDistance = Math.max(0, Math.min(50000, Number(rawRecord.distanceMeters) || 0));
  }

  const cleanRecord = {
    id: String(rawRecord.id || `ATT-${date}-${employeeId}`).slice(0, 64),
    employeeId,
    date,
    shiftCode: rawRecord.shiftCode ? String(rawRecord.shiftCode).slice(0, 32) : null,
    unscheduled: Boolean(rawRecord.unscheduled),
    ...(rawRecord.checkIn ? { checkIn: String(rawRecord.checkIn).slice(0, 10) } : {}),
    ...(rawRecord.checkOut ? { checkOut: String(rawRecord.checkOut).slice(0, 10) } : {}),
    status: String(rawRecord.status || 'Đúng giờ').slice(0, 32),
    lateMinutes: Math.max(0, Math.min(1440, Number(rawRecord.lateMinutes) || 0)),
    otHours: Math.max(0, Math.min(24, Number(rawRecord.otHours) || 0)),
    method,
    distanceMeters: computedDistance,
    ...(finalAccuracy !== undefined ? { gpsAccuracy: finalAccuracy } : {}),
    ...(finalLat !== undefined ? { lat: finalLat } : {}),
    ...(finalLng !== undefined ? { lng: finalLng } : {}),
    ...(rawRecord.photoUrl ? { photoUrl: String(rawRecord.photoUrl).slice(0, 150000) } : {}),
    ...(rawRecord.note ? { note: String(rawRecord.note).slice(0, 300) } : {}),
  };

  return { ok: true, record: stripSecretsAndSanitize(cleanRecord) };
}

/**
 * Upsert / Merge incoming state into existing DB state so Machine B never wipes Machine A's records (Issue C1)
 */
export function mergeServerState(existingState = {}, incomingState = {}, currentSettings = {}, callerSession = null) {
  const merged = { ...existingState };
  const isSuperAdmin = !callerSession || callerSession.role === 'super_admin';
  const isHrOrAdmin =
    !callerSession || callerSession.role === 'super_admin' || callerSession.role === 'hr';
  const isFinanceOrAdmin =
    isHrOrAdmin || (callerSession && callerSession.role === 'accountant');

  if (isSuperAdmin && incomingState.settings && typeof incomingState.settings === 'object') {
    const cleanSettings = { ...(existingState.settings || {}), ...incomingState.settings };
    delete cleanSettings.apiSecretToken;
    delete cleanSettings.enableGpsDemoMode;
    delete cleanSettings.demoGpsSimulationEnabled;
    merged.settings = cleanSettings;
  }

  const activeSettings = merged.settings || currentSettings || {};

  if (Array.isArray(incomingState.attendanceRecords)) {
    const validatedIncoming = [];
    for (const rec of incomingState.attendanceRecords) {
      const check = validateSingleAttendanceRecord(
        rec,
        rec?.lat,
        rec?.lng,
        rec?.gpsAccuracy ?? rec?.accuracy,
        activeSettings
      );
      if (check.ok && check.record) {
        validatedIncoming.push(check.record);
      }
    }

    merged.attendanceRecords = mergeByKey(
      existingState.attendanceRecords || [],
      validatedIncoming,
      (r) => `${r.employeeId}__${r.date}`
    );
  }

  if (isHrOrAdmin && Array.isArray(incomingState.employees)) {
    merged.employees = mergeByKey(
      existingState.employees || [],
      incomingState.employees,
      (e) => e.id
    );
  }

  if (Array.isArray(incomingState.requests)) {
    merged.requests = mergeByKey(
      existingState.requests || [],
      incomingState.requests,
      (r) => r.id
    );
  }

  if (Array.isArray(incomingState.shiftAssignments)) {
    merged.shiftAssignments = mergeByKey(
      existingState.shiftAssignments || [],
      incomingState.shiftAssignments,
      (a) => `${a.employeeId}__${a.date}`
    );
  }

  if (isHrOrAdmin && Array.isArray(incomingState.leaveBalances)) {
    merged.leaveBalances = mergeByKey(
      existingState.leaveBalances || [],
      incomingState.leaveBalances,
      (l) => `${l.employeeId}__${l.year}`
    );
  }

  if (isFinanceOrAdmin && Array.isArray(incomingState.timesheets)) {
    merged.timesheets = mergeByKey(
      existingState.timesheets || [],
      incomingState.timesheets,
      (t) => `${t.employeeId}__${t.period}`
    );
  }

  if (isFinanceOrAdmin && Array.isArray(incomingState.payrollPeriods)) {
    merged.payrollPeriods = mergeByKey(
      existingState.payrollPeriods || [],
      incomingState.payrollPeriods,
      (p) => p.period
    );
  }

  if (isFinanceOrAdmin && Array.isArray(incomingState.bonusDeductions)) {
    merged.bonusDeductions = mergeByKey(
      existingState.bonusDeductions || [],
      incomingState.bonusDeductions,
      (b) => b.id
    );
  }

  if (isHrOrAdmin && Array.isArray(incomingState.announcements)) {
    merged.announcements = mergeByKey(
      existingState.announcements || [],
      incomingState.announcements,
      (a) => a.id
    );
  }

  if (isSuperAdmin && Array.isArray(incomingState.accounts)) {
    const cleanAccounts = incomingState.accounts
      .filter((acc) => acc && typeof acc === 'object' && acc.id)
      .map((acc) => {
        const copy = { ...acc };
        delete copy.pin;
        delete copy.pinHash;
        return copy;
      });
    merged.accounts = mergeByKey(
      getEffectiveServerAccounts(existingState),
      cleanAccounts,
      (a) => a.id
    );
  }

  if (Array.isArray(incomingState.auditLogs)) {
    merged.auditLogs = mergeByKey(
      existingState.auditLogs || [],
      incomingState.auditLogs,
      (l) => l.id
    ).slice(0, 500);
  }

  return stripSecretsAndSanitize(merged);
}

export function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (parsed && parsed.state) {
        parsed.state = stripSecretsAndSanitize(parsed.state);
      }
      return parsed;
    }
  } catch {
    // ignore read errors
  }
  return { syncedAt: null, state: {} };
}

export function writeDb(data) {
  const cleanData = {
    syncedAt: data.syncedAt || new Date().toISOString(),
    state: stripSecretsAndSanitize(data.state || {}),
  };
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cleanData, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    fs.renameSync(tempFile, DB_FILE);
  } catch {
    // fallback if rename fails
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let byteCount = 0;
    req.on('data', (chunk) => {
      byteCount += chunk.length;
      if (byteCount > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleApiRequest(req, res) {
  const urlPath = (req.url || '').split('?')[0];
  if (!urlPath.startsWith('/api/')) return false;

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.github.io'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://hienphuong99.github.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Phuonghihi-Token, X-Phuonghihi-Session'
  );

  const clientIp = req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Too many requests.' }));
    return true;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  if (urlPath === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'phuonghihi REST API (Authenticated & Scoped)',
        time: new Date().toISOString(),
      })
    );
    return true;
  }

  // =========================================================================
  // 1. AUTHENTICATION ENDPOINTS (Issue B1: Server-side PIN verify & signed session token)
  // =========================================================================
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const accountId = String(body?.accountId || '').trim();
      const pin = String(body?.pin || '').trim();

      if (!accountId || !pin) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Vui lòng chọn tài khoản và nhập mật khẩu / mã PIN.',
          })
        );
        return true;
      }

      const currentDb = readDb();
      const accounts = getEffectiveServerAccounts(currentDb.state);
      const target = accounts.find(
        (a) => a.id === accountId || a.username.toLowerCase() === accountId.toLowerCase()
      );

      if (!target) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Tài khoản không tồn tại trên hệ thống.' }));
        return true;
      }

      if (!target.active) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Tài khoản này đã bị Quản trị viên tạm khoá.',
          })
        );
        return true;
      }

      if (!verifyServerAccountPin(target.id, pin)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Mật khẩu / Mã PIN xác thực không chính xác!',
          })
        );
        return true;
      }

      const sessionToken = signSessionToken(target);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          sessionToken,
          account: target,
        })
      );
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Yêu cầu đăng nhập không hợp lệ.' }));
    }
    return true;
  }

  if (urlPath === '/api/auth/session' && req.method === 'GET') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
        })
      );
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        account: session.account,
      })
    );
    return true;
  }

  if (urlPath === '/api/auth/logout' && req.method === 'POST') {
    const token = extractBearerOrSessionToken(req);
    if (token) {
      revokedSessionTokens.add(token);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return true;
  }

  if (urlPath === '/api/auth/set-pin' && req.method === 'POST') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);
    if (
      !isAdminSecret &&
      (!session || (session.role !== 'super_admin' && session.role !== 'hr'))
    ) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Chỉ Quản trị cao nhất hoặc Nhân sự (HR) mới được cấp/đặt lại mã PIN.',
        })
      );
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const targetAccountId = String(body?.targetAccountId || '').trim();
      const newPin = String(body?.newPin || '').trim();
      if (!targetAccountId || newPin.length < 6) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Mã PIN mới phải có tối thiểu 6 ký tự.',
          })
        );
        return true;
      }
      writeAuthCredential(targetAccountId, newPin);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Dữ liệu đặt mã PIN không hợp lệ.' }));
    }
    return true;
  }

  // =========================================================================
  // 2. QR GENERATION & VERIFICATION (Issues N2 & B5: Must be authenticated)
  // =========================================================================
  if (urlPath === '/api/qr/generate' && req.method === 'POST') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);

    if (!session && !isAdminSecret) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Unauthorized: cần phiên đăng nhập hợp lệ để lấy mã QR.',
        })
      );
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const kind = body?.kind === 'personal' ? 'personal' : 'door';

      if (kind === 'personal') {
        const requestedEmpCode = String(body?.empCode || '').trim();
        if (!requestedEmpCode) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Thiếu mã nhân viên (empCode).' }));
          return true;
        }
        // Personal QR can only be generated for the logged-in user themselves (Issue N2)
        if (
          session &&
          session.empCode !== requestedEmpCode &&
          session.empId !== requestedEmpCode &&
          session.role !== 'super_admin'
        ) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Forbidden: chỉ được lấy mã QR cá nhân của chính mình.',
            })
          );
          return true;
        }
      } else {
        // Door QR can ONLY be generated for door_kiosk or management roles (Issue N2)
        if (
          session &&
          session.role !== 'door_kiosk' &&
          session.role !== 'super_admin' &&
          session.role !== 'hr' &&
          session.role !== 'manager'
        ) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Forbidden: chỉ thiết bị Kiosk tại cửa mới được cấp mã QR cửa hàng.',
            })
          );
          return true;
        }
      }

      const token = generateServerQrToken({ ...body, kind });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, token }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid QR generation request' }));
    }
    return true;
  }

  if (urlPath === '/api/qr/verify' && req.method === 'POST') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);

    if (!session && !isAdminSecret) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          valid: false,
          reason: 'Unauthorized: vui lòng đăng nhập trước khi xác thực mã QR.',
        })
      );
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const result = verifyServerQrToken(body?.token);
      if (
        result.valid &&
        result.kind === 'personal' &&
        session &&
        result.empCode !== session.empCode &&
        result.empCode !== session.empId &&
        session.role !== 'super_admin' &&
        session.role !== 'hr'
      ) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            valid: false,
            reason: 'Không được sử dụng mã QR cá nhân của đồng nghiệp!',
          })
        );
        return true;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, valid: false, reason: 'Invalid QR verification payload' }));
    }
    return true;
  }

  // =========================================================================
  // 3. SINGLE ATTENDANCE SUBMISSION (Issues N1 & N3: Strict schema & auth)
  // =========================================================================
  if (urlPath === '/api/attendance' && req.method === 'POST') {
    let parsed;
    try {
      parsed = await readJsonBody(req);
    } catch (err) {
      const status = err?.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload.' }));
      return true;
    }

    // Issue N1: Reject immediately with 400 if body contains anything other than { record, lat, lng, accuracy, qrToken }
    const allowedTopKeys = new Set(['record', 'lat', 'lng', 'accuracy', 'qrToken']);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !parsed.record ||
      typeof parsed.record !== 'object' ||
      Array.isArray(parsed.record) ||
      Object.keys(parsed).some((k) => !allowedTopKeys.has(k))
    ) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Bad Request: /api/attendance chỉ nhận duy nhất một đối tượng record hợp lệ.',
        })
      );
      return true;
    }

    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);

    if (!session && !isAdminSecret) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Unauthorized: cần phiên đăng nhập hợp lệ để gửi chấm công.',
        })
      );
      return true;
    }

    const targetEmpId = String(parsed.record.employeeId || '').trim();
    if (session) {
      if (session.role === 'door_kiosk') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Forbidden: tài khoản Kiosk không được gửi chấm công.',
          })
        );
        return true;
      }
      if (
        (session.role === 'employee' || session.role === 'accountant') &&
        targetEmpId !== session.empId
      ) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Forbidden: chỉ được chấm công cho chính tài khoản đang đăng nhập.',
          })
        );
        return true;
      }
    }

    const validation = validateSingleAttendanceRecord(
      parsed.record,
      parsed.lat,
      parsed.lng,
      parsed.accuracy,
      currentDb.state?.settings || {}
    );

    if (!validation.ok || !validation.record) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: validation.error }));
      return true;
    }

    const existingRecords = Array.isArray(currentDb.state?.attendanceRecords)
      ? currentDb.state.attendanceRecords
      : [];
    const nextRecords = mergeByKey(
      existingRecords,
      [validation.record],
      (r) => `${r.employeeId}__${r.date}`
    );

    const nextDb = {
      syncedAt: new Date().toISOString(),
      state: {
        ...(currentDb.state || {}),
        attendanceRecords: nextRecords,
      },
    };
    writeDb(nextDb);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        syncedAt: nextDb.syncedAt,
        record: validation.record,
      })
    );
    return true;
  }

  // =========================================================================
  // 4. STATE SYNC ENDPOINTS (Issues N1 & N2: Mandatory auth & scoped response)
  // =========================================================================
  if ((urlPath === '/api/state' || urlPath === '/api/sync') && req.method === 'GET') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);

    if (!session && !isAdminSecret) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Unauthorized: bắt buộc đăng nhập hoặc có API token hợp lệ để đọc dữ liệu.',
        })
      );
      return true;
    }

    const scopedState = filterStateBySessionScope(currentDb.state || {}, session);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        syncedAt: currentDb.syncedAt,
        state: scopedState,
      })
    );
    return true;
  }

  if ((urlPath === '/api/state' || urlPath === '/api/sync') && req.method === 'POST') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);

    if (!session && !isAdminSecret) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Unauthorized: bắt buộc xác thực để đồng bộ trạng thái hệ thống.',
        })
      );
      return true;
    }

    if (
      session &&
      !isAdminSecret &&
      session.role !== 'super_admin' &&
      session.role !== 'hr' &&
      session.role !== 'accountant' &&
      session.role !== 'manager'
    ) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Forbidden: tài khoản nhân viên không có quyền ghi đè trạng thái hệ thống.',
        })
      );
      return true;
    }

    try {
      const parsed = await readJsonBody(req);
      const rawState =
        parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object'
          ? parsed.state
          : parsed;
      const sanitizedIncoming = stripSecretsAndSanitize(rawState || {});
      const mergedState = mergeServerState(
        currentDb.state || {},
        sanitizedIncoming,
        currentDb.state?.settings || {},
        isAdminSecret ? null : session
      );
      const nextDb = {
        syncedAt: new Date().toISOString(),
        state: mergedState,
      };
      writeDb(nextDb);

      const scopedResponse = filterStateBySessionScope(mergedState, isAdminSecret ? null : session);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          syncedAt: nextDb.syncedAt,
          state: scopedResponse,
        })
      );
    } catch (err) {
      const status = err?.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid or oversized JSON payload.' }));
    }
    return true;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
  return true;
}
