requireLogin();
const nv = getCurrentNV();

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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
});

function initAddCustomer(){
  const page = document.getElementById('page-kh-them');
  if(!page) return;
  const saveBtn = page.querySelector('#save-customer');
  if(saveBtn){
    saveBtn.removeAttribute('onclick');
    saveBtn.addEventListener('click', onSaveCustomer);
  }
}

function onSaveCustomer(e){
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
  const phoneDigits = phoneRaw.replace(/\D/g,'');
  if(!phoneDigits){ showToast('Vui lòng nhập Số điện thoại', 'err'); return; }
  if(phoneDigits.length < 9 || phoneDigits.length > 11){ showToast('Số điện thoại không hợp lệ', 'err'); return; }

  // Duplicate check against current table
  const rows = document.querySelectorAll('#kh-tbody tr');
  for(const r of rows){
    const td = r.children[2];
    if(!td) continue;
    const existing = (td.textContent || '').replace(/\D/g,'');
    if(existing === phoneDigits){ showToast('Số điện thoại đã tồn tại', 'err'); return; }
  }

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
