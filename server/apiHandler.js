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
const INITIAL_CREDENTIALS_FILE = path.join(DATA_DIR, '.initial_credentials.json');

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB limit
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 240;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const ipBuckets = new Map();
const revokedSessionTokens = new Set();
// Issue M2: Track used Door QR tokens per employee so each token can only be used once per employee
const usedDoorQrTokens = new Map();

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

// Issue M2: Strict input whitelist for POST /api/attendance
// Server assigns checkIn/checkOut/date and calculates status, lateMinutes, otHours, distanceMeters
const ALLOWED_ATTENDANCE_INPUT_KEYS = new Set([
  'id',
  'employeeId',
  'date',
  'shiftCode',
  'method',
  'lat',
  'lng',
  'gpsAccuracy',
  'accuracy',
  'photoUrl',
  'note',
  'qrToken',
]);

// Full record keys allowed when reading/merging persisted state records
const ALLOWED_PERSISTED_ATTENDANCE_KEYS = new Set([
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
]);

const ALLOWED_ATTENDANCE_METHODS = new Set([
  'GPS',
  'QR tại cửa',
  'Từ xa',
  'Máy vân tay',
  'Chấm công hộ',
]);

const SERVER_SHIFT_TEMPLATES = {
  hanh_chinh: { code: 'hanh_chinh', name: 'Hành chính', startTime: '08:00', endTime: '17:30', workDays: 1.0 },
  sang: { code: 'sang', name: 'Sáng', startTime: '06:00', endTime: '14:00', workDays: 1.0 },
  chieu: { code: 'chieu', name: 'Chiều', startTime: '14:00', endTime: '22:00', workDays: 1.0 },
  dem: { code: 'dem', name: 'Đêm', startTime: '22:00', endTime: '06:00', workDays: 1.0 },
  ca_gay: { code: 'ca_gay', name: 'Ca gãy', startTime: '08:00', endTime: '21:00', workDays: 1.5 },
};

const DEFAULT_SERVER_SETTINGS = {
  gpsEnabled: true,
  requirePhotoOnGps: true,
  qrEnabled: true,
  qrScreen45s: true,
  qrPrintedAtDoor: false,
  qrManagerScanEmployee: false,
  remoteEnabled: true,
  biometricEnabled: false,
  manualProxyEnabled: true,
  officeLat: 10.7728,
  officeLng: 106.6988,
  allowedRadiusMeters: 150,
  graceLateMinutes: 5,
  allowEarlyCheckInMinutes: 45,
};

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

// Built-in employee directory metadata so server can enforce department & allowRemote even before full state sync (Issue M2)
const RAW_SERVER_EMPLOYEES = [
  ['NV0000', 'Quản lý cửa hàng (phuonghihi)', 'Phòng ban chung', 'Chính thức'],
  ['NV0001', 'Nguyễn Minh Anh', 'Nhân sự', 'Chính thức'],
  ['NV0002', 'Trần Thị Thu Hà', 'Kỹ thuật', 'Chính thức'],
  ['NV0003', 'Lê Quang Huy', 'Kinh doanh', 'Chính thức'],
  ['NV0004', 'Phạm Ngọc Lan', 'Kế toán', 'Chính thức'],
  ['NV0005', 'Nguyễn Văn Đức', 'Vận hành', 'Chính thức'],
  ['NV0006', 'Hoàng Mai Chi', 'Marketing', 'Chính thức'],
  ['NV0007', 'Vũ Tuấn Kiệt', 'Kỹ thuật', 'Chính thức'],
  ['NV0008', 'Đặng Thu Trang', 'Nhân sự', 'Chính thức'],
  ['NV0009', 'Bùi Minh Quân', 'Kinh doanh', 'Chính thức'],
  ['NV0010', 'Vũ Hải Yến', 'Kế toán', 'Chính thức'],
  ['NV0011', 'Đỗ Văn Nam', 'Kỹ thuật', 'Chính thức'],
  ['NV0012', 'Bùi Anh Tuấn', 'Vận hành', 'Chính thức'],
  ['NV0013', 'Trịnh Văn Long', 'Kỹ thuật', 'Chính thức'],
  ['NV0014', 'Lê Ngọc Mai', 'Marketing', 'Chính thức'],
  ['NV0015', 'Trần Quốc Bảo', 'Kinh doanh', 'Chính thức'],
  ['NV0016', 'Ngô Thanh Tùng', 'Kỹ thuật', 'Chính thức'],
  ['NV0017', 'Lý Thu Thảo', 'Nhân sự', 'Chính thức'],
  ['NV0018', 'Phan Minh Đức', 'Vận hành', 'Chính thức'],
  ['NV0019', 'Hồ Bích Ngọc', 'Kế toán', 'Chính thức'],
  ['NV0020', 'Dương Gia Bảo', 'Kinh doanh', 'Chính thức'],
  ['NV0021', 'Võ Hoài Nam', 'Kỹ thuật', 'Chính thức'],
  ['NV0022', 'Đoàn Khánh Linh', 'Marketing', 'Chính thức'],
  ['NV0023', 'Tạ Quang Minh', 'Kỹ thuật', 'Chính thức'],
  ['NV0024', 'Lương Hải Đăng', 'Vận hành', 'Chính thức'],
  ['NV0025', 'Cao Thị Tuyết', 'Kinh doanh', 'Chính thức'],
  ['NV0026', 'Hà Minh Trí', 'Kỹ thuật', 'Chính thức'],
  ['NV0027', 'Chu Phương Anh', 'Marketing', 'Chính thức'],
  ['NV0028', 'Đinh Gia Hân', 'Nhân sự', 'Chính thức'],
  ['NV0029', 'Đỗ Anh Khoa', 'Kỹ thuật', 'Chính thức'],
  ['NV0030', 'Mai Tuấn Anh', 'Vận hành', 'Chính thức'],
  ['NV0031', 'Lê Hải An', 'Kinh doanh', 'Chính thức'],
  ['NV0032', 'Trần Quang An 32', 'Kinh doanh', 'Chính thức'],
  ['NV0033', 'Nguyễn Thuỳ Dương', 'Kế toán', 'Chính thức'],
  ['NV0034', 'Phạm Quang An 34', 'Kế toán', 'Chính thức'],
  ['NV0035', 'Trương Quốc Khánh', 'Kỹ thuật', 'Chính thức'],
  ['NV0036', 'Bùi Quang An 36', 'Kỹ thuật', 'Chính thức'],
  ['NV0037', 'Đặng Quang An 37', 'Vận hành', 'Chính thức'],
  ['NV0038', 'Lâm Bảo Ngọc', 'Marketing', 'Chính thức'],
  ['NV0039', 'Đỗ Quang An 39', 'Kinh doanh', 'Chính thức'],
  ['NV0040', 'Kiều Minh Tuấn', 'Vận hành', 'Chính thức'],
  ['NV0041', 'Phùng Thanh Hằng', 'Nhân sự', 'Chính thức'],
  ['NV0042', 'Bùi Thanh Sơn', 'Nhân sự', 'Chính thức'],
  ['NV0043', 'Vương Đình Hiếu', 'Kỹ thuật', 'Thử việc'],
  ['NV0044', 'Tô Ngọc Ánh', 'Kinh doanh', 'Thử việc'],
  ['NV0045', 'Hoàng Thu An 45', 'Marketing', 'Thử việc'],
  ['NV0046', 'Nghiêm Xuân Phúc', 'Vận hành', 'Thử việc'],
  ['NV0047', 'Đặng Thu An 47', 'Kỹ thuật', 'Thử việc'],
  ['NV0048', 'Bùi Thu An 48', 'Marketing', 'Thử việc'],
  ['NV0049', 'Đoàn Minh Khôi', 'Vận hành', 'Tạm nghỉ'],
  ['NV0050', 'Đỗ Thu An 50', 'Vận hành', 'Đã nghỉ'],
];

const DEFAULT_SERVER_EMPLOYEES = RAW_SERVER_EMPLOYEES.map(([code, name, department, status], idx) => ({
  id: code,
  code,
  name,
  department,
  status,
  // Issue M2: NV0009 (retail counter staff) defaults to allowRemote: false
  allowRemote: code !== 'NV0009' && idx % 3 === 0,
}));

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

// Issue M3: Never store default password hashes in source code.
// On first run, generate random passwords per account and store in gitignored local files / env.
function ensureServerAuthCredentials() {
  let creds = {};
  try {
    if (fs.existsSync(AUTH_CREDENTIALS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_CREDENTIALS_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        creds = parsed;
      }
    }
  } catch {
    creds = {};
  }

  let initialPlain = {};
  try {
    if (fs.existsSync(INITIAL_CREDENTIALS_FILE)) {
      const parsedPlain = JSON.parse(fs.readFileSync(INITIAL_CREDENTIALS_FILE, 'utf8'));
      if (parsedPlain && typeof parsedPlain === 'object') {
        initialPlain = parsedPlain;
      }
    }
  } catch {
    initialPlain = {};
  }

  let changed = false;
  for (const acc of DEFAULT_SERVER_ACCOUNTS) {
    const existing = creds[acc.id];
    if (existing && typeof existing.salt === 'string' && typeof existing.hash === 'string') {
      continue;
    }
    const envKey = `PHUONGHIHI_INITIAL_PIN_${acc.id.replace('-', '_')}`;
    const rawPin =
      (process.env[envKey] && String(process.env[envKey]).trim().length >= 6
        ? String(process.env[envKey]).trim()
        : '') ||
      initialPlain[acc.id] ||
      `Ph!${crypto.randomBytes(9).toString('base64url')}`;

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(rawPin, salt, 100000, 32, 'sha256').toString('hex');
    creds[acc.id] = {
      salt,
      hash,
      mustChangePin: acc.roleId !== 'door_kiosk',
      updatedAt: new Date().toISOString(),
    };
    initialPlain[acc.id] = rawPin;
    changed = true;
  }

  if (changed) {
    try {
      fs.writeFileSync(AUTH_CREDENTIALS_FILE, JSON.stringify(creds, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
      });
      fs.writeFileSync(INITIAL_CREDENTIALS_FILE, JSON.stringify(initialPlain, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
      });
    } catch {
      // ignore write error on read-only fs
    }
  }

  return creds;
}

function readAuthCredentials() {
  return ensureServerAuthCredentials();
}

function writeAuthCredential(accountId, rawPin, mustChangePin = false) {
  const all = readAuthCredentials();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(rawPin).trim(), salt, 100000, 32, 'sha256').toString('hex');
  all[accountId] = {
    salt,
    hash,
    mustChangePin: Boolean(mustChangePin),
    updatedAt: new Date().toISOString(),
  };
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
  if (!cleanPin || cleanPin.length < 6) return { valid: false, mustChangePin: false };
  const creds = readAuthCredentials();
  const target = creds[accountId];
  if (!target || !target.salt || !target.hash) return { valid: false, mustChangePin: false };
  try {
    const computed = crypto.pbkdf2Sync(cleanPin, target.salt, 100000, 32, 'sha256');
    const expected = Buffer.from(target.hash, 'hex');
    if (computed.length !== expected.length) return { valid: false, mustChangePin: false };
    const match = crypto.timingSafeEqual(computed, expected);
    return {
      valid: match,
      mustChangePin: match ? Boolean(target.mustChangePin) : false,
    };
  } catch {
    return { valid: false, mustChangePin: false };
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

export function getEffectiveServerEmployees(dbState = null) {
  const state = dbState || readDb().state || {};
  const map = new Map();
  for (const emp of DEFAULT_SERVER_EMPLOYEES) {
    map.set(emp.id, { ...emp });
  }
  if (Array.isArray(state.employees)) {
    for (const emp of state.employees) {
      if (emp && typeof emp === 'object' && emp.id) {
        const existing = map.get(emp.id);
        map.set(emp.id, { ...(existing || {}), ...emp });
      }
    }
  }
  return Array.from(map.values());
}

export function getEffectiveServerSettings(dbState = null) {
  const state = dbState || readDb().state || {};
  return {
    ...DEFAULT_SERVER_SETTINGS,
    ...(state.settings && typeof state.settings === 'object' ? state.settings : {}),
  };
}

function getDefaultAssignedShiftForEmployeeOnDate(employeeId, dateStr) {
  const empIdx = RAW_SERVER_EMPLOYEES.findIndex(([code]) => code === employeeId);
  if (empIdx < 0) return null;
  if (RAW_SERVER_EMPLOYEES[empIdx][3] === 'Đã nghỉ') return null;

  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun, 1 = Mon .. 6 = Sat
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon .. 6 = Sun

  const specificPatterns = {
    NV0000: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
    NV0001: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'ca_gay', 'hanh_chinh', null],
    NV0002: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0003: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'dem', null, null],
    NV0004: ['sang', 'chieu', 'dem', 'sang', 'ca_gay', null, null],
    NV0005: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0006: ['ca_gay', 'ca_gay', 'ca_gay', 'ca_gay', 'chieu', null, null],
    NV0007: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'ca_gay', null, null],
    NV0008: [null, 'chieu', 'sang', 'dem', 'dem', null, null],
    NV0009: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0010: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'ca_gay', null, null],
    NV0011: ['sang', 'sang', 'chieu', 'chieu', 'chieu', null, null],
    NV0012: ['chieu', 'chieu', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0013: ['hanh_chinh', 'sang', 'chieu', 'hanh_chinh', 'ca_gay', null, null],
    NV0014: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
  };

  if (specificPatterns[employeeId]) {
    return specificPatterns[employeeId][dayOfWeek] || null;
  }
  if (dayOfWeek < 4 || dayOfWeek === 5) {
    const pool = ['hanh_chinh', 'sang', 'chieu', 'ca_gay', 'dem'];
    return pool[empIdx % pool.length];
  }
  return null;
}

export function getAssignedShiftForEmployee(employeeId, dateStr, dbState = null) {
  const state = dbState || readDb().state || {};
  if (Array.isArray(state.shiftAssignments)) {
    const found = state.shiftAssignments.find(
      (a) => a && a.employeeId === employeeId && a.date === dateStr
    );
    if (found) {
      return found.shiftCode || null;
    }
  }
  return getDefaultAssignedShiftForEmployeeOnDate(employeeId, dateStr);
}

function getVietnamServerNowParts(nowMs = Date.now()) {
  // Vietnam timezone is UTC+7
  const vnTime = new Date(nowMs + 7 * 60 * 60 * 1000);
  const yyyy = vnTime.getUTCFullYear();
  const mm = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(vnTime.getUTCDate()).padStart(2, '0');
  const hh = String(vnTime.getUTCHours()).padStart(2, '0');
  const min = String(vnTime.getUTCMinutes()).padStart(2, '0');

  const yestTime = new Date(nowMs + 7 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  const yYyyy = yestTime.getUTCFullYear();
  const yMm = String(yestTime.getUTCMonth() + 1).padStart(2, '0');
  const yDd = String(yestTime.getUTCDate()).padStart(2, '0');

  return {
    todayIso: `${yyyy}-${mm}-${dd}`,
    yesterdayIso: `${yYyyy}-${yMm}-${yDd}`,
    timeHHMM: `${hh}:${min}`,
    hour: vnTime.getUTCHours(),
  };
}

function parseTimeToMinsServer(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function calculateServerLateAndOt(
  checkIn,
  checkOut,
  shiftStart = '08:00',
  shiftEnd = '17:30',
  graceMinutes = 5
) {
  const inMins = parseTimeToMinsServer(checkIn);
  const startMins = parseTimeToMinsServer(shiftStart) ?? 480;
  const outMins = parseTimeToMinsServer(checkOut);
  const endMins = parseTimeToMinsServer(shiftEnd) ?? 1050;
  const isOvernightShift = endMins < startMins;

  let lateMinutes = 0;
  if (inMins !== null) {
    const adjustedIn = isOvernightShift && inMins < endMins + 180 ? inMins + 1440 : inMins;
    if (adjustedIn > startMins + graceMinutes) {
      lateMinutes = adjustedIn - startMins;
    }
  }

  let otHours = 0;
  if (outMins !== null) {
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

export function signSessionToken(account, extra = {}) {
  const now = Date.now();
  const payload = {
    sub: account.id,
    empId: account.employeeId || 'NV0000',
    empCode: account.employeeId || 'NV0000',
    role: account.roleId,
    scope: account.dataScope,
    dept: account.department || '',
    mustChangePin: Boolean(extra.mustChangePin),
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

    const accounts = getEffectiveServerAccounts(dbState);
    const liveAccount = accounts.find((acc) => acc.id === payload.sub);
    if (!liveAccount || !liveAccount.active) return null;

    const creds = readAuthCredentials();
    const mustChangePin = Boolean(creds[liveAccount.id]?.mustChangePin);

    return {
      sub: liveAccount.id,
      empId: liveAccount.employeeId || payload.empId,
      empCode: liveAccount.employeeId || payload.empCode,
      role: liveAccount.roleId,
      scope: liveAccount.dataScope,
      dept: liveAccount.department || '',
      mustChangePin,
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
    return false;
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
      return { valid: true, kind: 'personal', empCode: String(parsed.empCode), slot };
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
  return { valid: true, kind: 'door', slot, normalizedToken: clean };
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
    const clean = {};
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
    return cleanState;
  }

  const role = session.role;
  const scope = session.scope;
  const empId = session.empId;
  const dept = session.dept;

  if (
    scope === 'Toàn hệ thống' &&
    (role === 'super_admin' || role === 'hr' || role === 'accountant')
  ) {
    return cleanState;
  }

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
 * Validate, verify and construct a single attendance record on the server (Issues N1, N3, M1, M2)
 * - Calls stripSecretsAndSanitize at depth = 1 so fields are NEVER wiped into {} (Issue M1)
 * - Enforces strict input whitelist, QR verification + one-time token use, server date/time,
 *   server-calculated lateMinutes/status/otHours, and remoteEnabled + employee.allowRemote (Issue M2)
 */
export function validateSingleAttendanceRecord(
  rawRecord,
  topLevelLat,
  topLevelLng,
  topLevelAccuracy,
  activeSettings = {},
  options = {}
) {
  const {
    strictLiveCheckIn = false,
    topLevelQrToken = '',
    dbState = null,
    nowMs = Date.now(),
  } = options;

  if (!rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) {
    return { ok: false, error: 'Bản ghi chấm công không hợp lệ.' };
  }

  const allowedKeys = strictLiveCheckIn
    ? ALLOWED_ATTENDANCE_INPUT_KEYS
    : ALLOWED_PERSISTED_ATTENDANCE_KEYS;

  for (const key of Object.keys(rawRecord)) {
    if (!allowedKeys.has(key)) {
      return {
        ok: false,
        error: `Trường không hợp lệ hoặc không được phép tự khai báo trong bản ghi chấm công: ${key}`,
      };
    }
  }

  const employeeId = String(rawRecord.employeeId || '').trim();
  const method = String(rawRecord.method || 'GPS').trim();

  if (!/^NV\d{4}$/.test(employeeId)) {
    return { ok: false, error: 'Mã nhân viên (employeeId) không hợp lệ.' };
  }
  if (!ALLOWED_ATTENDANCE_METHODS.has(method)) {
    return { ok: false, error: 'Phương thức chấm công (method) không hợp lệ.' };
  }

  const settings = {
    ...DEFAULT_SERVER_SETTINGS,
    ...(activeSettings && typeof activeSettings === 'object' ? activeSettings : {}),
  };

  const allEmployees = getEffectiveServerEmployees(dbState);
  const targetEmployee = allEmployees.find((e) => e.id === employeeId);
  if (!targetEmployee) {
    return { ok: false, error: `Không tìm thấy nhân viên ${employeeId} trên hệ thống.` };
  }
  if (targetEmployee.status === 'Đã nghỉ') {
    return { ok: false, error: `Nhân viên ${employeeId} đã nghỉ việc, không thể chấm công.` };
  }

  const vnNow = getVietnamServerNowParts(nowMs);
  let targetDate = vnNow.todayIso;

  // Overnight shift support: if between 00:00 and 07:00 and employee had 'dem' shift yesterday
  const yesterdayAssignedShift = getAssignedShiftForEmployee(
    employeeId,
    vnNow.yesterdayIso,
    dbState
  );
  const isOvernightYesterdayAllowed = vnNow.hour < 7 && yesterdayAssignedShift === 'dem';

  if (strictLiveCheckIn) {
    if (rawRecord.date !== undefined && rawRecord.date !== null && String(rawRecord.date).trim() !== '') {
      const clientDate = String(rawRecord.date).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
        return { ok: false, error: 'Ngày chấm công (date) phải có định dạng YYYY-MM-DD.' };
      }
      if (clientDate === vnNow.todayIso) {
        targetDate = vnNow.todayIso;
      } else if (clientDate === vnNow.yesterdayIso && isOvernightYesterdayAllowed) {
        targetDate = vnNow.yesterdayIso;
      } else {
        return {
          ok: false,
          error: `Không cho phép chấm công lùi ngày hoặc khác ngày hiện tại của máy chủ (${vnNow.todayIso}). Vui lòng gửi đơn 'Bổ sung công' để quản lý duyệt.`,
        };
      }
    } else {
      targetDate = isOvernightYesterdayAllowed ? vnNow.yesterdayIso : vnNow.todayIso;
    }
  } else {
    const recDate = String(rawRecord.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recDate)) {
      return { ok: false, error: 'Ngày chấm công (date) phải có định dạng YYYY-MM-DD.' };
    }
    targetDate = recDate;
  }

  const officeLat = Number(settings.officeLat) || 10.7728;
  const officeLng = Number(settings.officeLng) || 106.6988;
  const allowedRadius = Number(settings.allowedRadiusMeters) || 150;

  let computedDistance = 0;
  let finalLat = undefined;
  let finalLng = undefined;
  let finalAccuracy = undefined;

  if (method === 'GPS') {
    if (settings.gpsEnabled === false) {
      return { ok: false, error: 'Phương thức chấm công GPS hiện đang tắt trong Cài đặt.' };
    }
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
    if (settings.qrEnabled === false) {
      return { ok: false, error: 'Phương thức chấm công QR hiện đang tắt trong Cài đặt.' };
    }
    if (strictLiveCheckIn) {
      const qrToken = String(topLevelQrToken || rawRecord.qrToken || '').trim();
      if (!qrToken) {
        return {
          ok: false,
          error: 'Chấm công "QR tại cửa" bắt buộc phải gửi kèm mã qrToken hợp lệ từ màn hình Kiosk.',
        };
      }
      const qrVerification = verifyServerQrToken(qrToken, nowMs);
      if (!qrVerification.valid || qrVerification.kind !== 'door') {
        return {
          ok: false,
          error: qrVerification.reason || 'Mã QR tại cửa không hợp lệ hoặc đã hết hạn.',
        };
      }
      const replayKey = `${qrVerification.normalizedToken || qrToken.toUpperCase()}__${employeeId}`;
      if (usedDoorQrTokens.has(replayKey)) {
        return {
          ok: false,
          error: 'Mã QR tại cửa này đã được sử dụng cho nhân viên này. Vui lòng đợi mã QR mới trên màn hình Kiosk.',
        };
      }
      usedDoorQrTokens.set(replayKey, nowMs);
      // Cleanup old replay keys (> 5 minutes)
      for (const [k, ts] of usedDoorQrTokens.entries()) {
        if (nowMs - ts > 5 * 60 * 1000) usedDoorQrTokens.delete(k);
      }
    }
    computedDistance = 5;
  } else if (method === 'Từ xa') {
    if (!settings.remoteEnabled) {
      return {
        ok: false,
        status: 403,
        error: 'Tính năng chấm công từ xa (remoteEnabled) đang tắt trên hệ thống.',
      };
    }
    if (!targetEmployee.allowRemote) {
      return {
        ok: false,
        status: 403,
        error: `Nhân viên ${employeeId} không được cấp quyền chấm công từ xa (allowRemote = false).`,
      };
    }
    computedDistance = 0;
  } else {
    computedDistance = 0;
  }

  const assignedShift = getAssignedShiftForEmployee(employeeId, targetDate, dbState);
  const hasScheduledShift = Boolean(assignedShift);
  const shiftTpl =
    (assignedShift && SERVER_SHIFT_TEMPLATES[assignedShift]) || SERVER_SHIFT_TEMPLATES.hanh_chinh;

  let finalCheckIn = undefined;
  let finalCheckOut = undefined;

  if (strictLiveCheckIn) {
    const existingRecords = Array.isArray(dbState?.attendanceRecords)
      ? dbState.attendanceRecords
      : [];
    const existingForDate = existingRecords.find(
      (r) => r && r.employeeId === employeeId && r.date === targetDate
    );
    if (existingForDate && existingForDate.checkIn) {
      finalCheckIn = String(existingForDate.checkIn).slice(0, 10);
      finalCheckOut = vnNow.timeHHMM;
    } else {
      finalCheckIn = vnNow.timeHHMM;
      finalCheckOut = undefined;
    }
  } else {
    if (rawRecord.checkIn) finalCheckIn = String(rawRecord.checkIn).slice(0, 10);
    if (rawRecord.checkOut) finalCheckOut = String(rawRecord.checkOut).slice(0, 10);
  }

  const graceMins = Math.max(0, Number(settings.graceLateMinutes ?? 5));
  const calc = calculateServerLateAndOt(
    finalCheckIn,
    finalCheckOut,
    shiftTpl.startTime,
    shiftTpl.endTime,
    graceMins
  );

  const lateMinutes = hasScheduledShift ? calc.lateMinutes : 0;
  const otHours = calc.otHours;
  const status = !finalCheckIn
    ? hasScheduledShift
      ? 'Chưa chấm'
      : 'Không có ca'
    : hasScheduledShift
    ? calc.status
    : 'Đúng giờ';

  const cleanRecord = {
    id: String(rawRecord.id || `ATT-${targetDate}-${employeeId}`).slice(0, 64),
    employeeId,
    date: targetDate,
    shiftCode: assignedShift || null,
    unscheduled: !hasScheduledShift,
    ...(finalCheckIn ? { checkIn: finalCheckIn } : {}),
    ...(finalCheckOut ? { checkOut: finalCheckOut } : {}),
    status,
    lateMinutes,
    otHours,
    method,
    distanceMeters: computedDistance,
    ...(finalAccuracy !== undefined ? { gpsAccuracy: finalAccuracy } : {}),
    ...(finalLat !== undefined ? { lat: finalLat } : {}),
    ...(finalLng !== undefined ? { lng: finalLng } : {}),
    ...(rawRecord.photoUrl ? { photoUrl: String(rawRecord.photoUrl).slice(0, 150000) } : {}),
    ...(rawRecord.note ? { note: String(rawRecord.note).slice(0, 300) } : {}),
  };

  // Issue M1: Call stripSecretsAndSanitize at depth = 1 so record fields are preserved in db.json
  return { ok: true, record: stripSecretsAndSanitize(cleanRecord, 1) };
}

/**
 * Upsert / Merge incoming state into existing DB state so Machine B never wipes Machine A's records (Issue C1)
 */
export function mergeServerState(
  existingState = {},
  incomingState = {},
  currentSettings = {},
  callerSession = null
) {
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

  if (isHrOrAdmin && Array.isArray(incomingState.employees)) {
    merged.employees = mergeByKey(
      existingState.employees || [],
      incomingState.employees,
      (e) => e.id
    );
  }

  if (Array.isArray(incomingState.shiftAssignments)) {
    merged.shiftAssignments = mergeByKey(
      existingState.shiftAssignments || [],
      incomingState.shiftAssignments,
      (a) => `${a.employeeId}__${a.date}`
    );
  }

  if (Array.isArray(incomingState.attendanceRecords)) {
    const validatedIncoming = [];
    for (const rec of incomingState.attendanceRecords) {
      if (!rec || !rec.employeeId || !rec.date) continue;
      const check = validateSingleAttendanceRecord(
        rec,
        rec?.lat,
        rec?.lng,
        rec?.gpsAccuracy ?? rec?.accuracy,
        activeSettings,
        { strictLiveCheckIn: false, dbState: merged }
      );
      if (check.ok && check.record && check.record.employeeId && check.record.date) {
        validatedIncoming.push(check.record);
      }
    }

    merged.attendanceRecords = mergeByKey(
      (existingState.attendanceRecords || []).filter((r) => r && r.employeeId && r.date),
      validatedIncoming,
      (r) => `${r.employeeId}__${r.date}`
    );
  }

  if (Array.isArray(incomingState.requests)) {
    merged.requests = mergeByKey(
      existingState.requests || [],
      incomingState.requests,
      (r) => r.id
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

  return stripSecretsAndSanitize(merged, 0);
}

export function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (parsed && parsed.state) {
        parsed.state = stripSecretsAndSanitize(parsed.state, 0);
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
    state: stripSecretsAndSanitize(data.state || {}, 0),
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
  // 1. AUTHENTICATION ENDPOINTS (Issues B1 & M3: Random initial PIN + forced first-login change)
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

      const authCheck = verifyServerAccountPin(target.id, pin);
      if (!authCheck.valid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Mật khẩu / Mã PIN xác thực không chính xác!',
          })
        );
        return true;
      }

      const sessionToken = signSessionToken(target, {
        mustChangePin: authCheck.mustChangePin,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          sessionToken,
          account: target,
          mustChangePin: authCheck.mustChangePin,
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
        mustChangePin: session.mustChangePin,
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

  if ((urlPath === '/api/auth/set-pin' || urlPath === '/api/auth/change-pin') && req.method === 'POST') {
    const currentDb = readDb();
    const session = verifySessionFromRequest(req, currentDb.state);
    const isAdminSecret = hasValidApiSecret(req);

    try {
      const body = await readJsonBody(req);
      const targetAccountId = String(body?.targetAccountId || session?.sub || '').trim();
      const newPin = String(body?.newPin || '').trim();
      const currentPin = String(body?.currentPin || '').trim();

      if (!targetAccountId || newPin.length < 6) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Mật khẩu / Mã PIN mới phải có tối thiểu 6 ký tự.',
          })
        );
        return true;
      }

      const isSelfChange = Boolean(session && session.sub === targetAccountId);
      const isHrOrAdmin =
        isAdminSecret ||
        Boolean(session && (session.role === 'super_admin' || session.role === 'hr'));

      if (!isSelfChange && !isHrOrAdmin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Chỉ Quản trị cao nhất hoặc Nhân sự (HR) mới được cấp/đặt lại mã PIN cho tài khoản khác.',
          })
        );
        return true;
      }

      if (isSelfChange && currentPin) {
        const checkOld = verifyServerAccountPin(targetAccountId, currentPin);
        if (!checkOld.valid) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Mật khẩu / Mã PIN hiện tại không đúng.',
            })
          );
          return true;
        }
        if (currentPin === newPin) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Mật khẩu / Mã PIN mới phải khác mật khẩu khởi tạo ban đầu.',
            })
          );
          return true;
        }
      }

      const nextMustChange = isSelfChange
        ? false
        : typeof body?.mustChangePin === 'boolean'
        ? body.mustChangePin
        : targetAccountId !== 'ACC-006';

      writeAuthCredential(targetAccountId, newPin, nextMustChange);
      const refreshedToken =
        isSelfChange && session
          ? signSessionToken(session.account, { mustChangePin: false })
          : undefined;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          mustChangePin: nextMustChange,
          ...(refreshedToken ? { sessionToken: refreshedToken } : {}),
        })
      );
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
  // 3. SINGLE ATTENDANCE SUBMISSION (Issues N1, N3, M1, M2)
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
    const allEmployees = getEffectiveServerEmployees(currentDb.state);
    const targetEmp = allEmployees.find((e) => e.id === targetEmpId);

    if (!targetEmp) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Mã nhân viên (employeeId) không tồn tại.' }));
      return true;
    }

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
      // Issue M2: Manager can ONLY submit attendance for employees in their own department
      if (
        session.role === 'manager' &&
        targetEmpId !== session.empId &&
        targetEmp.department !== session.dept
      ) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: `Forbidden: Quản lý phòng ${session.dept} không được gửi chấm công cho nhân viên phòng ${targetEmp.department}.`,
          })
        );
        return true;
      }
    }

    const activeSettings = getEffectiveServerSettings(currentDb.state);
    const validation = validateSingleAttendanceRecord(
      parsed.record,
      parsed.lat,
      parsed.lng,
      parsed.accuracy,
      activeSettings,
      {
        strictLiveCheckIn: true,
        topLevelQrToken: parsed.qrToken,
        dbState: currentDb.state,
      }
    );

    if (!validation.ok || !validation.record) {
      res.writeHead(validation.status || 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: validation.error }));
      return true;
    }

    const existingRecords = Array.isArray(currentDb.state?.attendanceRecords)
      ? currentDb.state.attendanceRecords.filter((r) => r && r.employeeId && r.date)
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
      const sanitizedIncoming = stripSecretsAndSanitize(rawState || {}, 0);
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
