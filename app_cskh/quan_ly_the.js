// =============================================
//  quan_ly_the.js — Quản lý thẻ thành viên
//  Cù Đình Thanh phụ trách
//  Phụ thuộc: supabase_config.js, supabase_api.js, auth.js
// =============================================

requireLogin();

// ---- State ----
let danhSachThe = [];      // toàn bộ data từ DB
let danhSachHienThi = [];  // sau khi lọc/tìm kiếm
let theChiTiet = null;     // thẻ đang xem trong modal

// ---- Khởi động ----
document.addEventListener('DOMContentLoaded', () => {
  // Hiện tên nhân viên trên topbar
  const nv = getCurrentNV();
  if (nv) {
    document.getElementById('topName').textContent = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
  }

  loadDanhSachThe();

  // Đóng modal khi click nền
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.classList.remove('open');
    });
  });
});

// ---- Tải danh sách thẻ từ Supabase ----
async function loadDanhSachThe() {
  showState('loading');

  try {
    // Join thẻ + khách hàng + cấu hình hạng trong 1 lần gọi
    // Supabase hỗ trợ select nested: the_thanh_vien?select=*,khach_hang(*)
    const data = await sbGet(
      'the_thanh_vien',
      'select=ma_the,hang,ngay_cap,ngay_het_han,trang_thai,so_diem,ma_kh,' +
      'khach_hang(ho_ten,so_dien_thoai,email)' +
      '&order=so_diem.desc'
    );

    danhSachThe = data || [];
    applyFilter();

  } catch (err) {
    showState('error', 'Lỗi tải dữ liệu: ' + err.message);
    console.error(err);
  }
}

// ---- Tìm kiếm (real-time) ----
function onSearch(keyword) {
  applyFilter(keyword);
}

// ---- Áp dụng bộ lọc ----
function applyFilter(keyword) {
  const kw     = (keyword ?? document.getElementById('searchInput').value).toLowerCase().trim();
  const hang   = document.getElementById('filterHang').value;
  const trang  = document.getElementById('filterTrang').value;

  danhSachHienThi = danhSachThe.filter(the => {
    const kh = the.khach_hang || {};
    const matchKW = !kw ||
      (kh.ho_ten || '').toLowerCase().includes(kw) ||
      (kh.so_dien_thoai || '').includes(kw) ||
      (the.ma_the || '').toLowerCase().includes(kw);
    const matchHang  = !hang  || the.hang === hang;
    const matchTrang = !trang || the.trang_thai === trang;
    return matchKW && matchHang && matchTrang;
  });

  renderTable();
}

// ---- Render bảng ----
function renderTable() {
  const count = danhSachHienThi.length;
  document.getElementById('countLabel').textContent =
    `Hiển thị ${count} / ${danhSachThe.length} thẻ`;

  if (count === 0) { showState('empty'); return; }
  showState('table');

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = danhSachHienThi.map(the => {
    const kh = the.khach_hang || {};
    return `
    <tr>
      <td>
        <div class="cname">${escHtml(kh.ho_ten || '—')}</div>
        <div class="cid">${escHtml(kh.so_dien_thoai || '')}</div>
      </td>
      <td><code style="font-size:12px;color:var(--t2)">${escHtml(the.ma_the)}</code></td>
      <td><span class="badge hang-${the.hang}">${hangLabel(the.hang)}</span></td>
      <td><span class="diem-val">${fmtSo(the.so_diem)}</span></td>
      <td class="${hetHanClass(the.ngay_het_han, the.trang_thai)}">${fmtNgay(the.ngay_het_han)}</td>
      <td><span class="ts-${the.trang_thai}">${trangThaiLabel(the.trang_thai)}</span></td>
      <td style="text-align:right">
        <button class="btn btn-outline btn-sm" onclick="xemChiTiet('${the.ma_the}')">
          Chi tiết
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ---- Xem chi tiết thẻ ----
async function xemChiTiet(maThe) {
  theChiTiet = danhSachHienThi.find(t => t.ma_the === maThe);
  if (!theChiTiet) return;

  const kh = theChiTiet.khach_hang || {};

  // Cập nhật tiêu đề modal
  document.getElementById('m-title').textContent = `Chi tiết thẻ — ${kh.ho_ten || ''}`;
  document.getElementById('m-sub').innerHTML =
    `${escHtml(theChiTiet.ma_the)} &nbsp;·&nbsp; ` +
    `Hạng: <span class="badge hang-${theChiTiet.hang}" style="font-size:11px">${hangLabel(theChiTiet.hang)}</span>` +
    ` &nbsp;·&nbsp; ${fmtSo(theChiTiet.so_diem)} điểm`;

  // Info grid
  document.getElementById('m-info').innerHTML = [
    ['Họ tên',       kh.ho_ten       || '—'],
    ['SĐT',          kh.so_dien_thoai|| '—'],
    ['Email',        kh.email         || '—'],
    ['Mã thẻ',       theChiTiet.ma_the],
    ['Ngày cấp',     fmtNgay(theChiTiet.ngay_cap)],
    ['Hết hạn',      fmtNgay(theChiTiet.ngay_het_han)],
    ['Trạng thái',   trangThaiLabel(theChiTiet.trang_thai)],
    ['Điểm hiện có', fmtSo(theChiTiet.so_diem) + ' điểm'],
  ].map(([lbl, val]) =>
    `<div class="info-item"><div class="lbl">${lbl}</div><div class="val">${escHtml(String(val))}</div></div>`
  ).join('');

  // Nút khóa/mở khóa
  const btnKhoa = document.getElementById('btn-khoa');
  if (theChiTiet.trang_thai === 'bi_khoa') {
    btnKhoa.textContent = 'Mở khóa thẻ';
    btnKhoa.className = 'btn btn-green btn-sm';
  } else {
    btnKhoa.textContent = 'Khóa thẻ';
    btnKhoa.className = 'btn btn-danger btn-sm';
  }

  openModal('modal-chitiet');

  // Tải lịch sử giao dịch điểm
  await loadGiaoDich(maThe);
}

// ---- Tải lịch sử GD điểm ----
async function loadGiaoDich(maThe) {
  document.getElementById('m-gd-loading').style.display = 'block';
  document.getElementById('m-gd-table').style.display   = 'none';
  document.getElementById('m-gd-empty').style.display   = 'none';

  try {
    const gd = await sbGet(
      'lich_su_giao_dich_diem',
      `ma_the=eq.${maThe}&order=ngay_gd.desc&limit=10`
    );

    document.getElementById('m-gd-loading').style.display = 'none';

    if (!gd || gd.length === 0) {
      document.getElementById('m-gd-empty').style.display = 'block';
      return;
    }

    document.getElementById('m-gd-table').style.display = '';
    document.getElementById('m-gd-body').innerHTML = gd.map(g => {
      const isDuong = g.so_diem > 0;
      return `
      <tr>
        <td style="font-size:12px;color:var(--t3)">${fmtNgayGio(g.ngay_gd)}</td>
        <td>${loaiGDLabel(g.loai_gd)}</td>
        <td style="font-weight:600;color:${isDuong ? 'var(--green)' : 'var(--red)'}">
          ${isDuong ? '+' : ''}${fmtSo(g.so_diem)}
        </td>
        <td style="font-weight:500">${fmtSo(g.so_du_sau_gd)}</td>
        <td style="font-size:12px;color:var(--t3)">${escHtml(g.ghi_chu || '—')}</td>
      </tr>`;
    }).join('');

  } catch (err) {
    document.getElementById('m-gd-loading').textContent = 'Lỗi tải lịch sử: ' + err.message;
  }
}

// ---- Khóa / Mở khóa thẻ ----
async function khoaThe() {
  if (!theChiTiet) return;

  const isKhoa    = theChiTiet.trang_thai !== 'bi_khoa';
  const trangMoi  = isKhoa ? 'bi_khoa' : 'hoat_dong';
  const confirm_msg = isKhoa
    ? `Xác nhận KHÓA thẻ ${theChiTiet.ma_the}?`
    : `Xác nhận MỞ KHÓA thẻ ${theChiTiet.ma_the}?`;

  if (!confirm(confirm_msg)) return;

  try {
    await sbUpdate('the_thanh_vien', `ma_the=eq.${theChiTiet.ma_the}`, {
      trang_thai: trangMoi
    });

    showToast(isKhoa ? 'Đã khóa thẻ thành viên' : 'Đã mở khóa thẻ thành viên',
              isKhoa ? 'wrn' : 'ok');
    closeModal('modal-chitiet');
    loadDanhSachThe(); // reload bảng

  } catch (err) {
    showToast('Lỗi: ' + err.message, 'err');
  }
}

// ---- Chuyển sang trang gia hạn ----
function chuyenGiaHan() {
  if (theChiTiet) {
    sessionStorage.setItem('gia_han_ma_the', theChiTiet.ma_the);
  }
  location.href = 'gia_han.html';
}

// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- State UI ----
function showState(state, errMsg) {
  ['loading','empty','error','table'].forEach(s => {
    document.getElementById('state' + s.charAt(0).toUpperCase() + s.slice(1)).style.display = 'none';
  });
  const el = document.getElementById('state' + state.charAt(0).toUpperCase() + state.slice(1));
  if (el) el.style.display = '';
  if (state === 'error' && errMsg) {
    document.getElementById('errorMsg').textContent = errMsg;
  }
}

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
  }, 3200);
}

// ---- Format helpers ----
function fmtSo(n)    { return Number(n || 0).toLocaleString('vi-VN'); }
function fmtNgay(s)  { if (!s) return '—'; return new Date(s).toLocaleDateString('vi-VN'); }
function fmtNgayGio(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
}
function escHtml(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function hangLabel(hang) {
  return { Bronze:'Đồng', Silver:'Bạc', Gold:'Vàng', Platinum:'Bạch Kim' }[hang] || hang;
}
function trangThaiLabel(ts) {
  return { hoat_dong:'Hoạt động', het_han:'Hết hạn', bi_khoa:'Bị khóa', mat_the:'Mất thẻ' }[ts] || ts;
}
function loaiGDLabel(loai) {
  return {
    tich_diem: '<span class="badge b-done">Tích điểm</span>',
    tieu_diem: '<span class="badge b-err">Tiêu điểm</span>',
    doi_qua:   '<span class="badge b-pend">Đổi quà</span>',
    het_han:   '<span class="badge b-ended">Hết hạn</span>',
    dieu_chinh:'<span class="badge b-open">Điều chỉnh</span>',
  }[loai] || loai;
}
function hetHanClass(ngay, trangThai) {
  if (trangThai !== 'hoat_dong') return '';
  const diff = (new Date(ngay) - new Date()) / 86400000;
  if (diff < 0)  return 'style="color:var(--red)"';
  if (diff < 30) return 'style="color:var(--orange)"';
  return '';
}
