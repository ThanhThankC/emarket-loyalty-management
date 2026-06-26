// lich_su_diem.js — Lịch sử giao dịch
// File: lich_su_diem.html / lich_su_diem.css / lich_su_diem.js — UC-7.1
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV();
const currentKhId = kh && (kh.ma_kh || kh.ma_nv);

function setTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // TODO: Lọc lại danh sách theo tab được chọn (Tất cả / Tích lũy / Đổi điểm)
}

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
//  LOAD LỊCH SỬ GIAO DỊCH (UC-7.1)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;

  // Cập nhật badge số voucher khả dụng trên Bottom Nav
  try {
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}&trang_thai=eq.chua_dung`);
    const count = vcData ? vcData.length : 0;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  } catch (e) { /* bỏ qua lỗi badge */ }

  // TODO: AC - Nhập điều kiện: SĐT, mã đơn, khoảng thời gian, trạng thái
  // TODO: AC - Hỗ trợ bộ lọc theo tab (Tất cả / Tích lũy / Đổi điểm)
  // TODO: AC - Hiển thị danh sách đơn hàng phân trang
  // TODO: AC - Báo lỗi nếu không tìm thấy
  try {
    const theData = await sbGet('the_thanh_vien',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}` +
      '&select=ma_the&order=updated_at.desc&limit=1');
    if (!theData || !theData.length) throw new Error('Khong tim thay the thanh vien.');

    const txData = await sbGet('lich_su_giao_dich_diem',
      `ma_the=eq.${encodeURIComponent(theData[0].ma_the)}` +
      '&select=loai_gd,so_diem,ngay_gd,ghi_chu,ma_don_hang' +
      '&order=ngay_gd.desc');
    renderTxList(txData || [], 'allTx');
  } catch (e) {
    document.getElementById('allTx').innerHTML =
      '<div class="tx-placeholder">Không tải được lịch sử</div>';
  }
});

// ============================================================
//  RENDER DANH SÁCH GIAO DỊCH
// ============================================================
function renderTxList(txArr, containerId) {
  const el = document.getElementById(containerId);
  if (!txArr.length) {
    el.innerHTML = '<div class="tx-placeholder">Chưa có giao dịch nào</div>';
    return;
  }
  el.innerHTML = txArr.map(tx => {
    const plus  = tx.loai_gd === 'tich_diem' || Number(tx.so_diem || 0) > 0;
    const cls   = plus ? 'earn' : 'redeem';
    const sign  = Number(tx.so_diem || 0) >= 0 ? '+' : '';
    const label = plus ? 'MH' : 'ĐĐ';
    const date  = tx.ngay_gd ? new Date(tx.ngay_gd).toLocaleDateString('vi-VN') : '---';
    return `
      <div class="tx">
        <div class="tx-icon ${cls}">${label}</div>
        <div class="tx-body">
          <div class="tx-title">${tx.ghi_chu || tx.loai_gd || '---'}</div>
          <div class="tx-date">${date}</div>
        </div>
        <div class="tx-pts ${plus ? 'plus' : 'minus'}">${sign}${Number(tx.so_diem || 0).toLocaleString('vi-VN')} đ</div>
      </div>`;
  }).join('');
}
