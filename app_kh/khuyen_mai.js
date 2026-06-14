// khuyen_mai.js — Khuyến mãi & Sự kiện
requireLogin();
const kh = getCurrentNV();

function showToast(msg, type = '') {
  const tc = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.ov').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) ov.classList.remove('open');
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;

  // TODO: Lấy danh sách chương trình khuyến mãi và render vào #mainContent

  // const kmData = await sbGet(
  //   'chuong_trinh_khuyen_mai',
  //   'trang_thai=eq.Đang diễn ra&order=ngay_bat_dau.desc'
  // );

  // ...render vào #mainContent
});