# 📘 TÀI LIỆU HƯỚNG DẪN SỬ DỤNG, THÔNG TIN ĐĂNG NHẬP & ĐƯỜNG DẪN TRUY CẬP HỆ THỐNG `phuonghihi`

> **Đơn vị vận hành**: **CỬA HÀNG PHUONGHIHI — Cửa hàng iPhone chính hãng**
> **Địa chỉ & Tâm bán kính GPS Chấm công**: `123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh` (`10.7728, 106.6988` · Bán kính hợp lệ: `150 m`)
> **Hotline**: `0900 300 300` · **Giờ mở cửa**: `08:00 - 21:00 (Thứ 2 – Chủ Nhật)`

---

## PHẦN 1: THÔNG TIN TRUY CẬP VÀO WEB & APP (ĐƯỜNG DẪN CHÍNH THỨC)

Hệ thống được thiết kế đa nền tảng (Web Quản trị, App Chấm Công Điện Thoại PWA, Google Sites và Ứng dụng Native trên Expo Go). Bạn và nhân viên có thể vào trực tiếp bằng các đường dẫn sau:

| Nền tảng / Môi trường | Đường dẫn truy cập (URL / QR) | Dành cho đối tượng |
| :--- | :--- | :--- |
| **1. Web Quản trị & Cổng Nhân sự (Live HTTPS)** | **[https://hienphuong99.github.io/ChamcongvaTinhluong/](https://hienphuong99.github.io/ChamcongvaTinhluong/)** | Quản lý cửa hàng, Nhân sự (HR), Kế toán, Trưởng nhóm & Nhân viên trên máy tính/iPad |
| **2. App Chấm Công Điện Thoại (Mobile PWA)** | **[https://hienphuong99.github.io/ChamcongvaTinhluong/?mode=mobile](https://hienphuong99.github.io/ChamcongvaTinhluong/?mode=mobile)** | Nhân viên mở trên trình duyệt điện thoại (Safari / Chrome) để chấm công GPS/QR, xin phép, xem phiếu lương |
| **3. Trang Google Sites Chấm Công & Nhân Sự** | **[https://sites.google.com/view/phuonghihi-staff](https://sites.google.com/view/phuonghihi-staff)** *(Trình sửa: [Mở Editor](https://sites.google.com/d/1Vk57WTh2Pm1IUUq0sv79AbA5WhTZr0BS/p/1OwDFFthLqJKC-wHM70WszAbGweH_VCGO/edit))* | Trang Google Sites chính thức dành cho nhân sự Cửa hàng `phuonghihi` |
| **4. Trang Google Sites Bán hàng & Kho IMEI** | **[https://sites.google.com/view/phuonghihi](https://sites.google.com/view/phuonghihi)** | Hệ thống Web Bán hàng iPhone chính hãng của Cửa hàng `phuonghihi` |
| **5. App Native trên Điện thoại (Expo Go)** | **`exp://192.168.0.23:8081`** *(Quét mã QR bằng nút **Expo Go** trên thanh Topbar Web)* | Chạy ứng dụng React Native mượt mà trực tiếp trong app **Expo Go** (iOS / Android) |
| **6. Kho mã nguồn GitHub** | **[https://github.com/HienPhuong99/ChamcongvaTinhluong](https://github.com/HienPhuong99/ChamcongvaTinhluong)** | Lưu trữ toàn bộ mã nguồn Web, Mobile PWA, Expo Go & Google Sheets Apps Script |

### 💡 Cách cài App Chấm Công ra màn hình chính điện thoại (iOS / Android không cần App Store)
1. Mở đường dẫn **[https://hienphuong99.github.io/ChamcongvaTinhluong/?mode=mobile](https://hienphuong99.github.io/ChamcongvaTinhluong/?mode=mobile)** (hoặc **[https://sites.google.com/view/phuonghihi-staff](https://sites.google.com/view/phuonghihi-staff)**) bằng **Safari** (trên iPhone) hoặc **Chrome** (trên Android).
2. Bấm nút **Chia sẻ (Share)** → chọn **Thêm vào Màn hình chính (Add to Home Screen)**.
3. Biểu tượng chữ **`p`** của **phuonghihi** sẽ xuất hiện trên màn hình điện thoại như một ứng dụng độc lập.

### 🌐 Hệ Sinh Thái 2 Trang Google Sites Đồng Bộ Của `phuonghihi`
- **Cổng Chấm Công, Xếp Ca & Tính Lương Nhân Viên**: **[https://sites.google.com/view/phuonghihi-staff](https://sites.google.com/view/phuonghihi-staff)**
  - Nhúng trực tiếp hệ thống Quản trị Nhân sự, Điểm danh GPS/QR & Tính lương 5 bước.
  - Trên thanh Topbar của phần mềm có nút **`Web Bán hàng`** để chuyển 1 chạm sang trang bán hàng.
  - **Link trình chỉnh sửa (Editor)**: [https://sites.google.com/d/1Vk57WTh2Pm1IUUq0sv79AbA5WhTZr0BS/p/1OwDFFthLqJKC-wHM70WszAbGweH_VCGO/edit](https://sites.google.com/d/1Vk57WTh2Pm1IUUq0sv79AbA5WhTZr0BS/p/1OwDFFthLqJKC-wHM70WszAbGweH_VCGO/edit)
- **Cổng Bán Hàng iPhone Chính Hãng & Kho IMEI**: **[https://sites.google.com/view/phuonghihi](https://sites.google.com/view/phuonghihi)**

---

## PHẦN 2: THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP & CHUYỂN ĐỔI VAI TRÒ (RBAC)

Để bảo mật phân quyền thực tế, hệ thống tích hợp **Cơ chế xác thực phiên đăng nhập tại Server (`PBKDF2-SHA256` + `HMAC-SHA256` Session Token)**:
- **Máy mới mặc định ở trạng thái Chưa đăng nhập (`LOGGED_OUT`)**: Bắt buộc chọn tài khoản và nhập đúng mật khẩu / mã PIN để Server xác thực và cấp phiên đăng nhập (`sessionToken`). Việc sửa `localStorage` trên trình duyệt không thể tự nâng quyền.
- **Quản lý cấp/đổi mã PIN tập trung tại Server**: Không cho phép tự đặt mã PIN lần đầu tại màn hình đăng nhập. Chỉ **Quản trị hệ thống (`@admin`)** hoặc **Nhân sự (`@minhanh.hr`)** mới có quyền cấp/đổi mã PIN cho các tài khoản tại mục **Phân quyền**.
- **Tự động bảo vệ khi khoá tài khoản**: Khi một tài khoản bị Quản trị viên khoá hoặc khi người dùng bấm Đăng xuất, hệ thống lập tức thu hồi phiên và chuyển về màn hình đăng nhập.

### 2.1. Danh sách 6 Tài khoản Phân quyền Dựng sẵn trên Web & Mobile

| Mã TK | Họ và tên | Mã NV | Tên đăng nhập | Mật khẩu / PIN khởi tạo | Vai trò (Role) | Phạm vi dữ liệu & Quyền hạn |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ACC-001` | **Quản lý cửa hàng (phuonghihi)** | `NV0000` | `@admin` | `Admin@2026` | **Quản trị hệ thống** (`super_admin`) | **Toàn hệ thống** — Toàn quyền 14 phân hệ, chốt lương, phân quyền, cấp PIN, cài đặt GPS & cấu hình |
| `ACC-002` | **Nguyễn Minh Anh** | `NV0001` | `@minhanh.hr` | `HrMinhAnh@2026` | **Nhân sự (HR)** (`hr`) | **Toàn hệ thống (Nhân sự)** — Xếp ca, quản lý điểm danh, duyệt đơn từ, hồ sơ 51 nhân viên, cấp PIN |
| `ACC-003` | **Phạm Ngọc Lan** | `NV0004` | `@ngoclan.kt` | `KtNgocLan@2026` | **Kế toán lương** (`accountant`) | **Toàn hệ thống (Kế toán)** — Tổng hợp bảng công, thưởng/khấu trừ, chạy quy trình làm lương 5 bước & phát hành phiếu lương |
| `ACC-004` | **Lê Quang Huy** | `NV0003` | `@quanghuy.sales` | `QlQuangHuy@2026` | **Trưởng bộ phận** (`manager`) | **Chỉ phòng ban mình (`Kinh doanh`)** — Xếp ca, theo dõi điểm danh và duyệt đơn nghỉ/OT cho nhân viên đội Kinh doanh |
| `ACC-005` | **Bùi Minh Quân** | `NV0009` | `@minhquan` | `NvMinhQuan@2026` | **Nhân viên** (`employee`) | **Của bản thân** — Tự chấm công GPS/QR, xem lịch ca cá nhân, gửi đơn xin nghỉ/OT, xem phiếu lương của chính mình |
| `ACC-006` | **iPad Kiosk Quầy Thu Ngân (123 Lê Lợi)** | `NV0000` | `@kiosk.quay` | `KioskQuay@2026` | **Màn hình QR tại cửa** (`door_kiosk`) | **Chỉ mở mã QR tại cửa** — Khoá toàn bộ menu quản trị, chỉ hiển thị màn hình Kiosk Mã QR tự đổi mỗi 45 giây tại quầy thu ngân |

### 2.2. Quy tắc Tài khoản của toàn bộ 50 Nhân viên Cửa hàng `phuonghihi`
- **Mã nhân viên**: Từ `NV0000` đến `NV0050` (42 Chính thức, 6 Thử việc, 1 Tạm nghỉ, 1 Đã nghỉ).
- **Email chuẩn**: `<mã_nv_viết_thường>@phuonghihi.vn` (Ví dụ: `nv0001@phuonghihi.vn`, `nv0002@phuonghihi.vn`, ..., `nv0050@phuonghihi.vn`).
- **Số điện thoại**: `0900300000` → `0900300050`.
- **Cách đổi nhân viên đang thao tác trên App Điện Thoại**:
  - Trên **Web Mobile PWA** (`?mode=mobile`): Chọn nhân viên ở thanh **Đang chấm công với tư cách** ngay đầu màn hình điện thoại (chỉ hiển thị cho Quản lý khi có nhiều nhân sự trong phạm vi phân quyền).
  - Trên **App Native Expo Go**: Bấm vào thẻ tên nhân viên ở góc trên cùng bên phải màn hình để chuyển nhanh giữa các nhân viên (`NV0000`, `NV0001`, `NV0002`, `NV0003`, `NV0009`, ...).

### 2.3. Tài khoản Admin sở hữu Google Sites, File gốc Excel / Google Sheets & Script liên quan
- **Tài khoản Google sở hữu Google Sites (`phuonghihi` & `phuonghihi-staff`) và Google Sheets**: **Nguyen Hien Phuong** (`nhphuong0299@gmail.com`).
- **Tài khoản GitHub chủ sở hữu mã nguồn**: **Hien Phuong** (`hphuong123123@gmail.com`) — GitHub: [`HienPhuong99/ChamcongvaTinhluong`](https://github.com/HienPhuong99/ChamcongvaTinhluong) & [`HienPhuong99/web-app`](https://github.com/HienPhuong99/web-app).
- **Tài khoản Admin trên phần mềm (`super_admin`)**: `ACC-001` — **Quản lý cửa hàng (phuonghihi)** (`@admin` / `admin@phuonghihi.vn`) — nắm toàn quyền quản trị dữ liệu gốc, nhập/xuất file Excel (`.xlsx`, `.csv`), chốt bảng công, bảng lương và cấu hình kết nối Google Sheets.
- **Script Google Sheets & Apps Script gốc**: Lưu tại [`google-sheets/Code.gs`](./google-sheets/Code.gs)
  - Chứa hàm `setupPhuonghihiDatabase()` tự động khởi tạo **8 trang tính (Sheets) chuẩn**: `NhanVien`, `PhanCa`, `DiemDanh`, `DonTu`, `BangCong`, `BangLuong`, `CaiDat`, `NhatKyHeThong`.
  - Chứa các endpoint `doGet` và `doPost` để đồng bộ dữ liệu 2 chiều theo cơ chế **Upsert theo ID** (không ghi đè mất dữ liệu của máy khác), ký/xác thực mã QR tập trung tại Server và tự động gửi email phiếu lương.
  - **Cấu hình URL Web App Apps Script riêng cho HRM**: Triển khai [`google-sheets/Code.gs`](./google-sheets/Code.gs) thành một Web App độc lập trên Google Sheets HRM (tách biệt với script của Web Bán hàng) và dán URL `/exec` vào mục **Cài đặt → Tính lương & Sheets**.
- **Dữ liệu gốc (Seed Data 50 nhân sự, bảng công, bảng lương)**: Lưu tại [`src/data/seedData.ts`](./src/data/seedData.ts). Admin (`@admin`), Nhân sự (`@minhanh.hr`) và Kế toán (`@ngoclan.kt`) có thể **Xuất ra file Excel (`.xlsx` / `.csv`)** hoặc **Nhập từ file Excel** trực tiếp tại phân hệ **Nhân viên** và **Báo cáo**.

---

## PHẦN 3: HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG PHÂN HỆ

### 1️⃣ Ca & Lịch làm việc (`Ca & lịch làm việc`)
- **5 ca làm việc chuẩn tại Cửa hàng `phuonghihi`**:
  - 🟢 **Hành chính**: `08:00 – 17:30` (1.0 công)
  - 🔵 **Ca Sáng**: `06:00 – 14:00` (1.0 công)
  - 🟡 **Ca Chiều**: `14:00 – 22:00` (1.0 công)
  - 🟣 **Ca Đêm**: `22:00 – 06:00` (1.0 công)
  - 🔴 **Ca gãy (Chuyên biệt Cửa hàng bán lẻ 08:00 - 21:00)**: `08:00 – 21:00` (1.5 công)
- **✨ AI Xếp ca tối ưu 1 chạm (Tự tránh phép)**:
  - Bấm nút **✨ AI Xếp ca tối ưu (Tự tránh phép)** trên thanh công cụ: thuật toán tự động phân bổ ca tuần công bằng cho toàn bộ nhân sự đang làm việc, tự động ưu tiên Ca Sáng / Ca Chiều / Ca Gãy cho đội Kinh doanh - Bán hàng iPhone.
  - **Cảnh báo xung đột nghỉ phép trực quan**: Những ô ngày mà nhân viên đã có đơn **Nghỉ phép** được duyệt sẽ hiển thị nhãn `🏖️ Nghỉ phép` (nếu chưa xếp ca) hoặc `⚠️ Trùng nghỉ phép` (nếu lỡ xếp ca đè lên ngày nghỉ) và tự động được AI bỏ qua khi xếp lịch.
- **Cách dùng Bút vẽ xếp ca nhanh (Paint-mode)**:
  1. Bấm chọn một loại ca trên thanh **Xếp nhanh** (hoặc chọn **Xoá ca**).
  2. Bấm chuột hoặc giữ và kéo chuột quét qua các ô ngày của nhân viên trên bảng lịch tuần để gán ca hàng loạt trong vài giây.
  3. Dùng nút **Sao chép tuần trước** để nhân bản lịch tuần cũ sang tuần mới, hoặc bấm vào từng ô để sửa tay từng ngày.

### 2️⃣ Chấm công Điện thoại, Watermark GPS & Bản đồ Leaflet (`App Mobile` / `?mode=mobile`)
- **3 Phương thức chấm công**:
  1. **Tại văn phòng (GPS thực tế + Bán kính 150m)**: Hệ thống lấy tọa độ GPS thực của thiết bị qua `navigator.geolocation` và đối chiếu khoảng cách trên bản đồ **Leaflet OpenStreetMap** lấy tâm là **Cửa hàng phuonghihi — 123 Đường Lê Lợi, Quận 1** (`10.7728, 106.6988`). Nếu thiết bị từ chối cấp quyền vị trí GPS thì không thể bấm chấm công GPS. (Quản trị viên có thể bật tuỳ chọn *Chế độ Demo mô phỏng vị trí GPS* trong **Cài đặt** nếu muốn kiểm thử nhanh).
  2. **Quét mã QR tại quầy (Ký & xác thực HMAC-SHA256 tại Server)**: Nhân viên mở tab **Mã QR của tôi** trên điện thoại và quét/nhập mã QR động 45 giây hiển thị trên màn hình iPad Kiosk tại quầy thu ngân.
  3. **Làm việc từ xa (Remote / Đi thị trường)**: Dành cho nhân sự được bật cờ *Cho phép chấm công từ xa*, yêu cầu nhập lý do/địa điểm khách hàng trước khi bấm **Chấm công vào**.
- **📸 Chụp ảnh Selfie bằng Camera thật & Tự động nén ảnh tối ưu**:
  - Khi bật yêu cầu chụp ảnh khi chấm công GPS, nhân viên bắt buộc chụp ảnh từ Camera trước (`capture="user"`) hoặc chọn file ảnh thực tế kèm đóng dấu Watermark tên nhân viên, mã NV, giờ chấm công và tọa độ GPS.
  - Ảnh chụp (kể cả ảnh gốc nặng 4MB–10MB) được tự động thu nhỏ và nén chuẩn JPEG (`≤ 480px`, chất lượng `0.6`) giúp lưu trữ mượt mà và đồng bộ tức thì lên Server.
- **Tính năng ngay trên App Điện thoại (Web PWA & Native Expo Go)**:
  - Bấm nút tròn lớn **Chấm công vào** (`Check-in`) / **Chấm công ra** (`Check-out`).
  - Gửi nhanh **5 loại đơn từ**: **Nghỉ phép**, **Làm thêm giờ (OT)**, **Quên chấm công**, **🔄 Đổi ca trực**, và **💸 Ứng lương nhanh (tối đa 30% lương cơ bản đối với nhân sự đã khai lương)**.
  - Xem **Phiếu lương cá nhân** và bấm **Phản hồi phiếu lương** nếu có thắc mắc.

### 3️⃣ Màn hình Kiosk Mã QR tại cửa (`QR tại cửa`)
- Chỉ tài khoản **Màn hình QR tại cửa (`@kiosk.quay`)** hoặc **Quản lý / HR / Admin** mới có nút **QR tại cửa** trên thanh Topbar để mở màn hình Kiosk.
- Màn hình Kiosk hiển thị mã QR kích thước lớn kèm đồng hồ đếm ngược **45 giây** được ký số từ Server (`/api/qr/token`). Hết 45 giây mã tự động sinh chuỗi token mới để nhân viên dùng điện thoại cá nhân quét chấm công (màn hình Kiosk không cho phép bấm tự chấm công trực tiếp).

### 4️⃣ Quản lý Điểm danh & Nhắc chấm công 1 chạm (`Điểm danh`)
- Chọn ngày cần theo dõi (mặc định mở ngày có dữ liệu mẫu đầy đủ `09/10/2026`).
- Hệ thống tự động bóc tách 4 thẻ chỉ số: **Tổng ca trong ngày**, **Đúng giờ**, **Đi muộn**, và **Chưa chấm công**.
- **Nhắc chấm công tự động**: Bấm nút màu cam **Gửi nhắc nhở người chưa chấm công** → hệ thống gửi thông báo đẩy hàng loạt tới toàn bộ nhân viên có ca nhưng chưa check-in và ghi nhận vào Nhật ký hệ thống.

### 5️⃣ Quản lý Đơn từ, Đổi ca trực, Ứng lương nhanh & Số dư phép (`Đơn từ`)
- **Hỗ trợ đầy đủ 5 nghiệp vụ đơn từ hiện đại**:
  1. **Nghỉ phép** (tự động trừ vào quỹ phép năm và cảnh báo trên bảng xếp ca).
  2. **Làm thêm giờ (OT)** (tự động cộng giờ OT hưởng 150% lương).
  3. **Quên chấm công** (bổ sung giờ vào/ra bị sót).
  4. **🔄 Đổi ca trực (Shift Swap)**: Nhân viên chọn ngày muốn đổi, ca mong muốn (`Ca Sáng`, `Ca Chiều`, `Ca Gãy`...) và đồng nghiệp đổi cùng. Khi Quản lý/HR bấm **Duyệt**, bảng phân ca tuần tự động cập nhật ca mới.
  5. **💸 Ứng lương nhanh (Earned Wage Access — EWA)**: Cho phép nhân viên tạm ứng linh hoạt tới **30% lương cơ bản** ngay trong tháng. Khi bấm **Duyệt**, hệ thống tự động tạo khoản khấu trừ `Tạm ứng lương nhanh qua App` vào Bước 4 của kỳ lương tháng đó.
- **Tab Danh sách đơn**: Duyệt hoặc từ chối từng đơn chỉ với 1 cú nhấp (`✓ Duyệt` / `✕ Từ chối`), hoặc tích chọn nhiều đơn để **Duyệt hàng loạt**.
- **Tab Lịch nghỉ công ty**: Hiển thị trực quan trên lịch tháng những ai đang nghỉ phép ngày nào để Quản lý cửa hàng không xếp trùng ca trống quầy.
- **Tab Số dư phép năm**: Tự động tính **12 ngày phép chuẩn/năm** và **cộng thêm +1 ngày phép cho mỗi 5 năm thâm niên** làm việc tại `phuonghihi`.

### 6️⃣ Hồ sơ Nhân sự 5 Tab & Checklist Nhận/Trả việc (`Nhân viên`)
- Hỗ trợ tìm kiếm, lọc theo 6 bộ phận (`Kỹ thuật`, `Kinh doanh`, `Nhân sự`, `Kế toán`, `Marketing`, `Vận hành`) và **Nhập / Xuất danh sách Excel (`.xlsx`, `.csv`)**.
- Bấm vào bất kỳ nhân viên nào để mở **Ngăn kéo Hồ sơ 5 Tab**:
  1. **Tổng quan**: Thông tin cá nhân, CCCD, ngân hàng Vietcombank, trạng thái làm việc.
  2. **Hợp đồng**: Quản lý hợp đồng thử việc / chính thức, mức lương cơ bản, phụ cấp, số người phụ thuộc.
  3. **Tài liệu**: Lưu trữ file scan CCCD, Hợp đồng lao động PDF.
  4. **Nhận / Trả việc (Onboarding / Offboarding)**: Bấm 1 nút **Tạo checklist Nhận người mới** hoặc **Tạo checklist Trả việc** để tự động sinh danh sách công việc bàn giao (cấp tài khoản kho IMEI, thu hồi thẻ quầy, đăng xuất thiết bị từ xa...).
  5. **Ghi chú**: Lưu lịch sử đánh giá nhân viên tại cửa hàng.

### 7️⃣ Quy trình Làm lương 5 Bước, Hoa hồng IMEI iPhone & Ủy nhiệm chi Vietcombank (`Làm lương`)
Chuyển tuần tự qua 5 bước khép kín chỉ trên một màn hình:
- **Bước 1 — Tổng hợp công**: Tự động gom số công thực tế, ngày phép hưởng lương, số lần/số phút đi muộn và số giờ OT từ bảng chấm công.
- **Bước 2 — Chốt kỳ công**: Kiểm tra và bấm **Khoá bảng công** để cố định số liệu trước khi tính tiền.
- **Bước 3 — Khai lương cơ bản & Phụ cấp**: Kiểm tra mức lương hợp đồng, phụ cấp ăn trưa/xăng xe/điện thoại và số người phụ thuộc giảm trừ gia cảnh.
- **Bước 4 — Tính bảng lương tự động & Tính hoa hồng bán máy iPhone theo IMEI**:
  - Bấm nút **📱 Tính hoa hồng iPhone / IMEI**: Nhập số máy iPhone bán ra (`150.000đ/máy`), gói bảo hành **AppleCare+** (`200.000đ/gói`) và hồ sơ trả góp duyệt thành công (`80.000đ/hồ sơ`) → tự động cộng vào thưởng doanh số tháng của nhân viên.
  - Tự động tính: `Lương theo ngày công + Phụ cấp + Lương OT (150%) + Thưởng doanh số iPhone`.
  - Tự động khấu trừ: **BHXH/BHYT/BHTN (`10.5%`)**, **Thuế TNCN lũy tiến** (sau giảm trừ bản thân 11 triệu & người phụ thuộc 4.4 triệu/người), **Tạm ứng lương nhanh (EWA)** và **Phạt đi muộn theo bậc cấu hình**.
- **Bước 5 — Chốt, Xuất Ủy nhiệm chi Vietcombank & Phát hành phiếu lương**:
  - Bấm **🏦 Xuất ủy nhiệm chi Vietcombank (`.xlsx`)**: Tải ngay file Excel chuẩn định dạng VCB Digibiz gồm *Số tài khoản nhận, Ngân hàng, Chủ tài khoản, Số tiền thực lĩnh, Nội dung chuyển lương* cho toàn bộ 50 nhân sự.
  - Bấm **Chốt bảng lương** và **Gửi phiếu lương qua Email / In PDF** cho toàn bộ nhân viên.

### 8️⃣ Các Phân hệ Quản trị, Bảo mật & Tiện ích Khác
- **Thưởng & Khấu trừ (`Thưởng & khấu trừ`)**: Thêm nhanh các khoản thưởng nóng bán máy iPhone 16 Pro Max, hoa hồng trả góp hoặc khoản phạt vi phạm nội quy.
- **Báo cáo (`Báo cáo`)**: Xem biểu đồ phân tích tỷ lệ chuyên cần, quỹ lương theo từng bộ phận và xuất báo cáo `CSV / Excel / In PDF`.
- **Phân quyền & Nhật ký (`Phân quyền`)**: Tuỳ chỉnh ma trận quyền của 6 vai trò và tra cứu **Nhật ký hệ thống (Audit Log)** ghi lại mọi thao tác trên phần mềm.
- **Bảo mật toàn diện (Tháng 10/2026)**: Tích hợp chống CSV/Excel Formula Injection (CWE-1236), lọc XSS/HTML Injection (CWE-79), chống Prototype Pollution (CWE-1321), Rate-limiting API 120 req/phút, và `0` lỗ hổng bảo mật (`npm audit`).
- **Phím tắt Tìm kiếm toàn cục (`Ctrl + K`)**: Bấm `Ctrl + K` ở bất kỳ đâu, gõ tiếng Việt **không dấu** (ví dụ: `minh anh`, `hai an`, `bang luong`, `xep ca`) để nhảy thẳng tới nhân viên hoặc màn hình chức năng.
- **Khôi phục dữ liệu mẫu**: Bấm biểu tượng vòng xoay `↺` ở góc trên bên phải thanh Topbar bất kỳ lúc nào để đưa dữ liệu về trạng thái chuẩn ban đầu.

---

## PHẦN 4: HƯỚNG DẪN THAO TÁC TỪNG BƯỚC CÁC TÍNH NĂNG MỚI NÂNG CẤP (THÁNG 10/2026)

### 4.1. ✨ Cách dùng AI Xếp Ca Tối Ưu 1 Chạm & Tự Động Tránh Ngày Nghỉ Phép
1. Mở menu **`Ca & lịch làm việc`** (hoặc tab **`Ca trực`** ở thanh đáy trên điện thoại).
2. Chọn tuần cần xếp lịch (`05/10 - 11/10/2026` hoặc `12/10 - 18/10/2026`).
3. Bấm nút màu tím xanh **`✨ AI Xếp ca tối ưu (Tự tránh phép)`** ngay đầu bảng phân ca:
   - Hệ thống tự động quét toàn bộ 50 nhân sự đang làm việc và đơn **Nghỉ phép** đã được duyệt trong tuần.
   - Tự động bỏ qua không xếp ca vào những ngày nhân viên đang nghỉ phép (hiển thị nhãn xanh `🏖️ Nghỉ phép`).
   - Tự động cân bằng số lượng nhân viên trực `Ca Sáng`, `Ca Chiều`, `Hành chính` và `Ca gãy (08:00 - 21:00)` cho bộ phận Kinh doanh & Kỹ thuật iPhone.
4. Nếu bạn dùng bút vẽ tay gán nhầm một ca đè lên ngày nhân viên đã xin nghỉ phép được duyệt, ô đó sẽ lập tức hiện cảnh báo đỏ **`⚠️ Trùng nghỉ phép`** kèm số lượng xung đột trên thanh công cụ để bạn xử lý ngay.

---

### 4.2. 🔄 Cách Gửi & Duyệt Đơn Đổi Ca Trực (`Đổi ca trực` — Tự động cập nhật lịch tuần)
- **Dành cho Nhân viên (trên App Mobile hoặc Web)**:
  1. Trên **App Mobile**: Bấm tab **`Gửi đơn`** → chọn Loại đơn **`🔄 Đổi ca trực cửa hàng`** → nhập **`Ngày áp dụng`** → chọn **`Ca muốn đổi sang`** (`Ca Sáng`, `Ca Chiều`, `Hành chính`, `Ca gãy`) → nhập lý do và bấm **`Gửi đơn cho quản lý duyệt`**.
  2. Trên **Web**: Vào mục **`Đơn từ`** → bấm **`+ Tạo đơn mới`** → chọn **`Đổi ca trực`** → chọn **`Ca muốn đổi sang`** và bấm **`Gửi đơn`**.
- **Dành cho Quản lý / Nhân sự (HR)**:
  1. Vào mục **`Đơn từ`** → tab **`Chờ tôi duyệt`**.
  2. Bấm nút tích xanh **`✓`** ở dòng đơn **`Đổi ca trực`**.
  3. Hệ thống **tự động đổi luôn ca làm việc của nhân viên đó trên Bảng phân ca tuần** mà không cần mở lại bảng lịch sửa tay.

---

### 4.3. 💸 Cách Ứng Lương Nhanh 24/7 (`Ứng lương nhanh` EWA — Tự động khấu trừ vào Kỳ lương)
- **Cách 1 (Từ Phiếu lương trên Điện thoại)**:
  1. Mở **`App Mobile`** → bấm tab **`Phiếu lương`**.
  2. Bấm nút màu xanh lá **`💸 Ứng lương nhanh 24/7 (Tới 30% lương)`** ở cuối phiếu lương.
  3. Hệ thống tự động chuyển sang biểu mẫu ứng lương, điền sẵn mức ứng gợi ý và lý do → bấm **`Gửi đơn cho quản lý duyệt`**.
- **Cách 2 (Tạo trực tiếp tại mục Đơn từ)**:
  1. Vào **`Đơn từ`** → bấm **`+ Tạo đơn mới`** → chọn loại đơn **`Ứng lương nhanh`**.
  2. Nhập **`Số tiền tạm ứng (VNĐ)`** (hỗ trợ từ `500.000đ` đến tối đa `30%` lương cơ bản) → bấm **`Gửi đơn`**.
- **Tự động đối trừ khi Duyệt**:
  - Ngay khi Quản lý hoặc Kế toán bấm **`✓ Duyệt`** đơn ứng lương, hệ thống tự động tạo một khoản khấu trừ mang tên **`Tạm ứng lương nhanh qua App`** vào **Bước 4** của kỳ lương tháng đó để cuối tháng tự động cấn trừ chính xác 100%.

---

### 4.4. 📱 Cách Tính Hoa Hồng Bán Lẻ iPhone, AppleCare+ & Hồ Sơ Trả Góp Theo IMEI
1. Vào phân hệ **`Bảng lương`** → chọn kỳ lương (ví dụ `Tháng 9/2026` hoặc `Tháng 10/2026`).
2. Bấm nút **`📱 Tính hoa hồng bán iPhone`** trên thanh công cụ phía trên.
3. Trong cửa sổ **Tính hoa hồng bán lẻ iPhone & IMEI**, nhập sản lượng thực tế của từng nhân viên Kinh doanh / Kỹ thuật:
   - **Máy iPhone bán ra**: Tự nhân đơn giá **`150.000 đ / máy`**.
   - **Gói bảo hành AppleCare+**: Tự nhân đơn giá **`200.000 đ / gói`**.
   - **Hồ sơ trả góp duyệt thành công**: Tự nhân đơn giá **`80.000 đ / hồ sơ`**.
4. Xem cột **Thành tiền hoa hồng** nhảy số trực tiếp và bấm **`Áp dụng hoa hồng vào Bảng lương`**:
   - Toàn bộ tiền thưởng hoa hồng được cộng tự động vào **Bước 4 (Tính bảng lương)** và hiển thị chi tiết trên Phiếu lương của từng nhân viên.

---

### 4.5. 🏦 Cách Xuất File Ủy Nhiệm Chi Lương Hàng Loạt Chuẩn Vietcombank Digibiz (`.xlsx`)
1. Vào phân hệ **`Bảng lương`**.
2. Bấm nút màu xanh lá **`🏦 Xuất ủy nhiệm chi Vietcombank`** trên thanh công cụ.
3. Trình duyệt sẽ tải ngay về máy file Excel **`Vietcombank_ChuyenKhoanLuong_phuonghihi_<Kỳ>.xlsx`** gồm đầy đủ 7 cột chuẩn ngân hàng:
   - `STT`, `Mã NV`, `Chủ tài khoản thụ hưởng (IN HOA)`, `Số tài khoản nhận`, `Ngân hàng thụ hưởng (Vietcombank)`, `Số tiền chuyển khoản (Thực lĩnh VNĐ)`, và `Nội dung chuyển khoản`.
4. Kế toán chỉ cần tải file này lên hệ thống **VCB Digibiz** để duyệt lệnh chi lương hàng loạt cho 50 nhân sự trong 1 lần.

---

### 4.6. 📸 Chấm Công Selfie Đóng Dấu Watermark GPS + Thời Gian Thực & Điều Hướng Giao Diện Mobile Mới
1. **Đóng dấu Watermark chống gian lận trên App Mobile**:
   - Ngay dưới nút tròn **`Chấm công vào / ra`** trên `App Mobile`, dải băng đen hiển thị trực tiếp chữ ký số: **`📸 <Mã NV> · 123 Lê Lợi, Q.1 | GPS ±12m · <Giờ:Phút:Giây>`**.
   - Khi nhân viên bấm chấm công, toàn bộ thông tin Watermark (tọa độ, khoảng cách mét so với quầy 123 Lê Lợi và thời gian chuẩn) được lưu cứng vào lịch sử điểm danh.
2. **Thao tác nhanh trên màn hình Điện thoại (`390×844` / `?mode=mobile`)**:
   - **Thanh chọn nhanh trên đầu màn hình điện thoại**: Bạn có thể đổi nhanh nhân viên đang cầm máy và bấm nút **`📍 Tại quầy (27m)` / `🚶 Ngoài vùng (362m)`** ngay trên đầu màn hình điện thoại mà không cần cuộn xuống dưới.
   - **4 nút chuyển nhanh (`Chấm công` · `Mã QR` · `Gửi đơn` · `Phiếu lương`)**: Nằm ngay đầu màn hình Mobile giúp chuyển tác vụ tức thì.
   - **Menu ngăn kéo trượt (`☰`) & Thanh điều hướng đáy 5 mục**: Khi dùng trình duyệt điện thoại, bấm nút **`☰`** góc trên bên trái để mở toàn bộ 14 phân hệ hoặc dùng 5 nút cố định dưới đáy màn hình (`Ca trực`, `Điểm danh`, `Chấm công`, `Đơn từ`, `Bảng lương`).


