// pages/quy_doi_diem.js
var qdCustomer = null;
var qdCard = null;
var qdOrder = null;
var qdRecentRows = [];
var qdHandlersReady = false;
var qdOrderLookupTimer = null;

registerPage('quy_doi_diem', function() {
  renderQuyDoiDiemMarkup();
  bindQuyDoiDiemEvents();
  resetQuyDoiDiem(false);
  loadQdShiftHistory();
});

function renderQuyDoiDiemMarkup() {
  var pageEl = document.getElementById('page-quy_doi_diem');
  if (!pageEl || document.getElementById('qd-search-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Quy đổi điểm giảm giá</div>' +
        '<div class="psub">· Thu ngân hỗ trợ khách hàng dùng điểm tích lũy tại quầy POS</div>' +
      '</div>' +
    '</div>' +
    '<div class="g2 qd-layout">' +
      '<div>' +
        '<div class="panel qd-panel">' +
          '<div class="panel-h"><span class="panel-t">Tra cứu khách hàng</span></div>' +
          '<form class="qd-search" id="qd-search-form" novalidate>' +
            '<div class="fg qd-search-field">' +
              '<label class="fl" for="qd-keyword">Số điện thoại hoặc mã KH</label>' +
              '<input class="fi" id="qd-keyword" type="text" maxlength="15" placeholder="0912001003 hoặc KH00003" autocomplete="off"/>' +
              '<div class="qd-field-error" id="qd-keyword-error"></div>' +
            '</div>' +
            '<button class="btn btn-primary" id="qd-search-button" type="submit">Tra cứu</button>' +
            '<button class="btn btn-outline" id="qd-clear-button" type="button">Nhập lại</button>' +
          '</form>' +
          '<div class="qd-message inf" id="qd-message">Nhập SĐT hoặc mã KH để tra cứu điểm hiện có.</div>' +
        '</div>' +
        '<div class="panel qd-customer-panel" id="qd-customer-panel">' +
          '<div class="panel-h"><span class="panel-t">Điểm hiện có</span></div>' +
          '<div class="qd-empty" id="qd-customer-empty">Chưa chọn khách hàng.</div>' +
          '<div class="qd-customer" id="qd-customer-card" hidden>' +
            '<div class="qd-customer-head">' +
              '<div>' +
                '<div class="qd-customer-name" id="qd-customer-name">Khách hàng</div>' +
                '<div class="cid" id="qd-customer-meta">Mã KH · SĐT</div>' +
              '</div>' +
              '<span class="badge b-done" id="qd-card-status">Hoạt động</span>' +
            '</div>' +
            '<div class="qd-points-box">' +
              '<div>' +
                '<div class="qd-points-label">Số điểm hiện có</div>' +
                '<div class="qd-points-value" id="qd-current-points">0</div>' +
              '</div>' +
              '<div class="qd-rank" id="qd-current-rank">Đồng</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel qd-bill-panel">' +
          '<div class="panel-h"><span class="panel-t">Áp dụng giảm giá hóa đơn</span></div>' +
          '<form class="qd-bill-form" id="qd-bill-form" novalidate>' +
            '<div class="fgrid">' +
              '<div class="fg">' +
                '<label class="fl" for="qd-order-code">Mã hóa đơn</label>' +
                '<input class="fi" id="qd-order-code" type="text" maxlength="15" placeholder="DH2025001" autocomplete="off"/>' +
                '<div class="qd-field-error" id="qd-order-code-error"></div>' +
              '</div>' +
              '<div class="fg">' +
                '<label class="fl" for="qd-bill-total">Tổng tiền hóa đơn</label>' +
                '<input class="fi qd-readonly-money" id="qd-bill-total" type="text" placeholder="Tự động hiển thị khi nhập mã hóa đơn" readonly/>' +
                '<div class="fhint" id="qd-order-hint">Nhập mã hóa đơn để hệ thống tự lấy tổng tiền.</div>' +
              '</div>' +
              '<div class="fg">' +
                '<label class="fl" for="qd-points-use">Điểm muốn dùng <span class="req">*</span></label>' +
                '<input class="fi" id="qd-points-use" type="text" inputmode="numeric" placeholder="1000" autocomplete="off" disabled/>' +
                '<div class="qd-field-error" id="qd-points-use-error"></div>' +
              '</div>' +
              '<div class="fg">' +
                '<label class="fl" for="qd-note">Ghi chú</label>' +
                '<input class="fi" id="qd-note" type="text" maxlength="180" placeholder="Quy đổi điểm tại POS" autocomplete="off"/>' +
              '</div>' +
            '</div>' +
            '<div class="qd-summary">' +
              '<div class="qd-summary-row"><span>Tổng hóa đơn</span><strong id="qd-sum-total">0 đ</strong></div>' +
              '<div class="qd-summary-row"><span>Giá trị giảm</span><strong class="qd-discount" id="qd-sum-discount">0 đ</strong></div>' +
              '<div class="qd-summary-row qd-summary-final"><span>Còn phải thanh toán</span><strong id="qd-sum-payable">0 đ</strong></div>' +
              '<div class="qd-summary-row"><span>Điểm còn lại sau đổi</span><strong id="qd-sum-remain">0 điểm</strong></div>' +
            '</div>' +
            '<div class="qd-actions">' +
              '<button class="btn btn-outline" id="qd-reset-button" type="button">Xóa dữ liệu</button>' +
              '<button class="btn btn-primary" id="qd-preview-button" type="submit" disabled>Xác nhận áp dụng</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="panel">' +
          '<div class="panel-h"><span class="panel-t">Lịch sử quy đổi trong ca</span></div>' +
          '<div class="qd-history" id="qd-history">' +
            '<div class="qd-empty">Đang tải lịch sử...</div>' +
          '</div>' +
        '</div>' +
        '<div class="ibox">Quy đổi theo tỷ lệ 1000 điểm = 1000đ. Số điểm dùng không được vượt quá điểm hiện có hoặc tổng tiền hóa đơn.</div>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-xac-nhan-qd">' +
      '<div class="modal qd-confirm-modal">' +
        '<div class="mh">' +
          '<div class="mt">Xác nhận quy đổi điểm</div>' +
          '<button class="mc" type="button" onclick="closeModal(\'modal-xac-nhan-qd\')">X</button>' +
        '</div>' +
        '<div class="qd-confirm-body" id="qd-confirm-body"></div>' +
        '<div class="mf">' +
          '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-xac-nhan-qd\')">Hủy</button>' +
          '<button class="btn btn-primary" id="btn-confirm-qd" type="button">Xác nhận áp dụng</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function bindQuyDoiDiemEvents() {
  if (qdHandlersReady) return;

  document.getElementById('qd-search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    searchQdCustomer();
  });

  document.getElementById('qd-clear-button').addEventListener('click', function() {
    resetQuyDoiDiem(true);
  });

  document.getElementById('qd-reset-button').addEventListener('click', function() {
    resetQdBillForm();
  });

  document.getElementById('qd-points-use').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    clearQdFieldError('qd-points-use');
    updateQdSummary();
  });

  document.getElementById('qd-order-code').addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    qdOrder = null;
    setQdBillTotalValue(0);
    clearQdFieldError('qd-order-code');
    setQdOrderHint('Nhập xong mã hóa đơn, hệ thống sẽ tự lấy tổng tiền.', '');
    updateQdSummary();
    clearTimeout(qdOrderLookupTimer);
    var code = this.value.trim();
    if (code.length >= 3) {
      qdOrderLookupTimer = setTimeout(function() {
        lookupQdOrder(code);
      }, 350);
    }
  });

  document.getElementById('qd-order-code').addEventListener('blur', function() {
    var code = this.value.trim();
    if (code && (!qdOrder || qdOrder.ma_don_hang !== code)) lookupQdOrder(code);
  });

  document.getElementById('qd-bill-form').addEventListener('submit', function(event) {
    event.preventDefault();
    openQdConfirmModal();
  });

  document.getElementById('btn-confirm-qd').addEventListener('click', function() {
    confirmQuyDoiDiem();
  });

  qdHandlersReady = true;
}

async function searchQdCustomer() {
  var keyword = getQdValue('qd-keyword').trim();
  clearQdFieldError('qd-keyword');

  if (!keyword) {
    setQdFieldError('qd-keyword', 'Vui lòng nhập SĐT hoặc mã KH.');
    setQdMessage('Vui lòng nhập thông tin tra cứu.', 'err');
    return;
  }

  setQdBusy('qd-search-button', true, 'Đang tra cứu...');
  setQdMessage('Đang tra cứu khách hàng và thẻ thành viên...', 'inf');

  try {
    var normalized = keyword.toUpperCase();
    var params = normalized.indexOf('KH') === 0
      ? 'ma_kh=eq.' + encodeURIComponent(normalized)
      : 'so_dien_thoai=eq.' + encodeURIComponent(keyword.replace(/\s+/g, ''));
    params += '&select=ma_kh,ho_ten,so_dien_thoai,trang_thai,the_thanh_vien(ma_the,hang,so_diem,trang_thai,ngay_het_han)&limit=1';

    var rows = await sbGet('khach_hang', params);
    if (!rows || !rows.length) {
      qdCustomer = null;
      qdCard = null;
      renderQdCustomer();
      setQdMessage('Không tìm thấy khách hàng phù hợp.', 'err');
      return;
    }

    qdCustomer = rows[0];
    qdCard = normalizeQdCard(qdCustomer.the_thanh_vien);

    if (!qdCard) {
      renderQdCustomer();
      setQdMessage('Khách hàng chưa có thẻ thành viên để quy đổi điểm.', 'err');
      return;
    }

    renderQdCustomer();
    if (qdOrder && qdOrder.ma_kh !== qdCustomer.ma_kh) {
      qdOrder = null;
      setQdBillTotalValue(0);
      setQdFieldError('qd-order-code', 'Hóa đơn vừa tra không thuộc khách hàng này.');
      setQdOrderHint('Vui lòng nhập lại mã hóa đơn phù hợp với khách hàng.', 'err');
    }
    document.getElementById('qd-points-use').disabled = qdCard.trang_thai !== 'hoat_dong';
    setQdMessage(
      qdCard.trang_thai === 'hoat_dong'
        ? 'Đã tải điểm hiện có của khách hàng.'
        : 'Thẻ thành viên không ở trạng thái hoạt động.',
      qdCard.trang_thai === 'hoat_dong' ? 'ok' : 'err'
    );
    updateQdSummary();
  } catch (error) {
    console.error(error);
    setQdMessage('Không thể tra cứu khách hàng. Vui lòng thử lại.', 'err');
    showToast('Lỗi tra cứu khách hàng', 'err');
  } finally {
    setQdBusy('qd-search-button', false, 'Tra cứu');
  }
}

async function lookupQdOrder(code) {
  if (!code) return;

  setQdOrderHint('Đang tra cứu hóa đơn...', 'inf');
  clearQdFieldError('qd-order-code');

  try {
    var rows = await sbGet(
      'don_hang',
      'ma_don_hang=eq.' + encodeURIComponent(code) +
        '&select=ma_don_hang,ma_kh,tong_tien,diem_da_dung,trang_thai,khach_hang(ho_ten,so_dien_thoai)&limit=1'
    );
    var order = rows && rows.length ? rows[0] : null;

    if (!order) {
      qdOrder = null;
      setQdBillTotalValue(0);
      setQdFieldError('qd-order-code', 'Không tìm thấy hóa đơn này.');
      setQdOrderHint('Tổng tiền sẽ hiển thị sau khi tìm thấy hóa đơn.', 'err');
      updateQdSummary();
      return;
    }

    if (order.trang_thai === 'da_huy') {
      qdOrder = null;
      setQdBillTotalValue(0);
      setQdFieldError('qd-order-code', 'Không thể áp dụng cho hóa đơn đã hủy.');
      setQdOrderHint('Vui lòng chọn hóa đơn khác.', 'err');
      updateQdSummary();
      return;
    }

    if (qdCustomer && order.ma_kh !== qdCustomer.ma_kh) {
      qdOrder = null;
      setQdBillTotalValue(0);
      setQdFieldError('qd-order-code', 'Hóa đơn này không thuộc khách hàng đang chọn.');
      setQdOrderHint('Vui lòng tra đúng khách hàng hoặc đúng mã hóa đơn.', 'err');
      updateQdSummary();
      return;
    }

    qdOrder = order;
    setQdBillTotalValue(Number(order.tong_tien || 0));
    setQdOrderHint('Đã tải tổng tiền hóa đơn ' + order.ma_don_hang + '.', 'ok');
    updateQdSummary();
  } catch (error) {
    console.error(error);
    qdOrder = null;
    setQdBillTotalValue(0);
    setQdFieldError('qd-order-code', 'Không thể tra cứu hóa đơn. Vui lòng thử lại.');
    setQdOrderHint('Chưa lấy được tổng tiền hóa đơn.', 'err');
    updateQdSummary();
  }
}

function renderQdCustomer() {
  var empty = document.getElementById('qd-customer-empty');
  var card = document.getElementById('qd-customer-card');
  if (!empty || !card) return;

  if (!qdCustomer || !qdCard) {
    empty.hidden = false;
    card.hidden = true;
    document.getElementById('qd-points-use').disabled = true;
    return;
  }

  empty.hidden = true;
  card.hidden = false;
  document.getElementById('qd-customer-name').textContent = qdCustomer.ho_ten || 'Khách hàng';
  document.getElementById('qd-customer-meta').textContent = (qdCustomer.ma_kh || '-') + ' · ' + (qdCustomer.so_dien_thoai || '-');
  document.getElementById('qd-current-points').textContent = formatQdNumber(qdCard.so_diem);
  var _hangMap = { Bronze: 'Đồng', Silver: 'Bạc', Gold: 'Vàng', Platinum: 'Bạch Kim' };
  document.getElementById('qd-current-rank').textContent = _hangMap[qdCard.hang] || qdCard.hang || '-';

  var statusEl = document.getElementById('qd-card-status');
  statusEl.className = 'badge ' + (qdCard.trang_thai === 'hoat_dong' ? 'b-done' : 'b-err');
  statusEl.textContent = qdCard.trang_thai === 'hoat_dong' ? 'Hoạt động' : statusQdCardLabel(qdCard.trang_thai);
}

function openQdConfirmModal() {
  var validation = validateQdForm();
  if (!validation.valid) {
    showQdValidation(validation);
    setQdMessage('Vui lòng kiểm tra lại thông tin quy đổi.', 'err');
    return;
  }

  var data = collectQdForm();
  document.getElementById('qd-confirm-body').innerHTML =
    '<div class="qd-confirm-list">' +
      qdConfirmRow('Khách hàng', escQd(qdCustomer.ho_ten) + '<br><span>' + escQd(qdCustomer.ma_kh) + ' · ' + escQd(qdCustomer.so_dien_thoai) + '</span>') +
      qdConfirmRow('Mã hóa đơn', escQd(data.ma_don_hang)) +
      qdConfirmRow('Điểm sẽ trừ', formatQdNumber(data.points) + ' điểm') +
      qdConfirmRow('Giá trị giảm', formatQdMoney(data.discount)) +
      qdConfirmRow('Điểm còn lại', formatQdNumber(qdCard.so_diem - data.points) + ' điểm') +
      qdConfirmRow('Thanh toán còn lại', formatQdMoney(data.payable)) +
    '</div>';
  openModal('modal-xac-nhan-qd');
}

async function confirmQuyDoiDiem() {
  var validation = validateQdForm();
  if (!validation.valid) {
    closeModal('modal-xac-nhan-qd');
    showQdValidation(validation);
    return;
  }

  var data = collectQdForm();
  var button = document.getElementById('btn-confirm-qd');
  setQdBusy(button, true, 'Đang áp dụng...');

  try {
    var freshCards = await sbGet(
      'the_thanh_vien',
      'ma_the=eq.' + encodeURIComponent(qdCard.ma_the) + '&select=ma_the,ma_kh,hang,so_diem,trang_thai&limit=1'
    );
    var freshCard = freshCards && freshCards.length ? freshCards[0] : null;
    if (!freshCard || freshCard.trang_thai !== 'hoat_dong') {
      throw new Error('CARD_NOT_ACTIVE');
    }
    if (Number(freshCard.so_diem || 0) < data.points) {
      throw new Error('NOT_ENOUGH_POINTS');
    }

    var existingOrders = await sbGet(
      'don_hang',
      'ma_don_hang=eq.' + encodeURIComponent(data.ma_don_hang) + '&select=ma_don_hang,ma_kh,diem_da_dung,trang_thai&limit=1'
    );
    var order = existingOrders && existingOrders.length ? existingOrders[0] : null;
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order && order.ma_kh !== qdCustomer.ma_kh) throw new Error('ORDER_CUSTOMER_MISMATCH');
    if (order && order.trang_thai === 'da_huy') throw new Error('ORDER_CANCELLED');

    var newBalance = Number(freshCard.so_diem || 0) - data.points;
    var note = data.note || 'Quy đổi điểm thanh toán';

    await sbUpdate(
      'don_hang',
      'ma_don_hang=eq.' + encodeURIComponent(data.ma_don_hang),
      {
        tong_tien: data.total,
        diem_da_dung: Number(order.diem_da_dung || 0) + data.points,
        ghi_chu: note
      }
    );

    await sbUpdate(
      'the_thanh_vien',
      'ma_the=eq.' + encodeURIComponent(freshCard.ma_the),
      { so_diem: newBalance }
    );

    await sbInsert('lich_su_giao_dich_diem', {
      ma_the: freshCard.ma_the,
      ma_don_hang: data.ma_don_hang,
      loai_gd: 'tieu_diem',
      so_diem: -data.points,
      so_du_sau_gd: newBalance,
      ghi_chu: note
    });

    qdCard = Object.assign({}, freshCard, { so_diem: newBalance });
    renderQdCustomer();
    addQdRecentRow({
      ma_don_hang: data.ma_don_hang,
      customer_name: qdCustomer.ho_ten,
      points: data.points,
      discount: data.discount,
      time: new Date().toISOString()
    });
    closeModal('modal-xac-nhan-qd');
    setQdMessage('Đã cập nhật hóa đơn và trừ điểm thành công.', 'ok');
    showToast('Quy đổi điểm thành công', 'ok');
    resetQdBillForm();
  } catch (error) {
    console.error(error);
    var message = getQdApplyErrorMessage(error);
    setQdMessage(message, 'err');
    showToast(message, 'err');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Xác nhận áp dụng';
    }
  }
}

function validateQdForm() {
  var data = collectQdForm();
  var errors = {};

  if (!qdCustomer || !qdCard) errors['qd-keyword'] = 'Vui lòng tra cứu khách hàng trước.';
  if (qdCard && qdCard.trang_thai !== 'hoat_dong') errors['qd-keyword'] = 'Thẻ thành viên không hoạt động.';
  if (!data.ma_don_hang) errors['qd-order-code'] = 'Vui lòng nhập mã hóa đơn.';
  if (!qdOrder) errors['qd-order-code'] = 'Vui lòng tra cứu hóa đơn hợp lệ trước.';
  if (qdOrder && qdCustomer && qdOrder.ma_kh !== qdCustomer.ma_kh) errors['qd-order-code'] = 'Hóa đơn này không thuộc khách hàng đang chọn.';
  if (!data.total || data.total <= 0) errors['qd-order-code'] = 'Hóa đơn chưa có tổng tiền hợp lệ.';
  if (!data.points || data.points <= 0) errors['qd-points-use'] = 'Vui lòng nhập số điểm muốn dùng.';
  if (qdCard && data.points > Number(qdCard.so_diem || 0)) errors['qd-points-use'] = 'Số điểm dùng vượt quá điểm hiện có.';
  if (data.total && data.points > data.total) errors['qd-points-use'] = 'Số điểm dùng không được vượt quá tổng tiền hóa đơn.';

  return { valid: Object.keys(errors).length === 0, errors: errors };
}

function collectQdForm() {
  var total = qdOrder ? Number(qdOrder.tong_tien || 0) : Number((getQdValue('qd-bill-total') || '').replace(/\D/g, '') || 0);
  var points = Number(getQdValue('qd-points-use') || 0);
  var discount = points;
  return {
    ma_don_hang: getQdValue('qd-order-code').toUpperCase(),
    total: total,
    points: points,
    discount: discount,
    payable: Math.max(total - discount, 0),
    note: getQdValue('qd-note')
  };
}

function updateQdSummary() {
  var data = collectQdForm();
  var balance = qdCard ? Number(qdCard.so_diem || 0) : 0;
  var remain = Math.max(balance - data.points, 0);

  document.getElementById('qd-sum-total').textContent = formatQdMoney(data.total);
  document.getElementById('qd-sum-discount').textContent = formatQdMoney(data.discount);
  document.getElementById('qd-sum-payable').textContent = formatQdMoney(data.payable);
  document.getElementById('qd-sum-remain').textContent = formatQdNumber(remain) + ' điểm';

  var preview = document.getElementById('qd-preview-button');
  if (preview) preview.disabled = !qdCustomer || !qdCard || qdCard.trang_thai !== 'hoat_dong';
}

async function loadQdShiftHistory() {
  var history = document.getElementById('qd-history');
  if (!history) return;

  try {
    var rows = await sbGet(
      'lich_su_giao_dich_diem',
      'loai_gd=eq.tieu_diem&select=ma_gd,ma_don_hang,so_diem,so_du_sau_gd,ngay_gd,ghi_chu,the_thanh_vien(khach_hang(ho_ten))&order=ngay_gd.desc&limit=5'
    );
    qdRecentRows = (rows || []).map(function(row) {
      return {
        ma_don_hang: row.ma_don_hang,
        customer_name: row.the_thanh_vien && row.the_thanh_vien.khach_hang ? row.the_thanh_vien.khach_hang.ho_ten : 'Khách hàng',
        points: Math.abs(Number(row.so_diem || 0)),
        discount: Math.abs(Number(row.so_diem || 0)),
        time: row.ngay_gd
      };
    });
    renderQdHistory();
  } catch (error) {
    console.error(error);
    history.innerHTML = '<div class="qd-empty">Không thể tải lịch sử quy đổi.</div>';
  }
}

function addQdRecentRow(row) {
  qdRecentRows.unshift(row);
  qdRecentRows = qdRecentRows.slice(0, 5);
  renderQdHistory();
}

function renderQdHistory() {
  var history = document.getElementById('qd-history');
  if (!history) return;
  if (!qdRecentRows.length) {
    history.innerHTML = '<div class="qd-empty">Chưa có giao dịch nào trong ca này.</div>';
    return;
  }

  history.innerHTML = qdRecentRows.map(function(row) {
    return '<div class="qd-history-item">' +
      '<div>' +
        '<div class="qd-history-title">' + escQd(row.customer_name || 'Khách hàng') + '</div>' +
        '<div class="cid">' + escQd(row.ma_don_hang || '-') + ' · ' + escQd(formatQdDateTime(row.time)) + '</div>' +
      '</div>' +
      '<div class="qd-history-points">-' + escQd(formatQdNumber(row.points)) + '</div>' +
    '</div>';
  }).join('');
}

function resetQuyDoiDiem(showMessage) {
  qdCustomer = null;
  qdCard = null;
  qdOrder = null;
  var keyword = document.getElementById('qd-keyword');
  if (keyword) keyword.value = '';
  clearQdFieldError('qd-keyword');
  renderQdCustomer();
  resetQdBillForm();
  if (showMessage) setQdMessage('Đã xóa thông tin tra cứu.', 'inf');
}

function resetQdBillForm() {
  var form = document.getElementById('qd-bill-form');
  if (!form) return;
  form.reset();
  qdOrder = null;
  setQdBillTotalValue(0);
  setQdOrderHint('Nhập mã hóa đơn để hệ thống tự lấy tổng tiền.', '');
  document.getElementById('qd-points-use').disabled = !qdCard || qdCard.trang_thai !== 'hoat_dong';
  clearQdFieldError('qd-order-code');
  clearQdFieldError('qd-points-use');
  updateQdSummary();
}

function normalizeQdCard(value) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] || null) : value;
}

function generateQdOrderCode() {
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  var d = String(now.getDate()).padStart(2, '0');
  var tail = String(now.getTime()).slice(-5);
  return 'DH' + y + m + d + tail;
}

function showQdValidation(validation) {
  clearQdFieldError('qd-keyword');
  clearQdFieldError('qd-order-code');
  clearQdFieldError('qd-points-use');
  Object.keys(validation.errors || {}).forEach(function(id) {
    setQdFieldError(id, validation.errors[id]);
  });
}

function setQdMessage(message, type) {
  var el = document.getElementById('qd-message');
  if (!el) return;
  el.className = 'qd-message ' + (type || 'inf');
  el.textContent = message;
}

function setQdFieldError(id, message) {
  var input = document.getElementById(id);
  var error = document.getElementById(id + '-error');
  if (input) input.classList.toggle('qd-input-invalid', Boolean(message));
  if (error) error.textContent = message || '';
}

function clearQdFieldError(id) {
  setQdFieldError(id, '');
}

function setQdBillTotalValue(value) {
  var input = document.getElementById('qd-bill-total');
  if (!input) return;
  input.value = Number(value || 0) > 0 ? formatQdMoney(value) : '';
}

function setQdOrderHint(message, type) {
  var hint = document.getElementById('qd-order-hint');
  if (!hint) return;
  hint.className = 'fhint qd-order-hint ' + (type || '');
  hint.textContent = message;
}

function setQdBusy(target, busy, text) {
  var el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  el.disabled = busy;
  el.textContent = text;
}

function getQdValue(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function qdConfirmRow(label, value) {
  return '<div class="qd-confirm-row"><span>' + label + '</span><strong>' + value + '</strong></div>';
}

function getQdApplyErrorMessage(error) {
  var raw = error && error.message ? error.message : '';
  if (raw === 'CARD_NOT_ACTIVE') return 'Thẻ thành viên không hoạt động.';
  if (raw === 'NOT_ENOUGH_POINTS') return 'Số điểm hiện có đã thay đổi, không đủ để quy đổi.';
  if (raw === 'ORDER_NOT_FOUND') return 'Không tìm thấy hóa đơn để cập nhật.';
  if (raw === 'ORDER_CUSTOMER_MISMATCH') return 'Mã hóa đơn đã thuộc khách hàng khác.';
  if (raw === 'ORDER_CANCELLED') return 'Không thể cập nhật hóa đơn đã hủy.';
  if (raw.indexOf('duplicate') >= 0) return 'Mã hóa đơn đã tồn tại. Vui lòng kiểm tra lại.';
  return 'Không thể áp dụng quy đổi điểm. Vui lòng thử lại.';
}

function statusQdCardLabel(status) {
  return {
    het_han: 'Hết hạn',
    bi_khoa: 'Bị khóa',
    mat_the: 'Mất thẻ'
  }[status] || status || 'Không hoạt động';
}

function formatQdMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function formatQdNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatQdDateTime(value) {
  var date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escQd(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
