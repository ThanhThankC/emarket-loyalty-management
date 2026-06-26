// doi_diem_qua.js — Đổi điểm lấy quà/voucher
// File: doi_diem_qua.html / doi_diem_qua.css / doi_diem_qua.js — UC-9
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV();
const currentKhId = kh && (kh.ma_kh || kh.ma_nv);
let currentMemberCard = null;
let currentAvailablePoints = 0;
let allExchangeItems = [];
let activeGiftType = 'voucher_giam_gia';

function setTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  activeGiftType = el.dataset.giftType;
  renderExchangeItems();
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
//  LOAD ĐIỂM KHẢ DỤNG + BADGE VOUCHER
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh || !currentKhId) return;

  try {
    const theData = await sbGet('the_thanh_vien',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}` +
      '&select=ma_the,so_diem,trang_thai&order=updated_at.desc&limit=1');
    if (!theData || !theData.length) throw new Error('Không tìm thấy thẻ thành viên.');

    currentMemberCard = theData[0];
    currentAvailablePoints = Number(currentMemberCard.so_diem || 0);
    document.getElementById('excPts').textContent = currentAvailablePoints.toLocaleString('vi-VN');
  } catch (e) {
    console.error('Lỗi tải điểm:', e);
    document.getElementById('excPts').textContent = '---';
    showToast('Không thể truy xuất điểm khả dụng', 'err');
  }

  try {
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}&trang_thai=eq.chua_dung`);
    const count = vcData ? vcData.length : 0;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    }
  } catch (e) {
    /* Bỏ qua lỗi badge */
  }

  loadExchangeItems();
});

// ============================================================
//  LOAD DANH SÁCH QUÀ ĐỔI ĐIỂM (AC: Xem danh sách có thể đổi)
// ============================================================
async function loadExchangeItems() {
  const grid = document.getElementById('excGrid');
  try {
    const data = await sbGet(
      'qua_tang',
      'trang_thai=eq.hoat_dong&so_luong_ton=gt.0' +
      '&select=ma_qua,ten_qua,loai,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher' +
      '&order=so_diem_quy_doi.asc'
    );
    allExchangeItems = data || [];
    if (!allExchangeItems.length) {
      grid.innerHTML = '<div class="exc-placeholder">Chưa có quà nào</div>';
      return;
    }
    renderExchangeItems();
  } catch (e) {
    console.error('Lỗi tải danh sách quà:', e);
    grid.innerHTML = '<div class="exc-placeholder">Lỗi tải danh sách quà</div>';
  }
}

// ============================================================
//  XÁC NHẬN ĐỔI ĐIỂM (AC: Kiểm tra đủ điểm, trừ điểm, cấp voucher)
// ============================================================
let pendingExchange = null;

function openConfirmExchangeEncoded(maQua, tenQua, soDiem, moTa) {
  openConfirmExchange(
    decodeURIComponent(maQua),
    decodeURIComponent(tenQua),
    soDiem,
    decodeURIComponent(moTa)
  );
}

function renderExchangeItems() {
  const grid = document.getElementById('excGrid');
  const items = allExchangeItems.filter(item => item.loai === activeGiftType);
  const cardActive = currentMemberCard && currentMemberCard.trang_thai === 'hoat_dong';

  if (!items.length) {
    grid.innerHTML = '<div class="exc-placeholder">Chưa có ' + giftTypeLabel(activeGiftType).toLowerCase() + ' để đổi.</div>';
    return;
  }

  grid.innerHTML = items.map(q => {
    const cost = Number(q.so_diem_quy_doi || 0);
    const canExchange = cardActive && currentAvailablePoints >= cost;
    const buttonText = !cardActive ? 'Thẻ không hoạt động' : (canExchange ? 'Đổi ngay' : 'Không đủ điểm');

    return `
      <div class="exc-item exc-type-${q.loai}">
        <div class="exc-item-img">
          <span class="exc-item-symbol">${giftTypeCode(q.loai)}</span>
          <span class="exc-item-type">${giftTypeLabel(q.loai)}</span>
        </div>
        <div class="exc-item-body">
          <div class="exc-item-name">${escapeExchangeHtml(q.ten_qua || 'Quà tặng')}</div>
          <div class="exc-item-pts">${cost.toLocaleString('vi-VN')} điểm</div>
          <div class="exc-item-stock">Còn ${q.so_luong_ton || 0} phần</div>
          <button class="exc-btn" ${canExchange ? '' : 'disabled'}
            onclick="openConfirmExchangeEncoded('${encodeURIComponent(q.ma_qua || '')}','${encodeURIComponent(q.ten_qua || '')}','${q.so_diem_quy_doi}','${encodeURIComponent(exchangeDescription(q))}')">
            ${buttonText}
          </button>
        </div>
      </div>`;
  }).join('');
}

function giftTypeCode(type) {
  return {
    voucher_giam_gia: 'VCH',
    qua_hien_vat: 'QUÀ',
    uu_dai_dich_vu: 'DV'
  }[type] || 'CP';
}

function giftTypeLabel(type) {
  return {
    voucher_giam_gia: 'Voucher',
    qua_hien_vat: 'Quà tặng',
    uu_dai_dich_vu: 'Ưu đãi dịch vụ'
  }[type] || 'Ưu đãi';
}

function escapeExchangeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openConfirmExchange(maQua, tenQua, soDiem, moTa) {
  const gift = allExchangeItems.find(item => item.ma_qua === maQua);
  pendingExchange = { maQua, tenQua, soDiem: parseInt(soDiem), gift };

  document.getElementById('ceName').textContent = tenQua;
  document.getElementById('ceDesc').textContent = moTa || 'Quà tặng đặc biệt';
  document.getElementById('cePts').textContent =
    '- ' + parseInt(soDiem).toLocaleString('vi-VN') + ' điểm';

  // Lấy điểm hiện tại
  const diemHT = currentAvailablePoints;

  document.getElementById('ceAfter').textContent =
    Math.max(0, diemHT - parseInt(soDiem)).toLocaleString('vi-VN') + ' điểm';

  const confirmButton = document.getElementById('btnConfirmExc');
  const duDiem = diemHT >= pendingExchange.soDiem;
  const activeCard = currentMemberCard && currentMemberCard.trang_thai === 'hoat_dong';
  confirmButton.disabled = !duDiem || !activeCard;
  confirmButton.textContent = !activeCard ? 'Thẻ không hoạt động' : (duDiem ? 'Xác nhận đổi' : 'Không đủ điểm');

  openModal('modal-confirm-exchange');
}

document.getElementById('btnConfirmExc').addEventListener('click', async () => {
  if (!pendingExchange || !currentMemberCard) return;
  const confirmButton = document.getElementById('btnConfirmExc');
  confirmButton.disabled = true;
  confirmButton.textContent = 'Đang đổi...';

  try {
    const freshCardRows = await sbGet(
      'the_thanh_vien',
      'ma_the=eq.' + encodeURIComponent(currentMemberCard.ma_the) +
      '&select=ma_the,ma_kh,hang,so_diem,trang_thai&limit=1'
    );
    const freshCard = freshCardRows && freshCardRows[0];
    if (!freshCard || freshCard.trang_thai !== 'hoat_dong') throw new Error('CARD_INACTIVE');

    const freshGiftRows = await sbGet(
      'qua_tang',
      'ma_qua=eq.' + encodeURIComponent(pendingExchange.maQua) +
      '&trang_thai=eq.hoat_dong&select=ma_qua,ten_qua,loai,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher&limit=1'
    );
    const freshGift = freshGiftRows && freshGiftRows[0];
    if (!freshGift || Number(freshGift.so_luong_ton || 0) <= 0) throw new Error('OUT_OF_STOCK');

    const cost = Number(freshGift.so_diem_quy_doi || 0);
    const currentPoints = Number(freshCard.so_diem || 0);
    if (currentPoints < cost) throw new Error('NOT_ENOUGH_POINTS');

    const newBalance = currentPoints - cost;
    const exchangeRows = await sbInsert('lich_su_doi_qua', {
      ma_the: freshCard.ma_the,
      ma_qua: freshGift.ma_qua,
      so_luong: 1,
      so_diem_da_dung: cost,
      ngay_doi: new Date().toISOString(),
      trang_thai: freshGift.loai === 'voucher_giam_gia' ? 'da_nhan' : 'cho_nhan',
      ghi_chu: freshGift.loai === 'voucher_giam_gia' ? 'Khách hàng đổi điểm lấy voucher' : 'Khách hàng đổi điểm lấy quà'
    });
    const exchange = exchangeRows && exchangeRows[0];

    let voucherCode = null;
    if (freshGift.loai === 'voucher_giam_gia') {
      voucherCode = buildExchangeVoucherCode();
      await sbInsert('voucher', {
        ma_voucher: voucherCode,
        ma_doi: exchange && exchange.ma_doi,
        ma_kh: currentKhId,
        gia_tri_giam: Number(freshGift.gia_tri || 0),
        ngay_het_han: addExchangeDaysToISODate(Number(freshGift.thoi_han_voucher || 30)),
        trang_thai: 'chua_dung',
        ma_qr: 'QR_' + currentKhId + '_' + voucherCode
      });

      if (exchange && exchange.ma_doi) {
        await sbUpdate(
          'lich_su_doi_qua',
          'ma_doi=eq.' + encodeURIComponent(exchange.ma_doi),
          { ma_voucher: voucherCode }
        );
      }
    }

    await sbUpdate(
      'the_thanh_vien',
      'ma_the=eq.' + encodeURIComponent(freshCard.ma_the),
      { so_diem: newBalance }
    );

    await sbUpdate(
      'qua_tang',
      'ma_qua=eq.' + encodeURIComponent(freshGift.ma_qua),
      { so_luong_ton: Math.max(0, Number(freshGift.so_luong_ton || 0) - 1) }
    );

    await sbInsert('lich_su_giao_dich_diem', {
      ma_the: freshCard.ma_the,
      ma_don_hang: null,
      loai_gd: 'doi_qua',
      so_diem: -cost,
      so_du_sau_gd: newBalance,
      ngay_gd: new Date().toISOString(),
      ghi_chu: 'Đổi ' + (freshGift.ten_qua || freshGift.ma_qua)
    });

    currentMemberCard = Object.assign({}, freshCard, { so_diem: newBalance });
    currentAvailablePoints = newBalance;
    document.getElementById('excPts').textContent = currentAvailablePoints.toLocaleString('vi-VN');
    allExchangeItems = allExchangeItems.map(item => {
      if (item.ma_qua !== freshGift.ma_qua) return item;
      return Object.assign({}, item, { so_luong_ton: Math.max(0, Number(freshGift.so_luong_ton || 0) - 1) });
    });
    renderExchangeItems();

    closeModal('modal-confirm-exchange');
    showToast(freshGift.loai === 'voucher_giam_gia' ? 'Đổi thành công! Voucher đã vào tài khoản.' : 'Đổi thành công! Quà đang chờ nhận.', 'ok');
    pendingExchange = null;
  } catch (e) {
    console.error('Lỗi đổi điểm:', e);
    showToast(exchangeSubmitMessage(e), 'err');
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = 'Xác nhận đổi';
  }
});

function exchangeDescription(gift) {
  if (gift.loai === 'voucher_giam_gia') {
    return 'Voucher giảm ' + Number(gift.gia_tri || 0).toLocaleString('vi-VN') + ' đ';
  }
  if (gift.loai === 'uu_dai_dich_vu') return 'Ưu đãi dịch vụ dành cho thành viên';
  return 'Quà tặng dành cho thành viên';
}

function exchangeSubmitMessage(error) {
  if (!error || !error.message) return 'Đổi điểm thất bại, thử lại sau';
  if (error.message === 'CARD_INACTIVE') return 'Thẻ thành viên không hoạt động nên không thể đổi quà.';
  if (error.message === 'OUT_OF_STOCK') return 'Ưu đãi này đã hết lượt đổi.';
  if (error.message === 'NOT_ENOUGH_POINTS') return 'Bạn không đủ điểm để đổi ưu đãi này.';
  return 'Đổi điểm thất bại, thử lại sau';
}

function buildExchangeVoucherCode() {
  var d = new Date();
  var pad = function(value) { return String(value).padStart(2, '0'); };
  var stamp =
    String(d.getFullYear()).slice(2) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());
  return 'VCR' + stamp + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function addExchangeDaysToISODate(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
