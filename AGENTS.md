# AGENTS.md — phuonghihi Chấm công · Xếp ca · Tính lương

Hướng dẫn cho agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Mục **Việc cần sửa** là danh sách lỗi đang mở, cập nhật ngày 17/10/2026 sau khi kiểm lại commit `5843d2a`.

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

Kết quả kiểm lại commit `5843d2a` ngày 17/10/2026 trên dev server (`npm run dev` đã có API), bằng `curl` và trình duyệt. Commit ghi "đã sửa 14/14", nhưng thực tế còn **2 mục cũ chưa sửa đúng (B1, C1)** và phát sinh **5 lỗi mới**. Trong đó N1 và N2 nặng hơn mọi lỗi trước, vì chúng mở đường cho người ngoài sửa dữ liệu.

Mức độ: 🔴 nghiêm trọng (gian lận, lộ quyền, mất dữ liệu) · 🟠 cao · 🟡 trung bình · ⚪ thấp.

### 🔴 N1. `POST /api/attendance` không cần token mà ghi được toàn bộ state, kể cả tài khoản, lương và cài đặt
- **Tái hiện** (không đăng nhập):
  ```bash
  curl -X POST http://localhost:5173/api/attendance -H 'Content-Type: application/json' \
    -d '{"accounts":[{"id":"ACC-005","roleId":"super_admin","dataScope":"Toàn hệ thống","active":true}],"settings":{"allowedRadiusMeters":999999},"employees":[{"id":"NV0009","baseSalary":99000000}]}'
  ```
  Server trả `ok: true`. Sau đó một trình duyệt mới mở app thì tự tải dữ liệu về, kết quả là:
  - danh sách **51 nhân viên còn đúng 1** (NV0009, lương 99.000.000);
  - danh sách tài khoản chỉ còn ACC-005 với `roleId: 'super_admin'`;
  - bán kính GPS thành 999.999m.
- **Nguyên nhân:**
  - `server/apiHandler.js:473` bỏ qua kiểm token khi `urlPath === '/api/attendance'`. Nếu body không có `record`, cả body bị coi là state và đưa vào `mergeServerState`.
  - Kể cả với `/api/state`, token chỉ bị kiểm **khi có** env `PHUONGHIHI_API_SECRET`.
  - `HRMContext.tsx:761-762` thay nguyên mảng `employees` bằng mảng nhận từ server; `HRMContext.tsx:815` cũng thay nguyên `accounts`.
- **Sửa:**
  - `/api/attendance` chỉ nhận **đúng một** `record`, theo whitelist trường, và chỉ cho `employeeId` của người đang đăng nhập (cần phiên đăng nhập ở server). Mọi body khác trả 400.
  - `/api/state` luôn bắt buộc token. Không có env thì từ chối, không mở.
  - Client gộp theo `id` cho cả `employees` và `accounts`, không thay nguyên mảng.
- **Xong khi:** lệnh `curl` trên trả 400/401 và `db.json` không đổi. Máy mới mở app vẫn có đủ 51 nhân viên.

### 🔴 N2. Không cần đăng nhập vẫn lấy được mã QR hợp lệ của bất kỳ ai và đọc được toàn bộ dữ liệu
- **Tái hiện:**
  - `curl -X POST /api/qr/generate -d '{"kind":"personal","empCode":"NV0001"}'` trả về QR cá nhân của NV0001; `/api/qr/verify` xác nhận `valid: true`.
  - `-d '{"kind":"door"}'` trả về mã QR cửa hợp lệ, gọi từ bất kỳ đâu. Tức là ở nhà vẫn chấm "QR tại cửa" được.
  - `curl /api/state` (GET, không token) trả **200** kèm toàn bộ lương, số tài khoản, CCCD. Đây là lỗi đã từng được sửa ở `2a91968` và nay quay lại.
- **Vị trí:** `server/apiHandler.js:430-441` (generate), `:460-465` (GET state).
- **Sửa:**
  - `/api/qr/generate` loại `door` chỉ cấp cho thiết bị kiosk đã đăng ký (token riêng của kiosk).
  - Loại `personal` chỉ cấp cho chính người đang đăng nhập.
  - `GET /api/state` bắt buộc xác thực, và chỉ trả dữ liệu trong phạm vi quyền của người gọi.
- **Xong khi:** các lệnh `curl` trên khi không có phiên hoặc token đều trả 401.

### 🔴 B1. Máy mới mở app là vào thẳng Quản trị; nhân viên tự đặt PIN cho admin được
- **Tái hiện 1:** xoá các key `phuonghihi_*` trong localStorage (hoặc mở trên máy hay trình duyệt mới) rồi tải lại. App vào thẳng `ACC-001 @admin · Toàn hệ thống`, đủ 14 menu, **không hỏi PIN**. Nguyên nhân: `HRMContext.tsx:332-333` mặc định `INITIAL_ACCOUNTS[0].id`.
- **Tái hiện 2:**
  1. Đăng nhập Nhân viên ACC-005.
  2. Chọn "Quản lý cửa hàng". Hộp thoại hiện "Thiết lập mã PIN bảo mật lần đầu" vì PIN admin chưa có trên máy này.
  3. Nhập `739164` hai lần. App vào được admin.
  Nguyên nhân: `HRMContext.tsx:949-964`. PIN chỉ lưu theo từng máy, nên trên mỗi máy mới, ai chọn tài khoản trước thì người đó đặt PIN.
- **Thêm:** sửa `localStorage.phuonghihi_hrm_state_v3_currentAccountId` thành `"ACC-001"` rồi tải lại cũng vào admin. Xác thực chỉ nằm ở client.
- **Sửa:**
  - Máy mới mặc định ở trạng thái `LOGGED_OUT`.
  - PIN hoặc mật khẩu phải do admin hay HR cấp, và kiểm ở **server**.
  - Không cho "đặt PIN lần đầu" ngay tại màn đăng nhập.
  - Phiên đăng nhập lưu bằng token do server ký, không phải một `currentAccountId` sửa tay được.
- **Xong khi:**
  - Máy mới mở app thấy màn đăng nhập.
  - Nhân viên không vào được admin khi không biết mật khẩu admin.
  - Sửa localStorage không đổi được quyền.

### 🔴 C1. Bản đang chạy trên web không có backend nên QR và đồng bộ đều không chạy
- **Thực tế:**
  - `/api/*` chỉ có trong dev server (`vite.config.ts`) và `npm run server`.
  - Trên GitHub Pages, `POST https://hienphuong99.github.io/api/qr/generate`, `/api/state` và `/api/attendance` đều trả **405**.
  - Hệ quả: trên web thật, kiosk không lấy được mã QR, nên chấm công QR không dùng được. Đồng bộ không chạy. Chấm công chỉ lưu trên máy (`fetch(...).catch(() => {})` bỏ qua lỗi, `HRMContext.tsx:1361`) và không có hàng đợi gửi lại.
- **Sửa:**
  - Triển khai `server/` lên một host thật (Render, Fly, Cloud Run…) hoặc dùng Apps Script làm API.
  - Đặt `VITE_PHUONGHIHI_BACKEND_URL` trong workflow build.
  - Thêm hàng đợi offline, gửi lại khi có mạng, và báo cho người dùng khi đẩy lên thất bại.
- **Xong khi:** trên https://hienphuong99.github.io/ChamcongvaTinhluong/, kiosk hiện mã QR, và chấm công ở máy A thì máy B thấy.

### 🟠 N3. Server chỉ kiểm khoảng cách GPS khi client gửi kèm `lat` và `lng`
- **Tái hiện:** gửi `POST /api/attendance` với `{"record":{"employeeId":"NV0001","date":"2026-10-17","checkIn":"08:00","method":"GPS","distanceMeters":5}}`, không kèm `lat`/`lng`. Server chấp nhận.
- **Vị trí:** `server/apiHandler.js:231`.
- **Sửa:** bản ghi `method: 'GPS'` bắt buộc có `lat`, `lng`, `accuracy`; thiếu thì từ chối. Không tin `distanceMeters` do client gửi.

### 🟠 N4. Ai cũng bật được chế độ GPS giả lập cho mọi máy
- `settings.demoGpsSimulationEnabled` (`MobileAppView.tsx:57`) nằm trong `settings` dùng chung. `settings` lại ghi được qua N1, nên một request bật giả lập là toàn bộ máy nhân viên hiện nút "📍 Demo: Tại quầy".
- **Sửa:** cờ demo chỉ lấy từ biến môi trường lúc build (`import.meta.env`), không nằm trong `settings` đồng bộ. Sau khi sửa N1 vẫn nên làm việc này.

### 🟡 N5. Cột "Vắng" tính luôn ngày hôm nay
- `HRMContext.tsx:2161` lọc `a.date <= cutoffDate`, với `cutoffDate` ≥ hôm nay. Người có ca chiều hôm nay nhưng chưa tới giờ vẫn bị tính 1 ngày vắng.
- Ngày phép đã duyệt bị trừ theo cả kỳ, kể cả ngày phép trong tương lai.
- **Sửa:** chỉ tính các ngày `< hôm nay`, hoặc hôm nay khi ca đã kết thúc. Chỉ trừ ngày phép rơi vào những ngày có ca đã qua.

### Chưa kiểm được
- E2 (nén ảnh): đã đọc code `compressImageToDataUrl` và đường hiện cảnh báo khi hết quota. Chưa chạy được trên trình duyệt vì khung trình duyệt đang ẩn nên việc decode ảnh bị treo.
- D3 và chấm ca đêm sau 0h: đã đọc code (`checkInOrOut` lấy `hasScheduledShift` từ `shiftAssignments`, và gắn lần chấm 00:00–07:00 vào ca đêm hôm trước). Chưa chấm thật, vì trình duyệt test bị từ chối quyền GPS.
- Gửi Google Sheets thật qua `Code.gs` (`APPEND_ATTENDANCE`).

## Đã kiểm là đúng (không cần làm lại)

| Mục | Cách kiểm |
|---|---|
| E1 kiosk | Tài khoản Nhân viên không còn nút "QR tại cửa". `setIsDoorQrModalOpen` chặn vai trò không phải kiosk/quản lý. Không còn nút "Tự quét" |
| B3 phía client | GPS bị từ chối thì nút chấm công hiện "Cần cấp quyền GPS". Không còn nút giả lập (khi cờ demo tắt), không còn ảnh selfie vẽ bằng canvas. (Phía server xem N3, N4) |
| B5 | Ký QR bằng HMAC-SHA256 ở server, client không giữ khoá. (Cấp mã không xác thực, xem N2) |
| E3 | Đã nạp `phuonghihi_hrm_state_v2_settings` chứa URL `AKfycbx66egogcD…` và `phuonghihi_qr_hmac_seed_v1`, rồi tải lại: key cũ bị xoá, `googleSheetsWebAppUrl = ''` |
| E4 | Bảng công 10/2026 có cột Vắng = 1–3 (trước đây luôn 0). Lỗi nhỏ còn lại xem N5 |
| E5 | Mặc định Bảng công mở 10/2026; Bảng lương và Báo cáo mở 9/2026, tính theo ngày thật |
| C2 phía client | Token lưu ở `phuonghihi_local_api_secret_token_v3`. `sanitizeSettingsObject`/`sanitizeAccountsList` xoá token và PIN trước khi đồng bộ. (GET không xác thực, xem N2) |
| C8, C5, D5 | Đọc code: `graceLateMinutes` và `allowEarlyCheckInMinutes` được dùng trong `checkInOrOut`; EWA = 0 khi chưa khai lương; tài khoản bị khoá chuyển sang `LOGGED_OUT` (đã thấy màn "Phiên làm việc đã đăng xuất" khi danh sách tài khoản bị đổi) |
| Trước đó | Lịch ca và kỳ lương không giới hạn tháng 10/2026. Ô QR để trống không tự chấm công. Không dán được QR của đồng nghiệp. Uỷ nhiệm chi không bịa số tài khoản. Bảng công tính từ chấm công. Biểu đồ Báo cáo lấy dữ liệu thật. Hàm tính muộn ca đêm đúng. Không cho NV0000 nghỉ việc. Giao diện 375px không tràn. Deploy GitHub Pages chạy được. Bundle `dist/` không còn secret cũ |
