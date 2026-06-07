// =============================================================
//  quy_doi_diem.js — Quy doi diem giam gia
//  UC-4: Thu ngan nhap giup khach tai quay POS
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
//  UC-4 — Luong chinh:
//  Buoc 2: Tim khach hang theo SĐT hoac ma KH
//    const kh = await sbGet('khach_hang', 'so_dien_thoai=eq.' + sdt);
//  Buoc 3: Lay diem hien co tu the thanh vien
//    const the = await sbGet('the_thanh_vien',
//      'ma_kh=eq.' + kh[0].ma_kh + '&trang_thai=eq.Hoat dong');
//  Buoc 5: Khach nhap so diem → tinh real-time
//    function calcQD(diemDung) {
//      const giaTriGiam = diemDung; // BR: 1.000d = 1.000 diem
//      const diemConLai = diemHienCo - diemDung;
//      // cap nhat UI: so diem / gia tri giam / diem con lai
//    }
//  Buoc 6: Validate
//    - diemDung > 0
//    - diemDung <= diemHienCo
//    - diemDung la so nguyen (khong phan so)
//  Buoc 9: Cap nhat diem sau khi xac nhan
//    await sbUpdate('the_thanh_vien', 'ma_the=eq.' + maThe,
//      { diem_hien_tai: diemConLai });
//    await sbInsert('lich_su_giao_dich_diem', {
//      ma_kh, loai_giao_dich: 'Quy doi', so_diem: -diemDung,
//      mo_ta: 'Quy doi giam gia tai quay', thoi_gian: new Date().toISOString()
//    });
//
//  Exception 2a: Loi truy xuat diem → showToast('Loi tra cuu diem, thu lai', 'err')
//  Exception 5a: Diem nhap khong hop le → highlight input + showToast
//
//  BR: 1.000d = 1.000 diem (BR UC-4)
// =============================================================


// ---- Tinh toan quy doi real-time ----
// function calcQD() {
//   const diem = parseInt(document.getElementById('inp-diem').value) || 0;
//   // validate + cap nhat hien thi
// }

// ---- Mo modal xac nhan ----
// function openXacNhan() {
//   // Dien thong tin tom tat vao modal truoc khi hien
//   openModal('modal-xac-nhan-qd');
// }

// ---- Thuc hien quy doi sau khi xac nhan ----
// document.getElementById('btn-confirm-qd').addEventListener('click', async () => { ... });


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
