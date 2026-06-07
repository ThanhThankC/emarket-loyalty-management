// =============================================================
//  khach_hang.js — Quan ly khach hang
//  UC-1.1.1 Them KH  |  UC-1.1.2 Sua KH  |  UC-1.1.3 Xoa KH  |  UC-1.2 Tim kiem
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

  // TODO: Goi ham load danh sach khach hang
  // loadDanhSachKH();
});

// =============================================================
//  VIET LOGIC CHUC NANG BEN DUOI
//
//  Cach goi Supabase:
//  Doc:   const data = await sbGet('khach_hang', 'trang_thai_hoat_dong=eq.0&order=ho_ten.asc');
//  Them:  const row  = await sbInsert('khach_hang', { ho_ten, so_dien_thoai, ... });
//  Sua:   await sbUpdate('khach_hang', 'ma_kh=eq.KH001', { ho_ten: gia_tri_moi });
//  An:    await sbUpdate('khach_hang', 'ma_kh=eq.KH001', { trang_thai_hoat_dong: 1 });
//         (UC-1.1.3: KHONG dung sbDelete — chi chuyen trang_thai_hoat_dong = 1)
//
//  Tim kiem (UC-1.2):
//  const data = await sbGet('khach_hang',
//    `or=(so_dien_thoai.ilike.*${q}*,ho_ten.ilike.*${q}*,ma_kh.ilike.*${q}*)`
//    + '&trang_thai_hoat_dong=eq.0&order=ho_ten.asc');
//
//  Exception UC-1.1.1 (5b): Kiem tra SĐT ton tai truoc khi them:
//  const dup = await sbGet('khach_hang', 'so_dien_thoai=eq.' + sdt);
//  if (dup && dup.length > 0) { showToast('SĐT da duoc dang ky', 'err'); return; }
// =============================================================


// ---- UC-1.2: Tim kiem khach hang ----
// function filterKH(keyword) { ... }

// ---- UC-1.1.1: Them khach hang ----
// function openThemKH() { openModal('modal-kh-form'); ... }
// async function saveKH() { ... }

// ---- UC-1.1.2: Sua khach hang ----
// function openSuaKH(maKh) { ... }

// ---- UC-1.1.3: An khach hang (doi trang_thai_hoat_dong = 1) ----
// function openXoaKH(maKh) { openModal('modal-kh-delete'); ... }
// async function confirmXoaKH() {
//   await sbUpdate('khach_hang', 'ma_kh=eq.' + maKhCanXoa, { trang_thai_hoat_dong: 1 });
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
