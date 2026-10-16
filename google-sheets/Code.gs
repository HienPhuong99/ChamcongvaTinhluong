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
      'Phụ cấp', 'Lương OT', 'Thưởng', 'Phạt đi muộn', 'BHXH (10.5%)', 'Thuế TNCN', 'Thực lĩnh'
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
    const ss = SpreadsheetApp.getActiveSpreadsheet();

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
                  <li>BHXH (10.5%) & Thuế TNCN & Phạt muộn: <strong>-${Number(p.deductions || 0).toLocaleString('vi-VN')} đ</strong></li>
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
