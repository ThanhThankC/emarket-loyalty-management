# CarePoint eMarket — Module Quản lý Khách hàng

## Cấu trúc dự án

```
carepoint/
├── app_cskh/    App nhân viên Chăm sóc Khách hàng
├── app_tn/      App Thu Ngân
└── app_kh/      App Khách Hàng
```

## Quy tắc BẮT BUỘC cho toàn nhóm

### 1. KHÔNG dùng emoji/icon Unicode làm trang trí
Không được dùng &#128196; &#10010; &#9750; hay bất kỳ ký tự đặc biệt nào làm icon.
Dùng text thuần tiếng Việt thay thế.

### 2. File shared — KHÔNG ai được sửa
- supabase_config.js
- supabase_api.js
- auth.js
- shared.css

Nếu cần thêm hàm dùng chung, tạo issue/thảo luận với nhóm trước.

### 3. Mỗi người chỉ code file của mình
Xem bảng phân công trong tài liệu dự án.

### 4. Tên class CSS phải có prefix tên chức năng
- ĐÚNG:  .cap-the-preview { }
- SAI:   .preview { }  (có thể trùng với người khác)

### 5. Cách bắt đầu một file JS mới
```js
requireLogin();          // Bắt buộc dòng đầu tiên
const nv = getCurrentNV(); // Lấy info người đang login
```

### 6. Cách gọi Supabase
```js
// Đọc
const data = await sbGet('ten_bang', 'ma_kh=eq.KH001');

// Thêm
const row = await sbInsert('ten_bang', { truong: gia_tri });

// Sửa
await sbUpdate('ten_bang', 'ma=eq.X', { truong: gia_tri_moi });

// Xóa
await sbDelete('ten_bang', 'ma=eq.X');
```

## Phân công

| Chức năng | File | Người phụ trách |
|---|---|---|
| Đăng nhập CSKH | app_cskh/dang_nhap.* | Nguyễn Quốc Bảo |
| Phản hồi & Khiếu nại | app_cskh/phan_hoi.* | Nguyễn Quốc Bảo |
| Quà tặng & Sự kiện | app_cskh/qua_tang.* | Nguyễn Quốc Bảo |
| Quản lý thẻ | app_cskh/quan_ly_the.* | Cù Đình Thanh |
| Cấp thẻ mới | app_cskh/cap_the.* | Cù Đình Thanh |
| Gia hạn thẻ | app_cskh/gia_han.* | Cù Đình Thanh |
| Đổi/Trả hàng | app_cskh/doi_tra.* | Nguyễn Ngọc Bảo |
| Quy đổi điểm (TN) | app_tn/quy_doi_diem.* | Nguyễn Ngọc Bảo |
| Đổi voucher (KH) | app_kh/doi_voucher.* | Nguyễn Ngọc Bảo |
| Hỗ trợ trực tiếp | app_cskh/ho_tro.* | Vũ Đức Linh |
| Khuyến mại (KH) | app_kh/khuyen_mai.* | Vũ Đức Linh |
| Đăng nhập KH | app_kh/dang_nhap.* | Vũ Đức Linh |
| Quản lý KH (TN) | app_tn/khach_hang.* | Lê Trần Nhật Đức |
| Lịch sử hộ khách | app_tn/lich_su_ho.* | Lê Trần Nhật Đức |
| Thông tin cá nhân (KH) | app_kh/thong_tin.* | Lê Trần Nhật Đức |
