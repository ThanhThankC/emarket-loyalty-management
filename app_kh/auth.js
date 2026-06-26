// =============================================
//  auth.js — App Khach Hang
//  Quan ly session dang nhap khach hang
//  Phu thuoc: supabase_config.js, supabase_api.js
// =============================================

const SESSION_KEY = 'carepoint_kh';

/** Lay thong tin khach hang dang dang nhap (hoac null) */
function getCurrentNV() {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

/** Bao ve trang: chua dang nhap → ve dang_nhap.html */
function requireLogin() {
  if (!getCurrentNV()) {
    window.location.href = 'dang_nhap.html';
  }
}

/** Dang xuat */
function dangXuat() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'dang_nhap.html';
}

/** Luu session sau khi dang nhap thanh cong */
function saveSession(khData) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    ma_kh:         khData.ma_kh,
    ma_nv:         khData.ma_kh,
    ho_ten:        khData.ho_ten,
    vai_tro:       'khach_hang',
    ten_dang_nhap: khData.so_dien_thoai,
    logged_in_at:  new Date().toISOString()
  }));
}
