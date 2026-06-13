// app_kh.js — Trang chủ (Home) + Bottom Nav + Modal QR thẻ thành viên
// File: app_kh.html / app_kh.css / app_kh.js — UC-7.2 (xem điểm tích lũy & hạng)
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV(); // tại đây getCurrentNV() trả về dữ liệu khách hàng

// ============================================================
//  MODAL HELPERS (dùng chung — nếu sau này tách sang file riêng
//  thì mỗi file con có thể copy lại đoạn này)
// ============================================================
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.ov').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});

function showToast(msg, type = '') {
  const tc = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// ============================================================
//  QR COUNTDOWN (cho thẻ thành viên)
// ============================================================
let qrSec = 300;
setInterval(() => {
  qrSec--;
  if (qrSec < 0) qrSec = 300;
  const m = Math.floor(qrSec / 60).toString().padStart(2, '0');
  const s = (qrSec % 60).toString().padStart(2, '0');
  const el = document.getElementById('qr-timer');
  if (el) el.textContent = m + ':' + s;
}, 1000);

// ============================================================
//  LOAD DỮ LIỆU TRANG CHỦ
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;

  // Tên và avatar
  const ten = kh.ho_ten || 'Khách hàng';
  const initials = ten.split(' ').pop().charAt(0).toUpperCase();

  // Cập nhật UI header
  document.getElementById('topAvatar').textContent = initials;
  document.getElementById('heroName').textContent  = ten;

  // Lấy thông tin thẻ thành viên & điểm
  try {
    const theData = await sbGet('the_thanh_vien',
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Hoat dong`);

    if (theData && theData.length > 0) {
      const the = theData[0];
      const diem = the.diem_hien_tai || 0;
      const diemTotal = the.tong_diem_tich_luy || 0;
      const hang = the.hang_hien_tai || 'Moi';
      const maThe = the.ma_the || '---';

      // Hero
      document.getElementById('heroPts').textContent = diem.toLocaleString('vi-VN');
      document.getElementById('heroTierTxt').textContent = 'Thành viên ' + hang;

      // Stats
      document.getElementById('statPts').textContent   = diem.toLocaleString('vi-VN');
      document.getElementById('statTotal').textContent = diemTotal.toLocaleString('vi-VN');

      // Thẻ ID
      document.getElementById('cardIdTxt').textContent = 'KH – ' + maThe.slice(-5);
      document.getElementById('qrIdTxt').textContent   = 'KH – ' + maThe.slice(-5);
      document.getElementById('qrHint').textContent    = ten + ' · Hạng ' + hang;

      // TODO: Tính toán progress (ví dụ ngưỡng hạng) — có thể dùng lại logic
      // calcProgress() tương tự trang ho_so.html nếu cần đồng bộ 2 nơi.
      calcProgress(hang, diem);
    }
  } catch (e) {
    console.error('Lỗi tải thẻ:', e);
  }

  // Lấy số lượng voucher khả dụng (cho stat ở Trang chủ + badge Bottom Nav)
  try {
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Kha dung`);
    const count = vcData ? vcData.length : 0;
    document.getElementById('statVoucher').textContent = count;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  } catch (e) {
    document.getElementById('statVoucher').textContent = '0';
  }

  // Lấy giao dịch gần đây (5 giao dịch mới nhất)
  // TODO: Xem toàn bộ lịch sử -> chuyển sang lich_su_diem.html (UC-7.1)
  try {
    const txData = await sbGet('lich_su_giao_dich_diem',
      `ma_kh=eq.${kh.ma_nv}&order=thoi_gian.desc&limit=5`);
    renderTxList(txData || [], 'recentTx');
  } catch (e) {
    document.getElementById('recentTx').innerHTML =
      '<div class="tx-placeholder">Chưa có giao dịch</div>';
  }
});

// ============================================================
//  TÍNH TOÁN PROGRESS BAR HẠNG THÀNH VIÊN
// ============================================================
function calcProgress(hang, diem) {
  const nguong = { 'Moi': 1000, 'Bac': 5000, 'Vang': 10000, 'Bach kim': 99999 };
  const tien = { 'Moi': 0, 'Bac': 1000, 'Vang': 5000, 'Bach kim': 10000 };
  const next = nguong[hang] || 1000;
  const prev = tien[hang] || 0;
  const nextName = { 'Moi': 'Bac', 'Bac': 'Vang', 'Vang': 'Bach kim', 'Bach kim': '' };

  if (hang === 'Bach kim') {
    document.getElementById('progFill').style.width = '100%';
    document.getElementById('progLeft').textContent = 'Đã đạt hạng cao nhất';
    document.getElementById('progPct').textContent  = '100%';
    return;
  }

  const range = next - prev;
  const done  = Math.min(diem - prev, range);
  const pct   = Math.round((done / range) * 100);
  const con   = next - diem;

  document.getElementById('progFill').style.width  = Math.max(0, pct) + '%';
  document.getElementById('progLeft').textContent  =
    'Còn ' + Math.max(0, con).toLocaleString('vi-VN') + ' điểm lên ' + (nextName[hang] || '');
  document.getElementById('progPct').textContent   = Math.max(0, pct) + '%';
}

// ============================================================
//  RENDER DANH SÁCH GIAO DỊCH (giao dịch gần đây ở Trang chủ)
// ============================================================
function renderTxList(txArr, containerId) {
  const el = document.getElementById(containerId);
  if (!txArr.length) {
    el.innerHTML = '<div class="tx-placeholder">Chưa có giao dịch nào</div>';
    return;
  }
  el.innerHTML = txArr.map(tx => {
    const plus  = tx.loai_giao_dich === 'Tich diem';
    const cls   = plus ? 'earn' : 'redeem';
    const sign  = plus ? '+' : '-';
    const label = plus ? 'MH' : 'DD';
    const date  = tx.thoi_gian ? new Date(tx.thoi_gian).toLocaleDateString('vi-VN') : '---';
    return `
      <div class="tx">
        <div class="tx-icon ${cls}">${label}</div>
        <div class="tx-body">
          <div class="tx-title">${tx.mo_ta || tx.loai_giao_dich || '---'}</div>
          <div class="tx-date">${date}</div>
        </div>
        <div class="tx-pts ${plus ? 'plus' : 'minus'}">${sign}${Math.abs(tx.so_diem || 0)} đ</div>
      </div>`;
  }).join('');
}