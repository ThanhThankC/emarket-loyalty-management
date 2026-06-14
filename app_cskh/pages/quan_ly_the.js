// =============================================================
//  pages/quan_ly_the.js — Quản lý thẻ thành viên (SPA version)
//  Phụ thuộc: router.js (navigate, openModal, closeModal, showToast)
//             supabase_api.js, auth.js
// =============================================================


var danhSachThe     = [];
var danhSachHienThi = [];
var theChiTiet      = null;

registerPage('quan_ly_the', function(opts) {
  loadDanhSachThe();
  if (opts && opts.keyword) {
    var inp = document.getElementById('searchInput');
    if (inp) inp.value = opts.keyword;
  }
});

async function loadDanhSachThe() {
  showState('loading');
  try {
    var data = await sbGet(
      'the_thanh_vien',
      'select=ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem,ma_kh,' +
      'khach_hang(ho_ten,so_dien_thoai,email)&order=so_diem.desc'
    );
    danhSachThe = data || [];
    applyFilter();
  } catch (err) {
    showState('error', 'Lỗi tải dữ liệu: ' + err.message);
  }
}

function onSearch(keyword) { applyFilter(keyword); }

function applyFilter(keyword) {
  var searchInp = document.getElementById('searchInput');
  var kw    = (keyword !== undefined ? keyword : (searchInp ? searchInp.value : '')).toLowerCase().trim();
  var hangEl  = document.getElementById('filterHang');
  var trangEl = document.getElementById('filterTrang');
  var hang  = hangEl  ? hangEl.value  : '';
  var trang = trangEl ? trangEl.value : '';

  danhSachHienThi = danhSachThe.filter(function(the) {
    var kh = the.khach_hang || {};
    var matchKW = !kw ||
      (kh.ho_ten || '').toLowerCase().includes(kw) ||
      (kh.so_dien_thoai || '').includes(kw) ||
      (the.ma_the || '').toLowerCase().includes(kw);
    return matchKW && (!hang || the.hang === hang) && (!trang || the.trang_thai === trang);
  });
  renderTable();
}

function renderTable() {
  var count   = danhSachHienThi.length;
  var countEl = document.getElementById('countLabel');
  if (countEl) countEl.textContent = 'Hiển thị ' + count + ' / ' + danhSachThe.length + ' thẻ';
  if (count === 0) { showState('empty'); return; }
  showState('table');
  var tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = danhSachHienThi.map(function(the) {
    var kh = the.khach_hang || {};
    return '<tr>' +
      '<td><div class="cname">' + escHtml(kh.ho_ten || '—') + '</div>' +
        '<div class="cid">' + escHtml(kh.so_dien_thoai || '') + '</div></td>' +
      '<td><code style="font-size:12px;color:var(--t2)">' + escHtml(the.ma_the) + '</code></td>' +
      '<td><span class="badge hang-' + the.hang + '">' + hangLabel(the.hang) + '</span></td>' +
      '<td><span class="diem-val">' + fmtSo(the.so_diem) + '</span></td>' +
      '<td ' + hetHanClass(the.ngay_het_han, the.trang_thai) + '>' + fmtNgay(the.ngay_het_han) + '</td>' +
      '<td><span class="ts-' + the.trang_thai + '">' + trangThaiLabel(the.trang_thai) + '</span></td>' +
      '<td style="text-align:right">' +
        '<button class="btn btn-outline btn-sm" onclick="xemChiTiet(\'' + the.ma_the + '\')">Chi tiết</button>' +
      '</td></tr>';
  }).join('');
}

async function xemChiTiet(maThe) {
  theChiTiet = danhSachHienThi.find(function(t) { return t.ma_the === maThe; });
  if (!theChiTiet) return;
  var kh = theChiTiet.khach_hang || {};

  document.getElementById('m-title').textContent = 'Chi tiết thẻ — ' + (kh.ho_ten || '');
  document.getElementById('m-sub').innerHTML =
    escHtml(theChiTiet.ma_the) + ' &nbsp;·&nbsp; Hạng: <span class="badge hang-' +
    theChiTiet.hang + '" style="font-size:11px">' + hangLabel(theChiTiet.hang) + '</span>' +
    ' &nbsp;·&nbsp; ' + fmtSo(theChiTiet.so_diem) + ' điểm';

  document.getElementById('m-info').innerHTML = [
    ['Họ tên',       kh.ho_ten         || '—'],
    ['SĐT',          kh.so_dien_thoai  || '—'],
    ['Email',        kh.email          || '—'],
    ['Mã thẻ',       theChiTiet.ma_the],
    ['Ngày cấp',     fmtNgay(theChiTiet.ngay_cap)],
    ['Hết hạn',      fmtNgay(theChiTiet.ngay_het_han)],
    ['Trạng thái',   trangThaiLabel(theChiTiet.trang_thai)],
    ['Điểm hiện có', fmtSo(theChiTiet.so_diem) + ' điểm'],
  ].map(function(item) {
    return '<div class="info-item"><div class="lbl">' + item[0] + '</div>' +
           '<div class="val">' + escHtml(String(item[1])) + '</div></div>';
  }).join('');

  var btnKhoa = document.getElementById('btn-khoa');
  if (theChiTiet.trang_thai === 'bi_khoa') {
    btnKhoa.textContent = 'Mở khóa thẻ';
    btnKhoa.className   = 'btn btn-green btn-sm';
  } else {
    btnKhoa.textContent = 'Khóa thẻ';
    btnKhoa.className   = 'btn btn-danger btn-sm';
  }

  openModal('modal-chitiet');
  await loadGiaoDich(maThe);
}

async function loadGiaoDich(maThe) {
  document.getElementById('m-gd-loading').style.display = 'block';
  document.getElementById('m-gd-table').style.display   = 'none';
  document.getElementById('m-gd-empty').style.display   = 'none';
  try {
    var gd = await sbGet('lich_su_giao_dich_diem',
      'ma_the=eq.' + maThe + '&order=ngay_gd.desc&limit=10');
    document.getElementById('m-gd-loading').style.display = 'none';
    if (!gd || gd.length === 0) {
      document.getElementById('m-gd-empty').style.display = 'block';
      return;
    }
    document.getElementById('m-gd-table').style.display = '';
    document.getElementById('m-gd-body').innerHTML = gd.map(function(g) {
      var isDuong = g.so_diem > 0;
      return '<tr>' +
        '<td style="font-size:12px;color:var(--t3)">' + fmtNgayGio(g.ngay_gd) + '</td>' +
        '<td>' + loaiGDLabel(g.loai_gd) + '</td>' +
        '<td style="font-weight:600;color:' + (isDuong ? 'var(--green)' : 'var(--red)') + '">' +
          (isDuong ? '+' : '') + fmtSo(g.so_diem) + '</td>' +
        '<td style="font-weight:500">' + fmtSo(g.so_du_sau_gd) + '</td>' +
        '<td style="font-size:12px;color:var(--t3)">' + escHtml(g.ghi_chu || '—') + '</td></tr>';
    }).join('');
  } catch (err) {
    document.getElementById('m-gd-loading').textContent = 'Lỗi tải lịch sử: ' + err.message;
  }
}

async function khoaThe() {
  if (!theChiTiet) return;
  var isKhoa   = theChiTiet.trang_thai !== 'bi_khoa';
  var trangMoi = isKhoa ? 'bi_khoa' : 'hoat_dong';
  if (!confirm(isKhoa ? 'Xác nhận KHÓA thẻ ' + theChiTiet.ma_the + '?' :
                        'Xác nhận MỞ KHÓA thẻ ' + theChiTiet.ma_the + '?')) return;
  try {
    await sbUpdate('the_thanh_vien', 'ma_the=eq.' + theChiTiet.ma_the, { trang_thai: trangMoi });
    showToast(isKhoa ? 'Đã khóa thẻ thành viên' : 'Đã mở khóa thẻ thành viên', isKhoa ? 'wrn' : 'ok');
    closeModal('modal-chitiet');
    loadDanhSachThe();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

// SPA: dùng navigate() thay location.href + sessionStorage
function chuyenGiaHan() {
  if (!theChiTiet) return;
  closeModal('modal-chitiet');
  var ni = document.querySelector('.sidebar .ni[data-page="gia_han"]');
  navigate('gia_han', ni, { maThe: theChiTiet.ma_the, the: theChiTiet });
}

function showState(state, errMsg) {
  ['Loading','Empty','Error','Table'].forEach(function(s) {
    var el = document.getElementById('state' + s);
    if (el) el.style.display = 'none';
  });
  var el = document.getElementById('state' + state.charAt(0).toUpperCase() + state.slice(1));
  if (el) el.style.display = '';
  if (state === 'error' && errMsg) {
    var em = document.getElementById('errorMsg');
    if (em) em.textContent = errMsg;
  }
}

function fmtSo(n)    { return Number(n || 0).toLocaleString('vi-VN'); }
function fmtNgay(s)  { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function fmtNgayGio(s) {
  if (!s) return '—';
  var d = new Date(s);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
}
function escHtml(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function hangLabel(hang)  { return ({Bronze:'Đồng',Silver:'Bạc',Gold:'Vàng',Platinum:'Bạch Kim'})[hang] || hang; }
function trangThaiLabel(ts) { return ({hoat_dong:'Hoạt động',het_han:'Hết hạn',bi_khoa:'Bị khóa',mat_the:'Mất thẻ'})[ts] || ts; }
function loaiGDLabel(loai) {
  return ({
    tich_diem: '<span class="badge b-done">Tích điểm</span>',
    tieu_diem: '<span class="badge b-err">Tiêu điểm</span>',
    doi_qua:   '<span class="badge b-pend">Đổi quà</span>',
    het_han:   '<span class="badge b-ended">Hết hạn</span>',
    dieu_chinh:'<span class="badge b-open">Điều chỉnh</span>',
  })[loai] || loai;
}
function hetHanClass(ngay, trangThai) {
  if (trangThai !== 'hoat_dong') return '';
  var diff = (new Date(ngay) - new Date()) / 86400000;
  if (diff < 0)  return 'style="color:var(--red)"';
  if (diff < 30) return 'style="color:var(--orange)"';
  return '';
}
