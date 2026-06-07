requireLogin();
const nv = getCurrentNV();
document.addEventListener('DOMContentLoaded', () => {
  if (nv) {
    document.getElementById('topName').textContent = nv.ho_ten;
    document.getElementById('topAvatar').textContent =
      nv.ho_ten.split(' ').pop().charAt(0).toUpperCase();
    document.getElementById('dashSub').textContent = 'Xin chao, ' + nv.ho_ten;
  }
});
