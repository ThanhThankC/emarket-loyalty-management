// pages/the_thanh_vien.js
registerPage('the_thanh_vien', function(opts) {
  // Tab mặc định khi vào trang
  var tab = (opts && opts.tab) ? opts.tab : 'cap-the';
  chuyenTab(tab, null);
  // TODO: loadTheSapHetHan();
});

function chuyenTab(tab, sidebarEl) {
  document.querySelectorAll('.ttv-tab').forEach(function(t) {
    t.classList.remove('active');
  });

  var tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');

  // Cập nhật sidebar active cho 2 mục của trang này
  document.querySelectorAll('.sidebar .ni[data-page="the_thanh_vien"]').forEach(function(n) {
    n.classList.remove('active');
  });

  if (sidebarEl) {
    sidebarEl.classList.add('active');
  } else {
    var matchNi = document.querySelector(
      '.sidebar .ni[data-page="the_thanh_vien"][data-tab="' + tab + '"]'
    );
    if (matchNi) matchNi.classList.add('active');
  }
}

// ---- Tìm khách hàng cấp thẻ / gia hạn ----
// async function timKhachHangCapThe() { ... }
// async function xacNhanCapThe() { ... }
// async function timKhachHangGiaHan() { ... }
// async function xacNhanGiaHan() { ... }
// async function loadTheSapHetHan() { ... }