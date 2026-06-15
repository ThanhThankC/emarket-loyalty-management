// lich_su_mua_hang.js - Tra cuu lich su mua hang cua chinh khach hang
requireLogin();

const purchaseSession = getCurrentNV();
const currentCustomerId = purchaseSession && (purchaseSession.ma_kh || purchaseSession.ma_nv);
const purchasePageSize = 10;
let currentCustomer = null;
let purchasePage = 1;
let purchaseHasNextPage = false;
let lastFilters = null;

function showToast(msg, type = '') {
  const tc = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!currentCustomerId) return;

  bindPurchaseEvents();
  setPurchaseBusy(true);
  try {
    const customers = await sbGet(
      'khach_hang',
      `ma_kh=eq.${encodeURIComponent(currentCustomerId)}&select=ma_kh`
    );
    if (!customers || !customers.length) throw new Error('Không tìm thấy khách hàng.');

    currentCustomer = customers[0];
    lastFilters = collectPurchaseFilters();
    await loadPurchaseOrders();
  } catch (error) {
    console.error(error);
    showPurchaseMessage('Không thể tải hồ sơ hoặc lịch sử mua hàng.', 'error');
    showToast('Không thể tải lịch sử mua hàng', 'err');
  } finally {
    setPurchaseBusy(false);
  }
});

function bindPurchaseEvents() {
  document.getElementById('orderCodeFilter').addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPurchaseFieldError('orderCodeFilter', '');
  });

  ['dateFromFilter', 'dateToFilter', 'statusFilter'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => setPurchaseFieldError(id, ''));
  });

  document.getElementById('orderFilterForm').addEventListener('submit', async event => {
    event.preventDefault();
    const filters = collectPurchaseFilters();
    if (!validatePurchaseFilters(filters)) return;
    purchasePage = 1;
    lastFilters = filters;
    await loadPurchaseOrders();
  });

  document.getElementById('clearFilterButton').addEventListener('click', async () => {
    document.getElementById('orderFilterForm').reset();
    clearPurchaseErrors();
    purchasePage = 1;
    lastFilters = collectPurchaseFilters();
    await loadPurchaseOrders();
  });

  document.getElementById('previousButton').addEventListener('click', async () => {
    if (purchasePage <= 1) return;
    purchasePage -= 1;
    await loadPurchaseOrders();
  });

  document.getElementById('nextButton').addEventListener('click', async () => {
    if (!purchaseHasNextPage) return;
    purchasePage += 1;
    await loadPurchaseOrders();
  });
}

function collectPurchaseFilters() {
  return {
    orderCode: getPurchaseValue('orderCodeFilter').toUpperCase(),
    dateFrom: getPurchaseValue('dateFromFilter'),
    dateTo: getPurchaseValue('dateToFilter'),
    status: getPurchaseValue('statusFilter')
  };
}

function validatePurchaseFilters(filters) {
  clearPurchaseErrors();
  let valid = true;

  if (filters.orderCode && !/^[A-Z0-9-]{2,15}$/.test(filters.orderCode)) {
    setPurchaseFieldError('orderCodeFilter', 'Mã đơn chỉ gồm chữ, số hoặc dấu gạch ngang.');
    valid = false;
  }

  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    setPurchaseFieldError('dateFromFilter', 'Từ ngày không được sau đến ngày.');
    setPurchaseFieldError('dateToFilter', 'Đến ngày không được trước từ ngày.');
    valid = false;
  }

  if (!valid) showPurchaseMessage('Điều kiện tra cứu không hợp lệ.', 'error');
  return valid;
}

async function loadPurchaseOrders() {
  if (!currentCustomer || !lastFilters) return;
  setPurchaseBusy(true);
  showPurchaseMessage('Đang tải danh sách đơn hàng...', 'info');

  try {
    const offset = (purchasePage - 1) * purchasePageSize;
    const params = [
      `ma_kh=eq.${encodeURIComponent(currentCustomer.ma_kh)}`,
      'select=ma_don_hang,ngay_mua,tong_tien,diem_da_dung,diem_duoc_cong,trang_thai',
      'order=ngay_mua.desc',
      `limit=${purchasePageSize + 1}`,
      `offset=${offset}`
    ];

    if (lastFilters.orderCode) params.push(`ma_don_hang=eq.${encodeURIComponent(lastFilters.orderCode)}`);
    if (lastFilters.dateFrom) params.push(`ngay_mua=gte.${encodeURIComponent(lastFilters.dateFrom + 'T00:00:00+07:00')}`);
    if (lastFilters.dateTo) params.push(`ngay_mua=lt.${encodeURIComponent(nextPurchaseDate(lastFilters.dateTo) + 'T00:00:00+07:00')}`);
    if (lastFilters.status) params.push(`trang_thai=eq.${encodeURIComponent(lastFilters.status)}`);

    const orders = await sbGet('don_hang', params.join('&'));
    purchaseHasNextPage = orders.length > purchasePageSize;
    const pageOrders = orders.slice(0, purchasePageSize);
    renderPurchaseOrders(pageOrders);
    updatePurchasePagination();

    if (!pageOrders.length) {
      showPurchaseMessage('Không tìm thấy đơn hàng phù hợp với điều kiện đã nhập.', 'error');
      setPurchaseSummary('Không có kết quả');
    } else {
      showPurchaseMessage('', '');
      setPurchaseSummary(`${pageOrders.length} đơn trên trang ${purchasePage}`);
    }
  } catch (error) {
    console.error(error);
    purchaseHasNextPage = false;
    renderPurchaseOrders([]);
    updatePurchasePagination();
    showPurchaseMessage('Không thể tra cứu đơn hàng. Vui lòng thử lại.', 'error');
    setPurchaseSummary('Tra cứu thất bại');
    showToast('Lỗi tra cứu lịch sử mua hàng', 'err');
  } finally {
    setPurchaseBusy(false);
  }
}

function renderPurchaseOrders(orders) {
  const list = document.getElementById('orderList');
  if (!orders.length) {
    list.innerHTML = '<div class="mua-hang-empty">Không có đơn hàng để hiển thị.</div>';
    return;
  }

  list.innerHTML = orders.map(order => `
    <article class="mua-hang-order">
      <div class="mua-hang-order-head">
        <div>
          <div class="mua-hang-order-code">${escapePurchase(order.ma_don_hang)}</div>
          <div class="mua-hang-order-date">${escapePurchase(formatPurchaseDate(order.ngay_mua))}</div>
        </div>
        <span class="mua-hang-status ${purchaseStatusClass(order.trang_thai)}">${escapePurchase(purchaseStatusLabel(order.trang_thai))}</span>
      </div>
      <div class="mua-hang-order-row"><span>Tổng tiền</span><strong class="mua-hang-money">${escapePurchase(formatPurchaseMoney(order.tong_tien))}</strong></div>
      <div class="mua-hang-order-row"><span>Điểm đã dùng</span><strong>${escapePurchase(formatPurchaseNumber(order.diem_da_dung))}</strong></div>
      <div class="mua-hang-order-row"><span>Điểm được cộng</span><strong>+${escapePurchase(formatPurchaseNumber(order.diem_duoc_cong))}</strong></div>
    </article>
  `).join('');
}

function setPurchaseBusy(busy) {
  const search = document.getElementById('searchButton');
  const clear = document.getElementById('clearFilterButton');
  search.disabled = busy;
  clear.disabled = busy;
  search.textContent = busy ? 'Đang tra cứu...' : 'Tra cứu';
  if (busy) {
    document.getElementById('previousButton').disabled = true;
    document.getElementById('nextButton').disabled = true;
  } else {
    updatePurchasePagination();
  }
}

function updatePurchasePagination() {
  document.getElementById('previousButton').disabled = purchasePage <= 1;
  document.getElementById('nextButton').disabled = !purchaseHasNextPage;
  document.getElementById('pageInfo').textContent = `Trang ${purchasePage}`;
}

function setPurchaseFieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(id + 'Error');
  input.classList.toggle('mua-hang-input-invalid', Boolean(message));
  error.textContent = message || '';
}

function clearPurchaseErrors() {
  ['orderCodeFilter', 'dateFromFilter', 'dateToFilter', 'statusFilter']
    .forEach(id => setPurchaseFieldError(id, ''));
}

function showPurchaseMessage(message, type) {
  const element = document.getElementById('resultMessage');
  element.className = 'mua-hang-message' + (type ? ' ' + type : '');
  element.textContent = message || '';
}

function setPurchaseSummary(message) {
  document.getElementById('resultSummary').textContent = message;
}

function getPurchaseValue(id) {
  return document.getElementById(id).value.trim();
}

function nextPurchaseDate(value) {
  const parts = value.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1)).toISOString().slice(0, 10);
}

function formatPurchaseDate(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value || '-';
  return date.toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function formatPurchaseMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function formatPurchaseNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function purchaseStatusLabel(status) {
  return {
    hoan_thanh: 'Hoàn thành',
    dang_xu_ly: 'Đang xử lý',
    da_huy: 'Đã hủy',
    da_doi_tra: 'Đã đổi trả'
  }[status] || status || '-';
}

function purchaseStatusClass(status) {
  return {
    hoan_thanh: 'success',
    dang_xu_ly: 'pending',
    da_huy: 'cancelled',
    da_doi_tra: 'returned'
  }[status] || 'pending';
}

function escapePurchase(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
