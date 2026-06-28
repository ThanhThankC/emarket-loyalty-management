// pages/qua_tang.js - Quản lý chương trình quà tặng và sự kiện
var quaTangRows = [];
var quaTangEditing = null;
var quaTangHandlersReady = false;
var quaTangEndingId = null;

registerPage('qua_tang', function() {
  renderQuaTangMarkup();
  bindQuaTangEvents();
  loadQuaTangPrograms();
});

function renderQuaTangMarkup() {
  var pageEl = document.getElementById('page-qua_tang');
  if (!pageEl || document.getElementById('qua_tang-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Quà tặng và Sự kiện</div>' +
        '<div class="psub">Tạo chương trình cho khách hàng thành viên, quản lý quà đổi điểm và trạng thái hiển thị trên App KH</div>' +
      '</div>' +
      '<div class="srow">' +
        '<button class="btn btn-outline btn-sm" type="button" id="qua_tang-refresh">Tải lại</button>' +
        '<button class="btn btn-primary" type="button" id="qua_tang-create">Tạo chương trình</button>' +
      '</div>' +
    '</div>' +
    '<div class="qua_tang-stats">' +
      '<div class="qua_tang-stat"><span id="qua_tang-stat-active">0</span><small>Đang hiển thị</small></div>' +
      '<div class="qua_tang-stat"><span id="qua_tang-stat-ended">0</span><small>Đã kết thúc</small></div>' +
      '<div class="qua_tang-stat"><span id="qua_tang-stat-stock">0</span><small>Tổng số lượng quà</small></div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-h">' +
        '<span class="panel-t">Danh sách chương trình</span>' +
        '<span class="panel-a" id="qua_tang-count">0 chương trình</span>' +
      '</div>' +
      '<div class="qua_tang-message inf" id="qua_tang-message">Đang tải dữ liệu...</div>' +
      '<div class="qua_tang-table-wrap">' +
        '<table class="tbl qua_tang-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Chương trình</th>' +
              '<th>Thời gian</th>' +
              '<th>Quà / điểm đổi</th>' +
              '<th>Số lượng</th>' +
              '<th>Trạng thái</th>' +
              '<th>Thao tác</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="qua_tang-tbody">' +
            '<tr><td colspan="6" class="qua_tang-empty">Đang tải dữ liệu...</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-qua-tang">' +
      '<div class="modal wide">' +
        '<form id="qua_tang-form" novalidate>' +
          '<div class="mh">' +
            '<div>' +
              '<div class="mt" id="qua_tang-modal-title">Tạo chương trình</div>' +
              '<div class="cid">Thông tin này sẽ được hiển thị trên App KH khi chương trình hoạt động.</div>' +
            '</div>' +
            '<button class="mc" type="button" onclick="closeModal(\'modal-qua-tang\')">X</button>' +
          '</div>' +
          '<div class="fgrid">' +
            '<input id="qua_tang-program-id" type="hidden"/>' +
            '<input id="qua_tang-gift-id" type="hidden"/>' +
            '<div class="fg ffull">' +
              '<label class="fl" for="qua_tang-name">Tên chương trình <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-name" maxlength="200" placeholder="VD: Tuần lễ tri ân thành viên" autocomplete="off"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-name-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-start">Ngày bắt đầu <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-start" type="date"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-start-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-end">Ngày kết thúc <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-end" type="date"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-end-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-type">Loại chương trình</label>' +
              '<select class="fi" id="qua_tang-type">' +
                '<option value="tang_qua">Tặng quà / sự kiện</option>' +
                '<option value="giam_gia">Giảm giá</option>' +
                '<option value="tich_diem_bo">Tích điểm bổ sung</option>' +
                '<option value="su_kien">Sự kiện thành viên</option>' +
              '</select>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-rank">Hạng tối thiểu</label>' +
              '<select class="fi" id="qua_tang-rank">' +
                '<option value="">Tất cả thành viên</option>' +
                '<option value="Bronze">Bronze</option>' +
                '<option value="Silver">Silver</option>' +
                '<option value="Gold">Gold</option>' +
                '<option value="Platinum">Platinum</option>' +
              '</select>' +
            '</div>' +
            '<div class="fg ffull">' +
              '<label class="fl" for="qua_tang-condition">Điều kiện áp dụng <span class="req">*</span></label>' +
              '<textarea class="fi" id="qua_tang-condition" maxlength="500" rows="3" placeholder="VD: Thành viên có thẻ đang hoạt động, mỗi KH đổi tối đa 1 phần"></textarea>' +
              '<div class="qua_tang-field-error" id="qua_tang-condition-error"></div>' +
            '</div>' +
            '<div class="fg ffull">' +
              '<label class="fl" for="qua_tang-desc">Mô tả hiển thị trên App KH</label>' +
              '<textarea class="fi" id="qua_tang-desc" maxlength="800" rows="3" placeholder="Nội dung giới thiệu ngắn gọn cho khách hàng"></textarea>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-gift-name">Tên quà / voucher <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-gift-name" maxlength="200" placeholder="VD: Voucher giảm 100.000đ"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-gift-name-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-gift-type">Loại quà</label>' +
              '<select class="fi" id="qua_tang-gift-type">' +
                '<option value="voucher_giam_gia">Voucher giảm giá</option>' +
                '<option value="qua_hien_vat">Quà hiện vật</option>' +
                '<option value="uu_dai_dich_vu">Ưu đãi dịch vụ</option>' +
              '</select>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-points">Điểm đổi <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-points" type="number" min="1" step="1" placeholder="200"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-points-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-stock">Số lượng <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-stock" type="number" min="1" step="1" placeholder="100"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-stock-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-value">Giá trị voucher / quà</label>' +
              '<input class="fi" id="qua_tang-value" type="number" min="0" step="1000" placeholder="100000"/>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-voucher-days">Hạn voucher (ngày)</label>' +
              '<input class="fi" id="qua_tang-voucher-days" type="number" min="1" step="1" placeholder="30"/>' +
              '<div class="fhint">Chỉ áp dụng khi loại quà là voucher.</div>' +
            '</div>' +
          '</div>' +
          '<div class="mf">' +
            '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-qua-tang\')">Hủy</button>' +
            '<button class="btn btn-primary" id="qua_tang-save" type="submit">Lưu chương trình</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-qua-tang-end">' +
      '<div class="modal">' +
        '<div class="mh">' +
          '<div>' +
            '<div class="mt">Kết thúc chương trình</div>' +
            '<div class="cid" id="qua_tang-end-sub">Chương trình sẽ ngừng hiển thị trên App KH.</div>' +
          '</div>' +
          '<button class="mc" type="button" onclick="closeModal(\'modal-qua-tang-end\')">X</button>' +
        '</div>' +
        '<div class="qua_tang-end-body">Bạn có chắc muốn kết thúc chương trình này?</div>' +
        '<div class="mf">' +
          '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-qua-tang-end\')">Hủy</button>' +
          '<button class="btn btn-danger" id="qua_tang-end-confirm" type="button">Kết thúc</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function bindQuaTangEvents() {
  if (quaTangHandlersReady) return;

  document.getElementById('qua_tang-create').addEventListener('click', function() {
    openQuaTangForm(null);
  });
  document.getElementById('qua_tang-refresh').addEventListener('click', loadQuaTangPrograms);
  document.getElementById('qua_tang-form').addEventListener('submit', function(event) {
    event.preventDefault();
    saveQuaTangProgram();
  });
  document.getElementById('qua_tang-end-confirm').addEventListener('click', endQuaTangProgram);
  ['modal-qua-tang', 'modal-qua-tang-end'].forEach(function(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('click', function(event) {
        if (event.target === modal) closeModal(id);
      });
    }
  });

  [
    'qua_tang-name',
    'qua_tang-start',
    'qua_tang-end',
    'qua_tang-condition',
    'qua_tang-gift-name',
    'qua_tang-points',
    'qua_tang-stock'
  ].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function() { clearQuaTangFieldError(id); });
  });

  quaTangHandlersReady = true;
}

async function loadQuaTangPrograms() {
  setQuaTangMessage('Đang tải dữ liệu...', 'inf');
  var tbody = document.getElementById('qua_tang-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="qua_tang-empty">Đang tải dữ liệu...</td></tr>';

  try {
    var programs = await sbGet(
      'chuong_trinh_khuyen_mai',
      'select=ma_chuong_trinh,ten_chuong_trinh,loai,dieu_kien_ap_dung,hang_toi_thieu,ngay_bat_dau,ngay_ket_thuc,trang_thai,mo_ta,qua_tang(ma_qua,ten_qua,loai,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher,trang_thai)' +
        '&order=ngay_bat_dau.desc'
    );
    quaTangRows = programs || [];
    renderQuaTangRows();
    setQuaTangMessage(quaTangRows.length ? 'Đã tải danh sách chương trình.' : 'Chưa có chương trình nào.', quaTangRows.length ? 'ok' : 'inf');
  } catch (error) {
    console.error(error);
    setQuaTangMessage('Không tải được danh sách chương trình.', 'err');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="qua_tang-empty">Không tải được dữ liệu.</td></tr>';
  }
}

function renderQuaTangRows() {
  var tbody = document.getElementById('qua_tang-tbody');
  var count = document.getElementById('qua_tang-count');
  if (!tbody) return;

  if (count) count.textContent = quaTangRows.length + ' chương trình';
  renderQuaTangStats();

  if (!quaTangRows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="qua_tang-empty">Chưa có chương trình nào.</td></tr>';
    return;
  }

  tbody.innerHTML = quaTangRows.map(function(row) {
    var gift = normalizeQuaTangGift(row.qua_tang);
    return '' +
      '<tr>' +
        '<td>' +
          '<div class="cname">' + escQuaTang(row.ten_chuong_trinh) + '</div>' +
          '<div class="cid">' + escQuaTang(row.ma_chuong_trinh) + ' · ' + escQuaTang(programTypeLabel(row.loai)) + '</div>' +
          '<div class="qua_tang-condition">' + escQuaTang(row.dieu_kien_ap_dung || '-') + '</div>' +
        '</td>' +
        '<td>' +
          '<div>' + escQuaTang(formatQuaTangDate(row.ngay_bat_dau)) + '</div>' +
          '<div class="cid">đến ' + escQuaTang(formatQuaTangDate(row.ngay_ket_thuc)) + '</div>' +
        '</td>' +
        '<td>' +
          '<div class="cname">' + escQuaTang(gift.ten_qua || 'Chưa có quà') + '</div>' +
          '<div class="cid">' + escQuaTang(giftTypeLabel(gift.loai)) + ' · ' + formatQuaTangNumber(gift.so_diem_quy_doi) + ' điểm</div>' +
        '</td>' +
        '<td>' + formatQuaTangNumber(gift.so_luong_ton) + '</td>' +
        '<td><span class="' + statusQuaTangClass(row.trang_thai) + '">' + escQuaTang(statusQuaTangLabel(row.trang_thai)) + '</span></td>' +
        '<td>' +
          '<div class="srow">' +
            '<button class="btn btn-outline btn-sm" type="button" data-qt-action="edit" data-qt-id="' + escAttrQuaTang(row.ma_chuong_trinh) + '">Sửa</button>' +
            (row.trang_thai === 'ket_thuc'
              ? ''
              : '<button class="btn btn-danger btn-sm" type="button" data-qt-action="end" data-qt-id="' + escAttrQuaTang(row.ma_chuong_trinh) + '">Kết thúc</button>') +
          '</div>' +
        '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('[data-qt-action="edit"]').forEach(function(button) {
    button.addEventListener('click', function() {
      openQuaTangForm(findQuaTangById(this.dataset.qtId));
    });
  });
  tbody.querySelectorAll('[data-qt-action="end"]').forEach(function(button) {
    button.addEventListener('click', function() {
      openEndQuaTang(findQuaTangById(this.dataset.qtId));
    });
  });
}

function renderQuaTangStats() {
  var active = quaTangRows.filter(function(row) { return row.trang_thai === 'hoat_dong'; }).length;
  var ended = quaTangRows.filter(function(row) { return row.trang_thai === 'ket_thuc'; }).length;
  var stock = quaTangRows.reduce(function(total, row) {
    var gift = normalizeQuaTangGift(row.qua_tang);
    return total + Number(gift.so_luong_ton || 0);
  }, 0);
  setTextQuaTang('qua_tang-stat-active', formatQuaTangNumber(active));
  setTextQuaTang('qua_tang-stat-ended', formatQuaTangNumber(ended));
  setTextQuaTang('qua_tang-stat-stock', formatQuaTangNumber(stock));
}

function openQuaTangForm(row) {
  clearQuaTangErrors();
  quaTangEditing = row || null;
  var gift = normalizeQuaTangGift(row && row.qua_tang);
  document.getElementById('qua_tang-modal-title').textContent = row ? 'Chỉnh sửa chương trình' : 'Tạo chương trình';
  setValueQuaTang('qua_tang-program-id', row ? row.ma_chuong_trinh : '');
  setValueQuaTang('qua_tang-gift-id', gift.ma_qua || '');
  setValueQuaTang('qua_tang-name', row ? row.ten_chuong_trinh : '');
  setValueQuaTang('qua_tang-start', row ? row.ngay_bat_dau : '');
  setValueQuaTang('qua_tang-end', row ? row.ngay_ket_thuc : '');
  setValueQuaTang('qua_tang-type', row ? row.loai : 'tang_qua');
  setValueQuaTang('qua_tang-rank', row && row.hang_toi_thieu ? row.hang_toi_thieu : '');
  setValueQuaTang('qua_tang-condition', row ? row.dieu_kien_ap_dung : '');
  setValueQuaTang('qua_tang-desc', row ? row.mo_ta : '');
  setValueQuaTang('qua_tang-gift-name', gift.ten_qua || '');
  setValueQuaTang('qua_tang-gift-type', gift.loai || 'voucher_giam_gia');
  setValueQuaTang('qua_tang-points', gift.so_diem_quy_doi || '');
  setValueQuaTang('qua_tang-stock', gift.so_luong_ton || '');
  setValueQuaTang('qua_tang-value', gift.gia_tri || '');
  setValueQuaTang('qua_tang-voucher-days', gift.thoi_han_voucher || '');
  openModal('modal-qua-tang');
}

async function saveQuaTangProgram() {
  var data = getQuaTangFormData();
  var errors = validateQuaTangForm(data);
  if (Object.keys(errors).length) {
    Object.keys(errors).forEach(function(id) { setQuaTangFieldError(id, errors[id]); });
    setQuaTangMessage('Vui lòng kiểm tra lại các thông tin bắt buộc.', 'err');
    return;
  }

  setQuaTangBusy('qua_tang-save', true, 'Đang lưu...');

  try {
    var programId = data.programId || buildQuaTangProgramId();
    var giftId = data.giftId || buildQuaTangGiftId();
    var programBody = {
      ma_chuong_trinh: programId,
      ten_chuong_trinh: data.name,
      loai: data.type,
      dieu_kien_ap_dung: data.condition,
      hang_toi_thieu: data.rank || null,
      ngay_bat_dau: data.start,
      ngay_ket_thuc: data.end,
      trang_thai: 'hoat_dong',
      mo_ta: data.desc || null
    };
    var giftBody = {
      ma_qua: giftId,
      ten_qua: data.giftName,
      loai: data.giftType,
      so_diem_quy_doi: data.points,
      so_luong_ton: data.stock,
      gia_tri: data.value || null,
      thoi_han_voucher: data.giftType === 'voucher_giam_gia' ? (data.voucherDays || 30) : null,
      ma_chuong_trinh: programId,
      trang_thai: data.stock > 0 ? 'hoat_dong' : 'het_hang'
    };

    if (data.programId) {
      delete programBody.ma_chuong_trinh;
      await sbUpdate('chuong_trinh_khuyen_mai', 'ma_chuong_trinh=eq.' + encodeURIComponent(data.programId), programBody);
      delete giftBody.ma_qua;
      if (data.giftId) {
        await sbUpdate('qua_tang', 'ma_qua=eq.' + encodeURIComponent(data.giftId), giftBody);
      } else {
        giftBody.ma_qua = giftId;
        await sbInsert('qua_tang', giftBody);
      }
      showToast('Đã cập nhật chương trình', 'ok');
    } else {
      await sbInsert('chuong_trinh_khuyen_mai', programBody);
      await sbInsert('qua_tang', giftBody);
      showToast('Đã tạo chương trình', 'ok');
    }

    closeModal('modal-qua-tang');
    await loadQuaTangPrograms();
  } catch (error) {
    console.error(error);
    setQuaTangMessage(getQuaTangErrorMessage(error), 'err');
    showToast('Lưu chương trình thất bại', 'err');
  } finally {
    setQuaTangBusy('qua_tang-save', false, 'Lưu chương trình');
  }
}

function openEndQuaTang(row) {
  if (!row) return;
  quaTangEndingId = row.ma_chuong_trinh;
  setTextQuaTang('qua_tang-end-sub', row.ten_chuong_trinh + ' sẽ ngừng hiển thị trên App KH.');
  openModal('modal-qua-tang-end');
}

async function endQuaTangProgram() {
  if (!quaTangEndingId) return;
  setQuaTangBusy('qua_tang-end-confirm', true, 'Đang kết thúc...');

  try {
    await sbUpdate(
      'chuong_trinh_khuyen_mai',
      'ma_chuong_trinh=eq.' + encodeURIComponent(quaTangEndingId),
      { trang_thai: 'ket_thuc' }
    );
    await sbUpdate(
      'qua_tang',
      'ma_chuong_trinh=eq.' + encodeURIComponent(quaTangEndingId),
      { trang_thai: 'ngung_cung_cap' }
    );
    closeModal('modal-qua-tang-end');
    showToast('Đã kết thúc chương trình', 'ok');
    quaTangEndingId = null;
    await loadQuaTangPrograms();
  } catch (error) {
    console.error(error);
    showToast('Kết thúc chương trình thất bại', 'err');
  } finally {
    setQuaTangBusy('qua_tang-end-confirm', false, 'Kết thúc');
  }
}

function getQuaTangFormData() {
  return {
    programId: getValueQuaTang('qua_tang-program-id'),
    giftId: getValueQuaTang('qua_tang-gift-id'),
    name: getValueQuaTang('qua_tang-name'),
    start: getValueQuaTang('qua_tang-start'),
    end: getValueQuaTang('qua_tang-end'),
    type: getValueQuaTang('qua_tang-type') || 'tang_qua',
    rank: getValueQuaTang('qua_tang-rank'),
    condition: getValueQuaTang('qua_tang-condition'),
    desc: getValueQuaTang('qua_tang-desc'),
    giftName: getValueQuaTang('qua_tang-gift-name'),
    giftType: getValueQuaTang('qua_tang-gift-type') || 'voucher_giam_gia',
    points: parseInt(getValueQuaTang('qua_tang-points'), 10),
    stock: parseInt(getValueQuaTang('qua_tang-stock'), 10),
    value: parseInt(getValueQuaTang('qua_tang-value') || '0', 10),
    voucherDays: parseInt(getValueQuaTang('qua_tang-voucher-days') || '0', 10)
  };
}

function validateQuaTangForm(data) {
  clearQuaTangErrors();
  var errors = {};
  if (!data.name) errors['qua_tang-name'] = 'Vui lòng nhập tên chương trình.';
  if (!data.start) errors['qua_tang-start'] = 'Vui lòng chọn ngày bắt đầu.';
  if (!data.end) errors['qua_tang-end'] = 'Vui lòng chọn ngày kết thúc.';
  if (data.start && data.end && data.end <= data.start) errors['qua_tang-end'] = 'Ngày kết thúc phải sau ngày bắt đầu.';
  if (!data.condition) errors['qua_tang-condition'] = 'Vui lòng nhập điều kiện áp dụng.';
  if (!data.giftName) errors['qua_tang-gift-name'] = 'Vui lòng nhập tên quà.';
  if (!Number.isInteger(data.points) || data.points <= 0) errors['qua_tang-points'] = 'Điểm đổi phải lớn hơn 0.';
  if (!Number.isInteger(data.stock) || data.stock <= 0) errors['qua_tang-stock'] = 'Số lượng phải lớn hơn 0.';
  if (data.giftType === 'voucher_giam_gia' && data.voucherDays && data.voucherDays <= 0) errors['qua_tang-voucher-days'] = 'Hạn voucher phải lớn hơn 0.';
  return errors;
}

function normalizeQuaTangGift(value) {
  if (Array.isArray(value)) return value[0] || {};
  return value || {};
}

function findQuaTangById(id) {
  return (quaTangRows || []).find(function(row) { return row.ma_chuong_trinh === id; });
}

function buildQuaTangProgramId() {
  return 'CT' + buildQuaTangStamp();
}

function buildQuaTangGiftId() {
  return 'QUA' + buildQuaTangStamp();
}

function buildQuaTangStamp() {
  var d = new Date();
  var pad = function(value) { return String(value).padStart(2, '0'); };
  return String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) +
    Math.floor(Math.random() * 100).toString().padStart(2, '0');
}

function setQuaTangMessage(message, type) {
  var el = document.getElementById('qua_tang-message');
  if (!el) return;
  el.className = 'qua_tang-message ' + (type || 'inf');
  el.textContent = message;
}

function setQuaTangFieldError(id, message) {
  var input = document.getElementById(id);
  var error = document.getElementById(id + '-error');
  if (input) input.classList.add('qua_tang-input-invalid');
  if (error) error.textContent = message || '';
}

function clearQuaTangFieldError(id) {
  var input = document.getElementById(id);
  var error = document.getElementById(id + '-error');
  if (input) input.classList.remove('qua_tang-input-invalid');
  if (error) error.textContent = '';
}

function clearQuaTangErrors() {
  document.querySelectorAll('.qua_tang-field-error').forEach(function(el) { el.textContent = ''; });
  document.querySelectorAll('.qua_tang-input-invalid').forEach(function(el) { el.classList.remove('qua_tang-input-invalid'); });
}

function setQuaTangBusy(id, busy, text) {
  var button = document.getElementById(id);
  if (!button) return;
  button.disabled = !!busy;
  button.textContent = text;
}

function setValueQuaTang(id, value) {
  var el = document.getElementById(id);
  if (el) el.value = value == null ? '' : value;
}

function getValueQuaTang(id) {
  var el = document.getElementById(id);
  return el && el.value ? el.value.trim() : '';
}

function setTextQuaTang(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value == null ? '' : value;
}

function getQuaTangErrorMessage(error) {
  var raw = error && error.message ? error.message : '';
  if (raw.indexOf('ngay_ket_thuc') >= 0 || raw.indexOf('check') >= 0) return 'Ngày kết thúc phải sau ngày bắt đầu.';
  if (raw.indexOf('duplicate key') >= 0) return 'Mã chương trình bị trùng. Vui lòng lưu lại.';
  if (raw.indexOf('permission denied') >= 0 || raw.indexOf('row-level security') >= 0) return 'Tài khoản hiện tại không có quyền lưu chương trình.';
  return 'Không thể lưu chương trình. Vui lòng thử lại.';
}

function programTypeLabel(type) {
  return {
    tang_qua: 'Tặng quà',
    giam_gia: 'Giảm giá',
    tich_diem_bo: 'Tích điểm bổ sung',
    su_kien: 'Sự kiện'
  }[type] || type || '-';
}

function giftTypeLabel(type) {
  return {
    voucher_giam_gia: 'Voucher',
    qua_hien_vat: 'Quà hiện vật',
    uu_dai_dich_vu: 'Ưu đãi dịch vụ'
  }[type] || type || '-';
}

function statusQuaTangLabel(status) {
  return {
    hoat_dong: 'Hoạt động',
    tam_dung: 'Tạm dừng',
    ket_thuc: 'Kết thúc'
  }[status] || status || '-';
}

function statusQuaTangClass(status) {
  if (status === 'hoat_dong') return 'badge b-done';
  if (status === 'tam_dung') return 'badge b-pend';
  if (status === 'ket_thuc') return 'badge b-ended';
  return 'badge b-normal';
}

function formatQuaTangDate(value) {
  if (!value) return '-';
  var d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

function formatQuaTangNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function escQuaTang(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttrQuaTang(value) {
  return escQuaTang(value).replace(/`/g, '&#96;');
}