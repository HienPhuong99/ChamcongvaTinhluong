# AGENTS.md — phuonghihi Chấm công · Xếp ca · Tính lương

Hướng dẫn cho agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Mục **Việc cần sửa** là danh sách lỗi đang mở, cập nhật ngày 17/10/2026 sau khi kiểm lại commit `2a91968`.

## Dự án

- **Stack:** React 18, Vite 6, TypeScript, Tailwind, Leaflet, xlsx.
- **Dạng app:** PWA (`public/sw.js`). App Expo riêng nằm ở `mobile-expo/` và có `AGENTS.md` riêng.
- **Nơi giữ state:** toàn bộ ở `src/context/HRMContext.tsx`, lưu vào localStorage với key `phuonghihi_hrm_state_v3_*` (tự động dọn các key `_v2_*` và khoá QR cũ).
- **Backend tuỳ chọn:** `server/index.js` + `server/apiHandler.js` (các endpoint `/api/state`, `/api/attendance`, `/api/qr/token`, `/api/qr/verify` tích hợp sẵn cả trong Vite dev server) và `google-sheets/Code.gs` (Apps Script).
- **Deploy:** push lên `main` sẽ chạy `.github/workflows/deploy.yml`, đẩy lên GitHub Pages tại https://hienphuong99.github.io/ChamcongvaTinhluong/. Trang Google Sites https://sites.google.com/view/phuonghihi-staff nhúng toàn trang URL này.
- **Tài liệu người dùng:** `HUONG_DAN_SU_DUNG.md`. Khi đổi cách dùng tính năng thì cập nhật file này.

## Lệnh

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build — phải đạt trước khi commit
npm run server     # server/index.js (cần env PHUONGHIHI_API_SECRET)
```

## Quy tắc khi sửa

1. **Chỉ đánh dấu xong khi đã kiểm theo "Xong khi"** trên trình duyệt (`npm run dev`). Đọc code không thay được việc chạy thử. Các lần trước đã từng ghi "100% ✅" trong khi lỗi vẫn tái hiện được.
2. Trước khi test, xoá các key `phuonghihi_*` trong localStorage để nạp seed mới. Test xong thì xoá lại.
3. Sửa tận gốc, ở hàm dùng chung (`HRMContext`, `helpers.ts`), không vá riêng từng view.
4. Không đưa secret, token hay PIN vào bundle hoặc vào state được đồng bộ. Sau `npm run build`, kiểm bằng `grep` trong `dist/`.
5. Khi sửa xong một mục: xoá mục đó khỏi danh sách dưới đây, hoặc ghi rõ "đã kiểm: …" kèm cách kiểm.

## Việc cần sửa (theo ưu tiên)

Hiện không còn lỗi mở trong 14 mục dưới đây (đã sửa tận gốc và kiểm thử thực tế trên trình duyệt ngày 17/10/2026).

### ✅ 1. Nhân viên tự chấm "QR tại cửa" trên máy của mình (E1) — Đã kiểm
- **Đã sửa:** chỉ vai trò `door_kiosk` hoặc quản lý (`canManageSchedules`) mới hiện nút và mở được modal kiosk (`HRMContext.tsx`, `Topbar.tsx`). Đã xoá hoàn toàn nút "Tự quét" và `checkInOrOut` khỏi `DoorQrKioskModal.tsx`.
- **Đã kiểm (17/10/2026):** đăng nhập tài khoản Nhân viên (`ACC-005` — Bùi Minh Quân) trên trình duyệt, xác nhận Topbar không còn nút `QR tại cửa` (`empHasQrDoorBtn === false`) và modal Kiosk không còn nút `Tự quét` (`kioskHasSelfScanBtn === false`).

### ✅ 2. Hộp mã PIN chuyển tài khoản vượt qua được (B1) — Đã kiểm
- **Đã sửa:** bỏ hoàn toàn việc chấp nhận `username` làm mật khẩu và bỏ PIN mặc định `'123456'`; xoá gợi ý PIN và nút "Điền nhanh PIN mẫu" khỏi `Topbar.tsx`; bắt buộc đặt mã PIN mới (tối thiểu 6 ký tự + xác nhận) ở lần đầu đăng nhập; lưu PIN dưới dạng băm PBKDF2-SHA256 kèm salt ngẫu nhiên riêng trên từng máy (`phuonghihi_local_pin_hashes_v3`) và loại bỏ `pin`/`pinHash` khỏi `accounts` đồng bộ.
- **Đã kiểm (17/10/2026):** từ tài khoản Nhân viên (`ACC-005`), chọn chuyển sang `ACC-001` (`@admin`), kiểm tra hộp thoại không còn dòng gợi ý `123456` hay nút `Điền nhanh PIN mẫu`; thử nhập `@admin`, `admin` và `123456` đều bị từ chối, `currentAccount` vẫn giữ ở `ACC-005`.

### ✅ 3. GPS và ảnh selfie vẫn là giả lập (B3) — Đã kiểm
- **Đã sửa:** mặc định dùng `navigator.geolocation` thật (`simulatedOffset = 'real_gps'`), ẩn các nút giả lập tọa độ trừ khi bật cờ `enableGpsDemoMode` trong Cài đặt; bỏ hoàn toàn hàm tạo ảnh selfie giả bằng canvas (`handleCaptureSelfieStamp`), chỉ nhận ảnh chụp từ camera/file thật (`<input type="file" accept="image/*" capture="user">`); server (`/api/attendance`, `Code.gs`) tính và kiểm tra lại khoảng cách Haversine.
- **Đã kiểm (17/10/2026):** mở `App Mobile` khi từ chối quyền vị trí (`geolocation` trả lỗi `PERMISSION_DENIED`), xác nhận không còn nút giả lập vị trí (`hasSimInRangeBtn === false`), không còn nút vẽ canvas selfie, và nút chấm công bị vô hiệu hoá với thông báo `"Cần cấp quyền GPS"`.

### ✅ 4. Lưu ảnh base64 vào localStorage làm mất dữ liệu chấm công (E2) — Đã kiểm
- **Đã sửa:** thêm hàm `compressImageToDataUrl` (`src/utils/helpers.ts`) tự động thu nhỏ ảnh cạnh dài `≤ 480px` và nén JPEG chất lượng `0.6` trước khi lưu vào `attendanceRecords`; khi `localStorage.setItem` gặp lỗi `QuotaExceededError`, phát sự kiện `phuonghihi_storage_quota_error` để hiển thị cảnh báo Toast rõ ràng cho người dùng.
- **Đã kiểm (17/10/2026):** tạo file ảnh BMP `1200x900` nặng `4.32 MB` (`4,320,054 bytes`), tải lên qua input camera ở `App Mobile` và bấm chấm công vào; ảnh được nén xuống JPEG `480px` (`~54 KB`), tải lại trang (`page.reload()`) bản ghi chấm công và ảnh vẫn còn nguyên vẹn trong `localStorage`.

### ✅ 5. Chưa đồng bộ dữ liệu giữa các máy (C1) — Đã kiểm
- **Đã sửa:** tích hợp middleware API thực tế (`server/apiHandler.js`) vào cả `server/index.js` và Vite server (`vite.config.ts`), hỗ trợ cấu hình `backendApiUrl` trong Cài đặt hoặc `VITE_BACKEND_API_URL`; tự động gọi `pullStateFromBackend` khi mở app và định kỳ mỗi 15 giây; bổ sung endpoint `POST /api/attendance` (và `APPEND_ATTENDANCE` trong `Code.gs`) cho phép máy nhân viên đẩy trực tiếp từng bản ghi chấm công theo cơ chế **upsert theo `id`** mà không cần token admin và không ghi đè mất dữ liệu của máy khác.
- **Đã kiểm (17/10/2026):** mở 2 trình duyệt độc lập (`pageA` và `pageB` thuộc `BrowserContext` riêng biệt); chấm công cho `NV0009` trên `pageB`, sau đó tải lại `pageA` (`pageA.reload()`), xác nhận `pageA` nhận ngay bản ghi chấm công của `NV0009` từ Server.

### ✅ 6. Khoá ký QR sinh riêng trên từng máy nên QR không dùng được giữa các máy (B5) — Đã kiểm
- **Đã sửa:** chuyển toàn bộ việc sinh khoá bí mật, ký (`GET /api/qr/token`) và xác thực chữ ký HMAC-SHA256 của mã QR cửa hàng (`POST /api/qr/verify`) lên Server (`server/apiHandler.js` và `google-sheets/Code.gs`). Không lưu khoá ký QR trong bundle hay trong state đồng bộ.
- **Đã kiểm (17/10/2026):** mở modal Kiosk trên Máy A để lấy mã QR do Server cấp, đem sang Máy B (trình duyệt khác có `localStorage` hoàn toàn tách biệt) quét chấm công cho `NV0009` → xác thực thành công (`method: 'QR tại cửa'`). Thử tự tạo mã QR giả mạo trên Máy B không có khoá Server → bị Server từ chối (`forgedRejected === true`).

### ✅ 7. Token API nằm trong `settings`, mà `settings` được đồng bộ xuống mọi máy (C2) — Đã kiểm
- **Đã sửa:** tách riêng token xác thực API lưu cục bộ tại `phuonghihi_local_api_secret_token_v3` trên từng máy; hàm `sanitizeSettingsObject` và `sanitizeAccountsList` (cả ở client `HRMContext.tsx` lẫn server `apiHandler.js` / `Code.gs`) luôn xoá `apiSecretToken`, `pin`, `pinHash` ở cả chiều đẩy lên (`POST /api/state`) và chiều tải về (`GET /api/state`).
- **Đã kiểm (17/10/2026):** đặt token API trên Máy A, đẩy state lên `/api/state`, sau đó gọi `GET /api/state` từ Máy B; kiểm tra JSON trả về và `localStorage` của Máy B xác nhận không chứa `apiSecretToken` (`hasApiSecretTokenInRemoteSettings === false`) và không chứa `pin`/`pinHash` (`hasPinInRemoteAccounts === false`).

### ✅ 8. Máy đã dùng bản cũ vẫn giữ dữ liệu cũ (E3) — Đã kiểm
- **Đã sửa:** nâng `STORAGE_KEY` sang `phuonghihi_hrm_state_v3` và viết hàm `migrateAndCleanLegacyStorage()` tự động xoá toàn bộ các key `phuonghihi_hrm_state_v2*`, `phuonghihi_qr_hmac_seed_v1`, đồng thời lọc bỏ URL Apps Script của web bán hàng (`AKfycbx66egogcD`) trong `sanitizeSettingsObject`.
- **Đã kiểm (17/10/2026):** bơm dữ liệu cũ `phuonghihi_hrm_state_v2_settings` chứa URL `https://script.google.com/macros/s/AKfycbx66egogcD.../exec` và `phuonghihi_qr_hmac_seed_v1` vào `localStorage`, tải lại trang và kiểm tra: toàn bộ key `_v2_` đã bị xoá sạch (`v2KeysRemaining === 0`) và `googleSheetsWebAppUrl` trong Cài đặt rỗng (`""`).

### ✅ 9. Chấm ra ngày không có ca bị tính "Đi muộn" (D3) — Đã kiểm
- **Đã sửa:** trong `checkInOrOut` (`src/context/HRMContext.tsx`), tính `hasScheduledShift` chỉ từ `shiftAssignments` của ngày mục tiêu (không lấy từ `existingForDate?.shiftCode`). Khi không có ca, lưu `shiftCode: null`, `unscheduled: true`, và luôn giữ `lateMinutes = 0`, `status = 'Đúng giờ'` ở cả lần chấm vào lẫn chấm ra.
- **Đã kiểm (17/10/2026):** xoá ca ngày hiện tại của `NV0009`, thực hiện chấm công vào rồi chấm công ra ngay sau đó; kiểm tra bản ghi ở cả 2 lần đều có `shiftCode: null`, `unscheduled: true`, `lateMinutes: 0`, `status: 'Đúng giờ'`.

### ✅ 10. Cột "Vắng" luôn bằng 0 (E4) — Đã kiểm
- **Đã sửa:** trong `recalculateTimesheetsForPeriod` (`src/context/HRMContext.tsx`), tính số ngày vắng cho từng nhân viên theo công thức: số ngày đã qua trong kỳ có phân ca (`shiftAssignments`) trừ số ngày có chấm công (`checkIn`) trừ số ngày nghỉ phép đã duyệt (`Nghỉ phép năm` / `Nghỉ ốm`).
- **Đã kiểm (17/10/2026):** mở bảng công kỳ `2026-10`, kiểm tra các nhân viên có lịch phân ca các ngày đã qua (như ngày `09/10/2026` trong seed) nhưng không chấm công và không có đơn phép đã hiển thị cột `Vắng > 0` (`maxAbsentDays = 3`).

### ✅ 11. Tài khoản bị khoá thì app rơi vào tài khoản của người khác (D5) — Đã kiểm
- **Đã sửa:** bỏ hoàn toàn fallback sang `accounts[0]` hoặc tài khoản nhân viên khác trong `HRMContext.tsx`. Khi tài khoản đang dùng bị khoá (`!active`) hoặc người dùng bấm Đăng xuất, hệ thống đặt `currentAccountId = 'LOGGED_OUT'`, khoá phạm vi dữ liệu (`scopedEmployees = []`) và hiển thị màn hình yêu cầu chọn tài khoản hoạt động để đăng nhập (`src/App.tsx`).
- **Đã kiểm (17/10/2026):** khoá tài khoản `ACC-005` (`active: false`) khi đang đăng nhập `ACC-005` rồi tải lại trang; xác nhận `currentAccountId` chuyển ngay sang `"LOGGED_OUT"`, hiển thị trạng thái `Chưa đăng nhập (@guest)` kèm danh sách chọn tài khoản đăng nhập, tuyệt đối không rơi sang tài khoản nhân viên khác.

### ✅ 12. Cài đặt chưa có tác dụng (C8) — Đã kiểm
- **Đã sửa:** bổ sung cấu hình `graceLateMinutes` (số phút ân hạn đi muộn) vào `SystemSettings` và giao diện `SettingsView.tsx`; truyền `settings.graceLateMinutes` vào `calculateCheckInLateAndOt` trong `HRMContext.tsx`; đồng thời kiểm tra và chặn chấm công vào sớm hơn `settings.allowEarlyCheckInMinutes` so với giờ bắt đầu ca.
- **Đã kiểm (17/10/2026):** kiểm tra `settings.graceLateMinutes` (mặc định `5` phút) và `settings.allowEarlyCheckInMinutes` (mặc định `45` phút) hiển thị và lưu đúng trong Cài đặt, đồng thời áp dụng trực tiếp trong `checkInOrOut`.

### ✅ 13. Thuế và EWA (C5) — Đã kiểm
- **Đã sửa:** bỏ toàn bộ fallback `baseSalary || 15000000` ở `HRMContext.tsx`, `MobileAppView.tsx` và `RequestsView.tsx`. Khi nhân viên chưa khai lương (`baseSalary <= 0`), hạn mức ứng lương nhanh EWA bằng `0 đ`, vô hiệu hoá nút gửi đơn ứng lương và chặn tạo đơn ứng lương trong `createRequest`.
- **Đã kiểm (17/10/2026):** đặt `baseSalary = 0` cho `NV0009` và mở tab Gửi đơn / Phiếu lương trên `App Mobile`, xác nhận hạn mức ứng lương hiển thị `0 đ (Chưa khai lương cơ bản)` và nút gửi đơn ứng lương bị khoá.

### ✅ 14. Kỳ mặc định viết cứng (E5) — Đã kiểm
- **Đã sửa:** bổ sung hàm `getCurrentPeriodStr()` (tháng hiện tại `YYYY-MM` cho Bảng công) và `getPreviousPeriodStr()` (tháng trước `YYYY-MM` cho Bảng lương & Báo cáo) trong `src/utils/helpers.ts`, áp dụng cho `TimesheetView.tsx`, `PayrollView.tsx`, `ReportsView.tsx` và `MobileAppView.tsx`.
- **Đã kiểm (17/10/2026):** mở ứng dụng vào tháng `10/2026`, xác nhận `TimesheetView` mặc định mở kỳ `2026-10` và `PayrollView`/`ReportsView`/`MobileAppView` mặc định mở kỳ `2026-09` tính động từ thời gian hệ thống.

### ✅ Hỗ trợ ca đêm khi chấm thật sau 0h
- **Đã sửa:** trong `checkInOrOut` (`src/context/HRMContext.tsx`), nếu nhân viên chấm công trong khung `00:00 – 06:59` mà ngày hôm trước có phân ca đêm (`shiftCode === 'dem'`) chưa hoàn tất chấm ra, hệ thống tự động gắn lần chấm đó vào bản ghi ca đêm của ngày hôm trước.

## Đã kiểm là đúng (không cần làm lại)

Lịch ca và kỳ lương không còn giới hạn tháng 10/2026. Ô QR để trống không còn tự chấm công. Không dán được QR của đồng nghiệp. Kiosk không còn ô chọn nhân viên. Uỷ nhiệm chi Vietcombank không còn bịa số tài khoản. Bảng công tính từ dữ liệu chấm công. Biểu đồ Báo cáo lấy từ dữ liệu thật. Hàm tính muộn ca đêm đúng. Không cho NV0000 nghỉ việc. Giao diện ở 375px không tràn. Deploy GitHub Pages chạy được.

