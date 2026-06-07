// =============================================
//  supabase_api.js
//  CHỈ chứa hàm gọi REST API Supabase
//  Phụ thuộc: supabase_config.js (load trước)
// =============================================

/** GET — đọc dữ liệu */
async function sbGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(`sbGet [${table}] lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

/** POST — thêm mới, trả về bản ghi vừa tạo */
async function sbInsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: SB_HEADERS,
    body:    JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`sbInsert [${table}] lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

/** PATCH — cập nhật theo điều kiện */
async function sbUpdate(table, params, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method:  'PATCH',
    headers: SB_HEADERS,
    body:    JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`sbUpdate [${table}] lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

/** DELETE — xóa theo điều kiện */
async function sbDelete(table, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method:  'DELETE',
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(`sbDelete [${table}] lỗi ${res.status}: ${await res.text()}`);
  return true;
}
