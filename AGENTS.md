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

Hiện tại toàn bộ các mục (`N1`, `N2`, `B1`, `C1`, `N3`, `N4`, `N5`, `E2`, `D3`, `Code.gs`) đã được sửa tận gốc và kiểm thử đầy đủ bằng `curl` + trình duyệt.

## Đã kiểm là đúng (không cần làm lại)

| Mục | Cách kiểm |
|---|---|
| N1 | Đã kiểm bằng `curl -X POST http://localhost:5173/api/attendance` với payload ghi đè `accounts`/`settings`/`employees`: trả `400 Bad Request` (`/api/attendance` chỉ nhận duy nhất một `record` theo whitelist trường và bắt buộc phiên đăng nhập khớp `employeeId`), `db.json` không đổi. Mở trình duyệt mới vẫn có đủ 51 nhân viên (`HRMContext.tsx` gộp theo `id` cho cả `employees` và `accounts`) |
| N2 | Đã kiểm bằng `curl`: `POST /api/qr/generate` (cả `door` và `personal`) và `GET /api/state` không có phiên đều trả `401`. Khi đăng nhập Nhân viên `ACC-005` (`NV0009`), gọi `kind: 'door'` trả `403`, gọi `empCode: 'NV0001'` trả `403`, gọi `empCode: 'NV0009'` trả `200`. `GET /api/state` lọc dữ liệu theo `filterStateBySessionScope` |
| B1 | Đã kiểm trên trình duyệt sau khi xoá `phuonghihi_*`: máy mới mặc định ở màn đăng nhập (`LOGGED_OUT`), không vào thẳng `@admin`. Chọn "Quản lý cửa hàng" hiện hộp thoại xác thực Server (không còn "Thiết lập mã PIN bảo mật lần đầu"), nhập `739164` bị từ chối. Sửa `localStorage` (`currentAccountId` / `sessionToken` giả) rồi tải lại vẫn ở màn đăng nhập |
| C1 | Đã triển khai Backend miễn phí 100% lên Google Apps Script Web App (`Code.gs` + `appsscript.json`), cấu hình `VITE_PHUONGHIHI_BACKEND_URL` trong `.github/workflows/deploy.yml`, thêm `backendFetch` hỗ trợ CORS simple request (`text/plain;charset=utf-8`) và hàng đợi `offlineQueue` (`flushOfflineAttendanceQueue`) tự gửi lại khi có mạng kèm thông báo Toast |
| N3 | Đã kiểm bằng `curl`: gửi `POST /api/attendance` với `method: 'GPS'` thiếu `lat`/`lng`/`accuracy` trả `400`; gửi kèm tọa độ cách xa kèm `distanceMeters: 5` giả mạo trả `400` (`Khoảng cách GPS thực tế (10245m) vượt quá bán kính cho phép (150m)`) |
| N4 | Đã xoá `demoGpsSimulationEnabled` khỏi `SystemSettings` và state đồng bộ; cờ demo chỉ lấy từ `import.meta.env.VITE_ENABLE_GPS_DEMO` lúc build. Kiểm trên trình duyệt không còn nút "📍 Demo: Tại quầy" |
| N5 | Đã sửa `computeEmployeeTimesheetRow` chỉ tính cột `Vắng` cho các ngày `< todayIso` hoặc `todayIso` khi ca đã kết thúc (`nowMins > endMins`), và chỉ trừ ngày phép đã duyệt rơi vào những ngày có ca đã qua. Kiểm trên trình duyệt Bảng công 10/2026: cột Vắng giảm từ 3 xuống 2 (không tính ca hôm nay chưa kết thúc) |
| E2, D3, Code.gs | Đã nâng cấp `compressImageToDataUrl` dùng `createImageBitmap` + `OffscreenCanvas` (kiểm trên trình duyệt nén ảnh `1600x1200` 2.3MB xuống `480x360` JPEG 4.9KB không treo khi tab ẩn); kiểm `D3` ngoài lịch phân ca không tính muộn; kiểm `Code.gs` Web App xác thực phiên, ký/verify QR và đồng bộ state/attendance |
| E1 kiosk | Tài khoản Nhân viên không còn nút "QR tại cửa". `setIsDoorQrModalOpen` chặn vai trò không phải kiosk/quản lý. Không còn nút "Tự quét" |
| B3 phía client | GPS bị từ chối thì nút chấm công hiện "Cần cấp quyền GPS". Không còn nút giả lập (khi cờ demo tắt), không còn ảnh selfie vẽ bằng canvas. (Phía server xem N3, N4) |
| B5 | Ký QR bằng HMAC-SHA256 ở server, client không giữ khoá. (Cấp mã không xác thực, xem N2) |
| E3 | Đã nạp `phuonghihi_hrm_state_v2_settings` chứa URL `AKfycbx66egogcD…` và `phuonghihi_qr_hmac_seed_v1`, rồi tải lại: key cũ bị xoá, `googleSheetsWebAppUrl = ''` |
| E4 | Bảng công 10/2026 có cột Vắng = 1–3 (trước đây luôn 0). Lỗi nhỏ còn lại xem N5 |
| E5 | Mặc định Bảng công mở 10/2026; Bảng lương và Báo cáo mở 9/2026, tính theo ngày thật |
| C2 phía client | Token lưu ở `phuonghihi_local_api_secret_token_v3`. `sanitizeSettingsObject`/`sanitizeAccountsList` xoá token và PIN trước khi đồng bộ. (GET không xác thực, xem N2) |
| C8, C5, D5 | Đọc code: `graceLateMinutes` và `allowEarlyCheckInMinutes` được dùng trong `checkInOrOut`; EWA = 0 khi chưa khai lương; tài khoản bị khoá chuyển sang `LOGGED_OUT` (đã thấy màn "Phiên làm việc đã đăng xuất" khi danh sách tài khoản bị đổi) |
| Trước đó | Lịch ca và kỳ lương không giới hạn tháng 10/2026. Ô QR để trống không tự chấm công. Không dán được QR của đồng nghiệp. Uỷ nhiệm chi không bịa số tài khoản. Bảng công tính từ chấm công. Biểu đồ Báo cáo lấy dữ liệu thật. Hàm tính muộn ca đêm đúng. Không cho NV0000 nghỉ việc. Giao diện 375px không tràn. Deploy GitHub Pages chạy được. Bundle `dist/` không còn secret cũ |

