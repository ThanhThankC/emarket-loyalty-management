// voucher_cua_toi.js - Voucher cua toi
// File: voucher_cua_toi.html / voucher_cua_toi.css / voucher_cua_toi.js - UC-9
requireLogin();

const kh = getCurrentNV();
const currentKhId = kh && (kh.ma_kh || kh.ma_nv);
let activeVoucherStatus = 'chua_dung';

async function setTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  activeVoucherStatus = el.dataset.voucherStatus || 'chua_dung';
  await loadVouchers(activeVoucherStatus);
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
//  TAI DANH SACH VOUCHER THEO TAB
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;
  await loadVouchers(activeVoucherStatus);
});

async function loadVouchers(status = 'chua_dung') {
  const listEl = document.getElementById('voucherList');
  if (listEl) listEl.innerHTML = '<div class="tx-placeholder">Đang tải voucher...</div>';

  try {
    const vcData = await sbGet('voucher', buildVoucherQuery(status));

    if (status === 'chua_dung') {
      updateVoucherBadge(vcData ? vcData.length : 0);
    }

    renderVouchers(vcData || [], status);
  } catch (e) {
    console.error('Khong tai duoc voucher:', e);
    document.getElementById('voucherList').innerHTML =
      '<div class="tx-placeholder">Không tải được voucher</div>';
  }
}

function buildVoucherQuery(status) {
  const base = `ma_kh=eq.${encodeURIComponent(currentKhId)}`;
  const today = new Date().toISOString().split('T')[0];

  if (status === 'da_dung') {
    return `${base}&trang_thai=eq.da_dung&order=ngay_het_han.desc`;
  }

  if (status === 'het_han') {
    return `${base}&or=(trang_thai.eq.het_han,ngay_het_han.lt.${today})&order=ngay_het_han.desc`;
  }

  return `${base}&trang_thai=eq.chua_dung&ngay_het_han=gte.${today}&order=ngay_het_han.asc`;
}

function updateVoucherBadge(count) {
  const badge = document.getElementById('voucherBadge');
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// ============================================================
//  HIEN THI DANH SACH VOUCHER
// ============================================================
function renderVouchers(vcArr, status = activeVoucherStatus) {
  const el = document.getElementById('voucherList');

  if (!vcArr.length) {
    el.innerHTML = `<div class="tx-placeholder">${getEmptyVoucherMessage(status)}</div>`;
    return;
  }

  el.innerHTML = vcArr.map(vc => {
    const exp = vc.ngay_het_han
      ? new Date(vc.ngay_het_han).toLocaleDateString('vi-VN')
      : '---';
    const voucherName = vc.ten_voucher ||
      ('Voucher giảm ' + Number(vc.gia_tri_giam || 0).toLocaleString('vi-VN') + 'đ');
    const isUsable = status === 'chua_dung';
    const actionHtml = isUsable
      ? `<button class="voucher-use"
          onclick="openUseVoucher('${escapeAttr(vc.ma_voucher)}','${escapeAttr(voucherName)}','${escapeAttr(exp)}')">
          Dùng
        </button>`
      : `<button class="voucher-use" disabled>${getVoucherStatusLabel(status)}</button>`;

    return `
      <div class="voucher">
        <div class="voucher-left">
          <div class="voucher-val">${vc.gia_tri_giam ? Math.round(vc.gia_tri_giam / 1000) + 'K' : 'QUÀ'}</div>
          <div class="voucher-unit">VND giảm</div>
        </div>
        <div class="voucher-body">
          <div class="voucher-name">${escapeHtml(voucherName)}</div>
          <div class="voucher-exp">HSD: ${escapeHtml(exp)}</div>
        </div>
        ${actionHtml}
      </div>`;
  }).join('');
}

function getEmptyVoucherMessage(status) {
  if (status === 'da_dung') return 'Bạn chưa có voucher đã dùng';
  if (status === 'het_han') return 'Bạn chưa có voucher hết hạn';
  return 'Bạn chưa có voucher khả dụng';
}

function getVoucherStatusLabel(status) {
  if (status === 'da_dung') return 'Đã dùng';
  if (status === 'het_han') return 'Hết hạn';
  return 'Dùng';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

// ============================================================
//  MODAL SU DUNG VOUCHER
// ============================================================
function openUseVoucher(code, name, exp) {
  document.getElementById('useVoucherCode').textContent = code;
  document.getElementById('useVoucherHint').textContent = name + ' · HSD ' + exp;
  openModal('modal-use-voucher');
}
