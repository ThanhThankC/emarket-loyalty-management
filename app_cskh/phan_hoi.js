// =============================================================
//  phan_hoi.js — Logic chức năng: Phan hoi va Khieu nai
//  Phụ thuộc: supabase_config.js, supabase_api.js, auth.js
//  (3 file trên đã được load trước trong HTML)
// =============================================================

// Bắt buộc — bảo vệ trang, chưa login thì về dang_nhap.html
requireLogin();

// Lấy thông tin nhân viên đang đăng nhập
const nv = getCurrentNV();

// Khởi động sau khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {

  // Hiện tên nhân viên trên topbar
  if (nv) {
    document.getElementById('topName').textContent = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
  }

  // Đóng modal khi click nền
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });

  // TODO: Gọi hàm load dữ liệu ban đầu
  // loadData();
});


// =============================================================
//  VIẾT LOGIC CHỨC NĂNG BÊN DƯỚI
//  Tham khảo cách gọi Supabase:
//
//  Đọc:   const data = await sbGet('ten_bang', 'ma_kh=eq.KH001');
//  Thêm:  const row  = await sbInsert('ten_bang', { truong: gia_tri });
//  Sửa:   const row  = await sbUpdate('ten_bang', 'ma=eq.X', { truong: gia_tri });
//  Xóa:   await sbDelete('ten_bang', 'ma=eq.X');
// =============================================================


// ---- Modal helpers (dùng cho modal trong file này) ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- Toast ----
function showToast(msg, type = 'ok') {
  const tc = document.getElementById('toasts');
  const t  = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}
