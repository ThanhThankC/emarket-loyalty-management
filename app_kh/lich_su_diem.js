// lich_su_diem.js — Lịch sử giao dịch
// File: lich_su_diem.html / lich_su_diem.css / lich_su_diem.js — UC-7.1
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV();

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
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Kha dung`);
    const count = vcData ? vcData.length : 0;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  } catch (e) { /* bỏ qua lỗi badge */ }

  // TODO: AC - Nhập điều kiện: SĐT, mã đơn, khoảng thời gian, trạng thái
  // TODO: AC - Hỗ trợ bộ lọc theo tab (Tất cả / Tích lũy / Đổi điểm)
  // TODO: AC - Hiển thị danh sách đơn hàng phân trang
  // TODO: AC - Báo lỗi nếu không tìm thấy
  try {
    const txData = await sbGet('lich_su_giao_dich_diem',
      `ma_kh=eq.${kh.ma_nv}&order=thoi_gian.desc`);
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
    const plus  = tx.loai_giao_dich === 'Tich diem';
    const cls   = plus ? 'earn' : 'redeem';
    const sign  = plus ? '+' : '-';
    const label = plus ? 'MH' : 'ĐĐ';
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