// ho_so.js — Hồ sơ / Tài khoản cá nhân
// File: ho_so.html / ho_so.css / ho_so.js
// UC-6.2 (xem thông tin tài khoản), UC-7.2 (xem điểm/hạng), UC-6.1 (đổi mật khẩu)
// Bắt buộc dòng đầu tiên
requireLogin();
const kh = getCurrentNV();
const currentKhId = kh && (kh.ma_kh || kh.ma_nv);

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
//  TẢI THÔNG TIN HỒ SƠ (UC-6.2) + ĐIỂM/HẠNG (UC-7.2)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!kh || !currentKhId) return;

  const ten = kh.ho_ten || 'Khách hàng';
  const initials = ten.split(' ').pop().charAt(0).toUpperCase();
  document.getElementById('profAv').textContent   = initials;
  document.getElementById('profName').textContent = ten;

  // AC UC-6.2: báo lỗi nếu không truy xuất được dữ liệu
  try {
    const theData = await sbGet('the_thanh_vien',
      `ma_kh=eq.${encodeURIComponent(currentKhId)}` +
      '&select=ma_the,hang,so_diem,trang_thai&order=updated_at.desc&limit=1');

    if (!theData || theData.length === 0) {
      throw new Error('Không tìm thấy thẻ thành viên.');
    }

    const the = theData[0];
    const diem = Number(the.so_diem || 0);
    const hang = the.hang || 'Bronze';
    const maThe = the.ma_the || '---';

    document.getElementById('profId').textContent   = maThe + ' · Hạng ' + hang;
    document.getElementById('profTier').textContent = 'Thành viên ' + hang;
    document.getElementById('dRank').textContent    = hang;
    document.getElementById('dPts').textContent     = diem.toLocaleString('vi-VN') + ' điểm';
    document.getElementById('dTotal').textContent   = diem.toLocaleString('vi-VN') + ' điểm';

    calcProgress(hang, diem);
  } catch (e) {
    console.error('Lỗi tải thông tin thẻ:', e);
    document.getElementById('dPts').textContent = 'Không truy xuất được';
    document.getElementById('dTotal').textContent = 'Không truy xuất được';
    showToast('Không thể truy xuất điểm hiện tại', 'err');
  }

  // Badge số voucher khả dụng trên Bottom Nav
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
    /* bỏ qua lỗi badge */
  }
});

// ============================================================
//  TÍNH ĐIỂM CẦN THÊM ĐỂ LÊN HẠNG TIẾP THEO (UC-7.2)
// ============================================================
function calcProgress(hang, diem) {
  const nguong = {
    Bronze: 1000,
    Silver: 5000,
    Gold: 10000,
    Platinum: 99999
  };

  const next = nguong[hang] || 1000;

  if (hang === 'Platinum') {
    document.getElementById('dNext').textContent = 'Hạng cao nhất';
    return;
  }

  const con = next - diem;
  document.getElementById('dNext').textContent =
    'Cần thêm ' + Math.max(0, con).toLocaleString('vi-VN') + ' điểm';
}

// ============================================================
//  ĐỔI MẬT KHẨU (UC-6.1)
// ============================================================
async function handleChangePass() {
  const oldP  = document.getElementById('oldPass').value;
  const newP  = document.getElementById('newPass').value;
  const newP2 = document.getElementById('newPass2').value;

  // AC: kiểm tra dữ liệu nhập vào
  if (!oldP || !newP || !newP2) {
    showToast('Vui lòng nhập đầy đủ', 'err');
    return;
  }

  if (newP !== newP2) {
    showToast('Mật khẩu mới không khớp', 'err');
    return;
  }

  if (newP.length < 6) {
    showToast('Mật khẩu tối thiểu 6 ký tự', 'err');
    return;
  }

  try {
    // TODO: AC - kiểm tra oldP đúng với mật khẩu hiện tại trước khi cập nhật
    await sbUpdate('khach_hang', `ma_kh=eq.${encodeURIComponent(currentKhId)}`, { mat_khau_hash: newP });

    closeModal('modal-changepass');
    showToast('Đổi mật khẩu thành công', 'ok');
  } catch (e) {
    showToast('Lỗi đổi mật khẩu', 'err');
  }
}
