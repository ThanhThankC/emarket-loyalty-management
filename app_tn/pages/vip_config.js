// pages/vip_config.js
registerPage('vip_config', function(opts) {
  var nv = getCurrentNV();

  // UC-15: Kiểm tra quyền Quản lý
  // if (nv && nv.vai_tro !== 'Quản lý') {
  //   showToast('Chức năng này yêu cầu quyền Quản lý', 'err');
  //   setTimeout(function() { navigate('dashboard', document.querySelector('[data-page=dashboard]')); }, 1500);
  //   return;
  // }

  // TODO: loadCauHinhNguong(); loadPhanBoKhachHang(); loadLichSuCauHinh();
});

// ---- UC-15: Lưu cấu hình ----
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('btn-luu-cau-hinh');
  if (btn) btn.addEventListener('click', luuCauHinh);
});

async function luuCauHinh() {
  showToast('Chức năng đang được phát triển', 'err');
}

// ---- Load cấu hình ngưỡng ----
// async function loadCauHinhNguong() { ... }
// async function loadPhanBoKhachHang() { ... }
// async function loadLichSuCauHinh() { ... }