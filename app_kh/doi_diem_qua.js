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

  if (!items.length) {
    grid.innerHTML = '<div class="exc-placeholder">Chưa có ' + giftTypeLabel(activeGiftType).toLowerCase() + ' để đổi.</div>';
    return;
  }

  grid.innerHTML = items.map(q => `
    <div class="exc-item exc-type-${q.loai}">
      <div class="exc-item-img">
        <span class="exc-item-symbol">${giftTypeCode(q.loai)}</span>
        <span class="exc-item-type">${giftTypeLabel(q.loai)}</span>
      </div>
      <div class="exc-item-body">
        <div class="exc-item-name">${escapeExchangeHtml(q.ten_qua || 'Quà tặng')}</div>
        <div class="exc-item-pts">${Number(q.so_diem_quy_doi || 0).toLocaleString('vi-VN')} điểm</div>
        <div class="exc-item-stock">Còn ${q.so_luong_ton || 0} phần</div>
        <button class="exc-btn"
          onclick="openConfirmExchangeEncoded('${encodeURIComponent(q.ma_qua || '')}','${encodeURIComponent(q.ten_qua || '')}','${q.so_diem_quy_doi}','${encodeURIComponent(exchangeDescription(q))}')">
          Đổi ngay
        </button>
      </div>
    </div>`).join('');
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
  pendingExchange = { maQua, tenQua, soDiem: parseInt(soDiem) };

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
  confirmButton.disabled = !duDiem;
  confirmButton.textContent = duDiem ? 'Xác nhận đổi' : 'Không đủ điểm';

  openModal('modal-confirm-exchange');
}

document.getElementById('btnConfirmExc').addEventListener('click', async () => {
  if (!pendingExchange || !currentMemberCard) return;
  if (currentAvailablePoints < pendingExchange.soDiem) {
    showToast('Bạn không đủ điểm để đổi quà này', 'err');
    return;
  }

  try {
    // TODO: AC - Xử lý < 2 giây, rollback nếu lỗi (nên gọi 1 API/transaction
    // ở backend thay vì insert trực tiếp từ client như dưới đây)

    await sbInsert('lich_su_doi_qua', {
      ma_the: currentMemberCard.ma_the,
      ma_qua: pendingExchange.maQua,
      so_luong: 1,
      so_diem_da_dung: pendingExchange.soDiem,
      ngay_doi: new Date().toISOString(),
      trang_thai: 'cho_nhan'
    });

    // TODO: AC - Trừ điểm khỏi the_thanh_vien (sbUpdate the_thanh_vien)
    // TODO: AC - Cấp voucher mới vào tài khoản KH (insert vào bảng voucher)

    closeModal('modal-confirm-exchange');
    showToast('Đổi thành công! Quà đã vào ví', 'ok');
    pendingExchange = null;
  } catch (e) {
    showToast('Đổi điểm thất bại, thử lại sau', 'err');
  }
});

function exchangeDescription(gift) {
  if (gift.loai === 'voucher_giam_gia') {
    return 'Voucher giảm ' + Number(gift.gia_tri || 0).toLocaleString('vi-VN') + ' đ';
  }
  if (gift.loai === 'uu_dai_dich_vu') return 'Ưu đãi dịch vụ dành cho thành viên';
  return 'Quà tặng dành cho thành viên';
}
