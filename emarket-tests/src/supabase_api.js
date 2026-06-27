// supabase_api.js — module version dùng cho test
// (bản gốc dùng global SUPABASE_URL + SB_HEADERS, ở đây nhận vào qua config)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': process.env.SUPABASE_KEY || 'test-key',
  'Prefer': 'return=representation'
};

async function sbGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(`sbGet [${table}] lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbInsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: SB_HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`sbInsert [${table}] lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbUpdate(table, params, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers: SB_HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`sbUpdate [${table}] lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbDelete(table, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE',
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(`sbDelete [${table}] lỗi ${res.status}: ${await res.text()}`);
  return true;
}

module.exports = { sbGet, sbInsert, sbUpdate, sbDelete };
