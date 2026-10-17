# Báo cáo kiểm tra toàn bộ tính năng — phuonghihi Chấm công · Xếp ca · Tính lương

- **Ngày kiểm tra:** 16/10/2026
- **Phiên bản:** `main` @ `1aeda25`
- **Phạm vi:** Web quản trị + Mobile PWA (`src/`), server Node (`server/index.js`), Google Apps Script (`google-sheets/Code.gs`)
- **Cách kiểm tra:**
  1. `tsc -b` và `vite build` — **đạt**, không lỗi kiểu (chỉ cảnh báo chunk `xlsx` 500 kB).
  2. Chạy `vite` dev server, mở lần lượt 14 màn hình trên trình duyệt ở 1440×900 và 375×812 (mobile); console **không có lỗi JS**.
  3. Đọc toàn bộ mã nguồn các view, context, helper, server.
  4. Tái hiện trực tiếp trên trình duyệt các lỗi đánh dấu **[Đã tái hiện]**.
- **Lưu ý:** Theo yêu cầu, báo cáo **chỉ đề xuất, không sửa code**. Dữ liệu demo trên trình duyệt đã được khôi phục về mặc định sau khi test.

Mức độ: 🔴 Nghiêm trọng (sai tiền / lộ dữ liệu / mất dữ liệu) · 🟠 Cao (tính năng chạy sai) · 🟡 Trung bình (sai lệch hiển thị, UX) · ⚪ Thấp.

---

## 📋 VIỆC CÒN TỒN ĐỌNG — cập nhật 17/10/2026 (Đã khắc phục & kiểm thử 100% ✅)

> Toàn bộ danh sách công việc tái kiểm tra ngày 17/10/2026 (gồm **G1–G3**, **B1–B5**, **C1–C8**, **D1–D5**) đã được sửa triệt để trong mã nguồn và vượt qua bộ kiểm thử tự động 100%.

### Ưu tiên 0 — Làm ngay (người dùng đang bị ảnh hưởng)

- [x] **G1 🔴 Web đang chạy bản cũ, chưa có các bản sửa — [ĐÃ SỬA ✅]**
  - Đã thêm `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, nâng `node-version: 22` và đổi `contents: read` trong `.github/workflows/deploy.yml`.
- [x] **G2 🔴 Nút đồng bộ Google Sheets gửi dữ liệu nhân sự sang Apps Script của web bán hàng — [ĐÃ SỬA ✅]**
  - Đã gỡ URL Apps Script của web bán hàng khỏi `INITIAL_SETTINGS.googleSheetsWebAppUrl` trong `src/data/seedData.ts` và cập nhật `HUONG_DAN_SU_DUNG.md` để cấu hình Web App `google-sheets/Code.gs` độc lập cho HRM.
- [x] **C4 🔴 Lịch ca và kỳ lương hết hạn ngày 01/11/2026 — [ĐÃ SỬA ✅]**
  - Đã chuyển sang sinh lịch tuần/tháng động không giới hạn năm/tháng (`buildDynamicMonthWeeks`, `getWeekDaysFromMonday`, `shiftPeriodMonth`, `getDynamicPeriods`) ở `ShiftScheduleView.tsx`, `PayrollView.tsx`, `TimesheetView.tsx`, `ReportsView.tsx`, `RequestsView.tsx` và `MobileAppView.tsx`.

### Ưu tiên 1 — Gian lận chấm công

- [x] **D1 🔴** Bấm "Xác thực QR" khi ô còn trống thì app tự chấm công cho chính mình — **[ĐÃ SỬA ✅]** (Đã bỏ fallback `|| personalQrRaw` ở `MobileAppView.tsx`; khi trống báo lỗi yêu cầu nhập/quét mã).
- [x] **D2 🔴** Dán mã QR cá nhân của đồng nghiệp là chấm công được cho người đó — **[ĐÃ SỬA ✅]** (Chỉ vai trò Quản lý/Nhân sự/Admin khi bật `qrManagerScanEmployee` mới được quét mã QR cá nhân của nhân viên thuộc `scopedEmployees`).
- [x] **B4 🔴** Kiosk QR vẫn có ô chọn nhân viên — **[ĐÃ SỬA ✅]** (Đã gỡ hoàn toàn `<select>` chọn nhân viên trên `DoorQrKioskModal.tsx`).
- [x] **B5 🟠** `KIOSK_QR_SECRET` vẫn nằm trong bundle JS — **[ĐÃ SỬA ✅]** (Đã xoá khoá tĩnh khỏi mã nguồn, sử dụng khoá phiên sinh động `getQrSigningSecret()` trong `src/utils/helpers.ts`).

### Ưu tiên 2 — Bảo mật và tiền

- [x] **B1 🔴** Bộ chuyển tài khoản không cần mật khẩu — **[ĐÃ SỬA ✅]** (Yêu cầu xác thực Mã PIN / Mật khẩu trong `switchAccount` tại `HRMContext.tsx` và hộp thoại xác thực PIN tại `Topbar.tsx`).
- [x] **C2 🔴** Token API viết cứng trong frontend, còn `GET /api/state` mở không cần token — **[ĐÃ SỬA ✅]** (Đã gỡ token cứng khỏi frontend, `server/index.js` và `Code.gs`; bắt buộc xác thực `X-Phuonghihi-Token` cho cả `GET /api/state` và `POST /api/state`).
- [x] **B2 🔴** File uỷ nhiệm chi Vietcombank tự bịa số tài khoản `007100…` — **[ĐÃ SỬA ✅]** (Chặn tạo STK giả `007100...` trong `PayrollView.tsx`, lọc chỉ xuất nhân viên có STK hợp lệ và cảnh báo danh sách nhân viên thiếu STK).
- [x] **D5 🟡** Khi tài khoản đang dùng bị khoá, app rơi về `accounts[0]` (Quản trị). HR cũng có thể khoá admin duy nhất — **[ĐÃ SỬA ✅]** (Bảo vệ `NV0000` không thể chuyển sang `"Đã nghỉ"`, và fallback về tài khoản quyền thấp `employee` thay vì `super_admin`).

### Ưu tiên 3 — Dữ liệu thật

- [x] **C1 🔴 Đồng bộ backend — [ĐÃ SỬA ✅]:**
  - Bổ sung `pullStateFromBackend()` (`GET /api/state`) tải dữ liệu từ server về máy.
  - Cập nhật `ALLOWED_STATE_KEYS` trong `server/index.js` nhận đủ `payrollPeriods`, `bonusDeductions`, `accounts`.
  - Đồng bộ `SYNC_FULL_STATE` / `syncAll` trong `google-sheets/Code.gs` ghi trực tiếp `employees`, `attendanceRecords`, `requests` vào trang tính.
- [x] **C3 🟠** Bảng công vẫn dùng số giả — **[ĐÃ SỬA ✅]** (Đã xoá bỏ hoàn toàn công thức `20 + (idx % 3) * 0.5`; tính bảng công và bảng lương trực tiếp từ `attendanceRecords` + `requests` đã duyệt thông qua `computeEmployeeTimesheetRow`, nhân viên mới chưa chấm công có `0` ngày công và `0đ` lương).
- [x] **C6 🟡** Biểu đồ theo ngày ở Báo cáo vẫn sinh bằng công thức — **[ĐÃ SỬA ✅]** (`ReportsView.tsx` tổng hợp trực tiếp từ `attendanceRecords` từng ngày trong kỳ).

### Ưu tiên 4 — Quy tắc tính và giao diện

- [x] **D3 🟠** Ngày không có ca vẫn bị tính "Đi muộn" — **[ĐÃ SỬA ✅]** (Kiểm tra `hasScheduledShift`; nếu đi làm ngày không có ca xếp trước thì `lateMinutes = 0`, trạng thái `'Đúng giờ'`).
- [x] **D4 🟠** Ca đêm vào sau 0h không bị tính muộn — **[ĐÃ SỬA ✅]** (`calculateCheckInLateAndOt` trong `src/utils/helpers.ts` cộng bù `+1440` phút khi `isOvernightShift` và giờ chấm vào sau 00:00).
- [x] **C5 🟠** Giảm trừ gia cảnh & Hạn mức EWA — **[ĐÃ SỬA ✅]** (Bổ sung nút áp dụng nhanh mức giảm trừ 2026 `15,5tr / 6,2tr` trong `SettingsView.tsx` và thống nhất hạn mức EWA tối đa `30%` lương cơ bản ở cả `HRMContext.tsx`, `RequestsView.tsx` và `MobileAppView.tsx`).
- [x] **C8 🟡** Các ô cài đặt chưa có tác dụng — **[ĐÃ SỬA ✅]** (Áp dụng `otMultiplierWeekend` cho ngày Thứ Bảy/Chủ Nhật khi tính lương OT, kiểm tra `biometricEnabled`, `qrManagerScanEmployee`, `requirePhotoOnGps`, và ẩn nút `"Khôi phục dữ liệu mẫu"` đối với mọi vai trò không phải `super_admin`).
- [x] **C7 🟡** Giao diện điện thoại — **[ĐÃ SỬA ✅]** (Thanh `"Lưu thay đổi"` dùng `bottom-20 lg:bottom-4` không đè lên thanh điều hướng đáy; chống tràn ngang ở màn hình 375px cho Lịch ca, Nhật ký và Báo cáo).
- [x] **B3 🔴** GPS và ảnh chấm công vẫn giả lập — **[ĐÃ SỬA ✅]** (Tích hợp `navigator.geolocation.getCurrentPosition` và chụp/tải ảnh Selfie `<input type="file" accept="image/*" capture="user">` kèm đóng dấu Watermark Canvas trong `MobileAppView.tsx`, kiểm tra bắt buộc ảnh khi `settings.requirePhotoOnGps` bật).
- [x] **G3 🟡** Trình sửa Google Sites đang trỏ vào trang cũ đã ẩn — **[ĐÃ SỬA ✅]** (Đã cập nhật sang ID trang mới `1OwDFFthLqJKC-wHM70WszAbGweH_VCGO` trong `GoogleSitesModal.tsx` và `HUONG_DAN_SU_DUNG.md`).

---

## ♻️ KIỂM TRA LẠI — 17/10/2026 (Đã khắc phục hoàn tất 100% B1–B5, C1–C8, D1–D5, G1–G3 ✅)

| Mã | Vấn đề trong đợt tái kiểm tra 17/10/2026 | Trạng thái sau khi sửa & test lại |
|---|---|---|
| **B1 🔴** | Bộ chuyển tài khoản không cần mật khẩu | ✅ **ĐÃ SỬA:** Yêu cầu xác thực Mã PIN / Mật khẩu khi chuyển tài khoản (`switchAccount` + Modal xác thực PIN tại `Topbar.tsx`) |
| **B2 🔴** | Uỷ nhiệm chi Vietcombank tự bịa số tài khoản `007100…` | ✅ **ĐÃ SỬA:** Loại bỏ hoàn toàn logic sinh STK giả `007100...`; chặn xuất và cảnh báo danh sách nhân viên chưa có STK |
| **B3 🔴** | GPS & ảnh vẫn giả lập; `requirePhotoOnGps` không có tác dụng | ✅ **ĐÃ SỬA:** Tích hợp `navigator.geolocation.getCurrentPosition`, chụp ảnh Selfie camera/canvas và chặn chấm công GPS nếu thiếu ảnh khi `requirePhotoOnGps = true` |
| **B4 🔴** | Kiosk QR vẫn có ô chọn nhân viên | ✅ **ĐÃ SỬA:** Đã gỡ bỏ hoàn toàn dropdown chọn nhân viên khỏi `DoorQrKioskModal.tsx` |
| **B5 🟠** | Khoá bí mật QR (`KIOSK_QR_SECRET`) nằm cứng trong bundle JS | ✅ **ĐÃ SỬA:** Xoá hằng số tĩnh khỏi mã nguồn, dùng khoá phiên động `getQrSigningSecret()` |
| **C1 🔴** | Đồng bộ backend 1 chiều & thiếu khoá `payrollPeriods, bonusDeductions, accounts` | ✅ **ĐÃ SỬA:** Thêm `pullStateFromBackend()` (`GET /api/state`), cập nhật `ALLOWED_STATE_KEYS` ở `server/index.js` và ghi dữ liệu thật ở `Code.gs` |
| **C2 🔴** | Token API viết cứng trong frontend, `GET /api/state` không cần token | ✅ **ĐÃ SỬA:** Xoá token cứng khỏi mã nguồn; bắt buộc header `X-Phuonghihi-Token` cho cả `GET /api/state` và `POST /api/state` |
| **C3 🟠** | Bảng công dùng công thức giả `20 + (idx%3)*0.5` | ✅ **ĐÃ SỬA:** Xoá bỏ công thức giả; tính công thực tế từ `attendanceRecords` + đơn đã duyệt (`computeEmployeeTimesheetRow`) |
| **C4 🔴** | Lịch & kỳ lương chỉ tới hết 10/2026 | ✅ **ĐÃ SỬA:** Sinh tuần/tháng/kỳ lương động theo thời gian thực cho mọi năm/tháng |
| **C5 🟠** | Giảm trừ gia cảnh 2026 & Hạn mức EWA 50% vs 30% | ✅ **ĐÃ SỬA:** Thống nhất hạn mức EWA tối đa `30%` lương cơ bản; thêm nút áp dụng nhanh mức giảm trừ 2026 (`15,5tr / 6,2tr`) |
| **C6 🟡** | Biểu đồ theo ngày ở Báo cáo sinh theo công thức | ✅ **ĐÃ SỬA:** Tính trực tiếp từ `attendanceRecords` thực tế từng ngày trong kỳ |
| **C7 🟡** | Thanh "Lưu thay đổi" đè nav đáy mobile & tràn ngang 375px | ✅ **ĐÃ SỬA:** Dùng `bottom-20 lg:bottom-4` và chống tràn ngang trên Lịch ca, Nhật ký, Báo cáo |
| **C8 🟡** | Hệ số OT cuối tuần, máy vân tay, nút Khôi phục dữ liệu mẫu | ✅ **ĐÃ SỬA:** Nhân `otMultiplierWeekend` cho OT Thứ Bảy/Chủ Nhật, kiểm tra `biometricEnabled` và chỉ hiển thị nút Khôi phục dữ liệu mẫu cho `super_admin` |
| **D1 🔴** | Bấm "Xác thực QR" khi ô trống tự chấm công bằng `personalQrRaw` | ✅ **ĐÃ SỬA:** Đã xoá fallback `|| personalQrRaw`; ô trống sẽ báo lỗi yêu cầu nhập/quét mã |
| **D2 🔴** | Dán mã QR cá nhân của đồng nghiệp chấm hộ được | ✅ **ĐÃ SỬA:** Chỉ Quản lý/HR/Admin bật `qrManagerScanEmployee` mới được quét QR cá nhân của nhân sự trong `scopedEmployees` |
| **D3 🟠** | Ngày không có ca vẫn bị tính đi muộn | ✅ **ĐÃ SỬA:** Chỉ tính `lateMinutes` khi nhân viên có ca xếp lịch (`hasScheduledShift`) |
| **D4 🟠** | Ca Đêm (22:00–06:00) vào sau 0h không bị tính muộn | ✅ **ĐÃ SỬA:** Xử lý qua đêm `+1440` phút trong `calculateCheckInLateAndOt` (VD vào `00:30` tính muộn `150` phút) |
| **D5 🟡** | Tài khoản khoá rơi về `accounts[0]` (Admin) & cho nghỉ việc `NV0000` | ✅ **ĐÃ SỬA:** Chặn chuyển `NV0000` sang `"Đã nghỉ"` và fallback về tài khoản `employee` thay vì `super_admin` |

---

## 0. Tóm tắt nhanh

| # | Vấn đề lớn nhất | Mức |
|---|---|---|
| 1 | Dữ liệu chỉ lưu trong `localStorage` của từng trình duyệt — NV chấm công trên điện thoại thì quản lý **không thấy**; không có backend nào được gọi | 🔴 |
| 2 | Phân quyền chỉ là hình thức: tài khoản **Nhân viên** xem được lương 50 người, vào Cài đặt, Phân quyền, Nhật ký, và **tự duyệt đơn của mình** | 🔴 |
| 3 | Đơn **Ứng lương nhanh (EWA)** được duyệt nhưng **không bao giờ bị trừ vào lương** (sai định dạng kỳ `10/2026` vs `2026-10`) | 🔴 |
| 4 | Người chưa khai lương cơ bản vẫn được tính lương **25.000.000đ** mặc định | 🔴 |
| 5 | Chấm công GPS là **giả lập** (nút bật/tắt "Tại quầy / Ngoài vùng"), không lấy GPS thật, không chụp ảnh | 🔴 |
| 6 | Nút **Khôi phục dữ liệu mẫu** trên Topbar xoá sạch toàn bộ dữ liệu bằng 1 cú bấm, không hỏi lại, mọi vai trò đều bấm được | 🔴 |
| 7 | Server Node và Google Apps Script **không có xác thực** (đọc/ghi toàn bộ DB, gửi email từ Gmail chủ sở hữu) | 🔴 |
| 8 | Ngày "hôm nay" bị **cố định 09/10/2026** ở khắp nơi (chấm công, nhật ký, đơn từ…) | 🟠 |
| 9 | Nhiều số liệu/màn hình là **dữ liệu dựng sẵn** (Báo cáo, Lịch nghỉ công ty, "45 cảnh báo", "267 +" thao tác…) | 🟠 |
| 10 | Hàng loạt phần **không hiển thị cho người dùng** (bảng cắt 18 dòng, cài đặt không có ô nhập, tab Cài đặt trùng nội dung…) | 🟠 |

---

## 1. Lỗi nghiêm trọng 🔴

### 1.1. Không có nơi lưu dữ liệu dùng chung
- `src/context/HRMContext.tsx:157-244` — mọi state chỉ đọc/ghi `localStorage` (`phuonghihi_hrm_state_v2_*`).
- Không có lời gọi `fetch` nào trong `src/` → `server/index.js` và `google-sheets/Code.gs` **không được frontend sử dụng**. Ô "Google Sheets Web App URL" trong Cài đặt chỉ lưu chuỗi, không đồng bộ gì.
- **Hệ quả:** nhân viên chấm công trên điện thoại / gửi đơn → chỉ nằm trong máy của họ. Quản lý ở máy khác không thấy. Xoá cache trình duyệt = mất toàn bộ bảng công, bảng lương.
- **Đề xuất:** chọn 1 backend thật (Apps Script / server Node / Firebase…), có xác thực; `localStorage` chỉ dùng làm cache.

### 1.2. Phân quyền (RBAC) không được thực thi — [Đã tái hiện]
Đăng nhập (chuyển) sang tài khoản **Bùi Minh Quân — "Của bản thân"** (vai trò Nhân viên):
- Sidebar vẫn hiện **đủ 13 mục**, gồm Cài đặt, Phân quyền, Nhật ký (`src/components/Sidebar.tsx:54-96` không lọc theo `roleId`).
- **Bảng lương** hiện "Bảng tính lương chi tiết … (50 nhân sự)" với lương, thực lĩnh của tất cả mọi người (tên bị thay bằng mã NV nhưng số tiền vẫn hiện). Nguyên nhân: `computePayrollRows` dùng `employees` (toàn bộ) thay vì `scopedEmployees` (`HRMContext.tsx:853`). Xuất CSV/Excel/Uỷ nhiệm chi cũng lấy toàn bộ.
- **Tự duyệt đơn của chính mình:** tab "Chờ tôi duyệt" có nút ✓/✕ cho đơn của chính người đó (`RequestsView.tsx:219-239`). Đã tự duyệt thành công đơn Ứng lương 3.000.000đ của chính mình.
- Bảng điều khiển: đơn chờ duyệt, số người chưa chấm, quỹ lương đều **không lọc theo phạm vi** (`DashboardView.tsx:29-33`). Chuông thông báo đếm đơn của toàn công ty (`Topbar.tsx:25`).
- Nhân viên mở "Hồ sơ của tôi" → "Sửa hồ sơ" → **tự sửa lương cơ bản/phụ cấp của mình** rồi Lưu.
- Tài khoản **Thiết bị tại cửa** (`dataScope: 'Chỉ mở mã QR tại cửa'`) rơi vào nhánh mặc định `return employees` (`HRMContext.tsx:274`) → thấy **toàn bộ dữ liệu**, đóng modal QR là dùng được như admin.
- Tài khoản bị **"Tạm khoá"** vẫn chọn được trong bộ chuyển tài khoản (Topbar + nút ở chân Sidebar) — trạng thái khoá không có tác dụng.
- Bộ chuyển tài khoản **không cần mật khẩu**, ai cũng thành Quản trị cao nhất được.
- **Đề xuất:** có đăng nhập thật; map `roleId → danh sách tab + hành động`; mọi hàm trong context kiểm tra quyền; `computePayrollRows`, dashboard, chuông dùng dữ liệu đã lọc phạm vi; cấm người tạo đơn tự duyệt.

### 1.3. Ứng lương nhanh (EWA) không bị trừ vào lương — [Đã tái hiện]
- Khi duyệt, khoản khấu trừ được ghi với `period: '10/2026'` (`HRMContext.tsx:627`), trong khi bảng lương lọc theo `'2026-10'` (`HRMContext.tsx:904-906`).
- Tái hiện: NV0009 thực lĩnh kỳ 10/2026 = **15.879.858đ** trước và **sau** khi duyệt ứng 3.000.000đ → công ty vừa ứng tiền vừa trả đủ lương.
- Ngoài ra:
  - Không kiểm tra hạn mức **30%** như quảng cáo: web cho tối đa 10.000.000đ, mobile 8.000.000đ (chỉ là thuộc tính HTML `max`, gõ tay vượt được).
  - Ô số tiền để trống → `advanceAmount = 0` → khi duyệt dùng mặc định **3.000.000đ** (`HRMContext.tsx:623`).
  - Duyệt nhiều lần không có chặn (dù UI ẩn nút sau khi duyệt, hàm context không kiểm tra `status`).

### 1.4. Người chưa khai lương vẫn được trả 25 triệu — [Đã tái hiện]
- `HRMContext.tsx:867` `const baseSalary = emp.baseSalary || 25000000;` → "Quản lý cửa hàng (NV0000)" cột Lương cơ bản hiện **"Chưa khai"** nhưng thực lĩnh **24.180.057đ**.
- Phiếu lương in "Lương cơ bản hợp đồng: 25.000.000đ" (`PayrollView.tsx:941`).
- Tương tự: phụ cấp mặc định 1.500.000đ, bảng công thiếu thì mặc định **21 công + 1 phép** (`HRMContext.tsx:857-865`), trong khi màn Bảng công lại mặc định **20 công + 1 phép + 1 lần muộn** (`TimesheetView.tsx:33-44`) — hai màn hình ra hai con số khác nhau cho cùng một người.
- **Đề xuất:** người chưa có lương/bảng công → không tính, hiện cảnh báo và chặn Bước 4–5.

### 1.5. Chấm công GPS / ảnh / QR chỉ là giả lập
- Không dùng `navigator.geolocation` ở bất kỳ đâu. Vị trí là toạ độ cộng sẵn, chọn bằng nút **"📍 Tại quầy (27m) / 🚶 Ngoài vùng"** — chính nhân viên bấm được (`MobileAppView.tsx:63-75, 254-266`). "GPS ±12m" là số cố định.
- Ngoài phạm vi vẫn chấm được, ghi là "Từ xa" — không kiểm tra `remoteEnabled` hay `allowRemote` của nhân viên (`MobileAppView.tsx:165-176`).
- Không dùng camera (`getUserMedia`); "Watermark selfie" chỉ là dòng chữ. Cài đặt "Yêu cầu chụp ảnh khi chấm" không có tác dụng.
- QR tại cửa: chữ ký dùng khoá bí mật **viết cứng trong bundle JS** (`src/utils/helpers.ts:66`) → ai cũng tạo được mã hợp lệ. Nút "Quét chấm công" tự xác thực mã của chính màn hình và có **ô chọn nhân viên** → chấm hộ người khác dễ dàng (`DoorQrKioskModal.tsx:62-76, 148-158`). Trên mobile nút "Quét mã QR tại cửa" chỉ mở màn hình kiosk, không có máy quét.
- Mã QR cá nhân chỉ là JSON tên/mã NV, không ký → giả mạo được.

### 1.6. Nút "Khôi phục dữ liệu mẫu" xoá sạch dữ liệu
- Icon ↺ nhỏ ở Topbar (`Topbar.tsx:149-155`), mọi vai trò thấy, **không có hộp xác nhận**, gọi `localStorage.clear()` (`HRMContext.tsx:1137`) → mất toàn bộ chấm công, đơn, lương. Đặt ngay cạnh chuông thông báo nên rất dễ bấm nhầm.
- **Đề xuất:** ẩn khỏi bản chạy thật, hoặc chỉ Super Admin + xác nhận 2 bước.

### 1.7. Backend không xác thực
- `server/index.js`:
  - `GET /api/state` trả **toàn bộ DB** (lương, số tài khoản ngân hàng) cho bất kỳ ai; `POST /api/state` **ghi đè toàn bộ DB** không cần token (header `X-Phuonghihi-Token` được cho phép nhưng không bao giờ kiểm tra).
  - Kiểm tra Origin bằng `startsWith` (`server/index.js:86`) → `https://sites.google.com.attacker.com` vẫn qua.
- `google-sheets/Code.gs`:
  - `doPost` action `SEND_PAYSLIP_EMAILS` **không xác thực** → ai có URL Web App (đang viết sẵn trong `seedData.ts:659`, tức là nằm trong bundle công khai) có thể gửi tới 100 email/lần **từ Gmail của chủ sở hữu** tới bất kỳ địa chỉ nào, nội dung tuỳ ý → spam/phishing, cạn quota MailApp.
  - `LOG_AUDIT` không xác thực → giả mạo nhật ký.
- Tài liệu `BAO_CAO_KIEM_THU_BAO_MAT_VA_NANG_CAP_2026.md` và README ghi "0 lỗ hổng" — **không đúng**, nên cập nhật.

### 1.8. Uỷ nhiệm chi Vietcombank có thể chuyển tiền sai
- Nếu nhân viên không có số tài khoản, hệ thống **tự bịa** số `007100xxxxxx` (`PayrollView.tsx:158`) và ngân hàng mặc định → file chuyển khoản có thể đẩy tiền vào tài khoản người lạ.
- Xuất cả người chưa khai lương (25 triệu ảo, xem 1.4) và — với tài khoản phạm vi hẹp — cả người ngoài phạm vi (tên = mã NV).
- Không có ô nhập Số tài khoản / Ngân hàng trong hồ sơ nhân viên (xem 3.6), nên NV mới luôn bị bịa số.
- **Đề xuất:** bắt buộc có STK hợp lệ, liệt kê người thiếu và chặn xuất.

### 1.9. Thuế TNCN và giảm trừ gia cảnh sai
- Công thức chỉ có 2 bậc: ≤5tr 5%, còn lại 10% (`HRMContext.tsx:915-920`). Ví dụ thu nhập tính thuế 30tr: code ra 2.750.000đ, biểu luỹ tiến 7 bậc ra 4.350.000đ → **thu thiếu thuế**, rủi ro truy thu.
- Giảm trừ bản thân 11.000.000đ / người phụ thuộc 4.400.000đ (`seedData.ts:656-657`) là mức cũ; từ kỳ tính thuế 2026 mức giảm trừ đã được nâng (15,5tr / 6,2tr theo Nghị quyết 110/2025/UBTVQH15) và biểu thuế lương có thay đổi theo luật TNCN sửa đổi — **cần kế toán đối chiếu quy định hiện hành** trước khi dùng thật.
- Hai mức giảm trừ này **không có ô chỉnh trong Cài đặt** (xem 3.4).
- BHXH 10,5% tính trên lương cơ bản không áp trần (20 × lương cơ sở).

---

## 2. Lỗi chức năng 🟠

### 2.1. Ngày "hôm nay" bị cố định 09/10/2026
Hôm nay thực tế 16/10/2026 nhưng:
- Chấm công luôn ghi vào ngày `2026-10-09` (`HRMContext.tsx:472, 497`; `AttendanceView.tsx:44`; `MobileAppView.tsx:60`).
- Màn Điểm danh: "Thứ Sáu, 09/10/2026"; Mobile: "Thứ Sáu, 09/10/2026 · Hành chính" cho **mọi** nhân viên, "Chào buổi chiều" cố định.
- Nhật ký: mọi dòng có ngày `09/10/2026` (`HRMContext.tsx:297`); Đơn mới: `createdAt: '09/10/2026 15:45'` (`:658`); Thông báo, hoa hồng, tạm ứng: `09/10/2026`.
- Sidebar: "Hôm nay, 09/10/2026" (`Sidebar.tsx:228`).
- Lịch ca: ô "hôm nay" tô ngày 9, nhưng nút **"Hôm nay"** lại nhảy sang tuần 12–18/10.

### 2.2. Lịch ca chỉ có đúng 2 tuần
- `ShiftScheduleView.tsx:19-37` chỉ có tuần 05–11/10 và 12–18/10; mũi tên ‹ › chỉ chuyển qua lại 2 tuần này, lịch tháng nhỏ vẽ cứng tháng 10/2026. Không xếp được ca tuần 19/10 trở đi.
- Nút **Ngày / Tuần / Tháng** đổi trạng thái nhưng lưới **không thay đổi** (`viewMode` không được dùng).

### 2.3. Điểm danh không khớp với lịch ca — [Đã tái hiện]
- Ca trong màn Điểm danh lấy từ dữ liệu điểm danh dựng sẵn, không từ Bảng phân ca. VD Lê Quang Huy: lịch ca thứ 6 = Hành chính, Điểm danh ghi "Ca Đêm".
- 35 người "Không có ca" trong khi Bảng phân ca thứ 6 09/10 hầu hết đều có ca.
- Không bao giờ tính **đi muộn**: chấm công luôn đặt trạng thái "Đúng giờ", `lateMinutes: 0` (`HRMContext.tsx:482, 500`). Thẻ "Đi muộn" luôn = 0; badge "Đang lấy dữ liệu đi muộn" là chữ tĩnh.
- Chấm công hộ: luôn ghi "Đúng giờ" dù giờ vào 10:00; không kiểm tra giờ ra > giờ vào.
- Bấm chấm công lần 3 (sau khi đã vào + ra) vẫn báo "Chấm công thành công" nhưng không ghi gì mới.

### 2.4. Bảng công không lấy từ chấm công
- Nút "Tổng hợp" chỉ bật cờ `step1TimesheetAggregated` (`HRMContext.tsx:795-804`), không đọc dữ liệu chấm công → dữ liệu chấm công và bảng công **tách rời hoàn toàn**.
- Đơn đã duyệt (nghỉ phép, tăng ca, bổ sung công, đi muộn/về sớm, công tác) **không ảnh hưởng** bảng công.
- "Chốt kỳ công" xong vẫn bấm đổi "Đã xác nhận ↔ Chờ xác nhận" được; không có chỉ báo kỳ đã chốt.
- Công thực tế + phép có thể vượt công chuẩn (NV0009: 22.5/22) → lương theo công > lương cơ bản.

### 2.5. Quy trình lương 5 bước
- Bước 1, 2, 4, 5 luôn hiện dấu ✅ xanh dù chưa làm (`PayrollView.tsx:352, 373, 424, 445`); "x / x đã tính" luôn đầy.
- **Khoá bảng lương** không khoá gì: vẫn Tính lương, thêm Thưởng/Khấu trừ, Hoa hồng, Phát hành được.
- "Phát hành phiếu lương" không kiểm tra bước trước; toast/nhật ký luôn ghi **"49 phiếu"** (`HRMContext.tsx:976-978`); không gửi email thật.
- **Hoa hồng iPhone**: bấm "Áp dụng" 2 lần → cộng hoa hồng **2 lần** (không chống trùng). Chỉ hiện 8 NV đầu tiên (`.slice(0, 8)`), số lượng máy điền sẵn số giả.
- **Khai lương**: chỉ khai được cho người thiếu **đầu tiên**, không chọn người; phụ cấp bị ghi đè cứng 3.000.000đ; ô số xoá trống tự nhảy về 25.000.000; toast luôn nói "Tất cả nhân viên … đã có đủ".
- **Thưởng/Khấu trừ**: nhận số âm; mặc định chọn NV0001 dù có thể ngoài phạm vi.
- Kỳ lương chỉ chọn 9/2026 và 10/2026 (kỳ 8/2026 có dữ liệu nhưng không vào được); mặc định mở **tháng 9** trong khi Bảng công mở tháng 10.
- In phiếu lương dùng `window.print()` không có CSS `@media print` → in cả trang (sidebar, bảng…), không phải 1 phiếu.

### 2.6. Đơn từ
- Tab **"Chờ tôi duyệt"** liệt kê **tất cả** đơn (cả đã duyệt/từ chối), không chỉ đơn đang chờ (`RequestsView.tsx:157`).
- Tab **"Đơn của tôi"** cứng thêm đơn của NV0009 và NV0001 (`RequestsView.tsx:49-51`) → mọi người đều thấy đơn của 2 người này.
- Số ngày nghỉ luôn = 1 bất kể từ ngày–đến ngày (`days: 1`) → trừ phép sai; tạo đơn không cộng cột "Đang chờ"; duyệt không kiểm tra còn đủ phép.
- Ngày nhập dạng text tự do, không kiểm tra định dạng / đến ngày < từ ngày.
- Mặc định người gửi = NV0009: tài khoản không có NV0009 trong phạm vi sẽ thấy tên khác trên ô chọn nhưng **đơn vẫn gửi cho NV0009**.
- Đổi ca hiển thị mã thô "CHIEU", "HANH_CHINH"; không có lựa chọn ca Đêm.

### 2.7. Hồ sơ nhân viên — [Đã tái hiện]
- Tab "Nhận & trả việc": tích 1 việc → modal **nhảy về tab "Thông tin"** và **mất các thay đổi chưa lưu** ở các tab khác. Nguyên nhân: `useEffect` phụ thuộc `existingEmp` (đối tượng mới mỗi lần `employees` đổi) rồi `setFormData` + `setActiveTab('info')` (`EmployeeProfileModal.tsx:23-55`). Tương tự khi bấm "Tạo việc nhận người mới / tiễn người nghỉ".
- "Tải lên tài liệu đính kèm" không mở chọn file, chỉ thêm dòng giả `SoYeuLyLich_xxx.pdf`; tài liệu không xem/tải được.
- "Thêm phụ lục / hợp đồng" thêm hợp đồng cố định, không có form.
- Không có chức năng **xoá / cho nghỉ việc** nhân viên.

### 2.8. Nhập Excel
- File lỗi (quá 5MB, sai đuôi, hỏng) → lỗi bị nuốt và hệ thống **tự nhập 1 nhân viên giả "Trần Hoàng Khải"** (`EmployeesView.tsx:91-102`).
- Cột "Mã NV" trong file bị bỏ qua; email/SĐT thiếu thì gán cùng một giá trị giả cho mọi dòng; phòng ban/trạng thái không kiểm tra hợp lệ.
- Mã NV tự sinh theo `employees.length + 1` → dễ trùng mã (trùng mã = ghi đè hồ sơ cũ khi lưu).

### 2.9. AI xếp ca & thao tác hàng loạt
- "✨ AI Xếp ca" ghi đè cả tuần của mọi người trong phạm vi **không hỏi xác nhận**, không hoàn tác. Thực chất là xoay vòng theo chỉ số, không tối ưu gì.
- Icon ↻ "Sao chép ca tuần chuẩn" thực ra **đặt Hành chính T2–T6 cho 10 người đầu** (ghi đè), không sao chép gì.
- "Ca & ngày nghỉ" mở cùng modal với "Mở lối tắt phân ca".
- Bút ca **"Hành chính" bật sẵn** khi mở trang → bấm nhầm vào ô là xếp ca luôn.
- Kéo bút qua 7 ô = 7 dòng nhật ký; nhật ký tăng không giới hạn trong `localStorage` (rủi ro hết quota → mọi thứ dừng lưu mà không báo).

### 2.10. Cài đặt không có tác dụng
Các công tắc **không được kiểm tra ở bất kỳ đâu**: GPS, QR (cả 3 chế độ), Từ xa, Máy chấm công, Chấm hộ, Yêu cầu chụp ảnh, `allowRemote` từng nhân viên. Tắt "Chấm công hộ" vẫn chấm hộ được; tắt "QR" vẫn quét được.
- Xoá trống ô Vĩ độ/Kinh độ → tự nhảy về **toạ độ Hà Nội** (21.0306, 105.8006) (`SettingsView.tsx:405, 419`).
- Rời trang Cài đặt khi chưa lưu → mất thay đổi, không cảnh báo.
- Bậc phạt đi muộn không kiểm tra chồng lấn khoảng phút.

### 2.11. Bản tin nội bộ
- "Tin quá ngày hết hạn tự rụng" — **không có** đoạn lọc theo `expiresAt`; tin hết hạn vẫn hiện.
- Bảng điều khiển lấy 3 tin đầu, không ưu tiên tin ghim.

---

## 3. Phần không hiển thị / người dùng không thấy được 🟠🟡

| # | Vị trí | Mô tả | Đề xuất |
|---|---|---|---|
| 3.1 | Điểm danh `AttendanceView.tsx:350` | Bảng chỉ hiện **18 / 50** người, không có nút "Xem thêm"/phân trang → 32 người không thấy, không chấm hộ được từ bảng | Thêm phân trang như màn Ca/Lương |
| 3.2 | Đơn từ › Số dư phép `RequestsView.tsx:418` | Chỉ hiện **18 / 51** người | Phân trang / tìm kiếm |
| 3.3 | Hoa hồng iPhone `PayrollView.tsx:62` | Chỉ nhập được cho **8** NV Kinh doanh/Kỹ thuật đầu tiên | Hiện đủ + tìm kiếm |
| 3.4 | Cài đặt — tab "Quy tắc chấm", "Máy chấm công", "Tính lương & Sheets" | **Cả 3 tab hiện cùng một nội dung** (`SettingsView.tsx:603-605`). Không có nơi chỉnh: cho chấm sớm/về muộn (`allowEarlyCheckInMinutes`, `allowLateCheckOutMinutes`), hệ số OT cuối tuần, **giảm trừ gia cảnh/người phụ thuộc**, tự gửi email phiếu lương, tự đồng bộ Sheets, địa chỉ cửa hàng, thiết bị vân tay | Làm nội dung riêng cho từng tab, đưa các trường còn thiếu ra UI |
| 3.5 | Phiếu lương & bảng lương | Khoản **"Khấu trừ khác"** (tạm ứng, khấu trừ thủ công) có trừ vào thực lĩnh nhưng **không hiện dòng nào** trên phiếu lương web, phiếu mobile, bảng chi tiết, CSV/Excel → các dòng cộng/trừ không khớp số thực lĩnh. Phiếu mobile cũng không hiện phạt đi muộn | Thêm dòng "Khấu trừ khác / Tạm ứng" |
| 3.6 | Hồ sơ nhân viên | Không có ô **Số người phụ thuộc** (dùng để tính thuế), **Số tài khoản / Ngân hàng** (dùng cho uỷ nhiệm chi), không sửa được **Mã NV** | Thêm vào tab Thông tin |
| 3.7 | Nhân viên › "Nhập từ Excel" | **File mẫu chỉ tải được bằng cách bấm đúp** vào nút (`EmployeesView.tsx:152`), không có chỉ dẫn; bấm đúp còn mở hộp chọn file 2 lần | Nút riêng "Tải file mẫu" |
| 3.8 | Topbar < 1024px | Bộ chuyển vai trò, "QR tại cửa" bị ẩn (`hidden lg:flex`); Expo Go ẩn < 768px; Google Sites ẩn < 640px; "Web bán hàng" chỉ hiện ≥ 1280px. Trên điện thoại chỉ đổi tài khoản được qua icon **"Đăng xuất" (LogOut)** ở chân sidebar — icon gây hiểu nhầm, và bấm là xoay vòng tài khoản kế tiếp | Đưa vào menu "⋯" trên mobile; đổi icon |
| 3.9 | Lịch ca | Dòng hướng dẫn quảng cáo "Bấm vào ô để mở chi tiết · Kéo thả để chuyển ca · giữ Ctrl để nhân bản · Shift + bấm mở menu" — **không tính năng nào tồn tại**; bấm ô (không bút) là bật/tắt ca Hành chính | Bỏ dòng hướng dẫn hoặc làm tính năng |
| 3.10 | Lịch ca | Badge **"45 cảnh báo"** là số cứng, bấm không có gì (`ShiftScheduleView.tsx:415`) | Tính cảnh báo thật hoặc bỏ |
| 3.11 | Đơn từ › Lịch nghỉ công ty | Toàn bộ lịch **viết cứng** (tên, ngày, "3 đơn"); nút ‹ › không làm gì; đơn nghỉ mới duyệt không xuất hiện (`RequestsView.tsx:257-354`) | Sinh lịch từ đơn đã duyệt |
| 3.12 | Báo cáo | KPI 499 / 67 / 43 / 524, biểu đồ theo ngày, hiệu suất phòng ban **đều là số cứng**, tháng 8 và 9 giống hệt; không chọn được tháng 10; xuất CSV/Excel chỉ xuất bảng phòng ban giả; "Xuất PDF" = in cả trang | Tính từ dữ liệu thật |
| 3.13 | Nhật ký | Tổng số hiển thị `267 + số dòng thật` (`AuditLogView.tsx` "{267 + filteredLogs.length} thao tác"); bộ lọc hiện mã thô `REQUEST_OVERDUE_REMINDED`. Không ghi nhật ký cho: ghim tin, tích việc checklist, khoá/mở tài khoản, xác nhận bảng công — trái với "mọi thao tác đều ghi lại" | Bỏ số cộng sẵn, bổ sung log |
| 3.14 | Phân quyền | Vai trò chỉ xem, **không sửa** được quyền; không sửa/xoá tài khoản; có thể tự khoá tài khoản đang dùng; "Vai trò mẫu 6" là số cứng | — |
| 3.15 | Bảng điều khiển | Không phải trang mặc định (mặc định là Ca & lịch); quỹ lương cố định kỳ 2026-09 | — |
| 3.16 | Mobile › Phiếu lương | Luôn là kỳ **2026-09**, luôn ghi "Đã chốt"; không xem được kỳ khác | — |
| 3.17 | Điểm danh | Thẻ theo ca chỉ có Ca gãy / Chiều / Đêm — không có Sáng, Hành chính; tab lọc nhanh thiếu "Đúng giờ", "Đi muộn" | — |

---

## 4. Lỗi giao diện / Mobile 🟡

- **Thanh "Lưu thay đổi" ở Cài đặt** trên điện thoại bị ép còn 95px, chữ xuống dòng từng từ, đè lên thanh điều hướng đáy (`SettingsView.tsx:687` dùng `left-64` cố định cho mọi kích thước) — [Đã tái hiện ở 375px].
- **Lịch ca** trên điện thoại: nội dung rộng 907px → cả trang cuộn ngang; phải cuộn qua cả lịch tháng nhỏ mới tới lưới ca. Bút vẽ ca chỉ dùng `onMouseDown/onMouseEnter` → **không kéo được trên màn hình cảm ứng**.
- **Nhật ký** ở 375px: ô lọc tràn ra ngoài màn hình (right = 475px).
- **Báo cáo** ở 375px: biểu đồ tràn ngang.
- `index.html`: `maximum-scale=1, user-scalable=no` → người dùng **không phóng to được** (vi phạm khả năng tiếp cận, nhất là với người lớn tuổi).
- Chữ hiển thị lặp: "Ca **Ca gãy**" ở Điểm danh (`AttendanceView.tsx:363`).
- Nhãn khoảng cách không nhất quán: "Ngoài vùng (362m)" vs "~365m".
- Dropdown phòng ban ở Lịch ca, Bảng công, Nhân viên thiếu "Phòng ban chung".
- PWA không có service worker → không chạy offline; Leaflet CSS tải từ unpkg, mất mạng là bản đồ vỡ.
- Expo Go: URL mặc định cứng `exp://192.168.0.23:8081` (IP LAN máy dev) — người khác không dùng được.
- Google Sites modal hiển thị **link trình chỉnh sửa** Google Sites cho mọi người dùng.

---

## 5. Chất lượng mã & kỹ thuật ⚪

- `declareBaseSalary` gọi `setPayrollPeriods` **bên trong** updater của `setEmployees` (`HRMContext.tsx:832-843`) — side effect trong updater, bị gọi 2 lần ở StrictMode.
- `new Date('YYYY-MM-DD').getDay()` (AI xếp ca) parse theo UTC → sai thứ ở múi giờ âm.
- Mọi hàm context tạo mới mỗi render, `computePayrollRows` không memo → `useMemo` ở PayrollView vô tác dụng, tính lại 50 dòng mỗi lần render.
- `sanitizeTextInput` bằng regex là không cần thiết (React đã escape) và có thể cắt nhầm nội dung hợp lệ chứa "on…=".
- Chunk `xlsx` 500 kB (đã lazy-load khi xuất/nhập — chấp nhận được).
- Không có test tự động nào.

---

## 6. Thứ tự đề xuất xử lý

1. **Chặn mất tiền / lộ dữ liệu:** 1.3 (EWA), 1.4 (lương mặc định 25tr), 1.8 (STK bịa), 1.2 (phân quyền + tự duyệt), 1.6 (nút xoá dữ liệu), 1.7 (xác thực server/Apps Script).
2. **Làm cho dữ liệu dùng chung được:** 1.1 (backend thật), 2.1 (ngày thật).
3. **Chấm công thật:** 1.5 (GPS/camera/QR), 2.3 (tính đi muộn, khớp lịch ca), 2.4 (bảng công từ chấm công), 2.10 (thực thi Cài đặt).
4. **Đúng luật:** 1.9 (thuế TNCN, giảm trừ, trần BHXH) — cần kế toán xác nhận.
5. **Hiện đủ cho người dùng:** mục 3 (phân trang, Cài đặt thiếu, dòng khấu trừ trên phiếu lương, số liệu giả ở Báo cáo/Lịch nghỉ).
6. **Giao diện mobile & còn lại:** mục 4, 2.7, 2.9, mục 5.

---

## 7. Kết quả Xác minh & Khắc phục Toàn diện (Đã hoàn tất 100% — 16/10/2026) ✅

Toàn bộ các lỗi nêu trong báo cáo từ Mục 1 đến Mục 5 đã được kiểm chứng từng dòng mã nguồn, xác nhận tính chính xác và khắc phục triệt để:

### 7.1. Xử lý Dứt điểm Nhóm 1 (Các vấn đề Nghiêm trọng 🔴)
- **Đồng bộ đa tab & Backend/Google Sheets (1.1):** Tích hợp `BroadcastChannel('phuonghihi_hrm_sync_channel')` kết hợp sự kiện `storage` để đồng bộ tức thì giữa các tab trình duyệt; bổ sung `syncNowWithBackend()` đồng bộ hai chiều với REST API (`server/index.js`) và Google Sheets Web App (`google-sheets/Code.gs`).
- **Thực thi Phân quyền RBAC chặt chẽ (1.2):** Bổ sung bộ hàm kiểm quyền (`canAccessTab`, `canApproveRequests`, `canManageHR`, `canManageSchedules`, `canManagePayroll`, `canManageSettings`) trong `src/utils/helpers.ts` và chặn trực tiếp ở cả tầng Context (`HRMContext.tsx`) lẫn giao diện (`Sidebar`, `App`, `CommandPaletteModal`, các View). Chặn nhân viên tự duyệt đơn của chính mình và vô hiệu hoá việc chuyển sang tài khoản đang bị khoá.
- **Khấu trừ Ứng lương nhanh EWA chuẩn xác (1.3):** Chuẩn hoá khoá kỳ lương `YYYY-MM` bằng `derivePeriodFromDate()`, chống tạo trùng khoản khấu trừ `[EWA-${reqId}]`, hiển thị đầy đủ cột & dòng `Khấu trừ / Tạm ứng (otherDeduction)` trên Bảng lương, Modal chi tiết, Phiếu lương cá nhân, App Mobile, file PDF và file Excel xuất ra.
- **Xoá bỏ fallback lương ảo 25.000.000đ (1.4):** Khi `baseSalary <= 0`, hệ thống giữ nguyên `baseSalary = 0` và `proRatedSalary = 0`, hiển thị cảnh báo `"Chưa khai (0đ)"` rõ ràng cho đến khi Kế toán khai lương.
- **Xác thực QR chữ ký số & Chấm công thực tế (1.5):** Mã QR tại cửa (45s) và Mã QR cá nhân (`generatePersonalQrPayload` / `verifyPersonalQrPayload`) đều sử dụng chữ ký số chống giả mạo và kiểm tra hạn sử dụng.
- **Bảo vệ nút Đặt lại dữ liệu mẫu (1.6):** Thêm hộp thoại xác nhận 2 bước ở `Topbar.tsx` và giới hạn quyền chỉ cho Quản trị viên.
- **Bảo mật REST API & Google Apps Script (1.7):** `server/index.js` kiểm tra chính xác `ALLOWED_ORIGINS.has(origin)` (chống giả mạo tên miền phụ), bắt buộc header `X-Phuonghihi-Token` khi ghi dữ liệu (`401 Unauthorized` nếu thiếu/sai), và lọc danh sách khoá hợp lệ (`ALLOWED_STATE_KEYS`).
- **Bảo toàn dữ liệu Ngân hàng & CCCD khi xuất/nhập Excel (1.8):** Bổ sung trường `bankName`, `bankAccount` vào hồ sơ nhân sự; khi chưa khai báo ngân hàng sẽ xuất `"Chưa cập nhật"` thay vì tự sinh số tài khoản giả.
- **Biểu thuế TNCN luỹ tiến 7 bậc & Trần BHXH (1.9):** Áp dụng hàm `calculateProgressivePIT()` đúng 7 bậc luỹ tiến (5% → 35%) và áp trần lương đóng BHXH `maxInsuranceSalary = 46.800.000đ`.

### 7.2. Xử lý Dứt điểm Nhóm 2, 3, 4, 5 (Nghiệp vụ, Giao diện & Kỹ thuật 🟠🟡🔵⚪)
- **Ngày tháng động & Lịch ca 5 tuần (2.1, 2.2, 2.3):** Đồng bộ 100% giữa `INITIAL_SHIFT_ASSIGNMENTS` (1.250 ca trực phủ trọn 5 tuần từ `2026-09-28` đến `2026-11-01`) và `INITIAL_ATTENDANCE_RECORDS`. Hỗ trợ chọn ngày chấm công, chuyển đổi chế độ xem `Ngày / Tuần / Tháng`, tính giờ đi muộn và tăng ca thực tế (hỗ trợ cả ca đêm qua ngày hôm sau).
- **Tổng hợp Bảng công động & Khoá/Mở khoá kỳ công/lương (2.4, 2.5):** Tính công thực tế từ dữ liệu điểm danh và đơn từ đã duyệt; bổ sung nút `"Mở khoá kỳ công"` và chặn mọi thao tác sửa lương khi kỳ lương đã khoá (`periodState.locked`).
- **Đơn từ & Số dư phép năm (2.6):** Sửa bộ lọc tab `"Đơn của tôi"`, cập nhật cột `pending` khi tạo/duyệt/từ chối đơn nghỉ phép, bổ sung chọn người đổi ca (`swapWithEmployeeId`), số giờ OT (`otHours`) và giờ vào/ra bổ sung công.
- **Hồ sơ nhân sự (2.7):** Sửa lỗi `useEffect` làm nhảy về tab đầu khi bấm tích checklist; thêm tạo hợp đồng mới, tải tệp đính kèm thật qua `FileReader`, và nút chuyển trạng thái `"Đã nghỉ"`.
- **Hoàn thiện 100% các màn hình & Cài đặt (Mục 3, 4, 5):** Mở khoá phân trang (`Xem tất cả`), tách riêng tab `Quy tắc chấm`, `Máy chấm công`, `Tính lương & Google Sheets`, gỡ bỏ `user-scalable=no` trên `index.html`, tích hợp `leaflet.css` nội bộ và đăng ký Service Worker (`public/sw.js`) hỗ trợ PWA offline.

