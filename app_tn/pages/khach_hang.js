// pages/khach_hang.js
var khachHangDangSua = null;
var khachHangRows = [];
var khachHangHandlersReady = false;
var khachHangPage = 1;
var khachHangPageSize = 10;
var khachHangKeyword = '';
var khachHangMode = 'view';
var themKhachHangHandlersReady = false;

registerPage('khach_hang', function(opts) {
  initKhachHangPage();
});

registerPage('them_khach_hang', function() {
  initThemKhachHangPage();
});

ensureThemKhachHangShell();

function ensureThemKhachHangShell() {
  var customerNav = document.querySelector('.sidebar .ni[data-page="khach_hang"]');
  if (customerNav && !document.querySelector('.sidebar .ni[data-page="them_khach_hang"]')) {
    var addNav = document.createElement('div');
    addNav.className = 'ni';
    addNav.dataset.page = 'them_khach_hang';
    addNav.dataset.label = 'Thêm khách hàng';
    addNav.textContent = 'Thêm khách hàng';
    addNav.addEventListener('click', function() {
      navigate('them_khach_hang', addNav);
    });
    customerNav.insertAdjacentElement('afterend', addNav);
  }

  var main = document.getElementById('main-content');
  if (main && !document.getElementById('page-them_khach_hang')) {
    var page = document.createElement('div');
    page.className = 'page-section';
    page.id = 'page-them_khach_hang';
    main.appendChild(page);
  }
}

function initThemKhachHangPage() {
  ensureThemKhachHangShell();
  renderThemKhachHangMarkup();
  bindThemKhachHangEvents();
  resetThemKhachHangForm(false);
}

function renderThemKhachHangMarkup() {
  var pageEl = document.getElementById('page-them_khach_hang');
  if (!pageEl || document.getElementById('kh-new-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Thêm khách hàng</div>' +
        '<div class="psub">Tạo hồ sơ khách hàng mới tại quầy thu ngân</div>' +
      '</div>' +
    '</div>' +
    '<div class="panel kh-new-panel">' +
      '<div class="panel-h"><span class="panel-t">Thông tin khách hàng mới</span></div>' +
      '<form id="kh-new-form" class="kh-new-form" novalidate>' +
        '<div class="kh-new-code-box">' +
          '<div>' +
            '<div class="kh-new-code-label">Mã khách hàng</div>' +
            '<div class="kh-new-code-note">Hệ thống tự động sinh mã khi tạo hồ sơ.</div>' +
          '</div>' +
          '<input class="fi kh-new-code-input" id="kh-new-code" type="text" readonly/>' +
        '</div>' +
        '<div class="fgrid">' +
          '<div class="fg">' +
            '<label class="fl" for="kh-new-name">Họ tên <span class="req">*</span></label>' +
            '<input class="fi" id="kh-new-name" type="text" maxlength="100" placeholder="Nguyễn Văn An" autocomplete="off"/>' +
            '<div class="kh-new-field-error" id="kh-new-name-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-new-phone">Số điện thoại <span class="req">*</span></label>' +
            '<input class="fi" id="kh-new-phone" type="tel" inputmode="numeric" maxlength="15" placeholder="0912001009" autocomplete="off"/>' +
            '<div class="kh-new-field-error" id="kh-new-phone-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-new-email">Email</label>' +
            '<input class="fi" id="kh-new-email" type="email" maxlength="100" placeholder="khachhang@email.com" autocomplete="off"/>' +
            '<div class="kh-new-field-error" id="kh-new-email-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-new-password">Mật khẩu tạm <span class="req">*</span></label>' +
            '<input class="fi" id="kh-new-password" type="password" minlength="6" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password"/>' +
            '<div class="kh-new-field-error" id="kh-new-password-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-new-birthday">Ngày sinh</label>' +
            '<input class="fi" id="kh-new-birthday" type="date"/>' +
            '<div class="kh-new-field-error" id="kh-new-birthday-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-new-gender">Giới tính</label>' +
            '<select class="fi" id="kh-new-gender">' +
              '<option value="">Chưa cập nhật</option>' +
              '<option value="Nam">Nam</option>' +
              '<option value="Nu">Nữ</option>' +
              '<option value="Khac">Khác</option>' +
            '</select>' +
            '<div class="kh-new-field-error"></div>' +
          '</div>' +
          '<div class="fg ffull">' +
            '<label class="fl" for="kh-new-address">Địa chỉ</label>' +
            '<textarea class="fi" id="kh-new-address" rows="3" placeholder="Địa chỉ liên hệ"></textarea>' +
            '<div class="kh-new-field-error"></div>' +
          '</div>' +
        '</div>' +
        '<div class="kh-new-message" id="kh-new-message">Các trường có dấu * là bắt buộc.</div>' +
        '<div class="kh-new-actions">' +
          '<button class="btn btn-outline" id="kh-new-reset" type="button">Nhập lại</button>' +
          '<button class="btn btn-primary" id="kh-new-submit" type="submit">Thêm khách hàng</button>' +
        '</div>' +
      '</form>' +
    '</div>';
}

function bindThemKhachHangEvents() {
  if (themKhachHangHandlersReady) return;

  document.getElementById('kh-new-phone').addEventListener('input', function() {
    var originalValue = this.value;
    var numericValue = originalValue.replace(/\D/g, '');
    this.value = numericValue;
    setThemKhachHangFieldError(
      'kh-new-phone',
      originalValue !== numericValue ? 'Chỉ được nhập chữ số.' : ''
    );
  });

  ['kh-new-name', 'kh-new-email', 'kh-new-password', 'kh-new-birthday'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
      setThemKhachHangFieldError(id, '');
    });
  });

  document.getElementById('kh-new-form').addEventListener('submit', function(event) {
    event.preventDefault();
    themKhachHangMoi();
  });

  document.getElementById('kh-new-reset').addEventListener('click', function() {
    resetThemKhachHangForm(true);
  });

  themKhachHangHandlersReady = true;
}

async function themKhachHangMoi() {
  var payload = collectThemKhachHangPayload();
  var validation = validateThemKhachHang(payload);
  clearThemKhachHangErrors();

  if (!validation.valid) {
    Object.keys(validation.errors).forEach(function(id) {
      setThemKhachHangFieldError(id, validation.errors[id]);
    });
    setThemKhachHangMessage('Vui lòng kiểm tra lại thông tin khách hàng.', 'err');
    return;
  }

  var submitButton = document.getElementById('kh-new-submit');
  setKhBusy(submitButton, true, 'Đang kiểm tra...');
  setThemKhachHangMessage('Đang kiểm tra số điện thoại trên Supabase...', 'inf');

  try {
    var existing = await sbGet(
      'khach_hang',
      'so_dien_thoai=eq.' + encodeURIComponent(payload.so_dien_thoai) + '&select=ma_kh&limit=1'
    );

    if (existing && existing.length) {
      setThemKhachHangFieldError('kh-new-phone', 'Số điện thoại này đã tồn tại.');
      setThemKhachHangMessage('Số điện thoại này đã tồn tại.', 'err');
      return;
    }

    setKhBusy(submitButton, true, 'Đang lưu...');
    var created = await insertThemKhachHangWithRetry(payload, 3);
    var maKh = created && created.ma_kh ? created.ma_kh : payload.ma_kh;

    document.getElementById('kh-new-form').reset();
    document.getElementById('kh-new-code').value = maKh;
    setThemKhachHangMessage('Thêm khách hàng thành công. Mã khách hàng: ' + maKh, 'ok');
    showToast('Thêm khách hàng thành công', 'ok');
    khachHangPage = 1;
    khachHangKeyword = '';
  } catch (error) {
    console.error(error);
    var message = getThemKhachHangErrorMessage(error);
    if (message === 'Số điện thoại này đã tồn tại.') {
      setThemKhachHangFieldError('kh-new-phone', message);
    } else if (message === 'Email này đã được sử dụng.') {
      setThemKhachHangFieldError('kh-new-email', message);
    }
    setThemKhachHangMessage(message, 'err');
    showToast(message, 'err');
  } finally {
    setKhBusy(submitButton, false, 'Thêm khách hàng');
  }
}

async function insertThemKhachHangWithRetry(payload, attemptsLeft) {
  if (!payload.ma_kh) payload.ma_kh = generateThemKhachHangCode();
  document.getElementById('kh-new-code').value = payload.ma_kh;

  try {
    var rows = await sbInsert('khach_hang', payload);
    return rows && rows.length ? rows[0] : payload;
  } catch (error) {
    var raw = error && error.message ? error.message.toLowerCase() : '';
    var duplicatedCode = raw.indexOf('duplicate') >= 0 &&
      (raw.indexOf('ma_kh') >= 0 || raw.indexOf('khach_hang_pkey') >= 0);
    if (duplicatedCode && attemptsLeft > 1) {
      payload.ma_kh = generateThemKhachHangCode();
      return insertThemKhachHangWithRetry(payload, attemptsLeft - 1);
    }
    throw error;
  }
}

function collectThemKhachHangPayload() {
  return {
    ma_kh: document.getElementById('kh-new-code').value,
    ho_ten: document.getElementById('kh-new-name').value.trim(),
    so_dien_thoai: document.getElementById('kh-new-phone').value.trim(),
    email: document.getElementById('kh-new-email').value.trim() || null,
    mat_khau_hash: document.getElementById('kh-new-password').value,
    ngay_sinh: document.getElementById('kh-new-birthday').value || null,
    gioi_tinh: document.getElementById('kh-new-gender').value || null,
    dia_chi: document.getElementById('kh-new-address').value.trim() || null,
    trang_thai: 'hoat_dong'
  };
}

function validateThemKhachHang(payload) {
  var errors = {};
  if (!payload.ho_ten) errors['kh-new-name'] = 'Vui lòng nhập họ tên.';
  if (!payload.so_dien_thoai) {
    errors['kh-new-phone'] = 'Vui lòng nhập số điện thoại.';
  } else if (!/^\d{8,15}$/.test(payload.so_dien_thoai)) {
    errors['kh-new-phone'] = 'Số điện thoại phải gồm 8 đến 15 chữ số.';
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors['kh-new-email'] = 'Email không đúng định dạng.';
  }
  if (!payload.mat_khau_hash || payload.mat_khau_hash.length < 6) {
    errors['kh-new-password'] = 'Mật khẩu tạm phải có ít nhất 6 ký tự.';
  }
  if (payload.ngay_sinh && payload.ngay_sinh > new Date().toISOString().slice(0, 10)) {
    errors['kh-new-birthday'] = 'Ngày sinh không được ở tương lai.';
  }
  return { valid: Object.keys(errors).length === 0, errors: errors };
}

function resetThemKhachHangForm(showMessage) {
  var form = document.getElementById('kh-new-form');
  if (!form) return;
  form.reset();
  clearThemKhachHangErrors();
  document.getElementById('kh-new-code').value = generateThemKhachHangCode();
  if (showMessage) setThemKhachHangMessage('Đã xóa thông tin vừa nhập.', 'inf');
}

function generateThemKhachHangCode() {
  return 'KH' + Date.now().toString().slice(-5) + Math.random().toString(36).slice(2, 4).toUpperCase();
}

function clearThemKhachHangErrors() {
  ['kh-new-name', 'kh-new-phone', 'kh-new-email', 'kh-new-password', 'kh-new-birthday'].forEach(function(id) {
    setThemKhachHangFieldError(id, '');
  });
}

function setThemKhachHangFieldError(id, message) {
  var input = document.getElementById(id);
  var error = document.getElementById(id + '-error');
  if (input) input.classList.toggle('kh-new-input-invalid', Boolean(message));
  if (error) error.textContent = message || '';
}

function setThemKhachHangMessage(message, type) {
  var element = document.getElementById('kh-new-message');
  if (!element) return;
  element.className = 'kh-new-message ' + (type || 'inf');
  element.textContent = message;
}

function getThemKhachHangErrorMessage(error) {
  var raw = error && error.message ? error.message.toLowerCase() : '';
  if (raw.indexOf('so_dien_thoai') >= 0 || raw.indexOf('phone') >= 0) {
    return 'Số điện thoại này đã tồn tại.';
  }
  if (raw.indexOf('email') >= 0 && raw.indexOf('duplicate') >= 0) {
    return 'Email này đã được sử dụng.';
  }
  return 'Không thể thêm khách hàng. Vui lòng thử lại.';
}

function initKhachHangPage() {
  renderKhachHangMarkup();
  bindKhachHangEvents();
  loadDanhSachKhachHang();
}

function renderKhachHangMarkup() {
  var pageEl = document.getElementById('page-khach_hang');
  if (!pageEl || document.getElementById('kh-search-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Quản lý khách hàng</div>' +
        '<div class="psub">UC-1 · Tìm kiếm, xem và cập nhật hồ sơ khách hàng tại quầy</div>' +
      '</div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-h"><span class="panel-t">Danh sách khách hàng</span></div>' +
      '<div class="kh-panel-body">' +
        '<form class="kh-search" id="kh-search-form">' +
          '<div class="fg kh-search-field">' +
            '<label class="fl" for="kh-keyword">SĐT hoặc mã KH</label>' +
            '<input class="fi" id="kh-keyword" type="text" placeholder="0912001003 hoặc KH00003" autocomplete="off"/>' +
          '</div>' +
          '<button class="btn btn-primary" id="btn-kh-search" type="submit">Tìm</button>' +
          '<button class="btn btn-outline" id="btn-kh-clear" type="button">Xóa lọc</button>' +
        '</form>' +
        '<div class="kh-hint" id="kh-search-message">Đang tải danh sách khách hàng...</div>' +
      '</div>' +
      '<div class="kh-table-wrap">' +
        '<table class="tbl kh-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Mã KH</th>' +
              '<th>Khách hàng</th>' +
              '<th>Số điện thoại</th>' +
              '<th>Email</th>' +
              '<th>Thao tác</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="kh-table-body">' +
            '<tr><td colspan="5" class="kh-empty">Đang tải...</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="kh-pagination">' +
        '<button class="btn btn-outline btn-sm" id="btn-kh-prev" type="button">Trước</button>' +
        '<span id="kh-page-info">Trang 1</span>' +
        '<button class="btn btn-outline btn-sm" id="btn-kh-next" type="button">Sau</button>' +
      '</div>' +
    '</div>' +
    '<div class="kh-detail-overlay" id="kh-detail-overlay" style="display:none;">' +
    '<div class="panel kh-detail-panel" id="kh-detail-panel">' +
      '<div class="panel-h">' +
        '<span class="panel-t" id="kh-detail-title">Thông tin khách hàng</span>' +
      '</div>' +
      '<form id="kh-edit-form" class="kh-form">' +
        '<div class="kh-current-card">' +
          '<div>' +
            '<div class="kh-customer-name" id="kh-current-name">Khách hàng</div>' +
            '<div class="cid" id="kh-current-meta">Mã KH · SĐT</div>' +
          '</div>' +
          '<div class="kh-updated" id="kh-current-updated">Dữ liệu vừa truy vấn</div>' +
        '</div>' +
        '<div class="fgrid">' +
          '<div class="fg">' +
            '<label class="fl" for="kh-ma">Mã khách hàng</label>' +
            '<input class="fi" id="kh-ma" type="text" disabled/>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-sdt">Số điện thoại</label>' +
            '<input class="fi" id="kh-sdt" type="tel" disabled/>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-hoten">Họ tên <span class="req">*</span></label>' +
            '<input class="fi kh-editable" id="kh-hoten" type="text" placeholder="Họ tên khách hàng"/>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-email">Email</label>' +
            '<input class="fi kh-editable" id="kh-email" type="email" placeholder="email@example.com"/>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-ngaysinh">Ngày sinh</label>' +
            '<input class="fi kh-editable" id="kh-ngaysinh" type="date"/>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="kh-gioitinh">Giới tính</label>' +
            '<select class="fi kh-editable" id="kh-gioitinh">' +
              '<option value="">Chưa cập nhật</option>' +
              '<option value="Nam">Nam</option>' +
              '<option value="Nu">Nữ</option>' +
              '<option value="Khac">Khác</option>' +
            '</select>' +
          '</div>' +
          '<div class="fg ffull">' +
            '<label class="fl" for="kh-diachi">Địa chỉ</label>' +
            '<textarea class="fi kh-editable" id="kh-diachi" rows="3" placeholder="Địa chỉ liên hệ"></textarea>' +
          '</div>' +
        '</div>' +
        '<div class="mf kh-actions">' +
          '<button class="btn btn-outline" id="btn-kh-close" type="button">Đóng</button>' +
          '<button class="btn btn-outline" id="btn-kh-reset" type="button">Khôi phục dữ liệu</button>' +
          '<button class="btn btn-primary" id="btn-kh-save" type="submit">Lưu thay đổi</button>' +
        '</div>' +
      '</form>' +
    '</div>' +
    '</div>';
}

function bindKhachHangEvents() {
  if (khachHangHandlersReady) return;

  document.getElementById('kh-search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    khachHangKeyword = getValue('kh-keyword');
    khachHangPage = 1;
    hideKhDetail();
    loadDanhSachKhachHang();
  });

  document.getElementById('btn-kh-clear').addEventListener('click', function() {
    setValue('kh-keyword', '');
    khachHangKeyword = '';
    khachHangPage = 1;
    hideKhDetail();
    loadDanhSachKhachHang();
  });

  document.getElementById('btn-kh-prev').addEventListener('click', function() {
    if (khachHangPage <= 1) return;
    khachHangPage -= 1;
    hideKhDetail();
    loadDanhSachKhachHang();
  });

  document.getElementById('btn-kh-next').addEventListener('click', function() {
    khachHangPage += 1;
    hideKhDetail();
    loadDanhSachKhachHang();
  });

  document.getElementById('kh-table-body').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-kh-action]');
    if (!btn) return;
    var kh = findKhachHangInRows(btn.dataset.maKh);
    if (!kh) return;
    if (btn.dataset.khAction === 'delete') {
      xoaMemKhachHang(kh);
      return;
    }
    showKhDetail(kh, btn.dataset.khAction);
  });

  document.getElementById('kh-edit-form').addEventListener('submit', function(e) {
    e.preventDefault();
    luuThongTinKhachHang();
  });

  document.getElementById('btn-kh-reset').addEventListener('click', function() {
    if (khachHangDangSua) fillKhachHangForm(khachHangDangSua);
  });

  document.getElementById('btn-kh-close').addEventListener('click', hideKhDetail);

  document.getElementById('kh-detail-overlay').addEventListener('click', function(e) {
    if (e.target === this) hideKhDetail();
  });

  khachHangHandlersReady = true;
}

async function loadDanhSachKhachHang() {
  var tbody = document.getElementById('kh-table-body');
  var prevBtn = document.getElementById('btn-kh-prev');
  var nextBtn = document.getElementById('btn-kh-next');

  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="kh-empty">Đang tải dữ liệu...</td></tr>';
  setKhMessage('Đang tải danh sách khách hàng từ Supabase...', 'inf');
  setKhBusy(prevBtn, true, 'Trước');
  setKhBusy(nextBtn, true, 'Sau');

  try {
    var offset = (khachHangPage - 1) * khachHangPageSize;
    var params = buildKhListParams(khachHangKeyword, khachHangPageSize + 1, offset);
    var data = await sbGet('khach_hang', params);
    var hasNextPage = data && data.length > khachHangPageSize;

    khachHangRows = (data || []).slice(0, khachHangPageSize);
    renderKhTable(khachHangRows);
    updateKhPagination(hasNextPage);

    if (!khachHangRows.length) {
      setKhMessage('Không tìm thấy khách hàng phù hợp.', 'err');
    } else if (khachHangKeyword) {
      setKhMessage('Đã lọc danh sách theo "' + khachHangKeyword + '".', 'ok');
    } else {
      setKhMessage('Đã tải danh sách khách hàng.', 'ok');
    }
  } catch (err) {
    console.error(err);
    khachHangRows = [];
    tbody.innerHTML = '<tr><td colspan="5" class="kh-empty">Không thể tải danh sách khách hàng.</td></tr>';
    setKhMessage('Không thể tải danh sách khách hàng.', 'err');
    showToast('Lỗi tải danh sách khách hàng', 'err');
    updateKhPagination(false);
  }
}

function buildKhListParams(keyword, limit, offset) {
  var params = 'trang_thai=neq.da_xoa' +
    '&select=ma_kh,ho_ten,ngay_sinh,gioi_tinh,so_dien_thoai,email,dia_chi,ngay_dang_ky,updated_at' +
    '&order=ma_kh.asc' +
    '&limit=' + limit +
    '&offset=' + offset;

  var kw = (keyword || '').trim();
  if (!kw) return params;

  var normalized = kw.toUpperCase();
  if (normalized.indexOf('KH') === 0) {
    return 'ma_kh=ilike.*' + encodeURIComponent(normalized) + '*&' + params;
  }
  return 'so_dien_thoai=like.*' + encodeURIComponent(kw.replace(/\s+/g, '')) + '*&' + params;
}

function renderKhTable(rows) {
  var tbody = document.getElementById('kh-table-body');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="kh-empty">Không có khách hàng để hiển thị.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function(kh) {
    return '<tr>' +
      '<td><strong>' + escKh(kh.ma_kh || '') + '</strong></td>' +
      '<td><div class="cname">' + escKh(kh.ho_ten || '') + '</div><div class="cid">' + escKh(formatKhDate(kh.ngay_dang_ky)) + '</div></td>' +
      '<td>' + escKh(kh.so_dien_thoai || '') + '</td>' +
      '<td>' + escKh(kh.email || '-') + '</td>' +
      '<td>' +
        '<div class="kh-row-actions">' +
          '<button class="btn btn-outline btn-sm" type="button" data-kh-action="view" data-ma-kh="' + escAttr(kh.ma_kh || '') + '">Xem</button>' +
          '<button class="btn btn-yellow btn-sm" type="button" data-kh-action="edit" data-ma-kh="' + escAttr(kh.ma_kh || '') + '">Sửa</button>' +
          '<button class="btn btn-danger btn-sm" type="button" data-kh-action="delete" data-ma-kh="' + escAttr(kh.ma_kh || '') + '">Xóa</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function updateKhPagination(hasNextPage) {
  var info = document.getElementById('kh-page-info');
  var prevBtn = document.getElementById('btn-kh-prev');
  var nextBtn = document.getElementById('btn-kh-next');

  if (info) info.textContent = 'Trang ' + khachHangPage;
  if (prevBtn) prevBtn.disabled = khachHangPage <= 1;
  if (nextBtn) nextBtn.disabled = !hasNextPage;
}

function showKhDetail(kh, mode) {
  khachHangDangSua = kh;
  khachHangMode = mode === 'edit' ? 'edit' : 'view';
  fillKhachHangForm(kh);
  setKhDetailMode(khachHangMode);

  var overlay = document.getElementById('kh-detail-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    document.body.classList.add('kh-modal-open');
  }
}

function hideKhDetail() {
  var overlay = document.getElementById('kh-detail-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('kh-modal-open');
  khachHangDangSua = null;
}

function fillKhachHangForm(kh) {
  setValue('kh-ma', kh.ma_kh || '');
  setValue('kh-sdt', kh.so_dien_thoai || '');
  setValue('kh-hoten', kh.ho_ten || '');
  setValue('kh-email', kh.email || '');
  setValue('kh-ngaysinh', toDateInput(kh.ngay_sinh));
  setValue('kh-gioitinh', kh.gioi_tinh || '');
  setValue('kh-diachi', kh.dia_chi || '');

  var nameEl = document.getElementById('kh-current-name');
  var metaEl = document.getElementById('kh-current-meta');
  var updatedEl = document.getElementById('kh-current-updated');

  if (nameEl) nameEl.textContent = kh.ho_ten || 'Khách hàng';
  if (metaEl) metaEl.textContent = (kh.ma_kh || '-') + ' · ' + (kh.so_dien_thoai || '-');
  if (updatedEl) updatedEl.textContent = 'Cập nhật cuối: ' + formatKhDateTime(kh.updated_at || kh.ngay_dang_ky);

}

function setKhDetailMode(mode) {
  var isEdit = mode === 'edit';
  var title = document.getElementById('kh-detail-title');
  var saveBtn = document.getElementById('btn-kh-save');
  var resetBtn = document.getElementById('btn-kh-reset');

  if (title) title.textContent = isEdit ? 'Sửa thông tin khách hàng' : 'Chi tiết khách hàng';
  document.querySelectorAll('.kh-editable').forEach(function(el) {
    el.disabled = !isEdit;
  });

  if (saveBtn) saveBtn.style.display = isEdit ? '' : 'none';
  if (resetBtn) resetBtn.style.display = isEdit ? '' : 'none';
}

async function luuThongTinKhachHang() {
  if (khachHangMode !== 'edit') return;
  if (!khachHangDangSua || !khachHangDangSua.ma_kh) {
    showToast('Vui lòng chọn khách hàng trước khi lưu', 'err');
    return;
  }

  var saveBtn = document.getElementById('btn-kh-save');
  var body = collectKhPayload();

  if (!body.ho_ten) {
    showToast('Họ tên không được để trống', 'err');
    return;
  }

  setKhBusy(saveBtn, true, 'Đang lưu...');

  try {
    var updated = await sbUpdate(
      'khach_hang',
      'ma_kh=eq.' + encodeURIComponent(khachHangDangSua.ma_kh),
      body
    );

    khachHangDangSua = updated && updated.length ? updated[0] : Object.assign({}, khachHangDangSua, body);
    fillKhachHangForm(khachHangDangSua);
    setKhDetailMode('edit');
    setKhMessage('Thông tin khách hàng đã được cập nhật.', 'ok');
    showToast('Lưu thông tin khách hàng thành công', 'ok');
    loadDanhSachKhachHang();
  } catch (err) {
    console.error(err);
    var msg = getKhSaveErrorMessage(err);
    setKhMessage(msg, 'err');
    showToast(msg, 'err');
  } finally {
    setKhBusy(saveBtn, false, 'Lưu thay đổi');
  }
}

async function xoaMemKhachHang(kh) {
  var dongY = window.confirm(
    'Xóa khách hàng ' + (kh.ho_ten || kh.ma_kh) + '?\n' +
    'Dữ liệu vẫn được lưu trong cơ sở dữ liệu.'
  );
  if (!dongY) return;

  try {
    await sbUpdate(
      'khach_hang',
      'ma_kh=eq.' + encodeURIComponent(kh.ma_kh),
      { trang_thai: 'da_xoa' }
    );

    hideKhDetail();
    showToast('Đã xóa khách hàng khỏi danh sách', 'ok');
    await loadDanhSachKhachHang();

    if (!khachHangRows.length && khachHangPage > 1) {
      khachHangPage -= 1;
      await loadDanhSachKhachHang();
    }
  } catch (err) {
    console.error(err);
    showToast('Không thể xóa khách hàng', 'err');
  }
}

function collectKhPayload() {
  return {
    ho_ten: getValue('kh-hoten'),
    email: getValue('kh-email') || null,
    ngay_sinh: getValue('kh-ngaysinh') || null,
    gioi_tinh: getValue('kh-gioitinh') || null,
    dia_chi: getValue('kh-diachi') || null
  };
}

function findKhachHangInRows(maKh) {
  return khachHangRows.find(function(kh) {
    return kh.ma_kh === maKh;
  });
}

function setKhMessage(message, type) {
  var el = document.getElementById('kh-search-message');
  if (!el) return;
  el.className = 'kh-hint ' + (type || '');
  el.textContent = message;
}

function setKhBusy(btn, busy, text) {
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = text;
}

function setValue(id, value) {
  var el = document.getElementById(id);
  if (el) el.value = value;
}

function getValue(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function formatKhDate(value) {
  if (!value) return '';
  var d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return 'Đăng ký: ' + d.toLocaleDateString('vi-VN');
}

function formatKhDateTime(value) {
  if (!value) return 'chưa có';
  var d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getKhSaveErrorMessage(err) {
  var raw = err && err.message ? err.message : '';
  if (raw.indexOf('email') >= 0) return 'Email đã được dùng cho khách hàng khác.';
  return 'Không thể lưu thông tin khách hàng.';
}

function escKh(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(value) {
  return escKh(value);
}
