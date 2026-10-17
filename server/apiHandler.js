import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');
const QR_SECRET_FILE = path.join(__dirname, '.qr_hmac_secret');
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB limit
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 240;

const ipBuckets = new Map();
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype', 'pin', 'pinHash', 'password', 'apiSecretToken', 'token']);

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
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

function getServerQrSecret() {
  if (process.env.PHUONGHIHI_QR_SECRET) {
    return process.env.PHUONGHIHI_QR_SECRET;
  }
  try {
    if (fs.existsSync(QR_SECRET_FILE)) {
      const saved = fs.readFileSync(QR_SECRET_FILE, 'utf8').trim();
      if (saved.length >= 32) return saved;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(QR_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return 'SERVER_ONLY_FALLBACK_HMAC_KEY_DO_NOT_BUNDLE';
  }
}

const SERVER_QR_SECRET = getServerQrSecret();

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
      .slice(0, 150000); // allow compressed base64 thumbnail (~35KB)
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
 * Upsert / Merge incoming state into existing DB state so Machine B never wipes Machine A's records (Issue C1)
 */
export function mergeServerState(existingState = {}, incomingState = {}, currentSettings = {}) {
  const merged = { ...existingState };

  if (incomingState.settings && typeof incomingState.settings === 'object') {
    const cleanSettings = { ...(existingState.settings || {}), ...incomingState.settings };
    delete cleanSettings.apiSecretToken;
    merged.settings = cleanSettings;
  }

  const activeSettings = merged.settings || currentSettings || {};
  const officeLat = Number(activeSettings.officeLat) || 10.7728;
  const officeLng = Number(activeSettings.officeLng) || 106.6988;
  const allowedRadius = Number(activeSettings.allowedRadiusMeters) || 150;

  if (Array.isArray(incomingState.attendanceRecords)) {
    const validatedIncoming = incomingState.attendanceRecords.filter((rec) => {
      if (!rec || typeof rec !== 'object') return false;
      // Server-side GPS distance verification if lat/lng provided (Issue B3)
      if (rec.method === 'GPS' && typeof rec.lat === 'number' && typeof rec.lng === 'number') {
        const dist = calculateDistanceMetersServer(officeLat, officeLng, rec.lat, rec.lng);
        rec.distanceMeters = dist;
        if (dist > allowedRadius) {
          return false;
        }
      }
      return true;
    });

    merged.attendanceRecords = mergeByKey(
      existingState.attendanceRecords || [],
      validatedIncoming,
      (r) => `${r.employeeId}__${r.date}`
    );
  }

  if (Array.isArray(incomingState.employees)) {
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

  if (Array.isArray(incomingState.leaveBalances)) {
    merged.leaveBalances = mergeByKey(
      existingState.leaveBalances || [],
      incomingState.leaveBalances,
      (l) => `${l.employeeId}__${l.year}`
    );
  }

  if (Array.isArray(incomingState.timesheets)) {
    merged.timesheets = mergeByKey(
      existingState.timesheets || [],
      incomingState.timesheets,
      (t) => `${t.employeeId}__${t.period}`
    );
  }

  if (Array.isArray(incomingState.payrollPeriods)) {
    merged.payrollPeriods = mergeByKey(
      existingState.payrollPeriods || [],
      incomingState.payrollPeriods,
      (p) => p.period
    );
  }

  if (Array.isArray(incomingState.bonusDeductions)) {
    merged.bonusDeductions = mergeByKey(
      existingState.bonusDeductions || [],
      incomingState.bonusDeductions,
      (b) => b.id
    );
  }

  if (Array.isArray(incomingState.announcements)) {
    merged.announcements = mergeByKey(
      existingState.announcements || [],
      incomingState.announcements,
      (a) => a.id
    );
  }

  if (Array.isArray(incomingState.accounts)) {
    const cleanAccounts = incomingState.accounts.map((acc) => {
      const copy = { ...acc };
      delete copy.pin;
      delete copy.pinHash;
      return copy;
    });
    merged.accounts = mergeByKey(
      existingState.accounts || [],
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
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(cleanData, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tempFile, DB_FILE);
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
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Phuonghihi-Token');

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
        service: 'phuonghihi REST API (Hardened)',
        time: new Date().toISOString(),
      })
    );
    return true;
  }

  // Server-side QR signing & verification (Issue B5)
  if (urlPath === '/api/qr/generate' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const token = generateServerQrToken(body || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, token }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid QR generation request' }));
    }
    return true;
  }

  if (urlPath === '/api/qr/verify' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = verifyServerQrToken(body?.token);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, valid: false, reason: 'Invalid QR verification payload' }));
    }
    return true;
  }

  // Optional API Secret verification if PHUONGHIHI_API_SECRET env is explicitly enforced on full-state admin overwrite
  const configuredEnvSecret = process.env.PHUONGHIHI_API_SECRET;
  const headerToken = req.headers['x-phuonghihi-token'];

  if ((urlPath === '/api/state' || urlPath === '/api/sync') && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return true;
  }

  if (
    (urlPath === '/api/state' || urlPath === '/api/sync' || urlPath === '/api/attendance') &&
    req.method === 'POST'
  ) {
    try {
      const parsed = await readJsonBody(req);
      if (urlPath !== '/api/attendance' && configuredEnvSecret && headerToken !== configuredEnvSecret) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Unauthorized: invalid or missing API token.' }));
        return true;
      }
      let rawState =
        parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object'
          ? parsed.state
          : parsed;
      if (rawState && typeof rawState === 'object' && rawState.record && typeof rawState.record === 'object') {
        const recWithCoords = {
          ...rawState.record,
          ...(typeof rawState.lat === 'number' ? { lat: rawState.lat } : {}),
          ...(typeof rawState.lng === 'number' ? { lng: rawState.lng } : {}),
        };
        rawState = { attendanceRecords: [recWithCoords] };
      }
      const sanitizedIncoming = stripSecretsAndSanitize(rawState || {});
      const currentDb = readDb();
      const mergedState = mergeServerState(
        currentDb.state || {},
        sanitizedIncoming,
        currentDb.state?.settings || {}
      );
      const nextDb = {
        syncedAt: new Date().toISOString(),
        state: mergedState,
      };
      writeDb(nextDb);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, syncedAt: nextDb.syncedAt, state: mergedState }));
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
