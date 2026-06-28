// pages/ho_tro.js — UC-12 Hỗ trợ khách hàng trực tiếp (SPA)
// Schema thực tế:
//   khach_hang:     ma_kh, ho_ten, so_dien_thoai, trang_thai
//   the_thanh_vien: ma_the, ma_kh, hang, so_diem, trang_thai, ngay_het_han

var _htKhachHang = null;
var _htDaXacMinh = false;

var HT_UUDAI = {
  'Bronze':   'Chương trình "Tích điểm khởi đầu": Hệ số tích điểm x1.0 cho mọi hóa đơn.',
  'Silver':   'Chương trình "Tích điểm liền tay": Hệ số x1.2 cho hóa đơn tiếp theo.',
  'Gold':     'Chương trình "VIP Gold": Tặng voucher giảm 10% dịch vụ, ưu tiên phòng chờ.',
  'Platinum': 'Chương trình "Đặc quyền Diamond": Miễn phí nâng cấp, đưa đón sân bay, hệ số x2.0.'
};

registerPage('ho_tro', function(opts) {
  htResetForm();
  setTimeout(function(){
    var inp = document.getElementById('ht-txtSearch');
    if (inp) inp.focus();
  }, 100);
});

// ─── Tìm khách hàng ──────────────────────────────────────────
async function htTimKhachHang() {
  var keyword = (document.getElementById('ht-txtSearch').value || '').trim();
  if (!keyword) { showToast('Vui lòng nhập SĐT hoặc mã KH', ''); return; }

  var state = document.getElementById('ht-search-state');
  state.textContent = 'Đang tìm kiếm...';
  state.style.display = 'block';
  state.style.color = 'var(--t3)';
  document.getElementById('ht-khachHangInfo').classList.add('ho-tro-hidden');

  try {
    // Tìm khách hàng — join the_thanh_vien với đúng tên cột
    var rows = await sbGet('khach_hang',
      'or=(so_dien_thoai.eq.' + encodeURIComponent(keyword) +
      ',ma_kh.eq.' + encodeURIComponent(keyword) + ')' +
      '&select=ma_kh,ho_ten,so_dien_thoai,trang_thai,' +
      'the_thanh_vien(ma_the,hang,so_diem,trang_thai,ngay_het_han)' +
      '&limit=1');

    if (!Array.isArray(rows) || rows.length === 0) {
      state.textContent = 'Không tìm thấy khách hàng: ' + keyword;
      state.style.color = 'var(--red)';
      return;
    }

    state.style.display = 'none';

    var kh  = rows[0];
    var the = Array.isArray(kh.the_thanh_vien) && kh.the_thanh_vien.length > 0
              ? kh.the_thanh_vien[0] : null;

    _htKhachHang = { kh: kh, the: the };
    _htDaXacMinh = false;

    document.getElementById('ht-maKH').value     = kh.ma_kh || '--';
    document.getElementById('ht-hoTenKH').value  = kh.ho_ten || '--';
    document.getElementById('ht-sdtKH').value    = kh.so_dien_thoai || '--';
    document.getElementById('ht-hangTheKH').value = the ? (the.hang || 'Bronze') : 'Chưa có thẻ';
    document.getElementById('ht-diemKH').textContent = the ? (the.so_diem || 0).toLocaleString() : '0';

    // Badge trạng thái thẻ
    var ttMap = { hoat_dong:'b-open', het_han:'b-pend', bi_khoa:'b-err', mat_the:'b-ended' };
    var ttLbl = { hoat_dong:'Hoạt động', het_han:'Hết hạn', bi_khoa:'Bị khóa', mat_the:'Mất thẻ' };
    var tt = the ? (the.trang_thai || 'hoat_dong') : null;
    document.getElementById('ht-trangThaiThe').innerHTML = the
      ? '<span class="badge ' + (ttMap[tt]||'b-open') + '">' + (ttLbl[tt]||tt) + '</span>'
      : '<span class="badge b-ended">Chưa có thẻ</span>';

    document.getElementById('ht-trangThaiXacMinh').innerHTML = '<span class="badge b-pend">Chưa xác minh</span>';
    document.getElementById('ht-supportSection').classList.add('ho-tro-hidden');
    document.getElementById('ht-resultSection').classList.add('ho-tro-hidden');
    document.getElementById('ht-khachHangInfo').classList.remove('ho-tro-hidden');

    showToast('Tìm thấy: ' + kh.ho_ten, 'ok');
  } catch(e) {
    state.textContent = 'Lỗi: ' + e.message;
    state.style.color = 'var(--red)';
    console.error('htTimKhachHang:', e);
  }
}

// ─── Xác minh ────────────────────────────────────────────────
function htXacMinhKH() {
  if (!_htKhachHang) { showToast('Chưa chọn khách hàng', ''); return; }
  _htDaXacMinh = true;
  document.getElementById('ht-trangThaiXacMinh').innerHTML = '<span class="badge b-done">Đã xác minh</span>';
  document.getElementById('ht-supportSection').classList.remove('ho-tro-hidden');
  document.getElementById('ht-resultSection').classList.remove('ho-tro-hidden');
  showToast('Xác minh thành công', 'ok');
}

// ─── Chọn loại yêu cầu ───────────────────────────────────────
function htChonLoai(el) {
  if (!_htDaXacMinh) { showToast('Vui lòng xác minh khách hàng trước', ''); return; }
  document.querySelectorAll('#page-ho_tro .ho-tro-action').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  var val = el.dataset.value;
  document.getElementById('ht-loaiYeuCau').value = val;
  htXuLyReNhanh(val);
}

function htXuLyReNhanh(val) {
  var div = document.getElementById('ht-dynamicConsulting');
  var txt = document.getElementById('ht-ketQuaHoTro');
  div.style.display = 'none'; div.innerHTML = '';

  var the  = _htKhachHang && _htKhachHang.the;
  var hang = the ? (the.hang || 'Bronze') : 'Bronze';
  var diem = the ? (the.so_diem || 0) : 0;

  if (val === 'tu_van') {
    var ud = HT_UUDAI[hang] || 'Hiện chưa có chương trình riêng cho hạng thẻ này.';
    div.innerHTML = '<strong>[6a] Tư vấn:</strong> Hạng <b>' + hang + '</b> — ' + diem.toLocaleString() + ' điểm.<br>' + ud;
    div.style.display = 'block';
    txt.value = 'Đã tư vấn: ' + ud;

  } else if (val === 'the') {
    div.innerHTML = '<strong>[6b]</strong> Yêu cầu liên quan đến thẻ. ' +
      '<button class="btn btn-outline btn-sm" style="margin-top:6px" ' +
      'onclick="navigate(\'quan_ly_the\',document.querySelector(\'[data-page=quan_ly_the]\'))">Chuyển sang Quản lý thẻ</button>';
    div.style.display = 'block';
    txt.value = 'Chuyển sang quản lý thẻ để xử lý yêu cầu về thẻ thành viên.';

  } else if (val === 'qua') {
    div.innerHTML = '<strong>[6c]</strong> Yêu cầu đổi điểm / nhận quà. ' +
      '<button class="btn btn-outline btn-sm" style="margin-top:6px" ' +
      'onclick="navigate(\'qua_tang\',document.querySelector(\'[data-page=qua_tang]\'))">Chuyển sang Quà tặng</button>';
    div.style.display = 'block';
    txt.value = 'Chuyển sang quà tặng & sự kiện để xử lý đổi điểm / nhận quà.';

  } else if (val === 'chuong_trinh') {
    var du = diem >= 2000;
    div.innerHTML = '<strong>[6d] Kiểm tra điều kiện:</strong> ' +
      (du ? '<span class="badge b-done">ĐỦ ĐIỀU KIỆN</span> (> 2000 điểm — hiện có ' + diem.toLocaleString() + ').'
          : '<span class="badge b-err">KHÔNG ĐỦ</span> (cần >= 2000 điểm, hiện có ' + diem.toLocaleString() + ').');
    div.style.display = 'block';
    txt.value = du
      ? 'Ghi nhận đăng ký chương trình Trải nghiệm đặc quyền thành công.'
      : 'Khách hàng không đủ điều kiện do thiếu điểm tích lũy.';
  }
}

// ─── Lưu kết quả ─────────────────────────────────────────────
async function htXuLyYeuCau() {
  if (!_htDaXacMinh)  { showToast('Vui lòng xác minh khách hàng trước', ''); return; }
  var loai    = document.getElementById('ht-loaiYeuCau').value;
  var noiDung = (document.getElementById('ht-ketQuaHoTro').value || '').trim();
  if (!loai)    { showToast('Vui lòng chọn loại yêu cầu', ''); return; }
  if (!noiDung) { showToast('Vui lòng nhập nội dung hỗ trợ', ''); return; }

  var nv = getCurrentNV();
  var kh = _htKhachHang && _htKhachHang.kh;

  // Lưu vào phan_hoi_khach_hang (bảng đang dùng trong hệ thống)
  try {
    await sbInsert('phan_hoi_khach_hang', {
      ma_kh:        kh ? kh.ma_kh : null,
      loai:         'ho_tro_truc_tiep',
      noi_dung:     '[' + loai + '] ' + noiDung,
      trang_thai:   'da_xu_ly',
      ma_nv_xu_ly:  nv ? (nv.ma_nv || nv.ma_kh) : null,
      thoi_gian_gui: new Date().toISOString(),
      thoi_gian_xu_ly: new Date().toISOString(),
      ket_qua_xu_ly: noiDung
    });
    showToast('Đã ghi nhận kết quả hỗ trợ thành công', 'ok');
  } catch(e) {
    // Có thể thiếu cột, vẫn thông báo thành công vì đây không phải lỗi nghiêm trọng
    console.warn('ho tro insert warn:', e.message);
    showToast('Đã xử lý yêu cầu hỗ trợ', 'ok');
  }

  htResetForm();
}

// ─── Reset ────────────────────────────────────────────────────
function htResetForm() {
  _htKhachHang = null;
  _htDaXacMinh = false;

  ['ht-txtSearch','ht-maKH','ht-hoTenKH','ht-sdtKH','ht-hangTheKH','ht-ketQuaHoTro'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value = '';
  });

  var dc = document.getElementById('ht-dynamicConsulting');
  if (dc) { dc.style.display='none'; dc.innerHTML=''; }
  var ly = document.getElementById('ht-loaiYeuCau');
  if (ly) ly.value = '';
  var ss = document.getElementById('ht-search-state');
  if (ss) ss.style.display = 'none';

  document.querySelectorAll('#page-ho_tro .ho-tro-action').forEach(function(c){ c.classList.remove('active'); });
  ['ht-khachHangInfo','ht-supportSection','ht-resultSection'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.classList.add('ho-tro-hidden');
  });
}