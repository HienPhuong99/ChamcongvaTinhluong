/**
 * ============================================================================
 * CỬA HÀNG PHUONGHIHI — GOOGLE SHEETS & APPS SCRIPT BACKEND (TỰ ĐỘNG KHỞI TẠO 100%)
 * ============================================================================
 * Hỗ trợ:
 * 1. Toàn bộ REST API bảo mật của phuonghihi (/api/auth/login, /api/auth/session,
 *    /api/auth/logout, /api/auth/set-pin, /api/auth/change-pin, /api/qr/generate,
 *    /api/qr/verify, /api/attendance, /api/state) cho bản Web trên GitHub Pages & Mobile App.
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

const DEFAULT_GAS_EMPLOYEES = [
  { id: 'NV0000', code: 'NV0000', name: 'Quản lý cửa hàng (phuonghihi)', department: 'Ban giám đốc', allowRemote: true },
  { id: 'NV0001', code: 'NV0001', name: 'Nguyễn Minh Anh', department: 'Nhân sự', allowRemote: false },
  { id: 'NV0002', code: 'NV0002', name: 'Trần Hoàng Nam', department: 'Nhân sự', allowRemote: false },
  { id: 'NV0003', code: 'NV0003', name: 'Lê Quang Huy', department: 'Kinh doanh', allowRemote: true },
  { id: 'NV0004', code: 'NV0004', name: 'Phạm Ngọc Lan', department: 'Kế toán', allowRemote: false },
  { id: 'NV0005', code: 'NV0005', name: 'Võ Thanh Tùng', department: 'Kỹ thuật', allowRemote: false },
  { id: 'NV0006', code: 'NV0006', name: 'Đặng Thu Hà', department: 'Chăm sóc KH', allowRemote: true },
  { id: 'NV0007', code: 'NV0007', name: 'Hoàng Gia Bảo', department: 'Kho vận', allowRemote: false },
  { id: 'NV0008', code: 'NV0008', name: 'Ngô Khánh Linh', department: 'Marketing', allowRemote: false },
  { id: 'NV0009', code: 'NV0009', name: 'Bùi Minh Quân', department: 'Kinh doanh', allowRemote: false },
  { id: 'NV0010', code: 'NV0010', name: 'Lý Tuyết Mai', department: 'Kế toán', allowRemote: false },
  { id: 'NV0011', code: 'NV0011', name: 'Trương Quốc Khánh', department: 'Kinh doanh', allowRemote: false },
  { id: 'NV0012', code: 'NV0012', name: 'Phan Mỹ Duyên', department: 'Chăm sóc KH', allowRemote: true },
  { id: 'NV0013', code: 'NV0013', name: 'Đỗ Anh Tuấn', department: 'Kho vận', allowRemote: false },
  { id: 'NV0014', code: 'NV0014', name: 'Hồ Thảo Vy', department: 'Marketing', allowRemote: false },
  { id: 'NV0015', code: 'NV0015', name: 'Dương Đức Thịnh', department: 'Kỹ thuật', allowRemote: true },
  { id: 'NV0016', code: 'NV0016', name: 'Mai Bích Ngọc', department: 'Kinh doanh', allowRemote: false },
  { id: 'NV0017', code: 'NV0017', name: 'Vũ Đình Khoa', department: 'Kinh doanh', allowRemote: false },
  { id: 'NV0018', code: 'NV0018', name: 'Lâm Bảo Trân', department: 'Chăm sóc KH', allowRemote: true },
  { id: 'NV0019', code: 'NV0019', name: 'Tạ Minh Triết', department: 'Kho vận', allowRemote: false },
  { id: 'NV0020', code: 'NV0020', name: 'Châu Thanh Thảo', department: 'Kinh doanh', allowRemote: false },
  { id: 'NV0021', code: 'NV0021', name: 'Đinh Công Vinh', department: 'Kỹ thuật', allowRemote: true },
  { id: 'NV0022', code: 'NV0022', name: 'Hà Kiều Trinh', department: 'Marketing', allowRemote: false },
  { id: 'NV0023', code: 'NV0023', name: 'Lương Thế Vinh', department: 'Kho vận', allowRemote: false },
  { id: 'NV0024', code: 'NV0024', name: 'Kiều Phương Trang', department: 'Chăm sóc KH', allowRemote: true },
];

const GAS_SHIFTS_BY_CODE = {
  sang: { code: 'sang', startTime: '08:00', endTime: '17:00', breakMinutes: 60 },
  chieu: { code: 'chieu', startTime: '13:30', endTime: '21:30', breakMinutes: 45 },
  dem: { code: 'dem', startTime: '21:30', endTime: '06:00', breakMinutes: 45 },
};

// Keys allowed in /api/attendance input (Issue M2: status, lateMinutes, otHours, checkIn, checkOut, distanceMeters are server-computed)
const ALLOWED_ATTENDANCE_INPUT_KEYS = {
  id: true,
  employeeId: true,
  date: true,
  shiftCode: true,
  method: true,
  gpsAccuracy: true,
  accuracy: true,
  lat: true,
  lng: true,
  photoUrl: true,
  note: true,
  qrToken: true,
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

function generateRandomGasPassword() {
  return 'PH-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

/**
 * Đọc hoặc khởi tạo mật khẩu ngẫu nhiên lần đầu vào ScriptProperties (Issue M3: không dùng hash mặc định trong code)
 */
function readGasCredentials() {
  const custom = readLargePropJson('PHUONGHIHI_CUSTOM_CREDS_V3', {});
  const initialPins = readLargePropJson('PHUONGHIHI_INITIAL_PINS_V3', {});
  let changed = false;
  DEFAULT_GAS_ACCOUNTS.forEach(function (acc) {
    const existing = custom && custom[acc.id];
    if (!existing || !existing.salt || !existing.hash) {
      const randomPin = generateRandomGasPassword();
      const salt = Utilities.getUuid().replace(/-/g, '');
      const hash = sha256Hex(salt + ':' + randomPin);
      custom[acc.id] = {
        salt: salt,
        hash: hash,
        mustChangePin: true,
        updatedAt: new Date().toISOString(),
      };
      initialPins[acc.id] = {
        username: acc.username,
        initialPin: randomPin,
        generatedAt: new Date().toISOString(),
      };
      changed = true;
    }
  });
  if (changed) {
    writeLargePropJson('PHUONGHIHI_CUSTOM_CREDS_V3', custom);
    writeLargePropJson('PHUONGHIHI_INITIAL_PINS_V3', initialPins);
  }
  return custom;
}

function writeGasCredential(accountId, rawPin, mustChangePin) {
  const custom = readGasCredentials();
  const salt = Utilities.getUuid().replace(/-/g, '');
  const hash = sha256Hex(salt + ':' + String(rawPin).trim());
  custom[accountId] = {
    salt: salt,
    hash: hash,
    mustChangePin: Boolean(mustChangePin),
    updatedAt: new Date().toISOString(),
  };
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

function mustChangeGasAccountPin(accountId) {
  const creds = readGasCredentials();
  return Boolean(creds[accountId] && creds[accountId].mustChangePin);
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

function getEffectiveGasEmployees(state) {
  const st = state || {};
  const map = {};
  DEFAULT_GAS_EMPLOYEES.forEach(function (emp) {
    map[emp.id] = JSON.parse(JSON.stringify(emp));
  });
  if (Array.isArray(st.employees)) {
    st.employees.forEach(function (emp) {
      if (emp && emp.id) {
        const prev = map[emp.id] || {};
        const merged = JSON.parse(JSON.stringify(emp));
        if (typeof merged.allowRemote !== 'boolean') {
          merged.allowRemote = Boolean(prev.allowRemote);
        }
        if (!merged.department && prev.department) {
          merged.department = prev.department;
        }
        map[emp.id] = merged;
      }
    });
  }
  return Object.keys(map).map(function (k) {
    return map[k];
  });
}

function findGasEmployeeById(state, employeeId) {
  const emps = getEffectiveGasEmployees(state);
  for (let i = 0; i < emps.length; i++) {
    if (emps[i].id === employeeId || emps[i].code === employeeId) {
      return emps[i];
    }
  }
  return null;
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
    const mustChange = mustChangeGasAccountPin(liveAcc.id);
    liveAcc.mustChangePin = mustChange;
    return {
      sub: liveAcc.id,
      empId: liveAcc.employeeId || payload.empId,
      empCode: liveAcc.employeeId || payload.empCode,
      role: liveAcc.roleId,
      scope: liveAcc.dataScope,
      dept: liveAcc.department || '',
      mustChangePin: mustChange,
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
      return { valid: true, kind: 'personal', empCode: String(parsed.empCode), normalizedToken: trimmed };
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
  return { valid: true, kind: 'door', normalizedToken: clean };
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

function getVietnamGasNowParts(nowMs) {
  const d = nowMs ? new Date(nowMs) : new Date();
  const dateStr = Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const timeStr = Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'HH:mm');
  const yesterdayDate = new Date(d.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = Utilities.formatDate(yesterdayDate, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const hourNum = Number(timeStr.split(':')[0]) || 0;
  return {
    dateStr: dateStr,
    timeStr: timeStr,
    yesterdayStr: yesterdayStr,
    hourNum: hourNum,
  };
}

function timeToMinutesGas(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const parts = hhmm.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function getAssignedShiftGas(state, employeeId, dateStr) {
  const assignments = Array.isArray(state && state.shiftAssignments) ? state.shiftAssignments : [];
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    if (a && a.employeeId === employeeId && a.date === dateStr) {
      if (a.shiftCode === 'nghi') return { shiftCode: 'nghi', shift: null };
      if (a.shiftCode && GAS_SHIFTS_BY_CODE[a.shiftCode]) {
        return { shiftCode: a.shiftCode, shift: GAS_SHIFTS_BY_CODE[a.shiftCode] };
      }
    }
  }
  const dt = new Date(dateStr + 'T00:00:00+07:00');
  if (dt.getDay() === 0) {
    return { shiftCode: 'nghi', shift: null };
  }
  return { shiftCode: 'sang', shift: GAS_SHIFTS_BY_CODE.sang };
}

function calculateGasLateAndOt(checkIn, checkOut, shift, settings) {
  if (!shift || !checkIn) {
    return { lateMinutes: 0, otHours: 0, status: 'Đúng giờ' };
  }
  const graceMinutes =
    settings && typeof settings.graceLateMinutes === 'number'
      ? Math.max(0, settings.graceLateMinutes)
      : 5;
  const startM = timeToMinutesGas(shift.startTime);
  let endM = timeToMinutesGas(shift.endTime);
  let inM = timeToMinutesGas(checkIn);
  let outM = checkOut ? timeToMinutesGas(checkOut) : endM;
  const isOvernight = endM <= startM;

  if (isOvernight) {
    endM += 24 * 60;
    if (inM < 12 * 60) {
      inM += 24 * 60;
    }
    if (checkOut && outM <= inM) {
      outM += 24 * 60;
    }
  }

  const rawDiff = inM - startM;
  const lateMinutes = rawDiff > graceMinutes ? rawDiff : 0;
  let otHours = 0;
  if (checkOut && outM > endM + 20) {
    otHours = Math.round(((outM - endM) / 60) * 10) / 10;
  }

  let status = 'Đúng giờ';
  if (otHours > 0) status = 'Tăng ca';
  else if (lateMinutes > 0) status = 'Đi muộn';

  return { lateMinutes: lateMinutes, otHours: otHours, status: status };
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

function validateSingleAttendanceGas(rawRecord, topLat, topLng, topAcc, settings, context) {
  if (!rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) {
    return { ok: false, error: 'Bản ghi chấm công không hợp lệ.' };
  }
  const ctx = context || {};
  const enforceServerTime = ctx.enforceServerTime !== false;
  const currentState = ctx.currentState || {};
  const allowedKeys = enforceServerTime ? ALLOWED_ATTENDANCE_INPUT_KEYS : ALLOWED_ATTENDANCE_RECORD_KEYS;

  const keys = Object.keys(rawRecord);
  for (let i = 0; i < keys.length; i++) {
    if (!allowedKeys[keys[i]]) {
      return {
        ok: false,
        error:
          'Trường không hợp lệ hoặc không được phép tự khai trong bản ghi chấm công: "' +
          keys[i] +
          '". Giờ chấm, trạng thái, phút muộn và OT do máy chủ tự tính.',
      };
    }
  }
  const employeeId = String(rawRecord.employeeId || '').trim();
  const method = String(rawRecord.method || 'GPS').trim();
  if (!/^NV\d{4}$/.test(employeeId)) {
    return { ok: false, error: 'Mã nhân viên (employeeId) không hợp lệ.' };
  }
  if (!ALLOWED_METHODS[method]) {
    return { ok: false, error: 'Phương thức chấm công không hợp lệ.' };
  }

  const targetEmployee = findGasEmployeeById(currentState, employeeId);
  if (!targetEmployee) {
    return { ok: false, error: 'Nhân viên "' + employeeId + '" không tồn tại trên hệ thống.' };
  }

  const s = settings || {};
  const nowParts = getVietnamGasNowParts();
  let effectiveDate = nowParts.dateStr;
  const clientDate = rawRecord.date ? String(rawRecord.date).trim() : '';

  if (clientDate && !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
    return { ok: false, error: 'Ngày chấm công (date) phải có định dạng YYYY-MM-DD.' };
  }

  if (enforceServerTime) {
    if (clientDate && clientDate !== nowParts.dateStr) {
      const yesterdayShift = getAssignedShiftGas(currentState, employeeId, nowParts.yesterdayStr);
      const allowYesterdayNightShift =
        clientDate === nowParts.yesterdayStr &&
        nowParts.hourNum < 7 &&
        yesterdayShift.shiftCode === 'dem';
      if (!allowYesterdayNightShift) {
        return {
          ok: false,
          error:
            'Không được chấm công lùi ngày hoặc khác ngày hiện tại của máy chủ (' +
            nowParts.dateStr +
            '). Nếu cần sửa công ngày cũ, vui lòng gửi đơn "Bổ sung công".',
        };
      }
      effectiveDate = nowParts.yesterdayStr;
    }
  } else if (clientDate) {
    effectiveDate = clientDate;
  }

  const officeLat = Number(s.officeLat) || 10.7728;
  const officeLng = Number(s.officeLng) || 106.6988;
  const allowedRadius = Number(s.allowedRadiusMeters) || 150;
  let computedDistance = 0;
  let usedQrTokenKey = null;

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
    if (s.qrEnabled === false) {
      return { ok: false, error: 'Chấm công bằng mã QR tại cửa đang bị tắt trong Cài đặt.' };
    }
    if (enforceServerTime) {
      const providedQrToken = String(ctx.qrToken || rawRecord.qrToken || '').trim();
      if (!providedQrToken) {
        return {
          ok: false,
          error: 'Chấm công "QR tại cửa" bắt buộc phải gửi kèm mã qrToken hợp lệ từ Kiosk cửa hàng.',
        };
      }
      const qrResult = verifyGasQrToken(providedQrToken);
      if (!qrResult.valid || qrResult.kind !== 'door') {
        return {
          ok: false,
          error: qrResult.reason || 'Mã QR tại cửa không hợp lệ hoặc đã hết hạn.',
        };
      }
      const usedTokens = readLargePropJson('PHUONGHIHI_USED_QR_TOKENS_V3', {});
      const tokenKey = qrResult.normalizedToken + '__' + employeeId;
      if (usedTokens[tokenKey]) {
        return {
          ok: false,
          error: 'Mã QR tại cửa này đã được nhân viên sử dụng. Vui lòng đợi mã QR mới trên Kiosk.',
        };
      }
      usedQrTokenKey = tokenKey;
    }
    computedDistance = 5;
  } else if (method === 'Từ xa') {
    const remoteEnabled = s.remoteEnabled !== false;
    if (!remoteEnabled) {
      return { ok: false, error: 'Chế độ chấm công Từ xa đang bị tắt trên toàn hệ thống.' };
    }
    if (!targetEmployee.allowRemote) {
      return {
        ok: false,
        error: 'Nhân viên ' + employeeId + ' chưa được cấp quyền chấm công Từ xa (allowRemote = false).',
      };
    }
    computedDistance = 0;
  } else {
    computedDistance = 0;
  }

  const assigned = getAssignedShiftGas(currentState, employeeId, effectiveDate);
  const existingRecords = Array.isArray(currentState.attendanceRecords)
    ? currentState.attendanceRecords
    : [];
  let existingToday = null;
  for (let i = 0; i < existingRecords.length; i++) {
    const r = existingRecords[i];
    if (r && r.employeeId === employeeId && r.date === effectiveDate) {
      existingToday = r;
      break;
    }
  }

  let checkInTime;
  let checkOutTime;
  if (enforceServerTime) {
    if (existingToday && existingToday.checkIn) {
      checkInTime = existingToday.checkIn;
      checkOutTime = nowParts.timeStr;
    } else {
      checkInTime = nowParts.timeStr;
      checkOutTime = undefined;
    }
  } else {
    checkInTime = rawRecord.checkIn ? String(rawRecord.checkIn).slice(0, 10) : nowParts.timeStr;
    checkOutTime = rawRecord.checkOut ? String(rawRecord.checkOut).slice(0, 10) : undefined;
  }

  const unscheduled = assigned.shiftCode === 'nghi' || !assigned.shift;
  const calc = unscheduled
    ? { lateMinutes: 0, otHours: 0, status: 'Đúng giờ' }
    : calculateGasLateAndOt(checkInTime, checkOutTime, assigned.shift, s);

  const cleanRecord = {
    id: String(
      (existingToday && existingToday.id) || rawRecord.id || 'ATT-' + effectiveDate + '-' + employeeId
    ).slice(0, 64),
    employeeId: employeeId,
    date: effectiveDate,
    shiftCode: unscheduled ? null : assigned.shiftCode,
    unscheduled: unscheduled,
    checkIn: checkInTime,
    status: calc.status,
    lateMinutes: calc.lateMinutes,
    otHours: calc.otHours,
    method: method,
    distanceMeters: computedDistance,
  };
  if (checkOutTime) cleanRecord.checkOut = checkOutTime;
  if (rawRecord.note) cleanRecord.note = String(rawRecord.note).slice(0, 300);

  return {
    ok: true,
    record: cleanRecord,
    usedQrTokenKey: usedQrTokenKey,
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
    const mustChange = mustChangeGasAccountPin(target.id);
    target.mustChangePin = mustChange;
    const newSessionToken = signGasSessionToken(target);
    return {
      __httpStatus: 200,
      ok: true,
      sessionToken: newSessionToken,
      mustChangePin: mustChange,
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
      mustChangePin: Boolean(session.mustChangePin),
      account: session.account,
    };
  }

  if (route === '/api/auth/logout') {
    return { __httpStatus: 200, ok: true };
  }

  if ((route === '/api/auth/set-pin' || route === '/api/auth/change-pin') && method === 'POST') {
    const targetAccountId = String((body && body.targetAccountId) || (session && session.sub) || '').trim();
    const currentPin = String((body && body.currentPin) || '').trim();
    const newPin = String((body && body.newPin) || '').trim();
    if (!targetAccountId || newPin.length < 6) {
      return { __httpStatus: 400, ok: false, error: 'Mật khẩu / mã PIN mới phải có tối thiểu 6 ký tự.' };
    }
    const isSelfChange = Boolean(session && session.sub === targetAccountId && currentPin);
    if (isSelfChange) {
      if (!verifyGasAccountPin(targetAccountId, currentPin)) {
        return { __httpStatus: 401, ok: false, error: 'Mật khẩu / mã PIN hiện tại không chính xác.' };
      }
      if (currentPin === newPin) {
        return { __httpStatus: 400, ok: false, error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
      }
      writeGasCredential(targetAccountId, newPin, false);
      return { __httpStatus: 200, ok: true, mustChangePin: false };
    }
    if (!isAdminSecret && (!session || (session.role !== 'super_admin' && session.role !== 'hr'))) {
      return {
        __httpStatus: 403,
        ok: false,
        error: 'Chỉ Quản trị cao nhất hoặc Nhân sự (HR) mới được cấp/đặt lại mã PIN cho tài khoản khác.',
      };
    }
    const requireChangeOnNextLogin =
      body && typeof body.mustChangePin === 'boolean'
        ? body.mustChangePin
        : Boolean(!session || session.sub !== targetAccountId);
    writeGasCredential(targetAccountId, newPin, requireChangeOnNextLogin);
    return { __httpStatus: 200, ok: true, mustChangePin: requireChangeOnNextLogin };
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
    const targetEmp = findGasEmployeeById(currentState, targetEmpId);
    if (!targetEmp) {
      return {
        __httpStatus: 400,
        ok: false,
        error: 'Nhân viên "' + targetEmpId + '" không tồn tại trên hệ thống.',
      };
    }
    if (session && !isAdminSecret) {
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
      if (
        session.role === 'manager' &&
        targetEmpId !== session.empId &&
        targetEmp.department !== session.dept
      ) {
        return {
          __httpStatus: 403,
          ok: false,
          error:
            'Forbidden: Quản lý phòng "' +
            session.dept +
            '" không được gửi chấm công cho nhân viên thuộc phòng "' +
            targetEmp.department +
            '".',
        };
      }
    }
    const check = validateSingleAttendanceGas(
      body.record,
      body.lat,
      body.lng,
      body.accuracy,
      currentState.settings || {},
      {
        qrToken: body.qrToken,
        currentState: currentState,
        enforceServerTime: true,
      }
    );
    if (!check.ok || !check.record) {
      return { __httpStatus: 400, ok: false, error: check.error };
    }
    if (check.usedQrTokenKey) {
      const usedTokens = readLargePropJson('PHUONGHIHI_USED_QR_TOKENS_V3', {});
      usedTokens[check.usedQrTokenKey] = Date.now();
      writeLargePropJson('PHUONGHIHI_USED_QR_TOKENS_V3', usedTokens);
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
      const currentState = readGasState();
      const r = payload.record;
      const check = validateSingleAttendanceGas(
        r,
        r.lat,
        r.lng,
        r.gpsAccuracy || r.accuracy,
        currentState.settings || {},
        {
          qrToken: payload.qrToken || r.qrToken,
          currentState: currentState,
          enforceServerTime: true,
        }
      );
      if (!check.ok || !check.record) {
        return jsonResponse({ __httpStatus: 400, ok: false, error: check.error });
      }
      const validRec = check.record;
      if (ss) {
        const attSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
        if (attSheet) {
          const rowData = [
            sanitizeSheetCell(validRec.id),
            sanitizeSheetCell(validRec.employeeId),
            sanitizeSheetCell(validRec.date),
            sanitizeSheetCell(validRec.shiftCode || ''),
            sanitizeSheetCell(validRec.checkIn || ''),
            sanitizeSheetCell(validRec.checkOut || ''),
            sanitizeSheetCell(validRec.status),
            Number(validRec.lateMinutes) || 0,
            Number(validRec.otHours) || 0,
            sanitizeSheetCell(validRec.method || ''),
            Number(validRec.distanceMeters) || 0,
            sanitizeSheetCell(validRec.note || ''),
          ];
          const lastRow = attSheet.getLastRow();
          let updated = false;
          if (lastRow > 1) {
            const ids = attSheet.getRange(2, 1, lastRow - 1, 1).getValues();
            for (let i = 0; i < ids.length; i++) {
              if (String(ids[i][0]) === String(validRec.id)) {
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
      return jsonResponse({ ok: true, updatedAt: new Date().toISOString(), record: validRec });
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
