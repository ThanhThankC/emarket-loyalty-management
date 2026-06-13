// doi_diem_qua.js — Đổi điểm lấy quà/voucher
// File: doi_diem_qua.html / doi_diem_qua.css / doi_diem_qua.js — UC-9
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV();

function setTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // TODO: Chuyển nội dung excGrid theo tab (Voucher / Quà tặng / Ưu đãi dịch vụ)
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
  if (!kh) return;

  try {
    const theData = await sbGet('the_thanh_vien',
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Hoat dong`);
    if (theData && theData.length > 0) {
      const diem = theData[0].diem_hien_tai || 0;
      document.getElementById('excPts').textContent = diem.toLocaleString('vi-VN');
    }
  } catch (e) {
    console.error('Lỗi tải điểm:', e);
  }

  try {
    const vcData = await sbGet('voucher',
      `ma_kh=eq.${kh.ma_nv}&trang_thai=eq.Kha dung`);
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
    const data = await sbGet('qua_tang', 'trang_thai=eq.Con hang&order=so_diem_doi.asc');
    if (!data || !data.length) {
      grid.innerHTML = '<div class="exc-placeholder">Chưa có quà nào</div>';
      return;
    }

    const colors = ['exc-c1','exc-c2','exc-c3','exc-c4'];

    grid.innerHTML = data.map((q, i) => `
      <div class="exc-item">
        <div class="exc-item-img ${colors[i % 4]}">${q.ten_qua ? q.ten_qua.slice(0,3).toUpperCase() : 'QUÀ'}</div>
        <div class="exc-item-body">
          <div class="exc-item-name">${q.ten_qua || 'Quà tặng'}</div>
          <div class="exc-item-pts">${(q.so_diem_doi || 0).toLocaleString('vi-VN')} điểm</div>
          <div class="exc-item-stock">Còn ${q.so_luong_con || 0} phần</div>
          <button class="exc-btn"
            onclick="openConfirmExchange('${q.ma_qua}','${q.ten_qua}','${q.so_diem_doi}','${q.mo_ta || ''}')">
            Đổi ngay
          </button>
        </div>
      </div>`).join('');
  } catch (e) {
    grid.innerHTML = '<div class="exc-placeholder">Lỗi tải danh sách quà</div>';
  }
}

// ============================================================
//  XÁC NHẬN ĐỔI ĐIỂM (AC: Kiểm tra đủ điểm, trừ điểm, cấp voucher)
// ============================================================
let pendingExchange = null;

function openConfirmExchange(maQua, tenQua, soDiem, moTa) {
  pendingExchange = { maQua, tenQua, soDiem: parseInt(soDiem) };

  document.getElementById('ceName').textContent = tenQua;
  document.getElementById('ceDesc').textContent = moTa || 'Quà tặng đặc biệt';
  document.getElementById('cePts').textContent =
    '- ' + parseInt(soDiem).toLocaleString('vi-VN') + ' điểm';

  // Lấy điểm hiện tại
  const hiensTextEl = document.getElementById('excPts');
  const diemHT = parseInt((hiensTextEl.textContent || '0').replace(/\D/g,'')) || 0;

  document.getElementById('ceAfter').textContent =
    Math.max(0, diemHT - parseInt(soDiem)).toLocaleString('vi-VN') + ' điểm';

  // TODO: AC - Kiểm tra đủ điểm (diemHT >= soDiem), nếu không đủ:
  //   - báo lỗi / showToast('Không đủ điểm', 'err')
  //   - không cho mở modal hoặc disable btnConfirmExc

  openModal('modal-confirm-exchange');
}

document.getElementById('btnConfirmExc').addEventListener('click', async () => {
  if (!pendingExchange || !kh) return;

  try {
    // TODO: AC - Xử lý < 2 giây, rollback nếu lỗi (nên gọi 1 API/transaction
    // ở backend thay vì insert trực tiếp từ client như dưới đây)

    await sbInsert('lich_su_doi_qua', {
      ma_kh: kh.ma_nv,
      ma_qua: pendingExchange.maQua,
      so_diem: pendingExchange.soDiem,
      thoi_gian: new Date().toISOString()
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