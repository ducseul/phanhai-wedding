# Thiệp cưới Phan Hải & Thanh Hoài

GitHub Actions triển khai thư mục `public/` lên GitHub Pages. Tên miền của thiệp là [phanhai-thanhhoai.io.vn](https://phanhai-thanhhoai.io.vn/).

## Google Sheets và Apps Script

1. Tạo bảng tính riêng tư trong Google Sheets. Tạo một dự án Google Apps Script rồi dán nội dung `apps-script/Code.gs` vào tệp mã.
2. Trong **Cài đặt dự án → Thuộc tính tập lệnh**, thêm `SHEET_ID` bằng ID bảng tính. Chạy hàm `setup` từ trình soạn thảo. Hàm này tạo các trang dữ liệu và thư mục Google Drive riêng tư để lưu ảnh.
3. Chọn **Triển khai → Lần triển khai mới → Ứng dụng web**. Chạy với tư cách chủ sở hữu, cho phép **Bất kỳ ai** gọi ứng dụng web. Giữ nguyên chế độ riêng tư của bảng tính và thư mục ảnh.
4. Điền URL triển khai có đuôi `/exec` vào `sheetsEndpoint` trong `public/config.js`, rồi push lên `main`. Khi sửa Apps Script, cập nhật triển khai hiện tại bằng phiên bản mới để giữ nguyên URL.

Chủ thiệp quản lý dữ liệu trực tiếp trong bảng tính:

| Trang tính | Cách dùng |
| --- | --- |
| RSVP | Xem xác nhận, số điện thoại và ghi chú. Có thể tải CSV từ menu Tệp của Google Sheets. |
| Lời chúc | Đặt `status` thành `published` để hiển thị hoặc `hidden` để ẩn. |
| Ảnh khách | Mở ảnh trong thư mục Drive `Thiệp cưới Phan Hải & Thanh Hoài - Ảnh khách`, hoặc nối giá trị cột `file_id` vào `https://drive.google.com/open?id=`. Đặt `status` thành `published` để hiển thị hoặc `hidden` để ẩn. |

Lời chúc và ảnh mới có trạng thái `pending`. Ảnh được chuyển thành JPEG tối đa 600 KB trước khi gửi. Album hiển thị 60 ảnh đã duyệt mới nhất. Trang `/quan-ly/` dẫn chủ thiệp tới Google Sheets để quản lý bằng quyền của tài khoản Google.

## Chỉnh sửa thiệp

- Sửa nội dung, ngày giờ, địa chỉ, nhạc và QR trong `public/config.js`.
- Đặt ảnh gốc vào `anh-goc/`, gồm `bia.jpg`, `phong-bi.jpg`, `cuoi-trang.jpg`, `album/*.jpg` và tùy chọn `og.jpg`. Chạy `npm ci` và `npm run anh` để cập nhật ảnh web.
- Chạy `npm run dev` (cần Python) rồi mở http://127.0.0.1:8788. Thêm `?to=Tên khách` để cá nhân hóa lời mời.
