// khuyen_mai.js - Khuyen mai & Su kien
requireLogin();
const kh = getCurrentNV();

let khuyenMaiRows = [];

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

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.ov').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) ov.classList.remove('open');
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;
  await loadKhuyenMai();
});

async function loadKhuyenMai() {
  const main = document.getElementById('mainContent');
  main.innerHTML = '<div class="khuyen-mai-empty">Dang tai khuyen mai va su kien...</div>';

  try {
    const rows = await sbGet(
      'chuong_trinh_khuyen_mai',
      'trang_thai=eq.hoat_dong' +
        '&select=ma_chuong_trinh,ten_chuong_trinh,loai,dieu_kien_ap_dung,hang_toi_thieu,ngay_bat_dau,ngay_ket_thuc,mo_ta,qua_tang(ma_qua,ten_qua,loai,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher,trang_thai)' +
        '&order=ngay_ket_thuc.asc'
    );
    khuyenMaiRows = rows || [];
    renderKhuyenMai();
  } catch (error) {
    console.error('Loi tai khuyen mai:', error);
    main.innerHTML = '<div class="khuyen-mai-empty">Khong tai duoc danh sach khuyen mai.</div>';
    showToast('Khong tai duoc khuyen mai', 'err');
  }
}

function renderKhuyenMai() {
  const main = document.getElementById('mainContent');
  if (!khuyenMaiRows.length) {
    main.innerHTML = '<div class="khuyen-mai-empty">Hien chua co chuong trinh nao dang dien ra.</div>';
    return;
  }

  main.innerHTML =
    '<div class="khuyen-mai-list">' +
      khuyenMaiRows.map(renderKhuyenMaiCard).join('') +
    '</div>';
}

function renderKhuyenMaiCard(item) {
  const gift = normalizeKhuyenMaiGift(item.qua_tang);
  const stock = Number(gift.so_luong_ton || 0);
  const timeState = getKhuyenMaiTimeState(item);
  const available = timeState.key === 'open' && stock > 0 && gift.trang_thai !== 'ngung_cung_cap';
  return `
    <article class="khuyen-mai-card" onclick="openKhuyenMaiDetail('${escapeAttrKhuyenMai(item.ma_chuong_trinh)}')">
      <div class="khuyen-mai-head">
        <div>
          <div class="khuyen-mai-type">${escapeHtmlKhuyenMai(programTypeLabel(item.loai))}</div>
          <div class="khuyen-mai-title">${escapeHtmlKhuyenMai(item.ten_chuong_trinh || 'Chuong trinh thanh vien')}</div>
        </div>
        <span class="khuyen-mai-badge ${escapeAttrKhuyenMai(timeState.className)}">${escapeHtmlKhuyenMai(timeState.label)}</span>
      </div>
      <div class="khuyen-mai-desc">${escapeHtmlKhuyenMai(item.mo_ta || item.dieu_kien_ap_dung || 'Uu dai danh cho khach hang thanh vien CarePoint.')}</div>
      <div class="khuyen-mai-gift">
        <div class="khuyen-mai-gift-name">${escapeHtmlKhuyenMai(gift.ten_qua || 'Qua tang thanh vien')}</div>
        <div class="khuyen-mai-gift-meta">
          <span>${formatKhuyenMaiNumber(gift.so_diem_quy_doi)} diem</span>
          <span>Con ${formatKhuyenMaiNumber(stock)}</span>
        </div>
      </div>
      <div class="khuyen-mai-foot">
        <span>${escapeHtmlKhuyenMai(formatKhuyenMaiDate(item.ngay_bat_dau))} - ${escapeHtmlKhuyenMai(formatKhuyenMaiDate(item.ngay_ket_thuc))}</span>
        <span>${escapeHtmlKhuyenMai(item.hang_toi_thieu || 'Tat ca hang')}</span>
      </div>
      ${available ? '' : '<div class="khuyen-mai-note">' + escapeHtmlKhuyenMai(timeState.note || 'Chuong trinh dang duoc cong bo de khach hang theo doi.') + '</div>'}
    </article>
  `;
}

function openKhuyenMaiDetail(id) {
  const item = khuyenMaiRows.find(row => row.ma_chuong_trinh === id);
  if (!item) return;
  const gift = normalizeKhuyenMaiGift(item.qua_tang);

  document.getElementById('kmTitle').textContent = item.ten_chuong_trinh || 'Chi tiet khuyen mai';
  document.getElementById('kmSub').textContent =
    formatKhuyenMaiDate(item.ngay_bat_dau) + ' - ' + formatKhuyenMaiDate(item.ngay_ket_thuc);

  const sheet = document.querySelector('#modal-km-detail .sheet');
  let body = document.getElementById('khuyen-mai-detail-body');
  if (!body) {
    body = document.createElement('div');
    body.id = 'khuyen-mai-detail-body';
    body.className = 'khuyen-mai-detail-body';
    sheet.appendChild(body);
  }

  body.innerHTML = `
    <div class="khuyen-mai-detail-section">
      <div class="khuyen-mai-detail-label">Dieu kien</div>
      <div class="khuyen-mai-detail-text">${escapeHtmlKhuyenMai(item.dieu_kien_ap_dung || '-')}</div>
    </div>
    <div class="khuyen-mai-detail-section">
      <div class="khuyen-mai-detail-label">Qua tang</div>
      <div class="khuyen-mai-detail-text">${escapeHtmlKhuyenMai(gift.ten_qua || '-')}</div>
      <div class="khuyen-mai-detail-grid">
        <span>Diem doi: <b>${formatKhuyenMaiNumber(gift.so_diem_quy_doi)}</b></span>
        <span>So luong: <b>${formatKhuyenMaiNumber(gift.so_luong_ton)}</b></span>
        <span>Loai: <b>${escapeHtmlKhuyenMai(giftTypeLabel(gift.loai))}</b></span>
        <span>Hang: <b>${escapeHtmlKhuyenMai(item.hang_toi_thieu || 'Tat ca')}</b></span>
      </div>
    </div>
    <button class="btn-full khuyen-mai-detail-button" onclick="location.href='doi_diem_qua.html'">Xem qua doi diem</button>
  `;

  openModal('modal-km-detail');
}

function normalizeKhuyenMaiGift(value) {
  if (Array.isArray(value)) {
    return value.find(item => item && item.trang_thai === 'hoat_dong') || value[0] || {};
  }
  return value || {};
}

function programTypeLabel(type) {
  return {
    tang_qua: 'Qua tang',
    giam_gia: 'Giam gia',
    tich_diem_bo: 'Tich diem bo sung',
    su_kien: 'Su kien'
  }[type] || 'Thanh vien';
}

function giftTypeLabel(type) {
  return {
    voucher_giam_gia: 'Voucher',
    qua_hien_vat: 'Qua hien vat',
    uu_dai_dich_vu: 'Uu dai dich vu'
  }[type] || 'Qua tang';
}

function formatKhuyenMaiDate(value) {
  if (!value) return '-';
  const d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

function getKhuyenMaiTimeState(item) {
  const today = new Date().toISOString().slice(0, 10);
  if (item.ngay_bat_dau && today < item.ngay_bat_dau) {
    return {
      key: 'upcoming',
      label: 'Sap dien ra',
      className: 'upcoming',
      note: 'Chuong trinh chua den ngay bat dau.'
    };
  }
  if (item.ngay_ket_thuc && today > item.ngay_ket_thuc) {
    return {
      key: 'expired',
      label: 'Da qua han',
      className: 'ended',
      note: 'Chuong trinh da qua thoi gian ap dung.'
    };
  }
  return {
    key: 'open',
    label: 'Dang mo',
    className: 'ok',
    note: ''
  };
}

function formatKhuyenMaiNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function escapeHtmlKhuyenMai(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttrKhuyenMai(value) {
  return escapeHtmlKhuyenMai(value).replace(/`/g, '&#96;');
}
