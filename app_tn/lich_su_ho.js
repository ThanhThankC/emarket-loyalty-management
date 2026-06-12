// =============================================================
//  lich_su_ho.js — Tra cuu lich su mua hang ho khach
//  UC-5.1 Tra cuu  |  UC-5.2 Chi tiet don hang
//  Phu thuoc: supabase_config.js, supabase_api.js, auth.js
// =============================================================

const nv = getCurrentNV();

// State
let currentResults = [];
let currentCustomer = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', () => {
  if (nv) {
    document.getElementById('topName').textContent   = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
  }
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
  initSearch();
});

// =============================================================
//  VIET LOGIC CHUC NANG BEN DUOI
//
//  UC-5.1: Tra cuu don hang
//  Tieu chi tim kiem (BR5-2): SĐT, ma KH, ma don hang, khoang thoi gian, trang thai don
//  const data = await sbGet('don_hang',
//    `ma_kh=eq.${maKh}&order=ngay_mua.desc&limit=20&offset=${(trang-1)*20}`);
//
//  BR5-3: Phan trang 20 don/trang
//  BR5-5: Chi xem tong bill va diem tich luy (khong hien chi tiet san pham o day)
//
//  UC-5.2: Chi tiet don hang (mo trong modal-don-hang)
//  const detail = await sbGet('don_hang', 'ma_don=eq.' + maDon);
//  Hien day du: DS san pham, phuong thuc TT, giam gia/voucher, diem tich + diem da dung
//  BR5-4: KHONG cho chinh sua bat ky truong nao
//
//  Exception 5b: Du lieu nhap khong hop le → showToast loi, khong query
//  Exception 6d: Loi truy van → showToast('Tra cuu that bai, thu lai sau', 'err')
//  Exception 6e: Khong tim thay → showToast('Khong tim thay don hang', 'err')
//
//  NFR5-1: Phan hoi tra cuu <= 3 giay
//  NFR5-6: Ghi log lan tra cuu (nguoi tra cuu, thoi gian, tham so tim kiem)
// =============================================================

/**
 * Format số tiền thành chuỗi VND
 */
function formatCurrency(value) {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format ngày thành chuỗi
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Ghi log tra cứu vào localStorage (audit log)
 * NFR5-6: Ghi log mọi lần tra cứu (người, thời gian, tham số)
 */
function logSearch(criteria, resultCount, duration) {
  try {
    const logs = JSON.parse(localStorage.getItem('carepoint_search_logs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      ma_nv: nv.ma_nv,
      ho_ten: nv.ho_ten,
      criteria: criteria,
      result_count: resultCount,
      duration_ms: duration,
      user_agent: navigator.userAgent
    });
    // Giữ tối đa 1000 logs
    if (logs.length > 1000) logs.shift();
    localStorage.setItem('carepoint_search_logs', JSON.stringify(logs));
    console.log('[AUDIT LOG]', {
      action: 'search_order_history',
      criteria,
      resultCount,
      duration_ms: duration,
      by: nv.ma_nv
    });
  } catch (err) {
    console.error('Lỗi ghi log:', err);
  }
}

/**
 * Khởi tạo form tìm kiếm
 */
function initSearch() {
  // Không thiết lập ngày mặc định để tìm kiếm theo SĐT/mã KH/mã đơn hàng toàn bộ lịch sử
  const toDateInput = document.getElementById('ls-input-to-date');
  const fromDateInput = document.getElementById('ls-input-from-date');

  toDateInput.value = '';
  fromDateInput.value = '';

  // Attach event listeners
  const inputs = document.querySelectorAll('.ls-field .fi');
  inputs.forEach(input => {
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') onSearchClick();
    });
  });
}

/**
 * Kiểm tra điều kiện tìm kiếm hợp lệ
 * Exception 5b: Validation dữ liệu nhập
 */
function validateSearchCriteria() {
  const phoneOrKh = document.getElementById('ls-input-phone-or-kh').value.trim();
  const maDon = document.getElementById('ls-input-ma-don').value.trim();
  const fromDate = document.getElementById('ls-input-from-date').value;
  const toDate = document.getElementById('ls-input-to-date').value;

  if (!phoneOrKh && !maDon && !fromDate && !toDate) {
    showToast('Vui lòng nhập ít nhất một điều kiện tìm kiếm', 'err');
    return false;
  }

  // Kiểm tra định dạng SĐT (nếu có)
  if (phoneOrKh && /^\d+$/.test(phoneOrKh)) {
    if (phoneOrKh.length < 9 || phoneOrKh.length > 15) {
      showToast('SĐT phải từ 9 đến 15 chữ số', 'err');
      return false;
    }
  }

  // Kiểm tra khoảng thời gian
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc', 'err');
      return false;
    }
  }

  return true;
}

/**
 * Xử lý nút Tra cứu
 * NFR5-1: Phản hồi tra cứu <= 3 giây
 */
async function onSearchClick() {
  if (!validateSearchCriteria()) return;

  const startTime = performance.now();
  const searchBtn = document.getElementById('ls-btn-search');
  searchBtn.disabled = true;
  searchBtn.textContent = 'Đang tra cứu...';

  try {
    await executeSearch();
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Tra cứu';
    const duration = Math.round(performance.now() - startTime);
    console.log(`Thời gian tra cứu: ${duration}ms`);
  }
}

/**
 * Thực hiện tra cứu
 * UC-5.1: Tra cứu đơn hàng theo SĐT, mã KH, mã đơn, khoảng thời gian, trạng thái
 */
async function executeSearch() {
  try {
    const phoneOrKh = document.getElementById('ls-input-phone-or-kh').value.trim();
    const maDon = document.getElementById('ls-input-ma-don').value.trim();
    const fromDate = document.getElementById('ls-input-from-date').value;
    const toDate = document.getElementById('ls-input-to-date').value;
    const trangThai = document.getElementById('ls-input-trang-thai').value;

    let khachHang = null;

    // Bước 1: Tìm khách hàng nếu nhập SĐT hoặc mã KH
    if (phoneOrKh) {
      // Nếu là số → tìm theo SĐT
      if (/^\d+$/.test(phoneOrKh)) {
        const khs = await sbGet('khach_hang', `so_dien_thoai=eq.${phoneOrKh}&limit=1`);
        if (khs && khs.length > 0) khachHang = khs[0];
      } else {
        // Nếu là chữ → tìm theo mã KH
        const khs = await sbGet('khach_hang', `ma_kh=eq.${phoneOrKh.toUpperCase()}&limit=1`);
        if (khs && khs.length > 0) khachHang = khs[0];
      }

      // Nếu không tìm thấy KH
      if (!khachHang) {
        showToast('Không tìm thấy khách hàng với thông tin này', 'err');
        renderNoResult();
        logSearch(
          { phoneOrKh, maDon, fromDate, toDate, trangThai },
          0,
          0
        );
        return;
      }
    }

    // Bước 2: Tìm đơn hàng
    let query = '';
    const params = [];

    if (khachHang) {
      params.push(`ma_kh=eq.${khachHang.ma_kh}`);
    }

    if (maDon) {
      params.push(`ma_don_hang=ilike.*${maDon}*`);
    }

    if (fromDate && toDate) {
      const fromIso = new Date(fromDate).toISOString();
      const toIso = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000).toISOString();
      params.push(`ngay_mua=gte.${fromIso}`);
      params.push(`ngay_mua=lt.${toIso}`);
    } else if (fromDate) {
      const fromIso = new Date(fromDate).toISOString();
      params.push(`ngay_mua=gte.${fromIso}`);
    } else if (toDate) {
      const toIso = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000).toISOString();
      params.push(`ngay_mua=lt.${toIso}`);
    }

    if (trangThai) {
      params.push(`trang_thai=eq.${trangThai}`);
    }

    query = params.join('&') + '&order=ngay_mua.desc&limit=1000';

    const donHangs = await sbGet('don_hang', query);

    // Exception 6e: Không tìm thấy đơn hàng
    if (!donHangs || donHangs.length === 0) {
      showToast('Không tìm thấy đơn hàng nào phù hợp', 'info');
      renderNoResult();
      logSearch(
        { phoneOrKh, maDon, fromDate, toDate, trangThai },
        0,
        0
      );
      return;
    }

    // Bước 3: Lấy thông tin thẻ thành viên (nếu có KH)
    if (khachHang) {
      const thes = await sbGet('the_thanh_vien', `ma_kh=eq.${khachHang.ma_kh}&limit=1`);
      if (thes && thes.length > 0) {
        currentCustomer = { ...khachHang, the: thes[0] };
      } else {
        currentCustomer = khachHang;
      }
    }

    // Bước 4: Render kết quả
    currentResults = donHangs;
    currentPage = 1;
    renderResults();

    logSearch(
      { phoneOrKh, maDon, fromDate, toDate, trangThai },
      donHangs.length,
      0
    );

  } catch (err) {
    console.error('Lỗi tra cứu:', err);
    // Exception 6d: Lỗi truy vấn
    showToast('Lỗi khi tra cứu: ' + (err.message || 'Thử lại'), 'err');
    renderNoResult();
  }
}

/**
 * Hiển thị kết quả
 * BR5-3: Phân trang 20 đơn/trang
 * BR5-5: Chi xem tổng bill và điểm tích lũy
 */
function renderResults() {
  const resultPanel = document.getElementById('ls-results-panel');
  const noResultPanel = document.getElementById('ls-no-result-panel');
  const tbody = document.getElementById('ls-table-tbody');
  const infoDiv = document.getElementById('ls-customer-info');

  noResultPanel.style.display = 'none';
  resultPanel.style.display = 'block';

  // Hiển thị thông tin khách hàng
  if (currentCustomer) {
    const diem = currentCustomer.the ? currentCustomer.the.so_diem : 0;
    const hang = currentCustomer.the ? currentCustomer.the.hang : 'N/A';
    infoDiv.innerHTML = `
      <div>
        <div class="info-item">
          <div class="info-label">Khách hàng</div>
          <div class="info-value">${escapeHtml(currentCustomer.ho_ten)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Mã KH</div>
          <div class="info-value">${escapeHtml(currentCustomer.ma_kh)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">SĐT</div>
          <div class="info-value">${escapeHtml(currentCustomer.so_dien_thoai)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Hạng thẻ</div>
          <div class="info-value">${escapeHtml(hang)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Điểm tích lũy</div>
          <div class="info-value" style="color:var(--green);">${diem}</div>
        </div>
      </div>
    `;
  } else {
    infoDiv.innerHTML = '<div style="padding:12px; color:var(--t3);">Tra cứu theo mã đơn hàng</div>';
  }

  // Render bảng
  tbody.innerHTML = '';
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = currentResults.slice(start, end);

  pageData.forEach(don => {
    const statusClass = `ls-badge ${don.trang_thai.replace(/_/g, '-')}`;
    const statusText = {
      'hoan_thanh': 'Hoàn thành',
      'da_huy': 'Đã hủy',
      'dang_xu_ly': 'Đang xử lý',
      'da_doi_tra': 'Đã đổi trả'
    }[don.trang_thai] || don.trang_thai;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(don.ma_don_hang)}</td>
      <td>${formatDate(don.ngay_mua)}</td>
      <td style="text-align:right;">${formatCurrency(don.tong_tien)}</td>
      <td style="text-align:center;">+${don.diem_duoc_cong}</td>
      <td style="text-align:center;"><span class="${statusClass}">${statusText}</span></td>
      <td style="text-align:center;">
        <button class="btn btn-outline btn-sm" onclick="openOrderDetail('${escapeHtml(don.ma_don_hang)}')">
          Chi tiết
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Render phân trang
  renderPagination();
}

/**
 * Hiển thị "Không tìm thấy"
 */
function renderNoResult() {
  const resultPanel = document.getElementById('ls-results-panel');
  const noResultPanel = document.getElementById('ls-no-result-panel');

  resultPanel.style.display = 'none';
  noResultPanel.style.display = 'block';

  currentResults = [];
  currentPage = 1;
}

/**
 * Render phân trang
 */
function renderPagination() {
  const paginationDiv = document.getElementById('ls-pagination');
  paginationDiv.innerHTML = '';

  const totalPages = Math.ceil(currentResults.length / ITEMS_PER_PAGE);

  if (totalPages <= 1) {
    paginationDiv.innerHTML = `<span class="ls-pagination-info">${currentResults.length} đơn hàng</span>`;
    return;
  }

  // Nút Previous
  const prevBtn = document.createElement('button');
  prevBtn.className = 'ls-pagination-btn';
  prevBtn.textContent = 'Trước';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  paginationDiv.appendChild(prevBtn);

  // Các nút trang
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      const btn = document.createElement('button');
      btn.className = `ls-pagination-btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.onclick = () => {
        currentPage = i;
        renderResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      paginationDiv.appendChild(btn);
    } else if (
      (i === 2 && currentPage > 3) ||
      (i === totalPages - 1 && currentPage < totalPages - 2)
    ) {
      const span = document.createElement('span');
      span.textContent = '...';
      span.style.padding = '0 4px';
      paginationDiv.appendChild(span);
    }
  }

  // Nút Next
  const nextBtn = document.createElement('button');
  nextBtn.className = 'ls-pagination-btn';
  nextBtn.textContent = 'Tiếp';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  paginationDiv.appendChild(nextBtn);

  // Info
  const info = document.createElement('span');
  info.className = 'ls-pagination-info';
  info.textContent = `Trang ${currentPage} / ${totalPages} (${currentResults.length} đơn)`;
  paginationDiv.appendChild(info);
}

/**
 * Xem chi tiết đơn hàng
 * UC-5.2: Chi tiết đơn hàng (BR5-4: Chỉ xem, không chỉnh sửa)
 */
async function openOrderDetail(maDonHang) {
  try {
    const donHangs = await sbGet('don_hang', `ma_don_hang=eq.${maDonHang}&limit=1`);
    if (!donHangs || donHangs.length === 0) {
      showToast('Không tìm thấy đơn hàng', 'err');
      return;
    }

    const don = donHangs[0];

    // Lấy thông tin khách hàng
    const khs = await sbGet('khach_hang', `ma_kh=eq.${don.ma_kh}&limit=1`);
    const kh = khs && khs.length > 0 ? khs[0] : null;

    // Cập nhật modal
    document.getElementById('modal-ma-don').textContent = escapeHtml(don.ma_don_hang);
    document.getElementById('modal-ngay-mua').textContent = formatDate(don.ngay_mua);
    document.getElementById('modal-kh-info').textContent = kh
      ? `${escapeHtml(kh.ho_ten)} (${escapeHtml(kh.ma_kh)})`
      : '—';
    document.getElementById('modal-tong-tien').textContent = formatCurrency(don.tong_tien);
    document.getElementById('modal-diem-cong').textContent = don.diem_duoc_cong;
    document.getElementById('modal-diem-dung').textContent = don.diem_da_dung;

    const statusText = {
      'hoan_thanh': 'Hoàn thành',
      'da_huy': 'Đã hủy',
      'dang_xu_ly': 'Đang xử lý',
      'da_doi_tra': 'Đã đổi trả'
    }[don.trang_thai] || don.trang_thai;
    document.getElementById('modal-trang-thai').textContent = statusText;

    // Hiển thị ghi chú nếu có
    const ghiChuSection = document.getElementById('modal-ghi-chu-section');
    if (don.ghi_chu) {
      document.getElementById('modal-ghi-chu').textContent = escapeHtml(don.ghi_chu);
      ghiChuSection.style.display = 'block';
    } else {
      ghiChuSection.style.display = 'none';
    }

    openModal('modal-don-hang');
  } catch (err) {
    console.error('Lỗi mở chi tiết đơn hàng:', err);
    showToast('Lỗi khi lấy chi tiết đơn hàng', 'err');
  }
}

/**
 * Xóa bộ lọc
 */
function onResetClick() {
  // Reset fields
  document.getElementById('ls-input-phone-or-kh').value = '';
  document.getElementById('ls-input-ma-don').value = '';
  document.getElementById('ls-input-trang-thai').value = '';

  // Reset dates
  document.getElementById('ls-input-to-date').value = '';
  document.getElementById('ls-input-from-date').value = '';

  // Ẩn kết quả
  document.getElementById('ls-results-panel').style.display = 'none';
  document.getElementById('ls-no-result-panel').style.display = 'none';

  currentResults = [];
  currentCustomer = null;
  currentPage = 1;

  showToast('Đã xóa bộ lọc', 'ok');
}

// ---- Role toggle ----
let isManager = false;

function toggleRole() {
  isManager = !isManager;
  const btn    = document.getElementById('btn-role');
  const badge  = document.getElementById('role-badge');
  const label  = document.getElementById('role-label');
  const navVIP = document.getElementById('nav-vip');
  const lockTag= document.getElementById('lock-tag');

  if (isManager) {
    btn.textContent = 'Đổi về Thu ngân (demo)';
    btn.classList.add('is-manager');
    badge.textContent = 'QUẢN LÝ';
    badge.classList.add('manager');
    label.textContent = 'Thu ngân (Quản lý)';
    navVIP.classList.remove('lock');
    navVIP.onclick = () => location.href = '#';
    lockTag.textContent = '';
    showToast('Đã chuyển sang chế độ Quản lý — Cấu hình ngưỡng VIP đã mở khoá', 'ok');
  } else {
    btn.textContent = 'Đổi sang Quản lý (demo)';
    btn.classList.remove('is-manager');
    badge.textContent = 'THU NGÂN';
    badge.classList.remove('manager');
    label.textContent = 'Thu ngân';
    navVIP.classList.add('lock');
    navVIP.onclick = tryLock;
    lockTag.textContent = 'Khoá';
    showToast('Đã chuyển về Thu ngân — Cấu hình ngưỡng VIP bị khoá lại', 'inf');
  }
}

function tryLock() {
  showToast('Chức năng này yêu cầu quyền Quản lý. Nhấn "Đổi sang Quản lý" để demo.', 'err');
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
