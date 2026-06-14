// voucher_cua_toi.js — Voucher của tôi
// File: voucher_cua_toi.html / voucher_cua_toi.css / voucher_cua_toi.js — UC-9
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV();

function setTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // TODO: Lọc lại voucherList theo tab (Khả dụng / Đã dùng / Hết hạn)
}

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
//  TẢI DANH SÁCH VOUCHER
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;

  try {
    // TODO: AC - khi chuyển tab thì đổi điều kiện trang_thai tương ứng
    // (Khả dụng / Đã dùng / Hết hạn) thay vì luôn tải 'Khả dụng'
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Kha dung`);
    const count = vcData ? vcData.length : 0;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = ''; }
    renderVouchers(vcData || []);
  } catch (e) {
    document.getElementById('voucherList').innerHTML =
      '<div class="tx-placeholder">Không tải được voucher</div>';
  }
});

// ============================================================
//  HIỂN THỊ DANH SÁCH VOUCHER
// ============================================================
function renderVouchers(vcArr) {
  const el = document.getElementById('voucherList');
  if (!vcArr.length) {
    el.innerHTML = '<div class="tx-placeholder">Bạn chưa có voucher nào</div>';
    return;
  }
  el.innerHTML = vcArr.map(vc => {
    const exp = vc.ngay_het_han
      ? new Date(vc.ngay_het_han).toLocaleDateString('vi-VN')
      : '---';
    return `
      <div class="voucher">
        <div class="voucher-left">
          <div class="voucher-val">${vc.gia_tri_giam ? Math.round(vc.gia_tri_giam/1000)+'K' : 'QUÀ'}</div>
          <div class="voucher-unit">VND giảm</div>
        </div>
        <div class="voucher-body">
          <div class="voucher-name">${vc.ten_voucher || 'Voucher'}</div>
          <div class="voucher-exp">HSD: ${exp}</div>
        </div>
        <button class="voucher-use"
          onclick="openUseVoucher('${vc.ma_voucher}','${vc.ten_voucher}','${exp}')">
          Dùng
        </button>
      </div>`;
  }).join('');
}

// ============================================================
//  MODAL SỬ DỤNG VOUCHER
// ============================================================
function openUseVoucher(code, name, exp) {
  document.getElementById('useVoucherCode').textContent = code;
  document.getElementById('useVoucherHint').textContent = name + ' · HSD ' + exp;
  openModal('modal-use-voucher');
}