// pages/doi_tra.js
var doiTraOrder = null;
var doiTraCard = null;
var doiTraRankConfig = null;
var doiTraMode = 'return';
var doiTraHandlersReady = false;

registerPage('doi_tra', function() {
  renderDoiTraMarkup();
  bindDoiTraEvents();
  resetDoiTraForm(false);
});

function renderDoiTraMarkup() {
  var pageEl = document.getElementById('page-doi_tra');
  if (!pageEl || document.getElementById('doi_tra-search-form')) return;

  pageEl.innerHTML =
    '<div class="ph">' +
      '<div>' +
        '<div class="ptitle">Xử lý đổi / trả hàng</div>' +
        '<div class="psub">Kiểm tra điều kiện đổi trả, xử lý chênh lệch giá trị và cập nhật điểm tích lũy</div>' +
      '</div>' +
    '</div>' +
    '<div class="doi_tra-grid">' +
      '<div>' +
        '<div class="panel doi_tra-panel">' +
          '<div class="panel-h"><span class="panel-t">Tra cứu hóa đơn</span></div>' +
          '<form class="doi_tra-search" id="doi_tra-search-form" novalidate>' +
            '<div class="fg doi_tra-search-field">' +
              '<label class="fl" for="doi_tra-order-code">Mã hóa đơn</label>' +
              '<input class="fi" id="doi_tra-order-code" type="text" maxlength="15" placeholder="DH2025008" autocomplete="off"/>' +
              '<div class="doi_tra-field-error" id="doi_tra-order-code-error"></div>' +
            '</div>' +
'<button class="btn btn-primary" style="margin-top: 25px;" id="doi_tra-search-button" type="submit">Kiểm tra</button>' +
'<button class="btn btn-outline" style="margin-top: 25px;" id="doi_tra-reset-button" type="button">Nhập lại</button>' +
          '</form>' +
          '<div class="doi_tra-message inf" id="doi_tra-message">Nhập mã hóa đơn để kiểm tra thời hạn và điểm tích lũy.</div>' +
        '</div>' +
        '<div class="panel doi_tra-mode-panel">' +
          '<div class="panel-h"><span class="panel-t">Loại yêu cầu</span></div>' +
          '<div class="doi_tra-mode-row">' +
            '<button class="doi_tra-mode active" id="doi_tra-mode-return" type="button" data-mode="return">Trả hàng</button>' +
            '<button class="doi_tra-mode" id="doi_tra-mode-exchange" type="button" data-mode="exchange">Đổi hàng</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel doi_tra-order-panel">' +
          '<div class="panel-h"><span class="panel-t">Thông tin hóa đơn</span></div>' +
          '<div class="doi_tra-empty" id="doi_tra-empty">Chưa có hóa đơn được chọn.</div>' +
          '<div class="doi_tra-order" id="doi_tra-order" hidden>' +
            '<div class="doi_tra-order-head">' +
              '<div>' +
                '<div class="doi_tra-order-code" id="doi_tra-current-code">DH</div>' +
                '<div class="cid" id="doi_tra-current-customer">Khách hàng</div>' +
              '</div>' +
              '<span class="badge b-done" id="doi_tra-order-status">Hoàn thành</span>' +
            '</div>' +
            '<div class="doi_tra-info-grid">' +
              '<div class="doi_tra-info-item"><span>Ngày mua</span><strong id="doi_tra-buy-date">-</strong></div>' +
              '<div class="doi_tra-info-item"><span>Tuổi hóa đơn</span><strong id="doi_tra-age">-</strong></div>' +
              '<div class="doi_tra-info-item"><span>Tổng tiền</span><strong id="doi_tra-total">0 đ</strong></div>' +
              '<div class="doi_tra-info-item"><span>Điểm hiện có</span><strong id="doi_tra-card-points">0</strong></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel doi_tra-condition-panel">' +
          '<div class="panel-h"><span class="panel-t">Điều kiện sản phẩm</span></div>' +
          '<div class="doi_tra-condition-body">' +
            '<label class="doi_tra-check"><input type="checkbox" id="doi_tra-cond-receipt"/> Có hóa đơn hợp lệ và đúng khách hàng</label>' +
            '<label class="doi_tra-check"><input type="checkbox" id="doi_tra-cond-product"/> Sản phẩm còn nguyên tình trạng được phép đổi/trả</label>' +
            '<label class="doi_tra-check"><input type="checkbox" id="doi_tra-cond-policy"/> Không thuộc nhóm hàng loại trừ đổi/trả</label>' +
            '<div class="doi_tra-exchange-box" id="doi_tra-exchange-box" hidden>' +
              '<div class="fg">' +
                '<label class="fl" for="doi_tra-new-total">Giá trị sản phẩm/đơn mới</label>' +
                '<input class="fi" id="doi_tra-new-total" type="text" inputmode="numeric" placeholder="1500000" autocomplete="off"/>' +
                '<div class="doi_tra-field-error" id="doi_tra-new-total-error"></div>' +
              '</div>' +
              '<div class="doi_tra-diff-row"><span>Chênh lệch giá trị</span><strong id="doi_tra-price-diff">0 đ</strong></div>' +
            '</div>' +
            '<div class="fg doi_tra-reason">' +
              '<label class="fl" for="doi_tra-reason">Lý do xử lý</label>' +
              '<textarea class="fi" id="doi_tra-reason" rows="3" maxlength="240" placeholder="Ví dụ: Khách đổi sản phẩm do lỗi kích cỡ"></textarea>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="panel doi_tra-point-panel">' +
          '<div class="panel-h"><span class="panel-t">Tính toán điểm</span></div>' +
          '<div class="doi_tra-points">' +
            '<div class="doi_tra-point-row"><span id="doi_tra-refund-label">Điểm đã dùng cần hoàn</span><strong class="green" id="doi_tra-refund-points">0</strong></div>' +
            '<div class="doi_tra-point-row"><span id="doi_tra-reclaim-label">Điểm đã cộng cần thu hồi</span><strong class="red" id="doi_tra-reclaim-points">0</strong></div>' +
            '<div class="doi_tra-point-row final"><span>Điều chỉnh ròng</span><strong id="doi_tra-net-points">0</strong></div>' +
            '<div class="doi_tra-point-row"><span>Số dư sau xử lý</span><strong id="doi_tra-balance-after">0</strong></div>' +
          '</div>' +
          '<div class="doi_tra-actions">' +
            '<button class="btn btn-primary" id="doi_tra-process-button" type="button" disabled>Xác nhận xử lý</button>' +
          '</div>' +
        '</div>' +
        '<div class="doi_tra-rule-box">' +
          '<b>Quy tắc:</b> trả hàng hoàn điểm đã dùng và thu hồi điểm đã cộng. Đổi hàng tính lại điểm theo giá trị mới, sau đó cộng/trừ phần chênh lệch điểm.' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-doi-tra">' +
      '<div class="modal">' +
        '<div class="mh">' +
          '<div class="mt">Xác nhận xử lý đổi/trả</div>' +
          '<button class="mc" type="button" onclick="closeModal(\'modal-doi-tra\')">X</button>' +
        '</div>' +
        '<div class="doi_tra-confirm" id="doi_tra-confirm"></div>' +
        '<div class="mf">' +
          '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-doi-tra\')">Hủy</button>' +
          '<button class="btn btn-primary" id="doi_tra-confirm-button" type="button">Xử lý</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function bindDoiTraEvents() {
  if (doiTraHandlersReady) return;

  document.getElementById('doi_tra-search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    loadDoiTraOrder();
  });

  document.getElementById('doi_tra-order-code').addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    clearDoiTraFieldError('doi_tra-order-code');
  });

  ['doi_tra-cond-receipt', 'doi_tra-cond-product', 'doi_tra-cond-policy'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', updateDoiTraProcessState);
  });

  document.querySelectorAll('.doi_tra-mode').forEach(function(button) {
    button.addEventListener('click', function() {
      setDoiTraMode(this.dataset.mode || 'return');
    });
  });

  document.getElementById('doi_tra-new-total').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    clearDoiTraFieldError('doi_tra-new-total');
    updateDoiTraPoints();
    updateDoiTraProcessState();
  });

  document.getElementById('doi_tra-reset-button').addEventListener('click', function() {
    resetDoiTraForm(true);
  });

  document.getElementById('doi_tra-process-button').addEventListener('click', openDoiTraConfirm);
  document.getElementById('doi_tra-confirm-button').addEventListener('click', processDoiTraReturn);

  doiTraHandlersReady = true;
}

async function loadDoiTraOrder() {
  var code = getDoiTraValue('doi_tra-order-code').toUpperCase();
  if (!code) {
    setDoiTraFieldError('doi_tra-order-code', 'Vui lòng nhập mã hóa đơn.');
    setDoiTraMessage('Vui lòng nhập mã hóa đơn để kiểm tra.', 'err');
    return;
  }

  setDoiTraBusy('doi_tra-search-button', true, 'Đang kiểm tra...');
  setDoiTraMessage('Đang kiểm tra hóa đơn...', 'inf');

  try {
    var rows = await sbGet(
      'don_hang',
      'ma_don_hang=eq.' + encodeURIComponent(code) +
        '&select=ma_don_hang,ma_kh,ma_nv_thu_ngan,ngay_mua,tong_tien,diem_da_dung,diem_duoc_cong,trang_thai,ghi_chu,khach_hang(ho_ten,so_dien_thoai)&limit=1'
    );
    var order = rows && rows.length ? rows[0] : null;
    if (!order) {
      doiTraOrder = null;
      doiTraCard = null;
      renderDoiTraOrder();
      setDoiTraFieldError('doi_tra-order-code', 'Không tìm thấy hóa đơn.');
      setDoiTraMessage('Không tìm thấy hóa đơn phù hợp.', 'err');
      return;
    }

    var cards = await sbGet(
      'the_thanh_vien',
      'ma_kh=eq.' + encodeURIComponent(order.ma_kh) + '&select=ma_the,ma_kh,hang,so_diem,trang_thai&limit=1'
    );
    doiTraOrder = order;
    doiTraCard = cards && cards.length ? cards[0] : null;
    doiTraRankConfig = await loadDoiTraRankConfig(doiTraCard);
    renderDoiTraOrder();

    var validation = validateDoiTraOrderOnly();
    if (!validation.valid) {
      setDoiTraMessage(validation.message, 'err');
    } else {
      setDoiTraMessage('Hóa đơn hợp lệ. Vui lòng kiểm tra điều kiện sản phẩm.', 'ok');
    }
    updateDoiTraProcessState();
  } catch (error) {
    console.error(error);
    setDoiTraMessage('Không thể kiểm tra hóa đơn. Vui lòng thử lại.', 'err');
    showToast('Lỗi kiểm tra hóa đơn', 'err');
  } finally {
    setDoiTraBusy('doi_tra-search-button', false, 'Kiểm tra');
  }
}

function renderDoiTraOrder() {
  var empty = document.getElementById('doi_tra-empty');
  var panel = document.getElementById('doi_tra-order');
  if (!empty || !panel) return;

  if (!doiTraOrder) {
    empty.hidden = false;
    panel.hidden = true;
    updateDoiTraPoints();
    return;
  }

  var customer = doiTraOrder.khach_hang || {};
  empty.hidden = true;
  panel.hidden = false;
  document.getElementById('doi_tra-current-code').textContent = doiTraOrder.ma_don_hang;
  document.getElementById('doi_tra-current-customer').textContent =
    (customer.ho_ten || 'Khách hàng') + ' · ' + (doiTraOrder.ma_kh || '-') + ' · ' + (customer.so_dien_thoai || '-');
  document.getElementById('doi_tra-buy-date').textContent = formatDoiTraDateTime(doiTraOrder.ngay_mua);
  document.getElementById('doi_tra-age').textContent = getDoiTraOrderAgeText();
  document.getElementById('doi_tra-total').textContent = formatDoiTraMoney(doiTraOrder.tong_tien);
  document.getElementById('doi_tra-card-points').textContent = doiTraCard ? formatDoiTraNumber(doiTraCard.so_diem) : 'Chưa có thẻ';

  var status = document.getElementById('doi_tra-order-status');
  status.className = 'badge ' + getDoiTraStatusClass(doiTraOrder.trang_thai);
  status.textContent = getDoiTraStatusLabel(doiTraOrder.trang_thai);

  updateDoiTraPoints();
}

function updateDoiTraPoints() {
  var calc = calculateDoiTraPoints();
  var priceDiff = calc.newTotal - calc.oldTotal;
  var diffEl = document.getElementById('doi_tra-price-diff');
  if (diffEl) {
    diffEl.textContent = (priceDiff > 0 ? '+' : '') + formatDoiTraMoney(priceDiff);
    diffEl.className = priceDiff > 0 ? 'positive' : (priceDiff < 0 ? 'negative' : '');
  }
  document.getElementById('doi_tra-refund-label').textContent = doiTraMode === 'exchange' ? 'Điểm mới theo giá trị đổi' : 'Điểm đã dùng cần hoàn';
  document.getElementById('doi_tra-reclaim-label').textContent = doiTraMode === 'exchange' ? 'Điểm đã cộng trước đó' : 'Điểm đã cộng cần thu hồi';
  document.getElementById('doi_tra-refund-points').textContent = '+' + formatDoiTraNumber(calc.refund);
  document.getElementById('doi_tra-reclaim-points').textContent = '-' + formatDoiTraNumber(calc.reclaim);
  document.getElementById('doi_tra-net-points').textContent = (calc.net > 0 ? '+' : '') + formatDoiTraNumber(calc.net);
  document.getElementById('doi_tra-balance-after').textContent = formatDoiTraNumber(calc.balanceAfter);
}

function calculateDoiTraPoints() {
  var oldTotal = doiTraOrder ? Number(doiTraOrder.tong_tien || 0) : 0;
  var newTotal = doiTraMode === 'exchange' ? getDoiTraNewTotal() : 0;
  var oldEarned = doiTraOrder ? Number(doiTraOrder.diem_duoc_cong || 0) : 0;
  var newEarned = doiTraMode === 'exchange' ? calculateDoiTraEarnedPoints(newTotal) : 0;
  var refund = doiTraMode === 'exchange' ? newEarned : (doiTraOrder ? Number(doiTraOrder.diem_da_dung || 0) : 0);
  var reclaim = doiTraMode === 'exchange' ? oldEarned : oldEarned;
  var balance = doiTraCard ? Number(doiTraCard.so_diem || 0) : 0;
  var net = refund - reclaim;
  return {
    refund: refund,
    reclaim: reclaim,
    net: net,
    balanceAfter: balance + net,
    oldTotal: oldTotal,
    newTotal: newTotal,
    oldEarned: oldEarned,
    newEarned: newEarned
  };
}

function validateDoiTraOrderOnly() {
  if (!doiTraOrder) return { valid: false, message: 'Vui lòng kiểm tra hóa đơn trước.' };
  if (!doiTraCard) return { valid: false, message: 'Khách hàng chưa có thẻ thành viên để cập nhật điểm.' };
  if (doiTraOrder.trang_thai === 'da_doi_tra') return { valid: false, message: 'Hóa đơn này đã được xử lý đổi/trả.' };
  if (doiTraOrder.trang_thai === 'da_huy') return { valid: false, message: 'Không thể trả hàng cho hóa đơn đã hủy.' };
  if (!isDoiTraWithin15Days()) return { valid: false, message: 'Hóa đơn đã quá hạn 15 ngày.' };
  if (doiTraMode === 'exchange' && getDoiTraNewTotal() <= 0) {
    return { valid: false, message: 'Vui lòng nhập giá trị sản phẩm/đơn mới.' };
  }
  if (calculateDoiTraPoints().balanceAfter < 0) {
    return { valid: false, message: 'Số điểm hiện có không đủ để thu hồi điểm đã cộng.' };
  }
  return { valid: true, message: '' };
}

function validateDoiTraAll() {
  var base = validateDoiTraOrderOnly();
  if (!base.valid) return base;
  if (!document.getElementById('doi_tra-cond-receipt').checked) return { valid: false, message: 'Vui lòng xác nhận hóa đơn hợp lệ.' };
  if (!document.getElementById('doi_tra-cond-product').checked) return { valid: false, message: 'Vui lòng xác nhận điều kiện sản phẩm.' };
  if (!document.getElementById('doi_tra-cond-policy').checked) return { valid: false, message: 'Vui lòng xác nhận sản phẩm không thuộc nhóm loại trừ.' };
  return { valid: true, message: '' };
}

function updateDoiTraProcessState() {
  var button = document.getElementById('doi_tra-process-button');
  if (!button) return;
  button.disabled = !validateDoiTraAll().valid;
}

function openDoiTraConfirm() {
  var validation = validateDoiTraAll();
  if (!validation.valid) {
    setDoiTraMessage(validation.message, 'err');
    return;
  }

  var calc = calculateDoiTraPoints();
  document.getElementById('doi_tra-confirm').innerHTML =
    '<div class="doi_tra-confirm-list">' +
      confirmDoiTraRow('Mã hóa đơn', escDoiTra(doiTraOrder.ma_don_hang)) +
      confirmDoiTraRow('Khách hàng', escDoiTra((doiTraOrder.khach_hang || {}).ho_ten || doiTraOrder.ma_kh)) +
      confirmDoiTraRow('Loại xử lý', doiTraMode === 'exchange' ? 'Đổi hàng' : 'Trả hàng') +
      (doiTraMode === 'exchange' ? confirmDoiTraRow('Chênh lệch giá trị', (calc.newTotal - calc.oldTotal > 0 ? '+' : '') + formatDoiTraMoney(calc.newTotal - calc.oldTotal)) : '') +
      confirmDoiTraRow(doiTraMode === 'exchange' ? 'Điểm mới theo giá trị đổi' : 'Điểm hoàn lại', '+' + formatDoiTraNumber(calc.refund)) +
      confirmDoiTraRow(doiTraMode === 'exchange' ? 'Điểm đã cộng trước đó' : 'Điểm thu hồi', '-' + formatDoiTraNumber(calc.reclaim)) +
      confirmDoiTraRow('Điều chỉnh ròng', (calc.net > 0 ? '+' : '') + formatDoiTraNumber(calc.net)) +
      confirmDoiTraRow('Số dư sau xử lý', formatDoiTraNumber(calc.balanceAfter)) +
    '</div>';
  openModal('modal-doi-tra');
}

async function processDoiTraReturn() {
  var validation = validateDoiTraAll();
  if (!validation.valid) {
    closeModal('modal-doi-tra');
    setDoiTraMessage(validation.message, 'err');
    updateDoiTraProcessState();
    return;
  }

  var startedAt = performance.now();
  var button = document.getElementById('doi_tra-confirm-button');
  setDoiTraBusy(button, true, 'Đang xử lý...');

  try {
    var freshOrders = await sbGet(
      'don_hang',
      'ma_don_hang=eq.' + encodeURIComponent(doiTraOrder.ma_don_hang) +
        '&select=ma_don_hang,ma_kh,ngay_mua,tong_tien,diem_da_dung,diem_duoc_cong,trang_thai,ghi_chu&limit=1'
    );
    var freshOrder = freshOrders && freshOrders.length ? freshOrders[0] : null;
    if (!freshOrder) throw new Error('ORDER_NOT_FOUND');
    doiTraOrder = Object.assign({}, doiTraOrder, freshOrder);

    var freshCards = await sbGet(
      'the_thanh_vien',
      'ma_kh=eq.' + encodeURIComponent(freshOrder.ma_kh) + '&select=ma_the,ma_kh,hang,so_diem,trang_thai&limit=1'
    );
    doiTraCard = freshCards && freshCards.length ? freshCards[0] : null;
    doiTraRankConfig = await loadDoiTraRankConfig(doiTraCard);

    var recheck = validateDoiTraAll();
    if (!recheck.valid) throw new Error(recheck.message);

    var calc = calculateDoiTraPoints();
    var nv = typeof getCurrentNV === 'function' ? getCurrentNV() : null;
    var reason = getDoiTraValue('doi_tra-reason') || (doiTraMode === 'exchange' ? 'Khách đổi hàng' : 'Khách trả hàng');
    var notePrefix = doiTraMode === 'exchange' ? 'Đổi hàng' : 'Trả hàng';
    var note = notePrefix + ': ' + reason + (nv && nv.ma_nv ? ' · CSKH ' + nv.ma_nv : '');

    await sbUpdate(
      'the_thanh_vien',
      'ma_the=eq.' + encodeURIComponent(doiTraCard.ma_the),
      { so_diem: calc.balanceAfter }
    );

    await sbUpdate(
      'don_hang',
      'ma_don_hang=eq.' + encodeURIComponent(freshOrder.ma_don_hang),
      {
        tong_tien: doiTraMode === 'exchange' ? calc.newTotal : freshOrder.tong_tien,
        diem_duoc_cong: doiTraMode === 'exchange' ? calc.newEarned : freshOrder.diem_duoc_cong,
        trang_thai: 'da_doi_tra',
        ghi_chu: appendDoiTraNote(freshOrder.ghi_chu, note)
      }
    );

    await sbInsert('lich_su_giao_dich_diem', {
      ma_the: doiTraCard.ma_the,
      ma_don_hang: freshOrder.ma_don_hang,
      loai_gd: 'dieu_chinh',
      so_diem: calc.net,
      so_du_sau_gd: calc.balanceAfter,
      ghi_chu: note
    });

    doiTraOrder.trang_thai = 'da_doi_tra';
    if (doiTraMode === 'exchange') {
      doiTraOrder.tong_tien = calc.newTotal;
      doiTraOrder.diem_duoc_cong = calc.newEarned;
    }
    doiTraOrder.ghi_chu = appendDoiTraNote(freshOrder.ghi_chu, note);
    doiTraCard.so_diem = calc.balanceAfter;
    renderDoiTraOrder();
    closeModal('modal-doi-tra');

    var elapsed = Math.round(performance.now() - startedAt);
    setDoiTraSpeed(elapsed);
    setDoiTraMessage('Đã xử lý ' + (doiTraMode === 'exchange' ? 'đổi hàng' : 'trả hàng') + ' và cập nhật điểm trong ' + elapsed + ' ms.', elapsed <= 2000 ? 'ok' : 'wrn');
    showToast('Xử lý đổi/trả thành công', 'ok');
    updateDoiTraProcessState();
  } catch (error) {
    console.error(error);
    var message = getDoiTraErrorMessage(error);
    setDoiTraMessage(message, 'err');
    showToast(message, 'err');
  } finally {
    setDoiTraBusy(button, false, 'Xử lý');
  }
}

function resetDoiTraForm(showMessage) {
  doiTraOrder = null;
  doiTraCard = null;
  doiTraRankConfig = null;
  setDoiTraMode('return', true);
  var form = document.getElementById('doi_tra-search-form');
  if (form) form.reset();
  ['doi_tra-cond-receipt', 'doi_tra-cond-product', 'doi_tra-cond-policy'].forEach(function(id) {
    var input = document.getElementById(id);
    if (input) input.checked = false;
  });
  var reason = document.getElementById('doi_tra-reason');
  if (reason) reason.value = '';
  var newTotal = document.getElementById('doi_tra-new-total');
  if (newTotal) newTotal.value = '';
  clearDoiTraFieldError('doi_tra-new-total');
  clearDoiTraFieldError('doi_tra-order-code');
  renderDoiTraOrder();
  updateDoiTraProcessState();
  setDoiTraSpeed(null);
  if (showMessage) setDoiTraMessage('Đã xóa dữ liệu xử lý.', 'inf');
}

function setDoiTraMode(mode, silent) {
  doiTraMode = mode === 'exchange' ? 'exchange' : 'return';
  document.querySelectorAll('.doi_tra-mode').forEach(function(button) {
    button.classList.toggle('active', button.dataset.mode === doiTraMode);
  });

  var exchangeBox = document.getElementById('doi_tra-exchange-box');
  if (exchangeBox) exchangeBox.hidden = doiTraMode !== 'exchange';

  var processButton = document.getElementById('doi_tra-process-button');
  if (processButton) processButton.textContent = doiTraMode === 'exchange' ? 'Xác nhận đổi hàng' : 'Xác nhận trả hàng';

  var reason = document.getElementById('doi_tra-reason');
  if (reason) {
    reason.placeholder = doiTraMode === 'exchange'
      ? 'Ví dụ: Khách đổi sang sản phẩm cùng nhóm, bù chênh lệch'
      : 'Ví dụ: Khách trả toàn bộ đơn hàng do sản phẩm lỗi';
  }

  clearDoiTraFieldError('doi_tra-new-total');
  updateDoiTraPoints();
  updateDoiTraProcessState();
  if (!silent && doiTraOrder) {
    setDoiTraMessage('Đã chuyển sang chế độ ' + (doiTraMode === 'exchange' ? 'đổi hàng.' : 'trả hàng.'), 'inf');
  }
}

async function loadDoiTraRankConfig(card) {
  if (!card || !card.hang) return null;
  try {
    var rows = await sbGet(
      'cau_hinh_hang_thanh_vien',
      'hang=eq.' + encodeURIComponent(card.hang) + '&select=hang,he_so_tich_diem&limit=1'
    );
    return rows && rows.length ? rows[0] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getDoiTraNewTotal() {
  return Number(getDoiTraValue('doi_tra-new-total') || 0);
}

function calculateDoiTraEarnedPoints(total) {
  var coefficient = doiTraRankConfig ? Number(doiTraRankConfig.he_so_tich_diem || 1) : 1;
  return Math.floor(Number(total || 0) / 10000 * coefficient);
}

function isDoiTraWithin15Days() {
  if (!doiTraOrder || !doiTraOrder.ngay_mua) return false;
  var boughtAt = new Date(doiTraOrder.ngay_mua);
  if (isNaN(boughtAt.getTime())) return false;
  var ageMs = Date.now() - boughtAt.getTime();
  return ageMs >= 0 && ageMs <= 15 * 24 * 60 * 60 * 1000;
}

function getDoiTraOrderAgeText() {
  if (!doiTraOrder || !doiTraOrder.ngay_mua) return '-';
  var boughtAt = new Date(doiTraOrder.ngay_mua);
  if (isNaN(boughtAt.getTime())) return '-';
  var days = Math.floor((Date.now() - boughtAt.getTime()) / (24 * 60 * 60 * 1000));
  return days < 0 ? 'Chưa đến ngày mua' : days + ' ngày';
}

function appendDoiTraNote(oldNote, newNote) {
  return oldNote ? oldNote + '\n' + newNote : newNote;
}

function confirmDoiTraRow(label, value) {
  return '<div class="doi_tra-confirm-row"><span>' + label + '</span><strong>' + value + '</strong></div>';
}

function setDoiTraMessage(message, type) {
  var el = document.getElementById('doi_tra-message');
  if (!el) return;
  el.className = 'doi_tra-message ' + (type || 'inf');
  el.textContent = message;
}

function setDoiTraSpeed(elapsed) {
  var el = document.getElementById('doi_tra-speed-box');
  if (!el) return;
  if (elapsed == null) {
    el.className = 'doi_tra-speed-box';
    el.textContent = 'Mục tiêu xử lý: dưới 2 giây sau khi bấm xác nhận.';
    return;
  }
  el.className = 'doi_tra-speed-box ' + (elapsed <= 2000 ? 'ok' : 'wrn');
  el.textContent = 'Thời gian xử lý gần nhất: ' + elapsed + ' ms' + (elapsed <= 2000 ? ' · đạt mục tiêu' : ' · vượt mục tiêu 2 giây');
}

function setDoiTraFieldError(id, message) {
  var input = document.getElementById(id);
  var error = document.getElementById(id + '-error');
  if (input) input.classList.toggle('doi_tra-input-invalid', Boolean(message));
  if (error) error.textContent = message || '';
}

function clearDoiTraFieldError(id) {
  setDoiTraFieldError(id, '');
}

function setDoiTraBusy(target, busy, text) {
  var el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  el.disabled = busy;
  el.textContent = text;
}

function getDoiTraValue(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getDoiTraErrorMessage(error) {
  var raw = error && error.message ? error.message : '';
  if (raw === 'ORDER_NOT_FOUND') return 'Không tìm thấy hóa đơn để cập nhật.';
  if (raw.indexOf('15 ngày') >= 0) return raw;
  if (raw.indexOf('Số điểm') >= 0) return raw;
  if (raw.indexOf('đã được xử lý') >= 0) return raw;
  return 'Không thể xử lý trả hàng. Vui lòng thử lại.';
}

function getDoiTraStatusLabel(status) {
  return {
    hoan_thanh: 'Hoàn thành',
    da_huy: 'Đã hủy',
    dang_xu_ly: 'Đang xử lý',
    da_doi_tra: 'Đã đổi/trả'
  }[status] || status || '-';
}

function getDoiTraStatusClass(status) {
  return {
    hoan_thanh: 'b-done',
    da_huy: 'b-err',
    dang_xu_ly: 'b-pend',
    da_doi_tra: 'b-ended'
  }[status] || 'b-normal';
}

function formatDoiTraMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function formatDoiTraNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDoiTraDateTime(value) {
  var date = new Date(value);
  if (isNaN(date.getTime())) return value || '-';
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escDoiTra(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
