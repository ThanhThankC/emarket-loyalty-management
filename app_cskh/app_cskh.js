// =============================================================
//  app_cskh.js — Dashboard CSKH
// =============================================================

requireLogin();
const nv = getCurrentNV();

document.addEventListener('DOMContentLoaded', async () => {
  if (nv) {
    document.getElementById('topName').textContent = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
    document.getElementById('dashSub').textContent =
      'Xin chao, ' + nv.ho_ten + '. Hom nay ban co nhieu viec can xu ly.';
  }

  loadStats();
});

async function loadStats() {
  try {
    // Phan hoi cho xu ly
    const ph = await sbGet('phan_hoi_khach_hang',
      "trang_thai=in.(moi,dang_xu_ly,cho_phan_hoi)&select=ma_phan_hoi");
    document.getElementById('stat-ph').textContent = ph.length;

    // The cap hom nay
    const today = new Date().toISOString().split('T')[0];
    const the = await sbGet('lich_su_cap_the',
      `ngay_thuc_hien=gte.${today}&loai_su_kien=in.(cap_moi,cap_lai)&select=ma_ls_cap_the`);
    document.getElementById('stat-the').textContent = the.length;

    // Ho tro hom nay
    const ht = await sbGet('lich_su_ho_tro',
      `ngay_gio=gte.${today}&select=ma_ho_tro`);
    document.getElementById('stat-ht').textContent = ht.length;

    document.getElementById('stat-dt').textContent = '—';

  } catch (err) {
    console.error('loadStats loi:', err);
  }
}
