-- ============================================================
--  CarePoint eMarket — Supabase PostgreSQL Schema
--  Module: Quản lý Khách hàng
--  Phiên bản: 1.0  |  Ngày: 2026-05-19
-- ============================================================
-- THỨ TỰ TẠO BẢNG quan trọng (tránh lỗi FK):
--   1. cau_hinh_hang_thanh_vien
--   2. nhan_vien
--   3. khach_hang
--   4. the_thanh_vien
--   5. don_hang
--   6. lich_su_nang_hang
--   7. lich_su_giao_dich_diem
--   8. chuong_trinh_khuyen_mai
--   9. qua_tang
--  10. lich_su_doi_qua
--  11. voucher
--  12. phan_hoi_khach_hang
--  13. lich_su_ho_tro  (bảng quan hệ N-N: nhân viên ↔ khách hàng)
--  14. lich_su_cap_the (bảng quan hệ: nhân viên cấp thẻ)
--  15. dang_ky_chuong_trinh (bảng quan hệ: KH ↔ CTKM)
-- ============================================================


-- ============================================================
-- 0. EXTENSION & HELPER
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hàm tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 1. CẤU HÌNH HẠNG THÀNH VIÊN  (bảng tham chiếu độc lập)
-- ============================================================
-- Phân tích: tách "Hệ số tích điểm" ra đây thay vì để trong
-- Thẻ thành viên để dễ cập nhật ngưỡng VIP mà không sửa từng thẻ.
-- ============================================================
CREATE TABLE cau_hinh_hang_thanh_vien (
  hang              VARCHAR(20)     PRIMARY KEY,
  -- 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  ten_hien_thi      VARCHAR(50)     NOT NULL,
  diem_toi_thieu    INT             NOT NULL DEFAULT 0,
  he_so_tich_diem   DECIMAL(4,2)   NOT NULL DEFAULT 1.0,
  -- VD: 1.0 = 1đ/10k; 1.5 = 1.5đ/10k
  mo_ta             TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cau_hinh_hang_updated
  BEFORE UPDATE ON cau_hinh_hang_thanh_vien
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 2. NHÂN VIÊN
-- ============================================================
-- Phân tích ERD: "Người xử lý" trong Phản hồi là FK đến đây.
-- Thêm: sdt, email (thiếu trong ERD gốc — cần để liên lạc nội bộ).
-- Vai trò: 'thu_ngan' | 'cskh' | 'quan_ly'
-- ============================================================
CREATE TABLE nhan_vien (
  ma_nv             VARCHAR(10)     PRIMARY KEY,
  -- VD: NV001
  ho_ten            VARCHAR(100)    NOT NULL,
  ngay_sinh         DATE,
  gioi_tinh         VARCHAR(10),
  -- 'Nam' | 'Nu' | 'Khac'
  vai_tro           VARCHAR(20)     NOT NULL,
  ten_dang_nhap     VARCHAR(50)     NOT NULL UNIQUE,
  mat_khau_hash     TEXT            NOT NULL,
  -- Lưu hash (bcrypt), KHÔNG lưu plain text
  sdt               VARCHAR(15),
  email             VARCHAR(100),
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'hoat_dong',
  -- 'hoat_dong' | 'nghi_viec' | 'tam_nghi'
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_nhan_vien_updated
  BEFORE UPDATE ON nhan_vien
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 3. KHÁCH HÀNG
-- ============================================================
-- Phân tích ERD: "Họ và Tên", "Ngày sinh", "Giới tính" nằm
-- lơ lửng trong ERD gốc (thuộc tính quan hệ?) — đưa vào đây
-- là hợp lý nhất vì đây là thông tin cá nhân của KH.
-- ============================================================
CREATE TABLE khach_hang (
  ma_kh             VARCHAR(10)     PRIMARY KEY,
  -- VD: KH00001
  ho_ten            VARCHAR(100)    NOT NULL,
  ngay_sinh         DATE,
  gioi_tinh         VARCHAR(10),
  so_dien_thoai     VARCHAR(15)     NOT NULL UNIQUE,
  email             VARCHAR(100)    UNIQUE,
  dia_chi           TEXT,
  mat_khau_hash     TEXT            NOT NULL,
  ngay_dang_ky      DATE            NOT NULL DEFAULT CURRENT_DATE,
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'hoat_dong',
  -- 'hoat_dong' | 'bi_khoa' | 'da_xoa'
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_khach_hang_updated
  BEFORE UPDATE ON khach_hang
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 4. THẺ THÀNH VIÊN
-- ============================================================
-- Quan hệ 1-1 với KH (UNIQUE trên ma_kh).
-- "Hệ số tích điểm" được kế thừa từ cau_hinh_hang_thanh_vien
-- qua hang — không cần lưu lại ở đây (loại bỏ trường thừa).
-- Thêm: hang (FK → cau_hinh) để biết thẻ đang ở hạng nào.
-- ============================================================
CREATE TABLE the_thanh_vien (
  ma_the            VARCHAR(15)     PRIMARY KEY,
  -- VD: THE000001
  ma_kh             VARCHAR(10)     NOT NULL UNIQUE
                    REFERENCES khach_hang(ma_kh) ON DELETE CASCADE,
  hang              VARCHAR(20)     NOT NULL DEFAULT 'Bronze'
                    REFERENCES cau_hinh_hang_thanh_vien(hang),
  ngay_cap          DATE            NOT NULL DEFAULT CURRENT_DATE,
  ngay_het_han      DATE            NOT NULL,
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'hoat_dong',
  -- 'hoat_dong' | 'het_han' | 'bi_khoa' | 'mat_the'
  so_diem           INT             NOT NULL DEFAULT 0 CHECK (so_diem >= 0),
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_the_thanh_vien_updated
  BEFORE UPDATE ON the_thanh_vien
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 5. ĐƠN HÀNG
-- ============================================================
-- Thêm: ma_nv_thu_ngan để biết thu ngân nào xử lý đơn.
-- "Điểm đã dùng" = số điểm KH quy đổi khi thanh toán đơn này.
-- ============================================================
CREATE TABLE don_hang (
  ma_don_hang       VARCHAR(15)     PRIMARY KEY,
  -- VD: DH20250519001
  ma_kh             VARCHAR(10)     NOT NULL
                    REFERENCES khach_hang(ma_kh),
  ma_nv_thu_ngan    VARCHAR(10)
                    REFERENCES nhan_vien(ma_nv),
  ngay_mua          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  tong_tien         DECIMAL(15,0)   NOT NULL CHECK (tong_tien >= 0),
  diem_da_dung      INT             NOT NULL DEFAULT 0 CHECK (diem_da_dung >= 0),
  -- Điểm KH tiêu để giảm giá đơn này
  diem_duoc_cong    INT             NOT NULL DEFAULT 0,
  -- Điểm được tích sau đơn này
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'hoan_thanh',
  -- 'hoan_thanh' | 'da_huy' | 'dang_xu_ly' | 'da_doi_tra'
  ghi_chu           TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_don_hang_updated
  BEFORE UPDATE ON don_hang
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 6. LỊCH SỬ NÂNG HẠNG
-- ============================================================
CREATE TABLE lich_su_nang_hang (
  ma_ls             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_kh             VARCHAR(10)     NOT NULL
                    REFERENCES khach_hang(ma_kh),
  hang_cu           VARCHAR(20)     NOT NULL,
  hang_moi          VARCHAR(20)     NOT NULL,
  ngay_nang         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  tong_chi_tieu     DECIMAL(15,0),
  -- Tổng chi tiêu tại thời điểm nâng hạng
  ghi_chu           TEXT
);


-- ============================================================
-- 7. LỊCH SỬ GIAO DỊCH ĐIỂM
-- ============================================================
-- Phân tích: ERD có quan hệ ĐơnHàng (n)—(1) LịchSửGDĐiểm
-- tức 1 giao dịch có thể thuộc về 1 đơn hàng (nullable).
-- Quan hệ ThẻTV (1)—(n) LịchSửGDĐiểm: bắt buộc có ma_the.
-- Loại GD: 'tich_diem' | 'tieu_diem' | 'doi_qua' | 'het_han' | 'dieu_chinh'
-- ============================================================
CREATE TABLE lich_su_giao_dich_diem (
  ma_gd             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_the            VARCHAR(15)     NOT NULL
                    REFERENCES the_thanh_vien(ma_the),
  ma_don_hang       VARCHAR(15)
                    REFERENCES don_hang(ma_don_hang),
  -- NULL nếu là giao dịch đổi quà, điều chỉnh tay...
  loai_gd           VARCHAR(20)     NOT NULL,
  so_diem           INT             NOT NULL,
  -- Dương = cộng điểm, Âm = trừ điểm
  so_du_sau_gd      INT             NOT NULL,
  -- Số dư sau giao dịch (dễ tra cứu)
  ngay_gd           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  ghi_chu           TEXT
);


-- ============================================================
-- 8. CHƯƠNG TRÌNH KHUYẾN MẠI
-- ============================================================
-- Loại: 'giam_gia' | 'tang_qua' | 'tich_diem_bo' | 'su_kien'
-- ============================================================
CREATE TABLE chuong_trinh_khuyen_mai (
  ma_chuong_trinh   VARCHAR(15)     PRIMARY KEY,
  ten_chuong_trinh  VARCHAR(200)    NOT NULL,
  loai              VARCHAR(30)     NOT NULL,
  dieu_kien_ap_dung TEXT,
  -- Mô tả điều kiện (VD: "Đơn từ 500k", "Hạng Gold trở lên")
  hang_toi_thieu    VARCHAR(20)
                    REFERENCES cau_hinh_hang_thanh_vien(hang),
  -- NULL = áp dụng tất cả hạng
  ngay_bat_dau      DATE            NOT NULL,
  ngay_ket_thuc     DATE            NOT NULL,
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'hoat_dong',
  -- 'hoat_dong' | 'tam_dung' | 'ket_thuc'
  mo_ta             TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CHECK (ngay_ket_thuc > ngay_bat_dau)
);

CREATE TRIGGER trg_ctkm_updated
  BEFORE UPDATE ON chuong_trinh_khuyen_mai
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 9. QUÀ TẶNG
-- ============================================================
-- Thêm FK ma_chuong_trinh (nullable) — một quà có thể thuộc
-- 1 chương trình hoặc là quà đổi điểm thường xuyên.
-- Loại: 'voucher_giam_gia' | 'qua_hien_vat' | 'uu_dai_dich_vu'
-- ============================================================
CREATE TABLE qua_tang (
  ma_qua            VARCHAR(15)     PRIMARY KEY,
  ten_qua           VARCHAR(200)    NOT NULL,
  loai              VARCHAR(30)     NOT NULL,
  so_diem_quy_doi   INT             NOT NULL CHECK (so_diem_quy_doi > 0),
  so_luong_ton      INT             NOT NULL DEFAULT 0 CHECK (so_luong_ton >= 0),
  gia_tri           DECIMAL(15,0),
  -- Giá trị quy đổi thực tế (VD: voucher 50k)
  thoi_han_voucher  INT,
  -- Số ngày hiệu lực nếu là voucher (NULL = không áp dụng)
  ma_chuong_trinh   VARCHAR(15)
                    REFERENCES chuong_trinh_khuyen_mai(ma_chuong_trinh),
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'hoat_dong',
  -- 'hoat_dong' | 'het_hang' | 'ngung_cung_cap'
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_qua_tang_updated
  BEFORE UPDATE ON qua_tang
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 10. LỊCH SỬ ĐỔI QUÀ
-- ============================================================
-- Quan hệ: KH(1)—(n) LịchSửĐổiQuà; ThẻTV(1)—(n) LịchSửĐổiQuà
-- LịchSửĐổiQuà(n)—(1) QuàTặng
-- LịchSửĐổiQuà(1)—(0..1) Voucher (tạo sau khi insert)
-- ============================================================
CREATE TABLE lich_su_doi_qua (
  ma_doi            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_the            VARCHAR(15)     NOT NULL
                    REFERENCES the_thanh_vien(ma_the),
  ma_qua            VARCHAR(15)     NOT NULL
                    REFERENCES qua_tang(ma_qua),
  so_luong          INT             NOT NULL DEFAULT 1 CHECK (so_luong > 0),
  so_diem_da_dung   INT             NOT NULL CHECK (so_diem_da_dung > 0),
  ngay_doi          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'cho_nhan',
  -- 'cho_nhan' | 'da_nhan' | 'da_huy'
  ghi_chu           TEXT
  -- ma_voucher sẽ được thêm sau khi bảng voucher tồn tại
);


-- ============================================================
-- 11. VOUCHER
-- ============================================================
-- Voucher được tạo ra TỪ lịch sử đổi quà (nếu quà là voucher).
-- Thêm FK ngược lại vào lich_su_doi_qua sau khi tạo bảng này.
-- ============================================================
CREATE TABLE voucher (
  ma_voucher        VARCHAR(20)     PRIMARY KEY,
  -- VD: VCR20250519001
  ma_doi            UUID
                    REFERENCES lich_su_doi_qua(ma_doi),
  -- NULL = voucher phát từ chương trình (không qua đổi điểm)
  ma_kh             VARCHAR(10)     NOT NULL
                    REFERENCES khach_hang(ma_kh),
  gia_tri_giam      DECIMAL(15,0)   NOT NULL,
  -- Số tiền giảm (VD: 50000)
  ngay_het_han      DATE            NOT NULL,
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'chua_dung',
  -- 'chua_dung' | 'da_dung' | 'het_han' | 'da_huy'
  ma_qr             TEXT,
  -- Chuỗi QR encode (có thể là URL hoặc JSON)
  ma_don_hang_dung  VARCHAR(15)
                    REFERENCES don_hang(ma_don_hang),
  -- Đơn hàng đã sử dụng voucher này (NULL nếu chưa dùng)
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Thêm FK ma_voucher vào lich_su_doi_qua (sau khi đã tạo bảng voucher)
ALTER TABLE lich_su_doi_qua
  ADD COLUMN ma_voucher VARCHAR(20)
  REFERENCES voucher(ma_voucher);


-- ============================================================
-- 12. PHẢN HỒI KHÁCH HÀNG
-- ============================================================
-- "Người xử lý" trong ERD gốc = FK đến nhan_vien.
-- Loại: 'khieu_nai' | 'gop_y' | 'yeu_cau_ho_tro' | 'doi_tra'
-- Trạng thái: 'moi' | 'dang_xu_ly' | 'cho_phan_hoi' | 'da_xu_ly' | 'da_chuyen'
-- ============================================================
CREATE TABLE phan_hoi_khach_hang (
  ma_phan_hoi       UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_kh             VARCHAR(10)     NOT NULL
                    REFERENCES khach_hang(ma_kh),
  ma_nv_xu_ly       VARCHAR(10)
                    REFERENCES nhan_vien(ma_nv),
  -- NULL = chưa có người nhận xử lý
  loai              VARCHAR(30)     NOT NULL,
  noi_dung          TEXT            NOT NULL,
  trang_thai        VARCHAR(30)     NOT NULL DEFAULT 'moi',
  uu_tien           VARCHAR(10)     NOT NULL DEFAULT 'thuong',
  -- 'cao' | 'thuong' | 'thap'
  thoi_gian_gui     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  thoi_gian_xu_ly   TIMESTAMPTZ,
  ket_qua_xu_ly     TEXT,
  ma_don_hang_lq    VARCHAR(15)
                    REFERENCES don_hang(ma_don_hang),
  -- Đơn hàng liên quan (nếu KN về đơn hàng cụ thể)
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_phan_hoi_updated
  BEFORE UPDATE ON phan_hoi_khach_hang
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 13. LỊCH SỬ HỖ TRỢ  (bảng quan hệ N-N: NV ↔ KH)
-- ============================================================
-- ERD: Nhân viên(1)—lịch sử hỗ trợ—(n) Khách hàng
-- Thuộc tính quan hệ: loại hỗ trợ, ngày giờ, nội dung, kết quả
-- ============================================================
CREATE TABLE lich_su_ho_tro (
  ma_ho_tro         UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_nv             VARCHAR(10)     NOT NULL
                    REFERENCES nhan_vien(ma_nv),
  ma_kh             VARCHAR(10)     NOT NULL
                    REFERENCES khach_hang(ma_kh),
  loai_ho_tro       VARCHAR(50)     NOT NULL,
  -- 'cap_lai_the' | 'tu_van' | 'nhan_qua' | 'xu_ly_khieu_nai' | 'khac'
  ngay_gio          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  noi_dung          TEXT,
  ket_qua           TEXT,
  ma_phan_hoi_lq    UUID
                    REFERENCES phan_hoi_khach_hang(ma_phan_hoi)
  -- Gắn với phản hồi cụ thể nếu có
);


-- ============================================================
-- 14. LỊCH SỬ CẤP THẺ  (bảng quan hệ: NV cấp Thẻ cho KH)
-- ============================================================
-- ERD: Nhân viên(1)—cấp—(n) Thẻ thành viên
-- Thuộc tính: ngày thực hiện, lý do, loại sự kiện
-- Loại sự kiện: 'cap_moi' | 'cap_lai' | 'gia_han' | 'khoa' | 'mo_khoa'
-- ============================================================
CREATE TABLE lich_su_cap_the (
  ma_ls_cap_the     UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_nv             VARCHAR(10)     NOT NULL
                    REFERENCES nhan_vien(ma_nv),
  ma_the            VARCHAR(15)     NOT NULL
                    REFERENCES the_thanh_vien(ma_the),
  loai_su_kien      VARCHAR(20)     NOT NULL,
  ngay_thuc_hien    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  ly_do             TEXT,
  ngay_het_han_moi  DATE
  -- Ngày hết hạn mới (dùng cho gia hạn)
);


-- ============================================================
-- 15. ĐĂNG KÝ CHƯƠNG TRÌNH  (bảng quan hệ: KH ↔ CTKM)
-- ============================================================
-- ERD: Khách hàng(1)—đăng ký—(n) Chương trình KM
-- Thuộc tính: Mã ĐK, Trạng thái, Ngày đăng ký
-- ============================================================
CREATE TABLE dang_ky_chuong_trinh (
  ma_dk             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_kh             VARCHAR(10)     NOT NULL
                    REFERENCES khach_hang(ma_kh),
  ma_chuong_trinh   VARCHAR(15)     NOT NULL
                    REFERENCES chuong_trinh_khuyen_mai(ma_chuong_trinh),
  ngay_dang_ky      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  trang_thai        VARCHAR(20)     NOT NULL DEFAULT 'dang_tham_gia',
  -- 'dang_tham_gia' | 'da_ket_thuc' | 'da_huy'
  UNIQUE (ma_kh, ma_chuong_trinh)
  -- Mỗi KH chỉ đăng ký 1 lần mỗi chương trình
);


-- ============================================================
-- INDEX (tăng hiệu năng truy vấn thường dùng)
-- ============================================================
CREATE INDEX idx_kh_sdt       ON khach_hang(so_dien_thoai);
CREATE INDEX idx_kh_email     ON khach_hang(email);
CREATE INDEX idx_the_ma_kh    ON the_thanh_vien(ma_kh);
CREATE INDEX idx_dh_ma_kh     ON don_hang(ma_kh);
CREATE INDEX idx_dh_ngay      ON don_hang(ngay_mua DESC);
CREATE INDEX idx_gd_ma_the    ON lich_su_giao_dich_diem(ma_the);
CREATE INDEX idx_gd_ngay      ON lich_su_giao_dich_diem(ngay_gd DESC);
CREATE INDEX idx_ph_trang_thai ON phan_hoi_khach_hang(trang_thai);
CREATE INDEX idx_ph_ma_kh     ON phan_hoi_khach_hang(ma_kh);
CREATE INDEX idx_voucher_kh   ON voucher(ma_kh);


-- ============================================================
-- ============================================================
--  DỮ LIỆU MẪU
-- ============================================================
-- ============================================================


-- 1. Hạng thành viên
INSERT INTO cau_hinh_hang_thanh_vien (hang, ten_hien_thi, diem_toi_thieu, he_so_tich_diem, mo_ta) VALUES
('Bronze',   'Đồng',    0,     1.0,  'Hạng cơ bản, tích 1 điểm/10.000đ'),
('Silver',   'Bạc',     1000,  1.2,  'Tích 1.2 điểm/10.000đ, ưu đãi sinh nhật'),
('Gold',     'Vàng',    5000,  1.5,  'Tích 1.5 điểm/10.000đ, miễn phí giao hàng'),
('Platinum', 'Bạch Kim',15000, 2.0,  'Tích 2 điểm/10.000đ, quản lý riêng');


-- 2. Nhân viên
INSERT INTO nhan_vien (ma_nv, ho_ten, ngay_sinh, gioi_tinh, vai_tro, ten_dang_nhap, mat_khau_hash, sdt, email) VALUES
('NV001', 'Trần Hương',     '1995-03-12', 'Nu',  'cskh',     'tran.huong',    '$2b$10$examplehash001', '0901111001', 'huong.tran@carepoint.vn'),
('NV002', 'Nguyễn Minh Tú', '1993-07-25', 'Nam', 'thu_ngan', 'nguyen.tu',     '$2b$10$examplehash002', '0901111002', 'tu.nguyen@carepoint.vn'),
('NV003', 'Lê Thị Mai',     '1998-11-08', 'Nu',  'cskh',     'le.mai',        '$2b$10$examplehash003', '0901111003', 'mai.le@carepoint.vn'),
('NV004', 'Phạm Văn Hùng',  '1990-05-20', 'Nam', 'quan_ly',  'pham.hung',     '$2b$10$examplehash004', '0901111004', 'hung.pham@carepoint.vn'),
('NV005', 'Vũ Thu Trang',   '1997-09-15', 'Nu',  'thu_ngan', 'vu.trang',      '$2b$10$examplehash005', '0901111005', 'trang.vu@carepoint.vn');


-- 3. Khách hàng
INSERT INTO khach_hang (ma_kh, ho_ten, ngay_sinh, gioi_tinh, so_dien_thoai, email, dia_chi, mat_khau_hash, ngay_dang_ky) VALUES
('KH00001', 'Nguyễn Văn An',    '1988-04-15', 'Nam', '0912001001', 'an.nguyen@gmail.com',     '12 Lê Lợi, Q1, TP.HCM',          '$2b$10$khash001', '2023-01-10'),
('KH00002', 'Trần Thị Bình',    '1992-08-22', 'Nu',  '0912001002', 'binh.tran@gmail.com',     '45 Nguyễn Huệ, Q1, TP.HCM',       '$2b$10$khash002', '2023-02-14'),
('KH00003', 'Lê Minh Châu',     '1985-12-05', 'Nam', '0912001003', 'chau.le@yahoo.com',       '78 Hai Bà Trưng, Q3, TP.HCM',     '$2b$10$khash003', '2023-03-20'),
('KH00004', 'Phạm Quốc Dũng',   '1995-06-18', 'Nam', '0912001004', 'dung.pham@gmail.com',     '23 Điện Biên Phủ, Q.BT, TP.HCM',  '$2b$10$khash004', '2023-04-05'),
('KH00005', 'Võ Thị Hoa',       '1990-02-28', 'Nu',  '0912001005', 'hoa.vo@hotmail.com',      '56 Cách Mạng Tháng 8, Q.TB',       '$2b$10$khash005', '2023-05-11'),
('KH00006', 'Đặng Văn Khánh',   '1983-10-10', 'Nam', '0912001006', 'khanh.dang@gmail.com',    '90 Lý Thường Kiệt, Q.TB, TP.HCM', '$2b$10$khash006', '2023-06-01'),
('KH00007', 'Hoàng Thị Lan',    '1998-03-30', 'Nu',  '0912001007', 'lan.hoang@gmail.com',     '34 Phan Xích Long, Q.PN, TP.HCM', '$2b$10$khash007', '2024-01-15'),
('KH00008', 'Bùi Thanh Minh',   '1987-07-07', 'Nam', '0912001008', 'minh.bui@gmail.com',      '67 Nơ Trang Long, Q.BT, TP.HCM',  '$2b$10$khash008', '2024-02-20');


-- 4. Thẻ thành viên
INSERT INTO the_thanh_vien (ma_the, ma_kh, hang, ngay_cap, ngay_het_han, trang_thai, so_diem) VALUES
('THE000001', 'KH00001', 'Gold',     '2023-01-10', '2025-01-10', 'het_han',    6200),
('THE000002', 'KH00002', 'Silver',   '2023-02-14', '2026-02-14', 'hoat_dong',  1450),
('THE000003', 'KH00003', 'Platinum', '2023-03-20', '2026-03-20', 'hoat_dong',  18300),
('THE000004', 'KH00004', 'Bronze',   '2023-04-05', '2026-04-05', 'hoat_dong',  320),
('THE000005', 'KH00005', 'Gold',     '2023-05-11', '2026-05-11', 'bi_khoa',    5800),
('THE000006', 'KH00006', 'Silver',   '2023-06-01', '2026-06-01', 'hoat_dong',  2100),
('THE000007', 'KH00007', 'Bronze',   '2024-01-15', '2027-01-15', 'hoat_dong',  180),
('THE000008', 'KH00008', 'Gold',     '2024-02-20', '2027-02-20', 'hoat_dong',  7100);


-- 5. Đơn hàng
INSERT INTO don_hang (ma_don_hang, ma_kh, ma_nv_thu_ngan, ngay_mua, tong_tien, diem_da_dung, diem_duoc_cong, trang_thai) VALUES
('DH2025001', 'KH00001', 'NV002', '2025-01-15 09:30:00', 850000,  0,   85,  'hoan_thanh'),
('DH2025002', 'KH00002', 'NV002', '2025-02-10 14:20:00', 1200000, 100, 132, 'hoan_thanh'),
('DH2025003', 'KH00003', 'NV005', '2025-03-05 10:15:00', 3500000, 0,   525, 'hoan_thanh'),
('DH2025004', 'KH00004', 'NV002', '2025-03-20 16:45:00', 250000,  0,   25,  'hoan_thanh'),
('DH2025005', 'KH00001', 'NV005', '2025-04-08 11:00:00', 670000,  50,  72,  'hoan_thanh'),
('DH2025006', 'KH00002', 'NV002', '2025-04-22 09:00:00', 980000,  0,   0,   'da_doi_tra'),
('DH2025007', 'KH00003', 'NV005', '2025-05-01 13:30:00', 2100000, 200, 285, 'hoan_thanh'),
('DH2025008', 'KH00008', 'NV002', '2025-05-19 10:00:00', 1500000, 0,   225, 'hoan_thanh');


-- 6. Lịch sử nâng hạng
INSERT INTO lich_su_nang_hang (ma_kh, hang_cu, hang_moi, ngay_nang, tong_chi_tieu) VALUES
('KH00001', 'Bronze', 'Silver',   '2023-03-15', 1000000),
('KH00001', 'Silver', 'Gold',     '2023-08-20', 5000000),
('KH00003', 'Bronze', 'Silver',   '2023-05-10', 1000000),
('KH00003', 'Silver', 'Gold',     '2023-09-01', 5000000),
('KH00003', 'Gold',   'Platinum', '2024-02-15', 15000000),
('KH00008', 'Bronze', 'Silver',   '2024-06-10', 1000000),
('KH00008', 'Silver', 'Gold',     '2024-11-20', 5000000);


-- 7. Lịch sử giao dịch điểm
INSERT INTO lich_su_giao_dich_diem (ma_the, ma_don_hang, loai_gd, so_diem, so_du_sau_gd, ngay_gd, ghi_chu) VALUES
('THE000001', 'DH2025001', 'tich_diem', +85,   85,   '2025-01-15 09:35:00', 'Tích điểm đơn DH2025001'),
('THE000001', 'DH2025005', 'tieu_diem', -50,   35,   '2025-04-08 11:05:00', 'Quy đổi điểm thanh toán'),
('THE000001', 'DH2025005', 'tich_diem', +72,   107,  '2025-04-08 11:05:00', 'Tích điểm đơn DH2025005'),
('THE000002', 'DH2025002', 'tieu_diem', -100,  1350, '2025-02-10 14:25:00', 'Quy đổi điểm thanh toán'),
('THE000002', 'DH2025002', 'tich_diem', +132,  1482, '2025-02-10 14:25:00', 'Tích điểm đơn DH2025002'),
('THE000003', 'DH2025003', 'tich_diem', +525,  525,  '2025-03-05 10:20:00', 'Tích điểm đơn DH2025003'),
('THE000003', NULL,         'doi_qua',  -200,  325,  '2025-03-10 14:00:00', 'Đổi voucher giảm giá 50k'),
('THE000003', 'DH2025007', 'tieu_diem', -200,  125,  '2025-05-01 13:35:00', 'Quy đổi điểm thanh toán'),
('THE000003', 'DH2025007', 'tich_diem', +285,  410,  '2025-05-01 13:35:00', 'Tích điểm đơn DH2025007');


-- 8. Chương trình khuyến mại
INSERT INTO chuong_trinh_khuyen_mai (ma_chuong_trinh, ten_chuong_trinh, loai, dieu_kien_ap_dung, hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES
('CTKM001', 'Mừng hè 2025 — Tích gấp đôi',         'tich_diem_bo', 'Đơn từ 500.000đ',           NULL,     '2025-06-01', '2025-08-31', 'hoat_dong'),
('CTKM002', 'Ưu đãi hạng Vàng Q2/2025',             'tang_qua',     'Hạng Gold trở lên',          'Gold',   '2025-04-01', '2025-06-30', 'ket_thuc'),
('CTKM003', 'Flash Sale — Sinh nhật CarePoint',     'giam_gia',     'Đơn từ 300.000đ',            NULL,     '2025-05-15', '2025-05-20', 'hoat_dong'),
('CTKM004', 'Platinum Exclusive — Tháng 5',         'su_kien',      'Chỉ dành cho hạng Platinum', 'Platinum','2025-05-01', '2025-05-31', 'hoat_dong');


-- 9. Quà tặng
INSERT INTO qua_tang (ma_qua, ten_qua, loai, so_diem_quy_doi, so_luong_ton, gia_tri, thoi_han_voucher, ma_chuong_trinh, trang_thai) VALUES
('QUA001', 'Voucher giảm 50.000đ',         'voucher_giam_gia', 200,  500, 50000,  30,  NULL,     'hoat_dong'),
('QUA002', 'Voucher giảm 100.000đ',        'voucher_giam_gia', 350,  300, 100000, 30,  NULL,     'hoat_dong'),
('QUA003', 'Voucher giảm 200.000đ',        'voucher_giam_gia', 600,  150, 200000, 45,  NULL,     'hoat_dong'),
('QUA004', 'Bình giữ nhiệt CarePoint',     'qua_hien_vat',     800,  50,  250000, NULL,'CTKM002','hoat_dong'),
('QUA005', 'Túi vải thân thiện môi trường','qua_hien_vat',     300,  200, 80000,  NULL, NULL,    'hoat_dong'),
('QUA006', 'Miễn phí giao hàng 3 đơn',     'uu_dai_dich_vu',   500,  999, 60000,  60,  'CTKM001','hoat_dong'),
('QUA007', 'Voucher giảm 500.000đ (Platinum)','voucher_giam_gia',1500, 30, 500000, 60,  'CTKM004','hoat_dong');


-- 10. Lịch sử đổi quà
INSERT INTO lich_su_doi_qua (ma_the, ma_qua, so_luong, so_diem_da_dung, ngay_doi, trang_thai) VALUES
('THE000003', 'QUA001', 1, 200, '2025-03-10 14:00:00', 'da_nhan'),
('THE000002', 'QUA001', 1, 200, '2025-04-05 10:30:00', 'da_nhan'),
('THE000008', 'QUA002', 1, 350, '2025-05-10 15:00:00', 'cho_nhan'),
('THE000003', 'QUA004', 1, 800, '2025-05-12 09:00:00', 'cho_nhan');


-- 11. Voucher
INSERT INTO voucher (ma_voucher, ma_doi, ma_kh, gia_tri_giam, ngay_het_han, trang_thai, ma_qr) VALUES
('VCR2025001', NULL,                                  'KH00003', 50000,  '2025-04-09', 'da_dung',  'QR_KH00003_50K_001'),
('VCR2025002', NULL,                                  'KH00002', 50000,  '2025-05-05', 'het_han',  'QR_KH00002_50K_002'),
('VCR2025003', NULL,                                  'KH00008', 100000, '2025-06-09', 'chua_dung', 'QR_KH00008_100K_003');

-- Cập nhật ma_voucher vào lịch sử đổi quà
UPDATE lich_su_doi_qua SET ma_voucher = 'VCR2025001' WHERE ma_the = 'THE000003' AND ngay_doi = '2025-03-10 14:00:00';
UPDATE lich_su_doi_qua SET ma_voucher = 'VCR2025002' WHERE ma_the = 'THE000002' AND ngay_doi = '2025-04-05 10:30:00';
UPDATE lich_su_doi_qua SET ma_voucher = 'VCR2025003' WHERE ma_the = 'THE000008' AND ngay_doi = '2025-05-10 15:00:00';


-- 12. Phản hồi khách hàng
INSERT INTO phan_hoi_khach_hang (ma_kh, ma_nv_xu_ly, loai, noi_dung, trang_thai, uu_tien, thoi_gian_gui, ma_don_hang_lq) VALUES
('KH00001', 'NV001', 'khieu_nai',     'Điểm tích lũy chưa được cộng sau mua hàng DH2025001', 'da_xu_ly',       'cao',   '2025-01-16 08:00:00', 'DH2025001'),
('KH00002', 'NV001', 'yeu_cau_ho_tro','Yêu cầu đổi sản phẩm lỗi — đã mua 10 ngày',           'dang_xu_ly',     'cao',   '2025-04-23 09:30:00', 'DH2025006'),
('KH00003', NULL,    'khieu_nai',     'Không nhận được voucher sau khi đổi điểm',              'cho_phan_hoi',   'thuong','2025-03-11 10:00:00', NULL),
('KH00004', 'NV003', 'gop_y',         'Hỏi về điều kiện nâng hạng thẻ VIP',                   'da_xu_ly',       'thap',  '2025-03-21 14:00:00', NULL),
('KH00005', 'NV001', 'khieu_nai',     'Thẻ thành viên bị khóa không rõ lý do',                'da_chuyen',      'cao',   '2025-04-01 11:00:00', NULL),
('KH00001', NULL,    'gop_y',         'Đề xuất thêm tính năng lịch sử mua hàng trong app',    'moi',            'thap',  '2025-05-18 16:00:00', NULL);


-- 13. Lịch sử hỗ trợ
INSERT INTO lich_su_ho_tro (ma_nv, ma_kh, loai_ho_tro, ngay_gio, noi_dung, ket_qua) VALUES
('NV001', 'KH00001', 'xu_ly_khieu_nai', '2025-01-17 09:00:00', 'Kiểm tra hệ thống tích điểm đơn DH2025001', 'Đã cộng bù 85 điểm vào tài khoản'),
('NV001', 'KH00005', 'cap_lai_the',     '2025-04-02 10:00:00', 'KH yêu cầu mở khóa thẻ bị khóa',           'Chuyển cấp trên xử lý'),
('NV003', 'KH00004', 'tu_van',          '2025-03-21 14:15:00', 'Tư vấn điều kiện nâng hạng Gold',          'Đã giải thích cần 5000 điểm hoặc 5tr chi tiêu'),
('NV001', 'KH00002', 'xu_ly_khieu_nai', '2025-04-24 10:00:00', 'Tiếp nhận yêu cầu đổi trả đơn DH2025006', 'Đang xác nhận với kho hàng');


-- 14. Lịch sử cấp thẻ
INSERT INTO lich_su_cap_the (ma_nv, ma_the, loai_su_kien, ngay_thuc_hien, ly_do) VALUES
('NV001', 'THE000001', 'cap_moi',  '2023-01-10', 'Đăng ký thành viên mới'),
('NV001', 'THE000002', 'cap_moi',  '2023-02-14', 'Đăng ký thành viên mới'),
('NV003', 'THE000003', 'cap_moi',  '2023-03-20', 'Đăng ký thành viên mới'),
('NV001', 'THE000005', 'khoa',     '2025-04-01', 'Khóa thẻ do nghi ngờ gian lận'),
('NV004', 'THE000001', 'gia_han',  '2025-01-12', 'Gia hạn thẻ thêm 2 năm cho KH VIP'),
('NV001', 'THE000007', 'cap_moi',  '2024-01-15', 'Đăng ký thành viên mới');


-- 15. Đăng ký chương trình
INSERT INTO dang_ky_chuong_trinh (ma_kh, ma_chuong_trinh, trang_thai) VALUES
('KH00001', 'CTKM001', 'dang_tham_gia'),
('KH00002', 'CTKM001', 'dang_tham_gia'),
('KH00003', 'CTKM001', 'dang_tham_gia'),
('KH00003', 'CTKM002', 'da_ket_thuc'),
('KH00003', 'CTKM004', 'dang_tham_gia'),
('KH00005', 'CTKM002', 'da_ket_thuc'),
('KH00008', 'CTKM002', 'da_ket_thuc'),
('KH00008', 'CTKM001', 'dang_tham_gia');


-- ============================================================
-- ============================================================
--  CÂU TRUY VẤN DEMO
-- ============================================================
-- ============================================================


-- ============================================================
-- Q1. [App Thu Ngân] Tra cứu khách hàng bằng SĐT
--     → Hiện thông tin + hạng thẻ + điểm hiện tại
-- ============================================================
SELECT
  kh.ma_kh,
  kh.ho_ten,
  kh.so_dien_thoai,
  kh.email,
  ttv.ma_the,
  ttv.hang,
  ch.ten_hien_thi        AS ten_hang,
  ttv.so_diem,
  ttv.ngay_het_han,
  ttv.trang_thai         AS trang_thai_the
FROM khach_hang kh
JOIN the_thanh_vien ttv ON kh.ma_kh = ttv.ma_kh
JOIN cau_hinh_hang_thanh_vien ch ON ttv.hang = ch.hang
WHERE kh.so_dien_thoai = '0912001003';


-- ============================================================
-- Q2. [App Thu Ngân] Tính điểm được cộng sau đơn hàng
--     → Công thức: FLOOR(tong_tien / 10000) * he_so_tich_diem
-- ============================================================
SELECT
  dh.ma_don_hang,
  kh.ho_ten,
  dh.tong_tien,
  ch.he_so_tich_diem,
  FLOOR(dh.tong_tien / 10000.0 * ch.he_so_tich_diem) AS diem_se_cong
FROM don_hang dh
JOIN khach_hang kh ON dh.ma_kh = kh.ma_kh
JOIN the_thanh_vien ttv ON kh.ma_kh = ttv.ma_kh
JOIN cau_hinh_hang_thanh_vien ch ON ttv.hang = ch.hang
WHERE dh.ma_don_hang = 'DH2025008';


-- ============================================================
-- Q3. [App CSKH] Danh sách phản hồi chờ xử lý, sắp xếp ưu tiên
-- ============================================================
SELECT
  ph.ma_phan_hoi,
  kh.ho_ten,
  kh.so_dien_thoai,
  ph.loai,
  ph.noi_dung,
  ph.uu_tien,
  ph.trang_thai,
  ph.thoi_gian_gui,
  nv.ho_ten              AS nhan_vien_xu_ly
FROM phan_hoi_khach_hang ph
JOIN khach_hang kh ON ph.ma_kh = kh.ma_kh
LEFT JOIN nhan_vien nv ON ph.ma_nv_xu_ly = nv.ma_nv
WHERE ph.trang_thai IN ('moi', 'dang_xu_ly', 'cho_phan_hoi')
ORDER BY
  CASE ph.uu_tien WHEN 'cao' THEN 1 WHEN 'thuong' THEN 2 ELSE 3 END,
  ph.thoi_gian_gui ASC;


-- ============================================================
-- Q4. [App CSKH] Lịch sử hộ khách hàng (giao dịch điểm)
-- ============================================================
SELECT
  gd.ngay_gd,
  gd.loai_gd,
  gd.so_diem,
  gd.so_du_sau_gd,
  gd.ma_don_hang,
  gd.ghi_chu
FROM lich_su_giao_dich_diem gd
JOIN the_thanh_vien ttv ON gd.ma_the = ttv.ma_the
WHERE ttv.ma_kh = 'KH00003'
ORDER BY gd.ngay_gd DESC;


-- ============================================================
-- Q5. [App Khách Hàng] Thông tin cá nhân + điểm + hạng
-- ============================================================
SELECT
  kh.ma_kh,
  kh.ho_ten,
  kh.email,
  kh.so_dien_thoai,
  ttv.hang,
  ch.ten_hien_thi        AS ten_hang,
  ttv.so_diem,
  ttv.ngay_het_han,
  -- Điểm cần thêm để lên hạng tiếp theo
  (SELECT MIN(ch2.diem_toi_thieu)
   FROM cau_hinh_hang_thanh_vien ch2
   WHERE ch2.diem_toi_thieu > ttv.so_diem
  ) - ttv.so_diem        AS diem_can_de_len_hang
FROM khach_hang kh
JOIN the_thanh_vien ttv ON kh.ma_kh = ttv.ma_kh
JOIN cau_hinh_hang_thanh_vien ch ON ttv.hang = ch.hang
WHERE kh.ma_kh = 'KH00003';


-- ============================================================
-- Q6. [App Khách Hàng] Danh sách quà có thể đổi theo số điểm
-- ============================================================
SELECT
  qt.ma_qua,
  qt.ten_qua,
  qt.loai,
  qt.so_diem_quy_doi,
  qt.so_luong_ton,
  qt.gia_tri,
  qt.thoi_han_voucher
FROM qua_tang qt
WHERE qt.trang_thai = 'hoat_dong'
  AND qt.so_luong_ton > 0
  AND qt.so_diem_quy_doi <= (
    SELECT ttv.so_diem
    FROM the_thanh_vien ttv
    WHERE ttv.ma_kh = 'KH00003'
  )
ORDER BY qt.so_diem_quy_doi DESC;


-- ============================================================
-- Q7. [App CSKH] Dashboard — thống kê hôm nay
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM phan_hoi_khach_hang
   WHERE DATE(thoi_gian_gui) = CURRENT_DATE)              AS tong_phan_hoi_hom_nay,

  (SELECT COUNT(*) FROM phan_hoi_khach_hang
   WHERE trang_thai IN ('moi','dang_xu_ly','cho_phan_hoi')) AS cho_xu_ly,

  (SELECT COUNT(*) FROM phan_hoi_khach_hang
   WHERE trang_thai = 'da_xu_ly'
   AND DATE(thoi_gian_xu_ly) = CURRENT_DATE)              AS da_xu_ly_hom_nay,

  (SELECT COUNT(*) FROM lich_su_cap_the
   WHERE DATE(ngay_thuc_hien) = CURRENT_DATE
   AND loai_su_kien IN ('cap_moi','cap_lai'))              AS the_cap_hom_nay;


-- ============================================================
-- Q8. [Logic Hệ Thống] Kiểm tra KH cần nâng hạng tự động
--     → Chạy định kỳ (cron job hoặc Supabase Edge Function)
-- ============================================================
SELECT
  kh.ma_kh,
  kh.ho_ten,
  ttv.ma_the,
  ttv.hang              AS hang_hien_tai,
  ttv.so_diem,
  ch_next.hang          AS hang_co_the_len,
  ch_next.diem_toi_thieu
FROM khach_hang kh
JOIN the_thanh_vien ttv ON kh.ma_kh = ttv.ma_kh
JOIN cau_hinh_hang_thanh_vien ch_cur ON ttv.hang = ch_cur.hang
JOIN cau_hinh_hang_thanh_vien ch_next
  ON ch_next.diem_toi_thieu = (
      SELECT MIN(c.diem_toi_thieu)
      FROM cau_hinh_hang_thanh_vien c
      WHERE c.diem_toi_thieu > ch_cur.diem_toi_thieu
  )
WHERE ttv.so_diem >= ch_next.diem_toi_thieu
  AND ttv.trang_thai = 'hoat_dong';


-- ============================================================
-- Q9. [App CSKH] Lịch sử cấp thẻ của 1 khách hàng
-- ============================================================
SELECT
  lct.ngay_thuc_hien,
  lct.loai_su_kien,
  nv.ho_ten             AS nhan_vien_thuc_hien,
  lct.ly_do,
  lct.ngay_het_han_moi
FROM lich_su_cap_the lct
JOIN nhan_vien nv ON lct.ma_nv = nv.ma_nv
JOIN the_thanh_vien ttv ON lct.ma_the = ttv.ma_the
WHERE ttv.ma_kh = 'KH00001'
ORDER BY lct.ngay_thuc_hien DESC;


-- ============================================================
-- Q10. [App Khách Hàng] Voucher còn hiệu lực của KH
-- ============================================================
SELECT
  v.ma_voucher,
  v.gia_tri_giam,
  v.ngay_het_han,
  v.trang_thai,
  v.ma_qr
FROM voucher v
WHERE v.ma_kh = 'KH00003'
  AND v.trang_thai = 'chua_dung'
  AND v.ngay_het_han >= CURRENT_DATE
ORDER BY v.ngay_het_han ASC;
