// =============================================================
//  router.js — SPA Router cho CarePoint CSKH
//  Chiến lược: tất cả page nhúng sẵn trong index.html
//  Điều hướng = toggle class "active" trên .page-section
//  Không dùng fetch() → chạy được với file:// trực tiếp
// =============================================================

requireLogin();

// ---- Cập nhật topbar ----
(function initTopbar() {
  var nv = getCurrentNV();
  if (!nv) return;
  document.getElementById('topName').textContent   = nv.ho_ten;
  document.getElementById('topAvatar').textContent =
    nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
})();

// ---- Init overlay click-to-close cho tất cả modal ----
document.querySelectorAll('.ov').forEach(function(ov) {
  ov.addEventListener('click', function(e) {
    if (e.target === ov) ov.classList.remove('open');
  });
});

// ---- State ----
var _currentPage = 'dashboard';
var _pageInits   = {};

// =============================================================
//  navigate(page, sidebarEl, opts)
// =============================================================
function navigate(page, sidebarEl, opts) {
  opts = opts || {};

  document.querySelectorAll('.page-section').forEach(function(s) {
    s.classList.remove('active');
  });

  var pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.sidebar .ni').forEach(function(n) {
    n.classList.remove('active');
  });
  if (sidebarEl) sidebarEl.classList.add('active');

  var mc = document.getElementById('main-content');
  if (mc) mc.scrollTop = 0;

  _currentPage = page;

  var initFn = _pageInits[page];
  if (initFn) initFn(opts);
}

// =============================================================
//  registerPage(name, fn)
// =============================================================
function registerPage(name, fn) {
  _pageInits[name] = fn;
}

// =============================================================
//  GLOBAL HELPERS
// =============================================================
function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function showToast(msg, type) {
  type = type || '';
  var tc = document.getElementById('toasts');
  var t  = document.createElement('div');
  t.className   = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(function() {
    t.style.opacity    = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(function() { t.remove(); }, 300);
  }, 3200);
}

// Global search — chuyển sang quan_ly_the và truyền keyword
function onGlobalSearch(val) {
  if (!val || !val.trim()) return;
  var ni = document.querySelector('.sidebar .ni[data-page="quan_ly_the"]');
  navigate('quan_ly_the', ni);
  var inp = document.getElementById('searchInput');
  if (inp) {
    inp.value = val;
    if (typeof onSearch === 'function') onSearch(val);
  }
}

// =============================================================
//  KHỞI ĐỘNG
// =============================================================
document.addEventListener('DOMContentLoaded', function() {
  var dashNi = document.querySelector('.sidebar .ni[data-page="dashboard"]');
  if (dashNi) dashNi.classList.add('active');
  var initFn = _pageInits['dashboard'];
  if (initFn) initFn({});
});