# AGENTS.md — phuonghihi Chấm công · Xếp ca · Tính lương

Hướng dẫn cho agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Mục **Việc cần sửa** là danh sách lỗi đang mở, cập nhật ngày 17/10/2026 sau khi kiểm lại commit `7f4cc72`.

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

Kết quả kiểm lại commit `7f4cc72` ngày 17/10/2026. Đã kiểm bằng `curl` trên dev server (`npm run dev`), trên backend Apps Script thật (chỉ gọi khi **không đăng nhập**) và trên trình duyệt.

N1–N5, B1 và C1 đã sửa đúng (xem bảng cuối file). Còn **3 lỗi mới 🔴**, nằm ở API chấm công và mật khẩu mặc định.

Mức độ: 🔴 nghiêm trọng (gian lận, lộ quyền, mất dữ liệu) · 🟠 cao · 🟡 trung bình · ⚪ thấp.

### 🔴 M1. Server Node lưu mọi bản ghi chấm công thành `{}`
- **Tái hiện:**
  1. Đăng nhập ACC-005 qua `POST /api/auth/login`.
  2. Gửi `POST /api/attendance` với một `record` hợp lệ. Server trả `{"ok":true,…,"record":{}}`.
  3. Mở `server/db.json`, thấy `attendanceRecords: [{}]`. Gửi nhiều bản ghi thì tất cả dồn thành một `{}`, vì khoá gộp là `undefined__undefined`.
- **Nguyên nhân:**
  - `validateSingleAttendanceRecord` (`server/apiHandler.js:750`) gọi `stripSecretsAndSanitize(cleanRecord)` ở `depth = 0`.
  - Ở `depth 0`, hàm này chỉ giữ các khoá thuộc `ALLOWED_STATE_KEYS` (`employees`, `attendanceRecords`…), nên mọi trường của bản ghi bị xoá hết.
- **Hệ quả:** khi chạy bằng `npm run server` hoặc dev server, không lần chấm công nào được lưu lên server. Client nhận `ok: true`, nên tưởng đã gửi thành công và xoá khỏi hàng đợi offline.
- **Sửa:** sanitize từng trường của bản ghi (gọi ở `depth ≥ 1`, hoặc dùng một hàm riêng cho record). Thêm một test: gửi một record rồi đọc `db.json`, phải thấy đủ `employeeId`, `date`, `checkIn`.
- **Xong khi:** sau `POST /api/attendance`, `db.json` có đúng bản ghi với đủ trường. Hai ngày khác nhau tạo ra hai bản ghi.

### 🔴 M2. API chấm công tin mọi thứ client gửi: không kiểm QR, cho chấm lùi ngày, tự khai giờ và OT
- **Tái hiện** (đăng nhập Nhân viên ACC-005, server Node local). Cả 3 request đều trả **200**:
  - `{"record":{"employeeId":"NV0009","date":"2026-10-09","checkIn":"07:58","checkOut":"17:30","method":"QR tại cửa","status":"Đúng giờ","lateMinutes":0,"otHours":4}}`
    - Không có `qrToken`.
    - Ngày 09/10 là ngày đã vắng.
    - Tự khai 4 giờ OT.
  - `{"record":{…,"date":"2026-10-08","method":"Từ xa",…}}` được nhận, không kiểm `settings.remoteEnabled` hay `employee.allowRemote`.
  - Quản lý phòng Kinh doanh (ACC-004) gửi được bản ghi cho NV0001 (phòng Nhân sự), tức ngoài phạm vi quản lý.
  - (Hiện chưa lưu được chỉ vì lỗi M1. Sửa M1 xong là các bản ghi gian lận này sẽ được lưu.)
- **Vị trí:**
  - `server/apiHandler.js`: `validateSingleAttendanceRecord` có nhánh `method === 'QR tại cửa'` gán `distanceMeters = 5` mà không xác thực QR.
  - Handler `/api/attendance` nhận `qrToken` nhưng không dùng tới.
  - Chỉ chặn `employee` và `accountant` chấm hộ người khác, không chặn `manager` ngoài phòng ban.
  - `google-sheets/Code.gs` có cùng logic: `validateSingleAttendanceGas` ~dòng 648 và route `/api/attendance` ~dòng 943.
- **Sửa:**
  - `QR tại cửa`: bắt buộc có `qrToken` và xác thực ở server (`verifyServerQrToken` hoặc `verifyGasQrToken`), slot còn hạn, mỗi token chỉ dùng một lần cho mỗi nhân viên.
  - Giờ chấm (`checkIn`/`checkOut`) và `date` do **server** gán theo giờ server. Không nhận ngày khác hôm nay (với ca đêm thì cho phép hôm qua).
  - Server tự tính `lateMinutes`, `status`, `otHours` từ ca được phân. Bỏ các trường này khỏi whitelist đầu vào.
  - `Từ xa`: chỉ nhận khi `settings.remoteEnabled` bật và nhân viên có `allowRemote`.
  - `manager`: chỉ được gửi cho nhân viên cùng `department`.
  - Muốn sửa công thì đi qua đơn "Bổ sung công" để quản lý duyệt.
- **Xong khi:** cả 3 request trên trả 400/403. Chấm "QR tại cửa" chỉ thành công khi có mã QR thật lấy từ kiosk còn hạn.

### 🔴 M3. Mật khẩu khởi tạo của cả 6 tài khoản (kể cả admin) công khai trên repo public
- **Thực tế:**
  - `HUONG_DAN_SU_DUNG.md` mục 2.1 in rõ mật khẩu của cả 6 tài khoản, ví dụ `@admin` / `Admin@2026`.
  - Repo `HienPhuong99/ChamcongvaTinhluong` đang **PUBLIC**.
  - Đã kiểm ngoại tuyến (không đăng nhập vào hệ thống thật): hash cứng trong `google-sheets/Code.gs` (`DEFAULT_GAS_CREDENTIAL_HASHES`) và `server/apiHandler.js` (`DEFAULT_CREDENTIAL_HASHES`) **khớp đúng** các mật khẩu này.
  - Không có cơ chế bắt đổi mật khẩu ở lần đăng nhập đầu.
  - Vì vậy, nếu backend Apps Script đang chạy chưa đổi PIN, ai đọc repo cũng đăng nhập được admin trên web thật.
- **Sửa:**
  - **Ngay:** dùng `/api/auth/set-pin` (hoặc mục Phân quyền) đổi mật khẩu của cả 6 tài khoản trên backend thật.
  - Xoá bảng mật khẩu khỏi `HUONG_DAN_SU_DUNG.md`.
  - Bỏ hash mặc định khỏi code. Lần cài đầu sinh mật khẩu ngẫu nhiên và lưu trong Script Properties hoặc env.
  - Bắt đổi mật khẩu ở lần đăng nhập đầu.
  - Lưu ý: mật khẩu cũ vẫn nằm trong lịch sử git, nên việc đổi mật khẩu là bắt buộc. Xoá khỏi file thôi chưa đủ.
- **Xong khi:** `Admin@2026` không đăng nhập được trên backend thật. Repo không còn mật khẩu hay hash mặc định.

### Giới hạn đã biết (chưa coi là lỗi)
- Toạ độ GPS vẫn do trình duyệt cung cấp. Người dùng có thể giả bằng DevTools (Sensors) hoặc app fake GPS. Nếu cần chặt hơn thì kết hợp QR cửa, Wi-Fi cửa hàng hoặc ảnh selfie có duyệt.

### Chưa kiểm được
- Đăng nhập và đồng bộ dữ liệu thật trên backend Apps Script. Tôi không dùng mật khẩu để đăng nhập vào hệ thống thật, nên mới kiểm các route khi không đăng nhập: tất cả trả 401.
- Ghi vào Google Sheets thật (`Code.gs`).
- Chấm công GPS thật trên điện thoại (trình duyệt test bị từ chối quyền vị trí).

## Đã kiểm là đúng (không cần làm lại)

| Mục | Cách kiểm (17/10/2026, commit `7f4cc72`) |
|---|---|
| N1 | `POST /api/attendance` với payload ghi `accounts`/`settings`/`employees` → **400**. `POST /api/state` không token → **401**; với phiên Nhân viên → **403**. Trên Apps Script thật, không đăng nhập: `/api/attendance` và `/api/state` POST → `__httpStatus 401` |
| N2 | Không phiên: `/api/qr/generate` (door/personal) và `GET /api/state` → **401**; token phiên giả → 401. Phiên Nhân viên: QR cửa → **403**, QR của NV0001 → **403**, QR của chính mình → 200. `GET /api/state` chỉ trả dữ liệu trong phạm vi. `set-pin` cho admin từ phiên Nhân viên → 403. Apps Script thật: `GET /api/state` và `qr/generate` không đăng nhập → 401 |
| B1 phía client | Xoá `phuonghihi_*` rồi tải lại → `@guest`, menu chỉ còn "App". Chọn admin, nhập `739164` → bị từ chối. Sửa `currentAccountId = "ACC-001"` rồi tải lại → vẫn `@guest`. Hộp đăng nhập không còn gợi ý mật khẩu (xem M3 về mật khẩu mặc định) |
| C1 | Bundle trên GitHub Pages (`index-9UrpZBol.js`) có URL Apps Script `AKfycbysdr…`. Backend Apps Script phản hồi và chặn mọi route khi chưa đăng nhập |
| N3 | GPS thiếu `lat`/`lng`/`accuracy` → 400. Toạ độ cách 11km kèm `distanceMeters: 5` giả → 400 ("11193m vượt quá 150m") |
| N4 | Tài khoản Nhân viên không còn nút "📍 Demo: Tại quầy/Ngoài vùng" |
| N5 | Bảng công 10/2026: cột Vắng của NV0001 giảm từ 3 xuống 2 (không tính ca hôm nay chưa kết thúc) |
| E2 | `compressImageToDataUrl`: ảnh 3000×2000 → JPEG **480×320, 23KB**, không treo |
| E1 | Tài khoản Nhân viên không có nút "QR tại cửa" |
| E3 | Key `_v2` và URL Apps Script web bán hàng bị dọn (kiểm ở `5843d2a`) |
| E4, E5 | Cột Vắng có số liệu. Kỳ mặc định tính theo ngày thật (kiểm ở `5843d2a`) |
| C8, C5, D5, D3 | Đọc code ở `5843d2a`/`7f4cc72`: `graceLateMinutes`/`allowEarlyCheckInMinutes` được dùng; EWA = 0 khi chưa khai lương; tài khoản khoá → `LOGGED_OUT`; ngày không có ca không tính muộn |
| Trước đó | Lịch ca và kỳ lương không giới hạn tháng 10/2026. Ô QR để trống không tự chấm công. Không dán được QR của đồng nghiệp. Uỷ nhiệm chi không bịa số tài khoản. Bảng công tính từ chấm công. Biểu đồ Báo cáo lấy dữ liệu thật. Hàm tính muộn ca đêm đúng. Không cho NV0000 nghỉ việc. Giao diện 375px không tràn. Deploy GitHub Pages chạy được. Bundle `dist/` không còn secret cũ |
