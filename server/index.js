import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');
const PORT = process.env.PORT || 4000;
const MAX_BODY_BYTES = 1024 * 1024; // 1MB limit (CWE-400 DoS defense)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

const ipBuckets = new Map();
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://hienphuong99.github.io',
  'https://sites.google.com',
];

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

function sanitizePayload(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value
      .replace(/<\s*\/?\s*script\b[^>]*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .slice(0, 5000);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 2000).map((item) => sanitizePayload(item, depth + 1));
  }
  if (typeof value === 'object') {
    const clean = Object.create(null);
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k)) continue;
      clean[k] = sanitizePayload(v, depth + 1);
    }
    return clean;
  }
  return value;
}

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch {
    // ignore read errors
  }
  return { syncedAt: null, state: {} };
}

function writeDb(data) {
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tempFile, DB_FILE);
}

const server = http.createServer((req, res) => {
  // Security headers (OWASP / CWE-693)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'self' https://sites.google.com https://*.google.com;"
  );

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://hienphuong99.github.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Phuonghihi-Token');

  const clientIp = req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Too many requests. Please try again later.' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'phuonghihi REST API (Hardened)',
        time: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.url === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readDb()));
    return;
  }

  if (req.url === '/api/state' && req.method === 'POST') {
    let body = '';
    let byteCount = 0;
    let aborted = false;

    req.on('data', (chunk) => {
      byteCount += chunk.length;
      if (byteCount > MAX_BODY_BYTES) {
        aborted = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Payload too large (max 1MB).' }));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (aborted) return;
      try {
        const parsed = JSON.parse(body || '{}');
        const sanitized = sanitizePayload(parsed);
        const payload = { syncedAt: new Date().toISOString(), state: sanitized };
        writeDb(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, syncedAt: payload.syncedAt }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload.' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[phuonghihi API] Hardened server listening at http://localhost:${PORT}`);
});
