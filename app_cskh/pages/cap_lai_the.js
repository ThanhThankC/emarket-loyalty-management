// =============================================================
//  pages/cap_lai_the.js — Cấp lại thẻ thành viên (UC-2.2)
//  Phụ thuộc: router.js, supabase_api.js, auth.js
// =============================================================

var _capLaiNV  = null;  // NV đang đăng nhập
var _capLaiKH  = null;  // KH đang được cấp lại thẻ
var _capLaiThe = null;  // Thẻ hiện tại của KH

registerPage('cap_lai_the', function(opts) {
  _capLaiNV = getCurrentNV();
  resetCapLai();

  // Nếu được chuyển trang kèm dữ liệu (từ quan_ly_the)
  if (opts && opts.maKH) {
    clTimTheoMaKH(opts.maKH);
  }
});

// ---- Reset về trạng thái tìm kiếm ----
function resetCapLai() {
  _capLaiKH  = null;
  _capLaiThe = null;
  var searchEl = document.getElementById('cl-search-area');
  var infoEl   = document.getElementById('cl-info-area');
  if (searchEl) searchEl.style.display = '';
  if (infoEl)   infoEl.style.display   = 'none';
  var inp = document.getElementById('cl-search-inp');
  if (inp) inp.value = '';
  var resEl = document.getElementById('cl-search-result');
  if (resEl) resEl.innerHTML = '';
}

// ---- Tìm kiếm KH ----
async function clTimKiem() {
  var inp     = document.getElementById('cl-search-inp');
  var keyword = inp ? inp.value.trim() : '';
  if (!keyword) { showToast('Nhập SĐT, tên hoặc mã KH để tìm', 'inf'); return; }

  var resEl = document.getElementById('cl-search-result');
  resEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px">Đang tìm...</div>';

  try {
    var isPhone = /^[0-9]+$/.test(keyword);
    var isMaKH  = /^KH/i.test(keyword);
    var filter  = isMaKH  ? 'ma_kh=ilike.*' + keyword + '*' :
                  isPhone ? 'so_dien_thoai=like.*' + keyword + '*' :
                            'ho_ten=ilike.*' + keyword + '*';

    var data = await sbGet('khach_hang',
      filter + '&select=ma_kh,ho_ten,so_dien_thoai,email,trang_thai,' +
      'the_thanh_vien(ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem)&limit=10');

    if (!data || data.length === 0) {
      resEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Không tìm thấy kết quả</div>';
      return;
    }

    resEl.innerHTML = data.map(function(kh) {
      var theRaw  = kh.the_thanh_vien;
      var the     = theRaw ? (Array.isArray(theRaw) ? theRaw[0] : theRaw) : null;
      var daCoThe = !!the;
      var khHopLe = kh.trang_thai === 'hoat_dong';

      var statusNote = !khHopLe ? '<span style="color:var(--red);font-size:12px">KH không hoạt động</span>' :
                       !daCoThe ? '<span style="color:var(--t3);font-size:12px">Chưa có thẻ</span>' : '';

      var btn = (khHopLe && daCoThe)
        ? '<button class="btn btn-yellow btn-sm" onclick="clChonKH(\'' + clEsc(kh.ma_kh) + '\')">Chọn</button>'
        : '<span style="font-size:12px;color:var(--t3)">' + (statusNote || 'Không đủ điều kiện') + '</span>';

      var theInfo = daCoThe
        ? ' &nbsp;·&nbsp; Thẻ: <code style="font-size:11px">' + clEsc(the.ma_the) + '</code>' +
          ' &nbsp;·&nbsp; <span class="ts-' + the.trang_thai + '">' + clTrangThaiLabel(the.trang_thai) + '</span>'
        : ' &nbsp;·&nbsp; <span style="color:var(--t3)">Chưa có thẻ</span>';

      return '<div class="cl-result-item">' +
        '<div>' +
          '<div class="cname">' + clEsc(kh.ho_ten) + '</div>' +
          '<div class="cid">' + clEsc(kh.so_dien_thoai || '') + ' &nbsp;·&nbsp; ' + clEsc(kh.ma_kh) + theInfo + '</div>' +
        '</div>' + btn +
        '</div>';
    }).join('');
  } catch (err) {
    resEl.innerHTML = '<div style="color:var(--red);padding:12px;font-size:13px">Lỗi: ' + err.message + '</div>';
  }
}

function clSearchKeydown(e) {
  if (e.key === 'Enter') clTimKiem();
}

// ---- Load trực tiếp theo mã KH (khi chuyển từ trang khác) ----
async function clTimTheoMaKH(maKH) {
  try {
    var data = await sbGet('khach_hang',
      'ma_kh=eq.' + maKH +
      '&select=ma_kh,ho_ten,so_dien_thoai,email,trang_thai,' +
      'the_thanh_vien(ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem)');
    if (data && data.length > 0) {
      clChonKHObj(data[0]);
    }
  } catch (err) {
    showToast('Lỗi tải thông tin: ' + err.message, 'err');
  }
}

async function clChonKH(maKH) {
  try {
    var data = await sbGet('khach_hang',
      'ma_kh=eq.' + maKH +
      '&select=ma_kh,ho_ten,so_dien_thoai,email,trang_thai,' +
      'the_thanh_vien(ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem)');
    if (data && data.length > 0) clChonKHObj(data[0]);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

function clChonKHObj(kh) {
  var theRaw = kh.the_thanh_vien;
  var the    = theRaw ? (Array.isArray(theRaw) ? theRaw[0] : theRaw) : null;

  if (!the) { showToast('Khách hàng này chưa có thẻ', 'err'); return; }

  _capLaiKH  = kh;
  _capLaiThe = the;

  var searchEl = document.getElementById('cl-search-area');
  var infoEl   = document.getElementById('cl-info-area');
  if (searchEl) searchEl.style.display = 'none';
  if (infoEl)   infoEl.style.display   = '';

  // Render thông tin hiện tại
  document.getElementById('cl-card').innerHTML =
    '<div class="cp-brand">CarePoint</div>' +
    '<div class="cp-dots"><span></span><span></span><span></span></div>' +
    '<div class="cp-ma">' + clEsc(the.ma_the) + '</div>' +
    '<div class="cp-name">' + clEsc(kh.ho_ten || '—') + '</div>' +
    '<div class="cp-foot">' +
      '<span>' + clHangLabel(the.hang) + '</span>' +
      '<span>HH: ' + clFmtNgay(the.ngay_het_han) + '</span>' +
    '</div>';

  document.getElementById('cl-detail').innerHTML = [
    ['Khách hàng',   clEsc(kh.ho_ten || '—')],
    ['SĐT',          clEsc(kh.so_dien_thoai || '—')],
    ['Mã KH',        clEsc(kh.ma_kh)],
    ['Mã thẻ hiện tại', '<code style="font-size:12px">' + clEsc(the.ma_the) + '</code>'],
    ['Hạng',         '<span class="badge hang-' + the.hang + '">' + clHangLabel(the.hang) + '</span>'],
    ['Điểm tích lũy', '<strong>' + clFmtSo(the.so_diem) + ' điểm</strong>'],
    ['Hết hạn',      clFmtNgay(the.ngay_het_han)],
    ['Trạng thái thẻ', '<span class="ts-' + the.trang_thai + '">' + clTrangThaiLabel(the.trang_thai) + '</span>'],
  ].map(function(item) {
    return '<div class="info-item"><div class="lbl">' + item[0] + '</div><div class="val">' + item[1] + '</div></div>';
  }).join('');

  // Reset form lý do
  var lyDoEl = document.getElementById('cl-ly-do');
  var ghiChuEl = document.getElementById('cl-ghi-chu');
  if (lyDoEl) lyDoEl.value = '';
  if (ghiChuEl) ghiChuEl.value = '';
  clCapNhatNutXacNhan();
}

// Kiểm tra lý do đã chọn chưa để bật/tắt nút xác nhận
function clCapNhatNutXacNhan() {
  var lyDoEl = document.getElementById('cl-ly-do');
  var btnEl  = document.getElementById('cl-btn-xacnhan');
  if (btnEl) btnEl.disabled = !(lyDoEl && lyDoEl.value);
}

// ---- Mở modal xác nhận ----
function clMoXacNhan() {
  if (!_capLaiThe || !_capLaiKH) return;
  var lyDoEl   = document.getElementById('cl-ly-do');
  var ghiChuEl = document.getElementById('cl-ghi-chu');
  var lyDo     = lyDoEl ? lyDoEl.value : '';
  var ghiChu   = ghiChuEl ? ghiChuEl.value.trim() : '';

  if (!lyDo) { showToast('Vui lòng chọn lý do cấp lại thẻ', 'err'); return; }

  var lyDoText = lyDo === 'mat_the' ? 'Thẻ bị mất' : lyDo === 'hong_the' ? 'Thẻ bị hỏng' : lyDo;
  var maTheMoi = clGenMaThe();
  var ngayHetHan = _capLaiThe.ngay_het_han; // Kế thừa ngày hết hạn thẻ cũ

  document.getElementById('cl-confirm-body').innerHTML =
    '<div class="info-item" style="margin-bottom:10px">' +
      '<div class="lbl">Khách hàng</div>' +
      '<div class="val">' + clEsc(_capLaiKH.ho_ten) + ' &nbsp;·&nbsp; ' + clEsc(_capLaiKH.ma_kh) + '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">' +
      '<div class="info-item"><div class="lbl">Thẻ cũ (sẽ bị khóa)</div><div class="val" style="color:var(--red);text-decoration:line-through"><code>' + clEsc(_capLaiThe.ma_the) + '</code></div></div>' +
      '<div class="info-item"><div class="lbl">Thẻ mới</div><div class="val" style="color:var(--green)"><code>' + maTheMoi + '</code></div></div>' +
      '<div class="info-item"><div class="lbl">Hạng kế thừa</div><div class="val"><span class="badge hang-' + _capLaiThe.hang + '">' + clHangLabel(_capLaiThe.hang) + '</span></div></div>' +
      '<div class="info-item"><div class="lbl">Điểm kế thừa</div><div class="val"><strong>' + clFmtSo(_capLaiThe.so_diem) + ' điểm</strong></div></div>' +
    '</div>' +
    '<div class="info-item"><div class="lbl">Lý do</div><div class="val">' + clEsc(lyDoText) + (ghiChu ? ' — ' + clEsc(ghiChu) : '') + '</div></div>';

  // Lưu mã thẻ mới để dùng khi xác nhận
  document.getElementById('cl-confirm-btn').dataset.maTheMoi  = maTheMoi;
  document.getElementById('cl-confirm-btn').dataset.lyDo      = lyDo;
  document.getElementById('cl-confirm-btn').dataset.ghiChu    = ghiChu;
  document.getElementById('cl-confirm-btn').dataset.lyDoText  = lyDoText;

  openModal('modal-cap-lai-confirm');
}

// ---- Thực hiện cấp lại thẻ ----
async function clXacNhan() {
  if (!_capLaiThe || !_capLaiKH) return;
  var btn       = document.getElementById('cl-confirm-btn');
  var maTheMoi  = btn.dataset.maTheMoi;
  var lyDo      = btn.dataset.lyDo;
  var ghiChu    = btn.dataset.ghiChu;
  var lyDoText  = btn.dataset.lyDoText;

  btn.disabled    = true;
  btn.textContent = 'Đang xử lý...';

  try {
    // Bước 1: Khóa thẻ cũ (trang_thai → mat_the hoặc bi_khoa tùy lý do)
    var trangThaiCu = lyDo === 'mat_the' ? 'mat_the' : 'bi_khoa';
    await sbUpdate('the_thanh_vien', 'ma_the=eq.' + _capLaiThe.ma_the, {
      trang_thai: trangThaiCu
    });

    // Bước 2: Tạo thẻ mới — kế thừa hang, so_diem, ngay_het_han
    await sbInsert('the_thanh_vien', {
      ma_the:       maTheMoi,
      ma_kh:        _capLaiKH.ma_kh,
      hang:         _capLaiThe.hang,
      ngay_cap:     new Date().toISOString().split('T')[0],
      ngay_het_han: _capLaiThe.ngay_het_han,
      trang_thai:   'hoat_dong',
      so_diem:      _capLaiThe.so_diem
    });

    // Bước 3: Ghi log
    if (_capLaiNV) {
      await sbInsert('lich_su_cap_the', {
        ma_nv:           _capLaiNV.ma_nv,
        ma_the:          maTheMoi,
        loai_su_kien:    'cap_lai',
        ngay_thuc_hien:  new Date().toISOString(),
        ly_do:           lyDoText + (ghiChu ? '. ' + ghiChu : '') + '. Thẻ cũ: ' + _capLaiThe.ma_the,
        ngay_het_han_moi: _capLaiThe.ngay_het_han
      });
    }

    closeModal('modal-cap-lai-confirm');
    showToast('Cấp lại thẻ thành công! Mã thẻ mới: ' + maTheMoi, 'ok');
    clHienModalThanhCong(maTheMoi);

  } catch (err) {
    showToast('Lỗi khi cấp lại thẻ: ' + err.message, 'err');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Xác nhận cấp lại';
  }
}

function clHienModalThanhCong(maTheMoi) {
  var cardEl = document.getElementById('cl-success-card');
  var infoEl = document.getElementById('cl-success-info');
  if (cardEl) cardEl.innerHTML =
    '<div class="cp-brand">CarePoint</div>' +
    '<div class="cp-dots"><span></span><span></span><span></span></div>' +
    '<div class="cp-ma">' + maTheMoi + '</div>' +
    '<div class="cp-name">' + clEsc(_capLaiKH.ho_ten || '—') + '</div>' +
    '<div class="cp-foot">' +
      '<span>' + clHangLabel(_capLaiThe.hang) + '</span>' +
      '<span>HH: ' + clFmtNgay(_capLaiThe.ngay_het_han) + '</span>' +
    '</div>';
  if (infoEl) infoEl.innerHTML =
    'Đã cấp lại thành công thẻ <strong>' + maTheMoi + '</strong> cho ' +
    '<strong>' + clEsc(_capLaiKH.ho_ten) + '</strong>.<br>' +
    'Thẻ cũ <strong>' + clEsc(_capLaiThe.ma_the) + '</strong> đã bị khóa. ' +
    'Điểm và hạng được giữ nguyên.';
  openModal('modal-cap-lai-success');
}

function clQuayLai() { resetCapLai(); }

function clGenMaThe() {
  return 'THE' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2,5).toUpperCase();
}

function clFmtNgay(s)   { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function clFmtSo(n)     { return Number(n || 0).toLocaleString('vi-VN'); }
function clEsc(s)       { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function clHangLabel(h) { return ({Bronze:'Đồng',Silver:'Bạc',Gold:'Vàng',Platinum:'Bạch Kim'})[h] || h; }
function clTrangThaiLabel(ts) { return ({hoat_dong:'Hoạt động',het_han:'Hết hạn',bi_khoa:'Bị khóa',mat_the:'Mất thẻ'})[ts] || ts; }
