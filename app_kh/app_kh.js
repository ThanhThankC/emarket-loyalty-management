// app_kh.js — Dashboard Khach Hang
// Bat buoc dong dau tien
requireLogin();
const kh = getCurrentNV(); // tai day getCurrentNV() tra ve du lieu khach hang

// ============================================================
//  NAVIGATION
// ============================================================
function go(id, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) { navEl.classList.add('active'); return; }
  const t = document.getElementById('nav-' + id);
  if (t) t.classList.add('active');
}

function setTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
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
//  QR COUNTDOWN
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
//  LOAD DU LIEU KHACH HANG
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh) return;

  // Ten va avatar
  const ten = kh.ho_ten || 'Khach hang';
  const initials = ten.split(' ').pop().charAt(0).toUpperCase();

  // Cap nhat UI header
  document.getElementById('topAvatar').textContent  = initials;
  document.getElementById('heroName').textContent   = ten;
  document.getElementById('profAv').textContent     = initials;
  document.getElementById('profName').textContent   = ten;

  // Lay thong tin the thanh vien & diem
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
      document.getElementById('heroTierTxt').textContent = 'Thanh vien ' + hang;

      // Stats
      document.getElementById('statPts').textContent   = diem.toLocaleString('vi-VN');
      document.getElementById('statTotal').textContent = diemTotal.toLocaleString('vi-VN');

      // The ID
      document.getElementById('cardIdTxt').textContent = 'KH – ' + maThe.slice(-5);
      document.getElementById('qrIdTxt').textContent   = 'KH – ' + maThe.slice(-5);
      document.getElementById('qrHint').textContent    = ten + ' · Hang ' + hang;

      // Profile
      document.getElementById('profId').textContent   = maThe + ' · Hang ' + hang;
      document.getElementById('profTier').textContent = 'Thanh vien ' + hang;
      document.getElementById('dRank').textContent    = hang;
      document.getElementById('dPts').textContent     = diem.toLocaleString('vi-VN') + ' diem';
      document.getElementById('dTotal').textContent   = diemTotal.toLocaleString('vi-VN') + ' diem';

      // Exchange page
      document.getElementById('excPts').textContent   = diem.toLocaleString('vi-VN');

      // Tinh toan progress (vi du nguong hang)
      calcProgress(hang, diem);
    }
  } catch (e) {
    console.error('Loi tai the:', e);
  }

  // Lay voucher
  try {
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Kha dung`);
    const count = vcData ? vcData.length : 0;
    document.getElementById('statVoucher').textContent = count;
    const badge = document.getElementById('voucherBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = ''; }
    renderVouchers(vcData || []);
  } catch (e) {
    document.getElementById('statVoucher').textContent = '0';
  }

  // Lay giao dich gan day
  try {
    const txData = await sbGet('lich_su_giao_dich_diem',
      `ma_kh=eq.${kh.ma_nv}&order=thoi_gian.desc&limit=5`);
    renderTxList(txData || [], 'recentTx');
    renderTxList(txData || [], 'allTx');
  } catch (e) {
    document.getElementById('recentTx').innerHTML =
      '<div class="tx-placeholder">Chua co giao dich</div>';
  }

  // Lay danh sach qua doi diem
  loadExchangeItems();
});

// ============================================================
//  TINH TOAN PROGRESS BAR HANG THANH VIEN
// ============================================================
function calcProgress(hang, diem) {
  const nguong = { 'Moi': 1000, 'Bac': 5000, 'Vang': 10000, 'Bach kim': 99999 };
  const tien = { 'Moi': 0, 'Bac': 1000, 'Vang': 5000, 'Bach kim': 10000 };
  const next = nguong[hang] || 1000;
  const prev = tien[hang] || 0;
  const nextName = { 'Moi': 'Bac', 'Bac': 'Vang', 'Vang': 'Bach kim', 'Bach kim': '' };

  if (hang === 'Bach kim') {
    document.getElementById('progFill').style.width = '100%';
    document.getElementById('progLeft').textContent = 'Da dat hang cao nhat';
    document.getElementById('progPct').textContent  = '100%';
    document.getElementById('dNext').textContent    = 'Hang cao nhat';
    return;
  }

  const range = next - prev;
  const done  = Math.min(diem - prev, range);
  const pct   = Math.round((done / range) * 100);
  const con   = next - diem;

  document.getElementById('progFill').style.width  = Math.max(0, pct) + '%';
  document.getElementById('progLeft').textContent  =
    'Con ' + Math.max(0, con).toLocaleString('vi-VN') + ' diem len ' + (nextName[hang] || '');
  document.getElementById('progPct').textContent   = Math.max(0, pct) + '%';
  document.getElementById('dNext').textContent     =
    'Can them ' + Math.max(0, con).toLocaleString('vi-VN') + ' diem';
}

// ============================================================
//  RENDER DANH SACH GIAO DICH
// ============================================================
function renderTxList(txArr, containerId) {
  const el = document.getElementById(containerId);
  if (!txArr.length) {
    el.innerHTML = '<div class="tx-placeholder">Chua co giao dich nao</div>';
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
        <div class="tx-pts ${plus ? 'plus' : 'minus'}">${sign}${Math.abs(tx.so_diem || 0)} d</div>
      </div>`;
  }).join('');
}

// ============================================================
//  RENDER VOUCHER LIST
// ============================================================
function renderVouchers(vcArr) {
  const el = document.getElementById('voucherList');
  if (!vcArr.length) {
    el.innerHTML = '<div class="tx-placeholder">Ban chua co voucher nao</div>';
    return;
  }
  el.innerHTML = vcArr.map(vc => {
    const exp = vc.ngay_het_han
      ? new Date(vc.ngay_het_han).toLocaleDateString('vi-VN')
      : '---';
    return `
      <div class="voucher">
        <div class="voucher-left">
          <div class="voucher-val">${vc.gia_tri_giam ? Math.round(vc.gia_tri_giam/1000)+'K' : 'QUA'}</div>
          <div class="voucher-unit">VND off</div>
        </div>
        <div class="voucher-body">
          <div class="voucher-name">${vc.ten_voucher || 'Voucher'}</div>
          <div class="voucher-exp">HSD: ${exp}</div>
        </div>
        <button class="voucher-use"
          onclick="openUseVoucher('${vc.ma_voucher}','${vc.ten_voucher}','${exp}')">
          Dung
        </button>
      </div>`;
  }).join('');
}

function openUseVoucher(code, name, exp) {
  document.getElementById('useVoucherCode').textContent = code;
  document.getElementById('useVoucherHint').textContent = name + ' · HSD ' + exp;
  openModal('modal-use-voucher');
}

// ============================================================
//  LOAD DANH SACH QUA DOI DIEM
// ============================================================
async function loadExchangeItems() {
  const grid = document.getElementById('excGrid');
  try {
    const data = await sbGet('qua_tang', 'trang_thai=eq.Con hang&order=so_diem_doi.asc');
    if (!data || !data.length) {
      grid.innerHTML = '<div class="exc-placeholder">Chua co qua nao</div>';
      return;
    }
    const colors = ['exc-c1','exc-c2','exc-c3','exc-c4'];
    grid.innerHTML = data.map((q, i) => `
      <div class="exc-item">
        <div class="exc-item-img ${colors[i % 4]}">${q.ten_qua ? q.ten_qua.slice(0,3).toUpperCase() : 'QUA'}</div>
        <div class="exc-item-body">
          <div class="exc-item-name">${q.ten_qua || 'Qua tang'}</div>
          <div class="exc-item-pts">${(q.so_diem_doi || 0).toLocaleString('vi-VN')} diem</div>
          <div class="exc-item-stock">Con ${q.so_luong_con || 0} phan</div>
          <button class="exc-btn"
            onclick="openConfirmExchange('${q.ma_qua}','${q.ten_qua}','${q.so_diem_doi}','${q.mo_ta || ''}')">
            Doi ngay
          </button>
        </div>
      </div>`).join('');
  } catch (e) {
    grid.innerHTML = '<div class="exc-placeholder">Loi tai danh sach qua</div>';
  }
}

// ============================================================
//  XAC NHAN DOI DIEM
// ============================================================
let pendingExchange = null;

function openConfirmExchange(maQua, tenQua, soDiem, moTa) {
  pendingExchange = { maQua, tenQua, soDiem: parseInt(soDiem) };
  document.getElementById('ceName').textContent = tenQua;
  document.getElementById('ceDesc').textContent = moTa || 'Qua tang dac biet';
  document.getElementById('cePts').textContent  = '- ' + parseInt(soDiem).toLocaleString('vi-VN') + ' diem';

  // Lay diem hien tai
  const hiensTextEl = document.getElementById('excPts');
  const diemHT = parseInt((hiensTextEl.textContent || '0').replace(/\D/g,'')) || 0;
  document.getElementById('ceAfter').textContent =
    Math.max(0, diemHT - parseInt(soDiem)).toLocaleString('vi-VN') + ' diem';

  openModal('modal-confirm-exchange');
}

document.getElementById('btnConfirmExc').addEventListener('click', async () => {
  if (!pendingExchange || !kh) return;
  try {
    // Ghi giao dich doi diem
    await sbInsert('lich_su_doi_qua', {
      ma_kh:   kh.ma_nv,
      ma_qua:  pendingExchange.maQua,
      so_diem: pendingExchange.soDiem,
      thoi_gian: new Date().toISOString()
    });
    closeModal('modal-confirm-exchange');
    showToast('Doi thanh cong! Qua da vao vi', 'ok');
    pendingExchange = null;
  } catch (e) {
    showToast('Doi diem that bai, thu lai sau', 'err');
  }
});

// ============================================================
//  DOI MAT KHAU
// ============================================================
async function handleChangePass() {
  const oldP  = document.getElementById('oldPass').value;
  const newP  = document.getElementById('newPass').value;
  const newP2 = document.getElementById('newPass2').value;
  if (!oldP || !newP || !newP2) { showToast('Vui long nhap day du', 'err'); return; }
  if (newP !== newP2)            { showToast('Mat khau moi khong khop', 'err'); return; }
  if (newP.length < 6)           { showToast('Mat khau toi thieu 6 ky tu', 'err'); return; }
  try {
    await sbUpdate('khach_hang', `ma_kh=eq.${kh.ma_nv}`, { mat_khau: newP });
    closeModal('modal-changepass');
    showToast('Doi mat khau thanh cong', 'ok');
  } catch (e) {
    showToast('Loi doi mat khau', 'err');
  }
}
