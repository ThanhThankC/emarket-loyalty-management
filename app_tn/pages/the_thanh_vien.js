// =============================================================
//  pages/the_thanh_vien.js — Cấp thẻ thành viên mới (UC-2.1)
//  App Thu Ngân — chỉ có tab Cấp thẻ mới (tab gia hạn đã bỏ)
//  Phụ thuộc: router.js, supabase_api.js, auth.js
// =============================================================

var _ttvNV          = null;   // NV đang đăng nhập
var _ttvKHChon      = null;   // KH đã tìm được và được chọn
var _ttvHangKhoiDiem = 'Bronze'; // Hạng từ DB có diem_toi_thieu=0
var _ttvCauHinhHang  = [];    // Toàn bộ bảng cau_hinh_hang_thanh_vien

registerPage('the_thanh_vien', function(opts) {
  _ttvNV     = getCurrentNV();
  _ttvKHChon = null;

  ttvLoadCauHinhHang();  // Load bảng hạng từ DB (dùng cho panel Hạng thành viên)
  ttvResetForm();        // Reset form tìm kiếm về trạng thái ban đầu
});

// ---- Load cấu hình hạng từ DB ----
async function ttvLoadCauHinhHang() {
  try {
    var data = await sbGet('cau_hinh_hang_thanh_vien',
      'select=hang,ten_hien_thi,diem_toi_thieu,he_so_tich_diem&order=diem_toi_thieu.asc');
    _ttvCauHinhHang = data || [];

    // Hạng khởi điểm = hạng có diem_toi_thieu nhỏ nhất (= 0)
    if (_ttvCauHinhHang.length > 0) {
      _ttvHangKhoiDiem = _ttvCauHinhHang[0].hang;
    }

    ttvRenderBangHang();
  } catch (err) {
    console.warn('Không load được cấu hình hạng:', err.message);
  }
}

// ---- Render panel "Hạng thành viên" từ DB ----
function ttvRenderBangHang() {
  var el = document.getElementById('ttv-bang-hang');
  if (!el || _ttvCauHinhHang.length === 0) return;

  var sorted = _ttvCauHinhHang.slice().sort(function(a, b) {
    return a.diem_toi_thieu - b.diem_toi_thieu;
  });
  var max = sorted[sorted.length - 1].diem_toi_thieu;

  el.innerHTML = sorted.map(function(h, idx) {
    var next    = sorted[idx + 1];
    var pct     = max > 0 ? Math.round(h.diem_toi_thieu / max * 80) + 20 : 20;
    var clsMap  = { Bronze: 'rank-new', Silver: 'rank-bac', Gold: 'rank-vang', Platinum: 'rank-kim' };
    var bgMap   = { Bronze: '#ccc',     Silver: '#1a56db',  Gold: 'var(--yd)', Platinum: '#7C3AED' };
    var label   = next
      ? ttvFmtSo(h.diem_toi_thieu) + ' – ' + ttvFmtSo(next.diem_toi_thieu - 1) + ' điểm'
      : ttvFmtSo(h.diem_toi_thieu) + ' điểm trở lên';
    var widthPct = idx === 0 ? 20 : Math.min(20 + idx * 27, 100);

    return '<div class="tier-row">' +
      '<span class="rank ' + (clsMap[h.hang] || 'rank-new') + '" style="width:90px;justify-content:center;display:inline-flex;">' +
        ttvHangLabel(h.hang) +
      '</span>' +
      '<div class="tier-bar-wrap"><div class="tier-bar" style="width:' + widthPct + '%;background:' + (bgMap[h.hang] || '#ccc') + ';"></div></div>' +
      '<span style="font-size:12px;color:var(--t3);white-space:nowrap">' + label + '</span>' +
      '</div>';
  }).join('');
}

// ---- Reset form về trạng thái tìm kiếm ----
function ttvResetForm() {
  _ttvKHChon = null;
  var searchEl = document.getElementById('ttv-search-area');
  var infoEl   = document.getElementById('ttv-info-area');
  if (searchEl) searchEl.style.display = '';
  if (infoEl)   infoEl.style.display   = 'none';
  var inp = document.getElementById('ttv-search-inp');
  if (inp) inp.value = '';
  var resEl = document.getElementById('ttv-search-result');
  if (resEl) resEl.innerHTML = '';
}

// ---- Tìm kiếm khách hàng ----
async function ttvTimKiem() {
  var inp     = document.getElementById('ttv-search-inp');
  var keyword = inp ? inp.value.trim() : '';
  if (!keyword) { showToast('Nhập SĐT hoặc tên để tìm', 'inf'); return; }

  var resEl = document.getElementById('ttv-search-result');
  resEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px">Đang tìm...</div>';

  try {
    var isPhone = /^[0-9]+$/.test(keyword);
    var isMaKH  = /^KH/i.test(keyword);
    var filter  = isMaKH  ? 'ma_kh=ilike.*' + keyword + '*' :
                  isPhone ? 'so_dien_thoai=like.*' + keyword + '*' :
                            'ho_ten=ilike.*' + keyword + '*';

    var data = await sbGet('khach_hang',
      filter + '&trang_thai=eq.hoat_dong' +
      '&select=ma_kh,ho_ten,so_dien_thoai,email,ngay_sinh,gioi_tinh,' +
      'the_thanh_vien(ma_the,hang,trang_thai)&limit=10');

    if (!data || data.length === 0) {
      resEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Không tìm thấy khách hàng</div>';
      return;
    }

    resEl.innerHTML = data.map(function(kh) {
      var theRaw  = kh.the_thanh_vien;
      // Supabase trả object (1-1 UNIQUE) hoặc array — chuẩn hóa
      var the     = theRaw ? (Array.isArray(theRaw) ? theRaw[0] : theRaw) : null;
      var daCoThe = !!the;

      var theInfo = daCoThe
        ? '<span class="rank rank-' + ttvHangCls(the.hang) + '" style="font-size:11px;padding:2px 7px">' + ttvHangLabel(the.hang) + '</span> Đã có thẻ'
        : '<span style="color:var(--green);font-weight:600;font-size:12px">Chưa có thẻ</span>';

      var btn = daCoThe
        ? '<span style="font-size:12px;color:var(--t3)">Đã có thẻ</span>'
        : '<button class="btn btn-primary btn-sm" onclick="ttvChonKH(\'' + ttvEsc(kh.ma_kh) + '\')">Chọn</button>';

      return '<div class="ttv-result-item">' +
        '<div>' +
          '<div class="cname">' + ttvEsc(kh.ho_ten) + '</div>' +
          '<div class="cid">' + ttvEsc(kh.so_dien_thoai || '') + ' &nbsp;·&nbsp; ' + ttvEsc(kh.ma_kh) + ' &nbsp;·&nbsp; ' + theInfo + '</div>' +
        '</div>' + btn +
        '</div>';
    }).join('');

  } catch (err) {
    resEl.innerHTML = '<div style="color:var(--red);padding:12px;font-size:13px">Lỗi: ' + err.message + '</div>';
  }
}

function ttvSearchKeydown(e) {
  if (e.key === 'Enter') ttvTimKiem();
}

// ---- Chọn KH để cấp thẻ ----
async function ttvChonKH(maKH) {
  try {
    var data = await sbGet('khach_hang',
      'ma_kh=eq.' + maKH +
      '&select=ma_kh,ho_ten,so_dien_thoai,email,ngay_sinh,gioi_tinh,' +
      'the_thanh_vien(ma_the)');
    if (!data || data.length === 0) { showToast('Không tìm thấy khách hàng', 'err'); return; }

    var kh     = data[0];
    var theRaw = kh.the_thanh_vien;
    var the    = theRaw ? (Array.isArray(theRaw) ? theRaw[0] : theRaw) : null;
    if (the) { showToast('Khách hàng này đã có thẻ thành viên', 'err'); return; }

    _ttvKHChon = kh;
    ttvHienThiThongTinKH(kh);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

// ---- Hiển thị thông tin KH đã chọn ----
function ttvHienThiThongTinKH(kh) {
  var searchEl = document.getElementById('ttv-search-area');
  var infoEl   = document.getElementById('ttv-info-area');
  if (searchEl) searchEl.style.display = 'none';
  if (infoEl)   infoEl.style.display   = '';

  // Tính ngày hết hạn thẻ mặc định (+2 năm)
  var ngayHetHan = new Date();
  ngayHetHan.setFullYear(ngayHetHan.getFullYear() + 2);
  var ngayHetHanStr = ngayHetHan.toISOString().split('T')[0];

  // Thẻ preview
  var hangKD      = _ttvHangKhoiDiem;
  var tenHangKD   = ttvHangLabel(hangKD);
  document.getElementById('ttv-card').innerHTML =
    '<div class="ttv-card-brand">CarePoint</div>' +
    '<div class="ttv-card-dots"><span></span><span></span><span></span></div>' +
    '<div class="ttv-card-ma">THE — MỚI</div>' +
    '<div class="ttv-card-name">' + ttvEsc(kh.ho_ten) + '</div>' +
    '<div class="ttv-card-foot">' +
      '<span>' + tenHangKD.toUpperCase() + '</span>' +
      '<span>HH: ' + ttvFmtNgay(ngayHetHanStr) + '</span>' +
    '</div>';

  // Thông tin KH
  document.getElementById('ttv-kh-detail').innerHTML = [
    ['Họ tên',    ttvEsc(kh.ho_ten)],
    ['SĐT',       ttvEsc(kh.so_dien_thoai || '—')],
    ['Email',     ttvEsc(kh.email || '—')],
    ['Mã KH',     ttvEsc(kh.ma_kh)],
    ['Hạng thẻ',  '<span class="rank rank-' + ttvHangCls(hangKD) + '" style="font-size:11px;padding:2px 8px">' + tenHangKD + '</span>'],
    ['Hệ số tích điểm', 'x' + ttvHeSo(hangKD)],
    ['Hết hạn thẻ', '<strong>' + ttvFmtNgay(ngayHetHanStr) + '</strong> (+2 năm)'],
  ].map(function(item) {
    return '<div class="info-item"><div class="lbl">' + item[0] + '</div><div class="val">' + item[1] + '</div></div>';
  }).join('');

  // Lưu ngayHetHanStr để dùng khi xác nhận
  document.getElementById('ttv-btn-capthe').dataset.ngayHetHan = ngayHetHanStr;
}

// ---- Mở modal xác nhận ----
function ttvMoXacNhan() {
  if (!_ttvKHChon) return;
  var btn        = document.getElementById('ttv-btn-capthe');
  var ngayHetHan = btn ? btn.dataset.ngayHetHan : null;
  var hangKD     = _ttvHangKhoiDiem;

  document.getElementById('ttv-confirm-body').innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      '<div class="info-item"><div class="lbl">Khách hàng</div><div class="val">' + ttvEsc(_ttvKHChon.ho_ten) + '</div></div>' +
      '<div class="info-item"><div class="lbl">Mã KH</div><div class="val">' + ttvEsc(_ttvKHChon.ma_kh) + '</div></div>' +
      '<div class="info-item"><div class="lbl">Hạng thẻ</div><div class="val"><span class="rank rank-' + ttvHangCls(hangKD) + '" style="font-size:11px;padding:2px 8px">' + ttvHangLabel(hangKD) + '</span></div></div>' +
      '<div class="info-item"><div class="lbl">Hết hạn</div><div class="val"><strong>' + ttvFmtNgay(ngayHetHan) + '</strong></div></div>' +
    '</div>';

  document.getElementById('ttv-confirm-btn').dataset.ngayHetHan = ngayHetHan;
  openModal('modal-cap-the-confirm');
}

// ---- Thực hiện cấp thẻ ----
async function ttvXacNhanCapThe() {
  if (!_ttvKHChon) return;
  var btn        = document.getElementById('ttv-confirm-btn');
  var ngayHetHan = btn ? btn.dataset.ngayHetHan : null;

  btn.disabled    = true;
  btn.textContent = 'Đang xử lý...';

  try {
    var maThe = 'THE' + Date.now().toString().slice(-6) +
                Math.random().toString(36).slice(2, 5).toUpperCase();

    await sbInsert('the_thanh_vien', {
      ma_the:       maThe,
      ma_kh:        _ttvKHChon.ma_kh,
      hang:         _ttvHangKhoiDiem,
      ngay_cap:     new Date().toISOString().split('T')[0],
      ngay_het_han: ngayHetHan,
      trang_thai:   'hoat_dong',
      so_diem:      0
    });

    // Ghi log lich_su_cap_the
    if (_ttvNV) {
      await sbInsert('lich_su_cap_the', {
        ma_nv:           _ttvNV.ma_nv,
        ma_the:          maThe,
        loai_su_kien:    'cap_moi',
        ngay_thuc_hien:  new Date().toISOString(),
        ly_do:           'Cấp thẻ thành viên mới tại quầy',
        ngay_het_han_moi: ngayHetHan
      });
    }

    closeModal('modal-cap-the-confirm');
    ttvHienModalThanhCong(maThe, ngayHetHan);

  } catch (err) {
    showToast('Lỗi khi cấp thẻ: ' + err.message, 'err');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Xác nhận cấp thẻ';
  }
}

function ttvHienModalThanhCong(maThe, ngayHetHan) {
  var cardEl = document.getElementById('ttv-success-card');
  var infoEl = document.getElementById('ttv-success-info');
  if (cardEl) cardEl.innerHTML =
    '<div class="ttv-card-brand">CarePoint</div>' +
    '<div class="ttv-card-dots"><span></span><span></span><span></span></div>' +
    '<div class="ttv-card-ma">' + maThe + '</div>' +
    '<div class="ttv-card-name">' + ttvEsc(_ttvKHChon.ho_ten) + '</div>' +
    '<div class="ttv-card-foot">' +
      '<span>' + ttvHangLabel(_ttvHangKhoiDiem).toUpperCase() + '</span>' +
      '<span>HH: ' + ttvFmtNgay(ngayHetHan) + '</span>' +
    '</div>';
  if (infoEl) infoEl.innerHTML =
    'Đã cấp thành công thẻ <strong>' + maThe + '</strong> cho ' +
    '<strong>' + ttvEsc(_ttvKHChon.ho_ten) + '</strong>.<br>' +
    'Hạng: <strong>' + ttvHangLabel(_ttvHangKhoiDiem) + '</strong> &nbsp;·&nbsp; ' +
    'Hết hạn: <strong>' + ttvFmtNgay(ngayHetHan) + '</strong>';
  openModal('modal-cap-the-success');
  showToast('Cấp thẻ thành công!', 'ok');
}

// ---- Helpers ----
function ttvHangLabel(hang) {
  // Ưu tiên ten_hien_thi từ DB nếu đã load
  var found = _ttvCauHinhHang.find(function(h) { return h.hang === hang; });
  if (found) return found.ten_hien_thi;
  return ({ Bronze: 'Đồng', Silver: 'Bạc', Gold: 'Vàng', Platinum: 'Bạch Kim' })[hang] || hang;
}
function ttvHangCls(hang) {
  return ({ Bronze: 'new', Silver: 'bac', Gold: 'vang', Platinum: 'kim' })[hang] || 'new';
}
function ttvHeSo(hang) {
  var found = _ttvCauHinhHang.find(function(h) { return h.hang === hang; });
  return found ? Number(found.he_so_tich_diem).toFixed(1) : '1.0';
}
function ttvFmtNgay(s)  { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function ttvFmtSo(n)    { return Number(n || 0).toLocaleString('vi-VN'); }
function ttvEsc(s)      { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
