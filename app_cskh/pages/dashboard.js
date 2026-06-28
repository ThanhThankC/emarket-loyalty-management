// pages/dashboard.js — Dashboard CSKH (hoàn chỉnh, đúng schema)
// Schema thực tế từ Supabase:
//   the_thanh_vien: ma_the, ma_kh, hang, so_diem, ngay_cap, ngay_het_han, trang_thai
//   khach_hang:     ma_kh, ho_ten, so_dien_thoai, email, trang_thai
//   phan_hoi_khach_hang: trang_thai (ghi_nhan / da_xu_ly / dang_xu_ly)
//   don_hang:       trang_thai, ngay_mua

registerPage('dashboard', function(opts) {
  var nv = getCurrentNV();
  if (!nv) return;
  var el = document.getElementById('dashSub');
  if (el) {
    var h = new Date().getHours();
    var greeting = h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    el.textContent = greeting + ', ' + nv.ho_ten + '!';
  }
  dashLoad();
});

async function dashLoad() {
  dashSetSpinners();
  await Promise.all([
    dashLoadStatCards(),
    dashLoadHangThe(),
    dashLoadTongQuan(),
    dashLoadRecentThe()
  ]);
  var upd = document.getElementById('dash-last-updated');
  if (upd) upd.textContent = 'Cập nhật: ' + new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
}

function dashSetSpinners() {
  ['stat-ph','stat-the','stat-dt','stat-ht'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<span class="dash-spin"></span>';
  });
}

async function dashLoadStatCards() {
  var today = new Date().toISOString().slice(0, 10);

  // Phản hồi chờ xử lý
  try {
    var ph = await sbGet('phan_hoi_khach_hang', 'trang_thai=eq.ghi_nhan&select=ma_phan_hoi');
    document.getElementById('stat-ph').textContent = Array.isArray(ph) ? ph.length : '--';
  } catch(e) {
    document.getElementById('stat-ph').textContent = '--';
  }

  // Thẻ cấp hôm nay
  try {
    var the = await sbGet('the_thanh_vien', 'ngay_cap=eq.' + today + '&select=ma_the');
    document.getElementById('stat-the').textContent = Array.isArray(the) ? the.length : '--';
  } catch(e) {
    document.getElementById('stat-the').textContent = '--';
  }

  // Đơn hàng đổi/trả cần xử lý (trang_thai = cho_xu_ly)
  try {
    var dt = await sbGet('don_hang', 'trang_thai=eq.cho_xu_ly&select=ma_don_hang');
    document.getElementById('stat-dt').textContent = Array.isArray(dt) ? dt.length : '--';
  } catch(e) {
    document.getElementById('stat-dt').textContent = '--';
  }

  // Hỗ trợ hôm nay — đếm phản hồi được tạo hôm nay làm proxy
  try {
    var ht = await sbGet('phan_hoi_khach_hang', 'thoi_gian_gui=gte.' + today + 'T00:00:00&select=ma_phan_hoi');
    document.getElementById('stat-ht').textContent = Array.isArray(ht) ? ht.length : '--';
  } catch(e) {
    document.getElementById('stat-ht').textContent = '--';
  }
}

async function dashLoadHangThe() {
  var wrap = document.getElementById('dash-hang-wrap');
  try {
    var data = await sbGet('the_thanh_vien', 'trang_thai=eq.hoat_dong&select=hang');
    if (!Array.isArray(data) || data.length === 0) {
      wrap.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px;">Chưa có dữ liệu</div>';
      return;
    }

    var hangOrder  = ['Bronze','Silver','Gold','Platinum'];
    var hangLabels = { Bronze:'Đồng', Silver:'Bạc', Gold:'Vàng', Platinum:'Bạch Kim' };
    var colors     = { Bronze:'#CD7F32', Silver:'#A8A9AD', Gold:'#C8991A', Platinum:'#5B8DB8' };
    var counts     = { Bronze:0, Silver:0, Gold:0, Platinum:0 };

    data.forEach(function(row) {
      var h = row.hang || 'Bronze';
      if (counts[h] !== undefined) counts[h]++;
    });

    var total = data.length;
    var html = hangOrder.map(function(h) {
      var pct = total > 0 ? Math.round(counts[h] / total * 100) : 0;
      return '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">' +
        '<span style="font-size:13px;font-weight:600;color:var(--t2);">' + hangLabels[h] + '</span>' +
        '<span style="font-size:12px;color:var(--t3);">' + counts[h].toLocaleString() + ' (' + pct + '%)</span>' +
        '</div>' +
        '<div style="height:8px;background:var(--b);border-radius:4px;overflow:hidden;">' +
        '<div style="height:100%;width:' + pct + '%;background:' + colors[h] + ';border-radius:4px;transition:width .5s;"></div>' +
        '</div></div>';
    }).join('');
    html += '<div style="margin-top:6px;font-size:11px;color:var(--t3);text-align:right;">Tổng: ' + total.toLocaleString() + ' thẻ hoạt động</div>';
    wrap.innerHTML = html;
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:16px;color:var(--red);font-size:13px;">Lỗi tải dữ liệu</div>';
    console.error('dashLoadHangThe:', e);
  }
}

async function dashLoadTongQuan() {
  var wrap = document.getElementById('dash-tong-wrap');
  try {
    var results = await Promise.all([
      sbGet('the_thanh_vien', 'select=trang_thai').catch(function(){ return []; }),
      sbGet('phan_hoi_khach_hang', 'select=trang_thai').catch(function(){ return []; })
    ]);

    var allThe = results[0];
    var allPH  = results[1];

    var tongThe = Array.isArray(allThe) ? allThe.length : 0;
    var theHD   = Array.isArray(allThe) ? allThe.filter(function(t){ return t.trang_thai === 'hoat_dong'; }).length : 0;
    var theHH   = Array.isArray(allThe) ? allThe.filter(function(t){ return t.trang_thai === 'het_han'; }).length : 0;
    var tongPH  = Array.isArray(allPH)  ? allPH.length : 0;
    var phDone  = Array.isArray(allPH)  ? allPH.filter(function(p){ return p.trang_thai === 'da_xu_ly'; }).length : 0;

    var rows = [
      { label: 'Tổng số thẻ thành viên', val: tongThe.toLocaleString() },
      { label: 'Thẻ đang hoạt động',     val: theHD.toLocaleString(),  color: 'var(--green)' },
      { label: 'Thẻ hết hạn',            val: theHH.toLocaleString(),  color: theHH > 0 ? 'var(--orange)' : null },
      { label: 'Tổng phản hồi',          val: tongPH.toLocaleString() },
      { label: 'Phản hồi đã xử lý',      val: phDone.toLocaleString(), color: 'var(--green)' }
    ];

    wrap.innerHTML = rows.map(function(r) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'padding:9px 0;border-bottom:1px solid var(--b);">' +
        '<span style="font-size:13px;color:var(--t2);">' + r.label + '</span>' +
        '<span style="font-size:15px;font-weight:700;color:' + (r.color || 'var(--t)') + ';">' + r.val + '</span>' +
        '</div>';
    }).join('');
  } catch(e) {
    wrap.innerHTML = '<div style="text-align:center;padding:16px;color:var(--red);font-size:13px;">Lỗi tải dữ liệu</div>';
  }
}

async function dashLoadRecentThe() {
  var loading = document.getElementById('dash-recent-loading');
  var empty   = document.getElementById('dash-recent-empty');
  var table   = document.getElementById('dash-recent-table');
  var body    = document.getElementById('dash-recent-body');

  loading.style.display = 'block'; loading.innerHTML = 'Đang tải...';
  empty.style.display   = 'none';
  table.style.display   = 'none';

  try {
    // Dùng đúng tên cột thực tế: so_diem (không phải diem_tich_luy)
    var data = await sbGet('the_thanh_vien',
      'select=ma_the,hang,so_diem,trang_thai,ngay_cap,khach_hang(ho_ten,so_dien_thoai)' +
      '&order=ngay_cap.desc&limit=10');

    loading.style.display = 'none';

    if (!Array.isArray(data) || data.length === 0) {
      empty.style.display = 'block';
      return;
    }

    var hangBadge = { Bronze:'b-new', Silver:'b-pend', Gold:'b-vip', Platinum:'b-open' };
    var hangLabel = { Bronze:'Đồng',  Silver:'Bạc',    Gold:'Vàng',  Platinum:'Bạch Kim' };
    var ttBadge   = { hoat_dong:'b-open', het_han:'b-pend', bi_khoa:'b-err', mat_the:'b-ended' };
    var ttLabel   = { hoat_dong:'Hoạt động', het_han:'Hết hạn', bi_khoa:'Bị khóa', mat_the:'Mất thẻ' };

    body.innerHTML = data.map(function(row) {
      var kh   = row.khach_hang || {};
      var ngay = row.ngay_cap ? new Date(row.ngay_cap).toLocaleDateString('vi-VN') : '--';
      var hang = row.hang     || 'Bronze';
      var tt   = row.trang_thai || 'hoat_dong';
      return '<tr>' +
        '<td><div class="cname">' + (kh.ho_ten || '--') + '</div>' +
        '<div class="cid">' + (kh.so_dien_thoai || '') + '</div></td>' +
        '<td><code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:3px;">' + (row.ma_the || '--') + '</code></td>' +
        '<td><span class="badge ' + (hangBadge[hang]||'b-new') + '">' + (hangLabel[hang]||hang) + '</span></td>' +
        '<td>' + (row.so_diem || 0).toLocaleString() + '</td>' +
        '<td><span class="badge ' + (ttBadge[tt]||'b-open') + '">' + (ttLabel[tt]||tt) + '</span></td>' +
        '<td style="font-size:12px;color:var(--t3);">' + ngay + '</td>' +
        '</tr>';
    }).join('');

    table.style.display = 'block';
  } catch(e) {
    loading.style.display = 'block';
    loading.innerHTML = '<span style="color:var(--red);">Lỗi: ' + e.message + '</span>';
    console.error('dashLoadRecentThe:', e);
  }
}