// pages/dashboard.js
registerPage('dashboard', function(opts) {
  const nv = getCurrentNV();
  if (!nv) return;

  const sub = document.getElementById('dashSub');
  const gsub = document.getElementById('gband-sub');

  if (sub) {
    sub.textContent = 'Xin chào, ' + nv.ho_ten;
  }

  if (gsub) {
    gsub.textContent = 'Chào ' + nv.ho_ten + '! Quầy của bạn đang hoạt động.';
  }

  // TODO: loadThongKeCa(); loadGiaoDichGanDay(); loadNhatKyCaLam();
});