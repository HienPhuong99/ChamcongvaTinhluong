# AGENTS.md — phuonghihi Chấm công · Xếp ca · Tính lương

Hướng dẫn cho agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Mục **Việc cần sửa** là danh sách lỗi đang mở, cập nhật ngày 17/10/2026 sau khi kiểm thử và xử lý dứt điểm `M1`, `M2`, `M3`.

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

Hiện không còn lỗi mở nào (`M1`, `M2`, `M3`, `N1`–`N5`, `B1`, `C1`, `E1`–`E5` đều đã sửa và kiểm thử thực tế trên trình duyệt, Node server và Google Apps Script).

### Giới hạn đã biết (chưa coi là lỗi)
- Toạ độ GPS vẫn do trình duyệt cung cấp. Người dùng có thể giả bằng DevTools (Sensors) hoặc app fake GPS. Nếu cần chặt hơn thì kết hợp QR cửa, Wi-Fi cửa hàng hoặc ảnh selfie có duyệt.

## Đã kiểm là đúng (không cần làm lại)

| Mục | Cách kiểm (17/10/2026) |
|---|---|
| M1 | Đã kiểm: `validateSingleAttendanceRecord` gọi `stripSecretsAndSanitize(cleanRecord, 1)`. Sau `POST /api/attendance` (trên API và trên trình duyệt `npm run dev`), đọc `server/db.json` thấy đủ `id`, `employeeId`, `date`, `checkIn`, `status`, `lateMinutes`, `otHours`, `method`, `distanceMeters`. Hai ngày khác nhau của cùng nhân viên tạo ra 2 bản ghi riêng biệt trong `db.json` |
| M2 | Đã kiểm trên cả Node server local và Apps Script thật (`@3`): (1) gửi `record` tự khai `checkIn`/`checkOut`/`status`/`lateMinutes`/`otHours` hoặc lùi ngày `2026-10-09` → **400**; (2) gửi `method: "QR tại cửa"` thiếu `qrToken` → **400**; lấy `qrToken` cửa thật từ Kiosk (`ACC-006`) rồi chấm `"QR tại cửa"` → **200**, dùng lại cùng `qrToken` lần 2 → **400**; (3) `NV0009` (`allowRemote: false`) gửi `"Từ xa"` → **400/403**; (4) Quản lý Kinh doanh (`ACC-004`) gửi chấm công cho `NV0001` (phòng Nhân sự) → **403** |
| M3 | Đã kiểm: đã xoay vòng mật khẩu cả 6 tài khoản trên backend Apps Script thật; thử đăng nhập `ACC-001` với `Admin@2026` trên cả backend Apps Script thật, Node server local và trên trình duyệt đều trả **401**. Xoá bảng mật khẩu khỏi `HUONG_DAN_SU_DUNG.md`, xoá `DEFAULT_CREDENTIAL_HASHES` và `DEFAULT_GAS_CREDENTIAL_HASHES` khỏi code (kiểm bằng `grep` trên toàn repo và `dist/`). Lần cài đầu tự sinh mật khẩu ngẫu nhiên kèm `mustChangePin: true`; trên trình duyệt (`npm run dev`), đăng nhập lần đầu bắt buộc hiện modal đổi mật khẩu mới trước khi sử dụng |
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
