// =============================================================
//  router.js — SPA Router cho CarePoint Thu Ngan
//  Chiến lược: tất cả page đã nhúng sẵn trong index.html
//  Điều hướng = toggle class "active" trên .page-section
//  Không dùng fetch() → chạy được với file:// trực tiếp
// =============================================================

// ---- Bảo vệ: chưa đăng nhập → về dang_nhap.html ----
requireLogin();

// ---- Cập nhật topbar ----
(function initTopbar() {
  const nv = getCurrentNV();
  if (!nv) return;
  document.getElementById('topName').textContent   = nv.ho_ten;
  document.getElementById('topAvatar').textContent =
    nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
})();

// ---- Init overlay click-to-close cho tất cả modal ----
document.querySelectorAll('.ov').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) ov.classList.remove('open');
  });
});

// ---- State ----
let _currentPage = 'dashboard';

// =============================================================
//  navigate(page, sidebarEl, opts)
// =============================================================
function navigate(page, sidebarEl, opts) {
  opts = opts || {};

  // 1. Ẩn tất cả page-section
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

  // 2. Hiện page được chọn
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  // 3. Cập nhật sidebar active
  document.querySelectorAll('.sidebar .ni').forEach(n => n.classList.remove('active'));
  if (sidebarEl) sidebarEl.classList.add('active');

  // 4. Cập nhật topbar label
  const label = sidebarEl ? sidebarEl.dataset.label : 'Dashboard';
  document.getElementById('topPageName').textContent = label;

  // 5. Scroll lên đầu
  document.getElementById('main-content').scrollTop = 0;

  _currentPage = page;

  // 6. Gọi initPage của trang (mỗi lần navigate)
  const initFn = _pageInits[page];
  if (initFn) initFn(opts);

  // 7. Xử lý tab nếu có (the_thanh_vien)
  if (opts.tab && typeof chuyenTab === 'function') {
    chuyenTab(opts.tab, sidebarEl);
  }
}

// =============================================================
//  Registry initPage — mỗi pages/xxx.js tự đăng ký vào đây
//  Không dùng window.initPage (sẽ bị overwrite khi load nhiều file)
// =============================================================
const _pageInits = {};

function registerPage(name, fn) {
  _pageInits[name] = fn;
}

// =============================================================
//  GLOBAL HELPERS
// =============================================================
function openModal(id)  { document.getElementById(id) && document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id) && document.getElementById(id).classList.remove('open'); }

function showToast(msg, type) {
  type = type || '';
  const tc = document.getElementById('toasts');
  const t  = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(function() { t.remove(); }, 300);
  }, 3200);
}

// =============================================================
//  KHỞI ĐỘNG: load trang mặc định là dashboard
// =============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Set sidebar active cho dashboard
  const dashNi = document.querySelector('.sidebar .ni[data-page="dashboard"]');
  if (dashNi) dashNi.classList.add('active');

  // Gọi initPage dashboard
  const initFn = _pageInits['dashboard'];
  if (initFn) initFn({});
});
