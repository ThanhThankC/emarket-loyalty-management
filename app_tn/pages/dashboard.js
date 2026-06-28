// pages/dashboard.js
// Dashboard hoàn chỉnh: thống kê ca, giao dịch gần đây, nhật ký ca làm

registerPage('dashboard', function(opts) {
  var nv = getCurrentNV();
  if (!nv) return;

  var sub  = document.getElementById('dashSub');
  var gsub = document.getElementById('gband-sub');

  if (sub)  sub.textContent  = 'Xin chào, ' + nv.ho_ten;
  if (gsub) gsub.textContent = 'Chào ' + nv.ho_ten + '! Quầy của bạn đang hoạt động.';

  loadThongKeCa();
  loadGiaoDichGanDay();
  loadNhatKyCaLam();
});

// ─── Helpers ──────────────────────────────────────────────────
function _hom_nay_start() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function _fmt_gio(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  return d.getHours().toString().padStart(2,'0') + ':' +
         d.getMinutes().toString().padStart(2,'0');
}

function _set_sc(idx, val, sub) {
  var grid = document.getElementById('sc-grid');
  if (!grid) return;
  var cards = grid.querySelectorAll('.sc');
  if (!cards[idx]) return;
  cards[idx].querySelector('.sval').textContent = val;
  if (sub !== undefined) cards[idx].querySelector('.ssub').textContent = sub;
}

// ─── 1. Thống kê ca (hôm nay) ────────────────────────────────
async function loadThongKeCa() {
  var start = _hom_nay_start();

  try {
    // 1a. Khách phục vụ = số giao dịch quy đổi điểm hôm nay (distinct thẻ)
    sbGet('lich_su_giao_dich_diem',
      'loai_gd=eq.tieu_diem&ngay_gd=gte.' + encodeURIComponent(start) +
      '&select=ma_the'
    ).then(function(rows) {
      var uniq = new Set((rows || []).map(function(r) { return r.ma_the; }));
      _set_sc(0, uniq.size, 'Hôm nay');
    }).catch(function() { _set_sc(0, '—', 'Lỗi tải'); });

    // 1b. Thẻ đã cấp hôm nay
    sbGet('lich_su_cap_the',
      'loai_su_kien=eq.cap_moi&ngay_thuc_hien=gte.' + encodeURIComponent(start) +
      '&select=ma_the'
    ).then(function(rows) {
      _set_sc(1, (rows || []).length, 'Hôm nay');
    }).catch(function() { _set_sc(1, '—', 'Lỗi tải'); });

    // 1c. Giao dịch quy đổi điểm hôm nay
    sbGet('lich_su_giao_dich_diem',
      'loai_gd=eq.tieu_diem&ngay_gd=gte.' + encodeURIComponent(start) +
      '&select=ma_gd'
    ).then(function(rows) {
      _set_sc(2, (rows || []).length, 'Hôm nay');
    }).catch(function() { _set_sc(2, '—', 'Lỗi tải'); });

    // 1d. Khách hàng mới thêm hôm nay
    sbGet('khach_hang',
      'created_at=gte.' + encodeURIComponent(start) + '&select=ma_kh'
    ).then(function(rows) {
      _set_sc(3, (rows || []).length, 'Hôm nay');
    }).catch(function() { _set_sc(3, '—', 'Lỗi tải'); });

  } catch(e) {
    console.error('loadThongKeCa lỗi:', e);
  }
}

// ─── 2. Giao dịch gần đây trong ca ───────────────────────────
async function loadGiaoDichGanDay() {
  var tbody = document.getElementById('tbl-giao-dich-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--t3);padding:18px;">Đang tải...</td></tr>';

  try {
    var start = _hom_nay_start();
    var rows = await sbGet(
      'lich_su_giao_dich_diem',
      'ngay_gd=gte.' + encodeURIComponent(start) +
      '&select=ma_gd,loai_gd,so_diem,ngay_gd,ghi_chu,the_thanh_vien(khach_hang(ho_ten))' +
      '&order=ngay_gd.desc&limit=10'
    );

    // Cũng lấy lịch sử cấp thẻ hôm nay
    var capThe = await sbGet(
      'lich_su_cap_the',
      'ngay_thuc_hien=gte.' + encodeURIComponent(start) +
      '&select=ma_the,loai_su_kien,ngay_thuc_hien,the_thanh_vien(khach_hang(ho_ten))' +
      '&order=ngay_thuc_hien.desc&limit=10'
    );

    // Gộp và sắp xếp theo giờ
    var all = [];

    (rows || []).forEach(function(r) {
      all.push({
        ten: r.the_thanh_vien && r.the_thanh_vien.khach_hang
              ? r.the_thanh_vien.khach_hang.ho_ten : 'Khách hàng',
        loai: r.loai_gd === 'tieu_diem' ? 'Quy đổi điểm' : 'Tích điểm',
        gio: r.ngay_gd,
        ket_qua: r.loai_gd === 'tieu_diem'
                  ? '−' + Math.abs(Number(r.so_diem)) + ' điểm'
                  : '+' + Math.abs(Number(r.so_diem)) + ' điểm',
        ok: r.loai_gd === 'tieu_diem'
      });
    });

    (capThe || []).forEach(function(r) {
      all.push({
        ten: r.the_thanh_vien && r.the_thanh_vien.khach_hang
              ? r.the_thanh_vien.khach_hang.ho_ten : 'Khách hàng',
        loai: 'Cấp thẻ mới',
        gio: r.ngay_thuc_hien,
        ket_qua: 'Thành công',
        ok: true
      });
    });

    all.sort(function(a, b) { return new Date(b.gio) - new Date(a.gio); });
    all = all.slice(0, 10);

    if (all.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--t3);padding:24px;">Chưa có giao dịch nào hôm nay</td></tr>';
      return;
    }

    tbody.innerHTML = all.map(function(item) {
      var badgeClass = item.ok ? 'badge b-done' : 'badge b-err';
      return '<tr>' +
        '<td><b>' + _esc(item.ten) + '</b></td>' +
        '<td>' + _esc(item.loai) + '</td>' +
        '<td style="color:var(--t2)">' + _fmt_gio(item.gio) + '</td>' +
        '<td><span class="' + badgeClass + '">' + _esc(item.ket_qua) + '</span></td>' +
        '</tr>';
    }).join('');

  } catch(e) {
    console.error('loadGiaoDichGanDay lỗi:', e);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--red);padding:18px;">Không thể tải dữ liệu</td></tr>';
  }
}

// ─── 3. Nhật ký ca làm (timeline hoạt động) ──────────────────
async function loadNhatKyCaLam() {
  var panelEl  = document.getElementById('panel-nhat-ky');
  var rongEl   = document.getElementById('nhat-ky-rong');
  if (!panelEl || !rongEl) return;
  rongEl.textContent = 'Đang tải...';

  try {
    var start = _hom_nay_start();
    var nv = getCurrentNV();

    // Lấy hoạt động của nhân viên hiện tại trong ca
    var capThe = await sbGet(
      'lich_su_cap_the',
      'ma_nv=eq.' + encodeURIComponent(nv.ma_nv) +
      '&ngay_thuc_hien=gte.' + encodeURIComponent(start) +
      '&select=ma_the,loai_su_kien,ngay_thuc_hien,ly_do' +
      '&order=ngay_thuc_hien.desc&limit=20'
    );

    var events = (capThe || []).map(function(r) {
      return {
        icon: '🪪',
        text: 'Cấp thẻ mới' + (r.ly_do ? ' — ' + r.ly_do : ''),
        gio: r.ngay_thuc_hien
      };
    });

    // Thêm event đăng nhập
    var loggedAt = nv.logged_in_at;
    if (loggedAt) {
      events.push({ icon: '', text: 'Bắt đầu ca làm việc', gio: loggedAt });
    }

    events.sort(function(a, b) { return new Date(b.gio) - new Date(a.gio); });

    if (events.length === 0) {
      rongEl.textContent = 'Chưa có hoạt động nào trong ca này.';
      return;
    }

    // Xoá placeholder, render timeline
    rongEl.style.display = 'none';

    var existing = panelEl.querySelector('.nk-list');
    if (existing) existing.remove();

    var list = document.createElement('div');
    list.className = 'nk-list';
    list.style.cssText = 'padding:10px 16px;display:flex;flex-direction:column;gap:10px;';

    events.forEach(function(ev) {
      var item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:flex-start;gap:10px;font-size:12.5px;';
      item.innerHTML =
        '<span style="font-size:15px;line-height:1.4;">' + ev.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="color:var(--t);font-weight:500;">' + _esc(ev.text) + '</div>' +
          '<div style="color:var(--t3);font-size:11px;margin-top:2px;">' + _fmt_gio(ev.gio) + '</div>' +
        '</div>';
      list.appendChild(item);
    });

    panelEl.appendChild(list);

  } catch(e) {
    console.error('loadNhatKyCaLam lỗi:', e);
    rongEl.textContent = 'Không thể tải nhật ký ca.';
  }
}

// ─── Helper: escape HTML ──────────────────────────────────────
function _esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
