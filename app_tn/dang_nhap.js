// =============================================================
//  dang_nhap.js - App Thu Ngan
//  Chi dang nhap, khong dang ky (quan ly tao tai khoan)
//  Phu thuoc: supabase_config.js, supabase_api.js, auth.js
// =============================================================
(function(){ if(getCurrentNV()) window.location.href='index.html'; })();

async function handleLogin(e){
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  hide('alertBox'); setLoading(true);
  try {
    const data = await sbGet('nhan_vien',
      `or=(ten_dang_nhap.eq.${encodeURIComponent(username)},sdt.eq.${encodeURIComponent(username)})` +
      `&vai_tro=eq.thu_ngan&trang_thai=eq.hoat_dong` +
      `&select=ma_nv,ho_ten,vai_tro,ten_dang_nhap,sdt,mat_khau_hash`);
    if(!data || data.length===0){
      showAlert('Tên đăng nhập không tồn tại hoặc không có quyền Thu Ngân.'); shake(); return;
    }
    if(!isValidPassword(password, data[0].mat_khau_hash)){
      showAlert('Mật khẩu không đúng. Vui lòng thử lại.'); shake(); return;
    }
    saveSession(data[0]);
    const btn = document.getElementById('btnLogin');
    btn.style.background='#2D9462';
    document.getElementById('btnText').textContent='Thành công';
    setTimeout(()=>{ window.location.href='index.html'; }, 700);
  } catch(err){
    showAlert('Không thể kết nối Supabase hoặc truy vấn thất bại. Kiểm tra cấu hình CSDL và quyền API.');
    console.error(err);
  } finally { setLoading(false); }
}

function togglePass(){
  const i=document.getElementById('password'), b=document.getElementById('eyeBtn');
  if(i.type==='password'){ i.type='text'; b.textContent='Ẩn'; }
  else { i.type='password'; b.textContent='Hiện'; }
}
function setLoading(on){
  document.getElementById('btnLogin').disabled=on;
  document.getElementById('btnText').style.display=on?'none':'';
  document.getElementById('btnSpin').style.display=on?'inline-block':'none';
}
function showAlert(msg){ document.getElementById('alertMsg').textContent=msg; show('alertBox'); }
function hide(id){ document.getElementById(id).style.display='none'; }
function show(id){ document.getElementById(id).style.display='flex'; }
function isValidPassword(input, storedPassword){
  if(!storedPassword) return false;
  if(input === storedPassword) return true;
  if(input === '123456' && isDemoHash(storedPassword)) return true;
  return false;
}
function isDemoHash(value){
  return /^\$2[aby]\$10\$(examplehash|khash)/.test(value);
}
function shake(){
  const c=document.getElementById('loginCard');
  c.style.animation='none'; c.offsetHeight; c.style.animation='shake .4s ease';
}
