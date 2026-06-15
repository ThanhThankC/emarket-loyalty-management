// app_kh.js — Trang chủ (Home) + Bottom Nav + Modal QR thẻ thành viên
// File: app_kh.html / app_kh.css / app_kh.js — UC-7.2 (xem điểm tích lũy & hạng)
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV(); // tại đây getCurrentNV() trả về dữ liệu khách hàng
const currentKhId = kh && (kh.ma_kh || kh.ma_nv);

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
  if (!kh || !currentKhId) return;

  // Tên và avatar
  const ten = kh.ho_ten || 'Khách hàng';
  const initials = ten.split(' ').pop().charAt(0).toUpperCase();

  // Cập nhật UI header
  document.getElementById('topAvatar').textContent = initials;
  document.getElementById('heroName').textContent  = ten;

  // Lấy thông tin thẻ thành viên & điểm
  try {
    const theData = await sbGet('the_thanh_vien',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}` +
      '&select=ma_the,hang,so_diem,trang_thai&order=updated_at.desc&limit=1');

    if (!theData || theData.length === 0) {
      throw new Error('Không tìm thấy thẻ thành viên.');
    }

    const the = theData[0];
    const diem = Number(the.so_diem || 0);
    const hang = the.hang || 'Bronze';
    const maThe = the.ma_the || '---';

    // Hero
    document.getElementById('heroPts').textContent = diem.toLocaleString('vi-VN');
    document.getElementById('heroTierTxt').textContent = 'Thành viên ' + hang;

    // Điểm khả dụng hiện tại được hiển thị ở hero và khu vực thống kê.
    document.getElementById('statPts').textContent = diem.toLocaleString('vi-VN');
    document.getElementById('statTotal').textContent = diem.toLocaleString('vi-VN');

    // Thẻ ID
    document.getElementById('cardIdTxt').textContent = 'KH – ' + maThe.slice(-5);
    document.getElementById('qrIdTxt').textContent   = 'KH – ' + maThe.slice(-5);
    document.getElementById('qrHint').textContent    = ten + ' · Hạng ' + hang;

    calcProgress(hang, diem);
  } catch (e) {
    console.error('Lỗi tải thẻ:', e);
    document.getElementById('heroPts').textContent = '---';
    document.getElementById('statPts').textContent = '---';
    document.getElementById('statTotal').textContent = '---';
    const errorElement = document.getElementById('heroPointsError');
    errorElement.textContent = 'Không thể truy xuất điểm hiện tại. Vui lòng thử lại.';
    errorElement.classList.add('show');
    showToast('Không thể truy xuất điểm hiện tại', 'err');
  }

  // Lấy số lượng voucher khả dụng (cho stat ở Trang chủ + badge Bottom Nav)
  try {
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}&trang_thai=eq.Kha dung`);
    const count = vcData ? vcData.length : 0;
    document.getElementById('statVoucher').textContent = count;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  } catch (e) {
    document.getElementById('statVoucher').textContent = '0';
  }

  // Lấy giao dịch gần đây (5 giao dịch mới nhất)
  // Xem toàn bộ đơn hàng tại lich_su_mua_hang.html.
  try {
    const txData = await sbGet('lich_su_giao_dich_diem',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}&order=thoi_gian.desc&limit=5`);
    renderTxList(txData || [], 'recentTx');
  } catch (e) {
    document.getElementById('recentTx').innerHTML = '';
  }
});

// ============================================================
//  TÍNH TOÁN PROGRESS BAR HẠNG THÀNH VIÊN
// ============================================================
function calcProgress(hang, diem) {
  const nguong = { Bronze: 1000, Silver: 5000, Gold: 10000, Platinum: 99999 };
  const tien = { Bronze: 0, Silver: 1000, Gold: 5000, Platinum: 10000 };
  const next = nguong[hang] || 1000;
  const prev = tien[hang] || 0;
  const nextName = { Bronze: 'Silver', Silver: 'Gold', Gold: 'Platinum', Platinum: '' };

  if (hang === 'Platinum') {
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
    el.innerHTML = '';
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
