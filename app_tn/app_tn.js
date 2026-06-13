requireLogin();
const nv = getCurrentNV();

function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
  if (nv) {
    document.getElementById('topName').textContent = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
    const dashSub = document.getElementById('dashSub');
    if (dashSub) {
      dashSub.textContent = 'Xin chao, ' + nv.ho_ten;
    }
  }
  initAddCustomer();
  initCustomerRowActions();
  loadKHList();
});

let khSearchTimer = null;
let khByCode = {};
let cardByCustomer = {};
let currentEditMaKh = null;

function normalizeText(str){
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatPhone(phone){
  const digits = (phone || '').replace(/\D/g, '');
  if(digits.length === 10) return digits.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
  if(digits.length === 9) return digits.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
  return phone || '-';
}

function formatDate(dateStr){
  if(!dateStr) return '-';
  const date = new Date(dateStr);
  if(Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('vi-VN');
}

function formatMoney(value){
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function getRankMeta(hang){
  const key = normalizeText(hang);
  const map = {
    bronze: { text: 'Đồng', cls: 'rank-new' },
    dong: { text: 'Đồng', cls: 'rank-new' },
    silver: { text: 'Bạc', cls: 'rank-bac' },
    bac: { text: 'Bạc', cls: 'rank-bac' },
    gold: { text: 'Vàng', cls: 'rank-vang' },
    vang: { text: 'Vàng', cls: 'rank-vang' },
    platinum: { text: 'Bạch Kim', cls: 'rank-kim' },
    'bach kim': { text: 'Bạch Kim', cls: 'rank-kim' },
    'kim cuong': { text: 'Kim cương', cls: 'rank-kim' }
  };
  return map[key] || { text: hang || 'Chưa có thẻ', cls: 'rank-new' };
}

function getStatusMeta(status){
  const key = status || '';
  const map = {
    hoat_dong: { text: 'Đang hoạt động', cls: 'b-done' },
    bi_khoa: { text: 'Đang khóa', cls: 'b-err' },
    da_xoa: { text: 'Đã xóa', cls: 'b-neu' },
    het_han: { text: 'Hết hạn', cls: 'b-neu' },
    mat_the: { text: 'Mất thẻ', cls: 'b-neu' }
  };
  return map[key] || { text: status || 'Không rõ', cls: 'b-neu' };
}

function getRankFilterValue(){
  const el = document.getElementById('kh-rank-filter');
  if(!el) return '';
  const raw = normalizeText(el.value);
  if(!raw) return '';
  if(raw.includes('bac')) return 'Silver';
  if(raw.includes('vang')) return 'Gold';
  if(raw.includes('kim')) return 'Platinum';
  if(raw.includes('moi') || raw.includes('dong')) return 'Bronze';
  return el.value;
}

async function loadKHList(keyword = ''){
  const tbody = document.getElementById('kh-tbody');
  const countEl = document.getElementById('kh-count');
  if(!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--t3);">Đang tải dữ liệu...</td></tr>';
  if(countEl) countEl.textContent = 'Đang tải...';

  const search = (keyword || '').trim();
  const status = document.getElementById('kh-status-filter')?.value || '';
  const rank = getRankFilterValue();

  try {
    const params = [];
    if(search){
      const kw = encodeURIComponent(search);
      params.push(`or=(ma_kh.ilike.*${kw}*,ho_ten.ilike.*${kw}*,so_dien_thoai.ilike.*${kw}*)`);
    }
    if(status) params.push(`trang_thai=eq.${encodeURIComponent(status)}`);
    params.push('order=ma_kh.asc');

    let customers = await sbGet('khach_hang', params.join('&'));
    const cards = await sbGet('the_thanh_vien', 'limit=10000');
    khByCode = {};
    cardByCustomer = {};
    cards.forEach(card => { cardByCustomer[card.ma_kh] = card; });
    customers.forEach(kh => { khByCode[kh.ma_kh] = kh; });

    if(rank){
      customers = customers.filter(kh => (cardByCustomer[kh.ma_kh]?.hang || 'Bronze') === rank);
    }

    if(!customers.length){
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--t3);">Không có khách hàng phù hợp</td></tr>';
      if(countEl) countEl.textContent = '0 khách hàng';
      return;
    }

    tbody.innerHTML = customers.map(kh => {
      const card = cardByCustomer[kh.ma_kh];
      const rankMeta = getRankMeta(card?.hang);
      const customerStatus = getStatusMeta(kh.trang_thai);
      const cardStatus = card ? getStatusMeta(card.trang_thai) : { text: 'Chưa có thẻ', cls: 'b-neu' };
      const statusMeta = kh.trang_thai === 'hoat_dong' ? cardStatus : customerStatus;

      return `
        <tr data-ma-kh="${escapeHtml(kh.ma_kh)}">
          <td style="font-size:12px;color:var(--t3);">${escapeHtml(kh.ma_kh)}</td>
          <td><div style="font-weight:600;">${escapeHtml(kh.ho_ten)}</div><div style="font-size:11px;color:var(--t3);">${escapeHtml(kh.email || '-')}</div></td>
          <td>${escapeHtml(formatPhone(kh.so_dien_thoai))}</td>
          <td><span class="rank ${rankMeta.cls}">${escapeHtml(rankMeta.text)}</span></td>
          <td style="font-weight:700;">${Number(card?.so_diem || 0).toLocaleString('vi-VN')}</td>
          <td><span class="badge ${statusMeta.cls}">${escapeHtml(statusMeta.text)}</span></td>
          <td><div style="display:flex;gap:6px;"><button class="btn btn-outline btn-sm" onclick="viewKHDetail('${escapeHtml(kh.ma_kh)}')">Xem</button><button class="btn btn-outline btn-sm" onclick="prepareEditKH('${escapeHtml(kh.ma_kh)}')">Sửa</button></div></td>
        </tr>
      `;
    }).join('');

    if(countEl) countEl.textContent = customers.length + ' khách hàng';
  } catch (err) {
    console.error('Lỗi tải danh sách khách hàng:', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--red);">Không tải được dữ liệu khách hàng từ Supabase</td></tr>';
    if(countEl) countEl.textContent = '0 khách hàng';
    showToast('Không tải được danh sách khách hàng từ Supabase', 'err');
  }
}

function filterKH(kw) {
  clearTimeout(khSearchTimer);
  khSearchTimer = setTimeout(() => loadKHList(kw), 250);
}

function initCustomerRowActions(){
  const tbody = document.getElementById('kh-tbody');
  if(!tbody) return;

  tbody.addEventListener('click', e => {
    const btn = e.target.closest('button');
    const row = e.target.closest('tr[data-ma-kh]');
    if(!btn || !row) return;

    const label = normalizeText(btn.textContent);
    if(label.includes('xem')){
      e.preventDefault();
      e.stopImmediatePropagation();
      viewKHDetail(row.dataset.maKh);
    }
    if(label.includes('sua')){
      e.preventDefault();
      e.stopImmediatePropagation();
      prepareEditKH(row.dataset.maKh);
    }
  }, true);
}

async function getKHDetail(maKh){
  let kh = khByCode[maKh];
  let card = cardByCustomer[maKh];
  let totalSpend = 0;

  if(!kh){
    const khRows = await sbGet('khach_hang', `ma_kh=eq.${encodeURIComponent(maKh)}&limit=1`);
    kh = khRows && khRows[0];
  }
  if(!kh) throw new Error('Không tìm thấy khách hàng');

  if(!card){
    const cardRows = await sbGet('the_thanh_vien', `ma_kh=eq.${encodeURIComponent(maKh)}&limit=1`);
    card = cardRows && cardRows[0];
  }

  try {
    const orders = await sbGet('don_hang', `ma_kh=eq.${encodeURIComponent(maKh)}&select=tong_tien`);
    totalSpend = orders.reduce((sum, order) => sum + Number(order.tong_tien || 0), 0);
  } catch (err) {
    console.warn('Không lấy được tổng chi tiêu:', err);
  }

  khByCode[maKh] = kh;
  if(card) cardByCustomer[maKh] = card;
  return { kh, card, totalSpend };
}

function setInfoRow(modalId, index, value, html = false){
  const row = document.querySelectorAll(`#${modalId} .irow .iv`)[index];
  if(!row) return;
  if(html) row.innerHTML = value;
  else row.textContent = value;
}

async function viewKHDetail(maKh){
  try {
    const { kh, card, totalSpend } = await getKHDetail(maKh);
    const rankMeta = getRankMeta(card?.hang);
    const customerStatus = getStatusMeta(kh.trang_thai);
    const cardStatus = card ? getStatusMeta(card.trang_thai) : { text: 'Chưa có thẻ', cls: 'b-neu' };
    const statusMeta = kh.trang_thai === 'hoat_dong' ? cardStatus : customerStatus;

    const title = document.querySelector('#m-kh-view .mt');
    if(title) title.textContent = 'Hồ sơ khách hàng — ' + kh.ma_kh;

    setInfoRow('m-kh-view', 0, kh.ma_kh);
    setInfoRow('m-kh-view', 1, kh.ho_ten || '-');
    setInfoRow('m-kh-view', 2, formatPhone(kh.so_dien_thoai));
    setInfoRow('m-kh-view', 3, kh.email || '-');
    setInfoRow('m-kh-view', 4, formatDate(kh.ngay_sinh));
    setInfoRow('m-kh-view', 5, kh.dia_chi || '-');
    setInfoRow('m-kh-view', 6, `<span class="rank ${rankMeta.cls}">${escapeHtml(rankMeta.text)}</span>`, true);
    setInfoRow('m-kh-view', 7, Number(card?.so_diem || 0).toLocaleString('vi-VN') + ' điểm');
    setInfoRow('m-kh-view', 8, formatMoney(totalSpend));
    setInfoRow('m-kh-view', 9, `<span class="badge ${statusMeta.cls}">${escapeHtml(statusMeta.text)}</span>`, true);

    const editBtn = document.querySelector('#m-kh-view .mf button:last-child');
    if(editBtn) editBtn.onclick = () => {
      closeModal('m-kh-view');
      prepareEditKH(kh.ma_kh);
    };

    openModal('m-kh-view');
  } catch (err) {
    console.error('Lỗi xem khách hàng:', err);
    showToast('Không tải được thông tin khách hàng', 'err');
  }
}

async function prepareEditKH(maKh){
  try {
    const { kh } = await getKHDetail(maKh);
    currentEditMaKh = kh.ma_kh;

    const title = document.querySelector('#m-kh-edit .mt');
    if(title) title.textContent = 'Sửa thông tin — ' + kh.ma_kh;

    document.getElementById('edit-ho-ten').value = kh.ho_ten || '';
    document.getElementById('edit-sdt').value = kh.so_dien_thoai || '';
    document.getElementById('edit-email').value = kh.email || '';
    document.getElementById('edit-ngay-sinh').value = kh.ngay_sinh || '';
    document.getElementById('edit-gioi-tinh').value = kh.gioi_tinh || '';
    document.getElementById('edit-dia-chi').value = kh.dia_chi || '';

    openModal('m-kh-edit');
  } catch (err) {
    console.error('Lỗi mở form sửa khách hàng:', err);
    showToast('Không tải được thông tin khách hàng', 'err');
  }
}

async function saveKHEdit(){
  if(!currentEditMaKh){
    showToast('Chưa chọn khách hàng để sửa', 'err');
    return;
  }

  const hoTen = document.getElementById('edit-ho-ten').value.trim();
  if(!hoTen){
    showToast('Vui lòng nhập họ tên', 'err');
    return;
  }

  const body = {
    ho_ten: hoTen,
    email: document.getElementById('edit-email').value.trim() || null,
    ngay_sinh: document.getElementById('edit-ngay-sinh').value || null,
    gioi_tinh: document.getElementById('edit-gioi-tinh').value || null,
    dia_chi: document.getElementById('edit-dia-chi').value.trim() || null
  };

  try {
    await sbUpdate('khach_hang', `ma_kh=eq.${encodeURIComponent(currentEditMaKh)}`, body);
    closeModal('m-kh-edit');
    showToast('Đã cập nhật thông tin khách hàng', 'ok');
    await loadKHList(document.getElementById('kh-search')?.value || '');
  } catch (err) {
    console.error('Lỗi lưu khách hàng:', err);
    showToast('Không lưu được thông tin khách hàng', 'err');
  }
}

window.loadKHList = loadKHList;
window.filterKH = filterKH;
window.viewKHDetail = viewKHDetail;
window.prepareEditKH = prepareEditKH;
window.saveKHEdit = saveKHEdit;

function initAddCustomer(){
  const page = document.getElementById('page-kh-them');
  if(!page) return;
  const saveBtn = page.querySelector('#save-customer');
  if(saveBtn){
    saveBtn.removeAttribute('onclick');
    saveBtn.addEventListener('click', onSaveCustomer);
  }

  const phoneInput = page.querySelector('#kh-phone');
  if(phoneInput){
    phoneInput.addEventListener('input', onPhoneInput);
  }
}

function onPhoneInput(e){
  const input = e.target;
  const raw = input.value;
  if(/\D/.test(raw)){
    input.value = raw.replace(/\D/g, '');
    showToast('Số điện thoại chỉ được nhập số', 'err');
  }
}

async function onSaveCustomer(e){
  e.preventDefault();
  const page = document.getElementById('page-kh-them');
  if(!page) return;
  const inputs = page.querySelectorAll('.fi');
  // inputs order: 0 code(disabled),1 type select,2 name,3 phone,4 email,5 dob,6 gender,7 address
  const type = (inputs[1] && inputs[1].value) ? inputs[1].value.trim() : '';
  const name = (inputs[2] && inputs[2].value) ? inputs[2].value.trim() : '';
  const phoneRaw = (inputs[3] && inputs[3].value) ? inputs[3].value.trim() : '';
  const email = (inputs[4] && inputs[4].value) ? inputs[4].value.trim() : '';
  const dob = (inputs[5] && inputs[5].value) ? inputs[5].value : '';
  const gender = (inputs[6] && inputs[6].value) ? inputs[6].value : '';
  const address = (inputs[7] && inputs[7].value) ? inputs[7].value.trim() : '';

  // Validation
  if(!name){ showToast('Vui lòng nhập Họ và tên', 'err'); return; }
  if(!phoneRaw){ showToast('Vui lòng nhập Số điện thoại', 'err'); return; }
  if(/\D/.test(phoneRaw)){ showToast('Số điện thoại chỉ được nhập số', 'err'); return; }
  const phoneDigits = phoneRaw;
  if(phoneDigits.length < 9 || phoneDigits.length > 11){ showToast('Số điện thoại không hợp lệ', 'err'); return; }

  // Duplicate check by querying Supabase instead of checking local DOM
  try {
    const dup = await sbGet('khach_hang', `so_dien_thoai=eq.${phoneDigits}&limit=1`);
    if (dup && dup.length > 0) {
      showToast('Số điện thoại đã tồn tại', 'err');
      return;
    }
  } catch (err) {
    console.error('Lỗi kiểm tra số điện thoại trên Supabase:', err);
    showToast('Không thể kiểm tra số điện thoại trên máy chủ. Vui lòng thử lại.', 'err');
    return;
  }

  const rows = document.querySelectorAll('#kh-tbody tr');

  // Generate new customer code (KHxxxxx)
  let max = 0;
  rows.forEach(r => {
    const codeCell = r.children[0];
    if(!codeCell) return;
    const code = (codeCell.textContent || '').trim();
    const m = code.match(/KH\s*0*([0-9]+)/i) || code.match(/KH([0-9]+)/i);
    if(m){
      const n = parseInt(m[1],10);
      if(!isNaN(n) && n > max) max = n;
    }
  });
  const next = max + 1;
  const code = 'KH' + String(next).padStart(5, '0');

  // Format phone for display (grouping for readability)
  let phoneDisplay = phoneRaw;
  const pd = phoneDigits;
  if(pd.length === 10) phoneDisplay = pd.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
  else if(pd.length === 9) phoneDisplay = pd.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');

  // Build new row
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="font-size:12px;color:var(--t3);">${escapeHtml(code)}</td>
    <td><div style="font-weight:600;">${escapeHtml(name)}</div><div style="font-size:11px;color:var(--t3);">${escapeHtml(email)}</div></td>
    <td>${escapeHtml(phoneDisplay)}</td>
    <td><span class="rank rank-new">Mới</span></td>
    <td style="font-weight:700;">0</td>
    <td><span class="badge b-neu">Chưa có thẻ</span></td>
    <td><div style="display:flex;gap:6px;"><button class="btn btn-outline btn-sm" onclick="openModal('m-kh-view')">Xem</button><button class="btn btn-outline btn-sm" onclick="openModal('m-kh-edit')">Sửa</button></div></td>
  `;

  document.getElementById('kh-tbody').appendChild(tr);

  // Update count text (parse leading number)
  const countEl = document.getElementById('kh-count');
  const cur = parseInt((countEl.textContent || '').replace(/[^0-9]/g,''), 10) || 0;
  countEl.textContent = (cur + 1) + ' khách hàng';

  showToast('Thêm khách hàng thành công! Mã: ' + code, 'ok');

  // Reset fields except disabled code
  inputs.forEach(inp => { if(!inp.disabled) inp.value = ''; });

  // Go to list page to show result
  go('kh-ds', null);
}
