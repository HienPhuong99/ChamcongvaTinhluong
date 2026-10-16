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
    app: 'phuonghihi Google Sheets Backend',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Web App POST Endpoint: Nhận dữ liệu đồng bộ từ Web/App hoặc gửi Email phiếu lương
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'LOG_AUDIT') {
      const logSheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
      if (logSheet) {
        logSheet.appendRow([
          payload.timestamp || new Date().toLocaleString('vi-VN'),
          payload.actor || 'admin@phuonghihi',
          payload.event || 'SYNC',
          payload.targetType || 'Hệ thống',
          payload.targetDetail || '',
        ]);
      }
      return jsonResponse({ ok: true });
    }

    if (payload.action === 'SEND_PAYSLIP_EMAILS' && Array.isArray(payload.payslips)) {
      let sent = 0;
      payload.payslips.forEach((p) => {
        if (p.email) {
          MailApp.sendEmail({
            to: p.email,
            subject: `[phuonghihi] Phiếu lương kỳ ${p.period} - ${p.name}`,
            htmlBody: `
              <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px;">
                <h2 style="color: #2563EB; margin-top: 0;">Phiếu lương kỳ ${p.period}</h2>
                <p>Xin chào <strong>${p.name}</strong> (${p.code}),</p>
                <p>Phòng Kế toán & Nhân sự gửi bạn chi tiết phiếu lương kỳ <strong>${p.period}</strong>:</p>
                <ul>
                  <li>Ngày công tính lương: <strong>${p.workDays}/${p.standardDays}</strong></li>
                  <li>Lương theo ngày công: <strong>${Number(p.proRatedSalary).toLocaleString('vi-VN')} đ</strong></li>
                  <li>Phụ cấp & Tăng ca & Thưởng: <strong>+${Number(p.additions).toLocaleString('vi-VN')} đ</strong></li>
                  <li>BHXH (10.5%) & Thuế TNCN & Phạt muộn: <strong>-${Number(p.deductions).toLocaleString('vi-VN')} đ</strong></li>
                </ul>
                <h3 style="color: #0F172A;">Thực lĩnh: <span style="color: #2563EB;">${Number(p.netSalary).toLocaleString('vi-VN')} đ</span></h3>
              </div>
            `,
          });
          sent++;
        }
      });
      return jsonResponse({ ok: true, sentCount: sent });
    }

    return jsonResponse({ ok: true, received: payload.action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
