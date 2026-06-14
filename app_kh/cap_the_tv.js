// cap_the_tv.js — Thẻ thành viên
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

  // TODO: Lấy thông tin thẻ thành viên và hiển thị
  // const theData = await sbGet('the_thanh_vien', `ma_kh=eq.${kh.ma_nv}`);
  // ...render vào #mainContent
});