// doi_voucher.js - Doi diem lay voucher
requireLogin();

const kh = getCurrentNV();
const currentKhId = kh && (kh.ma_kh || kh.ma_nv);

let memberCard = null;
let availablePoints = 0;
let vouchers = [];
let pendingVoucher = null;

function showToast(msg, type = '') {
  const tc = document.getElementById('toasts');
  if (!tc) return;
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

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });

  const confirmBtn = document.getElementById('doi-voucher-confirm');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmExchangeVoucher);

  if (!kh || !currentKhId) return;
  await loadVoucherPage();
});

async function loadVoucherPage() {
  renderLoading();

  try {
    const cardRows = await sbGet(
      'the_thanh_vien',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}` +
      '&select=ma_the,ma_kh,hang,so_diem,trang_thai&order=updated_at.desc&limit=1'
    );

    memberCard = cardRows && cardRows.length ? cardRows[0] : null;
    availablePoints = Number(memberCard && memberCard.so_diem || 0);

    const voucherRows = await sbGet(
      'qua_tang',
      'trang_thai=eq.hoat_dong&loai=eq.voucher_giam_gia&so_luong_ton=gt.0' +
      '&select=ma_qua,ten_qua,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher' +
      '&order=so_diem_quy_doi.asc'
    );

    vouchers = voucherRows || [];
    renderVoucherPage();
  } catch (e) {
    console.error('Loi tai trang doi voucher:', e);
    document.getElementById('mainContent').innerHTML =
      '<div class="doi-voucher-empty">Khong tai duoc danh sach voucher.</div>';
  }
}

function renderLoading() {
  document.getElementById('mainContent').innerHTML =
    '<div class="doi-voucher-empty">Dang tai danh sach voucher...</div>';
}

function renderVoucherPage() {
  const activeCard = memberCard && memberCard.trang_thai === 'hoat_dong';
  const statusText = memberCard ? cardStatusLabel(memberCard.trang_thai) : 'Chua co the';
  const statusClass = activeCard ? 'doi-voucher-status-ok' : 'doi-voucher-status-bad';

  document.getElementById('mainContent').innerHTML = `
    <section class="doi-voucher-summary">
      <div>
        <div class="doi-voucher-summary-label">Diem kha dung</div>
        <div class="doi-voucher-points">${formatNumber(availablePoints)}</div>
      </div>
      <div class="doi-voucher-card-state ${statusClass}">${escapeHtml(statusText)}</div>
    </section>

    ${activeCard ? '' : `
      <div class="doi-voucher-warning">
        Chi the thanh vien dang hoat dong moi duoc phep doi voucher.
      </div>
    `}

    <section class="doi-voucher-list" id="doi-voucher-list">
      ${renderVoucherCards(activeCard)}
    </section>
  `;
}

function renderVoucherCards(activeCard) {
  if (!vouchers.length) {
    return '<div class="doi-voucher-empty">Hien chua co voucher co the doi.</div>';
  }

  return vouchers.map(voucher => {
    const cost = Number(voucher.so_diem_quy_doi || 0);
    const enoughPoints = availablePoints >= cost;
    const disabled = !activeCard || !enoughPoints;
    const buttonText = !activeCard ? 'The khong hoat dong' : (enoughPoints ? 'Doi ngay' : 'Khong du diem');
    const desc = voucher.thoi_han_voucher
      ? `Hieu luc ${voucher.thoi_han_voucher} ngay sau khi doi`
      : 'Voucher uu dai CarePoint';

    return `
      <article class="doi-voucher-card">
        <div class="doi-voucher-value">${formatMoneyShort(voucher.gia_tri)}</div>
        <div class="doi-voucher-info">
          <div class="doi-voucher-name">${escapeHtml(voucher.ten_qua || 'Voucher uu dai')}</div>
          <div class="doi-voucher-desc">${escapeHtml(desc)}</div>
          <div class="doi-voucher-meta">
            <span>${formatNumber(cost)} diem</span>
            <span>Con ${formatNumber(voucher.so_luong_ton || 0)}</span>
          </div>
        </div>
        <button class="doi-voucher-btn" ${disabled ? 'disabled' : ''}
          onclick="openConfirmVoucher('${encodeURIComponent(voucher.ma_qua)}')">
          ${buttonText}
        </button>
      </article>
    `;
  }).join('');
}

function openConfirmVoucher(encodedMaQua) {
  const maQua = decodeURIComponent(encodedMaQua);
  const voucher = vouchers.find(item => item.ma_qua === maQua);
  if (!voucher) return;

  pendingVoucher = voucher;
  const cost = Number(voucher.so_diem_quy_doi || 0);
  document.getElementById('doi-voucher-confirm-name').textContent = voucher.ten_qua || 'Voucher uu dai';
  document.getElementById('doi-voucher-confirm-cost').textContent = '- ' + formatNumber(cost) + ' diem';
  document.getElementById('doi-voucher-confirm-after').textContent = formatNumber(availablePoints - cost) + ' diem';
  document.getElementById('doi-voucher-confirm-exp').textContent =
    voucher.thoi_han_voucher ? voucher.thoi_han_voucher + ' ngay' : 'Theo chuong trinh';
  openModal('modal-doi-voucher');
}

async function confirmExchangeVoucher() {
  if (!pendingVoucher || !memberCard) return;

  const confirmBtn = document.getElementById('doi-voucher-confirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Dang doi...';

  try {
    const freshCards = await sbGet(
      'the_thanh_vien',
      `ma_the=eq.${encodeURIComponent(memberCard.ma_the)}` +
      '&select=ma_the,ma_kh,hang,so_diem,trang_thai&limit=1'
    );
    const freshCard = freshCards && freshCards[0];
    if (!freshCard || freshCard.trang_thai !== 'hoat_dong') throw new Error('CARD_INACTIVE');

    const freshVouchers = await sbGet(
      'qua_tang',
      `ma_qua=eq.${encodeURIComponent(pendingVoucher.ma_qua)}` +
      '&trang_thai=eq.hoat_dong&loai=eq.voucher_giam_gia' +
      '&select=ma_qua,ten_qua,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher&limit=1'
    );
    const freshVoucher = freshVouchers && freshVouchers[0];
    if (!freshVoucher || Number(freshVoucher.so_luong_ton || 0) <= 0) throw new Error('OUT_OF_STOCK');

    const cost = Number(freshVoucher.so_diem_quy_doi || 0);
    const currentPoints = Number(freshCard.so_diem || 0);
    if (currentPoints < cost) throw new Error('NOT_ENOUGH_POINTS');

    const newBalance = currentPoints - cost;
    const exchangeRows = await sbInsert('lich_su_doi_qua', {
      ma_the: freshCard.ma_the,
      ma_qua: freshVoucher.ma_qua,
      so_luong: 1,
      so_diem_da_dung: cost,
      ngay_doi: new Date().toISOString(),
      trang_thai: 'da_nhan',
      ghi_chu: 'Khach hang doi diem lay voucher'
    });
    const exchange = exchangeRows && exchangeRows[0];
    const voucherCode = buildVoucherCode();
    const expiryDate = addDaysToISODate(Number(freshVoucher.thoi_han_voucher || 30));

    await sbInsert('voucher', {
      ma_voucher: voucherCode,
      ma_doi: exchange && exchange.ma_doi,
      ma_kh: currentKhId,
      gia_tri_giam: Number(freshVoucher.gia_tri || 0),
      ngay_het_han: expiryDate,
      trang_thai: 'chua_dung',
      ma_qr: `QR_${currentKhId}_${voucherCode}`
    });

    if (exchange && exchange.ma_doi) {
      await sbUpdate(
        'lich_su_doi_qua',
        `ma_doi=eq.${encodeURIComponent(exchange.ma_doi)}`,
        { ma_voucher: voucherCode }
      );
    }

    await sbUpdate(
      'the_thanh_vien',
      `ma_the=eq.${encodeURIComponent(freshCard.ma_the)}`,
      { so_diem: newBalance }
    );

    await sbUpdate(
      'qua_tang',
      `ma_qua=eq.${encodeURIComponent(freshVoucher.ma_qua)}`,
      { so_luong_ton: Math.max(0, Number(freshVoucher.so_luong_ton || 0) - 1) }
    );

    await sbInsert('lich_su_giao_dich_diem', {
      ma_the: freshCard.ma_the,
      ma_don_hang: null,
      loai_gd: 'doi_qua',
      so_diem: -cost,
      so_du_sau_gd: newBalance,
      ngay_gd: new Date().toISOString(),
      ghi_chu: 'Doi voucher ' + (freshVoucher.ten_qua || voucherCode)
    });

    closeModal('modal-doi-voucher');
    pendingVoucher = null;
    showToast('Doi voucher thanh cong. Voucher da vao tai khoan cua ban.', 'ok');
    await loadVoucherPage();
  } catch (e) {
    console.error('Loi doi voucher:', e);
    showToast(exchangeErrorMessage(e), 'err');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Xac nhan doi';
  }
}

function exchangeErrorMessage(error) {
  if (!error || !error.message) return 'Doi voucher that bai, vui long thu lai.';
  if (error.message === 'CARD_INACTIVE') return 'The thanh vien khong hoat dong nen khong the doi voucher.';
  if (error.message === 'OUT_OF_STOCK') return 'Voucher nay da het luot doi.';
  if (error.message === 'NOT_ENOUGH_POINTS') return 'Ban khong du diem de doi voucher nay.';
  return 'Doi voucher that bai, vui long thu lai.';
}

function buildVoucherCode() {
  const d = new Date();
  const pad = value => String(value).padStart(2, '0');
  const stamp =
    String(d.getFullYear()).slice(2) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());
  return 'VCR' + stamp + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function addDaysToISODate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function cardStatusLabel(status) {
  return {
    hoat_dong: 'Dang hoat dong',
    het_han: 'The het han',
    bi_khoa: 'The bi khoa',
    mat_the: 'Bao mat the'
  }[status] || status || 'Khong xac dinh';
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatMoneyShort(value) {
  const amount = Number(value || 0);
  if (!amount) return 'VC';
  if (amount >= 1000) return Math.round(amount / 1000) + 'K';
  return formatNumber(amount);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
