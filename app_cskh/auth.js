// =============================================
//  auth.js
//  Quản lý session đăng nhập nhân viên
//  Phụ thuộc: supabase_config.js, supabase_api.js
// =============================================


const SESSION_KEY = 'carepoint_nv';

/** Lấy thông tin nhân viên đang đăng nhập (hoặc null) */
function getCurrentNV() {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

/** Bảo vệ trang: chưa đăng nhập → về dang_nhap.html */
function requireLogin() {
  if (!getCurrentNV()) {
    window.location.href = 'dang_nhap.html';
  }
}

/** Đăng xuất */
function dangXuat() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'dang_nhap.html';
}

/** Lưu session sau khi đăng nhập thành công */
function saveSession(nvData) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    ma_nv:         nvData.ma_nv,
    ho_ten:        nvData.ho_ten,
    vai_tro:       nvData.vai_tro,
    ten_dang_nhap: nvData.ten_dang_nhap,
    logged_in_at:  new Date().toISOString()
  }));
}
