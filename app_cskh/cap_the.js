// =============================================
//  cap_the.js — Cấp thẻ thành viên mới
//  Cù Đình Thanh phụ trách
//  Phụ thuộc: supabase_config.js, supabase_api.js, auth.js
// =============================================

requireLogin();

const nv = getCurrentNV();

// ---- Khởi động ----
document.addEventListener('DOMContentLoaded', () => {
  if (nv) {
    document.getElementById('topName').textContent = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
  }

  // Live preview thẻ khi nhập tên
  document.getElementById('new-hoten').addEventListener('input', updatePreview);
  document.getElementById('new-thoihan').addEventListener('change', updatePreview);
  updatePreview();

  // Đóng modal khi click nền
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
});

// ---- Chuyển tab ----
function switchTab(tab) {
  ['moi','cu'].forEach(t => {
    document.getElementById('panel-' + t).style.display = t === tab ? '' : 'none';
    document.getElementById('tab-'   + t).classList.toggle('active', t === tab);
  });
}

// ---- Live preview thẻ ----
function updatePreview() {
  const ten      = document.getElementById('new-hoten').value.trim() || 'Họ tên khách hàng';
  const thoiHan  = parseInt(document.getElementById('new-thoihan').value) || 2;
  const maDemo   = 'THE-' + Math.random().toString(36).slice(2,8).toUpperCase();
  const hetHan   = new Date();
  hetHan.setFullYear(hetHan.getFullYear() + thoiHan);

  document.getElementById('prev-name-new').textContent = ten;
  document.getElementById('prev-date-new').textContent =
    'HH: ' + hetHan.toLocaleDateString('vi-VN');
}

// ---- Sinh mã thẻ unique ----
function genMaThe() {
  const stamp = Date.now().toString().slice(-6);
  const rand  = Math.random().toString(36).slice(2,5).toUpperCase();
  return 'THE' + stamp + rand;
}

// ---- Sinh mã KH unique ----
function genMaKH() {
  const stamp = Date.now().toString().slice(-5);
  const rand  = Math.random().toString(36).slice(2,4).toUpperCase();
  return 'KH' + stamp + rand;
}

// ---- Kiểm tra SĐT đã tồn tại chưa ----
async function kiemTraSdt(sdt) {
  const data = await sbGet('khach_hang', `so_dien_thoai=eq.${encodeURIComponent(sdt)}&select=ma_kh`);
  return data && data.length > 0 ? data[0] : null;
}

function clearSdtError() {
  document.getElementById('sdt-hint').style.display = 'none';
  document.getElementById('new-sdt').style.borderColor = '';
}

// ========================================
//  CẤP THẺ CHO KHÁCH HÀNG MỚI
// ========================================
async function capTheMoi() {
  // Lấy dữ liệu form
  const hoTen   = document.getElementById('new-hoten').value.trim();
  const sdt     = document.getElementById('new-sdt').value.trim();
  const email   = document.getElementById('new-email').value.trim();
  const ngaySinh= document.getElementById('new-ngaysinh').value;
  const gioiTinh= document.getElementById('new-gioitinh').value;
  const diaChi  = document.getElementById('new-diachi').value.trim();
  const thoiHan = parseInt(document.getElementById('new-thoihan').value);
  const matKhau = document.getElementById('new-matkhau').value;

  // Validate
  if (!hoTen || !sdt || !matKhau) {
    showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'err');
    return;
  }
  if (!/^0[0-9]{9}$/.test(sdt)) {
    showToast('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)', 'err');
    return;
  }
  if (matKhau.length < 6) {
    showToast('Mật khẩu tối thiểu 6 ký tự', 'err');
    return;
  }

  const btn = document.getElementById('btn-cap-moi');
  btn.disabled = true;
  btn.textContent = 'Đang xử lý…';

  try {
    // 1. Kiểm tra SĐT đã tồn tại chưa
    const tonTai = await kiemTraSdt(sdt);
    if (tonTai) {
      document.getElementById('sdt-hint').style.display = 'block';
      document.getElementById('new-sdt').style.borderColor = 'var(--red)';
      showToast('Số điện thoại này đã được đăng ký', 'err');
      return;
    }

    // 2. Tạo mã
    const maKH  = genMaKH();
    const maThe = genMaThe();

    // 3. Tính ngày hết hạn thẻ
    const ngayHetHan = new Date();
    ngayHetHan.setFullYear(ngayHetHan.getFullYear() + thoiHan);
    const ngayHetHanStr = ngayHetHan.toISOString().split('T')[0];

    // 4. INSERT khách hàng
    await sbInsert('khach_hang', {
      ma_kh:          maKH,
      ho_ten:         hoTen,
      ngay_sinh:      ngaySinh || null,
      gioi_tinh:      gioiTinh || null,
      so_dien_thoai:  sdt,
      email:          email || null,
      dia_chi:        diaChi || null,
      mat_khau_hash:  matKhau,   // production: hash bằng bcrypt phía server
      ngay_dang_ky:   new Date().toISOString().split('T')[0],
      trang_thai:     'hoat_dong'
    });

    // 5. INSERT thẻ thành viên
    await sbInsert('the_thanh_vien', {
      ma_the:       maThe,
      ma_kh:        maKH,
      hang:         'Bronze',
      ngay_cap:     new Date().toISOString().split('T')[0],
      ngay_het_han: ngayHetHanStr,
      trang_thai:   'hoat_dong',
      so_diem:      0
    });

    // 6. Ghi lịch sử cấp thẻ
    await sbInsert('lich_su_cap_the', {
      ma_nv:          nv.ma_nv,
      ma_the:         maThe,
      loai_su_kien:   'cap_moi',
      ngay_thuc_hien: new Date().toISOString(),
      ly_do:          'Đăng ký thành viên mới',
      ngay_het_han_moi: ngayHetHanStr
    });

    // 7. Hiện modal thành công
    hienModalThanhCong(hoTen, maKH, maThe, ngayHetHanStr);

  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '&#10010; Cấp thẻ';
  }
}

// ========================================
//  CẤP THẺ CHO KHÁCH HÀNG CŨ (chưa có thẻ)
// ========================================
async function timKhachHang() {
  const keyword = document.getElementById('search-cu').value.trim();
  if (!keyword) { showToast('Nhập SĐT hoặc tên để tìm', 'inf'); return; }

  const resultDiv = document.getElementById('cu-result');
  resultDiv.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px">Đang tìm…</div>';

  try {
    // Tìm KH chưa có thẻ: dùng NOT IN hoặc kiểm tra left join
    // Supabase REST: tìm KH khớp keyword
    const isPhone = /^[0-9]+$/.test(keyword);
    const params  = isPhone
      ? `so_dien_thoai=like.*${keyword}*&select=ma_kh,ho_ten,so_dien_thoai,email,the_thanh_vien(ma_the)`
      : `ho_ten=ilike.*${keyword}*&select=ma_kh,ho_ten,so_dien_thoai,email,the_thanh_vien(ma_the)`;

    const data = await sbGet('khach_hang', params + '&limit=10');

    if (!data || data.length === 0) {
      resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Không tìm thấy khách hàng</div>';
      return;
    }

    resultDiv.innerHTML = data.map(kh => {
      const daCoThe = kh.the_thanh_vien && kh.the_thanh_vien.length > 0;
      return `
      <div class="kh-result-item">
        <div>
          <div class="cname">${escHtml(kh.ho_ten)}</div>
          <div class="cid">${escHtml(kh.so_dien_thoai)} &nbsp;·&nbsp; ${escHtml(kh.ma_kh)}</div>
        </div>
        ${daCoThe
          ? `<span class="badge b-done">Đã có thẻ</span>`
          : `<button class="btn btn-yellow btn-sm" onclick="capTheCu('${kh.ma_kh}','${escHtml(kh.ho_ten)}')">Cấp thẻ</button>`
        }
      </div>`;
    }).join('');

  } catch (err) {
    resultDiv.innerHTML = `<div style="color:var(--red);padding:12px;font-size:13px">Lỗi: ${err.message}</div>`;
  }
}

async function capTheCu(maKH, hoTen) {
  if (!confirm(`Xác nhận cấp thẻ thành viên mới cho "${hoTen}"?`)) return;

  try {
    const maThe       = genMaThe();
    const ngayHetHan  = new Date();
    ngayHetHan.setFullYear(ngayHetHan.getFullYear() + 2);
    const ngayHetHanStr = ngayHetHan.toISOString().split('T')[0];

    await sbInsert('the_thanh_vien', {
      ma_the:       maThe,
      ma_kh:        maKH,
      hang:         'Bronze',
      ngay_cap:     new Date().toISOString().split('T')[0],
      ngay_het_han: ngayHetHanStr,
      trang_thai:   'hoat_dong',
      so_diem:      0
    });

    await sbInsert('lich_su_cap_the', {
      ma_nv:          nv.ma_nv,
      ma_the:         maThe,
      loai_su_kien:   'cap_moi',
      ngay_thuc_hien: new Date().toISOString(),
      ly_do:          'Cấp thẻ cho khách hàng đã có tài khoản',
      ngay_het_han_moi: ngayHetHanStr
    });

    hienModalThanhCong(hoTen, maKH, maThe, ngayHetHanStr);

  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

// ---- Modal thành công ----
function hienModalThanhCong(hoTen, maKH, maThe, ngayHetHan) {
  document.getElementById('success-info').innerHTML =
    `Đã tạo thành công thẻ <strong>${maThe}</strong> cho khách hàng <strong>${escHtml(hoTen)}</strong>.<br/>
     Mã KH: <strong>${maKH}</strong> &nbsp;·&nbsp; Hết hạn: <strong>${fmtNgay(ngayHetHan)}</strong>`;

  document.getElementById('success-card').innerHTML = `
    <div class="cp-brand">CarePoint</div>
    <div class="cp-chip">&#9679;&#9679;&#9679;</div>
    <div class="cp-ma">${maThe}</div>
    <div class="cp-name">${escHtml(hoTen)}</div>
    <div class="cp-foot">
      <span>&#9670; ĐỒNG</span>
      <span>HH: ${fmtNgay(ngayHetHan)}</span>
    </div>`;

  openModal('modal-success');
  showToast('Cấp thẻ thành công!', 'ok');
}

// ---- Reset form ----
function resetForm() {
  ['new-hoten','new-sdt','new-email','new-ngaysinh','new-diachi','new-matkhau']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('new-gioitinh').value = '';
  document.getElementById('new-thoihan').value  = '2';
  clearSdtError();
  updatePreview();
}

// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- Toast ----
function showToast(msg, type = 'ok') {
  const tc = document.getElementById('toasts');
  const t  = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ---- Format helpers ----
function fmtNgay(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
