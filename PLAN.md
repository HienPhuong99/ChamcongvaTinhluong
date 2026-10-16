# Kế Hoạch Chi Tiết Hoàn Thiện App & Web Chấm Công - Xếp Ca - Tính Lương (Cửa hàng phuonghihi)

Tài liệu này là bản kế hoạch chi tiết được xây dựng từ việc phân tích toàn bộ các phân cảnh, luồng nghiệp vụ và giao diện trong video `ChamCongvaTinhLuong.mp4`.

---

## 1. Phân Tích Toàn Bộ Tính Năng Từ Video (`00:00` – `01:15`)

1. **Ca & Lịch làm việc (`00:00 - 00:11`)**:
   - Lịch phân ca theo Ngày / Tuần / Tháng, kèm lịch nhỏ (Mini Calendar) bên trái và 2 thẻ chỉ số `50 NHÂN SỰ` · `5 CA MẪU`.
   - **Thanh Xếp nhanh (Bút vẽ ca)**: Chọn ca mẫu (`Hành chính 08:00-17:30`, `Sáng 06:00-14:00`, `Chiều 14:00-22:00`, `Ca gãy 08:00-21:00`, `Đêm 22:00-06:00`, `Xoá ca`), sau đó **bấm hoặc giữ chuột kéo qua các ô** để xếp lịch cả tuần trong vài giây. Bấm `Esc` để tắt bút.
   - Hỗ trợ nút `+ Mở lối tắt phân ca` để phân ca hàng loạt theo phòng ban.

2. **App Chấm Công Điện Thoại - Mobile PWA (`00:12 - 00:16`)**:
   - Giao diện di động hiển thị lời chào, ca làm trong ngày (`Hành chính · 08:00 - 17:30 · Văn phòng chính`), đồng hồ số thời gian thực (`15:41:39`), nút tròn lớn **Chấm công vào / Chấm công ra** kèm biểu tượng máy ảnh.
   - Tích hợp bản đồ **Leaflet OpenStreetMap** hiển thị trực quan vòng tròn bán kính văn phòng (`150m`) và tự động đối chiếu vị trí GPS (`Trong phạm vi · cách 27 m · GPS ±12 m`).
   - Hỗ trợ xem Mã QR định danh cá nhân, gửi đơn nhanh và xem phiếu lương ngay trên điện thoại.

3. **Cài Đặt 5 Hình Thức Chấm Công (`00:17 - 00:22`)**:
   - **Chấm công tại chỗ bằng GPS** (kèm tuỳ chọn `Yêu cầu chụp ảnh khi chấm`).
   - **Chấm công bằng mã QR** (3 chế độ: `Màn hình tại cửa, mã đổi mỗi 45 giây`, `Mã in ra dán tại cửa`, `Quản lý quét mã trên máy nhân viên`).
   - **Chấm công từ xa cho người làm online**.
   - **Máy chấm công vân tay hoặc khuôn mặt**.
   - **Quản lý chấm công hộ** (ghi tay giờ vào/ra, bắt buộc nhập lý do).

4. **Quản Lý Điểm Danh Thời Gian Thực (`00:23 - 00:26`)**:
   - 4 thẻ lọc trạng thái: `Đúng giờ`, `Đi muộn`, `Chưa chấm (14)`, `Không có ca (35)`.
   - Thẻ theo dõi theo khung giờ ca (`Ca gãy`, `Chiều`, `Đêm`).
   - Nút **Gửi nhắc 14 người chưa chấm** chỉ với 1 cú nhấp chuột.
   - Hỗ trợ modal `Chấm công hộ`, màn hình Kiosk `Mã QR tại cửa` tự động đổi mã mới sau mỗi 45 giây, và `Xuất CSV`.

5. **Đơn Từ, Lịch Nghỉ Công Ty & Số Dư Phép (`00:27 - 00:34`)**:
   - 4 tab: `Đơn của tôi`, `Chờ tôi duyệt` (duyệt nhanh 1 chạm bằng nút `✓` hoặc `✕`), `Lịch nghỉ công ty` (xem trên một trang lịch tháng), `Số dư phép` (tự động tính theo thâm niên: mỗi năm 12 ngày, cứ 5 năm làm việc cộng thêm 1 ngày, phép tồn chuyển tối đa 5 ngày).

6. **Hồ Sơ Nhân Viên, Nhập Excel & Việc Nhận/Trả Việc (`00:35 - 00:43`)**:
   - 4 thẻ KPI: `51 Tổng nhân sự`, `43 Đang làm việc`, `6 Thử việc`, `2 Tạm nghỉ / Đã nghỉ`.
   - Hỗ trợ `Nhập từ Excel (.xlsx/.csv)` và `Xuất CSV`.
   - Modal `HỒ SƠ NHÂN VIÊN` gồm 5 tab: `Thông tin`, `Hợp đồng`, `Tài liệu`, `Nhận & trả việc` (nút `+ Tạo việc nhận người mới` và `+ Tạo việc tiễn người nghỉ` tự dựng sẵn checklist bàn giao và người phụ trách), `Ghi chú`.

7. **Bảng Công Tự Động Tổng Hợp (`00:44 - 00:47`)**:
   - Tự tổng hợp `Công chuẩn (22)`, `Công thực tế`, `Phép`, `Vắng`, `Đi muộn` (số lần & số phút), `OT` (giờ tăng ca) và trạng thái `Đã xác nhận` / `Chờ xác nhận`.

8. **Bảng Lương Theo 5 Bước Tự Động (`00:48 - 00:52`)**:
   - Bước 1: `Tổng hợp bảng công tháng`
   - Bước 2: `Chốt kỳ công`
   - Bước 3: `Khai lương cơ bản` (cảnh báo rõ ai chưa có lương cơ bản)
   - Bước 4: `Tính bảng lương` (tự tính lương theo ngày công, OT, bảo hiểm 10.5%, thuế TNCN và phạt đi muộn theo bậc)
   - Bước 5: `Chốt và phát hành phiếu lương` (tạo PDF phiếu lương & gửi email từng người)

9. **Quy Định Đi Muộn Trừ Theo Bậc (`00:53 - 00:55`)**:
   - Cho phép bỏ qua $N$ lần muộn mỗi tháng và cấu hình bảng bậc thang: `1-15 phút: Nhắc nhở`, `16-30 phút: Trừ tiền 50.000 đ`, `31-60 phút: Trừ tiền 100.000 đ`, `61+ phút: Trừ công 0,5`.

10. **Báo Cáo & Xuất Excel / CSV / PDF (`00:56 - 00:59`)**:
    - 4 thẻ KPI (`499 Công thực tế`, `67 Lượt đi muộn`, `43 Giờ tăng ca`, `524 Bản ghi`), biểu đồ cột diễn biến theo ngày, biểu đồ tròn cơ cấu trạng thái công, hiệu suất theo phòng ban và quỹ lương. Xuất `CSV`, `Excel (.xlsx)`, `PDF` chỉ 1 nút.

11. **Phân Quyền Truy Cập & Nhật Ký Hệ Thống (`01:00 - 01:05`)**:
    - 6 vai trò dựng sẵn (`Quản trị cao nhất`, `Nhân sự`, `Kế toán`, `Quản lý`, `Nhân viên`, `Thiết bị tại cửa`). Mỗi tài khoản chỉ thấy dữ liệu thuộc phạm vi phòng ban của mình. Mọi thao tác sửa đổi đều ghi lại vào `Nhật ký hệ thống`.

12. **Tìm Kiếm Nhanh `Ctrl + K` Không Dấu & Bản Tin Nội Bộ (`01:06 - 01:11`)**:
    - Bấm `Ctrl + K` gõ tiếng Việt không dấu (`minh anh`, `hai an`) vẫn tìm ra chính xác nhân sự, đơn từ, bảng lương.
    - `Bản tin nội bộ` cho phép ghim thông báo quan trọng lên đầu (`📌 Ghim`) và tự động ẩn tin hết hạn.
