// =============================================================
//  pages/gia_han.js — Gia hạn thẻ thành viên (SPA version)
//  UC-2.3: Gia hạn thẻ thành viên
//  Phụ thuộc: router.js (navigate, openModal, closeModal, showToast)
//             supabase_api.js, auth.js
// =============================================================

var _giaHanNV  = null;  // NV đang đăng nhập
var _giaHanThe = null;  // Thẻ đang được gia hạn (object đầy đủ)

registerPage('gia_han', function(opts) {
  _giaHanNV = getCurrentNV();

  // Nếu được chuyển thẳng từ modal Chi tiết thẻ (quan_ly_the.js)
  if (opts && opts.maThe) {
    _giaHanThe = opts.the || null;
    if (_giaHanThe) {
      hienThiThongTinThe(_giaHanThe);
    } else {
      // Chỉ có maThe, cần load lại từ DB
      loadTheTheoMa(opts.maThe);
    }
  } else {
    // Vào thẳng từ sidebar — hiển thị ô tìm kiếm, xóa trạng thái cũ
    resetGiaHan();
  }
});

// ---- Reset toàn bộ trang về trạng thái tìm kiếm ----
function resetGiaHan() {
  _giaHanThe = null;
  var searchEl = document.getElementById('gh-search-area');
  var infoEl   = document.getElementById('gh-info-area');
  if (searchEl) searchEl.style.display = '';
  if (infoEl)   infoEl.style.display   = 'none';
  var inp = document.getElementById('gh-search-inp');
  if (inp) inp.value = '';
  var resultEl = document.getElementById('gh-search-result');
  if (resultEl) resultEl.innerHTML = '';
}

// ---- Tìm kiếm khách hàng / mã thẻ ----
async function ghTimKiem() {
  var inp     = document.getElementById('gh-search-inp');
  var keyword = inp ? inp.value.trim() : '';
  if (!keyword) { showToast('Nhập SĐT, tên hoặc mã thẻ để tìm', 'inf'); return; }

  var resultEl = document.getElementById('gh-search-result');
  resultEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px">Đang tìm...</div>';

  try {
    var isPhone = /^[0-9]+$/.test(keyword);
    var isMaThe = /^THE/i.test(keyword);

    var data;
    if (isMaThe) {
      // Tìm theo mã thẻ
      data = await sbGet('the_thanh_vien',
        'ma_the=ilike.*' + keyword + '*' +
        '&select=ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem,ma_kh,' +
        'khach_hang(ho_ten,so_dien_thoai,email)&limit=10');
    } else {
      // Tìm theo SĐT hoặc tên → join qua khach_hang
      var khParams = (isPhone
        ? 'so_dien_thoai=like.*' + keyword + '*'
        : 'ho_ten=ilike.*' + keyword + '*') +
        '&select=ma_kh,ho_ten,so_dien_thoai,the_thanh_vien(ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem)&limit=10';
      var khData = await sbGet('khach_hang', khParams);
      // Chuyển thành cùng cấu trúc với tìm theo mã thẻ
      // Lưu ý: Supabase trả về object (không phải array) khi quan hệ là 1-1 (UNIQUE FK)
      data = [];
      (khData || []).forEach(function(kh) {
        var theRaw = kh.the_thanh_vien;
        if (!theRaw) return;
        // Chuẩn hóa về array dù Supabase trả object hay array
        var theArr = Array.isArray(theRaw) ? theRaw : [theRaw];
        theArr.forEach(function(the) {
          data.push(Object.assign({}, the, { khach_hang: { ho_ten: kh.ho_ten, so_dien_thoai: kh.so_dien_thoai, email: kh.email } }));
        });
      });
    }

    if (!data || data.length === 0) {
      resultEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Không tìm thấy kết quả</div>';
      return;
    }

    resultEl.innerHTML = data.map(function(the) {
      var kh = the.khach_hang || {};
      var canGiaHan = the.trang_thai === 'hoat_dong' || the.trang_thai === 'het_han';
      var trangTag  = '<span class="ts-' + the.trang_thai + '">' + ghTrangThaiLabel(the.trang_thai) + '</span>';
      var btn = canGiaHan
        ? '<button class="btn btn-yellow btn-sm" onclick="ghChonThe(\'' + escGh(the.ma_the) + '\')">Chọn gia hạn</button>'
        : '<span style="font-size:12px;color:var(--t3)">Không thể gia hạn</span>';
      return '<div class="gh-result-item">' +
        '<div>' +
          '<div class="cname">' + escGh(kh.ho_ten || '—') + '</div>' +
          '<div class="cid">' + escGh(kh.so_dien_thoai || '') + ' &nbsp;·&nbsp; ' + escGh(the.ma_the) + ' &nbsp;·&nbsp; ' + trangTag + '</div>' +
          '<div class="cid" style="margin-top:3px">Hết hạn: ' + ghFmtNgay(the.ngay_het_han) + '</div>' +
        '</div>' + btn +
        '</div>';
    }).join('');
  } catch (err) {
    resultEl.innerHTML = '<div style="color:var(--red);padding:12px;font-size:13px">Lỗi: ' + err.message + '</div>';
  }
}

// Enter để tìm
function ghSearchKeydown(e) {
  if (e.key === 'Enter') ghTimKiem();
}

// ---- Load thẻ từ DB theo mã (khi chuyển trang mà chưa có obj đầy đủ) ----
async function loadTheTheoMa(maThe) {
  try {
    var data = await sbGet('the_thanh_vien',
      'ma_the=eq.' + maThe +
      '&select=ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem,ma_kh,' +
      'khach_hang(ho_ten,so_dien_thoai,email)');
    if (data && data.length > 0) {
      _giaHanThe = data[0];
      hienThiThongTinThe(_giaHanThe);
    } else {
      showToast('Không tìm thấy thẻ ' + maThe, 'err');
      resetGiaHan();
    }
  } catch (err) {
    showToast('Lỗi tải thông tin thẻ: ' + err.message, 'err');
    resetGiaHan();
  }
}

// ---- Người dùng chọn một thẻ từ kết quả tìm kiếm ----
async function ghChonThe(maThe) {
  try {
    var data = await sbGet('the_thanh_vien',
      'ma_the=eq.' + maThe +
      '&select=ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem,ma_kh,' +
      'khach_hang(ho_ten,so_dien_thoai,email)');
    if (data && data.length > 0) {
      _giaHanThe = data[0];
      hienThiThongTinThe(_giaHanThe);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

// ---- Hiển thị thông tin thẻ đã chọn ----
function hienThiThongTinThe(the) {
  var kh = the.khach_hang || {};
  var searchEl = document.getElementById('gh-search-area');
  var infoEl   = document.getElementById('gh-info-area');
  if (searchEl) searchEl.style.display = 'none';
  if (infoEl)   infoEl.style.display   = '';

  // Tính ngày hết hạn mới (+12 tháng từ hôm nay)
  var ngayMoi = new Date();
  ngayMoi.setMonth(ngayMoi.getMonth() + 12);
  var ngayMoiStr = ngayMoi.toISOString().split('T')[0];

  // Tính số ngày còn lại
  var diff = Math.floor((new Date(the.ngay_het_han) - new Date()) / 86400000);
  var hetHanNote = diff < 0
    ? '<span style="color:var(--red);font-weight:600">Đã hết hạn ' + Math.abs(diff) + ' ngày</span>'
    : diff <= 30
      ? '<span style="color:var(--orange);font-weight:600">Còn ' + diff + ' ngày</span>'
      : '<span style="color:var(--green);font-weight:600">Còn ' + diff + ' ngày</span>';

  // Card thẻ
  document.getElementById('gh-card').innerHTML =
    '<div class="cp-brand">CarePoint</div>' +
    '<div class="cp-dots"><span></span><span></span><span></span></div>' +
    '<div class="cp-ma">' + escGh(the.ma_the) + '</div>' +
    '<div class="cp-name">' + escGh(kh.ho_ten || '—') + '</div>' +
    '<div class="cp-foot">' +
      '<span>' + ghHangLabel(the.hang) + '</span>' +
      '<span>HH: ' + ghFmtNgay(the.ngay_het_han) + '</span>' +
    '</div>';

  // Thông tin chi tiết
  document.getElementById('gh-detail').innerHTML = [
    ['Khách hàng', escGh(kh.ho_ten || '—')],
    ['SĐT',        escGh(kh.so_dien_thoai || '—')],
    ['Mã thẻ',     escGh(the.ma_the)],
    ['Hạng',       '<span class="badge hang-' + the.hang + '">' + ghHangLabel(the.hang) + '</span>'],
    ['Điểm hiện có', ghFmtSo(the.so_diem) + ' điểm'],
    ['Trạng thái', '<span class="ts-' + the.trang_thai + '">' + ghTrangThaiLabel(the.trang_thai) + '</span>'],
    ['Hết hạn hiện tại', ghFmtNgay(the.ngay_het_han) + '&nbsp;&nbsp;' + hetHanNote],
    ['Hết hạn mới (sau gia hạn)', '<strong style="color:var(--green)">' + ghFmtNgay(ngayMoiStr) + '</strong>'],
  ].map(function(item) {
    return '<div class="info-item"><div class="lbl">' + item[0] + '</div>' +
           '<div class="val">' + item[1] + '</div></div>';
  }).join('');

  // Hiện/ẩn nút gia hạn
  var btnGiaHan = document.getElementById('gh-btn-giah');
  var warnEl    = document.getElementById('gh-warn');
  if (the.trang_thai === 'bi_khoa') {
    btnGiaHan.style.display = 'none';
    warnEl.style.display    = '';
    warnEl.textContent      = 'Thẻ đang bị khóa — không thể gia hạn.';
  } else if (the.trang_thai === 'mat_the') {
    btnGiaHan.style.display = 'none';
    warnEl.style.display    = '';
    warnEl.textContent      = 'Thẻ đã báo mất — không thể gia hạn.';
  } else {
    btnGiaHan.style.display = '';
    warnEl.style.display    = 'none';
  }

  // Lưu ngày mới vào dataset để dùng khi xác nhận
  btnGiaHan.dataset.ngayMoi = ngayMoiStr;
}

// ---- Nhấn nút "Gia hạn thẻ" — mở modal xác nhận ----
function ghMoXacNhan() {
  if (!_giaHanThe) return;
  var btn = document.getElementById('gh-btn-giah');
  var ngayMoi = btn ? btn.dataset.ngayMoi : null;
  if (!ngayMoi) return;

  var kh = _giaHanThe.khach_hang || {};
  var diff = Math.floor((new Date(_giaHanThe.ngay_het_han) - new Date()) / 86400000);

  // Nếu thẻ còn hạn > 30 ngày, cần cảnh báo thêm
  var extraWarn = '';
  if (diff > 30) {
    extraWarn = '<div style="margin-top:10px;padding:10px 14px;background:var(--bg);border:1px solid var(--y);border-radius:var(--r);font-size:13px;color:var(--t2)">' +
      'Thẻ vẫn còn hiệu lực đến ' + ghFmtNgay(_giaHanThe.ngay_het_han) + ' (' + diff + ' ngày). ' +
      'Bạn có chắc muốn gia hạn sớm?</div>';
  }

  document.getElementById('gh-confirm-body').innerHTML =
    '<div class="info-item" style="margin-bottom:10px">' +
      '<div class="lbl">Khách hàng</div>' +
      '<div class="val">' + escGh(kh.ho_ten || '—') + ' &nbsp;·&nbsp; ' + escGh(_giaHanThe.ma_the) + '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div class="info-item"><div class="lbl">Hết hạn hiện tại</div><div class="val" style="color:var(--t2)">' + ghFmtNgay(_giaHanThe.ngay_het_han) + '</div></div>' +
      '<div class="info-item"><div class="lbl">Hết hạn mới</div><div class="val" style="color:var(--green);font-weight:700">' + ghFmtNgay(ngayMoi) + '</div></div>' +
    '</div>' + extraWarn;

  document.getElementById('gh-confirm-btn').dataset.ngayMoi = ngayMoi;
  openModal('modal-gia-han-confirm');
}

// ---- Xác nhận gia hạn — ghi DB ----
async function ghXacNhan() {
  if (!_giaHanThe) return;
  var btn = document.getElementById('gh-confirm-btn');
  var ngayMoi = btn ? btn.dataset.ngayMoi : null;
  if (!ngayMoi) return;

  btn.disabled    = true;
  btn.textContent = 'Đang xử lý...';

  try {
    var ngayCu = _giaHanThe.ngay_het_han;

    // Cập nhật ngày hết hạn + đổi trạng thái về hoat_dong nếu đang het_han
    var updateData = { ngay_het_han: ngayMoi };
    if (_giaHanThe.trang_thai === 'het_han') {
      updateData.trang_thai = 'hoat_dong';
    }
    await sbUpdate('the_thanh_vien', 'ma_the=eq.' + _giaHanThe.ma_the, updateData);

    // Ghi log lich_su_cap_the
    if (_giaHanNV) {
      await sbInsert('lich_su_cap_the', {
        ma_nv:           _giaHanNV.ma_nv,
        ma_the:          _giaHanThe.ma_the,
        loai_su_kien:    'gia_han',
        ngay_thuc_hien:  new Date().toISOString(),
        ly_do:           'Gia hạn thẻ thành viên. Hạn cũ: ' + ngayCu,
        ngay_het_han_moi: ngayMoi
      });
    }

    closeModal('modal-gia-han-confirm');
    showToast('Gia hạn thẻ thành công! Hạn mới: ' + ghFmtNgay(ngayMoi), 'ok');

    // Cập nhật lại object local và re-render
    _giaHanThe.ngay_het_han = ngayMoi;
    if (updateData.trang_thai) _giaHanThe.trang_thai = updateData.trang_thai;
    hienThiThongTinThe(_giaHanThe);

  } catch (err) {
    showToast('Lỗi khi gia hạn: ' + err.message, 'err');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Xác nhận gia hạn';
  }
}

// ---- Quay lại tìm kiếm ----
function ghQuayLai() {
  resetGiaHan();
}

// ---- Helpers ----
function ghFmtNgay(s)  { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function ghFmtSo(n)    { return Number(n || 0).toLocaleString('vi-VN'); }
function escGh(s)      { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function ghHangLabel(hang)  { return ({Bronze:'Đồng',Silver:'Bạc',Gold:'Vàng',Platinum:'Bạch Kim'})[hang] || hang; }
function ghTrangThaiLabel(ts) { return ({hoat_dong:'Hoạt động',het_han:'Hết hạn',bi_khoa:'Bị khóa',mat_the:'Mất thẻ'})[ts] || ts; }
