// =============================================================
//  pages/cap_the.js — Cấp thẻ thành viên mới (SPA version)
//  Logic giữ nguyên 100% — chỉ bỏ requireLogin/DOMContentLoaded
//  openModal/closeModal/showToast dùng từ router.js
// =============================================================

var _capTheNV     = null;  // lưu NV hiện tại khi initPage chạy
var _hangKhoiDiem = 'Bronze';  // Hạng có diem_toi_thieu = 0, load từ DB khi init

registerPage('cap_the', function(opts) {
  _capTheNV = getCurrentNV();
  // Load hạng khởi điểm từ DB để không hardcode 'Bronze'
  capTheLoadHangKhoiDiem();

  // Live preview khi nhập tên
  var hotenEl   = document.getElementById('new-hoten');
  var thoiHanEl = document.getElementById('new-thoihan');
  if (hotenEl)   hotenEl.addEventListener('input', updatePreview);
  if (thoiHanEl) thoiHanEl.addEventListener('change', updatePreview);
  updatePreview();

  // Reset về tab mặc định mỗi lần vào trang
  switchTab('moi');
});

function switchTab(tab) {
  ['moi','cu'].forEach(function(t) {
    var panel = document.getElementById('panel-' + t);
    var tabEl = document.getElementById('tab-'   + t);
    if (panel) panel.style.display = t === tab ? '' : 'none';
    if (tabEl) tabEl.classList.toggle('active', t === tab);
  });
}

// ---- Live preview thẻ ----
function updatePreview() {
  var hotenEl   = document.getElementById('new-hoten');
  var thoiHanEl = document.getElementById('new-thoihan');
  if (!hotenEl || !thoiHanEl) return;
  var ten     = hotenEl.value.trim() || 'Họ tên khách hàng';
  var thoiHan = parseInt(thoiHanEl.value) || 2;
  var hetHan  = new Date();
  hetHan.setFullYear(hetHan.getFullYear() + thoiHan);

  var nameEl = document.getElementById('prev-name-new');
  var dateEl = document.getElementById('prev-date-new');
  if (nameEl) nameEl.textContent = ten;
  if (dateEl) dateEl.textContent = 'HH: ' + hetHan.toLocaleDateString('vi-VN');
}

// ---- Load hạng khởi điểm từ DB (diem_toi_thieu = 0) ----
async function capTheLoadHangKhoiDiem() {
  try {
    var data = await sbGet('cau_hinh_hang_thanh_vien',
      'diem_toi_thieu=eq.0&select=hang,ten_hien_thi&limit=1');
    if (data && data.length > 0) {
      _hangKhoiDiem = data[0].hang;
      // Cập nhật hiển thị trên form
      var hangSelectEl = document.getElementById('new-hang');
      if (hangSelectEl) {
        hangSelectEl.innerHTML = '<option value="' + _hangKhoiDiem + '">' + data[0].ten_hien_thi + ' (mặc định)</option>';
      }
      var hintEl = document.querySelector('.fhint');
      if (hintEl) hintEl.textContent = 'Khách hàng mới luôn bắt đầu ở hạng ' + data[0].ten_hien_thi;
    }
  } catch (err) {
    // Fallback về Bronze nếu không load được
    console.warn('Không load được hạng khởi điểm, dùng Bronze mặc định:', err.message);
  }
}

// ---- Sinh mã ----
function genMaThe() {
  return 'THE' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2,5).toUpperCase();
}
function genMaKH() {
  return 'KH' + Date.now().toString().slice(-5) + Math.random().toString(36).slice(2,4).toUpperCase();
}

async function kiemTraSdt(sdt) {
  var data = await sbGet('khach_hang', 'so_dien_thoai=eq.' + encodeURIComponent(sdt) + '&select=ma_kh');
  return data && data.length > 0 ? data[0] : null;
}

function clearSdtError() {
  var hint = document.getElementById('sdt-hint');
  var inp  = document.getElementById('new-sdt');
  if (hint) hint.style.display = 'none';
  if (inp)  inp.style.borderColor = '';
}

// ---- Cấp thẻ cho khách hàng MỚI ----
async function capTheMoi() {
  var hoTen    = document.getElementById('new-hoten').value.trim();
  var sdt      = document.getElementById('new-sdt').value.trim();
  var email    = document.getElementById('new-email').value.trim();
  var ngaySinh = document.getElementById('new-ngaysinh').value;
  var gioiTinh = document.getElementById('new-gioitinh').value;
  var diaChi   = document.getElementById('new-diachi').value.trim();
  var thoiHan  = parseInt(document.getElementById('new-thoihan').value);
  var matKhau  = document.getElementById('new-matkhau').value;

  if (!hoTen || !sdt || !matKhau) {
    showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'err'); return;
  }
  if (!/^0[0-9]{9}$/.test(sdt)) {
    showToast('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)', 'err'); return;
  }
  if (matKhau.length < 6) {
    showToast('Mật khẩu tối thiểu 6 ký tự', 'err'); return;
  }

  var btn = document.getElementById('btn-cap-moi');
  btn.disabled    = true;
  btn.textContent = 'Đang xử lý…';

  try {
    var tonTai = await kiemTraSdt(sdt);
    if (tonTai) {
      document.getElementById('sdt-hint').style.display = 'block';
      document.getElementById('new-sdt').style.borderColor = 'var(--red)';
      showToast('Số điện thoại này đã được đăng ký', 'err');
      return;
    }

    var maKH  = genMaKH();
    var maThe = genMaThe();
    var ngayHetHan = new Date();
    ngayHetHan.setFullYear(ngayHetHan.getFullYear() + thoiHan);
    var ngayHetHanStr = ngayHetHan.toISOString().split('T')[0];

    await sbInsert('khach_hang', {
      ma_kh: maKH, ho_ten: hoTen, ngay_sinh: ngaySinh || null,
      gioi_tinh: gioiTinh || null, so_dien_thoai: sdt,
      email: email || null, dia_chi: diaChi || null,
      mat_khau_hash: matKhau,
      ngay_dang_ky: new Date().toISOString().split('T')[0],
      trang_thai: 'hoat_dong'
    });

    await sbInsert('the_thanh_vien', {
      ma_the: maThe, ma_kh: maKH, hang: _hangKhoiDiem,
      ngay_cap: new Date().toISOString().split('T')[0],
      ngay_het_han: ngayHetHanStr,
      trang_thai: 'hoat_dong', so_diem: 0
    });

    if (_capTheNV) {
      await sbInsert('lich_su_cap_the', {
        ma_nv: _capTheNV.ma_nv, ma_the: maThe,
        loai_su_kien: 'cap_moi',
        ngay_thuc_hien: new Date().toISOString(),
        ly_do: 'Đăng ký thành viên mới',
        ngay_het_han_moi: ngayHetHanStr
      });
    }

    hienModalThanhCong(hoTen, maKH, maThe, ngayHetHanStr);

  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Cấp thẻ';
  }
}

// ---- Cấp thẻ cho khách hàng CŨ ----
async function timKhachHang() {
  var keyword    = document.getElementById('search-cu').value.trim();
  if (!keyword) { showToast('Nhập SĐT hoặc tên để tìm', 'inf'); return; }
  var resultDiv = document.getElementById('cu-result');
  resultDiv.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px">Đang tìm…</div>';
  try {
    var isPhone = /^[0-9]+$/.test(keyword);
    var params  = (isPhone
      ? 'so_dien_thoai=like.*' + keyword + '*'
      : 'ho_ten=ilike.*' + keyword + '*') +
      '&select=ma_kh,ho_ten,so_dien_thoai,email,the_thanh_vien(ma_the)&limit=10';
    var data = await sbGet('khach_hang', params);
    if (!data || data.length === 0) {
      resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Không tìm thấy khách hàng</div>';
      return;
    }
    resultDiv.innerHTML = data.map(function(kh) {
      // Supabase trả object (không phải array) vì the_thanh_vien có UNIQUE FK với khach_hang (quan hệ 1-1)
      var theRaw  = kh.the_thanh_vien;
      var daCoThe = theRaw && (Array.isArray(theRaw) ? theRaw.length > 0 : true);
      return '<div class="kh-result-item">' +
        '<div><div class="cname">' + escHtml(kh.ho_ten) + '</div>' +
        '<div class="cid">' + escHtml(kh.so_dien_thoai) + ' &nbsp;·&nbsp; ' + escHtml(kh.ma_kh) + '</div></div>' +
        (daCoThe
          ? '<span class="badge b-done">Đã có thẻ</span>'
          : '<button class="btn btn-yellow btn-sm" onclick="capTheCu(\'' + kh.ma_kh + '\',\'' + escHtml(kh.ho_ten) + '\')">Cấp thẻ</button>') +
        '</div>';
    }).join('');
  } catch (err) {
    resultDiv.innerHTML = '<div style="color:var(--red);padding:12px;font-size:13px">Lỗi: ' + err.message + '</div>';
  }
}

async function capTheCu(maKH, hoTen) {
  if (!confirm('Xác nhận cấp thẻ thành viên mới cho "' + hoTen + '"?')) return;
  try {
    var maThe = genMaThe();
    var ngayHetHan = new Date();
    ngayHetHan.setFullYear(ngayHetHan.getFullYear() + 2);
    var ngayHetHanStr = ngayHetHan.toISOString().split('T')[0];

    await sbInsert('the_thanh_vien', {
      ma_the: maThe, ma_kh: maKH, hang: _hangKhoiDiem,
      ngay_cap: new Date().toISOString().split('T')[0],
      ngay_het_han: ngayHetHanStr,
      trang_thai: 'hoat_dong', so_diem: 0
    });

    if (_capTheNV) {
      await sbInsert('lich_su_cap_the', {
        ma_nv: _capTheNV.ma_nv, ma_the: maThe,
        loai_su_kien: 'cap_moi',
        ngay_thuc_hien: new Date().toISOString(),
        ly_do: 'Cấp thẻ cho khách hàng đã có tài khoản',
        ngay_het_han_moi: ngayHetHanStr
      });
    }
    hienModalThanhCong(hoTen, maKH, maThe, ngayHetHanStr);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

function hienModalThanhCong(hoTen, maKH, maThe, ngayHetHan) {
  var infoEl = document.getElementById('success-info');
  var cardEl = document.getElementById('success-card');
  if (infoEl) infoEl.innerHTML =
    'Đã tạo thành công thẻ <strong>' + maThe + '</strong> cho khách hàng <strong>' + escHtml(hoTen) + '</strong>.<br/>' +
    'Mã KH: <strong>' + maKH + '</strong> &nbsp;·&nbsp; Hết hạn: <strong>' + fmtNgay(ngayHetHan) + '</strong>';
  if (cardEl) cardEl.innerHTML =
    '<div class="cp-brand">CarePoint</div>' +
    '<div class="cp-dots"><span></span><span></span><span></span></div>' +
    '<div class="cp-ma">' + maThe + '</div>' +
    '<div class="cp-name">' + escHtml(hoTen) + '</div>' +
    '<div class="cp-foot"><span>DONG</span><span>HH: ' + fmtNgay(ngayHetHan) + '</span></div>';
  openModal('modal-success');
  showToast('Cấp thẻ thành công!', 'ok');
}

function resetForm() {
  ['new-hoten','new-sdt','new-email','new-ngaysinh','new-diachi','new-matkhau'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var gt = document.getElementById('new-gioitinh');
  var th = document.getElementById('new-thoihan');
  if (gt) gt.value = '';
  if (th) th.value = '2';
  clearSdtError();
  updatePreview();
}

function fmtNgay(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
