// =============================================================
//  khach_hang.js — Quan ly khach hang
//  UC-1.1.2 Sua KH  |  UC-1.2 Tim kiem
//  Phu thuoc: supabase_config.js, supabase_api.js, auth.js
// =============================================================

requireLogin();
const nv = getCurrentNV();
let currentKHData = null; // Luu KH dang xem

document.addEventListener('DOMContentLoaded', () => {
  if (nv) {
    document.getElementById('topName').textContent   = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
  }
  
  // Close modal khi click outside
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
});

// =============================================================
//  UC-1.2: Tim kiem khach hang theo SĐT hoac ma KH
// =============================================================
async function handleSearch() {
  const keyword = document.getElementById('searchInput').value.trim();
  
  if (!keyword) {
    document.getElementById('khResultsContainer').innerHTML = `
      <div style="padding:48px;text-align:center;color:var(--t3);">
        <div style="font-size:13px;font-weight:600;margin-bottom:6px;">Nhap thong tin tim kiem</div>
        <div style="font-size:12px;">Hay nhap so dien thoai hoac ma khach hang</div>
      </div>
    `;
    return;
  }
  
  try {
    document.getElementById('khResultsContainer').innerHTML = '<div style="padding:24px;text-align:center;">Dang tim kiem...</div>';
    
    // Tim kiem theo SĐT hoac ma KH (chi lay KH dang hoat dong)
    const query = `or=(so_dien_thoai.ilike.*${keyword}*,ma_kh.ilike.*${keyword}*)&trang_thai=eq.hoat_dong&order=ho_ten.asc`;
    const results = await sbGet('khach_hang', query);
    
    if (!results || results.length === 0) {
      document.getElementById('khResultsContainer').innerHTML = `
        <div style="padding:48px;text-align:center;color:var(--t3);">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">Khong tim thay ket qua</div>
          <div style="font-size:12px;">Hay thu tim kiem voi thong tin khac</div>
        </div>
      `;
      document.getElementById('searchResultCount').textContent = '';
      return;
    }
    
    document.getElementById('searchResultCount').textContent = `(${results.length} ket qua)`;
    await renderSearchResults(results);
  } catch (error) {
    console.error('Tim kiem loi:', error);
    showToast('Loi tim kiem: ' + error.message, 'err');
    document.getElementById('khResultsContainer').innerHTML = `
      <div style="padding:48px;text-align:center;color:var(--red);">
        <div style="font-size:13px;font-weight:600;">Loi khi tim kiem</div>
      </div>
    `;
  }
}

// Render bang ket qua tim kiem
async function renderSearchResults(results) {
  let html = '<table class="kh-results-table"><thead><tr>' +
    '<th>Ma KH</th>' +
    '<th>Ho va ten</th>' +
    '<th>So dien thoai</th>' +
    '<th>Email</th>' +
    '<th>Hang the</th>' +
    '<th>Thao tac</th>' +
    '</tr></thead><tbody>';
  
  // Lay thong tin the thanh vien - lay tat ca roi filter
  let theResults = [];
  try {
    theResults = await sbGet('the_thanh_vien', 'limit=10000');
  } catch (e) {
    console.warn('Loi khi lay the thanh vien:', e);
  }
  
  const theMap = {};
  theResults.forEach(the => {
    theMap[the.ma_kh] = the;
  });
  
  results.forEach(kh => {
    const the = theMap[kh.ma_kh];
    const hangThe = the ? getHangThe(the.hang) : getHangThe('Dong');
    html += `<tr>
      <td>${kh.ma_kh}</td>
      <td class="kh-col-name">${kh.ho_ten}</td>
      <td class="kh-col-phone">${kh.so_dien_thoai}</td>
      <td>${kh.email || '-'}</td>
      <td><span class="kh-status-badge status-${hangThe.class}">${hangThe.text}</span></td>
      <td class="kh-actions">
        <button class="kh-btn-action" onclick="viewKHDetail('${kh.ma_kh}')">Xem</button>
        <button class="kh-btn-action" onclick="prepareEditKH('${kh.ma_kh}')">Sua</button>
      </td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  document.getElementById('khResultsContainer').innerHTML = html;
}

// Tra ve hang the va css class
function getHangThe(hangThe) {
  const mapping = {
    'Vang': { text: 'Vang', class: 'active' },
    'Bac': { text: 'Bac', class: 'active' },
    'Dong': { text: 'Dong', class: 'new' }
  };
  return mapping[hangThe] || { text: hangThe, class: 'inactive' };
}

// =============================================================
//  UC-1.2: Xem chi tiet thong tin khach hang
// =============================================================
async function viewKHDetail(maKh) {
  try {
    const result = await sbGet('khach_hang', `ma_kh=eq.${maKh}`);
    if (!result || result.length === 0) {
      showToast('Khong tim thay khach hang', 'err');
      return;
    }
    
    currentKHData = result[0];
    
    // Lay thong tin the thanh vien
    let the = null;
    try {
      const theResult = await sbGet('the_thanh_vien', `ma_kh=eq.${maKh}`);
      if (theResult && theResult.length > 0) {
        the = theResult[0];
      }
    } catch (e) {
      console.warn('Loi lay the thanh vien:', e);
    }
    
    // Dien du lieu vao modal
    document.getElementById('view-ma-kh').textContent = currentKHData.ma_kh;
    document.getElementById('view-ho-ten').textContent = currentKHData.ho_ten;
    document.getElementById('view-sdt').textContent = currentKHData.so_dien_thoai;
    document.getElementById('view-email').textContent = currentKHData.email || '-';
    document.getElementById('view-ngay-sinh').textContent = currentKHData.ngay_sinh ? formatDate(currentKHData.ngay_sinh) : '-';
    document.getElementById('view-gioi-tinh').textContent = currentKHData.gioi_tinh || '-';
    document.getElementById('view-dia-chi').textContent = currentKHData.dia_chi || '-';
    
    const hangThe = the ? getHangThe(the.hang) : getHangThe('Dong');
    document.getElementById('view-hang-the').textContent = hangThe.text;
    document.getElementById('view-hang-the').className = 'kh-info-value kh-status-badge status-' + hangThe.class;
    
    document.getElementById('view-diem').textContent = the ? the.so_diem : '0';
    document.getElementById('view-trang-thai').textContent = 'Dang hoat dong';
    
    openModal('modal-kh-view');
  } catch (error) {
    console.error('Xem chi tiet loi:', error);
    showToast('Loi khi xem chi tiet: ' + error.message, 'err');
  }
}

// Chuyen tu modal xem sang modal sua
function openSuaKHFromView() {
  if (currentKHData) {
    prepareEditKH(currentKHData.ma_kh);
  }
}

// =============================================================
//  UC-1.1.2: Sua khach hang
// =============================================================
async function prepareEditKH(maKh) {
  try {
    const result = await sbGet('khach_hang', `ma_kh=eq.${maKh}`);
    if (!result || result.length === 0) {
      showToast('Khong tim thay khach hang', 'err');
      return;
    }
    
    const kh = result[0];
    currentKHData = kh;
    
    // Hien thi trong modal sua
    document.getElementById('sua-ma-kh').textContent = kh.ma_kh;
    document.getElementById('sua-ho-ten').value = kh.ho_ten;
    document.getElementById('sua-sdt').value = kh.so_dien_thoai;
    document.getElementById('sua-email').value = kh.email || '';
    document.getElementById('sua-ngay-sinh').value = kh.ngay_sinh || '';
    document.getElementById('sua-gioi-tinh').value = kh.gioi_tinh || '';
    document.getElementById('sua-dia-chi').value = kh.dia_chi || '';
    
    // Dong modal xem neu mo
    closeModal('modal-kh-view');
    openModal('modal-kh-sua');
  } catch (error) {
    console.error('Chuan bi sua loi:', error);
    showToast('Loi khi chuan bi sua: ' + error.message, 'err');
  }
}

// Luu thong tin sua
async function saveSuaKH() {
  try {
    const hoTen = document.getElementById('sua-ho-ten').value.trim();
    const email = document.getElementById('sua-email').value.trim();
    const ngaySinh = document.getElementById('sua-ngay-sinh').value;
    const gioiTinh = document.getElementById('sua-gioi-tinh').value;
    const diaChi = document.getElementById('sua-dia-chi').value.trim();
    
    // Validate
    if (!hoTen) {
      showToast('Hay nhap ho va ten', 'err');
      return;
    }
    
    if (!currentKHData) {
      showToast('Khong tim thay khach hang', 'err');
      return;
    }
    
    // Disable button trong khi dang luu
    const btn = document.getElementById('btn-sua-save');
    btn.disabled = true;
    btn.textContent = 'Dang luu...';
    
    // Chuyen ngay sinh thanh dung format neu co
    let ngaySinhValue = ngaySinh || null;
    
    // Cap nhat Supabase - chi cap nhat cac truong trong bang khach_hang
    const updateData = {
      ho_ten: hoTen,
      email: email || null,
      ngay_sinh: ngaySinhValue,
      gioi_tinh: gioiTinh || null,
      dia_chi: diaChi || null
    };
    
    await sbUpdate('khach_hang', `ma_kh=eq.${currentKHData.ma_kh}`, updateData);
    
    showToast('Sua thong tin khach hang thanh cong', 'ok');
    closeModal('modal-kh-sua');
    
    // Lam moi ket qua tim kiem
    handleSearch();
    
    btn.disabled = false;
    btn.textContent = 'Luu thong tin';
  } catch (error) {
    console.error('Luu thong tin loi:', error);
    showToast('Loi khi luu: ' + error.message, 'err');
    
    const btn = document.getElementById('btn-sua-save');
    btn.disabled = false;
    btn.textContent = 'Luu thong tin';
  }
}

// =============================================================
//  Utility functions
// =============================================================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- Toast ----
function showToast(msg, type = '') {
  const tc = document.getElementById('toasts');
  const t  = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}
