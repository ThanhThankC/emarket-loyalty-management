// pages/lich_su_ho.js
var lsPage = 1;
var lsPageSize = 20;
var lsHasNextPage = false;
var lsLastFilters = null;
var lsHandlersReady = false;
var lsSearchSequence = 0;

registerPage('lich_su_ho', function() {
  renderLichSuMuaHangMarkup();
  bindLichSuMuaHangEvents();
});

function renderLichSuMuaHangMarkup() {
  var pageEl = document.getElementById('page-lich_su_ho');
  if (!pageEl || document.getElementById('ls-search-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Tra cứu lịch sử mua hàng</div>' +
        '<div class="psub">Tìm đơn hàng của khách hàng tại quầy POS</div>' +
      '</div>' +
    '</div>' +
    '<div class="panel ls-filter-panel">' +
      '<div class="panel-h"><span class="panel-t">Điều kiện tra cứu</span></div>' +
      '<form class="ls-search-form" id="ls-search-form" novalidate>' +
        '<div class="ls-filter-grid">' +
          '<div class="fg">' +
            '<label class="fl" for="ls-phone">Số điện thoại</label>' +
            '<input class="fi" id="ls-phone" type="tel" inputmode="numeric" maxlength="15" placeholder="0912001003" autocomplete="off"/>' +
            '<div class="ls-field-error" id="ls-phone-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="ls-customer-code">Mã khách hàng</label>' +
            '<input class="fi" id="ls-customer-code" type="text" maxlength="10" placeholder="KH00001" autocomplete="off"/>' +
            '<div class="ls-field-error" id="ls-customer-code-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="ls-order-code">Mã đơn hàng</label>' +
            '<input class="fi" id="ls-order-code" type="text" maxlength="15" placeholder="DH2025001" autocomplete="off"/>' +
            '<div class="ls-field-error" id="ls-order-code-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="ls-date-from">Từ ngày</label>' +
            '<input class="fi" id="ls-date-from" type="date"/>' +
            '<div class="ls-field-error" id="ls-date-from-error"></div>' +
          '</div>' +
          '<div class="fg">' +
            '<label class="fl" for="ls-date-to">Đến ngày</label>' +
            '<input class="fi" id="ls-date-to" type="date"/>' +
            '<div class="ls-field-error" id="ls-date-to-error"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ls-filter-actions">' +
          '<button class="btn btn-primary" id="ls-search-button" type="submit">Tra cứu</button>' +
          '<button class="btn btn-outline" id="ls-clear-button" type="button">Xóa điều kiện</button>' +
        '</div>' +
      '</form>' +
    '</div>' +
    '<div class="panel ls-result-panel">' +
      '<div class="panel-h">' +
        '<span class="panel-t">Danh sách đơn hàng</span>' +
        '<span class="ls-result-summary" id="ls-result-summary">Chưa thực hiện tra cứu</span>' +
      '</div>' +
      '<div class="ls-message inf" id="ls-message">Nhập ít nhất một điều kiện để tra cứu.</div>' +
      '<div class="ls-table-wrap">' +
        '<table class="tbl ls-table">' +
          '<thead><tr>' +
            '<th>Mã đơn</th><th>Khách hàng</th><th>Ngày mua</th><th>Tổng tiền</th>' +
            '<th>Điểm dùng</th><th>Điểm cộng</th><th>Trạng thái</th>' +
          '</tr></thead>' +
          '<tbody id="ls-table-body"><tr><td colspan="7" class="ls-empty">Chưa có dữ liệu tra cứu.</td></tr></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="ls-pagination">' +
        '<span>Mỗi trang 20 đơn</span>' +
        '<div class="ls-pagination-controls">' +
          '<button class="btn btn-outline btn-sm" id="ls-prev-button" type="button" disabled>Trước</button>' +
          '<span id="ls-page-info">Trang 1</span>' +
          '<button class="btn btn-outline btn-sm" id="ls-next-button" type="button" disabled>Sau</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function bindLichSuMuaHangEvents() {
  if (lsHandlersReady) return;

  document.getElementById('ls-phone').addEventListener('input', function() {
    var originalValue = this.value;
    var numericValue = originalValue.replace(/\D/g, '');
    this.value = numericValue;
    setLsFieldError(
      'ls-phone',
      originalValue !== numericValue ? 'Chỉ được nhập số.' : ''
    );
  });

  ['ls-customer-code', 'ls-order-code'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setLsFieldError(id, '');
    });
  });

  document.getElementById('ls-search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    lsPage = 1;
    traCuuLichSuMuaHang(false);
  });

  document.getElementById('ls-clear-button').addEventListener('click', function() {
    document.getElementById('ls-search-form').reset();
    clearLsErrors();
    lsPage = 1;
    lsLastFilters = null;
    lsHasNextPage = false;
    renderLsRows([]);
    updateLsPagination();
    setLsMessage('Nhập ít nhất một điều kiện để tra cứu.', 'inf');
    setLsSummary('Chưa thực hiện tra cứu');
  });

  document.getElementById('ls-prev-button').addEventListener('click', function() {
    if (lsPage <= 1 || !lsLastFilters) return;
    lsPage -= 1;
    traCuuLichSuMuaHang(true);
  });

  document.getElementById('ls-next-button').addEventListener('click', function() {
    if (!lsHasNextPage || !lsLastFilters) return;
    lsPage += 1;
    traCuuLichSuMuaHang(true);
  });

  lsHandlersReady = true;
}

async function traCuuLichSuMuaHang(useLastFilters) {
  var filters = useLastFilters ? lsLastFilters : collectLsFilters();
  var validation = validateLsFilters(filters);
  var startedAt = Date.now();
  var sequence = ++lsSearchSequence;

  clearLsErrors();
  if (!validation.valid) {
    showLsValidation(validation);
    setLsMessage(validation.message, 'err');
    setLsSummary('Điều kiện không hợp lệ');
    return;
  }

  lsLastFilters = filters;
  setLsBusy(true);
  setLsMessage('Đang tra cứu đơn hàng...', 'inf');
  setLsSummary('Đang tải dữ liệu');

  try {
    var rows = await fetchLsOrders(filters, lsPage);
    if (sequence !== lsSearchSequence) return;

    lsHasNextPage = rows.length > lsPageSize;
    rows = rows.slice(0, lsPageSize);
    renderLsRows(rows);
    updateLsPagination();

    var elapsed = Date.now() - startedAt;
    if (!rows.length) {
      setLsMessage('Không có đơn hàng phù hợp.', 'wrn');
      setLsSummary('Không tìm thấy kết quả');
    } else {
      setLsMessage('Tra cứu hoàn tất trong ' + elapsed + ' ms.', 'ok');
      setLsSummary(rows.length + ' đơn hàng trên trang ' + lsPage);
    }
  } catch (error) {
    if (sequence !== lsSearchSequence) return;
    console.error(error);
    lsHasNextPage = false;
    renderLsRows([]);
    updateLsPagination();

    var isTimeout = error && error.name === 'AbortError';
    var message = isTimeout
      ? 'Tra cứu quá thời gian phản hồi 3 giây. Vui lòng thử lại.'
      : 'Không thể tra cứu đơn hàng. Vui lòng thử lại.';
    setLsMessage(message, 'err');
    setLsSummary(isTimeout ? 'Quá thời gian phản hồi' : 'Tra cứu thất bại');
    showToast(message, 'err');
  } finally {
    if (sequence === lsSearchSequence) setLsBusy(false);
  }
}

function collectLsFilters() {
  return {
    so_dien_thoai: getLsValue('ls-phone'),
    ma_kh: getLsValue('ls-customer-code').toUpperCase(),
    ma_don_hang: getLsValue('ls-order-code').toUpperCase(),
    tu_ngay: getLsValue('ls-date-from'),
    den_ngay: getLsValue('ls-date-to')
  };
}

function validateLsFilters(filters) {
  var errors = {};
  if (!filters.so_dien_thoai && !filters.ma_kh && !filters.ma_don_hang && !filters.tu_ngay && !filters.den_ngay) {
    return { valid: false, errors: errors, message: 'Vui lòng nhập ít nhất một điều kiện tra cứu.' };
  }
  if (filters.so_dien_thoai && !/^\d{8,15}$/.test(filters.so_dien_thoai)) {
    errors['ls-phone'] = 'Số điện thoại phải gồm 8 đến 15 chữ số.';
  }
  if (filters.ma_kh && !/^[A-Z0-9-]{2,10}$/.test(filters.ma_kh)) {
    errors['ls-customer-code'] = 'Mã KH chỉ gồm chữ, số hoặc dấu gạch ngang.';
  }
  if (filters.ma_don_hang && !/^[A-Z0-9-]{2,15}$/.test(filters.ma_don_hang)) {
    errors['ls-order-code'] = 'Mã đơn chỉ gồm chữ, số hoặc dấu gạch ngang.';
  }
  if (filters.tu_ngay && filters.den_ngay && filters.tu_ngay > filters.den_ngay) {
    errors['ls-date-from'] = 'Từ ngày không được sau đến ngày.';
    errors['ls-date-to'] = 'Đến ngày không được trước từ ngày.';
  }

  var valid = Object.keys(errors).length === 0;
  return { valid: valid, errors: errors, message: valid ? '' : 'Vui lòng kiểm tra lại điều kiện tra cứu.' };
}

async function fetchLsOrders(filters, page) {
  var offset = (page - 1) * lsPageSize;
  var params = [
    'select=ma_don_hang,ma_kh,ngay_mua,tong_tien,diem_da_dung,diem_duoc_cong,trang_thai,khach_hang!inner(ho_ten,so_dien_thoai)',
    'order=ngay_mua.desc',
    'limit=' + (lsPageSize + 1),
    'offset=' + offset
  ];

  if (filters.so_dien_thoai) params.push('khach_hang.so_dien_thoai=eq.' + encodeURIComponent(filters.so_dien_thoai));
  if (filters.ma_kh) params.push('ma_kh=eq.' + encodeURIComponent(filters.ma_kh));
  if (filters.ma_don_hang) params.push('ma_don_hang=eq.' + encodeURIComponent(filters.ma_don_hang));
  if (filters.tu_ngay) params.push('ngay_mua=gte.' + encodeURIComponent(filters.tu_ngay + 'T00:00:00+07:00'));
  if (filters.den_ngay) params.push('ngay_mua=lt.' + encodeURIComponent(nextLsDate(filters.den_ngay) + 'T00:00:00+07:00'));

  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 3000);
  try {
    var response = await fetch(SUPABASE_URL + '/rest/v1/don_hang?' + params.join('&'), {
      headers: SB_HEADERS,
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Tra cứu đơn hàng lỗi ' + response.status + ': ' + await response.text());
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function renderLsRows(rows) {
  var tbody = document.getElementById('ls-table-body');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="ls-empty">Không có đơn hàng phù hợp.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function(order) {
    var customer = order.khach_hang || {};
    return '<tr>' +
      '<td><strong>' + escLs(order.ma_don_hang) + '</strong></td>' +
      '<td><div class="cname">' + escLs(customer.ho_ten || '-') + '</div>' +
        '<div class="cid">' + escLs(order.ma_kh) + ' · ' + escLs(customer.so_dien_thoai || '-') + '</div></td>' +
      '<td>' + escLs(formatLsDateTime(order.ngay_mua)) + '</td>' +
      '<td class="ls-money">' + escLs(formatLsMoney(order.tong_tien)) + '</td>' +
      '<td>' + escLs(formatLsNumber(order.diem_da_dung)) + '</td>' +
      '<td>' + escLs(formatLsNumber(order.diem_duoc_cong)) + '</td>' +
      '<td><span class="ls-status ' + escLs(statusLsClass(order.trang_thai)) + '">' + escLs(statusLsLabel(order.trang_thai)) + '</span></td>' +
    '</tr>';
  }).join('');
}

function updateLsPagination() {
  var prev = document.getElementById('ls-prev-button');
  var next = document.getElementById('ls-next-button');
  var info = document.getElementById('ls-page-info');
  if (prev) prev.disabled = lsPage <= 1;
  if (next) next.disabled = !lsHasNextPage;
  if (info) info.textContent = 'Trang ' + lsPage;
}

function setLsBusy(busy) {
  var button = document.getElementById('ls-search-button');
  if (button) {
    button.disabled = busy;
    button.textContent = busy ? 'Đang tra cứu...' : 'Tra cứu';
  }
  var prev = document.getElementById('ls-prev-button');
  var next = document.getElementById('ls-next-button');
  if (busy) {
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
  } else {
    updateLsPagination();
  }
}

function showLsValidation(validation) {
  Object.keys(validation.errors || {}).forEach(function(id) {
    setLsFieldError(id, validation.errors[id]);
  });
}

function clearLsErrors() {
  ['ls-phone', 'ls-customer-code', 'ls-order-code', 'ls-date-from', 'ls-date-to'].forEach(function(id) {
    setLsFieldError(id, '');
  });
}

function setLsFieldError(id, message) {
  var input = document.getElementById(id);
  var error = document.getElementById(id + '-error');
  if (input) input.classList.toggle('ls-input-invalid', Boolean(message));
  if (error) error.textContent = message || '';
}

function setLsMessage(message, type) {
  var el = document.getElementById('ls-message');
  if (!el) return;
  el.className = 'ls-message ' + (type || 'inf');
  el.textContent = message;
}

function setLsSummary(message) {
  var el = document.getElementById('ls-result-summary');
  if (el) el.textContent = message;
}

function getLsValue(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function nextLsDate(dateValue) {
  var parts = dateValue.split('-').map(Number);
  var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
  return date.toISOString().slice(0, 10);
}

function formatLsDateTime(value) {
  var date = new Date(value);
  if (isNaN(date.getTime())) return value || '-';
  return date.toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function formatLsMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function formatLsNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function statusLsLabel(status) {
  return {
    hoan_thanh: 'Hoàn thành',
    da_huy: 'Đã hủy',
    dang_xu_ly: 'Đang xử lý',
    da_doi_tra: 'Đã đổi trả'
  }[status] || status || '-';
}

function statusLsClass(status) {
  return {
    hoan_thanh: 'ls-status-success',
    da_huy: 'ls-status-danger',
    dang_xu_ly: 'ls-status-pending',
    da_doi_tra: 'ls-status-returned'
  }[status] || 'ls-status-neutral';
}

function escLs(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
