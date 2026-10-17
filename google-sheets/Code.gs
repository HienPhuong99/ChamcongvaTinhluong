/**
 * ============================================================================
 * CỬA HÀNG PHUONGHIHI — GOOGLE SHEETS & APPS SCRIPT BACKEND (TỰ ĐỘNG KHỞI TẠO 100%)
 * ============================================================================
 * Hỗ trợ:
 * 1. Toàn bộ REST API bảo mật của phuonghihi (/api/auth/login, /api/auth/session,
 *    /api/auth/logout, /api/auth/set-pin, /api/qr/generate, /api/qr/verify,
 *    /api/attendance, /api/state) cho bản Web trên GitHub Pages & Mobile App.
 * 2. Tự động đồng bộ vào 8 trang tính Google Sheets (NhanVien, PhanCa, DiemDanh,
 *    DonTu, BangCong, BangLuong, CaiDat, NhatKyHeThong) khi gắn với Spreadsheet.
 */

const SHEET_NAMES = {
  EMPLOYEES: 'NhanVien',
  SHIFTS: 'PhanCa',
  ATTENDANCE: 'DiemDanh',
  REQUESTS: 'DonTu',
  TIMESHEETS: 'BangCong',
  PAYROLL: 'BangLuong',
  SETTINGS: 'CaiDat',
  AUDIT_LOGS: 'NhatKyHeThong',
};

const DEFAULT_GAS_ACCOUNTS = [
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

// One-way salted SHA-256 credential hashes for server-side authentication (Issue B1)
const DEFAULT_GAS_CREDENTIAL_HASHES = {
  'ACC-001': {
    salt: '81b6a1b193744c470cf2fbb390077725',
    hash: '7cae3f717b871a327ccc096a50e6f08cfa4ecaf38d8bc08160b21243dafe8b0a',
  },
  'ACC-002': {
    salt: '2126ad40e6082f60e11b33a584963194',
    hash: '5438c4b148ad6820e82ce73818a2ca85681c2768cfa690b3de7384db6630d534',
  },
  'ACC-003': {
    salt: '8dfc8d4fa473d58876d68a4bc398c915',
    hash: 'd51a4544d5ab17bad7de21af635d56919deca3ba8378bcb8099e18203174da16',
  },
  'ACC-004': {
    salt: '0e70dbcb2ead3efdca7bcf9b41717285',
    hash: 'ee3b571f3f97c0968886aaa4bde99e4b164b940f3faca9d86171c24864134a25',
  },
  'ACC-005': {
    salt: '44246c65cb35e55e7714a0b50713b110',
    hash: 'ba0d78770561c0ecd3c5be0a1dc894cf3f66b8a14a49b6656b8af25da975f96a',
  },
  'ACC-006': {
    salt: 'adc8e861328f290d95b960707ce8cdd2',
    hash: '44f5027a70353ab2cbde7e051e7fbbfbc593c80eb5cbed1d26c0aab60416f630',
  },
};

const ALLOWED_ATTENDANCE_RECORD_KEYS = {
  id: true,
  employeeId: true,
  date: true,
  shiftCode: true,
  unscheduled: true,
  checkIn: true,
  checkOut: true,
  status: true,
  lateMinutes: true,
  otHours: true,
  method: true,
  distanceMeters: true,
  gpsAccuracy: true,
  accuracy: true,
  lat: true,
  lng: true,
  photoUrl: true,
  note: true,
  qrToken: true,
};

const ALLOWED_METHODS = {
  GPS: true,
  'QR tại cửa': true,
  'Từ xa': true,
  'Máy vân tay': true,
  'Chấm công hộ': true,
};

function bytesToHex(bytes) {
  return bytes
    .map(function (b) {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');
}

function sha256Hex(input) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(input),
    Utilities.Charset.UTF_8
  );
  return bytesToHex(raw);
}

function hmacSha256Hex(message, secret) {
  const sig = Utilities.computeHmacSha256Signature(
    String(message),
    String(secret),
    Utilities.Charset.UTF_8
  );
  return bytesToHex(sig);
}

function getOrCreateSecretProp(propKey) {
  const props = PropertiesService.getScriptProperties();
  let val = props.getProperty(propKey);
  if (!val) {
    val = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty(propKey, val);
  }
  return val;
}

function getQrHmacSecret() {
  return getOrCreateSecretProp('PHUONGHIHI_QR_SECRET_V3');
}

function getSessionHmacSecret() {
  return getOrCreateSecretProp('PHUONGHIHI_SESSION_SECRET_V3');
}

function getConfiguredApiSecret() {
  return PropertiesService.getScriptProperties().getProperty('PHUONGHIHI_API_SECRET') || '';
}

function readLargePropJson(baseKey, fallback) {
  try {
    const props = PropertiesService.getScriptProperties();
    const chunkCountStr = props.getProperty(baseKey + '__chunks');
    if (chunkCountStr) {
      const count = parseInt(chunkCountStr, 10) || 0;
      let combined = '';
      for (let i = 0; i < count; i++) {
        combined += props.getProperty(baseKey + '__' + i) || '';
      }
      return combined ? JSON.parse(combined) : fallback;
    }
    const single = props.getProperty(baseKey);
    return single ? JSON.parse(single) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeLargePropJson(baseKey, obj) {
  try {
    const props = PropertiesService.getScriptProperties();
    const str = JSON.stringify(obj);
    const chunkSize = 7500;
    if (str.length <= chunkSize) {
      props.setProperty(baseKey, str);
      props.deleteProperty(baseKey + '__chunks');
      return;
    }
    const count = Math.ceil(str.length / chunkSize);
    for (let i = 0; i < count; i++) {
      props.setProperty(baseKey + '__' + i, str.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    props.setProperty(baseKey + '__chunks', String(count));
  } catch (e) {
    // ignore quota error
  }
}

function readGasCredentials() {
  const custom = readLargePropJson('PHUONGHIHI_CUSTOM_CREDS_V3', {});
  const merged = {};
  Object.keys(DEFAULT_GAS_CREDENTIAL_HASHES).forEach(function (k) {
    merged[k] = DEFAULT_GAS_CREDENTIAL_HASHES[k];
  });
  Object.keys(custom || {}).forEach(function (k) {
    if (custom[k] && custom[k].salt && custom[k].hash) {
      merged[k] = custom[k];
    }
  });
  return merged;
}

function writeGasCredential(accountId, rawPin) {
  const custom = readLargePropJson('PHUONGHIHI_CUSTOM_CREDS_V3', {});
  const salt = Utilities.getUuid().replace(/-/g, '');
  const hash = sha256Hex(salt + ':' + String(rawPin).trim());
  custom[accountId] = { salt: salt, hash: hash };
  writeLargePropJson('PHUONGHIHI_CUSTOM_CREDS_V3', custom);
}

function verifyGasAccountPin(accountId, rawPin) {
  const cleanPin = String(rawPin || '').trim();
  if (!cleanPin || cleanPin.length < 6) return false;
  const creds = readGasCredentials();
  const target = creds[accountId];
  if (!target || !target.salt || !target.hash) return false;
  const computed = sha256Hex(target.salt + ':' + cleanPin);
  return computed === target.hash;
}

function getEffectiveGasAccounts(state) {
  const st = state || readGasState();
  const map = {};
  DEFAULT_GAS_ACCOUNTS.forEach(function (acc) {
    map[acc.id] = JSON.parse(JSON.stringify(acc));
  });
  if (st && Array.isArray(st.accounts)) {
    st.accounts.forEach(function (acc) {
      if (acc && acc.id) {
        const copy = JSON.parse(JSON.stringify(acc));
        delete copy.pin;
        delete copy.pinHash;
        map[acc.id] = copy;
      }
    });
  }
  return Object.keys(map).map(function (k) {
    return map[k];
  });
}

function signGasSessionToken(account) {
  const now = Date.now();
  const payload = {
    sub: account.id,
    empId: account.employeeId || 'NV0000',
    empCode: account.employeeId || 'NV0000',
    role: account.roleId,
    scope: account.dataScope,
    dept: account.department || '',
    iat: now,
    exp: now + 12 * 60 * 60 * 1000,
  };
  const payloadB64 = Utilities.base64EncodeWebSafe(
    Utilities.newBlob(JSON.stringify(payload), 'application/json').getBytes()
  ).replace(/=+$/, '');
  const sig = hmacSha256Hex(payloadB64, getSessionHmacSecret());
  return payloadB64 + '.' + sig;
}

function verifyGasSessionToken(rawToken, state) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const parts = rawToken.trim().split('.');
  if (parts.length !== 2) return null;
  const payloadB64 = parts[0];
  const providedSig = parts[1];
  const expectedSig = hmacSha256Hex(payloadB64, getSessionHmacSecret());
  if (providedSig !== expectedSig) return null;
  try {
    const jsonStr = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadB64)).getDataAsString();
    const payload = JSON.parse(jsonStr);
    if (!payload || !payload.sub || Date.now() > payload.exp) return null;
    const accounts = getEffectiveGasAccounts(state);
    let liveAcc = null;
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].id === payload.sub) {
        liveAcc = accounts[i];
        break;
      }
    }
    if (!liveAcc || !liveAcc.active) return null;
    return {
      sub: liveAcc.id,
      empId: liveAcc.employeeId || payload.empId,
      empCode: liveAcc.employeeId || payload.empCode,
      role: liveAcc.roleId,
      scope: liveAcc.dataScope,
      dept: liveAcc.department || '',
      account: liveAcc,
    };
  } catch (e) {
    return null;
  }
}

function signGasQrPayload(payloadStr) {
  return hmacSha256Hex(payloadStr, getQrHmacSecret()).slice(0, 12).toUpperCase();
}

function generateGasQrToken(params) {
  const p = params || {};
  const nowMs = Number(p.nowMs) || Date.now();
  if (p.kind === 'personal' && p.empCode) {
    const empCode = String(p.empCode).trim();
    const slot = Math.floor(nowMs / 60000);
    const sig = signGasQrPayload('EMP-' + empCode + '-' + slot);
    return JSON.stringify({
      type: 'PHUONGHIHI_EMP_QR',
      empCode: empCode,
      empName: String(p.empName || ''),
      dept: String(p.dept || ''),
      slot: slot,
      sig: sig,
    });
  }
  const slot = Math.floor(nowMs / 45000);
  const sig = signGasQrPayload('SLOT-' + slot);
  return 'PH-123LELOI-' + slot + '-' + sig;
}

function verifyGasQrToken(rawToken, nowMs) {
  const now = nowMs || Date.now();
  const trimmed = String(rawToken || '').trim();
  if (!trimmed) return { valid: false, reason: 'Mã QR trống' };
  if (trimmed.indexOf('{') === 0) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.token === 'string' && !parsed.type) {
        return verifyGasQrToken(parsed.token, now);
      }
      if (!parsed || parsed.type !== 'PHUONGHIHI_EMP_QR' || !parsed.empCode || !parsed.sig) {
        return { valid: false, reason: 'Mã QR cá nhân không đúng định dạng phuonghihi' };
      }
      const slot = Number(parsed.slot);
      const expectedSig = signGasQrPayload('EMP-' + parsed.empCode + '-' + slot);
      if (String(parsed.sig).toUpperCase() !== expectedSig) {
        return { valid: false, reason: 'Chữ ký mã QR cá nhân không khớp (bị từ chối bởi Server)' };
      }
      const currentSlot = Math.floor(now / 60000);
      if (Math.abs(currentSlot - slot) > 5) {
        return { valid: false, reason: 'Mã QR cá nhân đã quá hạn 5 phút' };
      }
      return { valid: true, kind: 'personal', empCode: String(parsed.empCode) };
    } catch (e) {
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
  const expectedSig = signGasQrPayload('SLOT-' + slot);
  if (providedSig !== expectedSig) {
    return { valid: false, reason: 'Chữ ký mã QR không khớp (bị từ chối bởi Server)' };
  }
  const currentSlot = Math.floor(now / 45000);
  if (Math.abs(currentSlot - slot) > 1) {
    return { valid: false, reason: 'Mã QR tại cửa đã hết hạn sau 45 giây' };
  }
  return { valid: true, kind: 'door' };
}

function calcDistanceMetersGas(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = function (deg) {
    return (deg * Math.PI) / 180;
  };
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function mergeArrayByKey(existingArr, incomingArr, keyFn) {
  const a = Array.isArray(existingArr) ? existingArr : [];
  const b = Array.isArray(incomingArr) ? incomingArr : [];
  const map = {};
  const order = [];
  a.forEach(function (item) {
    if (item && typeof item === 'object') {
      const k = keyFn(item);
      if (map[k] === undefined) order.push(k);
      map[k] = item;
    }
  });
  b.forEach(function (item) {
    if (item && typeof item === 'object') {
      const k = keyFn(item);
      if (map[k] === undefined) {
        order.push(k);
        map[k] = item;
      } else {
        const merged = {};
        Object.keys(map[k]).forEach(function (prop) {
          merged[prop] = map[k][prop];
        });
        Object.keys(item).forEach(function (prop) {
          merged[prop] = item[prop];
        });
        map[k] = merged;
      }
    }
  });
  return order.map(function (k) {
    return map[k];
  });
}

function readGasState() {
  const st = readLargePropJson('PHUONGHIHI_SYNC_STATE_V3', {});
  const att = readLargePropJson('PHUONGHIHI_ATTENDANCE_V3', []);
  if (Array.isArray(att) && att.length > 0) {
    st.attendanceRecords = mergeArrayByKey(
      st.attendanceRecords || [],
      att,
      function (r) {
        return r.employeeId + '__' + r.date;
      }
    );
  }
  return st;
}

function writeGasState(state) {
  const copy = JSON.parse(JSON.stringify(state || {}));
  if (Array.isArray(copy.attendanceRecords)) {
    // Strip large base64 photos if needed to keep PropertiesService fast and compact
    const compactAtt = copy.attendanceRecords.slice(-400).map(function (r) {
      const c = JSON.parse(JSON.stringify(r));
      if (c.photoUrl && c.photoUrl.length > 4000) {
        delete c.photoUrl;
      }
      return c;
    });
    writeLargePropJson('PHUONGHIHI_ATTENDANCE_V3', compactAtt);
    copy.attendanceRecords = compactAtt;
  }
  writeLargePropJson('PHUONGHIHI_SYNC_STATE_V3', copy);
  PropertiesService.getScriptProperties().setProperty(
    'PHUONGHIHI_LAST_SYNCED_AT_V3',
    new Date().toISOString()
  );
}

function filterStateByScopeGas(rawState, session) {
  const st = rawState || {};
  if (!session) return st;
  const role = session.role;
  const scope = session.scope;
  const empId = session.empId;
  const dept = session.dept;

  if (
    scope === 'Toàn hệ thống' &&
    (role === 'super_admin' || role === 'hr' || role === 'accountant')
  ) {
    return st;
  }
  if (role === 'door_kiosk' || scope === 'Chỉ mở mã QR tại cửa') {
    return {
      settings: st.settings
        ? {
            companyName: st.settings.companyName,
            officeAddress: st.settings.officeAddress,
            qrEnabled: st.settings.qrEnabled,
          }
        : {},
      accounts: getEffectiveGasAccounts(st),
    };
  }
  if (role === 'manager' || scope === 'Chỉ phòng ban mình') {
    const emps = Array.isArray(st.employees)
      ? st.employees.filter(function (e) {
          return e && (e.department === dept || e.id === empId);
        })
      : [];
    const allowedMap = {};
    allowedMap[empId] = true;
    emps.forEach(function (e) {
      allowedMap[e.id] = true;
    });
    return {
      employees: emps,
      attendanceRecords: Array.isArray(st.attendanceRecords)
        ? st.attendanceRecords.filter(function (r) {
            return r && allowedMap[r.employeeId];
          })
        : [],
      shiftAssignments: Array.isArray(st.shiftAssignments)
        ? st.shiftAssignments.filter(function (a) {
            return a && allowedMap[a.employeeId];
          })
        : [],
      requests: Array.isArray(st.requests)
        ? st.requests.filter(function (r) {
            return r && allowedMap[r.employeeId];
          })
        : [],
      settings: st.settings,
      accounts: getEffectiveGasAccounts(st),
    };
  }
  return {
    employees: Array.isArray(st.employees)
      ? st.employees.filter(function (e) {
          return e && e.id === empId;
        })
      : [],
    attendanceRecords: Array.isArray(st.attendanceRecords)
      ? st.attendanceRecords.filter(function (r) {
          return r && r.employeeId === empId;
        })
      : [],
    shiftAssignments: Array.isArray(st.shiftAssignments)
      ? st.shiftAssignments.filter(function (a) {
          return a && a.employeeId === empId;
        })
      : [],
    requests: Array.isArray(st.requests)
      ? st.requests.filter(function (r) {
          return r && r.employeeId === empId;
        })
      : [],
    settings: st.settings,
    accounts: getEffectiveGasAccounts(st),
  };
}

function validateSingleAttendanceGas(rawRecord, topLat, topLng, topAcc, settings) {
  if (!rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) {
    return { ok: false, error: 'Bản ghi chấm công không hợp lệ.' };
  }
  const keys = Object.keys(rawRecord);
  for (let i = 0; i < keys.length; i++) {
    if (!ALLOWED_ATTENDANCE_RECORD_KEYS[keys[i]]) {
      return { ok: false, error: 'Trường không hợp lệ trong bản ghi chấm công: ' + keys[i] };
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
  if (!ALLOWED_METHODS[method]) {
    return { ok: false, error: 'Phương thức chấm công không hợp lệ.' };
  }

  const s = settings || {};
  const officeLat = Number(s.officeLat) || 10.7728;
  const officeLng = Number(s.officeLng) || 106.6988;
  const allowedRadius = Number(s.allowedRadiusMeters) || 150;
  let computedDistance = 0;

  if (method === 'GPS') {
    const rawLat = typeof rawRecord.lat === 'number' ? rawRecord.lat : topLat;
    const rawLng = typeof rawRecord.lng === 'number' ? rawRecord.lng : topLng;
    const rawAcc =
      typeof rawRecord.gpsAccuracy === 'number'
        ? rawRecord.gpsAccuracy
        : typeof rawRecord.accuracy === 'number'
        ? rawRecord.accuracy
        : topAcc;
    if (
      typeof rawLat !== 'number' ||
      isNaN(rawLat) ||
      typeof rawLng !== 'number' ||
      isNaN(rawLng) ||
      typeof rawAcc !== 'number' ||
      isNaN(rawAcc) ||
      rawAcc <= 0
    ) {
      return {
        ok: false,
        error: 'Chấm công GPS bắt buộc phải có đầy đủ tọa độ lat, lng và accuracy hợp lệ.',
      };
    }
    computedDistance = calcDistanceMetersGas(officeLat, officeLng, rawLat, rawLng);
    if (computedDistance > allowedRadius) {
      return {
        ok: false,
        error:
          'Khoảng cách GPS thực tế (' +
          computedDistance +
          'm) vượt quá bán kính cho phép (' +
          allowedRadius +
          'm).',
      };
    }
  } else if (method === 'QR tại cửa') {
    computedDistance = 5;
  } else {
    computedDistance = Math.max(0, Number(rawRecord.distanceMeters) || 0);
  }

  return {
    ok: true,
    record: {
      id: String(rawRecord.id || 'ATT-' + date + '-' + employeeId).slice(0, 64),
      employeeId: employeeId,
      date: date,
      shiftCode: rawRecord.shiftCode || null,
      unscheduled: Boolean(rawRecord.unscheduled),
      checkIn: rawRecord.checkIn || undefined,
      checkOut: rawRecord.checkOut || undefined,
      status: String(rawRecord.status || 'Đúng giờ'),
      lateMinutes: Math.max(0, Number(rawRecord.lateMinutes) || 0),
      otHours: Math.max(0, Number(rawRecord.otHours) || 0),
      method: method,
      distanceMeters: computedDistance,
      note: rawRecord.note ? String(rawRecord.note).slice(0, 300) : undefined,
    },
  };
}

/**
 * Chống tấn công Formula Injection (CWE-1236) khi ghi dữ liệu vào Google Sheets
 */
function sanitizeSheetCell(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const str = String(val).slice(0, 1000);
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Chống tấn công HTML Injection / XSS (CWE-79) trong nội dung Email tự động
 */
function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function stripSensitiveSettings(settings) {
  if (!settings || typeof settings !== 'object') return settings;
  const copy = JSON.parse(JSON.stringify(settings));
  delete copy.apiSecretToken;
  delete copy.token;
  delete copy.pin;
  delete copy.demoGpsSimulationEnabled;
  delete copy.enableGpsDemoMode;
  return copy;
}

/**
 * Tự động tạo toàn bộ các trang tính (Sheets) và tiêu đề cột chuẩn phuonghihi
 */
function setupPhuonghihiDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return 'Chưa gắn với Spreadsheet';
  const schemas = {
    [SHEET_NAMES.EMPLOYEES]: [
      'Mã NV', 'Họ tên', 'Email', 'Số điện thoại', 'Ngày sinh',
      'Phòng ban', 'Chức vụ', 'Trạng thái', 'Ngày vào',
      'Lương cơ bản', 'Phụ cấp', 'Người phụ thuộc', 'Cho phép từ xa'
    ],
    [SHEET_NAMES.SHIFTS]: [
      'Mã NV', 'Ngày (YYYY-MM-DD)', 'Mã Ca', 'Cập nhật lúc'
    ],
    [SHEET_NAMES.ATTENDANCE]: [
      'ID', 'Mã NV', 'Ngày', 'Ca làm', 'Giờ vào', 'Giờ ra',
      'Trạng thái', 'Đi muộn (phút)', 'OT (giờ)', 'Hình thức', 'Khoảng cách (m)', 'Ghi chú'
    ],
    [SHEET_NAMES.REQUESTS]: [
      'Mã Đơn', 'Mã NV', 'Loại đơn', 'Từ ngày', 'Đến ngày',
      'Lý do', 'Trạng thái', 'Ngày tạo'
    ],
    [SHEET_NAMES.TIMESHEETS]: [
      'Kỳ công', 'Mã NV', 'Công chuẩn', 'Công thực tế',
      'Phép', 'Vắng', 'Số lần muộn', 'Tổng phút muộn', 'Giờ OT', 'Xác nhận'
    ],
    [SHEET_NAMES.PAYROLL]: [
      'Kỳ lương', 'Mã NV', 'Lương cơ bản', 'Ngày công', 'Lương theo công',
      'Phụ cấp', 'Lương OT', 'Thưởng', 'Phạt đi muộn', 'Khấu trừ khác / EWA', 'BHXH (10.5%)', 'Thuế TNCN', 'Thực lĩnh'
    ],
    [SHEET_NAMES.SETTINGS]: ['Khóa cấu hình', 'Giá trị JSON', 'Cập nhật lúc'],
    [SHEET_NAMES.AUDIT_LOGS]: ['Thời gian', 'Người thực hiện', 'Thao tác', 'Đối tượng', 'Chi tiết'],
  };

  Object.keys(schemas).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schemas[name]);
      sheet.getRange(1, 1, 1, schemas[name].length)
        .setFontWeight('bold')
        .setBackground('#EFF6FF')
        .setFontColor('#1E40AF');
      sheet.setFrozenRows(1);
    }
  });

  return 'Đã khởi tạo hoàn tất cơ sở dữ liệu phuonghihi trên Google Sheets!';
}

function handleGasRestRoute(route, method, body, sessionToken, apiSecretToken) {
  const currentState = readGasState();
  const session = verifyGasSessionToken(sessionToken, currentState);
  const configuredSecret = getConfiguredApiSecret();
  const isAdminSecret = Boolean(configuredSecret && apiSecretToken && apiSecretToken === configuredSecret);

  if (route === '/api/health') {
    return {
      __httpStatus: 200,
      status: 'ok',
      service: 'phuonghihi Google Apps Script API (Authenticated & Scoped)',
      time: new Date().toISOString(),
    };
  }

  if (route === '/api/auth/login' && method === 'POST') {
    const accountId = String((body && body.accountId) || '').trim();
    const pin = String((body && body.pin) || '').trim();
    if (!accountId || !pin) {
      return {
        __httpStatus: 400,
        ok: false,
        error: 'Vui lòng chọn tài khoản và nhập mật khẩu / mã PIN.',
      };
    }
    const accounts = getEffectiveGasAccounts(currentState);
    let target = null;
    for (let i = 0; i < accounts.length; i++) {
      if (
        accounts[i].id === accountId ||
        String(accounts[i].username || '').toLowerCase() === accountId.toLowerCase()
      ) {
        target = accounts[i];
        break;
      }
    }
    if (!target) {
      return { __httpStatus: 401, ok: false, error: 'Tài khoản không tồn tại trên hệ thống.' };
    }
    if (!target.active) {
      return { __httpStatus: 403, ok: false, error: 'Tài khoản này đã bị Quản trị viên tạm khoá.' };
    }
    if (!verifyGasAccountPin(target.id, pin)) {
      return {
        __httpStatus: 401,
        ok: false,
        error: 'Mật khẩu / Mã PIN xác thực không chính xác!',
      };
    }
    const newSessionToken = signGasSessionToken(target);
    return {
      __httpStatus: 200,
      ok: true,
      sessionToken: newSessionToken,
      account: target,
    };
  }

  if (route === '/api/auth/session') {
    if (!session) {
      return {
        __httpStatus: 401,
        ok: false,
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
      };
    }
    return {
      __httpStatus: 200,
      ok: true,
      account: session.account,
    };
  }

  if (route === '/api/auth/logout') {
    return { __httpStatus: 200, ok: true };
  }

  if (route === '/api/auth/set-pin' && method === 'POST') {
    if (!isAdminSecret && (!session || (session.role !== 'super_admin' && session.role !== 'hr'))) {
      return {
        __httpStatus: 403,
        ok: false,
        error: 'Chỉ Quản trị cao nhất hoặc Nhân sự (HR) mới được cấp/đặt lại mã PIN.',
      };
    }
    const targetAccountId = String((body && body.targetAccountId) || '').trim();
    const newPin = String((body && body.newPin) || '').trim();
    if (!targetAccountId || newPin.length < 6) {
      return { __httpStatus: 400, ok: false, error: 'Mã PIN mới phải có tối thiểu 6 ký tự.' };
    }
    writeGasCredential(targetAccountId, newPin);
    return { __httpStatus: 200, ok: true };
  }

  if (route === '/api/qr/generate' && method === 'POST') {
    if (!session && !isAdminSecret) {
      return {
        __httpStatus: 401,
        ok: false,
        error: 'Unauthorized: cần phiên đăng nhập hợp lệ để lấy mã QR.',
      };
    }
    const kind = body && body.kind === 'personal' ? 'personal' : 'door';
    if (kind === 'personal') {
      const requestedEmpCode = String((body && body.empCode) || '').trim();
      if (!requestedEmpCode) {
        return { __httpStatus: 400, ok: false, error: 'Thiếu mã nhân viên (empCode).' };
      }
      if (
        session &&
        session.empCode !== requestedEmpCode &&
        session.empId !== requestedEmpCode &&
        session.role !== 'super_admin'
      ) {
        return {
          __httpStatus: 403,
          ok: false,
          error: 'Forbidden: chỉ được lấy mã QR cá nhân của chính mình.',
        };
      }
    } else {
      if (
        session &&
        session.role !== 'door_kiosk' &&
        session.role !== 'super_admin' &&
        session.role !== 'hr' &&
        session.role !== 'manager'
      ) {
        return {
          __httpStatus: 403,
          ok: false,
          error: 'Forbidden: chỉ thiết bị Kiosk tại cửa mới được cấp mã QR cửa hàng.',
        };
      }
    }
    const qrToken = generateGasQrToken({
      kind: kind,
      empCode: body && body.empCode,
      empName: body && body.empName,
      dept: body && body.dept,
      nowMs: body && body.nowMs,
    });
    return { __httpStatus: 200, ok: true, token: qrToken };
  }

  if (route === '/api/qr/verify' && method === 'POST') {
    if (!session && !isAdminSecret) {
      return {
        __httpStatus: 401,
        ok: false,
        valid: false,
        reason: 'Unauthorized: vui lòng đăng nhập trước khi xác thực mã QR.',
      };
    }
    const result = verifyGasQrToken(body && body.token);
    if (
      result.valid &&
      result.kind === 'personal' &&
      session &&
      result.empCode !== session.empCode &&
      result.empCode !== session.empId &&
      session.role !== 'super_admin' &&
      session.role !== 'hr'
    ) {
      return {
        __httpStatus: 200,
        ok: true,
        valid: false,
        reason: 'Không được sử dụng mã QR cá nhân của đồng nghiệp!',
      };
    }
    return { __httpStatus: 200, ok: true, valid: result.valid, kind: result.kind, empCode: result.empCode, reason: result.reason };
  }

  if (route === '/api/attendance' && method === 'POST') {
    const allowedTop = { record: true, lat: true, lng: true, accuracy: true, qrToken: true };
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      !body.record ||
      typeof body.record !== 'object' ||
      Array.isArray(body.record) ||
      Object.keys(body).some(function (k) {
        return !allowedTop[k];
      })
    ) {
      return {
        __httpStatus: 400,
        ok: false,
        error: 'Bad Request: /api/attendance chỉ nhận duy nhất một đối tượng record hợp lệ.',
      };
    }
    if (!session && !isAdminSecret) {
      return {
        __httpStatus: 401,
        ok: false,
        error: 'Unauthorized: cần phiên đăng nhập hợp lệ để gửi chấm công.',
      };
    }
    const targetEmpId = String(body.record.employeeId || '').trim();
    if (session) {
      if (session.role === 'door_kiosk') {
        return { __httpStatus: 403, ok: false, error: 'Forbidden: tài khoản Kiosk không được gửi chấm công.' };
      }
      if ((session.role === 'employee' || session.role === 'accountant') && targetEmpId !== session.empId) {
        return {
          __httpStatus: 403,
          ok: false,
          error: 'Forbidden: chỉ được chấm công cho chính tài khoản đang đăng nhập.',
        };
      }
    }
    const check = validateSingleAttendanceGas(
      body.record,
      body.lat,
      body.lng,
      body.accuracy,
      currentState.settings || {}
    );
    if (!check.ok || !check.record) {
      return { __httpStatus: 400, ok: false, error: check.error };
    }
    const nextRecords = mergeArrayByKey(
      currentState.attendanceRecords || [],
      [check.record],
      function (r) {
        return r.employeeId + '__' + r.date;
      }
    );
    currentState.attendanceRecords = nextRecords;
    writeGasState(currentState);
    return {
      __httpStatus: 200,
      ok: true,
      syncedAt: new Date().toISOString(),
      record: check.record,
    };
  }

  if ((route === '/api/state' || route === '/api/sync') && method === 'GET') {
    if (!session && !isAdminSecret) {
      return {
        __httpStatus: 401,
        ok: false,
        error: 'Unauthorized: bắt buộc đăng nhập hoặc có API token hợp lệ để đọc dữ liệu.',
      };
    }
    const scoped = filterStateByScopeGas(currentState, isAdminSecret ? null : session);
    return {
      __httpStatus: 200,
      ok: true,
      syncedAt: PropertiesService.getScriptProperties().getProperty('PHUONGHIHI_LAST_SYNCED_AT_V3'),
      state: scoped,
    };
  }

  if ((route === '/api/state' || route === '/api/sync') && method === 'POST') {
    if (!session && !isAdminSecret) {
      return {
        __httpStatus: 401,
        ok: false,
        error: 'Unauthorized: bắt buộc xác thực để đồng bộ trạng thái hệ thống.',
      };
    }
    if (
      session &&
      !isAdminSecret &&
      session.role !== 'super_admin' &&
      session.role !== 'hr' &&
      session.role !== 'accountant' &&
      session.role !== 'manager'
    ) {
      return {
        __httpStatus: 403,
        ok: false,
        error: 'Forbidden: tài khoản nhân viên không có quyền ghi đè trạng thái hệ thống.',
      };
    }
    const incoming = body && body.state && typeof body.state === 'object' ? body.state : body || {};
    if (Array.isArray(incoming.attendanceRecords)) {
      currentState.attendanceRecords = mergeArrayByKey(
        currentState.attendanceRecords || [],
        incoming.attendanceRecords,
        function (r) {
          return r.employeeId + '__' + r.date;
        }
      );
    }
    if (Array.isArray(incoming.shiftAssignments)) {
      currentState.shiftAssignments = mergeArrayByKey(
        currentState.shiftAssignments || [],
        incoming.shiftAssignments,
        function (a) {
          return a.employeeId + '__' + a.date;
        }
      );
    }
    if (Array.isArray(incoming.requests)) {
      currentState.requests = mergeArrayByKey(
        currentState.requests || [],
        incoming.requests,
        function (r) {
          return r.id;
        }
      );
    }
    if (incoming.settings && typeof incoming.settings === 'object') {
      currentState.settings = stripSensitiveSettings(incoming.settings);
    }
    writeGasState(currentState);
    const scoped = filterStateByScopeGas(currentState, isAdminSecret ? null : session);
    return {
      __httpStatus: 200,
      ok: true,
      syncedAt: new Date().toISOString(),
      state: scoped,
    };
  }

  return { __httpStatus: 404, ok: false, error: 'Not found: ' + route };
}

/**
 * Web App GET Endpoint: Trả về trạng thái kết nối hoặc xử lý GET /api/*
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.__gasRoute) {
    const res = handleGasRestRoute(
      params.__gasRoute,
      params.__gasMethod || 'GET',
      {},
      params.__sessionToken || '',
      params.__apiSecretToken || ''
    );
    return jsonResponse(res);
  }
  const action = params.action || 'status';
  if (action === 'init') {
    const msg = setupPhuonghihiDatabase();
    return jsonResponse({ ok: true, message: msg });
  }
  return jsonResponse({
    ok: true,
    app: 'phuonghihi Google Apps Script Backend (Authenticated & Scoped)',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Web App POST Endpoint: Nhận cả REST route (__gasRoute) và đồng bộ Google Sheets
 */
function doPost(e) {
  try {
    const rawContents = (e && e.postData && e.postData.contents) || '{}';
    if (rawContents.length > 1500000) {
      return jsonResponse({ __httpStatus: 413, ok: false, error: 'Payload exceeds limit' });
    }
    const payload = JSON.parse(rawContents);

    // 1. Handle REST API envelope from Web / Mobile App (Issue C1)
    if (payload && typeof payload.__gasRoute === 'string') {
      const result = handleGasRestRoute(
        payload.__gasRoute,
        payload.__gasMethod || 'POST',
        payload.payload || {},
        payload.__sessionToken || '',
        payload.__apiSecretToken || ''
      );
      return jsonResponse(result);
    }

    // 2. Direct Google Sheets actions (require valid session or API secret)
    const configuredSecret = getConfiguredApiSecret();
    const session = verifyGasSessionToken(payload.sessionToken || payload.token, null);
    const hasSecret = Boolean(configuredSecret && payload.token && payload.token === configuredSecret);
    if (!session && !hasSecret) {
      return jsonResponse({
        __httpStatus: 401,
        ok: false,
        error: 'Unauthorized: invalid or unconfigured API token / session',
      });
    }

    let ss = null;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (err) {
      ss = null;
    }

    if (
      (payload.action === 'UPSERT_ATTENDANCE' || payload.action === 'APPEND_ATTENDANCE') &&
      payload.record &&
      payload.record.id
    ) {
      const r = payload.record;
      const check = validateSingleAttendanceGas(
        r,
        r.lat,
        r.lng,
        r.gpsAccuracy || r.accuracy,
        {}
      );
      if (!check.ok) {
        return jsonResponse({ __httpStatus: 400, ok: false, error: check.error });
      }
      if (ss) {
        const attSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
        if (attSheet) {
          const rowData = [
            sanitizeSheetCell(r.id),
            sanitizeSheetCell(r.employeeId),
            sanitizeSheetCell(r.date),
            sanitizeSheetCell(r.shiftCode || ''),
            sanitizeSheetCell(r.checkIn || ''),
            sanitizeSheetCell(r.checkOut || ''),
            sanitizeSheetCell(r.status),
            Number(r.lateMinutes) || 0,
            Number(r.otHours) || 0,
            sanitizeSheetCell(r.method || ''),
            Number(r.distanceMeters) || 0,
            sanitizeSheetCell(r.note || ''),
          ];
          const lastRow = attSheet.getLastRow();
          let updated = false;
          if (lastRow > 1) {
            const ids = attSheet.getRange(2, 1, lastRow - 1, 1).getValues();
            for (let i = 0; i < ids.length; i++) {
              if (String(ids[i][0]) === String(r.id)) {
                attSheet.getRange(i + 2, 1, 1, 12).setValues([rowData]);
                updated = true;
                break;
              }
            }
          }
          if (!updated) {
            attSheet.appendRow(rowData);
          }
        }
      }
      return jsonResponse({ ok: true, updatedAt: new Date().toISOString() });
    }

    if (
      payload.action === 'UPSERT_STATE' ||
      payload.action === 'SYNC_FULL_STATE' ||
      payload.action === 'syncAll'
    ) {
      const stateData = payload.state && typeof payload.state === 'object' ? payload.state : payload;
      writeGasState(stateData);
      return jsonResponse({ ok: true, syncedAt: new Date().toISOString() });
    }

    return jsonResponse({ ok: true, received: sanitizeSheetCell(payload.action) });
  } catch (err) {
    return jsonResponse({ __httpStatus: 400, ok: false, error: 'Invalid request payload' });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
