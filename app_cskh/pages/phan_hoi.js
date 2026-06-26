// pages/phan_hoi.js
var phanHoiCustomer = null;
var phanHoiRows = [];
var phanHoiHandlersReady = false;
var phanHoiNvCache = {};

registerPage('phan_hoi', function() {
  renderPhanHoiMarkup();
  bindPhanHoiEvents();
  resetPhanHoiForm(false);
  loadPhanHoiList();
});

function renderPhanHoiMarkup() {
  var pageEl = document.getElementById('page-phan_hoi');
  if (!pageEl || document.getElementById('phan_hoi-search-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Ghi nhận phản hồi và khiếu nại</div>' +
        '<div class="psub">Tìm khách hàng, lưu nội dung với trạng thái Ghi nhận và cập nhật kết quả sau xử lý</div>' +
      '</div>' +
      '<button class="btn btn-outline btn-sm" type="button" id="phan_hoi-refresh-button">Tải lại danh sách</button>' +
    '</div>' +
    '<div class="phan_hoi-layout">' +
      '<div>' +
        '<div class="panel">' +
          '<div class="panel-h"><span class="panel-t">Tìm khách hàng</span></div>' +
          '<form class="phan_hoi-search" id="phan_hoi-search-form" novalidate>' +
            '<div class="fg phan_hoi-search-field">' +
              '<label class="fl" for="phan_hoi-keyword">Số điện thoại hoặc mã KH <span class="req">*</span></label>' +
              '<input class="fi" id="phan_hoi-keyword" type="text" maxlength="20" placeholder="09xxxxxxxx hoặc KH00001" autocomplete="off"/>' +
              '<div class="phan_hoi-field-error" id="phan_hoi-keyword-error"></div>' +
            '</div>' +
            '<button class="btn btn-primary" id="phan_hoi-search-button" type="submit">Tìm KH</button>' +
            '<button class="btn btn-outline" id="phan_hoi-reset-button" type="button">Nhập lại</button>' +
          '</form>' +
          '<div class="phan_hoi-message inf" id="phan_hoi-message">Nhập SĐT hoặc mã KH để ghi nhận phản hồi.</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-h"><span class="panel-t">Thông tin khách hàng</span></div>' +
          '<div class="phan_hoi-empty" id="phan_hoi-customer-empty">Chưa chọn khách hàng.</div>' +
          '<div class="phan_hoi-customer" id="phan_hoi-customer" hidden>' +
            '<div>' +
              '<div class="phan_hoi-customer-name" id="phan_hoi-customer-name">Khách hàng</div>' +
              '<div class="cid" id="phan_hoi-customer-meta">Mã KH · SĐT</div>' +
            '</div>' +
            '<span class="badge b-open">Đã chọn</span>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-h"><span class="panel-t">Nội dung phản hồi</span></div>' +
          '<form class="phan_hoi-form" id="phan_hoi-form" novalidate>' +
            '<div class="fgrid">' +
              '<div class="fg">' +
                '<label class="fl" for="phan_hoi-type">Loại phản hồi</label>' +
                '<select class="fi" id="phan_hoi-type">' +
                  '<option value="khieu_nai">Khiếu nại</option>' +
                  '<option value="gop_y">Góp ý</option>' +
                  '<option value="yeu_cau_ho_tro">Yêu cầu hỗ trợ</option>' +
                  '<option value="doi_tra">Đổi / trả hàng</option>' +
                '</select>' +
              '</div>' +
              '<div class="fg">' +
                '<label class="fl" for="phan_hoi-priority">Mức ưu tiên</label>' +
                '<select class="fi" id="phan_hoi-priority">' +
                  '<option value="thuong">Thường</option>' +
                  '<option value="cao">Cao</option>' +
                  '<option value="thap">Thấp</option>' +
                '</select>' +
              '</div>' +
              '<div class="fg ffull">' +
                '<label class="fl" for="phan_hoi-order">Mã hóa đơn liên quan</label>' +
                '<input class="fi" id="phan_hoi-order" type="text" maxlength="15" placeholder="DH2025001" autocomplete="off"/>' +
                '<div class="phan_hoi-field-error" id="phan_hoi-order-error"></div>' +
              '</div>' +
              '<div class="fg ffull">' +
                '<label class="fl" for="phan_hoi-content">Nội dung phản hồi <span class="req">*</span></label>' +
                '<textarea class="fi" id="phan_hoi-content" rows="5" maxlength="800" placeholder="Nhập nội dung phản hồi hoặc khiếu nại của khách hàng"></textarea>' +
                '<div class="phan_hoi-field-error" id="phan_hoi-content-error"></div>' +
              '</div>' +
            '</div>' +
            '<div class="phan_hoi-actions">' +
              '<button class="btn btn-primary" id="phan_hoi-save-button" type="submit">Lưu ghi nhận</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="panel">' +
          '<div class="panel-h">' +
            '<span class="panel-t">Phản hồi gần đây</span>' +
            '<span class="panel-a" id="phan_hoi-list-count">0 yêu cầu</span>' +
          '</div>' +
          '<div class="phan_hoi-list-state" id="phan_hoi-list-loading">Đang tải dữ liệu...</div>' +
          '<div class="phan_hoi-list-state" id="phan_hoi-list-empty" hidden>Chưa có phản hồi nào.</div>' +
          '<div class="phan_hoi-list" id="phan_hoi-list" hidden></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-phan-hoi">' +
      '<div class="modal">' +
        '<div class="mh">' +
          '<div>' +
            '<div class="mt">Cập nhật kết quả xử lý</div>' +
            '<div class="cid" id="phan_hoi-resolution-sub"></div>' +
          '</div>' +
          '<button class="mc" type="button" onclick="closeModal(\'modal-phan-hoi\')">X</button>' +
        '</div>' +
        '<div class="phan_hoi-resolution">' +
          '<input id="phan_hoi-resolution-id" type="hidden"/>' +
          '<div class="fg">' +
            '<label class="fl" for="phan_hoi-resolution-result">Kết quả xử lý <span class="req">*</span></label>' +
            '<textarea class="fi" id="phan_hoi-resolution-result" rows="5" maxlength="800" placeholder="Nhập kết quả xử lý cho phản hồi này"></textarea>' +
            '<div class="phan_hoi-field-error" id="phan_hoi-resolution-error"></div>' +
          '</div>' +
        '</div>' +
        '<div class="mf">' +
          '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-phan-hoi\')">Hủy</button>' +
          '<button class="btn btn-primary" id="phan_hoi-resolution-button" type="button">Đã xử lý</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function bindPhanHoiEvents() {
  if (phanHoiHandlersReady) return;

  document.getElementById('phan_hoi-search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    searchPhanHoiCustomer();
  });

  document.getElementById('phan_hoi-form').addEventListener('submit', function(event) {
    event.preventDefault();
    savePhanHoi();
  });

  document.getElementById('phan_hoi-keyword').addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    clearPhanHoiFieldError('phan_hoi-keyword');
  });

  document.getElementById('phan_hoi-order').addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    clearPhanHoiFieldError('phan_hoi-order');
  });

  document.getElementById('phan_hoi-content').addEventListener('input', function() {
    clearPhanHoiFieldError('phan_hoi-content');
  });

  document.getElementById('phan_hoi-resolution-result').addEventListener('input', function() {
    clearPhanHoiFieldError('phan_hoi-resolution-result', 'phan_hoi-resolution-error');
  });

  document.getElementById('phan_hoi-reset-button').addEventListener('click', function() {
    resetPhanHoiForm(true);
  });

  document.getElementById('phan_hoi-refresh-button').addEventListener('click', loadPhanHoiList);
  document.getElementById('phan_hoi-resolution-button').addEventListener('click', updatePhanHoiResult);

  var modal = document.getElementById('modal-phan-hoi');
  if (modal) {
    modal.addEventListener('click', function(event) {
      if (event.target === modal) closeModal('modal-phan-hoi');
    });
  }

  phanHoiHandlersReady = true;
}

async function searchPhanHoiCustomer() {
  var keyword = getPhanHoiValue('phan_hoi-keyword').toUpperCase();
  if (!keyword) {
    setPhanHoiFieldError('phan_hoi-keyword', 'Vui lòng nhập SĐT hoặc mã KH.');
    setPhanHoiMessage('Vui lòng nhập thông tin để tìm khách hàng.', 'err');
    return;
  }

  setPhanHoiBusy('phan_hoi-search-button', true, 'Đang tìm...');
  setPhanHoiMessage('Đang tìm khách hàng...', 'inf');

  try {
    var rows = await sbGet(
      'khach_hang',
      'ma_kh=eq.' + encodeURIComponent(keyword) +
        '&select=ma_kh,ho_ten,so_dien_thoai,email,dia_chi&limit=1'
    );

    if (!rows || !rows.length) {
      rows = await sbGet(
        'khach_hang',
        'so_dien_thoai=eq.' + encodeURIComponent(keyword) +
          '&select=ma_kh,ho_ten,so_dien_thoai,email,dia_chi&limit=1'
      );
    }

    phanHoiCustomer = rows && rows.length ? rows[0] : null;
    renderPhanHoiCustomer();

    if (!phanHoiCustomer) {
      setPhanHoiFieldError('phan_hoi-keyword', 'Không tìm thấy khách hàng.');
      setPhanHoiMessage('Không tìm thấy khách hàng theo thông tin đã nhập.', 'err');
      return;
    }

    setPhanHoiMessage('Đã tìm thấy khách hàng. Vui lòng nhập nội dung phản hồi.', 'ok');
  } catch (error) {
    console.error(error);
    setPhanHoiMessage('Không thể tìm khách hàng. Vui lòng thử lại.', 'err');
    showToast('Lỗi tìm khách hàng', 'err');
  } finally {
    setPhanHoiBusy('phan_hoi-search-button', false, 'Tìm KH');
  }
}

async function savePhanHoi() {
  if (!phanHoiCustomer || !phanHoiCustomer.ma_kh) {
    setPhanHoiMessage('Vui lòng tìm và chọn khách hàng trước khi lưu phản hồi.', 'err');
    return;
  }

  var content = getPhanHoiValue('phan_hoi-content');
  if (!content) {
    setPhanHoiFieldError('phan_hoi-content', 'Vui lòng nhập nội dung phản hồi.');
    setPhanHoiMessage('Nội dung phản hồi là bắt buộc.', 'err');
    return;
  }

  var orderCode = getPhanHoiValue('phan_hoi-order').toUpperCase();
  clearPhanHoiFieldError('phan_hoi-order');

  setPhanHoiBusy('phan_hoi-save-button', true, 'Đang kiểm tra...');
  setPhanHoiMessage('Đang kiểm tra thông tin phản hồi...', 'inf');

  try {
    var orderValid = await validatePhanHoiOrder(orderCode);
    if (!orderValid.valid) {
      setPhanHoiFieldError('phan_hoi-order', orderValid.message);
      setPhanHoiMessage(orderValid.message, 'err');
      return;
    }
  } catch (error) {
    console.error(error);
    setPhanHoiMessage('Không thể kiểm tra mã hóa đơn. Vui lòng thử lại.', 'err');
    return;
  } finally {
    setPhanHoiBusy('phan_hoi-save-button', false, 'Lưu ghi nhận');
  }

  var maNvXuLy = await getPhanHoiCurrentNhanVienId(null);
  var payload = {
    ma_kh: phanHoiCustomer.ma_kh,
    ma_nv_xu_ly: maNvXuLy,
    loai: getPhanHoiValue('phan_hoi-type') || 'khieu_nai',
    noi_dung: content,
    trang_thai: 'moi',
    uu_tien: getPhanHoiValue('phan_hoi-priority') || 'thuong',
    ma_don_hang_lq: orderCode || null
  };

  setPhanHoiBusy('phan_hoi-save-button', true, 'Đang lưu...');
  setPhanHoiMessage('Đang lưu phản hồi...', 'inf');

  try {
    var created = await sbInsert('phan_hoi_khach_hang', payload);
    var saved = created && created.length ? created[0] : null;
    await insertPhanHoiSupportLog(saved, 'Ghi nhận phản hồi', 'Ghi nhận');

    document.getElementById('phan_hoi-content').value = '';
    document.getElementById('phan_hoi-order').value = '';
    setPhanHoiMessage('Đã lưu phản hồi với trạng thái Ghi nhận.', 'ok');
    showToast('Đã ghi nhận phản hồi', 'ok');
    loadPhanHoiList();
  } catch (error) {
    console.error(error);
    setPhanHoiMessage(getPhanHoiErrorMessage(error), 'err');
    showToast('Lưu phản hồi thất bại', 'err');
  } finally {
    setPhanHoiBusy('phan_hoi-save-button', false, 'Lưu ghi nhận');
  }
}

async function loadPhanHoiList() {
  var loading = document.getElementById('phan_hoi-list-loading');
  var empty = document.getElementById('phan_hoi-list-empty');
  var list = document.getElementById('phan_hoi-list');
  if (!loading || !empty || !list) return;

  loading.hidden = false;
  empty.hidden = true;
  list.hidden = true;
  list.innerHTML = '';

  try {
    phanHoiRows = await sbGet(
      'phan_hoi_khach_hang',
      'select=ma_phan_hoi,ma_kh,ma_nv_xu_ly,loai,noi_dung,trang_thai,uu_tien,thoi_gian_gui,thoi_gian_xu_ly,ket_qua_xu_ly,ma_don_hang_lq,khach_hang(ho_ten,so_dien_thoai,email)' +
        '&order=thoi_gian_gui.desc&limit=30'
    );
    renderPhanHoiList();
  } catch (error) {
    console.error(error);
    loading.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Không thể tải danh sách phản hồi.';
  }
}

async function validatePhanHoiOrder(orderCode) {
  if (!orderCode) return { valid: true };

  var rows = await sbGet(
    'don_hang',
    'ma_don_hang=eq.' + encodeURIComponent(orderCode) +
      '&select=ma_don_hang,ma_kh&limit=1'
  );
  var order = rows && rows.length ? rows[0] : null;

  if (!order) {
    return {
      valid: false,
      message: 'Không tìm thấy mã hóa đơn liên quan.'
    };
  }

  if (!phanHoiCustomer || order.ma_kh !== phanHoiCustomer.ma_kh) {
    return {
      valid: false,
      message: 'Mã hóa đơn này không thuộc khách hàng đang chọn.'
    };
  }

  return { valid: true };
}

function renderPhanHoiCustomer() {
  var empty = document.getElementById('phan_hoi-customer-empty');
  var box = document.getElementById('phan_hoi-customer');
  if (!empty || !box) return;

  if (!phanHoiCustomer) {
    empty.hidden = false;
    box.hidden = true;
    return;
  }

  empty.hidden = true;
  box.hidden = false;
  document.getElementById('phan_hoi-customer-name').textContent = phanHoiCustomer.ho_ten || 'Khách hàng';
  document.getElementById('phan_hoi-customer-meta').textContent =
    (phanHoiCustomer.ma_kh || '-') + ' · ' + (phanHoiCustomer.so_dien_thoai || '-') +
    (phanHoiCustomer.email ? ' · ' + phanHoiCustomer.email : '');
}

function renderPhanHoiList() {
  var loading = document.getElementById('phan_hoi-list-loading');
  var empty = document.getElementById('phan_hoi-list-empty');
  var list = document.getElementById('phan_hoi-list');
  var count = document.getElementById('phan_hoi-list-count');
  if (!loading || !empty || !list) return;

  loading.hidden = true;
  list.innerHTML = '';
  if (count) count.textContent = (phanHoiRows || []).length + ' yêu cầu';

  if (!phanHoiRows || !phanHoiRows.length) {
    empty.textContent = 'Chưa có phản hồi nào.';
    empty.hidden = false;
    list.hidden = true;
    return;
  }

  empty.hidden = true;
  list.hidden = false;
  list.innerHTML = phanHoiRows.map(renderPhanHoiItem).join('');

  list.querySelectorAll('[data-ph-action="resolve"]').forEach(function(button) {
    button.addEventListener('click', function() {
      openPhanHoiResolution(this.dataset.phId);
    });
  });
}

function renderPhanHoiItem(item) {
  var customer = item.khach_hang || {};
  var done = item.trang_thai === 'da_xu_ly';
  return '' +
    '<div class="phan_hoi-item">' +
      '<div class="phan_hoi-item-head">' +
        '<div>' +
          '<div class="phan_hoi-item-title">' + escPhanHoi(customer.ho_ten || item.ma_kh || 'Khách hàng') + '</div>' +
          '<div class="cid">' + escPhanHoi(item.ma_kh || '-') + ' · ' + escPhanHoi(customer.so_dien_thoai || '-') + '</div>' +
        '</div>' +
        '<span class="' + getPhanHoiBadgeClass(item.trang_thai) + '">' + escPhanHoi(formatPhanHoiStatus(item.trang_thai)) + '</span>' +
      '</div>' +
      '<div class="phan_hoi-item-meta">' +
        '<span>' + escPhanHoi(formatPhanHoiType(item.loai)) + '</span>' +
        '<span>' + escPhanHoi(formatPhanHoiPriority(item.uu_tien)) + '</span>' +
        '<span>' + escPhanHoi(formatPhanHoiDate(item.thoi_gian_gui)) + '</span>' +
      '</div>' +
      '<div class="phan_hoi-item-content">' + escPhanHoi(item.noi_dung || '') + '</div>' +
      (item.ket_qua_xu_ly ? '<div class="phan_hoi-result"><b>Kết quả:</b> ' + escPhanHoi(item.ket_qua_xu_ly) + '</div>' : '') +
      '<div class="phan_hoi-item-actions">' +
        (done
          ? '<span class="phan_hoi-done-note">Đã xử lý ' + escPhanHoi(formatPhanHoiDate(item.thoi_gian_xu_ly)) + '</span>'
          : '<button class="btn btn-green btn-sm" type="button" data-ph-action="resolve" data-ph-id="' + escAttrPhanHoi(item.ma_phan_hoi || '') + '">Cập nhật Đã xử lý</button>') +
      '</div>' +
    '</div>';
}

function openPhanHoiResolution(id) {
  var item = findPhanHoiById(id);
  if (!item) return;
  var customer = item.khach_hang || {};
  document.getElementById('phan_hoi-resolution-id').value = item.ma_phan_hoi || '';
  document.getElementById('phan_hoi-resolution-result').value = item.ket_qua_xu_ly || '';
  document.getElementById('phan_hoi-resolution-sub').textContent =
    (customer.ho_ten || item.ma_kh || 'Khách hàng') + ' · ' + formatPhanHoiType(item.loai);
  clearPhanHoiFieldError('phan_hoi-resolution-result', 'phan_hoi-resolution-error');
  openModal('modal-phan-hoi');
}

async function updatePhanHoiResult() {
  var id = getPhanHoiValue('phan_hoi-resolution-id');
  var result = getPhanHoiValue('phan_hoi-resolution-result');
  var item = findPhanHoiById(id);
  if (!item) return;

  if (!result) {
    setPhanHoiFieldError('phan_hoi-resolution-result', 'Vui lòng nhập kết quả xử lý.', 'phan_hoi-resolution-error');
    return;
  }

  var maNvXuLy = await getPhanHoiCurrentNhanVienId(item.ma_nv_xu_ly || null);
  setPhanHoiBusy('phan_hoi-resolution-button', true, 'Đang cập nhật...');

  try {
    var updated = await sbUpdate(
      'phan_hoi_khach_hang',
      'ma_phan_hoi=eq.' + encodeURIComponent(id),
      {
        trang_thai: 'da_xu_ly',
        ket_qua_xu_ly: result,
        thoi_gian_xu_ly: new Date().toISOString(),
        ma_nv_xu_ly: maNvXuLy
      }
    );
    await insertPhanHoiSupportLog(updated && updated.length ? updated[0] : item, item.noi_dung, result);
    closeModal('modal-phan-hoi');
    setPhanHoiMessage('Đã cập nhật kết quả xử lý và chuyển trạng thái sang Đã xử lý.', 'ok');
    showToast('Đã xử lý phản hồi', 'ok');
    loadPhanHoiList();
  } catch (error) {
    console.error(error);
    showToast('Cập nhật xử lý thất bại', 'err');
  } finally {
    setPhanHoiBusy('phan_hoi-resolution-button', false, 'Đã xử lý');
  }
}

async function insertPhanHoiSupportLog(item, content, result) {
  var maNv = await getPhanHoiCurrentNhanVienId(null);
  if (!item || !item.ma_kh || !maNv) return;

  try {
    await sbInsert('lich_su_ho_tro', {
      ma_nv: maNv,
      ma_kh: item.ma_kh,
      loai_ho_tro: 'xu_ly_khieu_nai',
      noi_dung: content || item.noi_dung || '',
      ket_qua: result || '',
      ma_phan_hoi_lq: item.ma_phan_hoi || null
    });
  } catch (error) {
    console.warn('Khong the ghi lich su ho tro', error);
  }
}

async function getPhanHoiCurrentNhanVienId(fallback) {
  var nv = typeof getCurrentNV === 'function' ? getCurrentNV() : null;
  if (!nv || !nv.ma_nv) return fallback || null;

  if (Object.prototype.hasOwnProperty.call(phanHoiNvCache, nv.ma_nv)) {
    return phanHoiNvCache[nv.ma_nv] ? nv.ma_nv : (fallback || null);
  }

  try {
    var rows = await sbGet(
      'nhan_vien',
      'ma_nv=eq.' + encodeURIComponent(nv.ma_nv) + '&select=ma_nv&limit=1'
    );
    phanHoiNvCache[nv.ma_nv] = !!(rows && rows.length);
  } catch (error) {
    console.warn('Khong the kiem tra nhan vien hien tai', error);
    phanHoiNvCache[nv.ma_nv] = false;
  }

  return phanHoiNvCache[nv.ma_nv] ? nv.ma_nv : (fallback || null);
}

function resetPhanHoiForm(showMessage) {
  phanHoiCustomer = null;
  var searchForm = document.getElementById('phan_hoi-search-form');
  var form = document.getElementById('phan_hoi-form');
  if (searchForm) searchForm.reset();
  if (form) form.reset();
  clearPhanHoiFieldError('phan_hoi-keyword');
  clearPhanHoiFieldError('phan_hoi-content');
  renderPhanHoiCustomer();
  if (showMessage) setPhanHoiMessage('Đã xóa dữ liệu đang nhập.', 'inf');
}

function findPhanHoiById(id) {
  return (phanHoiRows || []).find(function(item) {
    return item.ma_phan_hoi === id;
  });
}

function setPhanHoiMessage(message, type) {
  var el = document.getElementById('phan_hoi-message');
  if (!el) return;
  el.className = 'phan_hoi-message ' + (type || 'inf');
  el.textContent = message;
}

function setPhanHoiFieldError(inputId, message, errorId) {
  var input = document.getElementById(inputId);
  var error = document.getElementById(errorId || inputId + '-error');
  if (input) input.classList.add('phan_hoi-input-invalid');
  if (error) error.textContent = message || '';
}

function clearPhanHoiFieldError(inputId, errorId) {
  var input = document.getElementById(inputId);
  var error = document.getElementById(errorId || inputId + '-error');
  if (input) input.classList.remove('phan_hoi-input-invalid');
  if (error) error.textContent = '';
}

function setPhanHoiBusy(target, busy, text) {
  var button = typeof target === 'string' ? document.getElementById(target) : target;
  if (!button) return;
  button.disabled = !!busy;
  button.textContent = text;
}

function getPhanHoiValue(id) {
  var el = document.getElementById(id);
  return el && el.value ? el.value.trim() : '';
}

function getPhanHoiBadgeClass(status) {
  if (status === 'da_xu_ly') return 'badge b-done';
  if (status === 'dang_xu_ly') return 'badge b-open';
  if (status === 'cho_phan_hoi') return 'badge b-pend';
  if (status === 'da_chuyen') return 'badge b-vip';
  return 'badge b-new';
}

function formatPhanHoiStatus(status) {
  var map = {
    moi: 'Ghi nhận',
    dang_xu_ly: 'Đang xử lý',
    cho_phan_hoi: 'Chờ phản hồi',
    da_xu_ly: 'Đã xử lý',
    da_chuyen: 'Đã chuyển'
  };
  return map[status] || status || '-';
}

function formatPhanHoiType(type) {
  var map = {
    khieu_nai: 'Khiếu nại',
    gop_y: 'Góp ý',
    yeu_cau_ho_tro: 'Yêu cầu hỗ trợ',
    doi_tra: 'Đổi / trả hàng'
  };
  return map[type] || type || '-';
}

function formatPhanHoiPriority(priority) {
  var map = { cao: 'Ưu tiên cao', thuong: 'Ưu tiên thường', thap: 'Ưu tiên thấp' };
  return map[priority] || priority || '-';
}

function formatPhanHoiDate(value) {
  if (!value) return '-';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPhanHoiErrorMessage(error) {
  var raw = error && error.message ? error.message : '';
  if (raw.indexOf('ma_don_hang_lq') >= 0) return 'Mã hóa đơn liên quan không tồn tại. Vui lòng kiểm tra lại hoặc để trống.';
  if (raw.indexOf('ma_nv_xu_ly') >= 0 || raw.indexOf('phan_hoi_khach_hang_ma_nv_xu_ly') >= 0) return 'Phiên đăng nhập nhân viên không còn hợp lệ. Vui lòng đăng xuất và đăng nhập lại.';
  if (raw.indexOf('ma_kh') >= 0 || raw.indexOf('phan_hoi_khach_hang_ma_kh') >= 0) return 'Không tìm thấy khách hàng đang chọn. Vui lòng tìm lại khách hàng.';
  if (raw.indexOf('row-level security') >= 0 || raw.indexOf('permission denied') >= 0) return 'Tài khoản hiện tại không có quyền lưu phản hồi.';
  return 'Không thể lưu phản hồi. Vui lòng thử lại.';
}

function escPhanHoi(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttrPhanHoi(value) {
  return escPhanHoi(value).replace(/`/g, '&#96;');
}
