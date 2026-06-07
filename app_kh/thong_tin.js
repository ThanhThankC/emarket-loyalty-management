// thong_tin.js — Thong tin ca nhan Khach Hang
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

document.addEventListener('DOMContentLoaded', () => {
  if (!kh) return;
  // TODO: Load thong tin va render vao #mainContent
});
