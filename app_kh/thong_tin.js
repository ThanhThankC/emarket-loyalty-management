// thong_tin.js - Xem va cap nhat thong tin ca nhan khach hang
requireLogin();

const khSession = getCurrentNV();
const maKhHienTai = khSession && (khSession.ma_kh || khSession.ma_nv);
let thongTinBanDau = null;
let daTaiThongTin = false;

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

document.addEventListener('DOMContentLoaded', () => {
  if (!maKhHienTai) return;

  document.getElementById('profileForm').addEventListener('submit', luuThongTin);
  document.getElementById('resetButton').addEventListener('click', () => {
    if (thongTinBanDau) dienThongTin(thongTinBanDau);
    clearErrors();
    showAlert('', '');
  });

  ['hoTen', 'ngaySinh', 'gioiTinh', 'email', 'diaChi'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => setFieldError(id, ''));
  });

  taiThongTin();
});

async function taiThongTin() {
  setBusy(true, 'Đang tải...');
  try {
    const data = await sbGet(
      'khach_hang',
      `ma_kh=eq.${encodeURIComponent(maKhHienTai)}` +
      '&select=ma_kh,ho_ten,ngay_sinh,gioi_tinh,so_dien_thoai,email,dia_chi'
    );

    if (!data || data.length === 0) {
      throw new Error('Không tìm thấy hồ sơ khách hàng.');
    }

    thongTinBanDau = data[0];
    daTaiThongTin = true;
    dienThongTin(thongTinBanDau);
    setStatus('Sẵn sàng', true);
  } catch (error) {
    console.error(error);
    setStatus('Lỗi tải dữ liệu', false);
    showAlert('Không thể tải thông tin cá nhân. Vui lòng thử lại.', 'error');
    showToast('Không thể tải thông tin cá nhân', 'err');
  } finally {
    setBusy(false, 'Lưu thay đổi', !daTaiThongTin);
  }
}

function dienThongTin(data) {
  setValue('maKh', data.ma_kh);
  setValue('soDienThoai', data.so_dien_thoai);
  setValue('hoTen', data.ho_ten);
  setValue('ngaySinh', data.ngay_sinh ? String(data.ngay_sinh).slice(0, 10) : '');
  setValue('gioiTinh', data.gioi_tinh);
  setValue('email', data.email);
  setValue('diaChi', data.dia_chi);
}

async function luuThongTin(event) {
  event.preventDefault();
  if (!daTaiThongTin) {
    showAlert('Hồ sơ chưa được tải. Vui lòng tải lại trang và thử lại.', 'error');
    return;
  }
  clearErrors();
  showAlert('', '');

  const payload = {
    ho_ten: getValue('hoTen'),
    ngay_sinh: getValue('ngaySinh') || null,
    gioi_tinh: getValue('gioiTinh') || null,
    email: getValue('email') || null,
    dia_chi: getValue('diaChi') || null
  };

  if (!validate(payload)) {
    showAlert('Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.', 'error');
    return;
  }

  setBusy(true, 'Đang lưu...');
  try {
    const updated = await sbUpdate(
      'khach_hang',
      `ma_kh=eq.${encodeURIComponent(maKhHienTai)}`,
      payload
    );

    thongTinBanDau = updated && updated.length
      ? updated[0]
      : Object.assign({}, thongTinBanDau, payload);
    dienThongTin(thongTinBanDau);
    capNhatSession(thongTinBanDau);
    showAlert('Thông tin cá nhân đã được cập nhật thành công.', 'success');
    showToast('Lưu thông tin thành công', 'ok');
  } catch (error) {
    console.error(error);
    const message = getSaveError(error);
    showAlert(message, 'error');
    showToast(message, 'err');
  } finally {
    setBusy(false, 'Lưu thay đổi');
  }
}

function validate(payload) {
  let valid = true;
  const today = new Date().toISOString().slice(0, 10);

  if (!payload.ho_ten) {
    setFieldError('hoTen', 'Họ và tên không được để trống.');
    valid = false;
  } else if (payload.ho_ten.length < 2) {
    setFieldError('hoTen', 'Họ và tên phải có ít nhất 2 ký tự.');
    valid = false;
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    setFieldError('email', 'Email không đúng định dạng.');
    valid = false;
  }

  if (payload.ngay_sinh && payload.ngay_sinh > today) {
    setFieldError('ngaySinh', 'Ngày sinh không được ở tương lai.');
    valid = false;
  }

  if (payload.gioi_tinh && !['Nam', 'Nu', 'Khac'].includes(payload.gioi_tinh)) {
    setFieldError('gioiTinh', 'Giới tính không hợp lệ.');
    valid = false;
  }

  if (payload.dia_chi && payload.dia_chi.length > 500) {
    setFieldError('diaChi', 'Địa chỉ không được vượt quá 500 ký tự.');
    valid = false;
  }

  return valid;
}

function capNhatSession(data) {
  const current = getCurrentNV();
  if (!current) return;
  current.ho_ten = data.ho_ten;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(current));
}

function setFieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(id + 'Error');
  if (input) input.classList.toggle('thong-tin-invalid', Boolean(message));
  if (error) error.textContent = message || '';
}

function clearErrors() {
  ['hoTen', 'ngaySinh', 'gioiTinh', 'email', 'diaChi'].forEach(id => setFieldError(id, ''));
}

function showAlert(message, type) {
  const alert = document.getElementById('formAlert');
  alert.className = 'thong-tin-alert' + (type ? ' ' + type : '');
  alert.textContent = message || '';
}

function setBusy(busy, text, forceDisabled = false) {
  const saveButton = document.getElementById('saveButton');
  const resetButton = document.getElementById('resetButton');
  saveButton.disabled = busy || forceDisabled;
  resetButton.disabled = busy || forceDisabled;
  saveButton.textContent = text;
}

function setStatus(text, ready) {
  const status = document.getElementById('profileStatus');
  status.textContent = text;
  status.classList.toggle('ready', Boolean(ready));
}

function setValue(id, value) {
  document.getElementById(id).value = value || '';
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function getSaveError(error) {
  const raw = error && error.message ? error.message.toLowerCase() : '';
  if (raw.includes('email') && (raw.includes('duplicate') || raw.includes('unique'))) {
    return 'Email này đã được sử dụng cho tài khoản khác.';
  }
  return 'Không thể lưu thông tin cá nhân. Vui lòng thử lại.';
}
