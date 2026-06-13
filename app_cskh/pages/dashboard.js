// pages/dashboard.js
registerPage('dashboard', function(opts) {
  var nv = getCurrentNV();
  if (!nv) return;
  var el = document.getElementById('dashSub');
  if (el) el.textContent = 'Xin chào, ' + nv.ho_ten + '! Chào mừng trở lại.';
  // TODO: load số liệu stat cards từ Supabase
});

