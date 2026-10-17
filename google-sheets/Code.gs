/**
 * ============================================================================
 * CỬA HÀNG PHUONGHIHI — GOOGLE SHEETS & APPS SCRIPT BACKEND (TỰ ĐỘNG KHỞI TẠO 100%)
 * ============================================================================
 * Cách dùng:
 * 1. Mở 1 file Google Sheets mới -> Tiện ích mở rộng (Extensions) -> Apps Script
 * 2. Dán toàn bộ file Code.gs này vào -> Bấm chạy hàm `setupPhuonghihiDatabase()`
 *    (Hệ thống sẽ tự động tạo đủ 8 trang tính: NhanVien, PhanCa, DiemDanh,
 *    DonTu, BangCong, BangLuong, CaiDat, NhatKy mà không cần kẻ bảng tay!)
 * 3. Bấm Triển khai (Deploy) -> Ứng dụng web (Web App) để kết nối với Web/App.
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

/**
 * Tự động tạo toàn bộ các trang tính (Sheets) và tiêu đề cột chuẩn phuonghihi
 */
function setupPhuonghihiDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  Object.keys(schemas).forEach((name) => {
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

/**
 * Web App GET Endpoint: Trả về trạng thái kết nối và dữ liệu đồng bộ
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'status';
  if (action === 'init') {
    const msg = setupPhuonghihiDatabase();
    return jsonResponse({ ok: true, message: msg });
  }
  return jsonResponse({
    ok: true,
    app: 'phuonghihi Google Sheets Backend (Hardened)',
    timestamp: new Date().toISOString(),
  });
}

function getConfiguredApiSecret() {
  return PropertiesService.getScriptProperties().getProperty('PHUONGHIHI_API_SECRET');
}

function stripSensitiveSettings(settings) {
  if (!settings || typeof settings !== 'object') return settings;
  const copy = JSON.parse(JSON.stringify(settings));
  delete copy.apiSecretToken;
  delete copy.token;
  delete copy.pin;
  return copy;
}

function getQrHmacSecret() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('PHUONGHIHI_QR_SECRET');
  if (!secret) {
    secret = getConfiguredApiSecret() || Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('PHUONGHIHI_QR_SECRET', secret);
  }
  return secret;
}

function computeQrHmacHex(message) {
  const sig = Utilities.computeHmacSha256Signature(message, getQrHmacSecret());
  return sig
    .map(function (b) {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('')
    .toUpperCase()
    .slice(0, 16);
}

/**
 * Web App POST Endpoint: Nhận dữ liệu đồng bộ từ Web/App hoặc gửi Email phiếu lương
 */
function doPost(e) {
  try {
    const rawContents = (e && e.postData && e.postData.contents) || '{}';
    if (rawContents.length > 500000) {
      return jsonResponse({ ok: false, error: 'Payload exceeds 500KB limit' });
    }
    const payload = JSON.parse(rawContents);
    const configuredSecret = getConfiguredApiSecret();
    const isAttendanceOrQr =
      payload.action === 'UPSERT_ATTENDANCE' ||
      payload.action === 'GENERATE_QR' ||
      payload.action === 'VERIFY_QR';

    if (!isAttendanceOrQr) {
      if (!configuredSecret || !payload.token || payload.token !== configuredSecret) {
        return jsonResponse({ ok: false, error: 'Unauthorized: invalid or unconfigured API token' });
      }
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'GENERATE_QR') {
      const mode = payload.mode === 'PRINTED' ? 'PRINTED' : payload.mode === 'PERSONAL' ? 'PERSONAL' : '45S';
      if (mode === 'PERSONAL') {
        const empCode = String(payload.employeeCode || '').trim().toUpperCase();
        const dayStr = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
        const msg = 'PHUONGHIHI-EMP|' + empCode + '|' + dayStr;
        const sig = computeQrHmacHex(msg);
        return jsonResponse({ ok: true, payload: msg + '|' + sig });
      }
      const slot = mode === 'PRINTED'
        ? Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd')
        : String(Math.floor(Date.now() / 45000));
      const msg = 'PHUONGHIHI-DOOR|' + mode + '|' + slot;
      const sig = computeQrHmacHex(msg);
      return jsonResponse({ ok: true, payload: msg + '|' + sig, mode: mode, slot: slot });
    }

    if (payload.action === 'VERIFY_QR') {
      const raw = String(payload.payload || '').trim().toUpperCase();
      const parts = raw.split('|');
      if (parts.length === 4 && parts[0] === 'PHUONGHIHI-DOOR') {
        const mode = parts[1];
        const slotStr = parts[2];
        const providedSig = parts[3];
        const expectedSig = computeQrHmacHex('PHUONGHIHI-DOOR|' + mode + '|' + slotStr);
        if (providedSig !== expectedSig) {
          return jsonResponse({ ok: true, valid: false, reason: 'Chữ ký mã QR tại cửa không khớp' });
        }
        return jsonResponse({ ok: true, valid: true, type: mode === 'PRINTED' ? 'DOOR_PRINTED' : 'DOOR_45S' });
      }
      return jsonResponse({ ok: true, valid: false, reason: 'Định dạng QR không hợp lệ' });
    }

    if (payload.action === 'UPSERT_ATTENDANCE' && payload.record && payload.record.id) {
      const attSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
      if (attSheet) {
        const r = payload.record;
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
      return jsonResponse({ ok: true, updatedAt: new Date().toISOString() });
    }

    if (
      payload.action === 'UPSERT_STATE' ||
      payload.action === 'SYNC_FULL_STATE' ||
      payload.action === 'syncAll'
    ) {
      const stateData = payload.state && typeof payload.state === 'object' ? payload.state : payload;

      // 1. Đồng bộ bảng Nhân viên
      if (Array.isArray(stateData.employees)) {
        const empSheet = ss.getSheetByName(SHEET_NAMES.EMPLOYEES);
        if (empSheet) {
          if (empSheet.getLastRow() > 1) {
            empSheet.getRange(2, 1, empSheet.getLastRow() - 1, 13).clearContent();
          }
          const rows = stateData.employees.slice(0, 500).map((emp) => [
            sanitizeSheetCell(emp.code),
            sanitizeSheetCell(emp.name),
            sanitizeSheetCell(emp.email),
            sanitizeSheetCell(emp.phone),
            sanitizeSheetCell(emp.dob),
            sanitizeSheetCell(emp.department),
            sanitizeSheetCell(emp.position),
            sanitizeSheetCell(emp.status),
            sanitizeSheetCell(emp.joinDate),
            Number(emp.baseSalary) || 0,
            Number(emp.allowance) || 0,
            Number(emp.dependents) || 0,
            Boolean(emp.allowRemote),
          ]);
          if (rows.length > 0) {
            empSheet.getRange(2, 1, rows.length, 13).setValues(rows);
          }
        }
      }

      // 2. Đồng bộ bảng Điểm danh (Upsert theo ID thay vì xóa trắng)
      if (Array.isArray(stateData.attendanceRecords)) {
        const attSheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCE);
        if (attSheet) {
          const existingMap = {};
          const lastRow = attSheet.getLastRow();
          if (lastRow > 1) {
            const existingRows = attSheet.getRange(2, 1, lastRow - 1, 12).getValues();
            existingRows.forEach(function (row) {
              if (row[0]) existingMap[String(row[0])] = row;
            });
          }
          stateData.attendanceRecords.slice(0, 1000).forEach(function (r) {
            existingMap[String(r.id)] = [
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
          });
          const mergedRows = Object.keys(existingMap).map(function (k) {
            return existingMap[k];
          });
          if (lastRow > 1) {
            attSheet.getRange(2, 1, lastRow - 1, 12).clearContent();
          }
          if (mergedRows.length > 0) {
            attSheet.getRange(2, 1, mergedRows.length, 12).setValues(mergedRows);
          }
        }
      }

      // 3. Đồng bộ bảng Đơn từ
      if (Array.isArray(stateData.requests)) {
        const reqSheet = ss.getSheetByName(SHEET_NAMES.REQUESTS);
        if (reqSheet) {
          if (reqSheet.getLastRow() > 1) {
            reqSheet.getRange(2, 1, reqSheet.getLastRow() - 1, 8).clearContent();
          }
          const rows = stateData.requests.slice(0, 500).map((req) => [
            sanitizeSheetCell(req.id),
            sanitizeSheetCell(req.employeeId),
            sanitizeSheetCell(req.type),
            sanitizeSheetCell(req.startDate),
            sanitizeSheetCell(req.endDate),
            sanitizeSheetCell(req.reason),
            sanitizeSheetCell(req.status),
            sanitizeSheetCell(req.createdAt),
          ]);
          if (rows.length > 0) {
            reqSheet.getRange(2, 1, rows.length, 8).setValues(rows);
          }
        }
      }

      // 4. Ghi trạng thái đồng bộ vào CaiDat (đã loại bỏ apiSecretToken và PIN)
      const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
      if (settingsSheet) {
        const safeSettings = stripSensitiveSettings(stateData.settings);
        settingsSheet.appendRow([
          sanitizeSheetCell('LAST_UPSERT_SYNC'),
          sanitizeSheetCell(JSON.stringify({
            exportedAt: stateData.exportedAt || new Date().toISOString(),
            employeeCount: Array.isArray(stateData.employees) ? stateData.employees.length : 0,
            attendanceCount: Array.isArray(stateData.attendanceRecords) ? stateData.attendanceRecords.length : 0,
            requestCount: Array.isArray(stateData.requests) ? stateData.requests.length : 0,
            settings: safeSettings,
          })),
          sanitizeSheetCell(new Date().toLocaleString('vi-VN')),
        ]);
      }
      return jsonResponse({ ok: true, syncedAt: new Date().toISOString() });
    }

    if (payload.action === 'LOG_AUDIT') {
      const logSheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
      if (logSheet) {
        logSheet.appendRow([
          sanitizeSheetCell(payload.timestamp || new Date().toLocaleString('vi-VN')),
          sanitizeSheetCell(payload.actor || 'admin@phuonghihi'),
          sanitizeSheetCell(payload.event || 'SYNC'),
          sanitizeSheetCell(payload.targetType || 'Hệ thống'),
          sanitizeSheetCell(payload.targetDetail || ''),
        ]);
      }
      return jsonResponse({ ok: true });
    }

    if (payload.action === 'SEND_PAYSLIP_EMAILS' && Array.isArray(payload.payslips)) {
      let sent = 0;
      payload.payslips.slice(0, 100).forEach((p) => {
        if (isValidEmail(p.email)) {
          const safePeriod = escapeHtml(p.period);
          const safeName = escapeHtml(p.name);
          const safeCode = escapeHtml(p.code);
          MailApp.sendEmail({
            to: p.email.trim(),
            subject: `[phuonghihi] Phiếu lương kỳ ${safePeriod} - ${safeName}`,
            htmlBody: `
              <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px;">
                <h2 style="color: #2563EB; margin-top: 0;">Phiếu lương kỳ ${safePeriod}</h2>
                <p>Xin chào <strong>${safeName}</strong> (${safeCode}),</p>
                <p>Phòng Kế toán & Nhân sự gửi bạn chi tiết phiếu lương kỳ <strong>${safePeriod}</strong>:</p>
                <ul>
                  <li>Ngày công tính lương: <strong>${Number(p.workDays) || 0}/${Number(p.standardDays) || 22}</strong></li>
                  <li>Lương theo ngày công: <strong>${Number(p.proRatedSalary || 0).toLocaleString('vi-VN')} đ</strong></li>
                  <li>Phụ cấp & Tăng ca & Thưởng: <strong>+${Number(p.additions || 0).toLocaleString('vi-VN')} đ</strong></li>
                  <li>BHXH (10.5%) & Thuế TNCN & Phạt muộn & Tạm ứng: <strong>-${Number(p.deductions || 0).toLocaleString('vi-VN')} đ</strong></li>
                </ul>
                <h3 style="color: #0F172A;">Thực lĩnh: <span style="color: #2563EB;">${Number(p.netSalary || 0).toLocaleString('vi-VN')} đ</span></h3>
              </div>
            `,
          });
          sent++;
        }
      });
      return jsonResponse({ ok: true, sentCount: sent });
    }

    return jsonResponse({ ok: true, received: sanitizeSheetCell(payload.action) });
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request payload' });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
