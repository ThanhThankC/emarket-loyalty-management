// =============================================================
//  lich_su_ho.js — Tra cuu lich su mua hang ho khach
//  UC-5.1 Tra cuu  |  UC-5.2 Chi tiet don hang
//  Phu thuoc: supabase_config.js, supabase_api.js, auth.js
// =============================================================

requireLogin();
const nv = getCurrentNV();

document.addEventListener('DOMContentLoaded', () => {
  if (nv) {
    document.getElementById('topName').textContent   = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
  }
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
});

// =============================================================
//  VIET LOGIC CHUC NANG BEN DUOI
//
//  UC-5.1: Tra cuu don hang
//  Tieu chi tim kiem (BR5-2): SĐT, ma KH, ma don hang, khoang thoi gian, trang thai don
//  const data = await sbGet('don_hang',
//    `ma_kh=eq.${maKh}&order=ngay_mua.desc&limit=20&offset=${(trang-1)*20}`);
//
//  BR5-3: Phan trang 20 don/trang
//  BR5-5: Chi xem tong bill va diem tich luy (khong hien chi tiet san pham o day)
//
//  UC-5.2: Chi tiet don hang (mo trong modal-don-hang)
//  const detail = await sbGet('don_hang', 'ma_don=eq.' + maDon);
//  Hien day du: DS san pham, phuong thuc TT, giam gia/voucher, diem tich + diem da dung
//  BR5-4: KHONG cho chinh sua bat ky truong nao
//
//  Exception 5b: Du lieu nhap khong hop le → showToast loi, khong query
//  Exception 6d: Loi truy van → showToast('Tra cuu that bai, thu lai sau', 'err')
//  Exception 6e: Khong tim thay → showToast('Khong tim thay don hang', 'err')
//
//  NFR5-1: Phan hoi tra cuu <= 3 giay
//  NFR5-6: Ghi log lan tra cuu (nguoi tra cuu, thoi gian, tham so tim kiem)
// =============================================================


// ---- UC-5.1: Thuc hien tra cuu ----
// async function traCuu() {
//   const sdt = ...; const maDon = ...; const tuNgay = ...; const denNgay = ...;
//   // Validate truoc khi query (exception 5b)
//   // Query + render ket qua
// }

// ---- UC-5.2: Mo chi tiet don hang ----
// async function xemChiTiet(maDon) {
//   const data = await sbGet('don_hang', 'ma_don=eq.' + maDon);
//   // Render vao modal-don-hang
//   openModal('modal-don-hang');
// }


// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- Toast ----
function showToast(msg, type = '') {
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
