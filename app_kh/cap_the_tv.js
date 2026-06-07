// cap_the_tv.js — The thanh vien
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
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;
  // TODO: Lay thong tin the thanh vien va hien thi
  // const theData = await sbGet('the_thanh_vien', `ma_kh=eq.${kh.ma_nv}`);
  // ...render vao #mainContent
});
