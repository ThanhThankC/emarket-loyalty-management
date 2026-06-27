// logic.js — Pure business logic tách ra từ các file UI
// Các hàm này không phụ thuộc DOM, có thể test dễ dàng

// =============================================
//  UC-1: Đăng ký tài khoản — dang_ki.js
// =============================================

/**
 * Validate form đăng ký khách hàng
 * BR1: SĐT phải duy nhất (check ở backend)
 * BR2: Họ tên, SĐT, Mật khẩu là bắt buộc
 * BR3: Mật khẩu >= 6 ký tự
 * BR4: Xác nhận mật khẩu phải khớp
 */
function validateDangKy({ hoTen, soDienThoai, matKhau, xacNhanMatKhau }) {
  const errors = {};

  if (!hoTen || !hoTen.trim()) {
    errors.hoTen = 'Vui lòng nhập họ và tên';
  }

  if (!soDienThoai || !soDienThoai.trim()) {
    errors.soDienThoai = 'Vui lòng nhập số điện thoại';
  } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(soDienThoai.trim())) {
    errors.soDienThoai = 'Số điện thoại không hợp lệ (VD: 0912345678)';
  }

  if (!matKhau) {
    errors.matKhau = 'Vui lòng nhập mật khẩu';
  } else if (matKhau.length < 6) {
    errors.matKhau = 'Mật khẩu phải có tối thiểu 6 ký tự';
  }

  if (matKhau !== xacNhanMatKhau) {
    errors.xacNhanMatKhau = 'Mật khẩu xác nhận không khớp';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// =============================================
//  UC-9: Đổi điểm lấy quà — doi_diem_qua.js
// =============================================

/**
 * Kiểm tra KH có đủ điểm để đổi không
 */
// =============================================
//  UC: Thu ngân thêm mới khách hàng
// =============================================

/**
 * Validate thông tin thu ngân nhập khi thêm mới khách hàng.
 * BR1: Họ tên, SĐT, mật khẩu là bắt buộc
 * BR2: SĐT phải đúng định dạng Việt Nam
 * BR3: SĐT không được trùng với danh sách đã tồn tại
 */
function validateThemMoiKhachHang({ hoTen, soDienThoai, matKhau }, danhSachSdtDaTonTai = []) {
  const errors = {};

  if (!hoTen || !hoTen.trim()) {
    errors.hoTen = 'Vui lòng nhập họ và tên';
  }

  if (!soDienThoai || !soDienThoai.trim()) {
    errors.soDienThoai = 'Vui lòng nhập số điện thoại';
  } else if (!/^(0[35789])[0-9]{8}$/.test(soDienThoai.trim())) {
    errors.soDienThoai = 'Số điện thoại không hợp lệ';
  } else if (danhSachSdtDaTonTai.includes(soDienThoai.trim())) {
    errors.soDienThoai = 'Số điện thoại đã tồn tại';
  }

  if (!matKhau || !matKhau.trim()) {
    errors.matKhau = 'Vui lòng nhập mật khẩu';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// =============================================
//  UC: Dang nhap 3 app
// =============================================

/**
 * Validate dang nhap dung chung cho app_kh, app_tn, app_cskh.
 * BR1: Tai khoan va mat khau la bat buoc
 * BR2: Tai khoan phai ton tai trong CSDL
 * BR3: Mat khau phai dung voi tai khoan
 */
function validateDangNhap({ taiKhoan, matKhau }, danhSachTaiKhoan = []) {
  const errors = {};

  if (!taiKhoan || !taiKhoan.trim()) {
    errors.taiKhoan = 'Vui long nhap tai khoan';
  }

  if (!matKhau || !matKhau.trim()) {
    errors.matKhau = 'Vui long nhap mat khau';
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
      user: null
    };
  }

  const user = danhSachTaiKhoan.find(item => item.taiKhoan === taiKhoan.trim());

  if (!user) {
    errors.taiKhoan = 'Tai khoan khong ton tai';
  } else if (user.matKhau !== matKhau) {
    errors.matKhau = 'Mat khau khong dung';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    user: Object.keys(errors).length === 0 ? user : null
  };
}

// =============================================
//  UC: Nhan vien CSKH tao su kien khuyen mai
// =============================================

/**
 * Validate ngay bat dau va ngay ket thuc cua su kien khuyen mai.
 * BR1: Ngay ket thuc phai bang hoac sau ngay bat dau
 * BR2: So luong qua tang phai lon hon 0
 * BR3: Diem doi phai lon hon 0
 */
function validateSuKienKhuyenMai({ ngayBatDau, ngayKetThuc, soLuongQuaTang, diemDoi }) {
  const errors = {};

  if (!ngayBatDau) {
    errors.ngayBatDau = 'Vui long nhap ngay bat dau';
  }

  if (!ngayKetThuc) {
    errors.ngayKetThuc = 'Vui long nhap ngay ket thuc';
  }

  if (ngayBatDau && ngayKetThuc) {
    const startDate = new Date(ngayBatDau);
    const endDate = new Date(ngayKetThuc);

    if (endDate < startDate) {
      errors.ngayKetThuc = 'Ngay ket thuc phai bang hoac sau ngay bat dau';
    }
  }

  if (soLuongQuaTang !== undefined) {
    const quantity = Number(soLuongQuaTang);

    if (quantity <= 0) {
      errors.soLuongQuaTang = 'So luong qua tang phai lon hon 0';
    }
  }

  if (diemDoi !== undefined) {
    const points = Number(diemDoi);

    if (points <= 0) {
      errors.diemDoi = 'Diem doi phai lon hon 0';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// =============================================
//  UC: Doi tra hang
// =============================================

/**
 * Kiem tra don hang con trong han doi tra hay khong.
 * BR1: Duoc doi tra neu so ngay ke tu ngay mua <= 15
 */
function kiemTraHanDoiTra(ngayMuaHang, ngayYeuCauDoiTra, soNgayChoPhep = 15) {
  const startDate = new Date(ngayMuaHang);
  const requestDate = new Date(ngayYeuCauDoiTra);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const soNgayDaQua = Math.floor((requestDate - startDate) / millisecondsPerDay);

  return {
    isValid: soNgayDaQua <= soNgayChoPhep,
    soNgayDaQua,
    error: soNgayDaQua > soNgayChoPhep ? 'Da qua han doi tra hang' : null
  };
}

function kiemTraDuDiem(diemHienTai, diemYeuCau) {
  return diemHienTai >= diemYeuCau;
}

/**
 * Tính điểm còn lại sau khi đổi
 */
function tinhDiemConLai(diemHienTai, diemDaDoi) {
  const result = diemHienTai - diemDaDoi;
  return Math.max(0, result);
}

/**
 * Lọc danh sách quà theo loại tab đang active
 */
function filterByGiftType(items, activeType) {
  return items.filter(item => item.loai === activeType);
}

/**
 * Tạo mô tả quà tặng
 */
function exchangeDescription(gift) {
  if (gift.loai === 'voucher_giam_gia') {
    return `Voucher giảm ${Number(gift.gia_tri || 0).toLocaleString('vi-VN')} đ`;
  }
  if (gift.loai === 'uu_dai_dich_vu') {
    return 'Ưu đãi dịch vụ dành cho thành viên';
  }
  return 'Quà tặng dành cho thành viên';
}

/**
 * Escape HTML để tránh XSS khi render tên quà
 */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================
//  UC-X: Quy đổi điểm — logic tính toán
// =============================================

/**
 * Tính số điểm nhận được từ giá trị mua hàng
 * Quy tắc: 10,000đ = 1 điểm
 */
function tinhDiemTuMuaHang(giaTriMuaHang, tyLe = 10000) {
  if (giaTriMuaHang < 0) return 0;
  return Math.floor(giaTriMuaHang / tyLe);
}

/**
 * Xác định hạng thành viên dựa trên tổng điểm tích lũy
 * Giả định ngưỡng: Silver >= 100, Gold >= 500, Platinum >= 2000
 */
function xacDinhHang(tongDiem) {
  if (tongDiem >= 2000) return 'Platinum';
  if (tongDiem >= 500)  return 'Gold';
  if (tongDiem >= 100)  return 'Silver';
  return 'Member';
}

module.exports = {
  validateDangKy,
  validateThemMoiKhachHang,
  validateDangNhap,
  validateSuKienKhuyenMai,
  kiemTraHanDoiTra,
  kiemTraDuDiem,
  tinhDiemConLai,
  filterByGiftType,
  exchangeDescription,
  escapeHtml,
  tinhDiemTuMuaHang,
  xacDinhHang,
};
