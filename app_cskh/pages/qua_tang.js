// pages/qua_tang.js - Quan ly chuong trinh qua tang va su kien
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
        '<div class="ptitle">Qua tang va Su kien</div>' +
        '<div class="psub">Tao chuong trinh cho khach hang thanh vien, quan ly qua doi diem va trang thai hien thi tren App KH</div>' +
      '</div>' +
      '<div class="srow">' +
        '<button class="btn btn-outline btn-sm" type="button" id="qua_tang-refresh">Tai lai</button>' +
        '<button class="btn btn-primary" type="button" id="qua_tang-create">Tao chuong trinh</button>' +
      '</div>' +
    '</div>' +
    '<div class="qua_tang-stats">' +
      '<div class="qua_tang-stat"><span id="qua_tang-stat-active">0</span><small>Dang hien thi</small></div>' +
      '<div class="qua_tang-stat"><span id="qua_tang-stat-ended">0</span><small>Da ket thuc</small></div>' +
      '<div class="qua_tang-stat"><span id="qua_tang-stat-stock">0</span><small>Tong so luong qua</small></div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-h">' +
        '<span class="panel-t">Danh sach chuong trinh</span>' +
        '<span class="panel-a" id="qua_tang-count">0 chuong trinh</span>' +
      '</div>' +
      '<div class="qua_tang-message inf" id="qua_tang-message">Dang tai du lieu...</div>' +
      '<div class="qua_tang-table-wrap">' +
        '<table class="tbl qua_tang-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Chuong trinh</th>' +
              '<th>Thoi gian</th>' +
              '<th>Qua / diem doi</th>' +
              '<th>So luong</th>' +
              '<th>Trang thai</th>' +
              '<th>Thao tac</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="qua_tang-tbody">' +
            '<tr><td colspan="6" class="qua_tang-empty">Dang tai du lieu...</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-qua-tang">' +
      '<div class="modal wide">' +
        '<form id="qua_tang-form" novalidate>' +
          '<div class="mh">' +
            '<div>' +
              '<div class="mt" id="qua_tang-modal-title">Tao chuong trinh</div>' +
              '<div class="cid">Thong tin nay se duoc hien thi tren App KH khi chuong trinh hoat dong.</div>' +
            '</div>' +
            '<button class="mc" type="button" onclick="closeModal(\'modal-qua-tang\')">X</button>' +
          '</div>' +
          '<div class="fgrid">' +
            '<input id="qua_tang-program-id" type="hidden"/>' +
            '<input id="qua_tang-gift-id" type="hidden"/>' +
            '<div class="fg ffull">' +
              '<label class="fl" for="qua_tang-name">Ten chuong trinh <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-name" maxlength="200" placeholder="VD: Tuan le tri an thanh vien" autocomplete="off"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-name-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-start">Ngay bat dau <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-start" type="date"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-start-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-end">Ngay ket thuc <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-end" type="date"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-end-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-type">Loai chuong trinh</label>' +
              '<select class="fi" id="qua_tang-type">' +
                '<option value="tang_qua">Tang qua / su kien</option>' +
                '<option value="giam_gia">Giam gia</option>' +
                '<option value="tich_diem_bo">Tich diem bo sung</option>' +
                '<option value="su_kien">Su kien thanh vien</option>' +
              '</select>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-rank">Hang toi thieu</label>' +
              '<select class="fi" id="qua_tang-rank">' +
                '<option value="">Tat ca thanh vien</option>' +
                '<option value="Bronze">Bronze</option>' +
                '<option value="Silver">Silver</option>' +
                '<option value="Gold">Gold</option>' +
                '<option value="Platinum">Platinum</option>' +
              '</select>' +
            '</div>' +
            '<div class="fg ffull">' +
              '<label class="fl" for="qua_tang-condition">Dieu kien ap dung <span class="req">*</span></label>' +
              '<textarea class="fi" id="qua_tang-condition" maxlength="500" rows="3" placeholder="VD: Thanh vien co the dang hoat dong, moi KH doi toi da 1 phan"></textarea>' +
              '<div class="qua_tang-field-error" id="qua_tang-condition-error"></div>' +
            '</div>' +
            '<div class="fg ffull">' +
              '<label class="fl" for="qua_tang-desc">Mo ta hien thi tren App KH</label>' +
              '<textarea class="fi" id="qua_tang-desc" maxlength="800" rows="3" placeholder="Noi dung gioi thieu ngan gon cho khach hang"></textarea>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-gift-name">Ten qua / voucher <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-gift-name" maxlength="200" placeholder="VD: Voucher giam 100.000d"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-gift-name-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-gift-type">Loai qua</label>' +
              '<select class="fi" id="qua_tang-gift-type">' +
                '<option value="voucher_giam_gia">Voucher giam gia</option>' +
                '<option value="qua_hien_vat">Qua hien vat</option>' +
                '<option value="uu_dai_dich_vu">Uu dai dich vu</option>' +
              '</select>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-points">Diem doi <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-points" type="number" min="1" step="1" placeholder="200"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-points-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-stock">So luong <span class="req">*</span></label>' +
              '<input class="fi" id="qua_tang-stock" type="number" min="1" step="1" placeholder="100"/>' +
              '<div class="qua_tang-field-error" id="qua_tang-stock-error"></div>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-value">Gia tri voucher / qua</label>' +
              '<input class="fi" id="qua_tang-value" type="number" min="0" step="1000" placeholder="100000"/>' +
            '</div>' +
            '<div class="fg">' +
              '<label class="fl" for="qua_tang-voucher-days">Han voucher (ngay)</label>' +
              '<input class="fi" id="qua_tang-voucher-days" type="number" min="1" step="1" placeholder="30"/>' +
              '<div class="fhint">Chi ap dung khi loai qua la voucher.</div>' +
            '</div>' +
          '</div>' +
          '<div class="mf">' +
            '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-qua-tang\')">Huy</button>' +
            '<button class="btn btn-primary" id="qua_tang-save" type="submit">Luu chuong trinh</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>' +
    '<div class="ov" id="modal-qua-tang-end">' +
      '<div class="modal">' +
        '<div class="mh">' +
          '<div>' +
            '<div class="mt">Ket thuc chuong trinh</div>' +
            '<div class="cid" id="qua_tang-end-sub">Chuong trinh se ngung hien thi tren App KH.</div>' +
          '</div>' +
          '<button class="mc" type="button" onclick="closeModal(\'modal-qua-tang-end\')">X</button>' +
        '</div>' +
        '<div class="qua_tang-end-body">Ban co chac muon ket thuc chuong trinh nay?</div>' +
        '<div class="mf">' +
          '<button class="btn btn-outline" type="button" onclick="closeModal(\'modal-qua-tang-end\')">Huy</button>' +
          '<button class="btn btn-danger" id="qua_tang-end-confirm" type="button">Ket thuc</button>' +
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
  setQuaTangMessage('Dang tai du lieu...', 'inf');
  var tbody = document.getElementById('qua_tang-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="qua_tang-empty">Dang tai du lieu...</td></tr>';

  try {
    var programs = await sbGet(
      'chuong_trinh_khuyen_mai',
      'select=ma_chuong_trinh,ten_chuong_trinh,loai,dieu_kien_ap_dung,hang_toi_thieu,ngay_bat_dau,ngay_ket_thuc,trang_thai,mo_ta,qua_tang(ma_qua,ten_qua,loai,so_diem_quy_doi,so_luong_ton,gia_tri,thoi_han_voucher,trang_thai)' +
        '&order=ngay_bat_dau.desc'
    );
    quaTangRows = programs || [];
    renderQuaTangRows();
    setQuaTangMessage(quaTangRows.length ? 'Da tai danh sach chuong trinh.' : 'Chua co chuong trinh nao.', quaTangRows.length ? 'ok' : 'inf');
  } catch (error) {
    console.error(error);
    setQuaTangMessage('Khong tai duoc danh sach chuong trinh.', 'err');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="qua_tang-empty">Khong tai duoc du lieu.</td></tr>';
  }
}

function renderQuaTangRows() {
  var tbody = document.getElementById('qua_tang-tbody');
  var count = document.getElementById('qua_tang-count');
  if (!tbody) return;

  if (count) count.textContent = quaTangRows.length + ' chuong trinh';
  renderQuaTangStats();

  if (!quaTangRows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="qua_tang-empty">Chua co chuong trinh nao.</td></tr>';
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
          '<div class="cid">den ' + escQuaTang(formatQuaTangDate(row.ngay_ket_thuc)) + '</div>' +
        '</td>' +
        '<td>' +
          '<div class="cname">' + escQuaTang(gift.ten_qua || 'Chua co qua') + '</div>' +
          '<div class="cid">' + escQuaTang(giftTypeLabel(gift.loai)) + ' · ' + formatQuaTangNumber(gift.so_diem_quy_doi) + ' diem</div>' +
        '</td>' +
        '<td>' + formatQuaTangNumber(gift.so_luong_ton) + '</td>' +
        '<td><span class="' + statusQuaTangClass(row.trang_thai) + '">' + escQuaTang(statusQuaTangLabel(row.trang_thai)) + '</span></td>' +
        '<td>' +
          '<div class="srow">' +
            '<button class="btn btn-outline btn-sm" type="button" data-qt-action="edit" data-qt-id="' + escAttrQuaTang(row.ma_chuong_trinh) + '">Sua</button>' +
            (row.trang_thai === 'ket_thuc'
              ? ''
              : '<button class="btn btn-danger btn-sm" type="button" data-qt-action="end" data-qt-id="' + escAttrQuaTang(row.ma_chuong_trinh) + '">Ket thuc</button>') +
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
  document.getElementById('qua_tang-modal-title').textContent = row ? 'Chinh sua chuong trinh' : 'Tao chuong trinh';
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
    setQuaTangMessage('Vui long kiem tra lai cac thong tin bat buoc.', 'err');
    return;
  }

  setQuaTangBusy('qua_tang-save', true, 'Dang luu...');

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
      showToast('Da cap nhat chuong trinh', 'ok');
    } else {
      await sbInsert('chuong_trinh_khuyen_mai', programBody);
      await sbInsert('qua_tang', giftBody);
      showToast('Da tao chuong trinh', 'ok');
    }

    closeModal('modal-qua-tang');
    await loadQuaTangPrograms();
  } catch (error) {
    console.error(error);
    setQuaTangMessage(getQuaTangErrorMessage(error), 'err');
    showToast('Luu chuong trinh that bai', 'err');
  } finally {
    setQuaTangBusy('qua_tang-save', false, 'Luu chuong trinh');
  }
}

function openEndQuaTang(row) {
  if (!row) return;
  quaTangEndingId = row.ma_chuong_trinh;
  setTextQuaTang('qua_tang-end-sub', row.ten_chuong_trinh + ' se ngung hien thi tren App KH.');
  openModal('modal-qua-tang-end');
}

async function endQuaTangProgram() {
  if (!quaTangEndingId) return;
  setQuaTangBusy('qua_tang-end-confirm', true, 'Dang ket thuc...');

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
    showToast('Da ket thuc chuong trinh', 'ok');
    quaTangEndingId = null;
    await loadQuaTangPrograms();
  } catch (error) {
    console.error(error);
    showToast('Ket thuc chuong trinh that bai', 'err');
  } finally {
    setQuaTangBusy('qua_tang-end-confirm', false, 'Ket thuc');
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
  if (!data.name) errors['qua_tang-name'] = 'Vui long nhap ten chuong trinh.';
  if (!data.start) errors['qua_tang-start'] = 'Vui long chon ngay bat dau.';
  if (!data.end) errors['qua_tang-end'] = 'Vui long chon ngay ket thuc.';
  if (data.start && data.end && data.end <= data.start) errors['qua_tang-end'] = 'Ngay ket thuc phai sau ngay bat dau.';
  if (!data.condition) errors['qua_tang-condition'] = 'Vui long nhap dieu kien ap dung.';
  if (!data.giftName) errors['qua_tang-gift-name'] = 'Vui long nhap ten qua.';
  if (!Number.isInteger(data.points) || data.points <= 0) errors['qua_tang-points'] = 'Diem doi phai lon hon 0.';
  if (!Number.isInteger(data.stock) || data.stock <= 0) errors['qua_tang-stock'] = 'So luong phai lon hon 0.';
  if (data.giftType === 'voucher_giam_gia' && data.voucherDays && data.voucherDays <= 0) errors['qua_tang-voucher-days'] = 'Han voucher phai lon hon 0.';
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
  if (raw.indexOf('ngay_ket_thuc') >= 0 || raw.indexOf('check') >= 0) return 'Ngay ket thuc phai sau ngay bat dau.';
  if (raw.indexOf('duplicate key') >= 0) return 'Ma chuong trinh bi trung. Vui long luu lai.';
  if (raw.indexOf('permission denied') >= 0 || raw.indexOf('row-level security') >= 0) return 'Tai khoan hien tai khong co quyen luu chuong trinh.';
  return 'Khong the luu chuong trinh. Vui long thu lai.';
}

function programTypeLabel(type) {
  return {
    tang_qua: 'Tang qua',
    giam_gia: 'Giam gia',
    tich_diem_bo: 'Tich diem bo sung',
    su_kien: 'Su kien'
  }[type] || type || '-';
}

function giftTypeLabel(type) {
  return {
    voucher_giam_gia: 'Voucher',
    qua_hien_vat: 'Qua hien vat',
    uu_dai_dich_vu: 'Uu dai dich vu'
  }[type] || type || '-';
}

function statusQuaTangLabel(status) {
  return {
    hoat_dong: 'Hoat dong',
    tam_dung: 'Tam dung',
    ket_thuc: 'Ket thuc'
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
