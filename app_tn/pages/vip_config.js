// =============================================================
//  pages/vip_config.js — Cấu hình ngưỡng phân hạng VIP (UC-15)
//  Bảng DB: cau_hinh_hang_thanh_vien
//  Key DB:  Bronze | Silver | Gold | Platinum
//  Phụ thuộc: router.js, supabase_api.js, auth.js
// =============================================================

// Map key DB → id input trong HTML
var VC_HANG_MAP = [
  { hang: 'Bronze',  inpMin: null,         inpMax: 'inp-max-dong',  label: 'Đồng' },
  { hang: 'Silver',  inpMin: 'inp-min-bac', inpMax: 'inp-max-bac', label: 'Bạc'        },
  { hang: 'Gold',    inpMin: 'inp-min-vang',inpMax: 'inp-max-vang',label: 'Vàng'       },
  { hang: 'Platinum',inpMin: 'inp-min-bach-kim', inpMax: null,          label: 'Bạch Kim'   },
];

var _vcNV = null;
var _vcCauHinhCu = [];  // Lưu giá trị cũ để ghi log diff

registerPage('vip_config', function(opts) {
  _vcNV = getCurrentNV();

  // UC-15 BR15-1: chỉ Admin (demo) mới được vào trang này
  if (typeof _demoIsAdmin === 'undefined' || !_demoIsAdmin) {
    showToast('🔒 Chức năng này yêu cầu quyền Quản lý. Bật chế độ Demo Admin để thử.', 'err');
    setTimeout(function() {
      var dashNi = document.querySelector('.sidebar .ni[data-page=\"dashboard\"]');
      navigate('dashboard', dashNi);
    }, 1800);
    return;
  }

  vcLoadCauHinh();
  vcLoadPhanBo();
  vcLoadLichSu();
});

// ---- Load cấu hình từ DB vào form ----
async function vcLoadCauHinh() {
  try {
    var data = await sbGet('cau_hinh_hang_thanh_vien',
      'select=hang,ten_hien_thi,diem_toi_thieu,he_so_tich_diem&order=diem_toi_thieu.asc');
    _vcCauHinhCu = data || [];

    // Gán vào input tương ứng
    // Logic: diem_toi_thieu của hạng N  = inpMin của hạng N
    //        diem_toi_thieu của hạng N+1 - 1 = inpMax của hạng N (nếu có)
    var sorted = _vcCauHinhCu.slice().sort(function(a,b){ return a.diem_toi_thieu - b.diem_toi_thieu; });

    sorted.forEach(function(row, idx) {
      var cfg = VC_HANG_MAP.find(function(c){ return c.hang === row.hang; });
      if (!cfg) return;

      // Min
      if (cfg.inpMin) {
        var minEl = document.getElementById(cfg.inpMin);
        if (minEl) minEl.value = row.diem_toi_thieu;
      }
      // Max = diem_toi_thieu của hạng tiếp theo - 1
      if (cfg.inpMax) {
        var next = sorted[idx + 1];
        var maxEl = document.getElementById(cfg.inpMax);
        if (maxEl) maxEl.value = next ? (next.diem_toi_thieu - 1) : '';
      }

      // Cập nhật hiển thị hệ số
      var heSoEl = document.getElementById('he-so-' + row.hang.toLowerCase());
      if (heSoEl) heSoEl.textContent = 'x' + Number(row.he_so_tich_diem).toFixed(1);
    });

  } catch (err) {
    showToast('Lỗi tải cấu hình: ' + err.message, 'err');
  }
}

// ---- Lưu cấu hình ----
async function luuCauHinh() {
  var btn = document.getElementById('btn-luu-cau-hinh');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  try {
    // Đọc giá trị từ form
    // Bronze: min=0, max=inp-max-dong
    // Silver: min=inp-min-bac, max=inp-max-bac
    // Gold:   min=inp-min-vang, max=inp-max-vang
    // Platinum: min=inp-min-bach-kim, max=không giới hạn
    var vals = {
      Bronze:   { min: 0,                                           max: vcInt('inp-max-dong')  },
      Silver:   { min: vcInt('inp-min-bac'),                        max: vcInt('inp-max-bac')  },
      Gold:     { min: vcInt('inp-min-vang'),                       max: vcInt('inp-max-vang') },
      Platinum: { min: vcInt('inp-min-bach-kim'),                        max: null                  },
    };

    // Validate BR15-2: Bronze.min=0, tăng dần, không chồng chéo
    var errs = [];
    if (vals.Bronze.min !== 0) errs.push('Ngưỡng Đồng phải bắt đầu từ 0');
    if (vals.Silver.min <= vals.Bronze.min) errs.push('Ngưỡng Bạc phải lớn hơn ngưỡng Đồng');
    if (vals.Gold.min   <= vals.Silver.min) errs.push('Ngưỡng Vàng phải lớn hơn ngưỡng Bạc');
    if (vals.Platinum.min <= vals.Gold.min) errs.push('Ngưỡng Bạch Kim phải lớn hơn ngưỡng Vàng');
    if (vals.Bronze.max !== null && vals.Bronze.max < vals.Bronze.min)  errs.push('Điểm tối đa Đồng không hợp lệ');
    if (vals.Silver.max !== null && vals.Silver.max < vals.Silver.min)  errs.push('Điểm tối đa Bạc không hợp lệ');
    if (vals.Gold.max   !== null && vals.Gold.max   < vals.Gold.min)    errs.push('Điểm tối đa Vàng không hợp lệ');

    if (errs.length > 0) {
      showToast(errs[0], 'err');
      return;
    }

    // Đảm bảo min của hạng sau = max của hạng trước + 1
    vals.Silver.min   = (vals.Bronze.max  !== null) ? vals.Bronze.max  + 1 : vals.Silver.min;
    vals.Gold.min     = (vals.Silver.max  !== null) ? vals.Silver.max  + 1 : vals.Gold.min;
    vals.Platinum.min = (vals.Gold.max    !== null) ? vals.Gold.max    + 1 : vals.Platinum.min;

    // Cập nhật diem_toi_thieu cho từng hạng
    await sbUpdate('cau_hinh_hang_thanh_vien', 'hang=eq.Bronze',   { diem_toi_thieu: vals.Bronze.min   });
    await sbUpdate('cau_hinh_hang_thanh_vien', 'hang=eq.Silver',   { diem_toi_thieu: vals.Silver.min   });
    await sbUpdate('cau_hinh_hang_thanh_vien', 'hang=eq.Gold',     { diem_toi_thieu: vals.Gold.min     });
    await sbUpdate('cau_hinh_hang_thanh_vien', 'hang=eq.Platinum', { diem_toi_thieu: vals.Platinum.min });

    showToast('Cập nhật ngưỡng VIP thành công', 'ok');

    // Reload lại để đồng bộ hiển thị và lưu giá trị cũ mới
    await vcLoadCauHinh();
    await vcLoadPhanBo();

  } catch (err) {
    showToast('Không thể lưu cấu hình: ' + err.message, 'err');
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Lưu cấu hình'; }
  }
}

// ---- Load phân bố khách hàng ----
async function vcLoadPhanBo() {
  var el = document.getElementById('phan-bo-kh');
  if (!el) return;
  try {
    var data = await sbGet('the_thanh_vien',
      'select=hang&trang_thai=eq.hoat_dong');
    if (!data) { el.innerHTML = '<div style="color:var(--t3);font-size:12px;text-align:center;padding:16px">Không có dữ liệu</div>'; return; }

    var counts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    data.forEach(function(r) { if (counts[r.hang] !== undefined) counts[r.hang]++; });
    var total = data.length || 1;

    el.innerHTML = [
      { hang: 'Bronze',   label: 'Đồng',     cls: 'hang-Bronze'   },
      { hang: 'Silver',   label: 'Bạc',      cls: 'hang-Silver'   },
      { hang: 'Gold',     label: 'Vàng',      cls: 'hang-Gold'     },
      { hang: 'Platinum', label: 'Bạch Kim', cls: 'hang-Platinum' },
    ].map(function(h) {
      var pct = Math.round(counts[h.hang] / total * 100);
      return '<div style="margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<span class="badge ' + h.cls + '">' + h.label + '</span>' +
          '<span style="font-size:12px;color:var(--t2)">' + counts[h.hang].toLocaleString('vi-VN') + ' KH (' + pct + '%)</span>' +
        '</div>' +
        '<div style="height:6px;background:var(--b);border-radius:3px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:var(--yd);border-radius:3px;transition:width .4s"></div>' +
        '</div></div>';
    }).join('');
  } catch (err) {
    el.innerHTML = '<div style="color:var(--red);font-size:12px;padding:12px">Lỗi tải: ' + err.message + '</div>';
  }
}

// ---- Load lịch sử thay đổi ----
async function vcLoadLichSu() {
  var tbody = document.getElementById('log-vip-tbody');
  if (!tbody) return;
  try {
    // Dùng lich_su_cap_the lọc loai_su_kien chứa 'vip_config' nếu có
    // Tạm thời hiển thị thông báo placeholder vì chưa có bảng log riêng cho UC-15
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--t3);padding:24px;font-size:13px">' +
      'Chưa có lịch sử thay đổi cấu hình VIP.' +
      '</td></tr>';
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--red);padding:12px;font-size:13px">Lỗi: ' + err.message + '</td></tr>';
  }
}

// ---- Helper đọc giá trị int từ input ----
function vcInt(id) {
  var el = document.getElementById(id);
  if (!el) return null;
  var v = parseInt(el.value);
  return isNaN(v) ? null : v;
}
