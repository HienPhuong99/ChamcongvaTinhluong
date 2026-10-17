# AGENTS.md — phuonghihi Chấm công · Xếp ca · Tính lương

Hướng dẫn cho agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Mục **Việc cần sửa** là danh sách lỗi đang mở, cập nhật ngày 17/10/2026 sau khi kiểm lại commit `2a91968`.

## Dự án

- **Stack:** React 18, Vite 6, TypeScript, Tailwind, Leaflet, xlsx.
- **Dạng app:** PWA (`public/sw.js`). App Expo riêng nằm ở `mobile-expo/` và có `AGENTS.md` riêng.
- **Nơi giữ state:** toàn bộ ở `src/context/HRMContext.tsx`, lưu vào localStorage với key `phuonghihi_hrm_state_v2_*`.
- **Backend tuỳ chọn:** `server/index.js` (endpoint `/api/state`) và `google-sheets/Code.gs` (Apps Script).
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

Mức độ: 🔴 nghiêm trọng (gian lận, lộ quyền, mất dữ liệu) · 🟠 cao · 🟡 trung bình · ⚪ thấp.

### 🔴 1. Nhân viên tự chấm "QR tại cửa" trên máy của mình (E1)
- **Tái hiện:**
  1. Đăng nhập tài khoản Nhân viên (ACC-005).
  2. Bấm nút "QR tại cửa" trên Topbar để mở modal kiosk.
  3. Bấm "Tự quét (NV0009)". App ghi bản chấm công `method: 'QR tại cửa'`, khoảng cách 5m, không cần GPS.
- **Vị trí:** `src/components/Topbar.tsx:141` (nút mở kiosk), `src/components/DoorQrKioskModal.tsx:96, 199` (nút "Tự quét" gọi `checkInOrOut`).
- **Sửa:** chỉ vai trò `door_kiosk` hoặc quản lý mới mở được modal kiosk. Bỏ nút "Tự quét", vì kiosk chỉ hiển thị QR để nhân viên quét bằng máy của mình.
- **Xong khi:** đăng nhập Nhân viên thì không còn đường nào mở kiosk và không tự chấm được.

### 🔴 2. Hộp mã PIN chuyển tài khoản vượt qua được (B1)
- **Tái hiện:**
  1. Đăng nhập Nhân viên.
  2. Ở Topbar, chọn "Quản lý cửa hàng".
  3. Gõ `@admin`, là tên đăng nhập đang hiện ngay trên hộp thoại. App vào thẳng Quản trị cao nhất.
- **Vị trí:**
  - `src/context/HRMContext.tsx:751` (PIN mặc định `'123456'`).
  - `src/context/HRMContext.tsx:757` (chấp nhận `target.username` làm mật khẩu).
  - `src/context/HRMContext.tsx:2522` (tài khoản mới mặc định PIN `123456`).
  - `src/components/Topbar.tsx:274-280` (in dòng "Mã PIN mặc định 123456" và nút "Điền nhanh PIN mẫu" tự điền PIN thật).
  - PIN nằm trong `accounts`, được lưu và đồng bộ xuống mọi máy.
- **Sửa:**
  - Bỏ việc chấp nhận username làm mật khẩu.
  - Bỏ nút "Điền nhanh PIN mẫu" và dòng gợi ý PIN.
  - Không có PIN mặc định chung; bắt đặt PIN ở lần đầu.
  - Lưu PIN dạng hash, và không đồng bộ PIN.
  - Về lâu dài: đăng nhập phải xác thực ở server.
- **Xong khi:** từ tài khoản Nhân viên, gõ `@admin`, `admin` hay `123456` đều không vào được admin. Nút điền nhanh không còn.

### 🔴 3. GPS và ảnh selfie vẫn là giả lập (B3)
- **Tái hiện:**
  1. Mở App Mobile. App hiện "📍 Tại quầy (27m)" dù chưa xin quyền vị trí.
  2. Bấm "Chụp ảnh Selfie tại quầy". App vẽ một ảnh canvas chứa chữ, không mở camera.
  3. Bấm "Chấm công vào". Kết quả: thành công, ghi "GPS (27m)".
- **Vị trí:**
  - `src/views/MobileAppView.tsx:60`: `simulatedOffset` mặc định là `'in_range'`.
  - `src/views/MobileAppView.tsx:166`: `handleCaptureSelfieStamp` tạo ảnh bằng canvas.
  - Chỉ `handleSelfieFileChange` (`:195`) mới dùng `<input capture="user">`.
- **Sửa:**
  - Mặc định dùng `navigator.geolocation`. Nút giả lập chỉ hiện ở chế độ demo (cờ cấu hình), tắt ở bản thật.
  - Bỏ ảnh canvas. Khi `requirePhotoOnGps` bật, chỉ nhận ảnh chụp từ camera.
  - Server (khi có) phải kiểm lại khoảng cách.
- **Xong khi:** từ chối quyền vị trí thì không chấm GPS được. Không còn cách tạo "ảnh selfie" mà không qua camera hoặc file ảnh.

### 🔴 4. Lưu ảnh base64 vào localStorage làm mất dữ liệu chấm công (E2)
- **Nguyên nhân:**
  - Ảnh chấm công được lưu nguyên dạng data URL trong `attendanceRecords`. Một ảnh chụp thật nặng vài MB, vượt quota localStorage khoảng 5MB.
  - `savePersisted` (`src/context/HRMContext.tsx:215-221`) bỏ qua lỗi bằng `catch {}`. Từ lúc đó mọi thay đổi không được lưu, tải lại trang là mất.
- **Sửa:**
  - Nén và thu nhỏ ảnh, ví dụ cạnh dài ≤ 480px, JPEG chất lượng 0.6. Hoặc tải ảnh lên server/Drive và chỉ lưu URL.
  - Khi `setItem` lỗi quota thì hiện thông báo cho người dùng, không im lặng.
- **Xong khi:** chấm công kèm ảnh 4MB, tải lại trang, bản ghi vẫn còn.

### 🔴 5. Chưa đồng bộ dữ liệu giữa các máy (C1)
- **Thực tế:**
  - Client gọi `fetch('/api/state')` theo đường dẫn tương đối (`HRMContext.tsx:536, 606`). Trên GitHub Pages đường dẫn này trả 404, vì không có server nào được triển khai.
  - `pullStateFromBackend` chỉ chạy khi bấm nút trong Cài đặt (`SettingsView.tsx:959`).
  - Mỗi lần đẩy lên là ghi đè toàn bộ state. Hai máy cùng đẩy thì máy sau xoá dữ liệu của máy trước.
  - Máy nhân viên không có token nên không đẩy được chấm công.
- **Sửa:**
  - Triển khai backend: `server/index.js` hoặc Apps Script `google-sheets/Code.gs` dùng làm API, với URL tuyệt đối đặt trong Cài đặt hoặc biến môi trường build.
  - Tự tải dữ liệu khi mở app và theo chu kỳ.
  - Ghi theo từng bản ghi (append hoặc upsert theo `id`), không ghi đè toàn bộ.
- **Xong khi:** chấm công ở máy A, máy B thấy bản ghi đó sau khi tải lại.

### 🟠 6. Khoá ký QR sinh riêng trên từng máy nên QR không dùng được giữa các máy (B5)
- **Thực tế:**
  - `getQrSigningSecret()` (`src/utils/helpers.ts:74-108`) sinh khoá ngẫu nhiên và lưu ở `localStorage.phuonghihi_qr_hmac_seed_v1`.
  - QR hiện trên iPad kiosk được ký bằng khoá của iPad, còn điện thoại nhân viên xác thực bằng khoá của chính nó. Kết quả luôn là "Chữ ký mã QR không khớp". Đã thử bằng cách ký với một khoá khác.
- **Sửa:** ký và xác thực QR ở server (đi cùng việc 5). Không đưa khoá vào bundle hay vào state đồng bộ.
- **Xong khi:** QR hiện trên máy A được máy B xác thực. QR tự tạo trên máy B mà không có khoá thì bị từ chối.

### 🟠 7. Token API nằm trong `settings`, mà `settings` được đồng bộ xuống mọi máy (C2)
- **Vị trí:** `settings.apiSecretToken`, đọc ở `HRMContext.tsx:191`. `pullStateFromBackend` ghi đè `settings` xuống mọi máy, nên nhân viên đọc được token trong localStorage.
- **Sửa:** token (hoặc phiên đăng nhập) lưu riêng trên từng máy. Loại `apiSecretToken` và `accounts[].pin` khỏi payload đồng bộ ở cả hai chiều.
- **Xong khi:** payload `POST /api/state` và dữ liệu `GET` trả về không chứa token hay PIN.

### 🟠 8. Máy đã dùng bản cũ vẫn giữ dữ liệu cũ (E3)
- **Nguyên nhân:**
  - `STORAGE_KEY` vẫn là `phuonghihi_hrm_state_v2` (`HRMContext.tsx:188`).
  - `loadPersisted` trả nguyên dữ liệu đã lưu, nên máy cũ vẫn giữ `googleSheetsWebAppUrl` trỏ tới **Apps Script của web bán hàng** (`…AKfycbx66egogcD…/exec`), bảng công giả và tài khoản không có PIN.
- **Sửa:** đổi key sang `_v3`, hoặc viết migration theo phiên bản dữ liệu. Ít nhất phải xoá URL Apps Script cũ đó.
- **Xong khi:** máy có dữ liệu `_v2` cũ mở bản mới thì không còn URL web bán hàng trong Cài đặt.

### 🟠 9. Chấm ra ngày không có ca bị tính "Đi muộn" (D3)
- **Tái hiện:**
  1. NV0009 không có ca hôm nay, chấm vào lúc 09:48. App ghi "Ngoài lịch phân ca (Không tính muộn)".
  2. Chấm ra lúc 09:49. App đổi thành "Đi muộn 108 phút".
- **Nguyên nhân:** bản ghi lần đầu được lưu `shiftCode: 'hanh_chinh'`, nên `existingForDate?.shiftCode` luôn có giá trị (`HRMContext.tsx:1025-1027`).
- **Sửa:** khi không có ca thì lưu `shiftCode: null` (hoặc cờ `unscheduled: true`), và tính `hasScheduledShift` chỉ từ `shiftAssignments`.
- **Xong khi:** chấm vào rồi chấm ra ngày không có ca, cả hai lần đều không tính muộn.

### 🟡 10. Cột "Vắng" luôn bằng 0 (E4)
- **Vị trí:** `HRMContext.tsx:1834` chỉ đếm bản ghi có `status === 'Vắng'`, mà không có chỗ nào tạo bản ghi như vậy.
- **Sửa:** số ngày vắng = số ngày đã qua có ca − số ngày có chấm công − số ngày phép đã duyệt.
- **Xong khi:** bảng công 10/2026 có giá trị Vắng > 0 cho người có ca mà không chấm, ví dụ ngày 09/10 trong seed.

### 🟡 11. Tài khoản bị khoá thì app rơi vào tài khoản của người khác (D5)
- **Vị trí:** `currentAccount` trong `HRMContext.tsx` (khoảng dòng 292) fallback sang tài khoản `employee` đầu tiên, tức là phiếu lương của người khác.
- **Sửa:** đăng xuất về màn chọn hoặc đăng nhập tài khoản, không tự vào tài khoản khác.

### 🟡 12. Cài đặt chưa có tác dụng (C8)
- `allowEarlyCheckInMinutes` chưa được dùng ở đâu.
- `graceMinutes` vẫn truyền cứng `0` (`HRMContext.tsx:1039, 1147`).
- **Sửa:** thêm số phút cho phép muộn vào Cài đặt và dùng giá trị đó. Chặn chấm vào sớm hơn `allowEarlyCheckInMinutes`.

### 🟡 13. Thuế và EWA (C5)
- Mặc định giảm trừ vẫn là 11tr / 4,4tr (`src/data/seedData.ts:705-706`). Cần kế toán chốt mức áp dụng 2026; Cài đặt đã có nút áp mức 15,5tr / 6,2tr.
- Nhân viên chưa khai lương (0đ) vẫn được ứng tới 4,5tr, do fallback `baseSalary || 15000000` (`HRMContext.tsx:1475`, `MobileAppView.tsx:772, 778`). **Sửa:** hạn mức = 0 khi chưa khai lương.

### ⚪ 14. Kỳ mặc định viết cứng (E5)
- Các view mở mặc định ở kỳ cố định:
  - `PayrollView.tsx:63`, `ReportsView.tsx:32`, `MobileAppView.tsx:73` mở ở `'2026-09'`.
  - `TimesheetView.tsx:51` mở ở `'2026-10'`.
- **Sửa:** tính từ ngày hiện tại (tháng trước cho lương, tháng này cho bảng công).

### Chưa kiểm được
- Gửi dữ liệu sang Google Sheets thật: cần tạo Web App riêng từ `google-sheets/Code.gs`, đặt Script Property `PHUONGHIHI_API_SECRET`, rồi nhập URL vào Cài đặt.
- Ca đêm khi chấm thật sau 0h: hàm `calculateCheckInLateAndOt` đã đúng, nhưng `checkInOrOut` tìm ca của **ngày hiện tại**, không tìm ca đêm bắt đầu từ hôm trước.

## Đã kiểm là đúng (không cần làm lại)

Lịch ca và kỳ lương không còn giới hạn tháng 10/2026. Ô QR để trống không còn tự chấm công. Không dán được QR của đồng nghiệp. Kiosk không còn ô chọn nhân viên. Uỷ nhiệm chi Vietcombank không còn bịa số tài khoản. Bảng công tính từ dữ liệu chấm công. Biểu đồ Báo cáo lấy từ dữ liệu thật. Hàm tính muộn ca đêm đúng. Không cho NV0000 nghỉ việc. Giao diện ở 375px không tràn. Deploy GitHub Pages chạy được.
